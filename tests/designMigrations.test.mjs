import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DESIGN_VERSION, DesignTooNewError, migrateDesign, migrateSavedDesigns } from '@/lib/designMigrations';
import { parseDesign } from '@/lib/designModel';

// A pretend future format, so the upgrade path can be tested before any real upgrade exists.
const future = {
  version: 3,
  migrations: {
    1: (d) => ({ ...d, v: 2, steps: ['one-to-two'] }),
    2: (d) => ({ ...d, v: 3, steps: [...d.steps, 'two-to-three'] }),
  },
};

test('a design already in the current format comes back as it is', () => {
  const design = { v: DESIGN_VERSION, id: 'abc', pages: [] };
  assert.equal(migrateDesign(design), design);
});

test('an old design is upgraded one version at a time, in order', () => {
  const upgraded = migrateDesign({ v: 1, id: 'abc' }, future);
  assert.equal(upgraded.v, 3);
  assert.deepEqual(upgraded.steps, ['one-to-two', 'two-to-three']);
});

test('a design part way along only runs the remaining upgrades', () => {
  const upgraded = migrateDesign({ v: 2, id: 'abc', steps: ['earlier'] }, future);
  assert.deepEqual(upgraded.steps, ['earlier', 'two-to-three']);
});

test('upgrading keeps the id and leaves the original alone', () => {
  const original = { v: 1, id: 'abc' };
  assert.equal(migrateDesign(original, future).id, 'abc');
  assert.deepEqual(original, { v: 1, id: 'abc' });
});

test('a missing upgrade step fails rather than opening a half-converted design', () => {
  assert.throws(() => migrateDesign({ v: 1 }, { version: 3, migrations: {} }), /No upgrade from design format 1/);
});

test('every version below the current one has an upgrade', () => {
  for (let v = 1; v < DESIGN_VERSION; v++) {
    assert.equal(migrateDesign({ v, id: 'abc' }).v, DESIGN_VERSION);
  }
});

test('things that are not designs are rejected', () => {
  for (const bad of [null, undefined, {}, 'text', { v: 0 }, { v: -1 }, { v: 1.5 }, { v: '1' }]) {
    assert.throws(() => migrateDesign(bad), /Not a PDF Section design file/);
  }
});

test('a design from a newer version says so, in files too', () => {
  assert.throws(() => migrateDesign({ v: DESIGN_VERSION + 1 }), DesignTooNewError);
  assert.throws(() => parseDesign({ v: DESIGN_VERSION + 1, pages: [{}], width: 1, height: 1 }), /newer version of PDF Section/);
});

test('saved drafts are upgraded and keep their id and saved time', () => {
  const [draft] = migrateSavedDesigns([{ v: 1, id: 'draft', savedAt: 123 }], future);
  assert.equal(draft.v, 3);
  assert.equal(draft.id, 'draft');
  assert.equal(draft.savedAt, 123);
});

test('a draft that cannot be opened does not hide the others', () => {
  const list = [{ v: 1, id: 'good' }, { v: 99, id: 'too-new' }, { id: 'broken' }, null];
  assert.deepEqual(migrateSavedDesigns(list).map((d) => d.id), ['good']);
});

// Old files must keep opening forever. If this fails after a format change, add a migration:
// don't edit the sample file.
test('a file saved in format 1 still opens with all its content', () => {
  const file = JSON.parse(readFileSync('tests/fixtures/design-v1.pdfsection.json', 'utf8'));
  const opened = parseDesign(file);
  assert.equal(opened.v, DESIGN_VERSION);
  assert.equal(opened.name, 'Sample saved in format 1');
  assert.equal(opened.pages.length, 2);
  assert.equal(opened.pages[0].elements.length, 4);
  const [text, star, line, image] = opened.pages[0].elements;
  assert.equal(text.text, 'Heading\nनमस्ते दुनिया');
  assert.equal(text.font, 'Playfair Display');
  assert.equal(star.rotation, 30);
  assert.equal(star.locked, true);
  assert.equal(line.fill, null);
  assert.equal(image.rotation, -15);
  assert.equal(image.opacity, 0.8);
  assert.equal(opened.assets[image.assetId], file.pages[0].elements[3].src);
  assert.equal(opened.pages[1].background, '#ffffff');
});
