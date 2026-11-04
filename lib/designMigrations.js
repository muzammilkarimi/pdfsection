// Keeps old designs opening as the format changes. Every design records its format in `v`.
//
// To change the format: raise DESIGN_VERSION and add a step to MIGRATIONS that turns the previous
// version into the new one, e.g. { 1: (design) => ({ ...design, v: 2, ... }) }. Never edit or remove
// an existing step, and add a sample file of the old format to tests/fixtures.

export const DESIGN_VERSION = 1;

const MIGRATIONS = {};

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
