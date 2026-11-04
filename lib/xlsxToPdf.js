// Excel (.xlsx) -> PDF, client side.
//
// ExcelJS reads the workbook (values, styles, merges, column widths, borders, page setup),
// each sheet is laid out as styled HTML tables inside page-sized <section>s, and the shared
// DOM painter (lib/domToPdf.js) turns that into a vector PDF. Like Excel's print output:
// no gridlines unless a cell has a border, sheets are split into pages at row boundaries,
// and sheets wider than a page are scaled down a little and then split by columns.

import JSZip from 'jszip';
import { sectionsToPdf } from '@/lib/domToPdf';
import { chartToSvg } from '@/lib/chartRender';

const PX_PER_IN = 96;
const PAPER_IN = { 1: [8.5, 11], 5: [8.5, 14], 8: [11.69, 16.54], 9: [8.27, 11.69], 11: [5.83, 8.27], 70: [4.13, 5.83] }; // by ExcelJS paperSize
const MAX_ROWS = 3000;
const MAX_COLS = 120;
const MIN_SCALE = 0.7;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- colours -----------------------------------------------------------------

const DEFAULT_THEME = ['FFFFFF', '000000', 'E7E6E6', '44546A', '4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47'];
const INDEXED = { 8: '000000', 9: 'FFFFFF', 10: 'FF0000', 11: '00FF00', 12: '0000FF', 13: 'FFFF00', 14: 'FF00FF', 15: '00FFFF', 64: '000000', 65: 'FFFFFF' };

function themeColors(workbook) {
  const xml = Object.values(workbook?._themes || {})[0];
  if (typeof xml !== 'string') return DEFAULT_THEME;
  const grab = (tag) => {
    const m = xml.match(new RegExp(`<a:${tag}>\\s*<a:(?:srgbClr val|sysClr val="[^"]*" lastClr)="([0-9A-Fa-f]{6})"`));
    return m ? m[1].toUpperCase() : null;
  };
  const dk1 = grab('dk1'), lt1 = grab('lt1'), dk2 = grab('dk2'), lt2 = grab('lt2');
  const acc = [1, 2, 3, 4, 5, 6].map((n) => grab(`accent${n}`));
  if (!dk1 || !lt1) return DEFAULT_THEME;
  return [lt1, dk1, lt2 || 'E7E6E6', dk2 || '44546A', ...acc.map((c, i) => c || DEFAULT_THEME[4 + i])];
}

function applyTint(hex, tint) {
  if (!tint) return hex;
  const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  l = tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint;
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let rr = l, gg = l, bb = l;
  if (s) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    rr = f(p, q, h + 1 / 3); gg = f(p, q, h); bb = f(p, q, h - 1 / 3);
  }
  return [rr, gg, bb].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function cssColor(c, theme) {
  if (!c) return null;
  if (c.argb) return `#${c.argb.slice(-6)}`;
  if (c.theme !== undefined) return `#${applyTint(theme[c.theme] || '000000', c.tint)}`;
  if (c.indexed !== undefined) return `#${INDEXED[c.indexed] || '000000'}`;
  return null;
}

// ---- number / date formatting --------------------------------------------------

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n, w = 2) => String(n).padStart(w, '0');

const BUILTIN = { 9: '0%', 10: '0.00%', 3: '#,##0', 4: '#,##0.00', 1: '0', 2: '0.00', 14: 'm/d/yyyy', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss', 22: 'm/d/yyyy h:mm' };

function formatDate(d, fmt) {
  // Excel dates are stored in UTC by ExcelJS
  const Y = d.getUTCFullYear(), M = d.getUTCMonth(), D = d.getUTCDate(), H = d.getUTCHours(), Mi = d.getUTCMinutes(), S = d.getUTCSeconds();
  const ampm = /AM\/PM|A\/P/i.test(fmt);
  const tokens = fmt.match(/\[[^\]]*\]|"[^"]*"|\\.|yyyy|yy|mmmmm|mmmm|mmm|mm|m|dddd|ddd|dd|d|hh|h|ss|s|AM\/PM|A\/P|./gi) || [];
  let out = '';
  tokens.forEach((t, i) => {
    const l = t.toLowerCase();
    const prevH = tokens.slice(0, i).reverse().find((x) => /^(h+|m+|s+|[^\s:.\/-]+)$/i.test(x) && x !== ':')?.toLowerCase() || '';
    const nextS = tokens.slice(i + 1).find((x) => /^(s+|d+|y+|m+|h+)$/i.test(x))?.toLowerCase() || '';
    if (l === 'yyyy') out += Y;
    else if (l === 'yy') out += pad(Y % 100);
    else if (l === 'mmmm') out += MONTHS[M];
    else if (l === 'mmmmm') out += MONTHS[M][0];
    else if (l === 'mmm') out += MONTHS[M].slice(0, 3);
    else if (l === 'mm' || l === 'm') {
      const minute = /^h/.test(prevH) || /^s/.test(nextS);
      const v = minute ? Mi : M + 1;
      out += l === 'mm' ? pad(v) : v;
    } else if (l === 'dddd') out += DAYS[d.getUTCDay()];
    else if (l === 'ddd') out += DAYS[d.getUTCDay()].slice(0, 3);
    else if (l === 'dd') out += pad(D);
    else if (l === 'd') out += D;
    else if (l === 'hh' || l === 'h') { const h = ampm ? (H % 12 || 12) : H; out += l === 'hh' ? pad(h) : h; }
    else if (l === 'ss') out += pad(S);
    else if (l === 's') out += S;
    else if (l === 'am/pm' || l === 'a/p') out += H < 12 ? (l === 'a/p' ? 'A' : 'AM') : (l === 'a/p' ? 'P' : 'PM');
    else if (t[0] === '"') out += t.slice(1, -1);
    else if (t[0] === '\\') out += t[1];
    else if (t[0] === '[') out += '';
    else out += t;
  });
  return out;
}

const isDateFormat = (fmt) => /[ymdhs]/i.test(fmt.replace(/"[^"]*"|\[[^\]]*\]|\\./g, '').replace(/E[+-]/gi, '')) && !/^general$/i.test(fmt);

function formatNumber(n, fmtRaw) {
  const sections = fmtRaw.split(';');
  let fmt = sections[0];
  let value = n;
  if (n < 0 && sections[1]) { fmt = sections[1]; value = -n; }
  else if (n === 0 && sections[2]) fmt = sections[2];
  const clean = fmt.replace(/\[[^\]]*\]/g, '');
  const m = clean.match(/^((?:"[^"]*"|\\.|[^#0?.,%E])*)([#0?,.%E+\-]+?)((?:"[^"]*"|\\.|[^#0?.,%])*)$/) || null;
  const lit = (s) => s.replace(/"([^"]*)"/g, '$1').replace(/\\(.)/g, '$1').replace(/_.|\*./g, '');
  if (!m || !/[0#?]/.test(m[2])) return String(n);
  let [, pre, pat, post] = m;
  const pct = /%/.test(pat) || /%/.test(post);
  if (pct) value *= 100;
  pat = pat.replace(/%/g, '');
  let body;
  if (/E[+-]/i.test(pat)) {
    const dec = (pat.split('.')[1] || '').replace(/E.*/i, '').length;
    body = value.toExponential(dec).replace(/e([+-])(\d+)$/i, (m, sg, d) => `E${sg}${d.padStart(2, '0')}`);
  } else {
    const dec = (pat.split('.')[1] || '').replace(/[^0#?]/g, '').length;
    const group = pat.includes(',');
    const fixed = Math.abs(value).toFixed(dec);
    let [ip, fp] = fixed.split('.');
    const minInt = (pat.split('.')[0].match(/0/g) || []).length;
    ip = ip.padStart(minInt, '0');
    if (!minInt && Number(ip) === 0 && dec > 0) ip = '';
    if (group) ip = ip.replace(/\B(?=(?:\d{3})+$)/g, ',');
    body = ip + (fp !== undefined ? '.' + fp : '');
  }
  const neg = value < 0 || (n < 0 && !sections[1]);
  return `${neg ? '-' : ''}${lit(pre)}${body}${pct ? '%' : ''}${lit(post)}`;
}

function cellText(cell, ExcelJS) {
  const t = cell.type;
  const v = cell.value;
  const fmt = cell.numFmt || (cell.style && cell.style.numFmt) || 'General';
  let val = v;
  if (t === ExcelJS.ValueType.Formula) val = v.result !== undefined ? v.result : '';
  if (t === ExcelJS.ValueType.Hyperlink) val = v.text;
  if (val && typeof val === 'object' && 'error' in val) return String(val.error);
  if (val && typeof val === 'object' && Array.isArray(val.richText)) return val.richText.map((r) => r.text).join('');
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  const f = typeof fmt === 'number' ? BUILTIN[fmt] || 'General' : fmt;
  if (val instanceof Date) {
    return formatDate(val, isDateFormat(f) ? f : 'm/d/yyyy');
  }
  if (typeof val === 'number') {
    if (f === 'General' || f === '@') {
      return Number.isInteger(val) ? String(val) : String(Number(val.toPrecision(11)));
    }
    if (isDateFormat(f)) return formatDate(new Date(Math.round((val - 25569) * 86400000)), f);
    return formatNumber(val, f);
  }
  return String(val);
}

// ---- styles -> CSS ---------------------------------------------------------------

const BORDER_PX = { hair: 0.5, thin: 1, dotted: 1, dashed: 1, dashDot: 1, dashDotDot: 1, mediumDashed: 2, mediumDashDot: 2, mediumDashDotDot: 2, slantDashDot: 2, medium: 2, thick: 3, double: 3 };

function borderCss(side, b, theme, s) {
  if (!b || !b.style) return null;
  const w = Math.max(0.5, (BORDER_PX[b.style] || 1) * s);
  const kind = /dot/.test(b.style) ? (b.style === 'dotted' ? 'dotted' : 'dashed') : /dash/i.test(b.style) ? 'dashed' : 'solid';
  return `border-${side}:${w}px ${kind} ${cssColor(b.color, theme) || '#000'}`;
}

function runStyle(font, theme, s, base) {
  const f = font || {};
  const css = [];
  const size = (f.size || base.size || 11) * s;
  css.push(`font-size:${size}pt`);
  css.push(`font-family:'${String(f.name || base.name || 'Calibri').replace(/['"]/g, '')}',Arial,sans-serif`);
  if (f.bold) css.push('font-weight:bold');
  if (f.italic) css.push('font-style:italic');
  const deco = [];
  if (f.underline) deco.push('underline');
  if (f.strike) deco.push('line-through');
  if (deco.length) css.push(`text-decoration:${deco.join(' ')}`);
  const col = cssColor(f.color, theme);
  if (col) css.push(`color:${col}`);
  return css.join(';');
}

// ---- sheet model --------------------------------------------------------------------

function parseRange(ref) {
  const m = /^\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/.exec(ref || '');
  if (!m) return null;
  const col = (s) => s.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  return { left: col(m[1]), top: Number(m[2]), right: col(m[3] || m[1]), bottom: Number(m[4] || m[2]) };
}

function sheetBounds(ws) {
  const pa = parseRange(String(ws.pageSetup?.printArea || '').split(',')[0].replace(/^.*!/, ''));
  if (pa) return pa;
  let top = Infinity, left = Infinity, bottom = 0, right = 0;
  ws.eachRow({ includeEmpty: false }, (row, r) => {
    row.eachCell({ includeEmpty: false }, (cell, c) => {
      const has = (cell.value !== null && cell.value !== undefined && cell.value !== '') ||
        (cell.fill && cell.fill.type === 'pattern' && cell.fill.pattern !== 'none') ||
        (cell.border && Object.values(cell.border).some((b) => b && b.style));
      if (!has) return;
      top = Math.min(top, r); bottom = Math.max(bottom, r);
      left = Math.min(left, c); right = Math.max(right, c);
    });
  });
  if (!bottom) return null;
  return { top: 1, left: 1, bottom, right }; // Excel prints from A1
}

function buildSheetModel(ws, ExcelJS, warnings, charts = []) {
  const b = sheetBounds(ws) || (charts.length ? { top: 1, left: 1, bottom: 1, right: 1 } : null);
  if (!b) return null;
  let { top, left, bottom, right } = b;
  for (const ch of charts) { // keep chart areas inside the exported range
    if (ch.to) {
      right = Math.max(right, ch.to.col + 1);
      bottom = Math.max(bottom, ch.to.row + 1);
    } else if (ch.ext) { // anchored by size: walk columns / rows until the chart's extent is covered
      let x = ch.from.colOff, c = ch.from.col + 1;
      while (x < ch.ext.w && c < 200) { x += Math.round((ws.getColumn(c).width || ws.properties?.defaultColWidth || 8.43) * 7 + 5); c++; }
      right = Math.max(right, c - 1);
      let y = ch.from.rowOff, r = ch.from.row + 1;
      while (y < ch.ext.h && r < 2000) { y += Math.round((ws.getRow(r).height || ws.properties?.defaultRowHeight || 15) * PX_PER_IN / 72); r++; }
      bottom = Math.max(bottom, r - 1);
    }
  }
  if (bottom - top + 1 > MAX_ROWS) { bottom = top + MAX_ROWS - 1; warnings.push(`Sheet "${ws.name}" is very long; only the first ${MAX_ROWS} rows were exported.`); }
  if (right - left + 1 > MAX_COLS) { right = left + MAX_COLS - 1; warnings.push(`Sheet "${ws.name}" is very wide; only the first ${MAX_COLS} columns were exported.`); }

  const defCol = ws.properties?.defaultColWidth || 8.43;
  const cols = [];
  for (let c = left; c <= right; c++) {
    const col = ws.getColumn(c);
    cols.push({ c, hidden: !!col.hidden, px: col.hidden ? 0 : Math.round((col.width || defCol) * 7 + 5) });
  }
  const defRow = ws.properties?.defaultRowHeight || 15;
  const rows = [];
  for (let r = top; r <= bottom; r++) {
    const row = ws.getRow(r);
    rows.push({ r, hidden: !!row.hidden, px: row.hidden ? 0 : Math.round((row.height || defRow) * PX_PER_IN / 72) });
  }

  // merges
  const merges = new Map(); // "r,c" -> { rs, cs } for masters; "r,c" -> null for covered cells
  for (const ref of ws.model.merges || []) {
    const m = parseRange(ref);
    if (!m) continue;
    for (let r = m.top; r <= m.bottom; r++) for (let c = m.left; c <= m.right; c++) merges.set(`${r},${c}`, null);
    merges.set(`${m.top},${m.left}`, { rs: m.bottom - m.top + 1, cs: m.right - m.left + 1 });
  }
  const hasImages = (ws.getImages?.() || []).length > 0;
  if (hasImages) warnings.push(`Sheet "${ws.name}" contains pictures, which are not included yet.`);
  return { ws, name: ws.name, cols, rows, merges, top, left, bottom, right };
}

function buildTableHtml(model, colStart, colEnd, theme, s, base, ExcelJS) {
  const { ws, cols, rows, merges } = model;
  const stripCols = cols.slice(colStart, colEnd).filter((c) => !c.hidden);
  const colIdx = new Set(stripCols.map((c) => c.c));
  const cellAt = (r, c) => ws.findCell(r, c);

  const edge = (r, c, side) => {
    const cell = cellAt(r, c);
    return cell?.border?.[side];
  };

  let html = `<table style="border-collapse:separate;border-spacing:0;table-layout:fixed;width:${stripCols.reduce((n, c) => n + c.px * s, 0)}px"><colgroup>`;
  for (const c of stripCols) html += `<col style="width:${c.px * s}px">`;
  html += '</colgroup><tbody>';

  for (const row of rows) {
    if (row.hidden) continue;
    html += `<tr style="height:${row.px * s}px">`;
    for (const col of stripCols) {
      const key = `${row.r},${col.c}`;
      const merge = merges.get(key);
      if (merges.has(key) && merge === null) continue; // covered by a merge
      const cell = cellAt(row.r, col.c);
      const rs = merge ? Math.min(merge.rs, rows.filter((x) => !x.hidden && x.r >= row.r && x.r < row.r + merge.rs).length) : 1;
      const cs = merge ? stripCols.filter((x) => x.c >= col.c && x.c < col.c + merge.cs).length : 1;
      const lastCol = merge ? col.c + merge.cs - 1 : col.c;
      const lastRow = merge ? row.r + merge.rs - 1 : row.r;

      const css = ['padding:0 3px', 'overflow:hidden', 'box-sizing:border-box', `height:${row.px * s}px`];
      let inner = '';
      if (cell) {
        const fill = cell.fill && cell.fill.type === 'pattern' && cell.fill.pattern === 'solid' ? cssColor(cell.fill.fgColor, theme) : null;
        if (fill) css.push(`background:${fill}`);
        const al = cell.alignment || {};
        const isNum = cell.type === ExcelJS.ValueType.Number || cell.type === ExcelJS.ValueType.Date ||
          (cell.type === ExcelJS.ValueType.Formula && typeof cell.value.result === 'number');
        const isBool = cell.type === ExcelJS.ValueType.Boolean;
        const h = al.horizontal || (isBool ? 'center' : isNum ? 'right' : 'left');
        css.push(`text-align:${h === 'centerContinuous' ? 'center' : h === 'distributed' || h === 'fill' ? 'left' : h}`);
        css.push(`vertical-align:${al.vertical === 'top' ? 'top' : al.vertical === 'middle' || al.vertical === 'center' ? 'middle' : 'bottom'}`);
        css.push(al.wrapText ? 'white-space:pre-wrap;word-break:break-word' : 'white-space:nowrap');
        if (al.indent) css.push(`padding-left:${3 + al.indent * 9 * s}px`);

        // borders: own edge, else the neighbour's facing edge (so shared lines are drawn once)
        const left = edge(row.r, col.c, 'left') || (colIdx.has(col.c - 1) ? edge(row.r, col.c - 1, 'right') : null);
        const top = edge(row.r, col.c, 'top') || edge(row.r - 1, col.c, 'bottom');
        const right = edge(row.r, lastCol, 'right');
        const bottom = edge(lastRow, col.c, 'bottom');
        const nextRight = colIdx.has(lastCol + 1) && edge(row.r, lastCol + 1, 'left');
        const nextBottom = edge(lastRow + 1, col.c, 'top');
        [borderCss('left', left, theme, s), borderCss('top', top, theme, s),
          nextRight ? null : borderCss('right', right, theme, s),
          nextBottom ? null : borderCss('bottom', bottom, theme, s)].filter(Boolean).forEach((x) => css.push(x));

        const rich = cell.value && typeof cell.value === 'object' && Array.isArray(cell.value.richText) ? cell.value.richText : null;
        if (rich) {
          inner = rich.map((r) => `<span style="${runStyle({ ...cell.font, ...r.font }, theme, s, base)}">${esc(r.text)}</span>`).join('');
        } else {
          const text = cellText(cell, ExcelJS);
          if (text !== '') inner = `<span style="${runStyle(cell.font, theme, s, base)}">${esc(text)}</span>`;
        }
        if (al.textRotation) css.push('/* rotated text is drawn horizontally */');
      }
      html += `<td${rs > 1 ? ` rowspan="${rs}"` : ''}${cs > 1 ? ` colspan="${cs}"` : ''} style="${css.join(';')}">${inner || '&nbsp;'}</td>`;
    }
    html += '</tr>';
  }
  return html + '</tbody></table>';
}


// ---- charts ---------------------------------------------------------------------------

const EMU_PX = 9525;
const parseXml = (t) => new DOMParser().parseFromString(t, 'application/xml');
const dirOf = (p) => p.slice(0, p.lastIndexOf('/'));
function joinPath(base, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = dirOf(base).split('/').filter(Boolean);
  for (const seg of target.split('/')) { if (seg === '..') parts.pop(); else if (seg !== '.') parts.push(seg); }
  return parts.join('/');
}
const relMap = async (zip, path) => {
  const f = zip.file(`${dirOf(path)}/_rels/${path.slice(path.lastIndexOf('/') + 1)}.rels`);
  const map = {};
  if (f) for (const r of parseXml(await f.async('text')).documentElement.children) map[r.getAttribute('Id')] = joinPath(path, r.getAttribute('Target'));
  return map;
};
const local = (n, name) => [...n.children].find((c) => c.localName === name) || null;

/**
 * ExcelJS throws on sheets that contain charts - and the failed attempt poisons its shared
 * parser state - so charts/drawings are removed up front (charts are read separately).
 */
async function withoutDrawings(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  if (!Object.keys(zip.files).some((n) => /^xl\/drawings\//.test(n))) return buffer;
  const out = new JSZip();
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir || /^xl\/(drawings|charts)\//.test(name)) continue;
    if (/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) {
      const xml = await entry.async('string');
      out.file(name, xml.replace(/<drawing\b[^>]*\/>/g, ''));
    } else if (/^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/.test(name)) {
      const xml = await entry.async('string');
      out.file(name, xml.replace(/<Relationship\b[^>]*relationships\/drawing"[^>]*\/>/g, ''));
    } else {
      out.file(name, await entry.async('uint8array'));
    }
  }
  return out.generateAsync({ type: 'arraybuffer' });
}

/** Charts anchored on each sheet: Map<sheetName, [{ from, to, doc }]> (cell anchors are 0-based). */
async function readSheetCharts(buffer) {
  const out = new Map();
  try {
    const zip = await JSZip.loadAsync(buffer);
    const wbFile = zip.file('xl/workbook.xml');
    if (!wbFile) return out;
    const wbRels = await relMap(zip, 'xl/workbook.xml');
    const sheets = [...parseXml(await wbFile.async('text')).getElementsByTagNameNS('*', 'sheet')];
    for (const sh of sheets) {
      const sheetPath = wbRels[sh.getAttribute('r:id')];
      if (!sheetPath) continue;
      const sRels = await relMap(zip, sheetPath);
      const sheetFile = zip.file(sheetPath);
      if (!sheetFile) continue;
      const drawing = parseXml(await sheetFile.async('text')).getElementsByTagNameNS('*', 'drawing')[0];
      const drawPath = drawing && sRels[drawing.getAttribute('r:id')];
      const drawFile = drawPath && zip.file(drawPath);
      if (!drawFile) continue;
      const dRels = await relMap(zip, drawPath);
      const list = [];
      for (const anchor of parseXml(await drawFile.async('text')).documentElement.children) {
        const chartEl = anchor.getElementsByTagNameNS('*', 'chart')[0];
        const chartPath = chartEl && dRels[chartEl.getAttribute('r:id')];
        const chartFile = chartPath && zip.file(chartPath);
        if (!chartFile) continue;
        const pos = (n) => n && ({ col: Number(local(n, 'col')?.textContent || 0), colOff: Number(local(n, 'colOff')?.textContent || 0) / EMU_PX, row: Number(local(n, 'row')?.textContent || 0), rowOff: Number(local(n, 'rowOff')?.textContent || 0) / EMU_PX });
        const ext = local(anchor, 'ext');
        list.push({ from: pos(local(anchor, 'from')), to: pos(local(anchor, 'to')), ext: ext && { w: Number(ext.getAttribute('cx')) / EMU_PX, h: Number(ext.getAttribute('cy')) / EMU_PX }, doc: parseXml(await chartFile.async('text')) });
      }
      if (list.length) out.set(sh.getAttribute('name'), list);
    }
  } catch {
    // charts are optional; ignore parse problems
  }
  return out;
}

/** Absolutely positioned <img> markup for the charts that start inside columns [a, b) of a sheet. */
function chartOverlays(workbook, ws, model, charts, a, b, scale, theme) {
  // values of a referenced range such as 'Sheet 1'!$B$2:$B$7 (for charts saved without cached data)
  const lookup = (formula) => {
    const m = /^(?:'((?:[^']|'')+)'|([^!']+))!(.+)$/.exec(formula);
    const sheet = m ? workbook.getWorksheet((m[1] || m[2]).replace(/''/g, "'")) : ws;
    const r = parseRange(m ? m[3] : formula);
    if (!sheet || !r) return null;
    const vals = [];
    for (let row = r.top; row <= r.bottom; row++) for (let col = r.left; col <= r.right; col++) {
      const v = sheet.getCell(row, col).value;
      vals.push(v && typeof v === 'object' ? (v.result ?? v.text ?? '') : v ?? '');
    }
    return vals;
  };
  const defCol = ws.properties?.defaultColWidth || 8.43, defRow = ws.properties?.defaultRowHeight || 15;
  const colW = (c) => { const col = ws.getColumn(c); return col.hidden ? 0 : Math.round((col.width || defCol) * 7 + 5); };
  const rowH = (r) => { const row = ws.getRow(r); return row.hidden ? 0 : Math.round((row.height || defRow) * PX_PER_IN / 72); };
  const colX = (c0) => { let x = 0; for (let c = 1; c <= c0; c++) x += colW(c); return x; }; // left edge of 0-based column c0
  const rowY = (r0) => { let y = 0; for (let r = 1; r <= r0; r++) y += rowH(r); return y; };
  const accent = (n) => theme[3 + n] || null;
  const stripLeft = model.cols[a].c, stripRight = model.cols[b - 1].c;
  let html = '';
  for (const ch of charts) {
    const col1 = ch.from.col + 1;
    if (col1 < stripLeft || col1 > stripRight) continue;
    const x = colX(ch.from.col) + ch.from.colOff, y = rowY(ch.from.row) + ch.from.rowOff;
    let w, h;
    if (ch.to) { w = colX(ch.to.col) + ch.to.colOff - x; h = rowY(ch.to.row) + ch.to.rowOff - y; } else if (ch.ext) { w = ch.ext.w; h = ch.ext.h; }
    if (!(w > 20 && h > 20)) continue;
    const res = chartToSvg(ch.doc, Math.round(w * scale), Math.round(h * scale), {
      lookup,
      color: (spPr) => {
        const fill = spPr && [...spPr.children].find((c) => c.localName === 'solidFill');
        const c = fill && fill.firstElementChild;
        if (!c) return null;
        if (c.localName === 'srgbClr') return c.getAttribute('val');
        const m = /^accent(\d)$/.exec(c.getAttribute('val') || '');
        return m ? accent(Number(m[1])) : null;
      },
    });
    if (!res.dataUrl) continue;
    const left = (x - colX(stripLeft - 1)) * scale, top = (y - rowY(model.top - 1)) * scale;
    html += `<img src="${res.dataUrl}" alt="" style="position:absolute;left:${left}px;top:${top}px;width:${w * scale}px;height:${h * scale}px;">`;
  }
  return html;
}

// ---- public -----------------------------------------------------------------------------

export async function renderXlsxSections(arrayBuffer, host) {
  const ExcelJS = (await import('exceljs')).default;
  const warnings = [];
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await withoutDrawings(arrayBuffer));
  } catch (err) {
    console.error('xlsx load failed:', err);
    throw new Error('This file could not be read as an .xlsx workbook. If it is an old .xls file, save it as .xlsx in Excel first.');
  }
  const theme = themeColors(workbook);
  const chartsBySheet = await readSheetCharts(arrayBuffer);
  const base = { name: 'Calibri', size: 11 };
  const sections = [];

  for (const ws of workbook.worksheets) {
    if (ws.state && ws.state !== 'visible') continue;
    const model = buildSheetModel(ws, ExcelJS, warnings, chartsBySheet.get(ws.name) || []);
    if (!model) continue;

    const setup = ws.pageSetup || {};
    const [pw, ph] = PAPER_IN[setup.paperSize] || PAPER_IN[9];
    const natural = model.cols.reduce((n, c) => n + c.px, 0);
    const m = setup.margins || {};
    const ml = (m.left ?? 0.7) * PX_PER_IN, mr = (m.right ?? 0.7) * PX_PER_IN;
    const mt = (m.top ?? 0.75) * PX_PER_IN, mb = (m.bottom ?? 0.75) * PX_PER_IN;
    const portraitContent = pw * PX_PER_IN - ml - mr;
    const landscape = setup.orientation ? setup.orientation === 'landscape' : natural > portraitContent * 1.02;
    const pageW = Math.round((landscape ? ph : pw) * PX_PER_IN);
    const pageH = Math.round((landscape ? pw : ph) * PX_PER_IN);
    const contentW = pageW - ml - mr;

    let scale = setup.scale ? setup.scale / 100 : 1;
    if (!setup.scale && natural > contentW) {
      const fit = contentW / natural;
      scale = setup.fitToPage && setup.fitToWidth === 1 ? fit : Math.max(MIN_SCALE, fit);
    }
    scale = Math.min(scale, 1.5);

    // split columns into strips that fit a page
    const strips = [];
    let start = 0, acc = 0;
    model.cols.forEach((c, i) => {
      const w = c.px * scale;
      if (acc + w > contentW + 0.5 && i > start) { strips.push([start, i]); start = i; acc = 0; }
      acc += w;
    });
    strips.push([start, model.cols.length]);

    for (const [a, b] of strips) {
      const section = document.createElement('section');
      section.className = 'xlsx-page';
      section.style.cssText = `position:relative;display:block;box-sizing:border-box;background:#fff;width:${pageW}px;min-height:${pageH}px;padding:${mt}px ${mr}px ${mb}px ${ml}px;margin:0 0 20px 0;color:#000;`;
      const article = document.createElement('article');
      article.style.position = 'relative';
      article.innerHTML = buildTableHtml(model, a, b, theme, scale, base, ExcelJS) + chartOverlays(workbook, ws, model, chartsBySheet.get(ws.name) || [], a, b, scale, theme);
      section.appendChild(article);
      host.appendChild(section);
      sections.push(section);
    }
  }
  if (!sections.length) throw new Error('This workbook has no visible data to export.');
  return { sections, warnings };
}

/** Convert an .xlsx File/ArrayBuffer to PDF bytes. */
export async function xlsxToPdf(file, { onProgress } = {}) {
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;width:auto;pointer-events:none;';
  document.body.appendChild(host);
  try {
    onProgress?.(15);
    const { sections, warnings } = await renderXlsxSections(buffer, host);
    if (document.fonts?.ready) await document.fonts.ready;
    onProgress?.(40);
    const bytes = await sectionsToPdf(sections, {
      onProgress: (done, total) => onProgress?.(40 + Math.round((done / total) * 55)),
    });
    return { bytes, warnings };
  } finally {
    host.remove();
  }
}
