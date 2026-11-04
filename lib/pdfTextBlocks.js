// Editable text blocks for the PDF editor, built on the shared layout model (lib/pdfLayout.js).
//
// A block is a paragraph: consecutive lines with the same left edge, style and a normal
// line gap. It carries the real font family / weight / size / position so the editor can
// replace text in place instead of covering it with a generic box.
//
// All geometry in `layoutToBlocks` input is PDF points, y-down, origin top-left.
// Block output is expressed as page fractions (0..1) like the editor's elements.

export const ASCENT = 0.95; // baseline offset from the top of a text box, in font sizes (matches CSS line-height 1.2)

/** Map any font family name to the closest PDF standard font family. */
export function standardFamily(family = '') {
  const f = family.toLowerCase();
  if (/courier|mono|consolas|menlo|typewriter|lucida console/.test(f)) return 'Courier';
  if (/times|serif|georgia|garamond|cambria|palatino|bookman|minion|century|baskerville|didot/.test(f) && !/sans/.test(f)) {
    return 'Times';
  }
  return 'Helvetica';
}

const HEX = (h) => `#${String(h || '000000').replace('#', '').toLowerCase()}`;

function dominantRun(seg) {
  let best = seg.runs[0];
  for (const r of seg.runs) if (r.text.trim().length > best.text.trim().length) best = r;
  return best;
}

function segmentLine(seg) {
  const run = dominantRun(seg);
  const text = seg.runs.map((r) => r.text).join('').replace(/\s+$/, '');
  const styles = new Set(seg.runs.filter((r) => r.text.trim()).map((r) => `${r.family}|${r.bold}|${r.italic}`));
  return {
    text,
    x: seg.x,
    width: seg.width,
    baseline: seg.baseline,
    size: run.size,
    family: run.family,
    bold: run.bold,
    italic: run.italic,
    color: run.color,
    mixed: styles.size > 1,
  };
}

const sameStyle = (a, b) =>
  standardFamily(a.family) === standardFamily(b.family) &&
  a.bold === b.bold &&
  a.italic === b.italic &&
  Math.abs(a.size - b.size) <= Math.max(0.6, a.size * 0.06);

/**
 * Group layout segments into paragraph blocks.
 * @param {{width:number,height:number,segments:object[]}} layout
 * @param {string} idPrefix
 */
export function layoutToBlocks(layout, idPrefix = 'blk') {
  const { width: W, height: H } = layout;
  const lines = layout.segments
    .map(segmentLine)
    .filter((l) => l.text.trim().length > 0)
    .sort((a, b) => a.baseline - b.baseline || a.x - b.x);

  const paras = [];
  const used = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const para = [lines[i]];
    // follow the paragraph downwards
    for (;;) {
      const prev = para[para.length - 1];
      let next = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (used.has(j)) continue;
        const c = lines[j];
        const dy = c.baseline - prev.baseline;
        if (dy > prev.size * 2) break; // sorted by baseline: nothing further can match
        if (dy < prev.size * 0.8) continue; // same row (another column) or overlapping
        const first = para.length === 1;
        const dx = Math.abs(c.x - prev.x);
        const alignedLeft = dx <= prev.size * 0.5 || (first && dx <= prev.size * 3);
        const overlaps = c.x < prev.x + prev.width && c.x + c.width > prev.x;
        const gapOk = dy <= prev.size * 1.7;
        if (alignedLeft && overlaps && gapOk && sameStyle(prev, c)) { next = j; break; }
      }
      if (next < 0) break;
      used.add(next);
      para.push(lines[next]);
    }
    paras.push(para);
  }

  return paras.map((para, n) => {
    const first = para[0];
    const x0 = Math.min(...para.map((l) => l.x));
    const x1 = Math.max(...para.map((l) => l.x + l.width));
    const size = first.size;
    const spacing = para.length > 1 ? (para[para.length - 1].baseline - first.baseline) / (para.length - 1) : size * 1.2;
    const top = first.baseline - size * 0.92;
    const bottom = para[para.length - 1].baseline + size * 0.25;
    const mixed = para.some((l) => l.mixed);
    return {
      id: `${idPrefix}-${n}`,
      // overlay / whiteout area (fractions)
      x: Math.max(0, (x0 - 1) / W),
      y: Math.max(0, (top - 1) / H),
      width: Math.min(1, (x1 - x0 + 2) / W),
      height: Math.min(1, (bottom - top + 2) / H),
      // text box (fractions): top of the first line box and the text left edge
      textX: x0 / W,
      textY: (first.baseline - size * ASCENT) / H,
      textWidth: Math.min(1 - x0 / W, (x1 - x0) / W),
      str: para.map((l) => l.text).join('\n'),
      lines: para.map((l) => ({ text: l.text, width: l.width, x: l.x })),
      fontSize: Math.round(size * 10) / 10,
      lineHeight: Math.max(1, Math.min(2.2, spacing / size)),
      family: standardFamily(first.family),
      fontName: first.family,
      bold: first.bold,
      italic: first.italic,
      color: HEX(first.color),
      mixed,
    };
  });
}

/** Most common colour inside a pixel box of a canvas (the paper colour behind text). */
export function sampleBackground(imageData, box) {
  const { data, width: W, height: H } = imageData;
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(W, Math.ceil(box.x + box.w));
  const y1 = Math.min(H, Math.ceil(box.y + box.h));
  if (x1 <= x0 || y1 <= y0) return '#ffffff';
  const counts = new Map();
  const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 800)));
  let best = '#ffffff', bestN = 0;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      // quantise to 5 bits per channel so anti-aliasing noise collapses
      const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
      const e = counts.get(key);
      if (e) e.n++; else counts.set(key, { n: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
      const cur = counts.get(key);
      if (cur.n > bestN) {
        bestN = cur.n;
        best = '#' + [cur.r, cur.g, cur.b].map((v) => v.toString(16).padStart(2, '0')).join('');
      }
    }
  }
  return best;
}

/** Word-wrap one hard line to `maxWidth`; `widthOf(text)` measures a string in points. */
export function wrapLineBy(text, widthOf, maxWidth) {
  if (!text) return [''];
  if (widthOf(text) <= maxWidth) return [text];
  const out = [];
  let cur = '';
  for (const word of text.split(/(?<= )/)) { // keep the trailing space with each word
    const trial = cur + word;
    if (cur && widthOf(trial.trimEnd()) > maxWidth) {
      out.push(cur.trimEnd());
      cur = word;
    } else {
      cur = trial;
    }
  }
  if (cur) out.push(cur.trimEnd());
  return out;
}

/** Word-wrap one hard line using pdf-lib's font metrics. */
export function wrapLine(text, font, size, maxWidth) {
  return wrapLineBy(text, (t) => font.widthOfTextAtSize(t, size), maxWidth);
}

/** True when a WinAnsi standard font can draw every character of `text`. */
export function isEncodable(text, font) {
  for (const ch of text) {
    if (ch === '\n') continue;
    try { font.encodeText(ch); } catch { return false; }
  }
  return true;
}

/**
 * Make a string drawable with a WinAnsi standard font.
 * Returns the safe string and the set of characters that had to be replaced.
 */
export function toDrawable(text, font) {
  const bad = new Set();
  let out = '';
  for (const ch of text) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      const alt = { '‘': "'", '’': "'", '“': '"', '”': '"', '‑': '-', '−': '-', ' ': ' ' }[ch];
      if (alt) out += alt;
      else { out += '?'; bad.add(ch); }
    }
  }
  return { text: out, replaced: [...bad] };
}

const CSS_FAMILY = {
  Helvetica: 'Helvetica, Arial, sans-serif',
  Times: '"Times New Roman", Times, serif',
  Courier: '"Courier New", Courier, monospace',
};

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Darkest-ink colour of a region (anti-aliasing makes averages too light). */
export function sampleSolidInk(imageData, box, bgHex) {
  const { data, width: W, height: H } = imageData;
  const bg = hexToRgb(bgHex);
  const x0 = Math.max(0, Math.floor(box.x)), y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(W, Math.ceil(box.x + box.w)), y1 = Math.min(H, Math.ceil(box.y + box.h));
  const px = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4;
      const d = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
      if (d > 90) px.push([d, data[i], data[i + 1], data[i + 2]]);
    }
  }
  if (px.length < 4) return null;
  px.sort((a, b) => b[0] - a[0]);
  const top = px.slice(0, Math.max(3, Math.ceil(px.length * 0.04)));
  const m = [1, 2, 3].map((k) => Math.round(top.reduce((s, p) => s + p[k], 0) / top.length));
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare how much ink the original text has with how much our substitute font would
 * have, and return the extra outline width (PDF points) needed to match the weight.
 * Needs a DOM (canvas). `scale` = canvas pixels per PDF point.
 */
export function estimateWeightBoost(imageData, scale, block, bgHex, inkHex) {
  if (typeof document === 'undefined') return 0;
  const bg = hexToRgb(bgHex), ink = hexToRgb(inkHex);
  const span = Math.abs(ink[0] - bg[0]) + Math.abs(ink[1] - bg[1]) + Math.abs(ink[2] - bg[2]);
  if (span < 90) return 0;
  const { data, width: W, height: H } = imageData;
  const Wpt = W / scale, Hpt = H / scale;
  const bx = Math.floor(block.x * W), by = Math.floor(block.y * H);
  const bw = Math.ceil(block.width * W), bh = Math.ceil(block.height * H);
  let orig = 0;
  for (let y = Math.max(0, by); y < Math.min(H, by + bh); y++) {
    for (let x = Math.max(0, bx); x < Math.min(W, bx + bw); x++) {
      const i = (y * W + x) * 4;
      const d = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
      orig += Math.min(1, d / span);
    }
  }
  const c = document.createElement('canvas');
  c.width = bw; c.height = bh;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, bw, bh);
  ctx.fillStyle = '#000';
  ctx.font = `${block.italic ? 'italic ' : ''}${block.bold ? 'bold ' : ''}${block.fontSize * scale}px ${CSS_FAMILY[block.family] || CSS_FAMILY.Helvetica}`;
  ctx.textBaseline = 'alphabetic';
  const top = block.textY * Hpt; // pt; first line box top
  block.lines.forEach((l, i) => {
    const baseline = (top + block.fontSize * ASCENT + i * block.fontSize * block.lineHeight) * scale - by;
    const natural = ctx.measureText(l.text).width;
    const target = l.width * scale;
    ctx.fillText(l.text, l.x * scale - bx, baseline, natural > target ? target : undefined);
  });
  const mine = ctx.getImageData(0, 0, bw, bh).data;
  let ours = 0;
  for (let i = 0; i < mine.length; i += 4) ours += 1 - mine[i] / 255;
  if (ours < 5 || orig < 5) return 0;
  const ratio = orig / ours;
  if (ratio < 1.12) return 0;
  return Math.min(block.fontSize * 0.05, block.fontSize * 0.09 * (ratio - 1));
}
