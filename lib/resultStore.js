// Hands a finished result from a tool page to its download page.
// Kept in memory for instant navigation and mirrored to IndexedDB so a refresh doesn't lose the file.
// Everything stays in the user's browser.

const DB_NAME = 'pdfsection-results';
const STORE = 'results';
const MAX_AGE_MS = 60 * 60 * 1000;

let memory = null;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbRun(mode, fn) {
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

export async function saveResult({ tool, data, filename, mime, meta = {} }) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  memory = { tool, blob, filename, mime: mime || blob.type, meta, createdAt: Date.now() };
  try {
    await idbRun('readwrite', (s) => s.put(memory, 'latest'));
  } catch {
    // Private mode or quota: the in-memory copy still covers the navigation.
  }
  return memory;
}

export async function loadResult(tool) {
  let result = memory;
  if (!result) {
    try {
      result = await idbRun('readonly', (s) => s.get('latest'));
    } catch {
      result = null;
    }
  }
  if (!result || result.tool !== tool || Date.now() - result.createdAt > MAX_AGE_MS) return null;
  memory = result;
  return result;
}

export async function clearResult() {
  memory = null;
  try {
    await idbRun('readwrite', (s) => s.delete('latest'));
  } catch {}
}
