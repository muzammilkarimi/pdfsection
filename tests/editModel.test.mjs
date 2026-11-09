import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRotation, visiblePageIndices, stepPage, pageAfterDelete,
  emptyDoc, patchElement, removeElement, rotatePage, deletePage, countEdits, updatePageElements,
  createHistory, commit, replace, undo, redo,
  toBaseFraction, viewTransform, applyMatrix,
  elementBounds, moveElement, applyDrag, offsetCopy, snapLineEnd, strokePath, addStrokePoint,
} from '@/lib/editModel';

const near = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be close to ${expected}`);

test('rotations snap to quarter turns in 0..270', () => {
  assert.equal(normalizeRotation(-90), 270);
  assert.equal(normalizeRotation(450), 90);
  assert.equal(normalizeRotation(360), 0);
  assert.equal(normalizeRotation(undefined), 0);
});

test('page navigation skips deleted pages', () => {
  assert.deepEqual(visiblePageIndices(5, [1, 3]), [0, 2, 4]);
  assert.equal(stepPage(0, 1, 5, [1, 2]), 3);
  assert.equal(stepPage(3, -1, 5, [1, 2]), 0);
  assert.equal(stepPage(4, 1, 5, []), 4, 'stays put at the end');
});

test('after deleting a page you land on the next page, or the previous one at the end', () => {
  assert.equal(pageAfterDelete(1, 4, [1]), 2);
  assert.equal(pageAfterDelete(3, 4, [3]), 2);
  assert.equal(pageAfterDelete(3, 4, [2, 3]), 1);
  assert.equal(pageAfterDelete(2, 4, [1]), 2, 'a page that is still there stays current');
});

test('document edits are immutable and leave other pages alone', () => {
  const doc = updatePageElements(emptyDoc(), 0, () => [{ id: 'a', type: 'text', x: 0, y: 0, width: 0.1, height: 0.1 }]);
  const moved = patchElement(doc, 0, 'a', { x: 0.5 });
  assert.equal(doc.elements[0][0].x, 0);
  assert.equal(moved.elements[0][0].x, 0.5);
  assert.equal(removeElement(moved, 0, 'missing'), moved, 'removing nothing returns the same doc');
});

test('deleting an edited paragraph keeps its cover box', () => {
  const doc = updatePageElements(emptyDoc(), 0, () => [
    { id: 'cover', type: 'erase', linkedTo: 'txt' },
    { id: 'txt', type: 'text' },
  ]);
  const after = removeElement(doc, 0, 'txt');
  assert.deepEqual(after.elements[0].map((el) => el.id), ['cover']);
  assert.equal(countEdits(doc), 1, 'the cover box is not counted as its own edit');
});

test('page rotation and deletion are part of the document', () => {
  let doc = rotatePage(emptyDoc(), 2);
  doc = rotatePage(doc, 2);
  doc = rotatePage(doc, 2, -90);
  assert.equal(doc.rotations[2], 90);
  doc = deletePage(doc, 1);
  assert.equal(deletePage(doc, 1), doc, 'deleting twice is a no-op');
  assert.deepEqual(doc.deleted, [1]);
});

test('undo and redo walk the history, and a new edit clears redo', () => {
  let h = createHistory('a');
  h = commit(h, 'b');
  h = commit(h, 'c');
  h = undo(h);
  assert.equal(h.present, 'b');
  h = redo(h);
  assert.equal(h.present, 'c');
  h = undo(undo(h));
  assert.equal(h.present, 'a');
  assert.equal(undo(h), h, 'nothing left to undo');
  h = commit(h, 'd');
  assert.deepEqual(h.future, []);
});

test('replace changes the present without adding an undo step', () => {
  let h = commit(createHistory('a'), 'b');
  h = replace(h, 'b2');
  h = replace(h, 'b3');
  assert.equal(h.past.length, 1);
  assert.equal(undo(h).present, 'a', 'one undo reverts the whole drag');
});

test('history keeps references, so image bytes survive undo', () => {
  const bytes = new Uint8Array([1, 2, 3]).buffer;
  const doc = updatePageElements(emptyDoc(), 0, () => [{ id: 'img', type: 'image', bytes }]);
  let h = commit(createHistory(emptyDoc()), doc);
  h = commit(h, patchElement(doc, 0, 'img', { x: 0.2 }));
  h = undo(h);
  assert.equal(h.present.elements[0][0].bytes, bytes);
});

test('history is capped', () => {
  let h = createHistory(0);
  for (let i = 1; i <= 10; i++) h = commit(h, i, 4);
  assert.equal(h.past.length, 4);
  assert.deepEqual(h.past, [6, 7, 8, 9]);
});

test('screen points on a rotated page map back to the base page', () => {
  // top-left of a page turned 90° clockwise was the base bottom-left
  assert.deepEqual(toBaseFraction(0, 0, 90), { x: 0, y: 1 });
  assert.deepEqual(toBaseFraction(1, 0, 90), { x: 0, y: 0 });
  assert.deepEqual(toBaseFraction(0.25, 0.75, 180), { x: 0.75, y: 0.25 });
  assert.deepEqual(toBaseFraction(0, 0, 270), { x: 1, y: 0 });
  for (const r of [0, 90, 180, 270]) {
    // the centre never moves
    assert.deepEqual(toBaseFraction(0.5, 0.5, r), { x: 0.5, y: 0.5 });
  }
});

test('view transform: drawing in view space lands in the right corner of the PDF page', () => {
  const box = { x: 10, y: 20, width: 600, height: 800 };
  // view top-left (0, viewH) should be the visible top-left corner after the viewer applies /Rotate
  const cases = {
    0: { viewW: 600, viewH: 800, topLeft: { x: 10, y: 820 } },
    // /Rotate 90 turns the page clockwise for display, so the visible top-left is user-space bottom-left
    90: { viewW: 800, viewH: 600, topLeft: { x: 10, y: 20 } },
    180: { viewW: 600, viewH: 800, topLeft: { x: 610, y: 20 } },
    270: { viewW: 800, viewH: 600, topLeft: { x: 610, y: 820 } },
  };
  for (const [rot, want] of Object.entries(cases)) {
    const t = viewTransform(Number(rot), box);
    assert.equal(t.width, want.viewW, `width at ${rot}`);
    assert.equal(t.height, want.viewH, `height at ${rot}`);
    assert.deepEqual(applyMatrix(t.matrix, 0, t.height), want.topLeft, `top-left at ${rot}`);
    // the opposite corner stays inside the box
    const br = applyMatrix(t.matrix, t.width, 0);
    assert.ok(br.x >= 10 && br.x <= 610 && br.y >= 20 && br.y <= 820, `bottom-right inside at ${rot}`);
  }
});

test('view transform keeps text upright: view x-axis points right after display rotation', () => {
  // For /Rotate 90 the viewer turns the page clockwise; a vector pointing "up" in user space ends up
  // pointing right on screen. The view x-axis must therefore map to user-space up (0, 1).
  const [a, b] = viewTransform(90, { x: 0, y: 0, width: 600, height: 800 }).matrix;
  assert.deepEqual([a, b], [0, 1]);
});

test('bounds cover lines drawn in any direction and freehand strokes', () => {
  const line = { type: 'shape-line', x1: 0.8, y1: 0.2, x2: 0.3, y2: 0.6 };
  const b = elementBounds(line);
  near(b.x, 0.3); near(b.y, 0.2); near(b.width, 0.5); near(b.height, 0.4);
  const stroke = { type: 'draw', points: [[0.1, 0.5], [0.4, 0.2], [0.2, 0.9]] };
  const s = elementBounds(stroke);
  near(s.x, 0.1); near(s.width, 0.3); near(s.y, 0.2); near(s.height, 0.7);
});

test('moving keeps every kind of element on the page', () => {
  const box = moveElement({ type: 'shape-rect', x: 0.8, y: 0.1, width: 0.15, height: 0.1 }, 0.5, -0.5);
  near(box.x, 0.85); near(box.y, 0);
  const line = moveElement({ type: 'shape-line', x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.3 }, -0.3, 0);
  near(line.x1, 0); near(line.x2, 0.4);
  const stroke = moveElement({ type: 'draw', points: [[0.9, 0.5], [0.95, 0.6]] }, 0.2, 0);
  near(stroke.points[1][0], 1);
});

test('resizing a text box changes its width, not its font size', () => {
  const t = applyDrag({ type: 'text', x: 0.1, y: 0.1, width: 0.3, height: 0.05, size: 12 }, 'resize', 0.2, 0.1);
  near(t.width, 0.5);
  assert.equal(t.size, 12);
});

test('resizing an image keeps its proportions and stays on the page', () => {
  const pageAspect = 600 / 800;
  const img = { type: 'image', x: 0.5, y: 0.5, width: 0.2, height: (0.2 * pageAspect) / 2, aspect: 2 };
  const r = applyDrag(img, 'resize', 0.1, 0, pageAspect);
  near(r.width, 0.3);
  near((r.width * 600) / (r.height * 800), 2, 1e-9);
  const huge = applyDrag(img, 'resize', 5, 0, pageAspect);
  assert.ok(huge.x + huge.width <= 1 + 1e-9 && huge.y + huge.height <= 1 + 1e-9);
});

test('line ends can be dragged independently', () => {
  const line = { type: 'shape-line', x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.5 };
  const r = applyDrag(line, 'p2', 0.2, -0.3);
  assert.deepEqual([r.x1, r.y1], [0.1, 0.1]);
  near(r.x2, 0.7); near(r.y2, 0.2);
});

test('a duplicate is offset but stays on the page', () => {
  const c = offsetCopy({ id: 'a', type: 'shape-rect', x: 0.9, y: 0.1, width: 0.1, height: 0.1 }, 'b');
  assert.equal(c.id, 'b');
  assert.ok(c.x < 0.9, 'shifted left because there is no room on the right');
  near(c.y, 0.12);
});

test('shift-drag snaps a line to 45° steps', () => {
  const end = snapLineEnd({ x: 0.5, y: 0.5 }, { x: 0.8, y: 0.52 }, 1);
  near(end.y, 0.5, 1e-9);
  const diag = snapLineEnd({ x: 0.2, y: 0.2 }, { x: 0.41, y: 0.39 }, 1);
  near(diag.x - 0.2, diag.y - 0.2, 1e-9);
});

test('freehand paths are smooth curves in points', () => {
  assert.equal(strokePath([], 100, 100), '');
  assert.equal(strokePath([[0, 0], [1, 1]], 100, 200), 'M0 0 L100 200');
  const d = strokePath([[0, 0], [0.5, 0.5], [1, 0]], 100, 100);
  assert.match(d, /^M0 0 Q50 50 75 25 L100 0$/);
});

test('freehand points closer than the threshold are dropped', () => {
  let pts = addStrokePoint([], [0.5, 0.5]);
  pts = addStrokePoint(pts, [0.5001, 0.5]);
  assert.equal(pts.length, 1);
  pts = addStrokePoint(pts, [0.52, 0.5]);
  assert.equal(pts.length, 2);
});

import { arrowHead } from '@/lib/editModel';

test('arrowheads point back along the line and grow with the line width', () => {
  const [a, b] = arrowHead(0, 0, 100, 0, 2);
  assert.ok(a[0] < 100 && b[0] < 100, 'behind the tip');
  near(a[1], -b[1], 1e-9);
  const thick = arrowHead(0, 0, 100, 0, 6);
  assert.ok(100 - thick[0][0] > 100 - a[0], 'thicker line, longer head');
  const short = arrowHead(0, 0, 4, 0, 6);
  assert.ok(4 - short[0][0] <= 2 + 1e-9, 'never longer than half the line');
});

test('marks keep their square shape when resized', () => {
  const pageAspect = 600 / 800;
  const mark = { type: 'mark', x: 0.1, y: 0.1, width: 0.04, height: 0.04 * pageAspect, aspect: 1 };
  const r = applyDrag(mark, 'resize', 0.04, 0.3, pageAspect);
  near((r.width * 600) / (r.height * 800), 1, 1e-9);
});

test('a box can be resized from every side and corner; the opposite side stays put', () => {
  const box = { type: 'shape-rect', x: 0.2, y: 0.2, width: 0.4, height: 0.3 };
  const w = applyDrag(box, 'resize-w', -0.1, 0.5);
  near(w.x, 0.1); near(w.width, 0.5); near(w.y, 0.2); near(w.height, 0.3);
  const n = applyDrag(box, 'resize-n', 0.3, 0.1);
  near(n.y, 0.3); near(n.height, 0.2); near(n.x, 0.2); near(n.width, 0.4);
  const nw = applyDrag(box, 'resize-nw', 0.1, 0.1);
  near(nw.x + nw.width, 0.6); near(nw.y + nw.height, 0.5);
  // dragging past the opposite side stops at the minimum size, not a flipped box
  const tiny = applyDrag(box, 'resize-e', -1, 0);
  assert.ok(tiny.width > 0 && tiny.x === 0.2);
  // and never off the page
  const big = applyDrag(box, 'resize-sw', -1, 1);
  near(big.x, 0); assert.ok(big.y + big.height <= 1 + 1e-9);
});

test('an image dragged by its top-left corner keeps its shape and its bottom-right corner', () => {
  const pageAspect = 600 / 800;
  const img = { type: 'image', x: 0.4, y: 0.4, width: 0.2, height: (0.2 * pageAspect) / 2, aspect: 2 };
  const r = applyDrag(img, 'resize-nw', -0.1, 0, pageAspect);
  near(r.width, 0.3);
  near(r.x + r.width, 0.6); near(r.y + r.height, img.y + img.height);
  near((r.width * 600) / (r.height * 800), 2, 1e-9);
});

test('a freehand stroke stretches into the resized box', () => {
  const stroke = { type: 'draw', points: [[0.1, 0.1], [0.3, 0.2]] };
  const r = applyDrag(stroke, 'resize-e', 0.2, 0);
  near(r.points[0][0], 0.1); near(r.points[1][0], 0.5); near(r.points[1][1], 0.2);
});

import { markPristine, isPristine, withoutPristine } from '@/lib/editModel';

test('an opened line counts as untouched until its text, style or place changes', () => {
  const text = markPristine({ id: 't', type: 'text', text: 'Hello', x: 0.1, y: 0.1, size: 12 });
  const cover = { id: 'c', type: 'erase', linkedTo: 't', x: 0.1, y: 0.1, width: 0.2, height: 0.02 };
  assert.ok(isPristine(text));
  assert.deepEqual(withoutPristine([cover, text]), []);
  assert.ok(!isPristine({ ...text, text: 'Hello!' }));
  assert.ok(!isPristine({ ...text, x: 0.2 }));
  assert.ok(!isPristine({ ...text, color: '#ff0000' }));
  const typed = { ...text, text: 'Hi' };
  assert.deepEqual(withoutPristine([cover, typed]), [cover, typed]);
  assert.ok(!isPristine({ id: 'x', type: 'text', text: 'new box' }));
});

test('dragging a text box corner scales the text and keeps the opposite corner', () => {
  const t = { type: 'text', x: 0.2, y: 0.2, width: 0.4, size: 10, charSpacing: 0.5, spans: [{ text: 'a', size: 10 }, { text: 'b' }] };
  const box = { x: 0.2, y: 0.2, width: 0.4, height: 0.1 };
  const big = applyDrag(t, 'resize-se', 0.2, 0, 612 / 792, box);
  assert.equal(big.size, 15);
  near(big.width, 0.6); near(big.charSpacing, 0.75);
  assert.equal(big.spans[0].size, 15);
  assert.equal(big.spans[1].size, undefined);
  near(big.x, 0.2); near(big.y, 0.2);
  const small = applyDrag(t, 'resize-nw', 0.2, 0.05, 612 / 792, box);
  assert.equal(small.size, 5);
  near(small.x, 0.4); near(small.y, 0.25);
  // a side handle only changes the width
  const wide = applyDrag(t, 'resize-w', -0.1, 0, 612 / 792, box);
  assert.equal(wide.size, 10); near(wide.x, 0.1); near(wide.width, 0.5);
  // never smaller than the minimum size
  assert.equal(applyDrag(t, 'resize-se', -0.39, 0, 612 / 792, box).size, 4);
});

test('dragging the side of a one-line edit turns it into a wrapping box', () => {
  const t = { type: 'text', x: 0.2, y: 0.2, width: 0.3, size: 10, oneLine: true };
  const r = applyDrag(t, 'resize-e', -0.1, 0, 612 / 792, { x: 0.2, y: 0.2, width: 0.4, height: 0.02 });
  assert.equal(r.oneLine, false);
  near(r.width, 0.3);
});
