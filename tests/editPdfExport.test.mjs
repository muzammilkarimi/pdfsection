// End-to-end checks for the Edit PDF export: build real PDFs with pdf-lib, apply editor
// documents, then read the result back with pdf.js the way the editor displays it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { resolve } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { exportEditedPdf } from '@/lib/editPdfExport';
import { ASCENT } from '@/lib/pdfTextBlocks';

async function makePdf(pages) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const p of pages) {
    const page = doc.addPage([p.width ?? 600, p.height ?? 800]);
    if (p.crop) page.setCropBox(...p.crop);
    if (p.rotate) page.setRotation(degrees(p.rotate));
    page.drawText(p.label, { x: 50, y: 50, size: 10, font });
  }
  return doc.save();
}

/** Text items of every page, with positions in the displayed (rotated) page as fractions. */
async function readBack(bytes) {
  const task = getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    standardFontDataUrl: `${resolve('node_modules/pdfjs-dist/standard_fonts')}/`,
  });
  const pdf = await task.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    pages.push({
      rotate: page.rotate,
      items: content.items.map((it) => {
        const [x, y] = viewport.convertToViewportPoint(it.transform[4], it.transform[5]);
        return { str: it.str, fx: x / viewport.width, fy: y / viewport.height, w: it.width / viewport.width, vw: viewport.width, vh: viewport.height };
      }),
    });
  }
  await task.destroy();
  return pages;
}

const textEl = (text, x, y, size = 20) => ({
  id: `t-${text}`, type: 'text', text, x, y, width: 0.5, height: 0.05, size, fontFamily: 'Helvetica', color: '#000000',
});

test('edits stay on their page when an earlier page is deleted', async () => {
  const src = await makePdf([{ label: 'P0' }, { label: 'P1' }, { label: 'P2' }]);
  const { bytes } = await exportEditedPdf({
    file: src,
    doc: { elements: { 2: [textEl('EDITTWO', 0.2, 0.2)] }, rotations: { 2: 90 }, deleted: [0] },
  });
  const pages = await readBack(bytes);
  assert.equal(pages.length, 2);
  const has = (p, s) => p.items.some((it) => it.str === s);
  assert.ok(has(pages[0], 'P1') && !has(pages[0], 'EDITTWO'), 'page 1 untouched');
  assert.ok(has(pages[1], 'P2') && has(pages[1], 'EDITTWO'), 'edit landed on the original page 2');
  assert.equal(pages[0].rotate, 0, 'rotation did not shift to the wrong page');
  assert.equal(pages[1].rotate, 90);
});

for (const rotate of [0, 90, 180, 270]) {
  test(`text lands where it was placed on a page with /Rotate ${rotate} and an offset crop box`, async () => {
    const src = await makePdf([{ label: 'X', width: 700, height: 900, rotate, crop: [40, 60, 600, 800] }]);
    const size = 20;
    const { bytes } = await exportEditedPdf({
      file: src,
      doc: { elements: { 0: [textEl('HERE', 0.25, 0.4, size)] }, rotations: {}, deleted: [] },
    });
    const [page] = await readBack(bytes);
    const item = page.items.find((it) => it.str === 'HERE');
    assert.ok(item, 'the text is in the PDF');
    // x is the left edge of the box; the baseline sits ASCENT font sizes below the top of the box
    assert.ok(Math.abs(item.fx - 0.25) < 0.003, `x ${item.fx}`);
    assert.ok(Math.abs(item.fy - (0.4 + (size * ASCENT) / item.vh)) < 0.003, `y ${item.fy}`);
  });
}

test('a user rotation turns the edits with the page', async () => {
  const src = await makePdf([{ label: 'X' }]);
  const { bytes } = await exportEditedPdf({
    file: src,
    doc: { elements: { 0: [textEl('TURN', 0.1, 0.1)] }, rotations: { 0: 90 }, deleted: [] },
  });
  const [page] = await readBack(bytes);
  const item = page.items.find((it) => it.str === 'TURN');
  // base-view top-left corner ends up at the top-right after a clockwise quarter turn
  assert.ok(item.fx > 0.8 && item.fy < 0.2, `at ${item.fx}, ${item.fy}`);
});

test('freehand strokes, lines, arrows, shapes, marks and highlights export without errors', async () => {
  const src = await makePdf([{ label: 'X', rotate: 90 }]);
  const { bytes } = await exportEditedPdf({
    file: src,
    doc: {
      elements: {
        0: [
          { id: 'd', type: 'draw', color: '#ff0000', strokeWidth: 3, points: [[0.1, 0.1], [0.2, 0.15], [0.3, 0.1]] },
          { id: 'l', type: 'shape-line', color: '#0000ff', x1: 0.8, y1: 0.2, x2: 0.3, y2: 0.6 },
          { id: 'r', type: 'shape-rect', color: '#00ff00', x: 0.1, y: 0.5, width: 0.2, height: 0.1 },
          { id: 'h', type: 'highlight', color: '#ffc107', x: 0.1, y: 0.7, width: 0.3, height: 0.03, opacity: 0.35 },
          { id: 'e', type: 'erase', color: '#fafafa', x: 0.5, y: 0.7, width: 0.3, height: 0.03 },
          { id: 's', type: 'stamp', color: '#ff4d4f', text: 'DRAFT', x: 0.4, y: 0.3, width: 0.3, height: 0.08 },
          { id: 'o', type: 'shape-ellipse', color: '#00ff00', x: 0.5, y: 0.5, width: 0.2, height: 0.1 },
          { id: 'a', type: 'shape-line', arrow: true, color: '#0000ff', x1: 0.1, y1: 0.9, x2: 0.4, y2: 0.8 },
          { id: 'k', type: 'mark', symbol: 'check', color: '#00b473', x: 0.7, y: 0.1, width: 0.04, height: 0.03, aspect: 1 },
          { id: 'x', type: 'mark', symbol: 'cross', color: '#ff0000', x: 0.8, y: 0.1, width: 0.04, height: 0.03, aspect: 1 },
        ],
      },
      rotations: {},
      deleted: [],
    },
  });
  const [page] = await readBack(bytes);
  assert.ok(page.items.some((it) => it.str === 'DRAFT'));
});

// ── Fonts ──

import { readFileSync } from 'node:fs';
import fontkit from '@pdf-lib/fontkit';
import { OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const readFont = async (url) => new Uint8Array(readFileSync(resolve('public', url.replace(/^\//, ''))));

/** A PDF whose text uses an embedded (subset) Carlito font, plus pdf.js's rebuilt copy of that font. */
async function pdfWithEmbeddedFont(text) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(readFileSync('public/fonts/edit/carlito-latin-400-normal.woff'), { subset: true });
  doc.addPage([600, 800]).drawText(text, { x: 50, y: 700, size: 20, font });
  const bytes = await doc.save();

  const task = getDocument({ data: bytes.slice(), fontExtraProperties: true, isEvalSupported: false, standardFontDataUrl: `${resolve('node_modules/pdfjs-dist/standard_fonts')}/` });
  const pdf = await task.promise;
  const page = await pdf.getPage(1);
  const ops = await page.getOperatorList();
  const fontId = ops.argsArray[ops.fnArray.indexOf(OPS.setFont)][0];
  const data = page.commonObjs.get(fontId).data;
  await task.destroy();
  return { bytes, fontId, data };
}

/** Names of the fonts each text item of page 1 is drawn with. */
async function fontsUsed(bytes) {
  const task = getDocument({ data: new Uint8Array(bytes), fontExtraProperties: true, isEvalSupported: false, standardFontDataUrl: `${resolve('node_modules/pdfjs-dist/standard_fonts')}/` });
  const pdf = await task.promise;
  const page = await pdf.getPage(1);
  const { items } = await page.getTextContent();
  await page.getOperatorList();
  const out = items.filter((it) => it.str.trim()).map((it) => ({ str: it.str, font: page.commonObjs.get(it.fontName).name }));
  await task.destroy();
  return out;
}

test('new text is drawn with the PDF\'s own embedded font', async () => {
  // the original only uses these letters, so the edit can be drawn entirely in its font
  const { bytes, fontId, data } = await pdfWithEmbeddedFont('Portal login here');
  const { bytes: out } = await exportEditedPdf({
    file: bytes,
    embeddedFonts: { [fontId]: data },
    doc: { elements: { 0: [{ ...textEl('Portal here', 0.1, 0.5), fontFamily: 'Calibri', fontId }] }, rotations: {}, deleted: [] },
    loadFontBytes: readFont,
  });
  const used = await fontsUsed(out);
  const edit = used.find((u) => u.str.includes('Portal'));
  assert.ok(edit, `edit is in the PDF: ${JSON.stringify(used)}`);
  assert.match(edit.font, /Carlito/);
  // the space is not in the subset, so it comes from the matching editor font (Carlito too)
  assert.ok(used.filter((u) => u.str !== 'X').every((u) => /Carlito/.test(u.font)), JSON.stringify(used));
});

test('letters missing from the embedded subset fall back to the matching editor font', async () => {
  const { bytes, fontId, data } = await pdfWithEmbeddedFont('abc');
  const { bytes: out, replacedChars } = await exportEditedPdf({
    file: bytes,
    embeddedFonts: { [fontId]: data },
    doc: { elements: { 0: [{ ...textEl('abcXYZ', 0.1, 0.5), fontFamily: 'Calibri', fontId }] }, rotations: {}, deleted: [] },
    loadFontBytes: readFont,
  });
  assert.deepEqual(replacedChars, []);
  const text = (await fontsUsed(out)).map((u) => u.str).join('');
  assert.ok(text.includes('abc') && text.includes('XYZ'), `got ${text}`);
});

test('Calibri text without the PDF font is saved in Carlito, so widths match Calibri', async () => {
  const src = await makePdf([{ label: 'X' }]);
  const { bytes } = await exportEditedPdf({
    file: src,
    doc: { elements: { 0: [{ ...textEl('Quarterly report', 0.1, 0.5), fontFamily: 'Calibri' }] }, rotations: {}, deleted: [] },
    loadFontBytes: readFont,
  });
  const edit = (await fontsUsed(bytes)).find((u) => u.str.includes('Quarterly'));
  assert.match(edit.font, /Carlito/);
});

test('a line with a bold word keeps both styles', async () => {
  const src = await makePdf([{ label: 'X' }]);
  const { bytes } = await exportEditedPdf({
    file: src,
    doc: {
      elements: { 0: [{ ...textEl('Total: 42', 0.1, 0.5), oneLine: true, spans: [{ text: 'Total:', bold: true }, { text: ' 42', bold: false }] }] },
      rotations: {},
      deleted: [],
    },
  });
  const used = await fontsUsed(bytes);
  assert.ok(used.some((u) => u.str.includes('Total:') && /Bold/.test(u.font)), JSON.stringify(used));
  assert.ok(used.some((u) => u.str.includes('42') && !/Bold/.test(u.font)), JSON.stringify(used));
});

test('letter spacing and horizontal squeeze are saved so the line keeps its length', async () => {
  const src = await makePdf([{ label: 'X' }]);
  const plain = await exportEditedPdf({ file: src, doc: { elements: { 0: [{ ...textEl('Spacing test', 0.1, 0.5), oneLine: true }] }, rotations: {}, deleted: [] } });
  const spaced = await exportEditedPdf({
    file: src,
    doc: { elements: { 0: [{ ...textEl('Spacing test', 0.1, 0.5), oneLine: true, charSpacing: 1, hScale: 0.9 }] }, rotations: {}, deleted: [] },
  });
  const widthOf = async (bytes) => {
    const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, standardFontDataUrl: `${resolve('node_modules/pdfjs-dist/standard_fonts')}/` });
    const pdf = await task.promise;
    const { items } = await (await pdf.getPage(1)).getTextContent();
    const w = items.filter((it) => it.str.includes('Spacing')).reduce((sum, it) => sum + it.width, 0);
    await task.destroy();
    return w;
  };
  const natural = await widthOf(plain.bytes);
  const adjusted = await widthOf(spaced.bytes);
  // (natural + 1 pt in each of the 11 gaps) x 0.9: a line's width ends at its last letter
  assert.ok(Math.abs(adjusted - (natural + 11) * 0.9) < 0.2, `natural ${natural}, adjusted ${adjusted}`);
});

// ── Alignment ──

test('text is aligned inside its box the way the editor shows it', async () => {
  const src = await makePdf([{ label: 'X' }]);
  const helv = await (await PDFDocument.create()).embedFont(StandardFonts.Helvetica);
  const at = async (align, text = 'Hello') => {
    const { bytes } = await exportEditedPdf({
      file: src,
      doc: { elements: { 0: [{ ...textEl(text, 0.1, 0.5), align }] }, rotations: {}, deleted: [] },
    });
    const [page] = await readBack(bytes);
    return page.items.filter((it) => it.str.trim() && it.str !== 'X');
  };
  const w = helv.widthOfTextAtSize('Hello', 20) / 600; // the box is 0.5 of a 600 pt page
  const [left] = await at(undefined);
  const [right] = await at('right');
  const [center] = await at('center');
  assert.ok(Math.abs(left.fx - 0.1) < 0.002, `left ${left.fx}`);
  assert.ok(Math.abs(right.fx - (0.6 - w)) < 0.002, `right ${right.fx}`);
  assert.ok(Math.abs(center.fx - (0.1 + (0.5 - w) / 2)) < 0.002, `center ${center.fx}`);

  // justified: the wrapped first line reaches the right edge, the last line stays left
  const words = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda';
  const items = await at('justify', words);
  const firstRow = items.filter((it) => Math.abs(it.fy - items[0].fy) < 0.002);
  const lastWord = firstRow[firstRow.length - 1];
  const end = lastWord.fx + lastWord.w;
  assert.ok(Math.abs(end - 0.6) < 0.003, `first line ends at ${end}`);
  const lastRow = items.filter((it) => Math.abs(it.fy - items[items.length - 1].fy) < 0.002);
  assert.ok(Math.abs(lastRow[0].fx - 0.1) < 0.002);
});
