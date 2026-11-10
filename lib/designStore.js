// Autosaved Create PDF designs, kept in this browser's IndexedDB. Nothing here leaves the device.
// A design and its images are always written in one transaction, so a failed save changes nothing.

import { assetChanges, attachAssets, splitDesign } from '@/lib/designAssets';
import { migrateSavedDesigns } from '@/lib/designMigrations';

const DB_NAME = 'pdfsection-designs';
const DESIGNS = 'designs';
const ASSETS = 'assets';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DESIGNS)) db.createObjectStore(DESIGNS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(ASSETS)) db.createObjectStore(ASSETS, { keyPath: ['designId', 'id'] });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Runs `work` in a transaction. What it returns is called once the transaction has finished. */
async function transact(mode, work) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([DESIGNS, ASSETS], mode);
      const finish = work(tx.objectStore(DESIGNS), tx.objectStore(ASSETS));
      tx.oncomplete = () => resolve(finish?.());
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Every stored image of one design: an array key sorts after any string, so this covers them all. */
const assetsOf = (designId) => IDBKeyRange.bound([designId], [designId, []]);

export function saveDesign(design) {
  const { record, rows, usedIds } = splitDesign(design);
  return transact('readwrite', (designs, assets) => {
    const stored = assets.getAllKeys(assetsOf(design.id));
    stored.onsuccess = () => {
      const { toAdd, toRemove } = assetChanges(stored.result.map((key) => key[1]), rows, usedIds);
      toAdd.forEach((row) => assets.put(row));
      toRemove.forEach((id) => assets.delete([design.id, id]));
      designs.put({ ...record, savedAt: Date.now() });
    };
  });
}

export const deleteDesign = (id) => transact('readwrite', (designs, assets) => {
  designs.delete(id);
  assets.delete(assetsOf(id));
});

/** One saved design in the current format, or null if it isn't there or can't be opened. */
export async function getDesign(id) {
  const [record, rows] = await transact('readonly', (designs, assets) => {
    const oneDesign = designs.get(id);
    const itsAssets = assets.getAll(assetsOf(id));
    return () => [oneDesign.result, itsAssets.result || []];
  });
  if (!record) return null;
  return migrateSavedDesigns(attachAssets([record], rows))[0] ?? null;
}

/** Saved designs in the current format, most recently edited first. */
export async function listDesigns() {
  const [records, rows] = await transact('readonly', (designs, assets) => {
    const allDesigns = designs.getAll();
    const allAssets = assets.getAll();
    return () => [allDesigns.result || [], allAssets.result || []];
  });
  return migrateSavedDesigns(attachAssets(records, rows)).sort((a, b) => b.savedAt - a.savedAt);
}
