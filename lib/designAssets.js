// Images in a design are kept once, in design.assets ({ id: data URL }), and elements point to them
// with assetId. Saving stores them apart from the design, so autosave only writes new images.
// No browser here: lib/designStore.js does the actual saving.

/** Adds an image, reusing the one already there if it's identical. */
export function storeAsset(assets, src, newId) {
  const existing = Object.keys(assets || {}).find((id) => assets[id] === src);
  if (existing) return { assets, assetId: existing };
  return { assets: { ...assets, [newId]: src }, assetId: newId };
}

/** Ids of the images actually on a page. Undo can leave others in design.assets. */
export function usedAssetIds(design) {
  const used = new Set();
  for (const page of design.pages) {
    for (const el of page.elements) if (el.type === 'image') used.add(el.assetId);
  }
  return used;
}

function usedAssets(design) {
  const assets = {};
  for (const id of usedAssetIds(design)) {
    if (design.assets?.[id]) assets[id] = design.assets[id];
  }
  return assets;
}

/** The design as one self-contained file, for "Save editable copy". */
export function designForFile(design) {
  const { savedAt: _savedAt, ...clean } = design;
  return { ...clean, assets: usedAssets(design) };
}

/** Separates a design into its record, with no image data, and one row per image in use. */
export function splitDesign(design) {
  const { assets: _assets, ...record } = design;
  const rows = Object.entries(usedAssets(design)).map(([id, src]) => ({ designId: design.id, id, src }));
  return { record, rows, usedIds: [...usedAssetIds(design)] };
}

/**
 * What a save has to do, given the ids already stored for this design. Stored images never change.
 * An image is only removed once no element points to it, even if its data isn't in memory right
 * now: a save must never be able to destroy an image the design still shows.
 */
export function assetChanges(storedIds, rows, usedIds = rows.map((row) => row.id)) {
  const stored = new Set(storedIds);
  const used = new Set(usedIds);
  return {
    toAdd: rows.filter((row) => !stored.has(row.id)),
    toRemove: storedIds.filter((id) => !used.has(id)),
  };
}

/** Puts stored images back into their designs, whatever format the design is marked as. */
export function attachAssets(records, rows) {
  return records.map((record) => {
    const own = rows.filter((row) => row.designId === record.id);
    if (record.v < 2 && !own.length) return record; // a format 1 draft holds its own images
    const assets = { ...record.assets };
    for (const row of own) assets[row.id] = row.src;
    return { ...record, assets };
  });
}
