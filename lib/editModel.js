// Pure logic for the Edit PDF editor: page bookkeeping, undo history, coordinate maths and
// element geometry. No React and no PDF libraries, so it can be tested in Node.
//
// Coordinates: every element is stored in "base view" fractions (0..1) of its page, where the base
// view is the page as the PDF itself displays it (its own /Rotate applied, the user's extra
// rotation NOT applied). Rotating a page in the editor turns the page and its edits together.

/** A rotation in degrees, snapped to a quarter turn and kept in 0, 90, 180, 270. */
export function normalizeRotation(angle = 0) {
  const quarter = Math.round((Number(angle) || 0) / 90) * 90;
  return ((quarter % 360) + 360) % 360;
}

// ── Pages ────────────────────────────────────────────────────────────────────

/** Original page indices that are still in the document, in order. */
export function visiblePageIndices(total, deleted = []) {
  const gone = new Set(deleted);
  const out = [];
  for (let i = 0; i < total; i++) if (!gone.has(i)) out.push(i);
  return out;
}

/** The next (dir 1) or previous (dir -1) page that isn't deleted, or `current` if there is none. */
export function stepPage(current, dir, total, deleted = []) {
  const gone = new Set(deleted);
  for (let i = current + dir; i >= 0 && i < total; i += dir) if (!gone.has(i)) return i;
  return current;
}

/** Where to go once `current` is deleted: the next remaining page, else the previous one. */
export function pageAfterDelete(current, total, deleted = []) {
  const gone = new Set(deleted);
  if (!gone.has(current)) return current;
  const next = stepPage(current, 1, total, deleted);
  if (next !== current) return next;
  const prev = stepPage(current, -1, total, deleted);
  return prev !== current ? prev : current;
}

// ── Document state ───────────────────────────────────────────────────────────

/** Everything the user can change, kept immutable so undo can hold plain references. */
export function emptyDoc() {
  return { elements: {}, rotations: {}, deleted: [] };
}

export function updatePageElements(doc, page, fn) {
  const before = doc.elements[page] || [];
  const after = fn(before);
  if (after === before) return doc;
  return { ...doc, elements: { ...doc.elements, [page]: after } };
}

export function patchElement(doc, page, id, patch) {
  return updatePageElements(doc, page, (els) =>
    els.map((el) => (el.id === id ? { ...el, ...(typeof patch === 'function' ? patch(el) : patch) } : el))
  );
}

/**
 * Removes one element. Deleting an edited paragraph keeps its cover box, so the paragraph is gone
 * from the page rather than the original text coming back.
 */
export function removeElement(doc, page, id) {
  return updatePageElements(doc, page, (els) => {
    const next = els.filter((el) => el.id !== id);
    return next.length === els.length ? els : next;
  });
}

export function rotatePage(doc, page, by = 90) {
  return { ...doc, rotations: { ...doc.rotations, [page]: normalizeRotation((doc.rotations[page] || 0) + by) } };
}

export function deletePage(doc, page) {
  if (doc.deleted.includes(page)) return doc;
  return { ...doc, deleted: [...doc.deleted, page] };
}

export function countEdits(doc) {
  return Object.values(doc.elements).reduce((n, els) => n + withoutPristine(els).filter((el) => !el.linkedTo).length, 0);
}

// ── Undo history ─────────────────────────────────────────────────────────────

export const HISTORY_LIMIT = 100;

export function createHistory(present) {
  return { past: [], present, future: [] };
}

/** Records `next` as a new undo step. */
export function commit(history, next, limit = HISTORY_LIMIT) {
  if (next === history.present) return history;
  return { past: [...history.past, history.present].slice(-limit), present: next, future: [] };
}

/** Changes the present without a new undo step (the rest of a drag, or more typing). */
export function replace(history, next) {
  if (next === history.present) return history;
  return { ...history, present: next, future: [] };
}

export function undo(history) {
  if (!history.past.length) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  };
}

export function redo(history) {
  if (!history.future.length) return history;
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1),
  };
}

// ── Coordinates ──────────────────────────────────────────────────────────────

/**
 * Converts a point in the displayed (user-rotated) page, as fractions, to base-view fractions.
 * `rotation` is the user's extra clockwise rotation.
 */
export function toBaseFraction(u, v, rotation) {
  switch (normalizeRotation(rotation)) {
    case 90: return { x: v, y: 1 - u };
    case 180: return { x: 1 - u, y: 1 - v };
    case 270: return { x: 1 - v, y: u };
    default: return { x: u, y: v };
  }
}

/**
 * The PDF transformation matrix [a b c d e f] that lets you draw in base-view points (origin
 * bottom-left, y up, width/height as displayed) on a page whose own /Rotate is `rotation` and whose
 * visible box is `box` ({ x, y, width, height } in PDF user space).
 */
export function viewTransform(rotation, box) {
  const { x: x0, y: y0, width: W, height: H } = box;
  switch (normalizeRotation(rotation)) {
    case 90: return { matrix: [0, 1, -1, 0, x0 + W, y0], width: H, height: W };
    case 180: return { matrix: [-1, 0, 0, -1, x0 + W, y0 + H], width: W, height: H };
    case 270: return { matrix: [0, -1, 1, 0, x0, y0 + H], width: H, height: W };
    default: return { matrix: [1, 0, 0, 1, x0, y0], width: W, height: H };
  }
}

/** Applies a matrix from `viewTransform` to a point. */
export function applyMatrix([a, b, c, d, e, f], X, Y) {
  return { x: a * X + c * Y + e, y: b * X + d * Y + f };
}

// ── Element geometry ─────────────────────────────────────────────────────────

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const MIN_BOX = 0.01;

/** The box an element covers, as page fractions. */
export function elementBounds(el) {
  if (el.type === 'shape-line') {
    return {
      x: Math.min(el.x1, el.x2),
      y: Math.min(el.y1, el.y2),
      width: Math.abs(el.x2 - el.x1),
      height: Math.abs(el.y2 - el.y1),
    };
  }
  if (el.type === 'draw') {
    const xs = el.points.map((p) => p[0]);
    const ys = el.points.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  }
  return { x: el.x, y: el.y, width: el.width, height: el.height || 0 };
}

/** Moves an element by (dx, dy) page fractions, keeping all of it on the page. */
export function moveElement(el, dx, dy) {
  const b = elementBounds(el);
  const mx = clamp(dx, -b.x, 1 - b.x - b.width);
  const my = clamp(dy, -b.y, 1 - b.y - b.height);
  if (el.type === 'shape-line') {
    return { ...el, x1: el.x1 + mx, y1: el.y1 + my, x2: el.x2 + mx, y2: el.y2 + my };
  }
  if (el.type === 'draw') {
    return { ...el, points: el.points.map(([x, y]) => [x + mx, y + my]) };
  }
  return { ...el, x: el.x + mx, y: el.y + my };
}

/** The eight resize handles: corners and edge middles, by compass direction. */
export const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
/** Corners only, for things that keep their proportions (images, marks). */
export const CORNER_HANDLES = ['nw', 'ne', 'se', 'sw'];

/** Where a handle sits on a box (page fractions). */
export function handlePoint(b, dir) {
  const x = dir.includes('w') ? b.x : dir.includes('e') ? b.x + b.width : b.x + b.width / 2;
  const y = dir.includes('n') ? b.y : dir.includes('s') ? b.y + b.height : b.y + b.height / 2;
  return { x, y };
}

/** A box after dragging the handle `dir` by (dx, dy); the opposite side stays put. */
export function resizeBox(b, dir, dx, dy, min = MIN_BOX) {
  let { x, y, width, height } = b;
  if (dir.includes('e')) width = clamp(width + dx, min, 1 - x);
  if (dir.includes('w')) {
    const right = x + width;
    x = clamp(x + dx, 0, right - min);
    width = right - x;
  }
  if (dir.includes('s')) height = clamp(height + dy, min, 1 - y);
  if (dir.includes('n')) {
    const bottom = y + height;
    y = clamp(y + dy, 0, bottom - min);
    height = bottom - y;
  }
  return { x, y, width, height };
}

// A corner drag on something that keeps its proportions: the width follows the pointer, the height
// follows the width, the opposite corner stays put and everything stays on the page.
function resizeKeepingAspect(orig, dir, dx, pageAspect) {
  const heightOf = (w) => (w * pageAspect) / orig.aspect;
  const left = dir.includes('w');
  const top = dir.includes('n');
  const room = left ? orig.x + orig.width : 1 - orig.x;
  const roomY = top ? orig.y + orig.height : 1 - orig.y;
  const maxW = Math.min(room, (roomY * orig.aspect) / pageAspect);
  const width = clamp(orig.width + (left ? -dx : dx), 0.03, maxW);
  const height = heightOf(width);
  return {
    ...orig,
    width,
    height,
    x: left ? orig.x + orig.width - width : orig.x,
    y: top ? orig.y + orig.height - height : orig.y,
  };
}

export const MIN_TEXT_SIZE = 4;
export const MAX_TEXT_SIZE = 400;

/**
 * A text box dragged by a corner: the text scales (font size, letter spacing, width) and the
 * opposite corner stays put. `box` is the box as shown, in page fractions, since its height comes
 * from the text.
 */
export function scaleText(orig, dir, dx, dy, box) {
  const kx = (box.width + (dir.includes('w') ? -dx : dx)) / box.width;
  const ky = box.height ? (box.height + (dir.includes('n') ? -dy : dy)) / box.height : kx;
  let k = Math.abs(kx - 1) >= Math.abs(ky - 1) ? kx : ky;
  const size = orig.size || 16;
  k = clamp(k, MIN_TEXT_SIZE / size, MAX_TEXT_SIZE / size);
  // keep it on the page
  const room = dir.includes('w') ? box.x + box.width : 1 - box.x;
  if (box.width * k > room) k = room / box.width;
  const roundSize = (v) => Math.round(v * 10) / 10;
  const next = { ...orig, size: roundSize(size * k) };
  const kk = next.size / size; // what the rounded size gives
  if (orig.width) next.width = orig.width * kk;
  if (orig.height) next.height = orig.height * kk;
  if (typeof orig.charSpacing === 'number') next.charSpacing = orig.charSpacing * kk;
  if (orig.spans) next.spans = orig.spans.map((sp) => (sp.size ? { ...sp, size: roundSize(sp.size * kk) } : sp));
  if (dir.includes('w')) next.x = clamp(box.x + box.width - box.width * kk, 0, 1);
  if (dir.includes('n') && box.height) next.y = clamp(box.y + box.height - box.height * kk, 0, 1);
  return next;
}

/**
 * Result of dragging a handle by (dx, dy) fractions, starting from `orig`.
 * `pageAspect` is page width / height in points (needed to keep images in proportion).
 * Modes: 'move', 'resize' (text width, or the bottom-right corner), 'resize-<dir>' with dir one of
 * RESIZE_HANDLES, 'p1' / 'p2' (line ends).
 */
export function applyDrag(orig, mode, dx, dy, pageAspect = 612 / 792, box = null) {
  if (mode === 'move') return moveElement(orig, dx, dy);
  if (mode === 'p1' || mode === 'p2') {
    const n = mode === 'p1' ? '1' : '2';
    return { ...orig, [`x${n}`]: clamp(orig[`x${n}`] + dx, 0, 1), [`y${n}`]: clamp(orig[`y${n}`] + dy, 0, 1) };
  }
  if (mode !== 'resize' && !mode.startsWith('resize-')) return orig;
  const dir = mode === 'resize' ? 'se' : mode.slice(7);
  if (orig.type === 'text' && dir.length === 2 && box?.width) return scaleText(orig, dir, dx, dy, box);
  if (orig.type === 'text') {
    // a side handle only changes the width; the height follows the text
    // a one-line edit becomes a wrapping box, starting from the width it shows now
    const start = orig.oneLine && box?.width ? box.width : orig.width || 0.03;
    const nb = resizeBox({ x: orig.x, y: orig.y, width: start, height: 0.05 }, dir.replace(/[ns]/g, '') || 'e', dx, 0, 0.03);
    return { ...orig, x: nb.x, width: nb.width, ...(orig.oneLine ? { oneLine: false } : {}) };
  }
  if (orig.aspect) {
    const corner = (dir.length === 2 ? dir : `s${dir === 'w' ? 'w' : 'e'}`);
    return resizeKeepingAspect(orig, corner, dx, pageAspect);
  }
  if (orig.type === 'draw') {
    // scale the stroke into the new box
    const b = elementBounds(orig);
    const nb = resizeBox(b, dir, dx, dy, 0.002);
    const sx = b.width ? nb.width / b.width : 1;
    const sy = b.height ? nb.height / b.height : 1;
    return { ...orig, points: orig.points.map(([px, py, ...rest]) => [nb.x + (px - b.x) * sx, nb.y + (py - b.y) * sy, ...rest]) };
  }
  if (orig.type === 'shape-line') return orig;
  return { ...orig, ...resizeBox({ x: orig.x, y: orig.y, width: orig.width, height: orig.height || 0 }, dir, dx, dy) };
}

/** A copy shifted down-right a little, for Duplicate. */
export function offsetCopy(el, id, offset = 0.02) {
  const b = elementBounds(el);
  const dx = b.x + b.width + offset <= 1 ? offset : -offset;
  const dy = b.y + b.height + offset <= 1 ? offset : -offset;
  return { ...moveElement(el, dx, dy), id };
}

/** Box from two corner points, as page fractions. */
export function boxFromPoints(a, b) {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}

/**
 * Snaps the end of a line to the nearest 45° from `start` (for Shift-drag). Works in points so
 * "45°" looks right on a non-square page.
 */
export function snapLineEnd(start, end, pageAspect) {
  const dx = (end.x - start.x) * pageAspect;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (!len) return end;
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  return {
    x: clamp(start.x + (Math.cos(angle) * len) / pageAspect, 0, 1),
    y: clamp(start.y + Math.sin(angle) * len, 0, 1),
  };
}

/**
 * Smooth SVG path through freehand points (page fractions), in points with y down.
 * Uses quadratic curves through the midpoints, so the screen and the saved PDF draw the same curve.
 */
export function strokePath(points, width, height) {
  if (!points.length) return '';
  const P = points.map(([x, y]) => [+(x * width).toFixed(2), +(y * height).toFixed(2)]);
  if (P.length === 1) return `M${P[0][0]} ${P[0][1]} L${P[0][0] + 0.01} ${P[0][1]}`;
  if (P.length === 2) return `M${P[0][0]} ${P[0][1]} L${P[1][0]} ${P[1][1]}`;
  let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length - 1; i++) {
    const mx = +((P[i][0] + P[i + 1][0]) / 2).toFixed(2);
    const my = +((P[i][1] + P[i + 1][1]) / 2).toFixed(2);
    d += ` Q${P[i][0]} ${P[i][1]} ${mx} ${my}`;
  }
  const last = P[P.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

/** Drops points closer than `minDist` (fractions) to the previous kept point. */
export function addStrokePoint(points, point, minDist = 0.0015) {
  const prev = points[points.length - 1];
  if (prev && Math.hypot(point[0] - prev[0], point[1] - prev[1]) < minDist) return points;
  return [...points, point];
}

/**
 * The two ends of an arrowhead at (x2, y2) for a line from (x1, y1); all in points, y down.
 * The head grows with the line width and never gets longer than half the line.
 */
export function arrowHead(x1, y1, x2, y2, strokeWidth = 3) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const head = Math.min(len / 2, Math.max(7, strokeWidth * 3.5));
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const spread = Math.tan((28 * Math.PI) / 180);
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  return [
    [bx - uy * head * spread, by + ux * head * spread],
    [bx + uy * head * spread, by - ux * head * spread],
  ];
}

/** Tick and cross marks, drawn as strokes in a 24 x 24 box (same paths on screen and in the PDF). */
export const MARK_PATHS = {
  check: 'M4 12.5 L9.5 18 L20 6',
  cross: 'M6 6 L18 18 M18 6 L6 18',
};
export const MARK_STROKE = 2.6;

// ── Untouched opened text ────────────────────────────────────────────────────

/** Fingerprint of an element, for telling whether an opened PDF line was changed. */
export function pristineKey(el) {
  const { pristine, ...rest } = el;
  return JSON.stringify(rest);
}

/** Marks an opened PDF line as untouched as it is now. */
export const markPristine = (el) => ({ ...el, pristine: pristineKey(el) });

/**
 * True while an opened PDF line is exactly as it was opened. The page then keeps showing the
 * original PDF there (the editor only adds a caret), and saving leaves it alone.
 */
export const isPristine = (el) => !!el?.pristine && el.pristine === pristineKey(el);

/** The page's elements minus untouched opened lines and their covers. */
export function withoutPristine(els = []) {
  const ids = new Set(els.filter(isPristine).map((el) => el.id));
  if (!ids.size) return els;
  return els.filter((el) => !ids.has(el.id) && !ids.has(el.linkedTo));
}
