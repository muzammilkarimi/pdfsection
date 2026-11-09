import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assetChanges, attachAssets, designForFile, splitDesign, storeAsset, usedAssetIds } from '@/lib/designAssets';
import { DESIGN_VERSION, migrateDesign } from '@/lib/designMigrations';
import { createDesign, createImage, createText, parseDesign } from '@/lib/designModel';

const PHOTO = 'data:image/jpeg;base64,PHOTOPHOTOPHOTO';
const LOGO = 'data:image/png;base64,LOGOLOGOLOGO';

function designWithImages() {
  const design = createDesign({ w: 210, h: 297, unit: 'mm' });
  design.assets = { a1: PHOTO, a2: LOGO, unused: 'data:image/png;base64,LEFTOVER' };
  design.pages[0].elements = [createImage('a1'), createText(), createImage('a1', { x: 50 }), createImage('a2')];
  return design;
}

test('adding a new image stores it under the new id', () => {
  const { assets, assetId } = storeAsset({ a1: PHOTO }, LOGO, 'new');
  assert.equal(assetId, 'new');
  assert.deepEqual(assets, { a1: PHOTO, new: LOGO });
});

test('adding an image already there reuses it', () => {
  const before = { a1: PHOTO };
  const { assets, assetId } = storeAsset(before, PHOTO, 'new');
  assert.equal(assetId, 'a1');
  assert.equal(assets, before);
});

test('adding an image to a design with no images works', () => {
  assert.deepEqual(storeAsset(undefined, PHOTO, 'new').assets, { new: PHOTO });
});

test('used images are found across pages, once each', () => {
  assert.deepEqual([...usedAssetIds(designWithImages())].sort(), ['a1', 'a2']);
});

// The reason for this design: autosave must not rewrite the images.
test('the saved design record holds no image data', () => {
  const { record } = splitDesign(designWithImages());
  const stored = JSON.stringify(record);
  assert.ok(!stored.includes('PHOTO'));
  assert.ok(!stored.includes('LOGO'));
  assert.equal(record.assets, undefined);
});

test('each image in use is saved once, and leftovers are not saved', () => {
  const design = designWithImages();
  const { rows } = splitDesign(design);
  assert.deepEqual(rows.map((row) => row.id).sort(), ['a1', 'a2']);
  assert.ok(rows.every((row) => row.designId === design.id));
});

test('a save writes only new images and removes ones no longer used', () => {
  const rows = [{ id: 'a1', src: PHOTO }, { id: 'a2', src: LOGO }];
  assert.deepEqual(assetChanges(['a1', 'a2'], rows), { toAdd: [], toRemove: [] });
  assert.deepEqual(assetChanges(['a1'], rows), { toAdd: [rows[1]], toRemove: [] });
  assert.deepEqual(assetChanges(['a1', 'gone'], rows.slice(0, 1)), { toAdd: [], toRemove: ['gone'] });
  assert.deepEqual(assetChanges([], rows).toAdd, rows);
});

test('a save never removes an image the design still shows, even if it is not in memory', () => {
  const design = createDesign({ w: 100, h: 100, unit: 'mm' });
  design.assets = {};
  design.pages[0].elements = [createImage('a1')];
  const { rows, usedIds } = splitDesign(design);
  assert.deepEqual(rows, []);
  assert.deepEqual(assetChanges(['a1', 'gone'], rows, usedIds), { toAdd: [], toRemove: ['gone'] });
});

test('stored images come back even if the design is still marked format 1', () => {
  const record = { v: 1, id: 'mixed', pages: [{ id: 'p', elements: [{ id: 'e', type: 'image', assetId: 'a1' }] }] };
  const [loaded] = attachAssets([record], [{ designId: 'mixed', id: 'a1', src: PHOTO }]);
  const upgraded = migrateDesign(loaded);
  assert.equal(upgraded.v, DESIGN_VERSION);
  assert.equal(upgraded.assets.a1, PHOTO);
  assert.equal(upgraded.pages[0].elements[0].assetId, 'a1');
});

test('upgrading keeps images already in the list, and old images get ids that do not clash', () => {
  const upgraded = migrateDesign({
    v: 1,
    assets: { img1: PHOTO },
    pages: [{ elements: [{ id: 'x', type: 'image', assetId: 'img1' }, { id: 'y', type: 'image', src: LOGO }] }],
  });
  const [x, y] = upgraded.pages[0].elements;
  assert.equal(upgraded.assets[x.assetId], PHOTO);
  assert.equal(upgraded.assets[y.assetId], LOGO);
  assert.notEqual(x.assetId, y.assetId);
});

test('stored images return to the right designs', () => {
  const rows = [{ designId: 'one', id: 'a1', src: PHOTO }, { designId: 'two', id: 'a1', src: LOGO }];
  const [one, two, empty] = attachAssets([{ v: 2, id: 'one' }, { v: 2, id: 'two' }, { v: 2, id: 'three' }], rows);
  assert.deepEqual(one.assets, { a1: PHOTO });
  assert.deepEqual(two.assets, { a1: LOGO });
  assert.deepEqual(empty.assets, {});
});

test('saving and loading gives the same design back', () => {
  const design = designWithImages();
  const { record, rows } = splitDesign(design);
  const [loaded] = attachAssets([record], rows);
  assert.deepEqual(loaded.pages, design.pages);
  assert.deepEqual(loaded.assets, { a1: PHOTO, a2: LOGO });
});

test('a format 1 draft keeps its images through loading, and is upgraded', () => {
  const draft = { v: 1, id: 'old', savedAt: 5, pages: [{ id: 'p', elements: [{ id: 'e', type: 'image', src: PHOTO }] }] };
  const [attached] = attachAssets([draft], []);
  assert.equal(attached, draft);
  const upgraded = migrateDesign(attached);
  assert.equal(upgraded.id, 'old');
  assert.equal(upgraded.savedAt, 5);
  assert.equal(upgraded.assets[upgraded.pages[0].elements[0].assetId], PHOTO);
});

test('upgrading a format 1 design keeps each repeated image once', () => {
  const upgraded = migrateDesign({
    v: 1,
    pages: [
      { elements: [{ id: 'x', type: 'image', src: PHOTO, w: 10 }, { id: 'y', type: 'image', src: LOGO }] },
      { elements: [{ id: 'z', type: 'image', src: PHOTO }, { id: 't', type: 'text', text: 'hi' }] },
    ],
  });
  assert.equal(upgraded.v, DESIGN_VERSION);
  assert.equal(Object.keys(upgraded.assets).length, 2);
  const [[x, y], [z, t]] = upgraded.pages.map((p) => p.elements);
  assert.equal(x.assetId, z.assetId);
  assert.notEqual(x.assetId, y.assetId);
  assert.equal(upgraded.assets[x.assetId], PHOTO);
  assert.equal(x.src, undefined);
  assert.equal(x.w, 10);
  assert.equal(t.text, 'hi');
});

test('the same format 1 draft upgrades to the same ids each time', () => {
  const draft = { v: 1, pages: [{ elements: [{ id: 'x', type: 'image', src: PHOTO }] }] };
  assert.deepEqual(migrateDesign(draft), migrateDesign(draft));
});

test('a downloaded file holds every image in use, and opens with them', () => {
  const design = { ...designWithImages(), savedAt: 123 };
  const file = JSON.parse(JSON.stringify(designForFile(design)));
  assert.equal(file.savedAt, undefined);
  assert.deepEqual(Object.keys(file.assets).sort(), ['a1', 'a2']);

  const opened = parseDesign(file);
  assert.equal(opened.pages[0].elements.length, 4);
  const [first, , , last] = opened.pages[0].elements;
  assert.equal(opened.assets[first.assetId], PHOTO);
  assert.equal(opened.assets[last.assetId], LOGO);
});

test('opening a file drops unsafe images and images that are missing or unused', () => {
  const file = JSON.parse(JSON.stringify(createDesign({ w: 100, h: 100, unit: 'mm' })));
  file.assets = {
    good: PHOTO,
    unused: LOGO,
    svg: 'data:image/svg+xml;base64,AAAA',
    remote: 'https://example.com/tracker.png',
    script: 'javascript:alert(1)',
    'bad id!': PHOTO,
    number: 5,
  };
  file.pages[0].elements = ['good', 'svg', 'remote', 'script', 'bad id!', 'number', 'missing', 'constructor', '__proto__'].map((assetId) => createImage(assetId));
  const opened = parseDesign(file);
  assert.deepEqual(opened.pages[0].elements.map((el) => el.assetId), ['good']);
  assert.deepEqual(Object.keys(opened.assets), ['good']);
});

test('opening a file survives a broken list of images', () => {
  for (const assets of [undefined, null, 'text', 7, []]) {
    const file = JSON.parse(JSON.stringify(createDesign({ w: 100, h: 100, unit: 'mm' })));
    file.assets = assets;
    file.pages[0].elements = [createImage('a1')];
    assert.deepEqual(parseDesign(file).pages[0].elements, []);
  }
});
