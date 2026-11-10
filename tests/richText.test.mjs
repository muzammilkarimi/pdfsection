import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  elementSpans, spansText, resolveStyle, normalizeSpans, applyTextEdit, textEditPatch,
  wholeStylePatch, everySpan, simplifySpans, layoutRuns,
} from '@/lib/richText';

const bold = (text) => ({ text, bold: true });
const plain = (text) => ({ text, bold: false });

test('an element without spans is one span of its text', () => {
  assert.deepEqual(elementSpans({ text: 'Hi' }), [{ text: 'Hi' }]);
  assert.equal(spansText([bold('Total: '), plain('42')]), 'Total: 42');
});

test('spans inherit missing style from the element', () => {
  const el = { fontFamily: 'Times', isBold: true, color: '#ff0000', size: 11, fontId: 'g_d0_f2' };
  assert.deepEqual(resolveStyle(el, { text: 'x', italic: true }), {
    family: 'Times', bold: true, italic: true, color: '#ff0000', size: 11, fontId: 'g_d0_f2',
  });
  assert.equal(resolveStyle(el, { text: 'x', fontId: null }).fontId, null, 'a span can opt out of the PDF font');
});

test('normalize merges same-style neighbours and drops empty spans', () => {
  assert.deepEqual(normalizeSpans([bold('a'), bold('b'), plain(''), plain('c')]), [bold('ab'), plain('c')]);
});

test('typing inside a bold word stays bold; typing after it continues its style', () => {
  const spans = [bold('Total:'), plain(' 42')];
  assert.deepEqual(applyTextEdit(spans, 'Totals: 42'), [bold('Totals:'), plain(' 42')]);
  assert.deepEqual(applyTextEdit(spans, 'Total: 420'), [bold('Total:'), plain(' 420')]);
});

test('typing at the very start takes the first span style', () => {
  assert.deepEqual(applyTextEdit([bold('Hello'), plain(' world')], 'Oh Hello world'), [bold('Oh Hello'), plain(' world')]);
});

test('deleting across a style boundary keeps both sides', () => {
  assert.deepEqual(applyTextEdit([bold('Total:'), plain(' 42 USD')], 'Tot42 USD'), [bold('Tot'), plain('42 USD')]);
});

test('replacing everything keeps the first style', () => {
  assert.deepEqual(applyTextEdit([bold('ab'), plain('cd')], 'xyz'), [bold('xyz')]);
  assert.deepEqual(applyTextEdit([bold('ab')], ''), []);
});

test('edits never split emoji or other surrogate pairs', () => {
  const out = applyTextEdit([plain('a😀b')], 'a😃b');
  assert.equal(spansText(out), 'a😃b');
});

test('text edit patch only touches spans when the element has them', () => {
  assert.deepEqual(textEditPatch({ text: 'a' }, 'ab'), { text: 'ab' });
  assert.deepEqual(textEditPatch({ text: 'ab', spans: [bold('a'), plain('b')] }, 'abc'), {
    text: 'abc', spans: [bold('a'), plain('bc')],
  });
});

test('whole-element bold clears span overrides and the PDF font', () => {
  const el = { isBold: false, fontId: 'g1', spans: [{ text: 'a', bold: true, fontId: 'g2' }, { text: 'b' }] };
  const patch = wholeStylePatch(el, 'bold', true);
  assert.equal(patch.isBold, true);
  assert.equal(patch.fontId, null);
  assert.deepEqual(patch.spans, [{ text: 'ab' }]);
});

test('changing colour or size keeps the PDF font', () => {
  const patch = wholeStylePatch({ fontId: 'g1', spans: [{ text: 'a', color: '#000000' }] }, 'color', '#ff0000');
  assert.equal(patch.fontId, undefined);
  assert.deepEqual(patch.spans, [{ text: 'a' }]);
});

test('everySpan tells whether the whole element has a style', () => {
  assert.equal(everySpan({ isBold: false, spans: [bold('a'), plain('b')] }, 'bold', true), false);
  assert.equal(everySpan({ isBold: true, text: 'x' }, 'bold', true), true);
});

test('a single span folds back into the element', () => {
  const el = simplifySpans({ text: 'x', spans: [{ text: 'Hi', bold: true, fontId: 'g1' }] });
  assert.deepEqual(el, { text: 'Hi', isBold: true, fontId: 'g1' });
});

// one point per character keeps the layout maths easy to follow
const measure = (text) => text.length;
const lineTexts = (lines) => lines.map((l) => l.runs.map((r) => r.text).join(''));

test('lines wrap at spaces', () => {
  const lines = layoutRuns([{ text: 'aaa bbb ccc', style: 'r' }], measure, 7);
  assert.deepEqual(lineTexts(lines), ['aaa bbb', 'ccc']);
  assert.equal(lines[0].width, 7);
});

test('no wrapping without a width limit, and hard breaks always start a new line', () => {
  assert.deepEqual(lineTexts(layoutRuns([{ text: 'aaa bbb ccc', style: 'r' }], measure)), ['aaa bbb ccc']);
  assert.deepEqual(lineTexts(layoutRuns([{ text: 'a\nb\n', style: 'r' }], measure)), ['a', 'b', '']);
  assert.deepEqual(lineTexts(layoutRuns([{ text: '', style: 'r' }], measure)), ['']);
});

test('a word made of several styles wraps as one word', () => {
  const lines = layoutRuns([{ text: 'xx Bo', style: 'b' }, { text: 'ld yy', style: 'r' }], measure, 5);
  assert.deepEqual(lineTexts(lines), ['xx', 'Bold', 'yy']);
  assert.deepEqual(lines[1].runs.map((r) => [r.text, r.style]), [['Bo', 'b'], ['ld', 'r']]);
});

test('a word longer than the line is broken between characters', () => {
  assert.deepEqual(lineTexts(layoutRuns([{ text: 'abcdefgh', style: 'r' }], measure, 3)), ['abc', 'def', 'gh']);
});

test('leading spaces (indentation) are kept', () => {
  assert.deepEqual(lineTexts(layoutRuns([{ text: '  indented', style: 'r' }], measure)), ['  indented']);
});
