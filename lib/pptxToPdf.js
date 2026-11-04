// PowerPoint (.pptx) -> PDF, client side.
//
// The .pptx (a zip of XML) is read with JSZip + DOMParser. Every slide becomes a slide-sized
// <section> of absolutely positioned elements: theme colours/fonts, background, shapes
// (as vector paths), pictures, tables and text with bullets, sizes and alignment, inheriting
// from the slide layout and master. The shared DOM painter (lib/domToPdf.js) then writes a
// vector PDF with one page per slide.

import JSZip from 'jszip';
import { sectionsToPdf } from '@/lib/domToPdf';
import { chartToSvg } from '@/lib/chartRender';

const EMU = 9525; // EMU per CSS px
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- XML helpers ----------------------------------------------------------------

const kids = (n, name) => (n ? [...n.children].filter((c) => c.localName === name) : []);
const kid = (n, name) => kids(n, name)[0] || null;
const at = (n, path) => path.split('/').reduce((cur, name) => (cur ? kid(cur, name) : null), n);
const num = (n, a, d = 0) => (n && n.getAttribute(a) !== null && n.getAttribute(a) !== '' ? Number(n.getAttribute(a)) : d);
const parse = (text) => new DOMParser().parseFromString(text, 'application/xml');

const dirname = (p) => p.slice(0, p.lastIndexOf('/'));
function resolvePath(base, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = dirname(base).split('/').filter(Boolean);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

// ---- colours ----------------------------------------------------------------------

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
};
const hslToRgb = (h, s, l) => {
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
};
const hexToRgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbToHex = (rgb) => rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const PRESET_COLORS = { black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', gray: '808080', grey: '808080', orange: 'FFA500', purple: '800080' };

/** Resolve a colour element (srgbClr / schemeClr / sysClr ...) to { hex, alpha }. */
function resolveColor(node, theme, phColor) {
  if (!node) return null;
  let hex = null;
  const v = node.getAttribute('val');
  switch (node.localName) {
    case 'srgbClr': hex = v; break;
    case 'sysClr': hex = node.getAttribute('lastClr') || (v === 'window' ? 'FFFFFF' : '000000'); break;
    case 'prstClr': hex = PRESET_COLORS[v] || '000000'; break;
    case 'scrgbClr': hex = rgbToHex([num(node, 'r') / 1000 * 2.55, num(node, 'g') / 1000 * 2.55, num(node, 'b') / 1000 * 2.55]); break;
    case 'schemeClr': {
      if (v === 'phClr') return phColor || { hex: '000000', alpha: 1 };
      const mapped = theme.clrMap[v] || v;
      hex = theme.colors[mapped] || '000000';
      break;
    }
    default: return null;
  }
  if (!hex) return null;
  let rgb = hexToRgb(hex);
  let alpha = 1;
  for (const t of node.children) {
    const val = num(t, 'val') / 100000;
    if (t.localName === 'alpha') alpha = val;
    else if (['lumMod', 'lumOff', 'tint', 'shade', 'satMod'].includes(t.localName)) {
      let [h, s, l] = rgbToHsl(...rgb);
      if (t.localName === 'lumMod') l *= val;
      else if (t.localName === 'lumOff') l += val;
      else if (t.localName === 'satMod') s *= val;
      else if (t.localName === 'tint') l = l * val + (1 - val);
      else if (t.localName === 'shade') l *= val;
      rgb = hslToRgb(h, s, Math.max(0, Math.min(1, l)));
    }
  }
  return { hex: rgbToHex(rgb), alpha };
}

const colorChild = (n) => (n ? [...n.children].find((c) => ['srgbClr', 'schemeClr', 'sysClr', 'prstClr', 'scrgbClr'].includes(c.localName)) : null);

const toRgba = (c) => (c ? { r: parseInt(c.hex.slice(0, 2), 16) / 255, g: parseInt(c.hex.slice(2, 4), 16) / 255, b: parseInt(c.hex.slice(4, 6), 16) / 255, a: c.alpha } : null);
const css = (c) => (c ? `#${c.hex}` : 'transparent');

// ---- package ------------------------------------------------------------------------

async function openPackage(buffer) {
  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error('This file could not be read as a .pptx presentation. If it is an old .ppt file, save it as .pptx in PowerPoint first.');
  }
  const cache = new Map();
  const xml = async (path) => {
    if (cache.has(path)) return cache.get(path);
    const f = zip.file(path);
    const doc = f ? parse(await f.async('text')) : null;
    cache.set(path, doc);
    return doc;
  };
  const rels = async (path) => {
    const relPath = `${dirname(path)}/_rels/${path.slice(path.lastIndexOf('/') + 1)}.rels`;
    const doc = await xml(relPath);
    const map = {};
    if (doc) for (const r of doc.documentElement.children) {
      const target = r.getAttribute('Target');
      map[r.getAttribute('Id')] = { type: r.getAttribute('Type') || '', path: r.getAttribute('TargetMode') === 'External' ? null : resolvePath(path, target) };
    }
    return map;
  };
  const dataUrl = async (path) => {
    const f = zip.file(path);
    if (!f) return null;
    const ext = path.split('.').pop().toLowerCase();
    const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp' }[ext];
    if (!mime) return null; // emf / wmf / tiff: browsers cannot decode these
    return `data:${mime};base64,${await f.async('base64')}`;
  };
  return { xml, rels, dataUrl, zip };
}

function readTheme(doc, clrMapNode) {
  const colors = {};
  const scheme = doc && doc.getElementsByTagNameNS('*', 'clrScheme')[0];
  if (scheme) for (const c of scheme.children) {
    const inner = c.firstElementChild;
    if (inner) colors[c.localName] = inner.getAttribute('val') && inner.localName === 'srgbClr' ? inner.getAttribute('val') : inner.getAttribute('lastClr') || '000000';
  }
  const fonts = { major: 'Calibri', minor: 'Calibri' };
  const fs = doc && doc.getElementsByTagNameNS('*', 'fontScheme')[0];
  if (fs) {
    fonts.major = kid(kid(fs, 'majorFont'), 'latin')?.getAttribute('typeface') || fonts.major;
    fonts.minor = kid(kid(fs, 'minorFont'), 'latin')?.getAttribute('typeface') || fonts.minor;
  }
  const clrMap = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' };
  if (clrMapNode) for (const a of clrMapNode.attributes) clrMap[a.name] = a.value;
  return { colors, fonts, clrMap };
}

// ---- fills / lines ----------------------------------------------------------------------

function fillOf(spPr, theme, phColor) {
  if (!spPr) return undefined;
  if (kid(spPr, 'noFill')) return null;
  const solid = kid(spPr, 'solidFill');
  if (solid) return { color: resolveColor(colorChild(solid), theme, phColor) };
  const grad = kid(spPr, 'gradFill');
  if (grad) {
    const stops = kids(kid(grad, 'gsLst'), 'gs').map((g) => resolveColor(colorChild(g), theme, phColor)).filter(Boolean);
    if (stops.length) {
      const avg = [0, 0, 0];
      stops.forEach((c) => hexToRgb(c.hex).forEach((v, i) => { avg[i] += v / stops.length; }));
      return { color: { hex: rgbToHex(avg), alpha: stops[0].alpha } };
    }
  }
  const patt = kid(spPr, 'pattFill');
  if (patt) return { color: resolveColor(colorChild(kid(patt, 'fgClr')), theme, phColor) };
  if (kid(spPr, 'blipFill')) return { blip: kid(spPr, 'blipFill') };
  return undefined;
}

function lineOf(spPr, theme, phColor) {
  const ln = kid(spPr, 'ln');
  if (!ln) return undefined;
  if (kid(ln, 'noFill')) return null;
  const solid = kid(ln, 'solidFill');
  const color = solid ? resolveColor(colorChild(solid), theme, phColor) : null;
  const dashVal = kid(ln, 'prstDash')?.getAttribute('val') || 'solid';
  const dash = /^(solid)$/.test(dashVal) ? '' : /dot/i.test(dashVal) && !/dash/i.test(dashVal) ? 'dot' : 'dash';
  return { color, width: num(ln, 'w', 12700) / EMU, dash };
}

// ---- text ---------------------------------------------------------------------------------

const BULLET_FONT_MAP = { '§': '■', 'ü': '✓', 'Ø': '➢', 'v': '❖', 'l': '●', 'n': '■', 'q': '❑', '–': '–', '•': '•' };

function autoNumber(n, type) {
  const alpha = (k, upper) => { let s = ''; k = k - 1; do { s = String.fromCharCode(97 + (k % 26)) + s; k = Math.floor(k / 26) - 1; } while (k >= 0); return upper ? s.toUpperCase() : s; };
  const roman = (k) => { const m = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]; let s = ''; for (const [v, r] of m) while (k >= v) { s += r; k -= v; } return s; };
  const wrap = (core) => (/ParenBoth/.test(type) ? `(${core})` : /ParenR/.test(type) ? `${core})` : /Period/.test(type) ? `${core}.` : core);
  if (/^alphaUc/.test(type)) return wrap(alpha(n, true));
  if (/^alphaLc/.test(type)) return wrap(alpha(n, false));
  if (/^romanUc/.test(type)) return wrap(roman(n).toUpperCase());
  if (/^romanLc/.test(type)) return wrap(roman(n));
  return wrap(String(n));
}

/** Collect properties by looking through the list-style chain from most to least specific. */
function lvlLookup(chain, lvl, pick) {
  for (const ls of chain) {
    const p = kid(ls, `lvl${lvl + 1}pPr`);
    if (!p) continue;
    const v = pick(p);
    if (v !== undefined) return v;
  }
  return undefined;
}

function renderText(txBody, ctx, shape) {
  // shape: { chain: [lstStyle nodes], phColor, slideNo, box }
  const bodyPr = kid(txBody, 'bodyPr');
  const autofit = kid(bodyPr, 'normAutofit');
  const fontScale = autofit ? num(autofit, 'fontScale', 100000) / 100000 : 1;
  const lnReduce = autofit ? num(autofit, 'lnSpcReduction', 0) / 100000 : 0;
  const own = kid(txBody, 'lstStyle');
  const chain = [own, ...shape.chain].filter(Boolean);

  const counters = {};
  let html = '';
  for (const para of kids(txBody, 'p')) {
    const pPr = kid(para, 'pPr');
    const lvl = num(pPr, 'lvl', 0);
    const pick = (attr, parseV = (v) => v) => {
      if (pPr && pPr.getAttribute(attr) !== null) return parseV(pPr.getAttribute(attr));
      return lvlLookup(chain, lvl, (p) => (p.getAttribute(attr) !== null ? parseV(p.getAttribute(attr)) : undefined));
    };
    const algn = pick('algn') || 'l';
    const marL = (pick('marL', Number) || 0) / EMU;
    const indent = (pick('indent', Number) || 0) / EMU;
    const child = (name) => (pPr && kid(pPr, name)) || lvlLookup(chain, lvl, (p) => kid(p, name) || undefined) || null;

    // runs
    const runs = [];
    let firstRun = null;
    for (const node of para.children) {
      if (node.localName === 'br') { runs.push('<br>'); continue; }
      if (!['r', 'fld'].includes(node.localName)) continue;
      const rPr = kid(node, 'rPr');
      let text = kid(node, 't')?.textContent ?? '';
      if (node.localName === 'fld' && /slidenum/i.test(node.getAttribute('type') || '')) text = String(shape.slideNo);
      const dr = (attr) => (rPr && rPr.getAttribute(attr) !== null ? rPr.getAttribute(attr) : lvlLookup(chain, lvl, (p) => { const d = kid(p, 'defRPr'); return d && d.getAttribute(attr) !== null ? d.getAttribute(attr) : undefined; }));
      const drChild = (name) => (rPr && kid(rPr, name)) || lvlLookup(chain, lvl, (p) => { const d = kid(p, 'defRPr'); return (d && kid(d, name)) || undefined; });
      const size = (Number(dr('sz')) || 1800) / 100 * fontScale;
      const b = dr('b') === '1', i = dr('i') === '1';
      const u = dr('u') && dr('u') !== 'none', strike = dr('strike') && dr('strike') !== 'noStrike';
      const base = dr('baseline');
      const colorFill = drChild('solidFill');
      const color = colorFill ? resolveColor(colorChild(colorFill), ctx.theme, shape.phColor) : resolveColor({ localName: 'schemeClr', getAttribute: () => 'tx1', children: [] }, ctx.theme);
      let face = drChild('latin')?.getAttribute('typeface') || ctx.theme.fonts.minor;
      if (face === '+mj-lt') face = ctx.theme.fonts.major;
      else if (face === '+mn-lt') face = ctx.theme.fonts.minor;
      const deco = [u ? 'underline' : '', strike ? 'line-through' : ''].filter(Boolean).join(' ');
      const style = [
        `font-size:${size}pt`, `font-family:'${face.replace(/['"]/g, '')}',Arial,sans-serif`,
        b ? 'font-weight:bold' : '', i ? 'font-style:italic' : '', deco ? `text-decoration:${deco}` : '',
        `color:${css(color)}`, base && Number(base) > 0 ? 'vertical-align:super;font-size:' + size * 0.65 + 'pt' : base && Number(base) < 0 ? 'vertical-align:sub;font-size:' + size * 0.65 + 'pt' : '',
      ].filter(Boolean).join(';');
      if (!firstRun) firstRun = { size, color, face, b };
      runs.push(`<span style="${style}">${esc(text)}</span>`);
    }
    const endRPr = kid(para, 'endParaRPr');
    const emptySize = (num(endRPr, 'sz', 0) || lvlLookup(chain, lvl, (p) => { const d = kid(p, 'defRPr'); return d && d.getAttribute('sz') ? Number(d.getAttribute('sz')) : undefined; }) || 1800) / 100 * fontScale;
    const refSize = firstRun ? firstRun.size : emptySize;

    // bullet
    let bullet = '';
    const buNone = child('buNone');
    const buChar = child('buChar');
    const buAuto = child('buAutoNum');
    if (!buNone && (buChar || buAuto) && runs.length) {
      if (buAuto) {
        counters[lvl] = (counters[lvl] || 0) + 1;
        const start = num(buAuto, 'startAt', 1);
        bullet = autoNumber(start + counters[lvl] - 1, buAuto.getAttribute('type') || 'arabicPeriod');
      } else {
        const ch = buChar.getAttribute('char') || '•';
        bullet = BULLET_FONT_MAP[ch] || ch;
        counters[lvl] = 0;
      }
    } else {
      for (const k of Object.keys(counters)) if (Number(k) >= lvl) counters[k] = 0;
    }
    const buClr = child('buClr');
    const bulletColor = buClr ? css(resolveColor(colorChild(buClr), ctx.theme, shape.phColor)) : firstRun ? css(firstRun.color) : '#000';
    const bulletHtml = bullet
      ? `<span style="display:inline-block;width:${Math.max(-indent, refSize * 1.2)}px;text-indent:0;color:${bulletColor};font-size:${refSize}pt;font-family:Arial,sans-serif">${esc(bullet)}</span>`
      : '';

    // spacing
    const spc = (name) => {
      const n = child(name);
      if (!n) return null;
      const pts = kid(n, 'spcPts'), pct = kid(n, 'spcPct');
      if (pts) return { pt: num(pts, 'val') / 100 };
      if (pct) return { pct: num(pct, 'val') / 100000 };
      return null;
    };
    const before = spc('spcBef'), after = spc('spcAft'), line = spc('lnSpc');
    const lh = line ? (line.pt ? `${line.pt}pt` : `${Math.max(0.5, line.pct - lnReduce) * 1.2}`) : `${1.2 * (1 - lnReduce)}`;
    const mt = before ? (before.pt ? before.pt : (before.pct * refSize)) : 0;
    const mb = after ? (after.pt ? after.pt : (after.pct * refSize)) : 0;
    const align = { l: 'left', ctr: 'center', r: 'right', just: 'justify', dist: 'justify' }[algn] || 'left';
    const hasText = runs.length > 0;
    const pad = bullet ? marL : marL;
    html += `<div style="margin:${mt * fontScale}pt 0 ${mb * fontScale}pt 0;padding-left:${Math.max(0, pad)}px;text-indent:${bullet || indent < 0 ? Math.min(0, indent) : indent}px;text-align:${align};line-height:${lh};${hasText ? '' : `min-height:${emptySize * 1.2}pt;`}">${bulletHtml}${runs.join('') || '<br>'}</div>`;
  }
  return html;
}

// ---- shapes ---------------------------------------------------------------------------------

const PH_DEFAULTS = { title: 'title', ctrTitle: 'title', subTitle: 'body', body: 'body', obj: 'body' };

function findPlaceholder(shapes, ph) {
  const idx = ph.getAttribute('idx'), type = ph.getAttribute('type');
  const list = shapes.filter((s) => s.ph);
  return (
    (idx && list.find((s) => s.ph.getAttribute('idx') === idx)) ||
    (type && list.find((s) => s.ph.getAttribute('type') === type)) ||
    (!type && list.find((s) => !s.ph.getAttribute('type') || s.ph.getAttribute('type') === 'body')) ||
    null
  );
}

function shapeNodes(spTree) {
  return [...spTree.children]
    .filter((n) => ['sp', 'pic', 'graphicFrame', 'grpSp', 'cxnSp'].includes(n.localName))
    .map((node) => {
      const nv = kid(node, 'nvSpPr') || kid(node, 'nvPicPr') || kid(node, 'nvGraphicFramePr') || kid(node, 'nvGrpSpPr') || kid(node, 'nvCxnSpPr');
      const ph = at(nv, 'nvPr/ph');
      return { node, ph };
    });
}

const xfrmOf = (node) => kid(kid(node, 'spPr'), 'xfrm') || kid(node, 'xfrm') || kid(kid(node, 'grpSpPr'), 'xfrm');

function boxFromXfrm(x, map) {
  if (!x) return null;
  const off = kid(x, 'off'), ext = kid(x, 'ext');
  if (!off || !ext) return null;
  const ox = num(off, 'x'), oy = num(off, 'y'), cx = num(ext, 'cx'), cy = num(ext, 'cy');
  return {
    x: (map.tx + ox * map.sx) / EMU, y: (map.ty + oy * map.sy) / EMU,
    w: (cx * map.sx) / EMU, h: (cy * map.sy) / EMU,
    rot: num(x, 'rot') / 60000, flipH: x.getAttribute('flipH') === '1', flipV: x.getAttribute('flipV') === '1',
  };
}

async function cropImage(url, src) {
  const l = num(src, 'l') / 100000, t = num(src, 't') / 100000, r = num(src, 'r') / 100000, b = num(src, 'b') / 100000;
  if (!l && !t && !r && !b) return url;
  const img = new Image();
  img.src = url;
  try { await img.decode(); } catch { return url; }
  const sw = img.naturalWidth * (1 - l - r), sh = img.naturalHeight * (1 - t - b);
  if (sw < 1 || sh < 1) return url;
  const c = document.createElement('canvas');
  c.width = Math.round(sw); c.height = Math.round(sh);
  c.getContext('2d').drawImage(img, img.naturalWidth * l, img.naturalHeight * t, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

async function renderShapes(shapes, env, map, out) {
  // env: { ctx, rels, pathOf, layoutShapes, masterShapes, kindStyle, slideNo, warnings, isSlide }
  for (const { node, ph } of shapes) {
    const kind = node.localName;
    if (kind === 'grpSp') {
      const x = kid(kid(node, 'grpSpPr'), 'xfrm');
      let inner = map;
      if (x) {
        const off = kid(x, 'off'), ext = kid(x, 'ext'), cho = kid(x, 'chOff'), che = kid(x, 'chExt');
        const sx = num(ext, 'cx') / (num(che, 'cx') || 1) * map.sx, sy = num(ext, 'cy') / (num(che, 'cy') || 1) * map.sy;
        inner = { sx, sy, tx: map.tx + num(off, 'x') * map.sx - num(cho, 'x') * sx, ty: map.ty + num(off, 'y') * map.sy - num(cho, 'y') * sy };
      }
      await renderShapes(shapeNodes(node), env, inner, out);
      continue;
    }

    // geometry (with placeholder inheritance)
    let xf = xfrmOf(node);
    let phLayout = null, phMaster = null;
    if (ph) {
      phLayout = env.layoutShapes && findPlaceholder(env.layoutShapes, ph);
      phMaster = env.masterShapes && findPlaceholder(env.masterShapes, ph);
      if (!xf) xf = (phLayout && xfrmOf(phLayout.node)) || (phMaster && xfrmOf(phMaster.node));
    }
    const box = boxFromXfrm(xf, map);
    if (!box) continue;
    if (box.x > env.slideW + 1 || box.y > env.slideH + 1 || box.x + box.w < -1 || box.y + box.h < -1) continue; // fully off-slide

    const style = kid(node, 'style');
    const spPr = kid(node, 'spPr');
    const refColor = (name) => {
      const ref = kid(style, name);
      return ref && num(ref, 'idx') > 0 ? resolveColor(colorChild(ref), env.ctx.theme) : null;
    };
    const phSp = (phLayout && kid(phLayout.node, 'spPr')) || null;
    const phSpM = (phMaster && kid(phMaster.node, 'spPr')) || null;
    const phColor = refColor('fillRef');

    let fill = fillOf(spPr, env.ctx.theme, phColor);
    if (fill === undefined) fill = fillOf(phSp, env.ctx.theme, phColor);
    if (fill === undefined) fill = fillOf(phSpM, env.ctx.theme, phColor);
    if (fill === undefined) { const c = refColor('fillRef'); fill = c ? { color: c } : null; }
    let line = lineOf(spPr, env.ctx.theme, refColor('lnRef'));
    if (line === undefined) line = lineOf(phSp, env.ctx.theme, refColor('lnRef'));
    if (line === undefined) { const c = refColor('lnRef'); line = c ? { color: c, width: 1, dash: '' } : null; }
    if (line && !line.color) { const c = refColor('lnRef'); line = c ? { ...line, color: c } : null; } // <a:ln/> without a fill inherits from the shape style

    const geom = at(spPr, 'prstGeom')?.getAttribute('prst') || (kind === 'cxnSp' ? 'line' : 'rect');
    const adjV = (() => { const gd = at(spPr, 'prstGeom/avLst/gd'); const m = /val (-?\d+)/.exec(gd?.getAttribute('fmla') || ''); return m ? Number(m[1]) / 100000 : undefined; })();
    const isLine = geom === 'line' || geom === 'straightConnector1' || geom === 'bentConnector3' || kind === 'cxnSp';
    const place = `position:absolute;left:${box.x}px;top:${box.y}px;width:${Math.max(box.w, isLine ? 0.01 : 0)}px;height:${Math.max(box.h, isLine ? 0.01 : 0)}px;`;

    // pictures
    if (kind === 'pic' || (fill && fill.blip && kind === 'sp')) {
      const blipFill = kind === 'pic' ? kid(node, 'blipFill') : fill.blip;
      const embed = kid(blipFill, 'blip')?.getAttribute('r:embed') || kid(blipFill, 'blip')?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
      const target = embed && env.rels[embed];
      let url = target?.path ? await env.pkg.dataUrl(target.path) : null;
      if (url) {
        url = await cropImage(url, kid(blipFill, 'srcRect'));
        out.push(`<img src="${url}" alt="" data-rot="${box.rot}" style="${place}object-fit:fill;">`);
      } else if (kind === 'pic') {
        env.warnings.add('Some pictures (for example EMF/WMF graphics) could not be included.');
      }
      if (kind === 'pic') continue;
    }

    // charts, SmartArt, embedded objects
    if (kind === 'graphicFrame') {
      const gd = at(node, 'graphic/graphicData');
      const uri = gd?.getAttribute('uri') || '';
      const tbl = gd && kid(gd, 'tbl');
      if (tbl) { out.push(renderTable(tbl, box, env)); continue; }
      if (/chart/.test(uri)) {
        const rid = kid(gd, 'chart')?.getAttribute('r:id');
        const chartPath = rid && env.rels[rid]?.path;
        const chartDoc = chartPath && (await env.pkg.xml(chartPath));
        if (chartDoc) {
          const res = chartToSvg(chartDoc, Math.max(40, Math.round(box.w)), Math.max(40, Math.round(box.h)), {
            color: (spPr) => {
              const c = spPr && resolveColor(colorChild(kid(spPr, 'solidFill')), env.ctx.theme);
              return c ? c.hex : null;
            },
          });
          if (res.dataUrl) {
            out.push(`<img src="${res.dataUrl}" alt="" style="${place}">`);
            continue;
          }
        }
      }
      env.warnings.add(/chart/.test(uri) ? 'This chart type is not supported yet and was left out.' : /diagram/.test(uri) ? 'SmartArt graphics are not included in the PDF yet.' : 'Some embedded objects are not included in the PDF yet.');
      out.push(`<div style="${place}border:1px dashed #bbb;box-sizing:border-box;"></div>`);
      continue;
    }

    // vector shape
    const spec = {
      geom, adj: adjV, rot: box.rot, flipH: box.flipH, flipV: box.flipV,
      fill: fill && fill.color ? toRgba(fill.color) : null,
      stroke: line && line.color ? { ...toRgba(line.color), width: line.width, dash: line.dash } : null,
    };
    if (isLine && !spec.stroke) spec.stroke = { r: 0, g: 0, b: 0, a: 1, width: 1, dash: '' };
    if (spec.fill || spec.stroke) out.push(`<div data-pdf-shape="${esc(JSON.stringify(spec))}" style="${place}"></div>`);

    // text
    const txBody = kid(node, 'txBody');
    if (txBody && kids(txBody, 'p').some((p) => p.children.length > (kid(p, 'pPr') ? 1 : 0) || true)) {
      const hasContent = kids(txBody, 'p').some((p) => kids(p, 'r').length || kids(p, 'fld').length);
      if (hasContent) {
        const bodyPr = kid(txBody, 'bodyPr') || (phLayout && kid(kid(phLayout.node, 'txBody'), 'bodyPr')) || (phMaster && kid(kid(phMaster.node, 'txBody'), 'bodyPr'));
        const inset = (a, d) => (bodyPr && bodyPr.getAttribute(a) !== null ? Number(bodyPr.getAttribute(a)) : d) / EMU;
        const anchor = bodyPr?.getAttribute('anchor') || (phLayout && kid(kid(phLayout.node, 'txBody'), 'bodyPr')?.getAttribute('anchor')) || (phMaster && kid(kid(phMaster.node, 'txBody'), 'bodyPr')?.getAttribute('anchor')) || 't';
        const wrap = bodyPr?.getAttribute('wrap') !== 'none';
        const phType = ph?.getAttribute('type') || (ph ? 'body' : null);
        const baseStyleKind = ph ? (['title', 'ctrTitle'].includes(phType) ? 'titleStyle' : ['dt', 'ftr', 'sldNum'].includes(phType) ? 'otherStyle' : 'bodyStyle') : 'otherStyle';
        const chain = [
          phLayout && kid(kid(phLayout.node, 'txBody'), 'lstStyle'),
          phMaster && kid(kid(phMaster.node, 'txBody'), 'lstStyle'),
          env.masterTxStyles && kid(env.masterTxStyles, baseStyleKind),
          env.defaultTextStyle,
        ].filter(Boolean);
        if (box.rot) env.warnings.add('Text inside rotated shapes is drawn unrotated.');
        const inner = renderText(txBody, env.ctx, { chain, phColor: null, slideNo: env.slideNo });
        const justify = { t: 'flex-start', ctr: 'center', b: 'flex-end' }[anchor] || 'flex-start';
        out.push(
          `<div style="${place}box-sizing:border-box;display:flex;flex-direction:column;justify-content:${justify};padding:${inset('tIns', 45720)}px ${inset('rIns', 91440)}px ${inset('bIns', 45720)}px ${inset('lIns', 91440)}px;${wrap ? '' : 'white-space:nowrap;'}overflow:visible;">${inner}</div>`
        );
      }
    }
  }
}

function renderTable(tbl, box, env) {
  const theme = env.ctx.theme;
  const cols = kids(kid(tbl, 'tblGrid'), 'gridCol').map((g) => num(g, 'w') / EMU);
  const pr = kid(tbl, 'tblPr');
  const firstRow = pr?.getAttribute('firstRow') === '1', band = pr?.getAttribute('bandRow') === '1';
  const accent = resolveColor({ localName: 'schemeClr', getAttribute: () => 'accent1', children: [] }, theme);
  const tint = (c, v) => { const [h, s, l] = rgbToHsl(...hexToRgb(c.hex)); return rgbToHex(hslToRgb(h, s, l * v + (1 - v))); };
  let html = `<table style="position:absolute;left:${box.x}px;top:${box.y}px;width:${cols.reduce((a, b) => a + b, 0) || box.w}px;border-collapse:separate;border-spacing:0;table-layout:fixed;"><colgroup>${cols.map((w) => `<col style="width:${w}px">`).join('')}</colgroup><tbody>`;
  kids(tbl, 'tr').forEach((tr, ri) => {
    html += `<tr style="height:${num(tr, 'h') / EMU}px">`;
    kids(tr, 'tc').forEach((tc) => {
      if (tc.getAttribute('hMerge') === '1' || tc.getAttribute('vMerge') === '1') return;
      const tcPr = kid(tc, 'tcPr');
      const header = firstRow && ri === 0;
      let bg = null;
      const f = fillOf(tcPr, theme);
      if (f && f.color) bg = css(f.color);
      else if (f === undefined) bg = header ? css(accent) : band ? `#${tint(accent, ri % 2 ? 0.8 : 0.9)}` : null;
      const borders = ['L', 'R', 'T', 'B'].map((s) => {
        const ln = kid(tcPr, `ln${s}`);
        const side = { L: 'left', R: 'right', T: 'top', B: 'bottom' }[s];
        if (ln && !kid(ln, 'noFill')) {
          const c = resolveColor(colorChild(kid(ln, 'solidFill')), theme);
          return `border-${side}:${Math.max(0.5, num(ln, 'w', 12700) / EMU)}px solid ${css(c) || '#000'}`;
        }
        return f === undefined && !ln ? `border-${side}:1px solid #ffffff` : '';
      }).join(';');
      const anchor = { ctr: 'middle', b: 'bottom' }[tcPr?.getAttribute('anchor')] || 'top';
      const inner = kid(tc, 'txBody') ? renderText(kid(tc, 'txBody'), env.ctx, {
        chain: [env.masterTxStyles && kid(env.masterTxStyles, 'otherStyle'), env.defaultTextStyle].filter(Boolean), phColor: null, slideNo: env.slideNo,
      }) : '';
      const headerStyle = header && f === undefined ? 'font-weight:bold;color:#fff;' : '';
      const mar = (a, d) => (tcPr && tcPr.getAttribute(a) !== null ? Number(tcPr.getAttribute(a)) : d) / EMU;
      html += `<td${num(tc, 'gridSpan', 1) > 1 ? ` colspan="${num(tc, 'gridSpan')}"` : ''}${num(tc, 'rowSpan', 1) > 1 ? ` rowspan="${num(tc, 'rowSpan')}"` : ''} style="${bg ? `background:${bg};` : ''}${borders};vertical-align:${anchor};padding:${mar('marT', 45720)}px ${mar('marR', 91440)}px ${mar('marB', 45720)}px ${mar('marL', 91440)}px;overflow:hidden;${headerStyle}">${inner || '&nbsp;'}</td>`;
    });
    html += '</tr>';
  });
  return html + '</tbody></table>';
}

// ---- public ---------------------------------------------------------------------------------

export async function renderPptxSlides(arrayBuffer, host) {
  const pkg = await openPackage(arrayBuffer);
  const pres = await pkg.xml('ppt/presentation.xml');
  if (!pres) throw new Error('This does not look like a PowerPoint (.pptx) file.');
  const warnings = new Set();
  const sz = at(pres.documentElement, 'sldSz');
  const slideW = num(sz, 'cx', 9144000) / EMU, slideH = num(sz, 'cy', 5143500) / EMU;
  const presRels = await pkg.rels('ppt/presentation.xml');
  const slideIds = kids(at(pres.documentElement, 'sldIdLst'), 'sldId');
  const defaultTextStyle = at(pres.documentElement, 'defaultTextStyle');

  const sections = [];
  let slideNo = 0;
  for (const sid of slideIds) {
    slideNo++;
    const rid = sid.getAttribute('r:id') || sid.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const slidePath = presRels[rid]?.path;
    if (!slidePath) continue;
    const slideDoc = await pkg.xml(slidePath);
    if (!slideDoc) continue;
    const slide = slideDoc.documentElement;
    if (slide.getAttribute('show') === '0') continue; // hidden slides are not exported (same as PowerPoint)

    const sRels = await pkg.rels(slidePath);
    const layoutPath = Object.values(sRels).find((r) => /slideLayout$/.test(r.type))?.path;
    const layoutDoc = layoutPath && (await pkg.xml(layoutPath));
    const lRels = layoutPath ? await pkg.rels(layoutPath) : {};
    const masterPath = Object.values(lRels).find((r) => /slideMaster$/.test(r.type))?.path;
    const masterDoc = masterPath && (await pkg.xml(masterPath));
    const mRels = masterPath ? await pkg.rels(masterPath) : {};
    const themePath = Object.values(mRels).find((r) => /theme$/.test(r.type))?.path;
    const themeDoc = themePath && (await pkg.xml(themePath));
    const theme = readTheme(themeDoc, masterDoc && at(masterDoc.documentElement, 'clrMap'));
    const ctx = { theme };

    const layoutRoot = layoutDoc && layoutDoc.documentElement;
    const masterRoot = masterDoc && masterDoc.documentElement;
    const slideTree = at(slide, 'cSld/spTree');
    const layoutTree = layoutRoot && at(layoutRoot, 'cSld/spTree');
    const masterTree = masterRoot && at(masterRoot, 'cSld/spTree');
    const layoutShapes = layoutTree ? shapeNodes(layoutTree) : [];
    const masterShapes = masterTree ? shapeNodes(masterTree) : [];
    const masterTxStyles = masterRoot && kid(masterRoot, 'txStyles');

    const section = document.createElement('section');
    section.className = 'pptx-slide';
    section.style.cssText = `position:relative;display:block;box-sizing:border-box;width:${slideW}px;min-height:${slideH}px;height:${slideH}px;padding:0;margin:0 0 20px 0;overflow:hidden;background:#fff;`;

    // background: slide -> layout -> master
    let bgHtml = '';
    for (const [root, rels, ] of [[slide, sRels], [layoutRoot, lRels], [masterRoot, mRels]]) {
      const bg = root && at(root, 'cSld/bg');
      if (!bg) continue;
      const bgPr = kid(bg, 'bgPr');
      const bgRef = kid(bg, 'bgRef');
      if (bgPr) {
        const f = fillOf(bgPr, theme);
        if (f && f.color) { bgHtml = `<div style="position:absolute;left:0;top:0;width:${slideW}px;height:${slideH}px;background:${css(f.color)}"></div>`; break; }
        if (f && f.blip) {
          const embed = kid(f.blip, 'blip')?.getAttribute('r:embed');
          const url = embed && rels[embed]?.path && (await pkg.dataUrl(rels[embed].path));
          if (url) { bgHtml = `<img src="${url}" alt="" style="position:absolute;left:0;top:0;width:${slideW}px;height:${slideH}px">`; break; }
        }
      } else if (bgRef) {
        const c = resolveColor(colorChild(bgRef), theme);
        if (c) { bgHtml = `<div style="position:absolute;left:0;top:0;width:${slideW}px;height:${slideH}px;background:${css(c)}"></div>`; break; }
      }
    }
    if (!bgHtml) {
      const bg1 = resolveColor({ localName: 'schemeClr', getAttribute: () => 'bg1', children: [] }, theme);
      bgHtml = `<div style="position:absolute;left:0;top:0;width:${slideW}px;height:${slideH}px;background:${css(bg1)}"></div>`;
    }

    const parts = [bgHtml];
    const identity = { sx: 1, sy: 1, tx: 0, ty: 0 };
    const showMaster = slide.getAttribute('showMasterSp') !== '0';
    const baseEnv = { ctx, pkg, slideW, slideH, warnings, masterTxStyles, defaultTextStyle, slideNo };
    // decorative (non-placeholder) shapes of master and layout sit under the slide's own shapes
    if (showMaster && masterShapes.length && layoutRoot?.getAttribute('showMasterSp') !== '0') {
      await renderShapes(masterShapes.filter((s) => !s.ph), { ...baseEnv, rels: mRels, layoutShapes: [], masterShapes: [] }, identity, parts);
    }
    if (layoutShapes.length) {
      await renderShapes(layoutShapes.filter((s) => !s.ph), { ...baseEnv, rels: lRels, layoutShapes: [], masterShapes: [] }, identity, parts);
    }
    if (slideTree) {
      await renderShapes(shapeNodes(slideTree), { ...baseEnv, rels: sRels, layoutShapes, masterShapes }, identity, parts);
    }

    const article = document.createElement('article');
    article.style.cssText = `position:absolute;left:0;top:0;width:${slideW}px;height:${slideH}px;`;
    article.innerHTML = parts.join('');
    section.appendChild(article);
    host.appendChild(section);
    sections.push(section);
  }
  if (!sections.length) throw new Error('No slides were found in this presentation.');
  return { sections, warnings: [...warnings] };
}

/** Convert a .pptx File/ArrayBuffer to PDF bytes (one page per slide). */
export async function pptxToPdf(file, { onProgress } = {}) {
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;width:auto;pointer-events:none;';
  document.body.appendChild(host);
  try {
    onProgress?.(15);
    const { sections, warnings } = await renderPptxSlides(buffer, host);
    if (document.fonts?.ready) await document.fonts.ready;
    onProgress?.(40);
    const bytes = await sectionsToPdf(sections, {
      fixedPages: true,
      onProgress: (done, total) => onProgress?.(40 + Math.round((done / total) * 55)),
    });
    return { bytes, warnings };
  } finally {
    host.remove();
  }
}
