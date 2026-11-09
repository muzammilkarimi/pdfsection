// Applies the editor's document (elements, page rotations, deleted pages) to the original PDF.
// Pure pdf-lib work (plus font fetches); no React.
//
// Elements are stored in base-view fractions (see lib/editModel.js). Each page is drawn inside a
// transform that turns base-view points into the page's own user space, so edits land in the same
// place whatever the page's /Rotate or crop box. Rotations and deletions are keyed by the ORIGINAL
// page index; pages are removed only after every edit has been drawn.
//
// Text uses, character by character: the PDF's own embedded font (when the editor has its bytes
// and the font has the glyph), then the editor family's font (metric-compatible, see
// lib/editFonts.js), then the bundled Unicode fonts, then "?".

import {
  rgb, degrees, StandardFonts, BlendMode, LineCapStyle, LineJoinStyle,
  setCharacterSpacing, setCharacterSqueeze, setTextRenderingMode, setLineWidth, setStrokingColor, setLineJoin,
  pushGraphicsState, popGraphicsState, concatTransformationMatrix, TextRenderingMode,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { loadPdf, savePdf } from '@/lib/pdfUtils';
import { createUnicodeFallback, isRtlDominant } from '@/lib/unicodeFonts';
import { ASCENT } from '@/lib/pdfTextBlocks';
import { normalizeRotation, viewTransform, strokePath, arrowHead, MARK_PATHS, MARK_STROKE, withoutPristine } from '@/lib/editModel';
import { getEditFont, editFontUrl } from '@/lib/editFonts';
import { elementSpans, resolveStyle, layoutRuns } from '@/lib/richText';

export const DEFAULT_STROKE = { 'shape-rect': 2, 'shape-ellipse': 2, 'shape-line': 3, draw: 3 };

export const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return rgb(0, 0, 0);
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const STANDARD = {
  Helvetica: [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique],
  Times: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic],
  Courier: [StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique],
};
const styleIndex = (bold, italic) => (bold ? 1 : 0) + (italic ? 2 : 0);

async function fetchFontBytes(url) {
  try {
    const res = await fetch(url);
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

const canEncode = (font, ch) => {
  try {
    font.encodeText(ch);
    return true;
  } catch {
    return false;
  }
};

/**
 * @param {object} args
 * @param {File|ArrayBuffer|Uint8Array} args.file the original PDF
 * @param {{ elements: object, rotations: object, deleted: number[] }} args.doc
 * @param {Record<string, Uint8Array>} [args.embeddedFonts] the PDF's own fonts by pdf.js font id
 * @param {(url: string) => Promise<Uint8Array|null>} [args.loadFontBytes] how editor font files are read
 * @returns {Promise<{ bytes: Uint8Array, replacedChars: string[] }>} characters no font could draw
 */
export async function exportEditedPdf({ file, doc, embeddedFonts = {}, loadFontBytes = fetchFontBytes }) {
  const { elements = {}, rotations = {}, deleted = [] } = doc;
  const pdfDoc = await loadPdf(file);
  pdfDoc.registerFontkit(fontkit);
  const replacedChars = new Set();
  let fallback = null;

  // ── fonts, embedded on first use ──
  const cache = new Map();
  const once = (key, make) => {
    if (!cache.has(key)) cache.set(key, make());
    return cache.get(key);
  };
  const standardFont = (family, bold, italic) =>
    once(`std-${family}-${styleIndex(bold, italic)}`, () => pdfDoc.embedFont((STANDARD[family] || STANDARD.Helvetica)[styleIndex(bold, italic)]));

  /** The editor family's font: { font, kit? }. Built-in families use the standard PDF fonts. */
  const familyFont = (family, bold, italic) =>
    once(`fam-${family}-${styleIndex(bold, italic)}`, async () => {
      const def = getEditFont(family);
      if (!def.builtIn) {
        const bytes = await loadFontBytes(editFontUrl(def.id, bold, italic));
        if (bytes) {
          try {
            return { font: await pdfDoc.embedFont(bytes, { subset: true }), kit: fontkit.create(bytes) };
          } catch {
            // fall through to Helvetica
          }
        }
        return { font: await standardFont('Helvetica', bold, italic) };
      }
      return { font: await standardFont(def.id, bold, italic) };
    });

  /** The PDF's own font for a pdf.js font id: { font, kit } or null. */
  const pdfFont = (fontId) =>
    once(`pdf-${fontId}`, async () => {
      const bytes = fontId && embeddedFonts[fontId];
      if (!bytes) return null;
      try {
        const kit = fontkit.create(bytes);
        // fonts pdf.js rebuilt are already subsets of the original; embed them whole
        return { font: await pdfDoc.embedFont(bytes, { subset: false }), kit };
      } catch {
        return null;
      }
    });

  const helveticaBold = () => standardFont('Helvetica', true, false);

  const pages = pdfDoc.getPages();
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    if (deleted.includes(pageIdx)) continue;
    const page = pages[pageIdx];
    const ownRotation = normalizeRotation(page.getRotation().angle);
    // an opened line nobody changed stays exactly as the original PDF drew it
    const pageEls = withoutPristine(elements[pageIdx] || []);

    if (pageEls.length) {
      const view = viewTransform(ownRotation, page.getCropBox());
      page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...view.matrix));
      for (const el of pageEls) {
        await drawElement(page, el, view.width, view.height);
      }
      page.pushOperators(popGraphicsState());
    }

    if (rotations[pageIdx]) {
      page.setRotation(degrees(normalizeRotation(ownRotation + rotations[pageIdx])));
    }
  }

  // Remove deleted pages last, highest index first, so indices above stay valid.
  [...new Set(deleted)].filter((i) => i >= 0 && i < pages.length).sort((a, b) => b - a).forEach((i) => pdfDoc.removePage(i));

  const bytes = await savePdf(pdfDoc);
  return { bytes, replacedChars: [...replacedChars] };

  // One element, in base-view points (origin bottom-left).
  async function drawElement(page, el, width, height) {
    // box helpers: top-left fractions -> bottom-left points
    const bx = (el.x || 0) * width;
    const bw = (el.width || 0) * width;
    const bh = (el.height || 0) * height;
    const by = (1 - (el.y || 0) - (el.height || 0)) * height;

    if (el.type === 'text' && el.text) {
      await drawText(el, page, width, height);
    } else if (el.type === 'stamp' && el.text) {
      const font = await helveticaBold();
      const color = hexToRgb(el.color);
      const border = 2.5;
      page.drawRectangle({
        x: bx + border / 2, y: by + border / 2, width: bw - border, height: bh - border,
        borderColor: color, borderWidth: border, color: rgb(1, 1, 1),
      });
      const size = Math.min(bh * 0.5, (bw - 16) / font.widthOfTextAtSize(el.text, 1));
      const textWidth = font.widthOfTextAtSize(el.text, size);
      page.drawText(el.text, {
        x: bx + (bw - textWidth) / 2,
        y: by + (bh - font.heightAtSize(size, { descender: false })) / 2,
        size, font, color,
      });
    } else if (el.type === 'image' && el.bytes) {
      const img = el.format === 'png' ? await pdfDoc.embedPng(el.bytes) : await pdfDoc.embedJpg(el.bytes);
      page.drawImage(img, { x: bx, y: by, width: bw, height: bh });
    } else if (el.type === 'erase') {
      page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: hexToRgb(el.color || '#ffffff') });
    } else if (el.type === 'highlight') {
      // multiply keeps the text under the highlight dark, like a real highlighter
      page.drawRectangle({
        x: bx, y: by, width: bw, height: bh,
        color: hexToRgb(el.color || '#ffc107'), opacity: el.opacity ?? 0.35, blendMode: BlendMode.Multiply,
      });
    } else if (el.type === 'shape-rect') {
      // the stroke sits inside the box, as it does on screen
      const sw = el.strokeWidth ?? DEFAULT_STROKE['shape-rect'];
      page.drawRectangle({
        x: bx + sw / 2, y: by + sw / 2, width: Math.max(0, bw - sw), height: Math.max(0, bh - sw),
        borderColor: hexToRgb(el.color), borderWidth: sw,
      });
    } else if (el.type === 'shape-ellipse') {
      const sw = el.strokeWidth ?? DEFAULT_STROKE['shape-ellipse'];
      page.drawEllipse({
        x: bx + bw / 2, y: by + bh / 2,
        xScale: Math.max(0, bw / 2 - sw / 2), yScale: Math.max(0, bh / 2 - sw / 2),
        borderColor: hexToRgb(el.color), borderWidth: sw,
      });
    } else if (el.type === 'shape-line') {
      const sw = el.strokeWidth ?? DEFAULT_STROKE['shape-line'];
      const color = hexToRgb(el.color);
      const line = (a, b) => page.drawLine({
        start: { x: a[0], y: height - a[1] }, end: { x: b[0], y: height - b[1] },
        thickness: sw, color, lineCap: LineCapStyle.Round,
      });
      const p1 = [el.x1 * width, el.y1 * height];
      const p2 = [el.x2 * width, el.y2 * height];
      line(p1, p2);
      if (el.arrow) {
        const [left, right] = arrowHead(p1[0], p1[1], p2[0], p2[1], sw);
        line(left, p2);
        line(right, p2);
      }
    } else if (el.type === 'mark' && MARK_PATHS[el.symbol]) {
      // a 24-unit path scaled to the box; the stroke scales with it, as on screen
      page.pushOperators(setLineJoin(LineJoinStyle.Round));
      page.drawSvgPath(MARK_PATHS[el.symbol], {
        x: bx, y: by + bh, scale: bw / 24,
        borderColor: hexToRgb(el.color), borderWidth: MARK_STROKE, borderLineCap: LineCapStyle.Round,
      });
    } else if (el.type === 'draw' && el.points?.length) {
      // one smooth path, same curve as the screen
      page.pushOperators(setLineJoin(LineJoinStyle.Round));
      page.drawSvgPath(strokePath(el.points, width, height), {
        x: 0, y: height,
        borderColor: hexToRgb(el.color), borderWidth: el.strokeWidth ?? DEFAULT_STROKE.draw,
        borderLineCap: LineCapStyle.Round,
      });
    }
  }

  // Text box: styled runs laid out like the editor (wrapping to the box unless it is a one-line
  // edit); unedited lines keep exactly the original width.
  async function drawText(el, page, width, height) {
    const lineHeight = el.lineHeight || 1.25;
    const boxW = (el.width || 0.3) * width;

    // Resolve each span's style and fonts, and split its text into pieces by the font that draws them.
    const items = [];
    for (const span of elementSpans(el)) {
      const st = resolveStyle(el, span);
      const fonts = { primary: await pdfFont(st.fontId), family: await familyFont(st.family, st.bold, st.italic) };
      const covers = (ch) => {
        const cp = ch.codePointAt(0);
        if (fonts.primary?.kit.hasGlyphForCodePoint(cp)) return fonts.primary.font;
        if (fonts.family.kit ? fonts.family.kit.hasGlyphForCodePoint(cp) : canEncode(fonts.family.font, ch)) return fonts.family.font;
        return null;
      };
      const needsFallback = [...span.text].some((ch) => ch !== '\n' && !covers(ch));
      if (needsFallback) {
        fallback = fallback || createUnicodeFallback(pdfDoc);
        await fallback.prepare(span.text, st.bold, st.italic);
      }
      items.push({ text: span.text, style: { ...st, covers, fonts } });
    }

    // pieces of one run of text: [{ text, font }] in drawing order
    const piecesCache = new WeakMap(); // style -> Map(text -> pieces)
    const piecesOf = (text, st) => {
      if (!piecesCache.has(st)) piecesCache.set(st, new Map());
      const cached = piecesCache.get(st).get(text);
      if (cached) return cached;
      const out = [];
      const fromFallback = (t) => {
        const { runs, missing } = fallback.split(t, st.bold, st.italic);
        missing.forEach((c) => replacedChars.add(c));
        for (const r of runs) out.push({ text: r.text, font: r.font || st.fonts.family.font });
      };
      // right-to-left text goes through the Unicode fonts as a whole, so it comes out in visual order
      if (fallback && isRtlDominant(text)) {
        fromFallback(text);
      } else {
        let pending = '';
        let pendingFont;
        const flush = () => {
          if (!pending) return;
          if (pendingFont) out.push({ text: pending, font: pendingFont });
          else if (fallback) fromFallback(pending);
          else {
            [...pending].forEach((c) => replacedChars.add(c));
            out.push({ text: '?'.repeat([...pending].length), font: st.fonts.family.font });
          }
          pending = '';
        };
        for (const ch of text) {
          const font = st.covers(ch);
          if (pending && font !== pendingFont) flush();
          pendingFont = font;
          pending += ch;
        }
        flush();
      }
      piecesCache.get(st).set(text, out);
      return out;
    };
    // Letter spacing and horizontal squeeze measured from the original line when it was opened
    // (PDF Tc and Tz). They stay the same while you type, exactly as the editor shows them.
    const hScale = el.hScale || 1;
    const fixedSpacing = typeof el.charSpacing === 'number' ? el.charSpacing : null;
    const natural = (text, st) => piecesOf(text, st).reduce((w, p) => w + p.font.widthOfTextAtSize(p.text, st.size), 0);
    const measure = (text, st) => (natural(text, st) + (fixedSpacing || 0) * [...text].length) * hScale;

    const lines = layoutRuns(items, measure, el.oneLine ? Infinity : boxW);
    // a one-line box grows with its text, so it is at least as wide as its longest line
    const alignW = el.oneLine ? Math.max(boxW, ...lines.map((l) => l.width)) : boxW;
    const orig = new Map((el.origLines || []).map((l) => [l.text, l.width]));

    let baseline = (1 - el.y) * height;
    lines.forEach((line, i) => {
      const lineSize = Math.max(...line.runs.map((r) => r.style.size), resolveStyle(el).size);
      baseline -= i === 0 ? lineSize * ASCENT : lineSize * lineHeight;
      if (!line.runs.length) return;
      const lineText = line.runs.map((r) => r.text).join('');
      const count = [...lineText].length;
      const rtl = isRtlDominant(lineText);
      // alignment inside the box, as the editor shows it (CSS text-align)
      const align = el.align || (rtl ? 'right' : 'left');
      const room = Math.max(0, alignW - line.width);
      let x = el.x * width + (align === 'right' ? room : align === 'center' ? room / 2 : 0);
      // justified: a wrapped line spreads its spaces to fill the box (the last line and lines that
      // end in a line break stay left-aligned)
      let gaps = 0;
      if (align === 'justify' && line.wrapped) {
        const inner = lineText.replace(/^ +/, '');
        gaps = (inner.match(/ /g) || []).length;
      }
      const perGap = gaps ? room / gaps : 0;
      let seenText = false;
      const anyOutline = line.runs.some((r) => piecesOf(r.text, r.style).some((p) => p.font.isOutline));
      let spacing = anyOutline ? 0 : fixedSpacing || 0;
      if (fixedSpacing === null && !anyOutline) {
        // older text boxes: an unedited line is stretched or squeezed to end where the original did
        const target = orig.get(lineText);
        if (target && count > 1) {
          spacing = Math.max(-lineSize * 0.1, Math.min(lineSize * 0.2, (target / hScale - line.width / hScale) / (count - 1)));
        }
      }
      const squeeze = hScale !== 1 && !anyOutline;
      if (spacing) page.pushOperators(setCharacterSpacing(spacing));
      if (squeeze) page.pushOperators(setCharacterSqueeze(hScale * 100));
      const k = squeeze ? hScale : 1;
      for (const r of line.runs) {
        for (const p of piecesOf(r.text, r.style)) {
          const advance = (t) => (p.font.widthOfTextAtSize(t, r.style.size) + spacing * [...t].length) * k;
          if (!perGap) {
            drawPiece(page, p, x, baseline, r.style, el.boost);
            x += advance(p.text);
            continue;
          }
          // justified: draw word by word, widening each space between words
          for (const part of p.text.split(/( +)/)) {
            if (!part) continue;
            if (part[0] === ' ') {
              x += advance(part) + (seenText ? perGap * part.length : 0);
            } else {
              drawPiece(page, { ...p, text: part }, x, baseline, r.style, el.boost);
              x += advance(part);
              seenText = true;
            }
          }
        }
      }
      if (spacing) page.pushOperators(setCharacterSpacing(0));
      if (squeeze) page.pushOperators(setCharacterSqueeze(100));
    });
  }

  // One piece of text in one font. An optional outline thickens strokes so a substitute font
  // matches a heavier original.
  function drawPiece(page, { text, font }, x, y, st, boost) {
    const color = hexToRgb(st.color);
    const size = st.size;
    if (font.isOutline) {
      // shaped scripts (Devanagari, CJK...): glyph outlines drawn as one vector path
      page.drawSvgPath(font.path(text, size), {
        x, y, color,
        ...(boost > 0 || font.synthBold ? { borderColor: color, borderWidth: boost > 0 ? boost : size * 0.03 } : {}),
      });
      return;
    }
    if (boost > 0) {
      page.pushOperators(setTextRenderingMode(TextRenderingMode.FillAndOutline), setLineWidth(boost), setStrokingColor(color));
      page.drawText(text, { x, y, size, font, color });
      page.pushOperators(setTextRenderingMode(TextRenderingMode.Fill));
    } else {
      page.drawText(text, { x, y, size, font, color });
    }
  }
}
