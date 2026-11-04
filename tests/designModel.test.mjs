import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INCH,
  PAGE_PRESETS,
  clonePage,
  createDesign,
  createImage,
  createShape,
  createText,
  effectiveStyle,
  fromUnit,
  parseDesign,
  resizeDesign,
  shapePath,
  textCss,
  toUnit,
} from '@/lib/designModel';

const near = (actual, expected, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be close to ${expected}`);

const designWith = (elements, size = { w: 210, h: 297, unit: 'mm' }) => {
  const design = createDesign(size);
  design.pages[0].elements = elements;
  return design;
};

test('units convert to points and back', () => {
  near(fromUnit(25.4, 'mm'), 72);
  near(fromUnit(1, 'in'), INCH);
  near(fromUnit(1080, 'px'), 810);
  for (const unit of ['mm', 'in', 'px']) near(toUnit(fromUnit(123.4, unit), unit), 123.4);
});

test('every page preset creates a page of the advertised size', () => {
  for (const preset of PAGE_PRESETS) {
    const design = createDesign(preset);
    near(design.width, fromUnit(preset.w, preset.unit));
    near(design.height, fromUnit(preset.h, preset.unit));
    assert.equal(design.pages.length, 1);
    assert.equal(design.v, 1);
  }
});

test('shape paths are valid for every kind and size', () => {
  for (const kind of ['rect', 'rounded', 'ellipse', 'triangle', 'star', 'line', 'arrow']) {
    for (const [w, h] of [[140, 140], [300, 40], [1, 1]]) {
      const path = shapePath(createShape(kind, { w, h }));
      assert.match(path, /^M/, `${kind} starts with a move`);
      assert.doesNotMatch(path, /NaN|Infinity|undefined/, `${kind} at ${w}x${h}`);
    }
  }
});

test('a line runs across the middle of its box', () => {
  assert.equal(shapePath(createShape('line', { w: 200, h: 12 })), 'M0 6L200 6');
});

test('a corner radius larger than the shape is limited, and no radius gives a plain rectangle', () => {
  const huge = shapePath(createShape('rounded', { w: 100, h: 40, radius: 500 }));
  assert.match(huge, /^M20 0L80 0C/);
  assert.equal(shapePath(createShape('rounded', { w: 10, h: 10, radius: 0 })), 'M0 0L10 0L10 10L0 10Z');
});

test('bold and italic only apply when the font has them', () => {
  assert.deepEqual(effectiveStyle(createText({ font: 'Inter', bold: true, italic: true })), { bold: true, italic: true });
  assert.deepEqual(effectiveStyle(createText({ font: 'Bebas Neue', bold: true, italic: true })), { bold: false, italic: false });
  assert.deepEqual(effectiveStyle(createText({ font: 'Oswald', bold: true, italic: true })), { bold: true, italic: false });
});

test('text styles keep kerning off, so screen wrapping matches the PDF', () => {
  const css = textCss(createText({ font: 'Inter', bold: true, size: 20 }));
  assert.equal(css.fontKerning, 'none');
  assert.equal(css.fontWeight, 700);
  assert.equal(css.fontSize, 20);
});

test('resizing to the same size changes nothing', () => {
  const box = createShape('rect', { x: 10, y: 20, w: 100, h: 50 });
  const design = designWith([box]);
  const [same] = resizeDesign(design, design.width, design.height, 'mm').pages[0].elements;
  near(same.x, 10);
  near(same.y, 20);
  near(same.w, 100);
  near(same.h, 50);
});

test('doubling the page doubles sizes and positions', () => {
  const text = createText({ x: 100, y: 100, w: 200, h: 40, size: 24, letterSpacing: 2 });
  const shape = createShape('rounded', { x: 50, y: 50, w: 100, h: 100, strokeWidth: 3, radius: 10 });
  const design = designWith([text, shape]);
  const resized = resizeDesign(design, design.width * 2, design.height * 2, 'mm');
  const [bigText, bigShape] = resized.pages[0].elements;

  near(resized.width, design.width * 2);
  near(bigText.x, 200);
  near(bigText.w, 400);
  near(bigText.size, 48);
  near(bigText.letterSpacing, 4);
  near(bigShape.strokeWidth, 6);
  near(bigShape.radius, 20);
});

test('a line keeps its box height when resized', () => {
  const line = createShape('line', { x: 0, y: 0, w: 100, h: 12, strokeWidth: 2 });
  const design = designWith([line]);
  const [big] = resizeDesign(design, design.width * 2, design.height * 2, 'mm').pages[0].elements;
  near(big.w, 200);
  near(big.h, 12);
  near(big.strokeWidth, 4);
});

test('resizing leaves the original design untouched', () => {
  const design = designWith([createText({ x: 10, size: 24 })]);
  const snapshot = JSON.stringify(design);
  resizeDesign(design, 100, 100, 'mm');
  assert.equal(JSON.stringify(design), snapshot);
});

test('page clones get new ids and share nothing', () => {
  const page = designWith([createText()]).pages[0];
  const copy = clonePage(page);
  assert.notEqual(copy.id, page.id);
  assert.notEqual(copy.elements[0].id, page.elements[0].id);
  copy.elements[0].text = 'changed';
  assert.notEqual(page.elements[0].text, 'changed');
});

// Opening a design file: these files come from outside the app, so nothing in them is trusted.

test('files that are not designs are rejected', () => {
  const valid = JSON.parse(JSON.stringify(designWith([])));
  for (const bad of [null, {}, 'text', { ...valid, v: 0 }, { ...valid, v: '1' }, { ...valid, pages: [] }, { ...valid, pages: 'x' }, { ...valid, width: 0 }, { ...valid, height: -5 }]) {
    assert.throws(() => parseDesign(bad), /Not a PDF Section design file/);
  }
});

test('opening a file gives new ids', () => {
  const design = designWith([createText()]);
  const opened = parseDesign(JSON.parse(JSON.stringify(design)));
  assert.notEqual(opened.id, design.id);
  assert.notEqual(opened.pages[0].id, design.pages[0].id);
  assert.notEqual(opened.pages[0].elements[0].id, design.pages[0].elements[0].id);
});

test('unknown element types and shapes are dropped', () => {
  const opened = parseDesign(JSON.parse(JSON.stringify(designWith([
    createText({ text: 'kept' }),
    { type: 'video', src: 'x' },
    { type: 'shape', kind: 'blob' },
    null,
  ]))));
  assert.equal(opened.pages[0].elements.length, 1);
  assert.equal(opened.pages[0].elements[0].text, 'kept');
});

test('only embedded PNG and JPEG images are accepted', () => {
  const load = (src) => parseDesign(JSON.parse(JSON.stringify(designWith([createImage(src)])))).pages[0].elements.length;
  assert.equal(load('data:image/png;base64,AAAA'), 1);
  assert.equal(load('data:image/jpeg;base64,AAAA'), 1);
  assert.equal(load('data:image/svg+xml;base64,AAAA'), 0);
  assert.equal(load('https://example.com/tracker.png'), 0);
  assert.equal(load('javascript:alert(1)'), 0);
});

test('bad values fall back to safe ones', () => {
  const raw = JSON.parse(JSON.stringify(designWith([])));
  raw.name = 'x'.repeat(500);
  raw.unit = 'furlong';
  raw.pages[0].background = 'url(evil)';
  raw.pages[0].elements = [{
    type: 'text', text: 5, font: 'No such font', size: -3, opacity: 7, color: 'red', align: 'sideways', lineHeight: 0, w: -10, h: 'tall', x: 'left',
  }];
  const opened = parseDesign(raw);
  const [el] = opened.pages[0].elements;

  assert.equal(opened.name.length, 120);
  assert.equal(opened.unit, 'mm');
  assert.equal(opened.pages[0].background, '#ffffff');
  assert.equal(el.text, '5');
  assert.equal(el.font, 'Inter');
  assert.equal(el.size, 1);
  assert.equal(el.opacity, 1);
  assert.equal(el.color, '#141320');
  assert.equal(el.align, 'left');
  assert.equal(el.lineHeight, 0.5);
  assert.equal(el.w, 1);
  assert.equal(el.h, 100);
  assert.equal(el.x, 0);
});

test('a shape with no fill or border keeps it after saving and opening', () => {
  const [shape] = parseDesign(JSON.parse(JSON.stringify(designWith([
    createShape('rect', { fill: null, stroke: null }),
  ])))).pages[0].elements;
  assert.equal(shape.fill, null);
  assert.equal(shape.stroke, null);
});
