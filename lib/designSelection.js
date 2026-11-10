// Working with the selected elements. The selection is a list of ids, most recently selected last.

import { uid } from '@/lib/designModel';

/** The selection after choosing one element, or nothing when `id` is null. Unchanged if it's already that. */
export function selectOnlyId(ids, id) {
  if (id === null || id === undefined) return ids.length ? [] : ids;
  return ids.length === 1 && ids[0] === id ? ids : [id];
}

/** The most recently selected element still on the page, or null. */
export function primaryElement(elements, ids) {
  for (let i = ids.length - 1; i >= 0; i--) {
    const hit = elements.find((el) => el.id === ids[i]);
    if (hit) return hit;
  }
  return null;
}

export const patchElements = (elements, ids, patch) =>
  elements.map((el) => (ids.includes(el.id) ? { ...el, ...patch } : el));

export const removeElements = (elements, ids) => elements.filter((el) => !ids.includes(el.id));

/** Unlocked copies of the selected elements, slightly offset, in stacking order. */
export function copyElements(elements, ids, offset = 12) {
  return elements
    .filter((el) => ids.includes(el.id))
    .map((el) => ({ ...el, id: uid(), x: el.x + offset, y: el.y + offset, locked: false }));
}
