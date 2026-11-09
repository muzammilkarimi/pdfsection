// Turns a design into a PDF with pdf-lib: real embedded fonts and vector shapes, not a screenshot.
// Images (PNG/JPG) are made by rendering that PDF with pdf.js, so they match it exactly.

import 'regenerator-runtime/runtime'; // fontkit's Indic shaper expects this global
import {
  PDFDocument,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  concatTransformationMatrix,
  setCharacterSpacing,
  rectangle,
  clip,
  endPath,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PX, MM, effectiveStyle, shapePath } from '@/lib/designModel';
import { fontFileUrl, loadFontsFor } from '@/lib/designFonts';
import { measureTextLines } from '@/lib/designTextLayout';
import { createUnicodeFallback, createOutlineFont, isRtlDominant } from '@/lib/unicodeFonts';
import { loadPdfForRender } from '@/lib/renderUtils';

const hexToRgb = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
};

const BLEED = 3 * MM;
const MARK_LENGTH = 5 * MM;
const MARK_GAP = 1 * MM; // crop marks start this far outside the bleed

class FontBook {
  constructor(pdfDoc, keepSelectable) {
    this.pdfDoc = pdfDoc;
    this.keepSelectable = keepSelectable;
    this.cache = new Map();
    this.fallback = null;
    this.replaced = new Set();
    pdfDoc.registerFontkit(fontkit);
  }

  get(id, bold, italic) {
    const key = `${id}-${bold}-${italic}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, (async () => {
        const res = await fetch(fontFileUrl(id, bold, italic));
        if (!res.ok) throw new Error('A font could not be loaded. Check your connection and try again.');
        const bytes = new Uint8Array(await res.arrayBuffer());
        const kit = fontkit.create(bytes);
        const drawn = this.keepSelectable ? await this.pdfDoc.embedFont(bytes, { subset: true }) : createOutlineFont(kit);
        return { kit, drawn };
      })());
    }
    return this.cache.get(key);
  }

  /** Splits a line into runs of one font each, in drawing order. */
  async runsFor(line, el) {
    const { bold, italic } = effectiveStyle(el);
    const { kit, drawn } = await this.get(el.font, bold, italic);
    const viaFallback = async (text) => {
      this.fallback = this.fallback || createUnicodeFallback(this.pdfDoc);
      await this.fallback.prepare(text, bold, italic);
      const { runs, missing } = this.fallback.split(text, bold, italic);
      missing.forEach((c) => this.replaced.add(c));
      return runs.filter((r) => r.font);
    };

    // Right-to-left text needs whole-line reordering, so the fallback handles all of it.
    if (isRtlDominant(line)) return viaFallback(line);

    const parts = [];
    for (const ch of line) {
      const own = ch === ' ' || kit.hasGlyphForCodePoint(ch.codePointAt(0));
      const last = parts[parts.length - 1];
      if (last && (last.own === own || ch === ' ')) last.text += ch;
      else parts.push({ own, text: ch });
    }
    const runs = [];
    for (const part of parts) {
      if (part.own) runs.push({ text: part.text, font: drawn });
      else runs.push(...(await viaFallback(part.text)));
    }
    return runs;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('An image in the design could not be read'));
    img.src = src;
  });
}

/** Crops an image to its box (like object-fit: cover) and scales it to the chosen DPI. */
async function imageBytes(el, src, dpi) {
  const img = await loadImage(src);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const boxRatio = el.w / el.h;
  const cropW = Math.min(iw, ih * boxRatio);
  const cropH = cropW / boxRatio;
  const outW = Math.max(1, Math.round(Math.min(cropW, (el.w / 72) * dpi)));
  const outH = Math.max(1, Math.round(outW / boxRatio));
  const isJpeg = src.startsWith('data:image/jpeg');

  if (Math.abs(cropW - iw) < 1 && Math.abs(cropH - ih) < 1 && outW >= iw - 1) {
    const raw = atob(src.slice(src.indexOf(',') + 1));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return { bytes, isJpeg };
  }
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (iw - cropW) / 2, (ih - cropH) / 2, cropW, cropH, 0, 0, outW, outH);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, isJpeg ? 'image/jpeg' : 'image/png', 0.92));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), isJpeg };
}

function drawCropMarks(page, ox, oy, w, h) {
  const start = BLEED + MARK_GAP;
  const options = { thickness: 0.25, color: rgb(0, 0, 0) };
  for (const x of [ox, ox + w]) {
    for (const [y, dir] of [[oy, -1], [oy + h, 1]]) {
      page.drawLine({ start: { x, y: y + dir * start }, end: { x, y: y + dir * (start + MARK_LENGTH) }, ...options });
    }
  }
  for (const y of [oy, oy + h]) {
    for (const [x, dir] of [[ox, -1], [ox + w, 1]]) {
      page.drawLine({ start: { x: x + dir * start, y }, end: { x: x + dir * (start + MARK_LENGTH), y }, ...options });
    }
  }
}

async function drawText(page, el, left, top, fonts) {
  const { bold, italic } = effectiveStyle(el);
  await loadFontsFor(el.font, bold, italic, el.text);
  const color = hexToRgb(el.color);
  for (const line of measureTextLines(el)) {
    const y = top - line.baseline;
    let x = left + line.x;
    for (const run of await fonts.runsFor(line.text, el)) {
      const width = run.font.widthOfTextAtSize(run.text, el.size);
      if (run.font.isOutline) {
        const thicken = run.font.synthBold ? { borderColor: color, borderWidth: el.size * 0.03, borderOpacity: el.opacity } : {};
        page.drawSvgPath(run.font.path(run.text, el.size), { x, y, color, opacity: el.opacity, ...thicken });
        x += width;
      } else {
        if (el.letterSpacing) page.pushOperators(setCharacterSpacing(el.letterSpacing));
        page.drawText(run.text, { x, y, size: el.size, font: run.font, color, opacity: el.opacity });
        if (el.letterSpacing) page.pushOperators(setCharacterSpacing(0));
        x += width + el.letterSpacing * [...run.text].length;
      }
    }
  }
}

async function drawElement(page, el, ctx) {
  const left = ctx.ox + el.x;
  const top = ctx.oy + ctx.height - el.y;
  const rotated = !!el.rotation;
  if (rotated) {
    // Rotates clockwise on screen, around the element's center; PDF angles run counter-clockwise.
    const angle = (-el.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const cx = left + el.w / 2;
    const cy = top - el.h / 2;
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(cos, sin, -sin, cos, cx - cos * cx + sin * cy, cy - sin * cx - cos * cy));
  }

  if (el.type === 'text') {
    await drawText(page, el, left, top, ctx.fonts);
  } else if (el.type === 'shape') {
    const options = { x: left, y: top, opacity: el.opacity, borderOpacity: el.opacity };
    if (el.fill) options.color = hexToRgb(el.fill);
    if (el.stroke && el.strokeWidth > 0) {
      options.borderColor = hexToRgb(el.stroke);
      options.borderWidth = el.strokeWidth;
    }
    if (options.color || options.borderColor) page.drawSvgPath(shapePath(el), options);
  } else if (el.type === 'image' && ctx.assets?.[el.assetId]) {
    const key = `${el.assetId}:${el.w.toFixed(1)}:${el.h.toFixed(1)}`;
    if (!ctx.images.has(key)) {
      const { bytes, isJpeg } = await imageBytes(el, ctx.assets[el.assetId], ctx.dpi);
      ctx.images.set(key, await (isJpeg ? ctx.pdfDoc.embedJpg(bytes) : ctx.pdfDoc.embedPng(bytes)));
    }
    page.drawImage(ctx.images.get(key), { x: left, y: top - el.h, width: el.w, height: el.h, opacity: el.opacity });
  }

  if (rotated) page.pushOperators(popGraphicsState());
}

/**
 * @param {object} design
 * @param {{ pageIndexes?: number[], dpi?: number, bleed?: boolean, keepSelectable?: boolean }} options
 * @returns {Promise<{ bytes: Uint8Array, replacedChars: string[] }>} replacedChars: characters no bundled font could draw
 */
export async function exportDesignPdf(design, { pageIndexes, dpi = 300, bleed = false, keepSelectable = true } = {}) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(design.name);
  pdfDoc.setCreator('PDF Section');
  pdfDoc.setProducer('PDF Section');
  const fonts = new FontBook(pdfDoc, keepSelectable);
  const images = new Map();
  const { width, height } = design;
  const pad = bleed ? BLEED + MARK_GAP + MARK_LENGTH + 2 : 0;
  const edge = bleed ? BLEED : 0;
  const indexes = pageIndexes || design.pages.map((_, i) => i);

  for (const index of indexes) {
    const source = design.pages[index];
    const page = pdfDoc.addPage([width + pad * 2, height + pad * 2]);
    const ctx = { pdfDoc, fonts, images, assets: design.assets, dpi, ox: pad, oy: pad, height };
    if (bleed) {
      page.setTrimBox(pad, pad, width, height);
      page.setBleedBox(pad - BLEED, pad - BLEED, width + BLEED * 2, height + BLEED * 2);
      drawCropMarks(page, pad, pad, width, height);
    }
    // Nothing may spill past the bleed (or past the page, when there is no bleed).
    page.pushOperators(pushGraphicsState(), rectangle(pad - edge, pad - edge, width + edge * 2, height + edge * 2), clip(), endPath());
    page.drawRectangle({ x: pad - edge, y: pad - edge, width: width + edge * 2, height: height + edge * 2, color: hexToRgb(source.background) });
    for (const el of source.elements) await drawElement(page, el, ctx);
    page.pushOperators(popGraphicsState());
  }

  return { bytes: await pdfDoc.save(), replacedChars: [...fonts.replaced] };
}

/** Pixels per point for image downloads. Pixel-sized designs come out at their exact size (or double). */
export function rasterScale(design, dpi) {
  if (design.unit === 'px') return (dpi >= 300 ? 2 : 1) / PX;
  return dpi / 72;
}

/**
 * @param {'png'|'jpg'} format
 * @returns {Promise<{ blobs: Blob[], replacedChars: string[] }>} one image per page
 */
export async function exportDesignImages(design, { pageIndexes, dpi = 300, format = 'png' } = {}) {
  const { bytes, replacedChars } = await exportDesignPdf(design, { pageIndexes, dpi });
  const doc = await loadPdfForRender(bytes);
  const scale = rasterScale(design, dpi);
  const blobs = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
      blobs.push(await new Promise((resolve) => canvas.toBlob(resolve, format === 'jpg' ? 'image/jpeg' : 'image/png', 0.92)));
    }
  } finally {
    await doc.loadingTask?.destroy();
  }
  return { blobs, replacedChars };
}
