// Autosaved Create PDF designs, kept in this browser's IndexedDB. Nothing here leaves the device.

const DB_NAME = 'pdfsection-designs';
const STORE = 'designs';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
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

export const saveDesign = (design) => run('readwrite', (s) => s.put({ ...design, savedAt: Date.now() }));
export const deleteDesign = (id) => run('readwrite', (s) => s.delete(id));

/** Saved designs, most recently edited first. */
export async function listDesigns() {
  const all = (await run('readonly', (s) => s.getAll())) || [];
  return all.sort((a, b) => b.savedAt - a.savedAt);
}
