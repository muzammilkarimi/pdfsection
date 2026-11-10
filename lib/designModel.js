// Data model for the Create PDF designer. A design is plain JSON: sizes and positions are in PDF
// points (top-left origin, y down), so the on-screen page and the exported PDF share one geometry.
// On screen 1pt is drawn as 1 CSS px and the whole page is scaled for zoom.

import { fontStack, getFont } from '@/lib/designFonts';
import { usedAssetIds } from '@/lib/designAssets';
import { DESIGN_VERSION, migrateDesign } from '@/lib/designMigrations';

export const MM = 72 / 25.4;
export const INCH = 72;
export const PX = 0.75;

const UNIT_PT = { mm: MM, in: INCH, px: PX };
export const toUnit = (pt, unit) => pt / (UNIT_PT[unit] || 1);
export const fromUnit = (value, unit) => value * (UNIT_PT[unit] || 1);

export const PAGE_PRESETS = [
  { id: 'a4', label: 'A4 Portrait', hint: '210 × 297 mm', w: 210, h: 297, unit: 'mm' },
  { id: 'letter', label: 'US Letter', hint: '8.5 × 11 in', w: 8.5, h: 11, unit: 'in' },
  { id: 'a3', label: 'A3 Poster', hint: '297 × 420 mm', w: 297, h: 420, unit: 'mm' },
  { id: 'square', label: 'Square post', hint: '1080 × 1080 px', w: 1080, h: 1080, unit: 'px' },
  { id: 'a4l', label: 'A4 Landscape', hint: '297 × 210 mm', w: 297, h: 210, unit: 'mm' },
];

export const uid = () => Math.random().toString(36).slice(2, 10);

export function createPage(background = '#ffffff') {
  return { id: uid(), background, elements: [] };
}

export function createDesign({ name = 'Untitled design', w, h, unit }) {
  return {
    v: DESIGN_VERSION,
    id: uid(),
    name,
    unit,
    width: fromUnit(w, unit),
    height: fromUnit(h, unit),
    assets: {},
    pages: [createPage()],
  };
}

export function createText(props = {}) {
  return {
    id: uid(),
    type: 'text',
    x: 0,
    y: 0,
    w: 300,
    h: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    text: 'Your text',
    font: 'Inter',
    size: 24,
    bold: false,
    italic: false,
    color: '#141320',
    align: 'left',
    lineHeight: 1.2,
    letterSpacing: 0,
    ...props,
  };
}

export function createShape(kind, props = {}) {
  const isLine = kind === 'line';
  return {
    id: uid(),
    type: 'shape',
    kind,
    x: 0,
    y: 0,
    w: isLine ? 200 : 140,
    h: isLine ? 12 : 140,
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: isLine ? null : '#5e6ad2',
    stroke: isLine ? '#141320' : null,
    strokeWidth: isLine ? 3 : 0,
    radius: 16,
    ...props,
  };
}

export function createImage(assetId, props = {}) {
  return { id: uid(), type: 'image', x: 0, y: 0, w: 200, h: 200, rotation: 0, opacity: 1, locked: false, assetId, ...props };
}

const n = (v) => +v.toFixed(3);

/** SVG path of a shape in its own w×h box. Used by both the screen and the PDF, so they always match. */
export function shapePath(el) {
  const { kind, w, h } = el;
  if (kind === 'line') return `M0 ${n(h / 2)}L${n(w)} ${n(h / 2)}`;
  if (kind === 'triangle') return `M${n(w / 2)} 0L${n(w)} ${n(h)}L0 ${n(h)}Z`;
  if (kind === 'arrow') {
    const head = Math.min(w * 0.5, h);
    const y1 = h * 0.32;
    const y2 = h * 0.68;
    return `M0 ${n(y1)}L${n(w - head)} ${n(y1)}L${n(w - head)} 0L${n(w)} ${n(h / 2)}L${n(w - head)} ${n(h)}L${n(w - head)} ${n(y2)}L0 ${n(y2)}Z`;
  }
  if (kind === 'star') {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.4 : 1;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      d += `${i ? 'L' : 'M'}${n(w / 2 + (w / 2) * r * Math.cos(a))} ${n(h / 2 + (h / 2) * r * Math.sin(a))}`;
    }
    return `${d}Z`;
  }
  if (kind === 'ellipse') {
    const rx = w / 2;
    const ry = h / 2;
    const kx = rx * 0.5523;
    const ky = ry * 0.5523;
    return `M0 ${n(ry)}C0 ${n(ry - ky)} ${n(rx - kx)} 0 ${n(rx)} 0C${n(rx + kx)} 0 ${n(w)} ${n(ry - ky)} ${n(w)} ${n(ry)}C${n(w)} ${n(ry + ky)} ${n(rx + kx)} ${n(h)} ${n(rx)} ${n(h)}C${n(rx - kx)} ${n(h)} 0 ${n(ry + ky)} 0 ${n(ry)}Z`;
  }
  const r = kind === 'rounded' ? Math.min(el.radius || 0, w / 2, h / 2) : 0;
  if (!r) return `M0 0L${n(w)} 0L${n(w)} ${n(h)}L0 ${n(h)}Z`;
  const k = r * 0.4477; // distance from the corner to the bezier control point
  return `M${n(r)} 0L${n(w - r)} 0C${n(w - k)} 0 ${n(w)} ${n(k)} ${n(w)} ${n(r)}L${n(w)} ${n(h - r)}C${n(w)} ${n(h - k)} ${n(w - k)} ${n(h)} ${n(w - r)} ${n(h)}L${n(r)} ${n(h)}C${n(k)} ${n(h)} 0 ${n(h - k)} 0 ${n(h - r)}L0 ${n(r)}C0 ${n(k)} ${n(k)} 0 ${n(r)} 0Z`;
}

/** Style actually drawn: a font without a bold or italic cut ignores that setting. */
export function effectiveStyle(el) {
  const f = getFont(el.font);
  return { bold: !!el.bold && f.bold, italic: !!el.italic && f.italic };
}

/**
 * CSS for a text element. Kerning is off because pdf-lib doesn't apply it: this keeps line
 * widths and wrapping on screen identical to the PDF.
 */
export function textCss(el) {
  const { bold, italic } = effectiveStyle(el);
  return {
    fontFamily: fontStack(el.font),
    fontSize: el.size,
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? 'italic' : 'normal',
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
    textAlign: el.align,
    color: el.color,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    unicodeBidi: 'plaintext',
    fontKerning: 'none',
  };
}

/** New design at a new page size, with everything scaled to fit. */
export function resizeDesign(design, width, height, unit) {
  const sx = width / design.width;
  const sy = height / design.height;
  const s = Math.min(sx, sy);
  return {
    ...design,
    width,
    height,
    unit,
    pages: design.pages.map((page) => ({
      ...page,
      elements: page.elements.map((el) => {
        const cx = (el.x + el.w / 2) * sx;
        const cy = (el.y + el.h / 2) * sy;
        const isLine = el.type === 'shape' && el.kind === 'line';
        const w = el.w * s;
        const h = isLine ? el.h : el.h * s;
        const next = { ...el, x: cx - w / 2, y: cy - h / 2, w, h };
        if (el.type === 'text') {
          next.size = el.size * s;
          next.letterSpacing = el.letterSpacing * s;
        }
        if (el.type === 'shape') {
          next.strokeWidth = el.strokeWidth * s;
          next.radius = (el.radius || 0) * s;
        }
        return next;
      }),
    })),
  };
}

const num = (v, fallback) => (Number.isFinite(v) ? v : fallback);
const HEX = /^#[0-9a-f]{6}$/i;
const colorOr = (v, fallback) => (typeof v === 'string' && HEX.test(v) ? v : fallback);
const SHAPE_KINDS = ['rect', 'rounded', 'ellipse', 'triangle', 'star', 'line', 'arrow'];
const ASSET_ID = /^[\w-]{1,64}$/;
const EMBEDDED_IMAGE = /^data:image\/(png|jpeg);base64,/;

/** Only embedded PNG and JPEG images: a file must not be able to load anything from elsewhere. */
function cleanAssets(raw) {
  const assets = {};
  if (!raw || typeof raw !== 'object') return assets;
  for (const [id, src] of Object.entries(raw)) {
    if (ASSET_ID.test(id) && typeof src === 'string' && EMBEDDED_IMAGE.test(src)) assets[id] = src;
  }
  return assets;
}

function cleanElement(el, assets) {
  const base = {
    id: uid(),
    x: num(el?.x, 0),
    y: num(el?.y, 0),
    w: Math.max(1, num(el?.w, 100)),
    h: Math.max(1, num(el?.h, 100)),
    rotation: num(el?.rotation, 0),
    opacity: Math.min(1, Math.max(0, num(el?.opacity, 1))),
    locked: !!el?.locked,
  };
  if (el?.type === 'text') {
    return createText({
      ...base,
      text: String(el.text ?? ''),
      font: getFont(el.font).id,
      size: Math.max(1, num(el.size, 24)),
      bold: !!el.bold,
      italic: !!el.italic,
      color: colorOr(el.color, '#141320'),
      align: ['left', 'center', 'right'].includes(el.align) ? el.align : 'left',
      lineHeight: Math.max(0.5, num(el.lineHeight, 1.2)),
      letterSpacing: num(el.letterSpacing, 0),
    });
  }
  if (el?.type === 'shape' && SHAPE_KINDS.includes(el.kind)) {
    return createShape(el.kind, {
      ...base,
      fill: el.fill === null ? null : colorOr(el.fill, '#5e6ad2'),
      stroke: el.stroke === null ? null : colorOr(el.stroke, '#141320'),
      strokeWidth: Math.max(0, num(el.strokeWidth, 0)),
      radius: Math.max(0, num(el.radius, 0)),
    });
  }
  if (el?.type === 'image' && typeof el.assetId === 'string' && Object.hasOwn(assets, el.assetId)) {
    return createImage(el.assetId, base);
  }
  return null;
}

/**
 * Validates a design read from a file and upgrades it to the current format. Throws if it isn't
 * one or is too new; drops anything it doesn't recognise.
 */
export function parseDesign(raw) {
  const design = migrateDesign(raw);
  if (!Array.isArray(design.pages) || !design.pages.length || !(design.width > 0) || !(design.height > 0)) {
    throw new Error('Not a PDF Section design file');
  }
  const allAssets = cleanAssets(design.assets);
  const parsed = {
    v: DESIGN_VERSION,
    id: uid(),
    name: String(design.name || 'Untitled design').slice(0, 120),
    unit: UNIT_PT[design.unit] ? design.unit : 'mm',
    width: design.width,
    height: design.height,
    assets: {},
    pages: design.pages.map((p) => ({
      id: uid(),
      background: colorOr(p?.background, '#ffffff'),
      elements: (Array.isArray(p?.elements) ? p.elements : []).map((el) => cleanElement(el, allAssets)).filter(Boolean),
    })),
  };
  for (const id of usedAssetIds(parsed)) parsed.assets[id] = allAssets[id];
  return parsed;
}

/** Copies with fresh ids. */
export const clonePage = (page) => ({ ...page, id: uid(), elements: page.elements.map((el) => ({ ...el, id: uid() })) });
export const cloneDesign = (design) => ({ ...design, id: uid(), pages: design.pages.map(clonePage) });

/**
 * Reads an uploaded image as a data URL. Anything other than PNG or JPEG is converted (a PDF can
 * only embed those two) and very large photos are scaled down to keep designs a sensible size.
 */
export async function readImageFile(file) {
  const MAX_EDGE = 5000;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('That image could not be opened'));
      image.src = url;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      return { src, width: img.naturalWidth, height: img.naturalHeight };
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    return { src: canvas.toDataURL(mime, 0.92), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
