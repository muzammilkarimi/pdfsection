// Table detection for the PDF -> Word export.
//
// Tables are recognised from their drawn grid: thin filled rectangles / stroked boxes that
// the layout extractor reports as `shapes`. Lines that touch form one grid; the distinct x/y
// positions give columns and rows, missing interior lines give merged cells, and the text
// segments that fall inside become cell paragraphs. Everything used is removed from the page
// model so it isn't also drawn as loose shapes / frames.
//
// All coordinates are PDF points, y down (same as lib/pdfLayout.js).

const TOL = 2;
const THIN = 2.5;

function cluster(values, tol = TOL) {
  const sorted = [...values].sort((a, b) => a - b);
  const out = [];
  for (const v of sorted) {
    const last = out[out.length - 1];
    if (last && v - last.sum / last.n <= tol) { last.sum += v; last.n += 1; }
    else out.push({ sum: v, n: 1 });
  }
  return out.map((c) => c.sum / c.n);
}

function find(parent, i) {
  while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
  return i;
}

function covers(line, a0, a1, axis) {
  // does `line` cover at least 70% of the interval [a0, a1]?
  const lo = axis === 'h' ? line.x0 : line.y0, hi = axis === 'h' ? line.x1 : line.y1;
  const overlap = Math.min(hi, a1) - Math.max(lo, a0);
  return overlap >= (a1 - a0) * 0.7;
}

/** Turn the segments assigned to a cell into paragraphs, alignment and padding. */
function finishCell(cell) {
  cell.paras = [];
  // Empty cells (no text at all) keep the defaults: there is no first or last line to measure.
  if (!cell.segs?.length) return;
  const sorted = [...cell.segs].sort((a, b) => a.baseline - b.baseline || a.x - b.x);
  const lines = [];
  for (const sg of sorted) {
    const line = lines.find((l) => Math.abs(l.baseline - sg.baseline) <= sg.size * 0.5);
    if (line) line.segs.push(sg); else lines.push({ baseline: sg.baseline, size: sg.size, segs: [sg] });
  }
  for (const line of lines) {
    const runs = [];
    line.segs.sort((a, b) => a.x - b.x).forEach((sg, k) => {
      if (k) runs.push({ ...sg.runs[0], text: ' ', width: sg.size * 0.25 });
      runs.push(...sg.runs);
    });
    const x0 = Math.min(...line.segs.map((sg) => sg.x)), x1 = Math.max(...line.segs.map((sg) => sg.x + sg.width));
    const lp = x0 - cell.x0, rp = cell.x1 - x1;
    const align = cell.forceAlign || (Math.abs(lp - rp) < 3 && lp > 6 ? 'center' : rp < lp - 6 ? 'right' : 'left');
    cell.paras.push({ runs, baseline: line.baseline, size: line.size, align, x0, x1 });
  }
  const first = cell.paras[0], last = cell.paras[cell.paras.length - 1];
  const padTop = first.baseline - first.size * 0.99 - cell.y0;
  const padBottom = cell.y1 - (last.baseline + last.size * 0.21);
  cell.valign = Math.abs(padTop - padBottom) <= 2.5 ? 'center' : padBottom < padTop - 3 ? 'bottom' : 'top';
  cell.padTop = Math.max(0, padTop);
  cell.padLeft = Math.max(0, first.align === 'right' ? 0 : first.x0 - cell.x0);
  cell.padRight = Math.max(0, first.align === 'right' ? cell.x1 - first.x1 : 0);
}

/**
 * Detect tables on a page model and move their content into `page.tables`.
 * @param {{ segments: object[], shapes?: object[] }} page
 */
export function detectTables(page) {
  const shapes = page.shapes || [];
  page.tables = [];
  if (shapes.length < 4) { detectTextTables(page); return page; }

  // 1. collect candidate grid lines
  const hl = [], vl = [], fills = [];
  shapes.forEach((s, i) => {
    const thinH = s.h <= THIN && s.w >= 10, thinV = s.w <= THIN && s.h >= 10;
    if (s.fill && !s.stroke && thinH) hl.push({ src: i, x0: s.x, x1: s.x + s.w, y: s.y + s.h / 2, t: Math.max(s.h, 0.5), color: s.fill });
    else if (s.fill && !s.stroke && thinV) vl.push({ src: i, y0: s.y, y1: s.y + s.h, x: s.x + s.w / 2, t: Math.max(s.w, 0.5), color: s.fill });
    else if (s.stroke && s.w > 6 && s.h > 6) {
      const t = Math.max(s.strokeW || 0.5, 0.5);
      hl.push({ src: i, x0: s.x, x1: s.x + s.w, y: s.y, t, color: s.stroke }, { src: i, x0: s.x, x1: s.x + s.w, y: s.y + s.h, t, color: s.stroke });
      vl.push({ src: i, y0: s.y, y1: s.y + s.h, x: s.x, t, color: s.stroke }, { src: i, y0: s.y, y1: s.y + s.h, x: s.x + s.w, t, color: s.stroke });
      if (s.fill) fills.push({ src: i, x: s.x, y: s.y, w: s.w, h: s.h, color: s.fill });
    } else if (s.fill && s.w > 6 && s.h > 6) fills.push({ src: i, x: s.x, y: s.y, w: s.w, h: s.h, color: s.fill });
  });
  if (hl.length < 2 || vl.length < 2) { detectTextTables(page); return page; }

  // 2. connected groups of lines that touch
  const all = [...hl.map((l) => ({ ...l, dir: 'h' })), ...vl.map((l) => ({ ...l, dir: 'v' }))];
  const parent = all.map((_, i) => i);
  for (let i = 0; i < all.length; i++) {
    if (all[i].dir !== 'h') continue;
    for (let j = 0; j < all.length; j++) {
      if (all[j].dir !== 'v') continue;
      const h = all[i], v = all[j];
      if (v.x >= h.x0 - TOL && v.x <= h.x1 + TOL && h.y >= v.y0 - TOL && h.y <= v.y1 + TOL) {
        parent[find(parent, i)] = find(parent, j);
      }
    }
  }
  const groups = new Map();
  all.forEach((l, i) => { const r = find(parent, i); (groups.get(r) || groups.set(r, []).get(r)).push(l); });

  const usedShapes = new Set();
  const usedSegs = new Set();

  for (const g of groups.values()) {
    const H = g.filter((l) => l.dir === 'h'), V = g.filter((l) => l.dir === 'v');
    const xs = cluster(V.map((l) => l.x)), ys = cluster(H.map((l) => l.y));
    if (xs.length < 2 || ys.length < 2 || (xs.length - 1) * (ys.length - 1) < 2) continue;
    const bbox = { x0: xs[0], x1: xs[xs.length - 1], y0: ys[0], y1: ys[ys.length - 1] };
    if (bbox.x1 - bbox.x0 < 30 || bbox.y1 - bbox.y0 < 15) continue;

    const nR = ys.length - 1, nC = xs.length - 1;
    const hasV = (xi, r) => V.some((l) => Math.abs(l.x - xs[xi]) <= TOL && covers(l, ys[r], ys[r + 1], 'v'));
    const hasH = (yi, c) => H.some((l) => Math.abs(l.y - ys[yi]) <= TOL && covers(l, xs[c], xs[c + 1], 'h'));
    const lineAt = (arr, key, pos, a0, a1, axis) => arr.find((l) => Math.abs(l[key] - pos) <= TOL && covers(l, a0, a1, axis));

    // 3. merged cells
    const grid = Array.from({ length: nR }, () => Array(nC).fill(null));
    for (let r = 0; r < nR; r++) {
      for (let c = 0; c < nC; c++) {
        if (grid[r][c]) continue;
        let cs = 1, rs = 1;
        while (c + cs < nC && !hasV(c + cs, r)) cs++;
        const spanOk = () => {
          if (r + rs >= nR) return false;
          for (let k = c; k < c + cs; k++) if (hasH(r + rs, k)) return false;
          return true;
        };
        while (spanOk()) rs++;
        const cell = { r, c, cs, rs, x0: xs[c], x1: xs[c + cs], y0: ys[r], y1: ys[r + rs], lines: [], fill: null };
        for (let rr = r; rr < r + rs; rr++) for (let cc = c; cc < c + cs; cc++) grid[rr][cc] = rr === r && cc === c ? cell : { cover: cell, first: cc === c };
      }
    }
    const cells = [];
    grid.forEach((row) => row.forEach((x) => { if (x && !x.cover) cells.push(x); }));

    // 4. borders and fills
    for (const cell of cells) {
      const b = (key, pos, a0, a1, axis, arr) => { const l = lineAt(arr, key, pos, a0, a1, axis); return l ? { w: l.t, color: l.color } : null; };
      cell.borders = {
        top: b('y', cell.y0, cell.x0, cell.x1, 'h', H),
        bottom: b('y', cell.y1, cell.x0, cell.x1, 'h', H),
        left: b('x', cell.x0, cell.y0, cell.y1, 'v', V),
        right: b('x', cell.x1, cell.y0, cell.y1, 'v', V),
      };
    }
    for (const f of fills) {
      const hits = cells.filter((cell) => {
        const ow = Math.min(f.x + f.w, cell.x1) - Math.max(f.x, cell.x0), oh = Math.min(f.y + f.h, cell.y1) - Math.max(f.y, cell.y0);
        return ow > 0 && oh > 0 && (ow * oh) / ((cell.x1 - cell.x0) * (cell.y1 - cell.y0)) >= 0.6;
      });
      if (!hits.length) continue;
      const area = hits.reduce((n, cell) => n + (cell.x1 - cell.x0) * (cell.y1 - cell.y0), 0);
      if (f.w * f.h > area * 1.4) continue; // a backdrop bigger than the cells it touches
      hits.forEach((cell) => { cell.fill = f.color; });
      usedShapes.add(f.src);
    }
    g.forEach((l) => usedShapes.add(l.src));

    // 5. text into cells
    const segs = [];
    page.segments.forEach((seg, i) => {
      if (usedSegs.has(i)) return;
      const px = seg.x + Math.min(2, seg.width / 2), py = seg.baseline - seg.size * 0.3;
      const cell = cells.find((cl) => px >= cl.x0 && px <= cl.x1 && py >= cl.y0 && py <= cl.y1);
      if (cell && seg.x + seg.width <= bbox.x1 + seg.size * 2) { (cell.segs || (cell.segs = [])).push(seg); segs.push(i); }
    });
    segs.forEach((i) => usedSegs.add(i));

    for (const cell of cells) finishCell(cell);

    page.tables.push({
      x: bbox.x0, y: bbox.y0, width: bbox.x1 - bbox.x0,
      cols: xs.slice(1).map((x, i) => x - xs[i]),
      rows: ys.slice(1).map((y, i) => y - ys[i]),
      grid,
    });
  }

  if (page.tables.length) {
    page.shapes = shapes.filter((_, i) => !usedShapes.has(i));
    page.segments = page.segments.filter((_, i) => !usedSegs.has(i));
  }
  detectTextTables(page);
  page.tables.sort((a, b) => a.y - b.y || a.x - b.x);
  return page;
}

// ---- tables without a drawn grid ---------------------------------------------------------
// Rows of short, column-aligned text (financial statements, price lists, schedules). Columns
// are the vertical white-space channels shared by consecutive rows; banding fills and thin
// row rules that line up with the rows are folded into the cells.

const median = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)] || 0; };

function detectTextTables(page) {
  const segs = page.segments;
  if (segs.length < 6) return;
  const order = segs.map((sg, i) => ({ sg, i })).sort((a, b) => a.sg.baseline - b.sg.baseline || a.sg.x - b.sg.x);
  const lines = [];
  for (const e of order) {
    const line = lines.find((l) => Math.abs(l.baseline - e.sg.baseline) <= e.sg.size * 0.45);
    if (line) line.items.push(e); else lines.push({ baseline: e.sg.baseline, size: e.sg.size, items: [e] });
  }

  // consecutive multi-segment lines form candidate blocks
  const blocks = [];
  let cur = [];
  for (const line of lines) {
    const prev = cur[cur.length - 1];
    if (line.items.length >= 2 && (!prev || line.baseline - prev.baseline <= Math.max(prev.size, line.size) * 3.2)) cur.push(line);
    else { if (cur.length) blocks.push(cur); cur = line.items.length >= 2 ? [line] : []; }
  }
  if (cur.length) blocks.push(cur);

  const usedSegs = new Set(), usedShapes = new Set();
  for (const block of blocks) {
    if (block.length < 3) continue;
    const items = block.flatMap((l) => l.items);
    const lens = items.map((e) => e.sg.runs.reduce((n, r) => n + r.text.trim().length, 0));
    const size = median(items.map((e) => e.sg.size));
    if (median(lens) > 45) continue; // prose, not cells

    // vertical white-space channels
    const gap = Math.max(6, size * 0.8);
    const spans = items.map((e) => [e.sg.x, e.sg.x + e.sg.width]).sort((a, b) => a[0] - b[0]);
    const cols = [];
    for (const [lo, hi] of spans) {
      const last = cols[cols.length - 1];
      if (last && lo - last.hi < gap) last.hi = Math.max(last.hi, hi); else cols.push({ lo, hi });
    }
    if (cols.length < 2) continue;
    if (cols.length === 2 && lens.reduce((a, b) => a + b, 0) / lens.length > 25) continue; // two-column prose
    const rowsIn = (c) => block.filter((l) => l.items.some((e) => e.sg.x + e.sg.width / 2 >= c.lo && e.sg.x + e.sg.width / 2 <= c.hi)).length;
    if (cols.some((c) => rowsIn(c) < block.length * 0.5)) continue; // a column present in too few rows is not a column

    const xEdges = [cols[0].lo - 3, ...cols.slice(1).map((c, i) => (cols[i].hi + c.lo) / 2), cols[cols.length - 1].hi + 3];
    const yEdges = block.map((l, k) => (k === 0 ? l.baseline - l.size * 1.0 - 1 : (block[k - 1].baseline + l.baseline) / 2 + (l.size - block[k - 1].size) * 0.1));
    yEdges.push(block[block.length - 1].baseline + block[block.length - 1].size * 0.3 + 1);

    const grid = block.map((_, r) => cols.map((_c, c) => ({
      r, c, cs: 1, rs: 1, x0: xEdges[c], x1: xEdges[c + 1], y0: yEdges[r], y1: yEdges[r + 1],
      borders: { top: null, bottom: null, left: null, right: null }, fill: null, segs: [],
    })));
    block.forEach((line, r) => line.items.forEach((e) => {
      const mid = e.sg.x + Math.min(2, e.sg.width / 2);
      let c = xEdges.findIndex((x, k) => k < cols.length && mid >= x && mid < xEdges[k + 1]);
      if (c < 0) c = mid < xEdges[0] ? 0 : cols.length - 1;
      grid[r][c].segs.push(e.sg);
      usedSegs.add(e.i);
    }));
    const bbox = { x0: xEdges[0], x1: xEdges[xEdges.length - 1], y0: yEdges[0], y1: yEdges[yEdges.length - 1] };
    const width = bbox.x1 - bbox.x0;

    // banding fills and thin row rules that belong to this table
    (page.shapes || []).forEach((sh, si) => {
      if (usedShapes.has(si)) return;
      if (sh.fill && !sh.stroke && sh.h > THIN && sh.w >= width * 0.7 && sh.x <= bbox.x0 + 8 && sh.x + sh.w >= bbox.x1 - 8) {
        const rows = grid.filter((row) => {
          const oh = Math.min(sh.y + sh.h, row[0].y1) - Math.max(sh.y, row[0].y0);
          return oh >= (row[0].y1 - row[0].y0) * 0.6;
        });
        if (rows.length && sh.h <= rows.reduce((n, row) => n + (row[0].y1 - row[0].y0), 0) * 1.4) {
          rows.forEach((row) => row.forEach((cell) => { cell.fill = sh.fill; }));
          usedShapes.add(si);
        }
      } else if (sh.fill && !sh.stroke && sh.h <= THIN && sh.w >= width * 0.7 && sh.x <= bbox.x0 + 8 && sh.x + sh.w >= bbox.x1 - 8) {
        const y = sh.y + sh.h / 2;
        const edge = yEdges.findIndex((e) => Math.abs(e - y) <= 4);
        if (edge >= 0) {
          const line = { w: Math.max(sh.h, 0.5), color: sh.fill };
          if (edge > 0) grid[edge - 1].forEach((cell) => { cell.borders.bottom = line; });
          if (edge < grid.length) grid[edge].forEach((cell) => { cell.borders.top = line; });
          usedShapes.add(si);
        }
      }
    });

    // alignment is a property of the column: whichever edge (left / centre / right) lines up across rows
    cols.forEach((_c, c) => {
      const col = grid.map((row) => row[c].segs).flat();
      if (col.length < 2) return;
      const spread = (f) => Math.max(...col.map(f)) - Math.min(...col.map(f));
      const options = [['left', spread((sg) => sg.x)], ['right', spread((sg) => sg.x + sg.width)], ['center', spread((sg) => sg.x + sg.width / 2)]];
      const [best, sp] = options.reduce((a, b) => (b[1] < a[1] - 0.5 ? b : a));
      if (sp <= 3) grid.forEach((row) => { row[c].forceAlign = best; });
    });
    grid.forEach((row) => row.forEach(finishCell));
    page.tables.push({
      x: bbox.x0, y: bbox.y0, width,
      cols: xEdges.slice(1).map((x, i) => x - xEdges[i]),
      rows: yEdges.slice(1).map((y, i) => y - yEdges[i]),
      grid,
    });
  }
  if (usedSegs.size) {
    page.segments = segs.filter((_, i) => !usedSegs.has(i));
    page.shapes = (page.shapes || []).filter((_, i) => !usedShapes.has(i));
  }
}
