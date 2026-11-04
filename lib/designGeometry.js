// The maths behind dragging, resizing and rotating elements. No browser or React here.

export const MIN_SIZE = 6;
export const HANDLES = { nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0] };

/** Pulls a moving box onto page edges/centers and other elements' edges/centers. */
export function snapBox(x, y, w, h, others, pageW, pageH, threshold) {
  const targetsX = [0, pageW / 2, pageW];
  const targetsY = [0, pageH / 2, pageH];
  for (const o of others) {
    targetsX.push(o.x, o.x + o.w / 2, o.x + o.w);
    targetsY.push(o.y, o.y + o.h / 2, o.y + o.h);
  }
  const best = (pos, size, targets) => {
    let hit = null;
    for (const offset of [0, size / 2, size]) {
      for (const t of targets) {
        const d = t - (pos + offset);
        if (Math.abs(d) < threshold && (!hit || Math.abs(d) < Math.abs(hit.d))) hit = { d, line: t };
      }
    }
    return hit;
  };
  const hx = best(x, w, targetsX);
  const hy = best(y, h, targetsY);
  return { x: x + (hx?.d || 0), y: y + (hy?.d || 0), guideX: hx?.line ?? null, guideY: hy?.line ?? null };
}

/**
 * New position and size for an element dragged by one of its handles. The opposite side stays put,
 * including on rotated elements. Corners keep proportions for text and images, or when `keepRatio`
 * is set; dragging a text corner also scales its text.
 * @param {number} dx pointer movement in screen pixels
 * @param {number} dy pointer movement in screen pixels
 */
export function resizePatch(el, dir, dx, dy, zoom, keepRatio = false) {
  const [hx, hy] = HANDLES[dir];
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corner = !!(hx && hy);
  const isText = el.type === 'text';

  // pointer movement in the element's own (rotated) axes
  const lx = (dx * cos + dy * sin) / zoom;
  const ly = (-dx * sin + dy * cos) / zoom;
  let w = Math.max(MIN_SIZE, el.w + hx * lx);
  let h = hy ? Math.max(MIN_SIZE, el.h + hy * ly) : el.h;
  let ratio = 1;
  if (corner && (isText || el.type === 'image' || keepRatio)) {
    ratio = Math.max(w / el.w, h / el.h);
    w = el.w * ratio;
    h = el.h * ratio;
  }
  const sx = (hx * (w - el.w)) / 2;
  const sy = (hy * (h - el.h)) / 2;
  const cx = el.x + el.w / 2 + sx * cos - sy * sin;
  const cy = el.y + el.h / 2 + sx * sin + sy * cos;
  const patch = { x: cx - w / 2, y: cy - h / 2, w, h };
  if (isText && corner) {
    patch.size = Math.max(1, el.size * ratio);
    patch.letterSpacing = el.letterSpacing * ratio;
  }
  return patch;
}

/**
 * Rotation in degrees for a pointer at (dx, dy) from the element's center. The handle sits below
 * the element, so "straight down" means 0°. Sticks near 45° steps; `stepped` forces 15° steps.
 */
export function rotationFromPointer(dx, dy, stepped = false) {
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
  if (stepped) angle = Math.round(angle / 15) * 15;
  else {
    const nearest = Math.round(angle / 45) * 45;
    if (Math.abs(angle - nearest) < 3) angle = nearest;
  }
  angle = ((angle + 540) % 360) - 180;
  return Math.round(angle * 10) / 10;
}
