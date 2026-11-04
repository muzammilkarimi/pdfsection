// Paints laid-out DOM "page" elements into a real PDF with pdf-lib.
//
// The browser already did the layout (fonts, wrapping, tables, margins). We read
// the resulting geometry and re-draw it as vector text, rects and images, so the
// PDF keeps selectable text and matches what the browser showed.
//
// Input: <section> elements shaped like docx-preview pages - the element is the
// page (padding = margins), optional <header>/<footer> children are repeated on
// every page that results from slicing an overflowing section.

import { createUnicodeFallback } from '@/lib/unicodeFonts';
import { PDFDocument, StandardFonts, rgb, degrees, setCharacterSpacing, setWordSpacing } from 'pdf-lib';

const PX = 0.75; // CSS px -> PDF pt
const PAGE_TOLERANCE = 2; // px of overflow we forgive before starting a new page
const RASTER_SCALE = 3;

const px = (v) => parseFloat(v) || 0;

function parseColor(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[,/ ]+/).filter(Boolean).map(Number);
  return { r: r / 255, g: g / 255, b: b / 255, a };
}

// ---- fonts ----------------------------------------------------------------

const SERIF = /times|georgia|cambria|garamond|palatino|book antiqua|bookman|century|minion|serif/i;
const MONO = /courier|consolas|lucida console|monaco|mono/i;

function pickStandardFont(family, bold, italic) {
  const first = (family || '').split(',')[0].replace(/["']/g, '').trim();
  const isSans = /sans|arial|helvetica|calibri|verdana|tahoma|segoe|trebuchet/i.test(first);
  const kind = MONO.test(first) ? 'mono' : SERIF.test(first) && !isSans ? 'serif' : 'sans';
  const table = {
    sans: [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique],
    serif: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic],
    mono: [StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique],
  }[kind];
  return table[(bold ? 1 : 0) + (italic ? 2 : 0)];
}

const normalizeForPdf = (s) =>
  s.replace(/[   ]/g, ' ').replace(/\t/g, '    ').replace(/[​-‍﻿]/g, '');

// ---- collecting primitives -------------------------------------------------

let measureCtx = null;
function fontAscent(font) {
  measureCtx ||= document.createElement('canvas').getContext('2d');
  measureCtx.font = font;
  const m = measureCtx.measureText('Hxg');
  return m.fontBoundingBoxAscent ?? parseFloat(font.match(/([\d.]+)px/)?.[1] || 12) * 0.9;
}

function decorationOf(el, stop) {
  let underline = false, strike = false;
  for (let n = el; n && n !== stop; n = n.parentElement) {
    const d = getComputedStyle(n).textDecorationLine || '';
    if (d.includes('underline')) underline = true;
    if (d.includes('line-through')) strike = true;
  }
  return { underline, strike };
}

function splitIntoLines(node) {
  const text = node.nodeValue;
  const range = document.createRange();
  range.selectNodeContents(node);
  const whole = range.getClientRects();
  if (!whole.length) return [];

  // fast path: single line, no whitespace oddities
  if (whole.length === 1 && text === text.trim() && !/\s{2}|[\n\t]/.test(text)) {
    const r = whole[0];
    return [{ text, left: r.left, right: r.right, top: r.top, bottom: r.bottom }];
  }

  const lines = [];
  let cur = null;
  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getClientRects()[0];
    if (!r || (r.width === 0 && /\s/.test(text[i]))) continue; // collapsed whitespace
    const h = r.height || 1;
    // new line only when the vertical position changes (RTL text legitimately steps leftwards)
    if (!cur || Math.abs(r.top - cur.top) > h * 0.5) {
      cur = { chars: [], top: r.top, bottom: r.bottom, right: r.left };
      lines.push(cur);
    }
    cur.chars.push({ ch: text[i], left: r.left, right: r.right });
    cur.right = r.right;
  }
  return lines
    .map((l) => {
      const a = l.chars.findIndex((c) => /\S/.test(c.ch));
      if (a < 0) return null;
      let b = l.chars.length - 1;
      while (!/\S/.test(l.chars[b].ch)) b--;
      const used = l.chars.slice(a, b + 1);
      return {
        text: used.map((c) => c.ch).join(''),
        left: Math.min(...used.map((c) => c.left)),
        right: Math.max(...used.map((c) => c.right)),
        top: l.top,
        bottom: l.bottom,
      };
    })
    .filter(Boolean);
}

/**
 * Walk `root` and push drawing primitives (coordinates relative to `origin` rect)
 * into `out`. `units` collects unbreakable boxes used for pagination.
 */
function collect(root, origin, out, units, stop) {
  const rel = (r) => ({ x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height });

  const visit = (el, inRow) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;

    const isRow = el.tagName === 'TR';
    const rects = [...el.getClientRects()].filter((r) => r.width > 0 && r.height > 0);

    // explicit vector shape (used by the PowerPoint renderer): data-pdf-shape holds a JSON spec
    const shapeSpec = el.getAttribute && el.getAttribute('data-pdf-shape');
    if (shapeSpec && rects.length) {
      try { out.push({ kind: 'shape', ...rel(rects[0]), spec: JSON.parse(shapeSpec) }); } catch { /* ignore bad spec */ }
    }

    // background
    const bg = parseColor(cs.backgroundColor);
    if (bg && bg.a > 0) for (const r of rects) out.push({ kind: 'rect', ...rel(r), color: bg });

    // borders (block-level boxes only; inline borders are rare in Word output)
    if (!cs.display.startsWith('inline') && rects.length) {
      const r = rel(rects[0]);
      for (const side of ['Top', 'Bottom', 'Left', 'Right']) {
        const w = px(cs[`border${side}Width`]);
        const style = cs[`border${side}Style`];
        const color = parseColor(cs[`border${side}Color`]);
        if (w <= 0 || style === 'none' || style === 'hidden' || !color || color.a === 0) continue;
        const t = Math.max(w, 0.5);
        const box =
          side === 'Top' ? { x: r.x, y: r.y, w: r.w, h: t }
          : side === 'Bottom' ? { x: r.x, y: r.y + r.h - t, w: r.w, h: t }
          : side === 'Left' ? { x: r.x, y: r.y, w: t, h: r.h }
          : { x: r.x + r.w - t, y: r.y, w: t, h: r.h };
        out.push({ kind: 'rect', ...box, color });
      }
    }

    if (isRow && rects.length) units.push({ top: rel(rects[0]).y, bottom: rel(rects[0]).y + rects[0].height });

    if (el.tagName === 'IMG' && rects.length) {
      const r = rel(rects[0]);
      out.push({ kind: 'image', ...r, img: el, rot: Number(el.getAttribute('data-rot')) || 0 });
      if (!inRow) units.push({ top: r.y, bottom: r.y + r.h });
      return;
    }

    for (const child of el.childNodes) {
      if (child.nodeType === 1) visit(child, inRow || isRow);
      else if (child.nodeType === 3 && child.nodeValue && !/\S/.test(child.nodeValue)) {
        // whitespace-only: invisible, unless it carries an underline (tab leaders: dots, hyphens, underscores)
        const { underline } = decorationOf(el, stop);
        const r = document.createRange();
        r.selectNodeContents(child);
        const box = r.getClientRects()[0];
        if (underline && box && box.width > 2) {
          const fontSize = px(cs.fontSize);
          out.push({
            kind: 'rule',
            x: box.left - origin.left,
            y: box.top - origin.top,
            w: box.width,
            baseline: box.top - origin.top + fontAscent(`${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`),
            fontSize,
            dotted: cs.textDecorationStyle === 'dotted',
            color: parseColor(cs.color) || { r: 0, g: 0, b: 0, a: 1 },
          });
        }
      } else if (child.nodeType === 3 && /\S/.test(child.nodeValue)) {
        const deco = decorationOf(el, stop);
        const fontSize = px(cs.fontSize);
        const weight = cs.fontWeight;
        const bold = weight === 'bold' || parseInt(weight, 10) >= 600;
        const italic = cs.fontStyle === 'italic' || cs.fontStyle === 'oblique';
        const cssFont = `${cs.fontStyle} ${weight} ${fontSize}px ${cs.fontFamily}`;
        const ascent = fontAscent(cssFont);
        const color = parseColor(cs.color) || { r: 0, g: 0, b: 0, a: 1 };

        for (const line of splitIntoLines(child)) {
          let text = line.text;
          if (cs.textTransform === 'uppercase') text = text.toUpperCase();
          else if (cs.textTransform === 'lowercase') text = text.toLowerCase();
          const top = line.top - origin.top;
          out.push({
            kind: 'text',
            text,
            x: line.left - origin.left,
            y: top,
            w: line.right - line.left,
            h: line.bottom - line.top,
            baseline: top + ascent,
            fontSize,
            family: cs.fontFamily,
            cssFont,
            rtl: cs.direction === 'rtl',
            justify: cs.textAlign === 'justify',
            bold,
            italic,
            color,
            ...deco,
          });
          if (!inRow) units.push({ top, bottom: line.bottom - origin.top });
        }
      }
    }
  };

  visit(root, false);
}

// ---- images ---------------------------------------------------------------

function dataUrlBytes(url) {
  const bin = atob(url.slice(url.indexOf(',') + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function embedImage(pdfDoc, img, cache) {
  const src = img.currentSrc || img.src;
  if (cache.has(src)) return cache.get(src);
  let embedded = null;
  try {
    if (img.decode) await img.decode().catch(() => {});
    if (/^data:image\/jpe?g/i.test(src)) embedded = await pdfDoc.embedJpg(dataUrlBytes(src));
    else if (/^data:image\/png/i.test(src)) embedded = await pdfDoc.embedPng(dataUrlBytes(src));
    else if (img.naturalWidth) {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      embedded = await pdfDoc.embedPng(dataUrlBytes(c.toDataURL('image/png')));
    }
  } catch {
    embedded = null;
  }
  cache.set(src, embedded);
  return embedded;
}

// ---- drawing --------------------------------------------------------------

// ---- vector shapes --------------------------------------------------------

const arc = (cx, cy, rx, ry, a0, a1, n = 10) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });

// Outline of a preset geometry in a w x h box (y down). Returns an array of polylines.
function geometry(geom, w, h, adj) {
  const m = Math.min(w, h);
  switch (geom) {
    case 'ellipse': return [arc(w / 2, h / 2, w / 2, h / 2, 0, Math.PI * 2, 72)];
    case 'roundRect': case 'round2SameRect': case 'snipRoundRect': {
      const r = Math.min(m / 2, m * (adj ?? 0.16667));
      return [[
        ...arc(w - r, r, r, r, -Math.PI / 2, 0), ...arc(w - r, h - r, r, r, 0, Math.PI / 2),
        ...arc(r, h - r, r, r, Math.PI / 2, Math.PI), ...arc(r, r, r, r, Math.PI, Math.PI * 1.5),
      ]];
    }
    case 'triangle': return [[[w * (adj ?? 0.5), 0], [w, h], [0, h]]];
    case 'rtTriangle': return [[[0, 0], [0, h], [w, h]]];
    case 'diamond': return [[[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]];
    case 'parallelogram': { const o = Math.min(w, m * (adj ?? 0.25)); return [[[o, 0], [w, 0], [w - o, h], [0, h]]]; }
    case 'trapezoid': { const o = m * (adj ?? 0.25); return [[[o, 0], [w - o, 0], [w, h], [0, h]]]; }
    case 'hexagon': { const o = Math.min(w / 2, m * (adj ?? 0.25)); return [[[o, 0], [w - o, 0], [w, h / 2], [w - o, h], [o, h], [0, h / 2]]]; }
    case 'pentagon': case 'homePlate': { const o = Math.min(w, m * (adj ?? 0.5)); return [[[0, 0], [w - o, 0], [w, h / 2], [w - o, h], [0, h]]]; }
    case 'chevron': { const o = Math.min(w, m * (adj ?? 0.5)); return [[[0, 0], [w - o, 0], [w, h / 2], [w - o, h], [0, h], [o, h / 2]]]; }
    case 'rightArrow': { const t = h * 0.25, hd = Math.min(w, h * 0.5); return [[[0, t], [w - hd, t], [w - hd, 0], [w, h / 2], [w - hd, h], [w - hd, h - t], [0, h - t]]]; }
    case 'leftArrow': { const t = h * 0.25, hd = Math.min(w, h * 0.5); return [[[w, t], [hd, t], [hd, 0], [0, h / 2], [hd, h], [hd, h - t], [w, h - t]]]; }
    case 'upArrow': { const t = w * 0.25, hd = Math.min(h, w * 0.5); return [[[t, h], [t, hd], [0, hd], [w / 2, 0], [w, hd], [w - t, hd], [w - t, h]]]; }
    case 'downArrow': { const t = w * 0.25, hd = Math.min(h, w * 0.5); return [[[t, 0], [t, h - hd], [0, h - hd], [w / 2, h], [w, h - hd], [w - t, h - hd], [w - t, 0]]]; }
    case 'plus': case 'mathPlus': { const a = Math.min(w, h) * 0.33; return [[[a, 0], [w - a, 0], [w - a, a], [w, a], [w, h - a], [w - a, h - a], [w - a, h], [a, h], [a, h - a], [0, h - a], [0, a], [a, a]]]; }
    case 'star5': {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.38 : 1;
        pts.push([w / 2 + (w / 2) * r * Math.cos(a), h / 2 + (h / 2) * r * Math.sin(a)]);
      }
      return [pts];
    }
    case 'line': case 'straightConnector1': case 'bentConnector3': return [[[0, 0], [w, h]]];
    default: return [[[0, 0], [w, 0], [w, h], [0, h]]]; // rect and anything unsupported
  }
}

function drawShape(page, p, pageH) {
  const { spec, w, h } = p;
  const lines = geometry(spec.geom, w, h, spec.adj);
  const cx = w / 2, cy = h / 2;
  const th = ((spec.rot || 0) * Math.PI) / 180;
  const cos = Math.cos(th), sin = Math.sin(th);
  const place = ([x, y]) => {
    if (spec.flipH) x = w - x;
    if (spec.flipV) y = h - y;
    const dx = x - cx, dy = y - cy;
    return [(p.x + cx + dx * cos - dy * sin) * PX, (p.y + cy + dx * sin + dy * cos) * PX];
  };
  const open = spec.geom === 'line' || spec.geom === 'straightConnector1' || spec.geom === 'bentConnector3';
  const fill = !open && spec.fill ? spec.fill : null;
  const stroke = spec.stroke || null;
  if (!fill && !stroke) return;
  for (const pts of lines) {
    const d = pts.map((pt, i) => `${i ? 'L' : 'M'} ${place(pt).map((n) => n.toFixed(2)).join(' ')}`).join(' ') + (open ? '' : ' Z');
    const t = stroke ? Math.max(0.25, stroke.width * PX) : 0;
    page.drawSvgPath(d, {
      x: 0,
      y: pageH * PX,
      ...(fill ? { color: rgb(fill.r, fill.g, fill.b), opacity: fill.a } : {}),
      ...(stroke ? {
        borderColor: rgb(stroke.r, stroke.g, stroke.b),
        borderWidth: t,
        borderOpacity: stroke.a,
        ...(stroke.dash === 'dot' ? { borderDashArray: [t, t * 2] } : stroke.dash ? { borderDashArray: [t * 4, t * 3] } : {}),
      } : {}),
    });
  }
}

async function drawPrims(pdfDoc, page, prims, pageH, ctx) {
  const { fonts, images } = ctx;
  const Y = (y) => (pageH - y) * PX;
  const order = { rect: 0, image: 1, shape: 1, text: 2, rule: 2 };
  prims = [...prims].sort((a, b) => order[a.kind] - order[b.kind]);

  for (const p of prims) {
    if (p.kind === 'rect') {
      page.drawRectangle({
        x: p.x * PX,
        y: Y(p.y + p.h),
        width: p.w * PX,
        height: p.h * PX,
        color: rgb(p.color.r, p.color.g, p.color.b),
        opacity: p.color.a,
      });
    } else if (p.kind === 'image') {
      const emb = await embedImage(pdfDoc, p.img, images);
      if (emb) {
        const w = p.w * PX, h = p.h * PX;
        if (p.rot) {
          // PDF rotates about the bottom-left corner; rotate about the centre instead
          const th = (-p.rot * Math.PI) / 180;
          const cx = (p.x + p.w / 2) * PX, cy = Y(p.y + p.h / 2);
          const x = cx - (Math.cos(th) * (w / 2) - Math.sin(th) * (h / 2));
          const y = cy - (Math.sin(th) * (w / 2) + Math.cos(th) * (h / 2));
          page.drawImage(emb, { x, y, width: w, height: h, rotate: degrees(-p.rot) });
        } else {
          page.drawImage(emb, { x: p.x * PX, y: Y(p.y + p.h), width: w, height: h });
        }
      }
    } else if (p.kind === 'shape') {
      drawShape(page, p, pageH);
    } else if (p.kind === 'text') {
      await drawText(pdfDoc, page, p, Y, fonts, ctx);
    } else if (p.kind === 'rule') {
      const t = Math.max(0.5, p.fontSize * PX * 0.07);
      const y = Y(p.baseline) - p.fontSize * PX * 0.14;
      page.drawLine({
        start: { x: p.x * PX, y },
        end: { x: (p.x + p.w) * PX, y },
        thickness: t,
        color: rgb(p.color.r, p.color.g, p.color.b),
        ...(p.dotted ? { dashArray: [0.1, t * 2.5], lineCap: 1 } : {}),
      });
    }
  }
}

async function drawText(pdfDoc, page, p, Y, fonts, ctx) {
  const text = normalizeForPdf(p.text);
  if (!text) return;
  const color = rgb(p.color.r, p.color.g, p.color.b);
  const size = p.fontSize * PX;

  const key = pickStandardFont(p.family, p.bold, p.italic);
  if (!fonts.has(key)) fonts.set(key, await pdfDoc.embedFont(key));
  const font = fonts.get(key);

  let width;
  try {
    width = font.widthOfTextAtSize(text, size);
  } catch {
    width = null; // characters the standard fonts can't encode (non-Latin, emoji...)
  }

  // Characters outside WinAnsi (Cyrillic, Greek, Devanagari...): real, selectable text from the
  // bundled Unicode fonts. Anything those can't draw (CJK, Arabic) is rasterised below.
  let drawnWithUnicode = false;
  if (width === null || p.rtl) {
    try {
      ctx.fallback = ctx.fallback || createUnicodeFallback(pdfDoc);
      await ctx.fallback.prepare(text, p.bold, p.italic);
      const { runs, missing } = ctx.fallback.split(text, p.bold, p.italic);
      if (runs.length && !missing.size && runs.every((r) => r.font)) {
        const total = runs.reduce((w, r) => w + r.font.widthOfTextAtSize(r.text, size), 0);
        let cx = p.x * PX + (p.rtl ? Math.max(0, p.w * PX - total) : 0); // right-to-left lines hug the right edge
        for (const r of runs) {
          if (r.font.isOutline) {
            page.drawSvgPath(r.font.path(r.text, size), {
              x: cx, y: Y(p.baseline), color,
              ...(r.font.synthBold ? { borderColor: color, borderWidth: size * 0.03 } : {}),
            });
          }
          else page.drawText(r.text, { x: cx, y: Y(p.baseline), size, font: r.font, color });
          cx += r.font.widthOfTextAtSize(r.text, size);
        }
        drawnWithUnicode = true;
      }
    } catch {
      drawnWithUnicode = false; // fall through to the raster path
    }
  }

  if (drawnWithUnicode) {
    // handled
  } else if (width === null || p.rtl) {
    // Rasterise just this line so the glyphs still appear exactly as the browser drew them.
    const c = document.createElement('canvas');
    c.width = Math.ceil(p.w * RASTER_SCALE) + 2;
    c.height = Math.ceil(p.h * RASTER_SCALE) + 2;
    const g = c.getContext('2d');
    g.scale(RASTER_SCALE, RASTER_SCALE);
    g.font = p.cssFont;
    g.direction = p.rtl ? 'rtl' : 'ltr';
    g.fillStyle = `rgb(${p.color.r * 255},${p.color.g * 255},${p.color.b * 255})`;
    g.textAlign = p.rtl ? 'right' : 'left';
    g.fillText(p.text, p.rtl ? p.w : 0, p.baseline - p.y);
    const emb = await pdfDoc.embedPng(dataUrlBytes(c.toDataURL('image/png')));
    page.drawImage(emb, { x: p.x * PX, y: Y(p.y + p.h), width: p.w * PX, height: p.h * PX });
  } else {
    // Fit the standard font to the width the browser's font occupied.
    const extra = p.w * PX - width;
    const spaces = (text.match(/ /g) || []).length;
    if (p.justify && spaces > 0 && extra > 0) {
      // justified text: the browser stretched the gaps between words, so do the same
      page.pushOperators(setWordSpacing(Math.min(extra / spaces, size * 3)));
      page.drawText(text, { x: p.x * PX, y: Y(p.baseline), size, font, color });
      page.pushOperators(setWordSpacing(0));
    } else {
      const spacing = text.length > 1 ? extra / text.length : 0;
      page.pushOperators(setCharacterSpacing(Math.max(-size * 0.2, Math.min(size * 0.5, spacing))));
      page.drawText(text, { x: p.x * PX, y: Y(p.baseline), size, font, color });
      page.pushOperators(setCharacterSpacing(0));
    }
  }

  const lineW = Math.max(0.5, size * 0.06);
  if (p.underline) {
    page.drawRectangle({ x: p.x * PX, y: Y(p.baseline) - size * 0.14, width: p.w * PX, height: lineW, color });
  }
  if (p.strike) {
    page.drawRectangle({ x: p.x * PX, y: Y(p.baseline) + size * 0.28, width: p.w * PX, height: lineW, color });
  }
}

// ---- public ---------------------------------------------------------------

/**
 * @param {HTMLElement[]} sections  laid-out page elements (must be attached & visible to layout)
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function sectionsToPdf(sections, { onProgress, fixedPages = false } = {}) {
  const pdfDoc = await PDFDocument.create();
  const ctx = { fonts: new Map(), images: new Map() };

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s];
    const cs = getComputedStyle(section);
    const rect = section.getBoundingClientRect();
    const pageW = rect.width;
    const pageH = px(cs.minHeight) || rect.height;
    const padBottom = px(cs.paddingBottom);

    const body = [], head = [], foot = [];
    const units = [];
    let articleTop = px(cs.paddingTop);

    for (const child of section.children) {
      const tag = child.tagName;
      if (tag === 'HEADER') collect(child, rect, head, [], section);
      else if (tag === 'FOOTER') collect(child, rect, foot, [], section);
      else {
        if (tag === 'ARTICLE') articleTop = child.getBoundingClientRect().top - rect.top;
        collect(child, rect, body, units, section);
      }
    }

    // Slice an overflowing section into pages at line / table-row boundaries.
    const windowH = pageH - padBottom - articleTop;
    const starts = [articleTop];
    let limit = articleTop + windowH;
    units.sort((a, b) => a.top - b.top);
    for (const u of units) {
      if (!fixedPages && u.bottom > limit + PAGE_TOLERANCE && u.top > starts[starts.length - 1] + 1) {
        starts.push(u.top);
        limit = u.top + windowH;
      }
    }

    const pageOf = (y) => {
      let i = 0;
      while (i + 1 < starts.length && y + 0.5 >= starts[i + 1]) i++;
      return i;
    };

    const sectionH = rect.height;
    for (let i = 0; i < starts.length; i++) {
      const page = pdfDoc.addPage([pageW * PX, pageH * PX]);
      const shift = (p) => ({ ...p, y: p.y - starts[i] + articleTop, baseline: p.baseline != null ? p.baseline - starts[i] + articleTop : undefined });
      const mine = body.filter((p) => pageOf(p.y) === i).map(shift);
      // footer is anchored to the section bottom -> anchor to this page's bottom
      const footer = foot.map((p) => {
        const dy = pageH - sectionH;
        return { ...p, y: p.y + dy, baseline: p.baseline != null ? p.baseline + dy : undefined };
      });
      await drawPrims(pdfDoc, page, [...head, ...mine, ...footer], pageH, ctx);
    }
    onProgress?.(s + 1, sections.length);
  }

  return pdfDoc.save();
}

// ---- generated content (list markers, counters) ----------------------------
// ::before/::marker aren't DOM nodes, so geometry can't be read from them. Before
// painting we replace them with real spans that carry the same computed style.

const ROMAN = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];

function formatCounter(n, style) {
  const alpha = (v) => {
    let s = '';
    for (let k = v; k > 0; k = Math.floor((k - 1) / 26)) s = String.fromCharCode(97 + ((k - 1) % 26)) + s;
    return s;
  };
  const roman = (v) => ROMAN.reduce((acc, [val, sym]) => { while (v >= val) { acc += sym; v -= val; } return acc; }, '');
  switch (style) {
    case 'lower-alpha': return n > 0 ? alpha(n) : String(n);
    case 'upper-alpha': return n > 0 ? alpha(n).toUpperCase() : String(n);
    case 'lower-roman': return n > 0 ? roman(n) : String(n);
    case 'upper-roman': return n > 0 ? roman(n).toUpperCase() : String(n);
    case 'decimal-leading-zero': return String(n).padStart(2, '0');
    case 'none': return '';
    default: return String(n);
  }
}

function parseCounterList(value) {
  const out = [];
  const toks = (value || '').trim().split(/\s+/).filter((t) => t && t !== 'none');
  for (let i = 0; i < toks.length; i++) {
    const name = toks[i];
    const num = Number(toks[i + 1]);
    if (toks[i + 1] !== undefined && !Number.isNaN(num)) { out.push([name, num]); i++; } else out.push([name, null]);
  }
  return out;
}

// Resolve a computed `content` value such as `"" counter(x, decimal) "."` to text.
function resolveContent(content, counters) {
  if (!content || content === 'none' || content === 'normal') return null;
  let out = '';
  const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|counter\(\s*([^,)\s]+)\s*(?:,\s*([^)\s]+))?\s*\)/g;
  let m;
  while ((m = re.exec(content))) {
    if (m[1] !== undefined || m[2] !== undefined) {
      out += (m[1] ?? m[2]).replace(/\\([0-9a-f]{1,6})\s?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
    } else {
      out += formatCounter(counters.get(m[3]) ?? 0, m[4] || 'decimal');
    }
  }
  return out;
}

function cloneComputedStyle(target, cs, skip = []) {
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i];
    if (skip.includes(prop)) continue;
    target.style.setProperty(prop, cs.getPropertyValue(prop));
  }
}

const MARKER_GLYPH = { disc: '•', circle: '◦', square: '▪' };

export function materializeGeneratedContent(roots) {
  const style = document.createElement('style');
  style.textContent = '[data-pdf-nobefore]::before{content:none!important}[data-pdf-nomarker]{list-style-type:none!important}';
  document.head.appendChild(style);

  const counters = new Map();
  const apply = (list, mode) => {
    for (const [name, v] of list) {
      if (mode === 'inc') counters.set(name, (counters.get(name) ?? 0) + (v ?? 1));
      else counters.set(name, v ?? 0);
    }
  };

  const SKIP = ['content', 'counter-increment', 'counter-set', 'counter-reset', 'display', 'position', 'float'];

  for (const root of roots) {
    const all = [root, ...root.querySelectorAll('*')];
    for (const el of all) {
      const cs = getComputedStyle(el);
      apply(parseCounterList(cs.counterReset), 'set');
      apply(parseCounterList(cs.counterSet), 'set');
      apply(parseCounterList(cs.counterIncrement), 'inc');

      const before = getComputedStyle(el, '::before');
      const text = resolveContent(before.content, counters);
      apply(parseCounterList(before.counterIncrement), 'inc');
      // counters are bumped before the pseudo's content is rendered
      const resolved = text === null ? null : resolveContent(before.content, counters);

      if (resolved !== null && resolved !== '' && before.display !== 'none') {
        const span = document.createElement('span');
        cloneComputedStyle(span, before, SKIP);
        span.style.display = before.display === 'inline-block' ? 'inline-block' : 'inline';
        span.style.whiteSpace = 'pre';
        span.textContent = resolved;
        el.setAttribute('data-pdf-nobefore', '');
        el.insertBefore(span, el.firstChild);
      }

      if (cs.display === 'list-item' && cs.listStyleType !== 'none' && cs.listStylePosition === 'inside') {
        const glyph = MARKER_GLYPH[cs.listStyleType];
        const marker = getComputedStyle(el, '::marker');
        const label = glyph !== undefined ? `${glyph} ` : null;
        if (label) {
          const span = document.createElement('span');
          span.style.whiteSpace = 'pre';
          span.style.color = marker.color;
          span.textContent = label;
          el.setAttribute('data-pdf-nomarker', '');
          el.insertBefore(span, el.firstChild);
        }
      }
    }
  }

  return () => style.remove();
}
