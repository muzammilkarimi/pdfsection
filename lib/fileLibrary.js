// Recent finished files, kept in this browser's IndexedDB for the Files page.
// Nothing here leaves the device. Turned off and cleared from Settings.
import { getPref } from '@/lib/preferences';

const DB_NAME = 'pdfsection-library';
const STORE = 'files';
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_FILES = 50;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

// Drops files past the keep period, and the oldest ones beyond MAX_FILES.
async function prune() {
  const all = (await run('readonly', (s) => s.getAll())) || [];
  const cutoff = Date.now() - getPref('keepDays') * DAY_MS;
  const newestFirst = [...all].sort((a, b) => b.createdAt - a.createdAt);
  const stale = newestFirst.filter((entry, index) => entry.createdAt < cutoff || index >= MAX_FILES);
  if (stale.length) {
    await run('readwrite', (s) => {
      stale.forEach((entry) => s.delete(entry.id));
    });
  }
  return newestFirst.filter((entry) => !stale.includes(entry));
}

export async function addToLibrary({ tool, blob, filename, mime, meta = {} }) {
  if (!getPref('rememberFiles')) return;
  await run('readwrite', (s) => s.add({ tool, blob, filename, mime, meta, size: blob.size, createdAt: Date.now() }));
  await prune();
}

export async function listLibrary() {
  return prune();
}

export async function deleteFromLibrary(id) {
  await run('readwrite', (s) => s.delete(id));
}

export async function clearLibrary() {
  await run('readwrite', (s) => s.clear());
}
