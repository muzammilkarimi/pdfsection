import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRange } from '@/lib/pageRange';

test('reads single pages and ranges as zero-based indexes', () => {
  assert.deepEqual(parseRange('1', 5), [0]);
  assert.deepEqual(parseRange('1-3', 5), [0, 1, 2]);
  assert.deepEqual(parseRange('1-3, 5', 5), [0, 1, 2, 4]);
  assert.deepEqual(parseRange(' 2 - 3 ,5 ', 5), [1, 2, 4]);
});

test('sorts pages and removes repeats', () => {
  assert.deepEqual(parseRange('5, 1, 1-2', 5), [0, 1, 4]);
});

test('rejects anything that is not a valid range', () => {
  for (const bad of ['', ' ', 'abc', '0', '6', '3-1', '1-9', '1,', '1-', '-2', '1.5', '1;2']) {
    assert.equal(parseRange(bad, 5), null, JSON.stringify(bad));
  }
});
