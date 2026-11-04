'use client';

import { useCallback, useRef } from 'react';
import { resizePatch, rotationFromPointer, snapBox } from '@/lib/designGeometry';

/** Follows the pointer until it is released. */
function track(startEvent, { move, end }) {
  const { clientX: x0, clientY: y0 } = startEvent;
  const onMove = (e) => move(e.clientX - x0, e.clientY - y0, e);
  const stop = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
    end?.();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', stop);
  window.addEventListener('pointercancel', stop);
}

/** Dragging, resizing and rotating elements with the pointer. */
export function useDesignGestures({ page, pageW, pageH, zoom, scalerRef, selectedId, editingId, setSelectedId, setEditingId, setGuides, updateEl }) {
  const gestureId = useRef(0);

  const startDrag = useCallback((e, el) => {
    e.stopPropagation();
    if (editingId === el.id) return;
    const wasSelected = selectedId === el.id;
    setSelectedId(el.id);
    setEditingId(null);
    if (el.locked) return;
    const key = `g${++gestureId.current}`;
    const others = page.elements.filter((o) => o.id !== el.id);
    let moved = false;
    track(e, {
      move: (dx, dy) => {
        if (!moved && Math.hypot(dx, dy) < 3) return;
        moved = true;
        const next = snapBox(el.x + dx / zoom, el.y + dy / zoom, el.w, el.h, others, pageW, pageH, 6 / zoom);
        updateEl(el.id, { x: next.x, y: next.y }, { key, hold: true });
        setGuides({ x: next.guideX, y: next.guideY });
      },
      end: () => {
        setGuides(null);
        if (!moved && wasSelected && el.type === 'text') setEditingId(el.id);
      },
    });
  }, [editingId, selectedId, page.elements, zoom, pageW, pageH, updateEl, setSelectedId, setEditingId, setGuides]);

  const startResize = useCallback((e, el, dir) => {
    e.stopPropagation();
    e.preventDefault();
    document.activeElement?.blur(); // a focused number field would keep showing its old value
    const key = `g${++gestureId.current}`;
    track(e, {
      move: (dx, dy, ev) => updateEl(el.id, resizePatch(el, dir, dx, dy, zoom, ev.shiftKey), { key, hold: true }),
    });
  }, [zoom, updateEl]);

  const startRotate = useCallback((e, el) => {
    e.stopPropagation();
    e.preventDefault();
    document.activeElement?.blur(); // a focused number field would keep showing its old value
    const key = `g${++gestureId.current}`;
    const rect = scalerRef.current.getBoundingClientRect();
    const cx = rect.left + (el.x + el.w / 2) * zoom;
    const cy = rect.top + (el.y + el.h / 2) * zoom;
    track(e, {
      move: (_dx, _dy, ev) => updateEl(el.id, { rotation: rotationFromPointer(ev.clientX - cx, ev.clientY - cy, ev.shiftKey) }, { key, hold: true }),
    });
  }, [zoom, updateEl, scalerRef]);

  return { startDrag, startResize, startRotate };
}
