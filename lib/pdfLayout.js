// Layout extraction: turns a pdf.js page into a plain geometric model that
// converters (Word, later Excel/PowerPoint and the editor) can share.
//
// All coordinates are in PDF points, origin top-left of the page (y grows down).
//
// Page model:
//   { width, height, segments, images, shapes, warnings, textChars }
//   shape:   { x, y, w, h, fill: 'RRGGBB' | null, stroke: 'RRGGBB' | null, strokeW }
//   segment: { x, baseline, width, size, runs: [{ text, fontName, family, bold, italic, size, color, width }] }
//   image:   { x, y, width, height, png: Uint8Array | null }
//
// Canvas (colour sampling, image decoding) is optional: without a DOM everything
// else still works and text defaults to black.

const hasDom = () => typeof document !== 'undefined';

// Words that pdf.js / PDF producers add around the real family name.
const SUBSET_PREFIX = /^[A-Z]{6}\+/;

export function parseFontName(rawName = '', cssFamily = '') {
  const name = rawName.replace(SUBSET_PREFIX, '');
  const lower = name.toLowerCase();
  const bold = /bold|black|heavy|semibold|demi/.test(lower) && !/semilight/.test(lower);
  const italic = /italic|oblique|ital\b|-it\b/.test(lower);
  let family = name
    .replace(/[-,_ ]?(bold|italic|oblique|regular|roman|black|heavy|semibold|demi|light|medium|mt|ps|psmt|std|pro)\b/gi, '')
    .replace(/[-,_]+$/, '')
    .trim();
  if (!family) family = cssFamily || 'sans-serif';
  return { family, bold, italic, cssFamily };
}

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = (r, g, b) =>
  [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('').toUpperCase();

/**
 * Estimate the ink colour inside a rectangle of a rendered page.
 * Background = most common colour; ink = mean of the pixels furthest from it.
 */
export function sampleInkColor(imageData, bbox) {
  const { data, width: W, height: H } = imageData;
  const x0 = Math.max(0, Math.floor(bbox.x));
  const y0 = Math.max(0, Math.floor(bbox.y));
  const x1 = Math.min(W, Math.ceil(bbox.x + bbox.w));
  const y1 = Math.min(H, Math.ceil(bbox.y + bbox.h));
  if (x1 <= x0 || y1 <= y0) return '000000';

  const buckets = new Map();
  const px = [];
  const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 600)));
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      px.push([r, g, b]);
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }
  if (!px.length) return '000000';

  let bgKey = 0, best = -1;
  for (const [k, n] of buckets) if (n > best) { best = n; bgKey = k; }
  const bg = [((bgKey >> 8) & 15) * 17, ((bgKey >> 4) & 15) * 17, (bgKey & 15) * 17];

  const dist = (p) => Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]);
  const ranked = px.map((p) => [dist(p), p]).sort((a, b) => b[0] - a[0]);
  if (ranked[0][0] < 60) return '000000'; // nothing distinguishable from the background

  const top = ranked.slice(0, Math.max(1, Math.ceil(ranked.length * 0.1)));
  const sum = top.reduce((s, [, p]) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]);
  return toHex(sum[0] / top.length, sum[1] / top.length, sum[2] / top.length);
}

// ---- images ---------------------------------------------------------------

function imageObjToPng(img) {
  if (!hasDom() || !img) return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (img.bitmap) {
    canvas.width = img.bitmap.width;
    canvas.height = img.bitmap.height;
    ctx.drawImage(img.bitmap, 0, 0);
  } else if (img.data && img.width && img.height) {
    canvas.width = img.width;
    canvas.height = img.height;
    const out = ctx.createImageData(img.width, img.height);
    const n = img.width * img.height;
    if (img.kind === 3 || img.data.length === n * 4) {
      out.data.set(img.data);
    } else if (img.kind === 2 || img.data.length === n * 3) {
      for (let i = 0, j = 0; i < n; i++, j += 3) {
        out.data[i * 4] = img.data[j];
        out.data[i * 4 + 1] = img.data[j + 1];
        out.data[i * 4 + 2] = img.data[j + 2];
        out.data[i * 4 + 3] = 255;
      }
    } else {
      return null; // 1-bit masks etc. - not worth guessing
    }
    ctx.putImageData(out, 0, 0);
  } else {
    return null;
  }
  return canvas;
}

function canvasToPngBytes(canvas) {
  const url = canvas.toDataURL('image/png');
  const bin = atob(url.slice(url.indexOf(',') + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function getObj(store, id) {
  return new Promise((resolve) => {
    try {
      const v = store.get(id, resolve);
      if (v !== undefined) resolve(v);
    } catch {
      resolve(null);
    }
  });
}

async function extractImages(page, viewport, pdfjs) {
  const { OPS, Util } = pdfjs;
  const ops = await page.getOperatorList();
  const images = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() || ctm;
    else if (fn === OPS.transform) ctm = Util.transform(ctm, args);
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const view = Util.transform(viewport.transform, ctm);
      // unit square -> view space; axis-aligned bbox
      const xs = [view[4], view[4] + view[0], view[4] + view[2], view[4] + view[0] + view[2]];
      const ys = [view[5], view[5] + view[1], view[5] + view[3], view[5] + view[1] + view[3]];
      const box = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
      let png = null;
      try {
        const obj = fn === OPS.paintInlineImageXObject ? args[0] : await getObj(page.objs, args[0]);
        const canvas = imageObjToPng(obj);
        if (canvas) png = canvasToPngBytes(canvas);
      } catch {
        png = null;
      }
      if (png && box.width > 1 && box.height > 1) images.push({ ...box, png });
    }
  }
  return images;
}


// ---- vector graphics (filled rectangles and straight rules) ------------------------

const MAX_SHAPES = 4000;

/**
 * Walk the operator list and collect axis-aligned filled rectangles and straight lines
 * (table borders, rules, shaded cells, bars). Curves are counted but not reproduced.
 * Returns { shapes: [{ x, y, w, h, fill, stroke, strokeW }], curves }.
 */
async function extractVectors(page, viewport, pdfjs) {
  const { OPS, Util } = pdfjs;
  const ops = await page.getOperatorList();
  const shapes = [];
  let curves = 0;
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let fill = '000000', stroke = '000000', lineW = 1;
  const hex = (v) => (typeof v === 'string' ? v.replace('#', '').toUpperCase() : null);

  const FILL = new Set([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
  const STROKE = new Set([OPS.stroke, OPS.closeStroke, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);

  const add = (x0, y0, x1, y1, fillC, strokeC, sw) => {
    const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
    if (w < 0.01 && h < 0.01) return;
    if (fillC === 'FFFFFF' && w > viewport.width * 0.98 && h > viewport.height * 0.98) return; // page background
    if (shapes.length < MAX_SHAPES) shapes.push({ x, y, w, h, fill: fillC, stroke: strokeC, strokeW: sw });
  };

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === OPS.save) stack.push([ctm, fill, stroke, lineW]);
    else if (fn === OPS.restore) { const st = stack.pop(); if (st) [ctm, fill, stroke, lineW] = st; }
    else if (fn === OPS.transform) ctm = Util.transform(ctm, args);
    else if (fn === OPS.setFillRGBColor) fill = hex(args[0]) || fill;
    else if (fn === OPS.setStrokeRGBColor) stroke = hex(args[0]) || stroke;
    else if (fn === OPS.setLineWidth) lineW = args[0];
    else if (fn === OPS.constructPath) {
      const paint = args[0];
      const doFill = FILL.has(paint), doStroke = STROKE.has(paint);
      if (!doFill && !doStroke) continue; // clip or no-op path
      const data = args[1] && args[1][0];
      if (!data) continue;
      const view = Util.transform(viewport.transform, ctm);
      const pt = (x, y) => [view[0] * x + view[2] * y + view[4], view[1] * x + view[3] * y + view[5]];
      const scale = Math.hypot(view[0], view[1]);
      const sw = Math.max(0.25, lineW * scale);
      const subs = [];
      let cur = null, k = 0;
      while (k < data.length) {
        const op = data[k++];
        if (op === 0) { cur = [pt(data[k], data[k + 1])]; subs.push(cur); k += 2; }
        else if (op === 1) { if (cur) cur.push(pt(data[k], data[k + 1])); k += 2; }
        else if (op === 2) { curves++; k += 6; cur = null; }
        else if (op === 3) { curves++; k += 4; cur = null; }
        else if (op === 4) { if (cur && cur.length > 2) cur.closed = true; }
        else break;
      }
      for (const sp of subs) {
        const n = sp.length;
        const axis = (a, b) => Math.abs(a[0] - b[0]) < 0.01 || Math.abs(a[1] - b[1]) < 0.01;
        const isRect = (n === 4 || (n === 5 && Math.hypot(sp[4][0] - sp[0][0], sp[4][1] - sp[0][1]) < 0.01)) &&
          axis(sp[0], sp[1]) && axis(sp[1], sp[2]) && axis(sp[2], sp[3]);
        if (isRect) { add(sp[0][0], sp[0][1], sp[2][0], sp[2][1], doFill ? fill : null, doStroke ? stroke : null, sw); continue; }
        // straight segments: strokes become hairline rectangles
        if (doStroke) {
          for (let j = 0; j + 1 < n; j++) {
            const a = sp[j], b = sp[j + 1];
            if (!axis(a, b)) { curves++; continue; }
            const horizontal = Math.abs(a[1] - b[1]) < 0.01;
            if (horizontal) add(a[0], a[1] - sw / 2, b[0], a[1] + sw / 2, stroke, null, 0);
            else add(a[0] - sw / 2, a[1], a[0] + sw / 2, b[1], stroke, null, 0);
          }
        } else if (n > 2) curves++;
      }
    }
  }
  return { shapes, curves };
}

// ---- text -----------------------------------------------------------------

// A list marker on its own: a bullet, "1.", "a)", "(iv)" ...
// (U+F0B7, U+F0A7, U+F0D8 are the Symbol / Wingdings bullets Word exports use)
const LIST_MARKER = /^\s*(?:[•‣⁃▪▫●○■□◦∙·–—*\-➢✓✔]|\(?\d{1,3}[.)]|\(?[a-zA-Z][.)]|\(?[ivxlcIVXLC]{1,6}[.)]|\(\d{1,3}\))\s*$/;

/**
 * @param {boolean} splitMarkers  also split a list marker (bullet, "1.") from the text after it when
 *   there is a visible gap, so editing the text never moves the marker or closes the gap.
 */
function buildSegments(items, styles, page, fontInfo, splitMarkers = false) {
  const runs = [];
  for (const it of items) {
    if (typeof it.str !== 'string' || it.str === '') continue;
    const [a, b, , d, e, f] = it.transform;
    const size = Math.hypot(it.transform[2], d);
    if (!size) continue;
    // pdf.js fills big horizontal jumps (columns, tab stops) with one wide space item.
    // Drop it so the jump shows up as a gap and the line gets split into segments.
    if (it.str.trim() === '' && it.width > size * 2.5) continue;
    const style = styles[it.fontName] || {};
    const info = fontInfo(it.fontName, style.fontFamily);
    runs.push({
      text: it.str,
      x: e,
      baseline: f,
      width: it.width,
      size,
      rotated: Math.abs(b) > 0.01 * Math.abs(a),
      // horizontal scaling (PDF Tz, or a squeezed text matrix): glyph width relative to height
      hScale: Math.round((Math.hypot(a, b) / size) * 1000) / 1000,
      ...info,
    });
  }

  // reading order: top -> bottom, then left -> right
  runs.sort((p, q) => (Math.abs(p.baseline - q.baseline) > Math.min(p.size, q.size) * 0.4 ? p.baseline - q.baseline : p.x - q.x));

  // group into lines by baseline
  const lines = [];
  for (const r of runs) {
    const line = lines.find((l) => Math.abs(l.baseline - r.baseline) <= Math.min(l.size, r.size) * 0.4);
    if (line) {
      line.runs.push(r);
      line.size = Math.max(line.size, r.size);
    } else {
      lines.push({ baseline: r.baseline, size: r.size, runs: [r] });
    }
  }

  // split each line into segments at big horizontal gaps (columns, tab stops)
  const segments = [];
  for (const line of lines) {
    line.runs.sort((p, q) => p.x - q.x);
    let seg = null;
    let contentEnd = 0; // right edge of the last non-blank run in this segment
    for (const r of line.runs) {
      const prev = seg && seg.runs[seg.runs.length - 1];
      const gap = prev ? r.x - (prev.x + prev.width) : 0;
      const blank = !r.text.trim();
      const afterMarker =
        splitMarkers && seg && !blank && r.x - contentEnd > line.size * 0.32 &&
        LIST_MARKER.test(seg.runs.map((q) => q.text).join(''));
      if (!seg || gap > line.size * 2.5 || gap < -line.size * 2 || afterMarker) {
        seg = { x: r.x, baseline: line.baseline, size: line.size, runs: [] };
        segments.push(seg);
      } else if (gap > line.size * 0.15 && !/\s$/.test(prev.text) && !/^\s/.test(r.text)) {
        // pdf.js sometimes omits the space item: restore it
        prev.text += ' ';
        prev.width += line.size * 0.25;
      }
      seg.runs.push({ ...r });
      if (!blank) contentEnd = r.x + r.width;
    }
  }

  for (const seg of segments) {
    if (splitMarkers) while (seg.runs.length > 1 && !seg.runs[seg.runs.length - 1].text.trim()) seg.runs.pop();
    const last = seg.runs[seg.runs.length - 1];
    seg.width = last.x + last.width - seg.x;
    seg.runs = mergeRuns(seg.runs);
  }
  return segments;
}

function mergeRuns(runs) {
  const out = [];
  for (const r of runs) {
    const p = out[out.length - 1];
    if (
      p && p.family === r.family && p.bold === r.bold && p.italic === r.italic && p.fontId === r.fontId &&
      Math.abs(p.size - r.size) < 0.3 && p.color === r.color
    ) {
      p.text += r.text;
      p.width = r.x + r.width - p.x;
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

// ---- public ---------------------------------------------------------------

/**
 * Extract the layout of one page.
 * @param {PDFPageProxy} page
 * @param {object} pdfjs   the pdfjs-dist module (for OPS and Util)
 * @param {{ colors?: boolean, images?: boolean, renderScale?: number }} opts
 */
export async function extractPageLayout(page, pdfjs, opts = {}) {
  const { colors = true, images: wantImages = true, renderScale = 2, rotation, splitMarkers = false } = opts;
  const vp = (scale) => (rotation === undefined ? page.getViewport({ scale }) : page.getViewport({ scale, rotation }));
  const viewport = vp(1);
  const warnings = [];

  const textContent = await page.getTextContent();

  // Operator list resolves the real font names and gives us images.
  let images = [];
  if (wantImages) {
    try {
      images = await extractImages(page, viewport, pdfjs);
    } catch (err) {
      warnings.push(`Images on this page could not be read (${err.message}).`);
    }
  } else {
    try { await page.getOperatorList(); } catch { /* font names fall back to CSS family */ }
  }

  let shapes = [];
  if (wantImages) {
    try {
      const v = await extractVectors(page, viewport, pdfjs);
      shapes = v.shapes;
      if (v.curves > 20) warnings.push('Curved vector graphics (charts, logos, diagrams) are not reproduced; straight lines and filled boxes are.');
    } catch {
      shapes = [];
    }
  }

  const fontCache = new Map();
  const fontInfo = (fontName, cssFamily) => {
    if (fontCache.has(fontName)) return fontCache.get(fontName);
    let raw = '';
    try {
      if (page.commonObjs.has(fontName)) raw = page.commonObjs.get(fontName)?.name || '';
    } catch { /* not resolved */ }
    // fontId: pdf.js's name for the loaded font (a FontFace on the page and an entry in commonObjs),
    // which lets the editor draw new text with the PDF's own embedded font
    const info = { ...parseFontName(raw || fontName, cssFamily), fontName: raw || fontName, fontId: fontName, color: '000000' };
    fontCache.set(fontName, info);
    return info;
  };

  // Transform text items into view space (y-down points)
  const items = textContent.items.map((it) => {
    if (typeof it.str !== 'string') return it;
    return { ...it, transform: pdfjs.Util.transform(viewport.transform, it.transform) };
  });

  const segments = buildSegments(items, textContent.styles || {}, page, fontInfo, splitMarkers);

  if (segments.some((s) => s.runs.some((r) => r.rotated))) {
    warnings.push('Rotated text was found; Word export places it horizontally.');
  }

  // Render once: gives ink colours for text and a fallback backdrop for pages with no text.
  let renderCanvas = null;
  if ((colors || !segments.length) && hasDom()) {
    try {
      renderCanvas = document.createElement('canvas');
      const rv = vp(renderScale);
      renderCanvas.width = Math.ceil(rv.width);
      renderCanvas.height = Math.ceil(rv.height);
      await page.render({ canvasContext: renderCanvas.getContext('2d', { willReadFrequently: true }), viewport: rv }).promise;
    } catch (err) {
      renderCanvas = null;
      warnings.push(`Text colours could not be read (${err.message}).`);
    }
  }

  if (renderCanvas && colors && segments.length) {
    const ctx = renderCanvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, renderCanvas.width, renderCanvas.height);
    for (const seg of segments) {
      for (const r of seg.runs) {
        r.color = sampleInkColor(imageData, {
          x: r.x * renderScale,
          y: (r.baseline - r.size * 0.8) * renderScale,
          w: r.width * renderScale,
          h: r.size * 0.95 * renderScale,
        });
      }
      seg.runs = mergeRuns(seg.runs);
    }
  }

  const textChars = segments.reduce((n, s) => n + s.runs.reduce((m, r) => m + r.text.trim().length, 0), 0);

  // No selectable text (scan): keep the page looking identical by using it as a picture.
  if (textChars === 0 && renderCanvas) {
    images = [{ x: 0, y: 0, width: viewport.width, height: viewport.height, png: canvasToPngBytes(renderCanvas) }];
    warnings.push('This page has no selectable text (likely a scan). It was kept as a picture; run OCR first to make it editable.');
  }

  return { width: viewport.width, height: viewport.height, segments, images, shapes, warnings, textChars };
}

export async function extractDocumentLayout(pdfDoc, pdfjs, opts = {}, onProgress) {
  const pages = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    pages.push(await extractPageLayout(page, pdfjs, opts));
    page.cleanup();
    onProgress?.(i, pdfDoc.numPages);
  }
  return pages;
}
