// Office chart XML (DrawingML charts: c:chartSpace) -> SVG, for the Excel / PowerPoint -> PDF
// converters. Uses the values cached inside the chart part, so no workbook is needed.
// Supports column/bar (clustered, stacked, 100%), line, area, pie and doughnut charts.

const OFFICE_PALETTE = ['4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47', '264478', '9E480E'];

const kids = (n, name) => (n ? [...n.children].filter((c) => c.localName === name) : []);
const kid = (n, name) => kids(n, name)[0] || null;
const at = (n, path) => path.split('/').reduce((cur, name) => (cur ? kid(cur, name) : null), n);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let lookupRef = null; // (formula) => values[] when a chart part carries no cached values

function cache(refNode) {
  // strRef/numRef/strLit/numLit -> ordered array of values
  const c = kid(refNode, 'strCache') || kid(refNode, 'numCache') || refNode;
  const pts = [];
  for (const pt of kids(c, 'pt')) pts[Number(pt.getAttribute('idx'))] = kid(pt, 'v')?.textContent ?? '';
  const count = Number(kid(c, 'ptCount')?.getAttribute('val') || pts.length);
  if (!pts.length) {
    const f = kid(refNode, 'f')?.textContent;
    const live = f && lookupRef ? lookupRef(f) : null;
    if (live) return live;
  }
  return Array.from({ length: count }, (_, i) => pts[i] ?? '');
}
const refOf = (n) => kid(n, 'strRef') || kid(n, 'numRef') || kid(n, 'strLit') || kid(n, 'numLit') || kid(n, 'multiLvlStrRef');

function niceScale(min, max, ticks = 5) {
  if (min === max) { max = min + 1; }
  const span = max - min;
  const raw = span / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out = [];
  for (let v = lo; v <= hi + step / 1000; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

const fmt = (v) => (Math.abs(v) >= 1e6 ? `${+(v / 1e6).toFixed(2)}M` : Math.abs(v) >= 1e4 ? `${+(v / 1e3).toFixed(1)}k` : String(+v.toFixed(2)));

function titleText(chart) {
  const t = kid(chart, 'title');
  if (!t) return '';
  return [...t.getElementsByTagNameNS('*', 't')].map((x) => x.textContent).join('');
}

/**
 * @param {Document} doc       parsed chart part
 * @param {number} W,H         output size in CSS px
 * @param {{ color: (spPr: Element|null, i: number) => string|null }} opts
 * @returns {{ svg: string } | { error: string }}
 */
export function chartToSvg(doc, W, H, opts = {}) {
  lookupRef = opts.lookup || null;
  const chart = at(doc.documentElement, 'chart');
  const plot = at(chart, 'plotArea');
  if (!plot) return { error: 'empty chart' };
  const typeNode = [...plot.children].find((c) => /Chart$/.test(c.localName) && !/^(bubble|stock|surface|radar|ofPie)/.test(c.localName));
  if (!typeNode) return { error: 'unsupported chart type' };
  const type = typeNode.localName.replace('3DChart', 'Chart'); // 3-D variants drawn flat
  const sers = kids(typeNode, 'ser').map((ser, i) => {
    const cat = refOf(kid(ser, 'cat')) ? cache(refOf(kid(ser, 'cat'))) : null;
    const val = cache(refOf(kid(ser, 'val')) || kid(ser, 'yVal') || {}).map(Number);
    const name = refOf(kid(ser, 'tx')) ? cache(refOf(kid(ser, 'tx')))[0] : `Series ${i + 1}`;
    const color = (opts.color && opts.color(kid(ser, 'spPr'), i)) || OFFICE_PALETTE[i % OFFICE_PALETTE.length];
    const dpts = kids(ser, 'dPt').map((d) => ({ idx: Number(kid(d, 'idx')?.getAttribute('val')), color: opts.color && opts.color(kid(d, 'spPr'), -1) }));
    return { name, cat, val, color, dpts };
  });
  if (!sers.length || !sers[0].val.length) return { error: 'no data' };
  const cats = sers[0].cat || sers[0].val.map((_, i) => String(i + 1));
  const n = cats.length;

  const title = titleText(chart);
  const showLegend = !!kid(chart, 'legend') && (sers.length > 1 || type === 'pieChart' || type === 'doughnutChart');
  const SCALE = 2;
  const FONT = 'Arial, Helvetica, sans-serif';
  const top = title ? 34 : 14;
  const legendH = showLegend ? 26 : 0;
  let body = '';
  const text = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.size || 11}" fill="${o.fill || '#444'}" text-anchor="${o.anchor || 'start'}"${o.bold ? ' font-weight="bold"' : ''}${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${esc(s)}</text>`;
  if (title) body += text(W / 2, 22, title, { size: 15, anchor: 'middle', bold: true, fill: '#222' });

  if (type === 'pieChart' || type === 'doughnutChart') {
    const s = sers[0];
    const total = s.val.reduce((a, b) => a + Math.max(0, b || 0), 0) || 1;
    const cx = W / 2, cy = top + (H - top - legendH) / 2;
    const r = Math.min(W - 30, H - top - legendH - 10) / 2;
    let a0 = -Math.PI / 2;
    s.val.forEach((v, i) => {
      const frac = Math.max(0, v || 0) / total;
      const a1 = a0 + frac * Math.PI * 2;
      const col = (s.dpts.find((d) => d.idx === i)?.color) || OFFICE_PALETTE[i % OFFICE_PALETTE.length];
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
      const inner = type === 'doughnutChart' ? r * 0.55 : 0;
      body += frac >= 0.9999
        ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col.startsWith('#') ? col : '#' + col}" stroke="#fff"/>`
        : `<path d="M${p(r, a0)} A${r} ${r} 0 ${large} 1 ${p(r, a1)} ${inner ? `L${p(inner, a1)} A${inner} ${inner} 0 ${large} 0 ${p(inner, a0)}` : `L${cx} ${cy}`} Z" fill="${col.startsWith('#') ? col : '#' + col}" stroke="#fff" stroke-width="1.5"/>`;
      if (frac > 0.04) {
        const am = (a0 + a1) / 2, lr = inner ? (r + inner) / 2 : r * 0.65;
        body += text(cx + lr * Math.cos(am), cy + lr * Math.sin(am) + 4, `${Math.round(frac * 100)}%`, { anchor: 'middle', fill: '#fff', size: 12, bold: true });
      }
      a0 = a1;
    });
    if (showLegend) {
      let lx = 10; const ly = H - 10;
      cats.forEach((c, i) => {
        const col = OFFICE_PALETTE[i % OFFICE_PALETTE.length];
        body += `<rect x="${lx}" y="${ly - 9}" width="10" height="10" fill="#${col}"/>` + text(lx + 14, ly, c, { size: 11 });
        lx += 24 + String(c).length * 6.2;
      });
    }
  } else {
    // axes charts: column / bar / line / area
    const horizontal = type === 'barChart' && kid(typeNode, 'barDir')?.getAttribute('val') === 'bar';
    const grouping = kid(typeNode, 'grouping')?.getAttribute('val') || 'clustered';
    const stacked = /stacked/i.test(grouping), percent = grouping === 'percentStacked';
    const isLine = type === 'lineChart' || type === 'areaChart' || type === 'scatterChart';
    const left = horizontal ? 70 : 48, right = 14, bottom = 28 + legendH, plotTop = top;
    const pw = W - left - right, ph = H - plotTop - bottom;

    let lo = 0, hi = 0;
    const totals = Array.from({ length: n }, (_, i) => sers.reduce((a, s) => a + (s.val[i] || 0), 0));
    if (percent) { lo = 0; hi = 100; }
    else if (stacked) { hi = Math.max(...totals, 0); lo = Math.min(0, ...sers.flatMap((s) => s.val)); }
    else { const all = sers.flatMap((s) => s.val.filter((v) => Number.isFinite(v))); hi = Math.max(...all, 0); lo = Math.min(0, ...all); }
    const ticks = niceScale(lo, hi);
    const vmin = ticks[0], vmax = ticks[ticks.length - 1];
    const vpos = (v) => (horizontal ? left + ((v - vmin) / (vmax - vmin)) * pw : plotTop + ph - ((v - vmin) / (vmax - vmin)) * ph);

    for (const t of ticks) {
      const p = vpos(t);
      body += horizontal
        ? `<line x1="${p}" y1="${plotTop}" x2="${p}" y2="${plotTop + ph}" stroke="#ddd"/>` + text(p, plotTop + ph + 14, fmt(t) + (percent ? '%' : ''), { anchor: 'middle', size: 10 })
        : `<line x1="${left}" y1="${p}" x2="${left + pw}" y2="${p}" stroke="#ddd"/>` + text(left - 6, p + 3.5, fmt(t) + (percent ? '%' : ''), { anchor: 'end', size: 10 });
    }
    const band = (horizontal ? ph : pw) / n;
    const catPos = (i) => (horizontal ? plotTop + band * i : left + band * i);
    cats.forEach((c, i) => {
      const mid = catPos(i) + band / 2;
      const label = String(c).length > 14 && band < 70 ? String(c).slice(0, 13) + '…' : String(c);
      body += horizontal ? text(left - 6, mid + 3.5, label, { anchor: 'end', size: 10 }) : text(mid, plotTop + ph + 14, label, { anchor: 'middle', size: 10 });
    });
    // baseline
    const zero = vpos(Math.max(vmin, 0));
    body += horizontal ? `<line x1="${zero}" y1="${plotTop}" x2="${zero}" y2="${plotTop + ph}" stroke="#888"/>` : `<line x1="${left}" y1="${zero}" x2="${left + pw}" y2="${zero}" stroke="#888"/>`;

    const colorOf = (s, i) => { const d = s.dpts.find((x) => x.idx === i)?.color; const c = d || s.color; return c.startsWith('#') ? c : `#${c}`; };
    if (!isLine) {
      const gap = band * 0.2, usable = band - gap * 2;
      const per = stacked ? usable : usable / sers.length;
      const acc = Array(n).fill(0);
      sers.forEach((s, si) => {
        s.val.forEach((v, i) => {
          if (!Number.isFinite(v)) return;
          const value = percent ? (v / (totals[i] || 1)) * 100 : v;
          const base = stacked ? acc[i] : 0;
          if (stacked) acc[i] += value;
          const a = vpos(base), b = vpos(base + value);
          const off = catPos(i) + gap + (stacked ? 0 : per * si);
          body += horizontal
            ? `<rect x="${Math.min(a, b)}" y="${off}" width="${Math.abs(b - a)}" height="${per}" fill="${colorOf(s, i)}"/>`
            : `<rect x="${off}" y="${Math.min(a, b)}" width="${per}" height="${Math.abs(b - a)}" fill="${colorOf(s, i)}"/>`;
        });
      });
    } else {
      sers.forEach((s) => {
        const pts = s.val.map((v, i) => (Number.isFinite(v) ? [left + band * (i + 0.5), vpos(v)] : null)).filter(Boolean);
        if (!pts.length) return;
        const col = s.color.startsWith('#') ? s.color : `#${s.color}`;
        if (type === 'areaChart') body += `<path d="M${pts[0][0]} ${zero} ${pts.map((p) => `L${p[0]} ${p[1]}`).join(' ')} L${pts[pts.length - 1][0]} ${zero} Z" fill="${col}" fill-opacity="0.45"/>`;
        body += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`;
        if (type === 'lineChart') for (const p of pts) body += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${col}"/>`;
      });
    }
    if (showLegend) {
      let lx = left; const ly = H - 8;
      sers.forEach((s) => {
        const col = s.color.startsWith('#') ? s.color : `#${s.color}`;
        body += `<rect x="${lx}" y="${ly - 9}" width="10" height="10" fill="${col}"/>` + text(lx + 14, ly, s.name, { size: 11 });
        lx += 28 + String(s.name).length * 6.2;
      });
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * SCALE}" height="${H * SCALE}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`;
  return { svg, dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` };
}
