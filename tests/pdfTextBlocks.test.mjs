import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutToBlocks, lineBlock, lineIndexAt, blockToElements, ASCENT } from '@/lib/pdfTextBlocks';
import { editFamily } from '@/lib/editFonts';

const run = (text, x, width, extra = {}) => ({
  text, x, width, size: 10, fontName: 'ABCDEF+Calibri', family: 'Calibri', bold: false, italic: false, color: '000000', fontId: 'g_d0_f1', ...extra,
});

// A two-line paragraph whose first line has a bold word, on a 600 x 800 pt page.
const layout = {
  width: 600,
  height: 800,
  segments: [
    {
      x: 50, baseline: 100, width: 200, size: 10,
      runs: [
        run('Total: ', 50, 40, { fontName: 'ABCDEF+Calibri-Bold', bold: true, fontId: 'g_d0_f2' }),
        run('42 boxes shipped ', 90, 160),
      ],
    },
    { x: 50, baseline: 112, width: 150, size: 10, runs: [run('to the north office', 50, 150)] },
  ],
};

test('font names map to the editor families', () => {
  assert.equal(editFamily('ABCDEF+Calibri-Bold'), 'Calibri');
  assert.equal(editFamily('Cambria'), 'Cambria');
  assert.equal(editFamily('TimesNewRomanPSMT'), 'Times');
  assert.equal(editFamily('ArialMT'), 'Helvetica');
  assert.equal(editFamily('CourierNewPSMT'), 'Courier');
});

test('a paragraph keeps its lines with their style runs and fonts', () => {
  const [block] = layoutToBlocks(layout, 'p');
  assert.equal(block.str, 'Total: 42 boxes shipped\nto the north office');
  assert.equal(block.family, 'Calibri');
  assert.equal(block.lines.length, 2);
  assert.equal(block.lines[0].runs[0].fontId, 'g_d0_f2');
  assert.equal(block.lines[0].runs.at(-1).text, '42 boxes shipped', 'trailing space trimmed');
});

test('one line becomes its own block at the line position', () => {
  const [block] = layoutToBlocks(layout, 'p');
  const line = lineBlock(block, 1);
  assert.equal(line.str, 'to the north office');
  assert.equal(line.paragraphId, block.id);
  assert.ok(Math.abs(line.textY * 800 - (112 - 10 * ASCENT)) < 1e-9);
  assert.ok(Math.abs(line.textX * 600 - 50) < 1e-9);
  assert.equal(lineIndexAt(block, 111 / 800), 1);
  assert.equal(lineIndexAt(block, 97 / 800), 0);
});

test('a mixed-style line keeps its bold word and PDF fonts as spans', () => {
  const [block] = layoutToBlocks(layout, 'p');
  const [cover, text] = blockToElements(lineBlock(block, 0), { coverId: 'c', textId: 't', bg: '#fafafa', ink: '#111111', oneLine: true });
  assert.equal(cover.linkedTo, 't');
  assert.equal(cover.color, '#fafafa');
  assert.equal(text.text, 'Total: 42 boxes shipped');
  assert.equal(text.oneLine, true);
  assert.deepEqual(text.spans.map((s) => [s.text, s.bold, s.fontId]), [
    ['Total: ', true, 'g_d0_f2'],
    ['42 boxes shipped', false, 'g_d0_f1'],
  ]);
  assert.deepEqual(text.origLines, [{ text: 'Total: 42 boxes shipped', width: 200 }]);
});

test('a single-style line has no spans, just element fields with the PDF font', () => {
  const [block] = layoutToBlocks(layout, 'p');
  const [, text] = blockToElements(lineBlock(block, 1), { coverId: 'c', textId: 't' });
  assert.equal(text.spans, undefined);
  assert.equal(text.fontId, 'g_d0_f1');
  assert.equal(text.fontFamily, 'Calibri');
  assert.equal(text.isBold, false);
});

test('a whole paragraph joins the lines the PDF only wrapped, so it reflows when resized', () => {
  const [block] = layoutToBlocks(layout, 'p');
  const [, text] = blockToElements(block, { coverId: 'c', textId: 't' });
  assert.equal(text.text, 'Total: 42 boxes shipped to the north office');
  assert.equal(text.spans.map((s) => s.text).join(''), text.text);
  assert.equal(text.oneLine, false);
});

import { fitCharSpacing } from '@/lib/pdfTextBlocks';

test('letter spacing makes the text as long as the original line', () => {
  // 11 characters (10 gaps), naturally 90 pt, originally 100 pt: 1 pt between characters
  assert.equal(fitCharSpacing([{ text: 'abcdefghijk', width: 100 }], [90], 1, 12), 1);
  // with the type squeezed to 80%, the unsqueezed width is 125 pt
  assert.equal(fitCharSpacing([{ text: 'abcdefghijk', width: 100 }], [115], 0.8, 12), 1);
});

test('the longest line decides; changed lines and tiny differences are ignored', () => {
  const lines = [{ text: 'abcdefghijk', width: 100 }, { text: 'abc', width: 40 }, { text: 'changed text', width: null }];
  assert.equal(fitCharSpacing(lines, [95, 20, 50], 1, 12), 0.5);
  assert.equal(fitCharSpacing([{ text: 'abcdefghijk', width: 100 }], [100], 1, 12), undefined);
  assert.equal(fitCharSpacing([{ text: 'abcdefghijk', width: 500 }], [90], 1, 10), 3, 'clamped to 0.3 em');
});

import { isSoftBreak } from '@/lib/pdfTextBlocks';

test('only wrapped lines are joined; paragraph ends and hyphens keep their break', () => {
  // a full line followed by more text: wrapped
  assert.equal(isSoftBreak({ text: 'a full line of text here', width: 200 }, { text: 'next words' }, 200), true);
  // a short line that had room for the next word: a real break
  assert.equal(isSoftBreak({ text: 'Short end.', width: 60 }, { text: 'New paragraph' }, 200), false);
  assert.equal(isSoftBreak({ text: 'hyphen-', width: 200 }, { text: 'ated' }, 200), false);
  // the one-line version keeps every break
  const [block] = layoutToBlocks(layout, 'p');
  const [, lines] = blockToElements(block, { coverId: 'c', textId: 't', oneLine: true });
  assert.equal(lines.text, 'Total: 42 boxes shipped\nto the north office');
});
