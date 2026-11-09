// Keeps old designs opening as the format changes. Every design records its format in `v`.
//
// To change the format: raise DESIGN_VERSION and add a step to MIGRATIONS that turns the previous
// version into the new one, e.g. { 1: (design) => ({ ...design, v: 2, ... }) }. Never edit or remove
// an existing step, and add a sample file of the old format to tests/fixtures.

export const DESIGN_VERSION = 2;

/** Format 1 kept a copy of each image inside its element. Format 2 keeps each once in design.assets. */
function moveImagesToAssets(design) {
  const assets = { ...design.assets };
  const idBySrc = new Map();
  let next = 1;
  const moveImage = (el) => {
    if (el?.type !== 'image' || typeof el.src !== 'string') return el;
    if (!idBySrc.has(el.src)) {
      while (assets[`img${next}`]) next++;
      const id = `img${next}`;
      idBySrc.set(el.src, id);
      assets[id] = el.src;
    }
    const { src: _src, ...rest } = el;
    return { ...rest, assetId: idBySrc.get(el.src) };
  };
  const pages = Array.isArray(design.pages)
    ? design.pages.map((page) => (Array.isArray(page?.elements) ? { ...page, elements: page.elements.map(moveImage) } : page))
    : design.pages;
  return { ...design, v: 2, assets, pages };
}

const MIGRATIONS = { 1: moveImagesToAssets };

/** The design was made by a newer version of the app than the one running, e.g. in an old tab. */
export class DesignTooNewError extends Error {
  constructor() {
    super('This design was made with a newer version of PDF Section. Reload this page and try again.');
    this.name = 'DesignTooNewError';
  }
}

/**
 * Upgrades a design to the current format, one version at a time. Keeps its ids and leaves the
 * original untouched. Throws if it isn't a design or is newer than this app.
 */
export function migrateDesign(raw, { version = DESIGN_VERSION, migrations = MIGRATIONS } = {}) {
  if (!raw || !Number.isInteger(raw.v) || raw.v < 1) throw new Error('Not a PDF Section design file');
  if (raw.v > version) throw new DesignTooNewError();
  let design = raw;
  while (design.v < version) {
    const step = migrations[design.v];
    if (!step) throw new Error(`No upgrade from design format ${design.v}`);
    design = step(design);
  }
  return design;
}

/** Upgrades drafts saved in this browser. One that can't be opened is left out, not lost: it stays stored. */
export function migrateSavedDesigns(list, options) {
  return list.flatMap((saved) => {
    try {
      return [migrateDesign(saved, options)];
    } catch {
      return [];
    }
  });
}
