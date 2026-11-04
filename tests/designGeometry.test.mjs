import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_SIZE, resizePatch, rotationFromPointer, snapBox } from '@/lib/designGeometry';

const near = (actual, expected, tolerance = 0.001) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be close to ${expected}`);

const box = (props = {}) => ({ type: 'shape', x: 100, y: 100, w: 100, h: 50, rotation: 0, ...props });

/** Where a corner of the element ends up on the page, allowing for rotation around its center. */
function cornerOnPage(el, hx, hy) {
  const rad = (el.rotation * Math.PI) / 180;
  const lx = (hx * el.w) / 2;
  const ly = (hy * el.h) / 2;
  return {
    x: el.x + el.w / 2 + lx * Math.cos(rad) - ly * Math.sin(rad),
    y: el.y + el.h / 2 + lx * Math.sin(rad) + ly * Math.cos(rad),
  };
}

test('a box far from anything does not snap', () => {
  const hit = snapBox(100, 100, 50, 50, [], 595, 842, 6);
  assert.deepEqual(hit, { x: 100, y: 100, guideX: null, guideY: null });
});

test('a box snaps its edges to the page edges', () => {
  const hit = snapBox(3, -4, 50, 50, [], 595, 842, 6);
  assert.deepEqual(hit, { x: 0, y: 0, guideX: 0, guideY: 0 });
});

test('a box snaps its center to the page center', () => {
  const hit = snapBox(595 / 2 - 25 + 2, 100, 50, 50, [], 595, 842, 6);
  assert.equal(hit.x, 595 / 2 - 25);
  assert.equal(hit.guideX, 595 / 2);
});

test('a box snaps to another element, and the closest target wins', () => {
  const other = { x: 300, y: 600, w: 40, h: 100 };
  const hit = snapBox(303, 597, 50, 50, [other], 595, 842, 6);
  assert.equal(hit.x, 300);
  assert.equal(hit.y, 600);
  assert.equal(snapBox(299, 100, 50, 50, [other, { x: 302, y: 0, w: 1, h: 1 }], 595, 842, 6).x, 300);
});

test('snapping stays within the threshold', () => {
  assert.equal(snapBox(7, 100, 50, 50, [], 595, 842, 6).x, 7);
});

test('dragging a side changes only that side', () => {
  const east = resizePatch(box(), 'e', 20, 999, 1);
  assert.deepEqual(east, { x: 100, y: 100, w: 120, h: 50 });
  const north = resizePatch(box(), 'n', 999, -10, 1);
  assert.deepEqual(north, { x: 100, y: 90, w: 100, h: 60 });
  const west = resizePatch(box(), 'w', 10, 0, 1);
  assert.deepEqual(west, { x: 110, y: 100, w: 90, h: 50 });
});

test('pointer movement is divided by the zoom', () => {
  assert.equal(resizePatch(box(), 'e', 20, 0, 2).w, 110);
  assert.equal(resizePatch(box(), 's', 0, 20, 2).h, 60);
});

test('a rotated element resizes along its own axes', () => {
  // Turned 90° clockwise, the element's right side faces down the screen.
  const el = box({ rotation: 90 });
  near(resizePatch(el, 'e', 0, 20, 1).w, 120);
  near(resizePatch(el, 'e', 20, 0, 1).w, 100);
  near(resizePatch(el, 's', -20, 0, 1).h, 70);
  near(resizePatch(el, 's', 0, 20, 1).h, 50);
});

test('a shape corner resizes freely, and proportionally when asked', () => {
  const free = resizePatch(box(), 'se', 40, 20, 1);
  assert.deepEqual(free, { x: 100, y: 100, w: 140, h: 70 });
  const stretched = resizePatch(box(), 'se', 100, 0, 1);
  assert.equal(stretched.w, 200);
  assert.equal(stretched.h, 50);
  const kept = resizePatch(box(), 'se', 100, 0, 1, true);
  assert.equal(kept.w, 200);
  assert.equal(kept.h, 100);
});

test('an image corner always keeps its proportions', () => {
  const patch = resizePatch(box({ type: 'image' }), 'se', 100, 0, 1);
  assert.equal(patch.w / patch.h, 2);
});

test('a text corner scales the text, and a text side only rewraps it', () => {
  const text = box({ type: 'text', size: 20, letterSpacing: 2 });
  const corner = resizePatch(text, 'se', 100, 0, 1);
  assert.equal(corner.size, 40);
  assert.equal(corner.letterSpacing, 4);
  const side = resizePatch(text, 'e', 100, 0, 1);
  assert.equal(side.w, 200);
  assert.equal(side.size, undefined);
});

test('elements cannot shrink below the minimum size', () => {
  const patch = resizePatch(box(), 'se', -5000, -5000, 1);
  assert.equal(patch.w, MIN_SIZE);
  assert.equal(patch.h, MIN_SIZE);
});

test('the opposite corner stays in place, even when rotated', () => {
  for (const rotation of [0, 30, 90, -135]) {
    const el = box({ rotation });
    const fixed = cornerOnPage(el, -1, -1);
    const moved = { ...el, ...resizePatch(el, 'se', 37, -12, 1) };
    const after = cornerOnPage(moved, -1, -1);
    near(after.x, fixed.x);
    near(after.y, fixed.y);
  }
});

test('rotation follows the pointer around the center', () => {
  assert.equal(rotationFromPointer(0, 100), 0);
  assert.equal(rotationFromPointer(100, 0), -90);
  assert.equal(rotationFromPointer(-100, 0), 90);
  assert.equal(Math.abs(rotationFromPointer(0, -100)), 180);
});

test('rotation sticks near 45 degree steps', () => {
  const nearly45 = (deg) => {
    const rad = ((deg + 90) * Math.PI) / 180;
    return rotationFromPointer(Math.cos(rad), Math.sin(rad));
  };
  assert.equal(nearly45(44), 45);
  assert.equal(nearly45(30), 30);
});

test('holding shift rotates in 15 degree steps', () => {
  const rad = ((37 + 90) * Math.PI) / 180;
  assert.equal(rotationFromPointer(Math.cos(rad), Math.sin(rad), true), 30);
});
