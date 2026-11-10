import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyElements, patchElements, primaryElement, removeElements, selectOnlyId } from '@/lib/designSelection';

const a = { id: 'a', x: 1, y: 2, locked: false };
const b = { id: 'b', x: 3, y: 4, locked: true };
const c = { id: 'c', x: 5, y: 6, locked: false };
const page = [a, b, c];

test('choosing one element replaces the selection', () => {
  assert.deepEqual(selectOnlyId([], 'a'), ['a']);
  assert.deepEqual(selectOnlyId(['a', 'b'], 'c'), ['c']);
  assert.deepEqual(selectOnlyId(['a', 'b'], 'a'), ['a']);
});

test('choosing nothing clears the selection', () => {
  assert.deepEqual(selectOnlyId(['a'], null), []);
  assert.deepEqual(selectOnlyId(['a'], undefined), []);
});

test('a selection that would not change stays the same list, so nothing redraws', () => {
  const one = ['a'];
  assert.equal(selectOnlyId(one, 'a'), one);
  const none = [];
  assert.equal(selectOnlyId(none, null), none);
});

test('the primary element is the most recently selected one', () => {
  assert.equal(primaryElement(page, ['a', 'c']), c);
  assert.equal(primaryElement(page, ['c', 'a']), a);
  assert.equal(primaryElement(page, []), null);
});

test('ids no longer on the page are skipped, as after an undo', () => {
  assert.equal(primaryElement(page, ['gone']), null);
  assert.equal(primaryElement(page, ['a', 'gone']), a);
});

test('a change applies to the selected elements only', () => {
  const result = patchElements(page, ['a', 'c'], { x: 99 });
  assert.deepEqual(result.map((el) => el.x), [99, 3, 99]);
  assert.equal(result[1], b);
  assert.equal(a.x, 1);
});

test('removing takes out the selected elements only', () => {
  assert.deepEqual(removeElements(page, ['a', 'c']), [b]);
  assert.deepEqual(removeElements(page, ['gone']), page);
});

test('copies are offset and unlocked, with new ids, in stacking order', () => {
  const copies = copyElements(page, ['c', 'b']);
  assert.equal(copies.length, 2);
  assert.deepEqual(copies.map((el) => [el.x, el.y, el.locked]), [[15, 16, false], [17, 18, false]]);
  assert.ok(copies.every((el) => !['a', 'b', 'c'].includes(el.id)));
  assert.equal(b.locked, true);
});

test('copying ids no longer on the page gives nothing', () => {
  assert.deepEqual(copyElements(page, ['gone']), []);
});
