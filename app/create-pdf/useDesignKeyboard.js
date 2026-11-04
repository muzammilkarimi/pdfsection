'use client';

import { useEffect } from 'react';

/** Editor shortcuts. They stay out of the way while typing in a field or when `enabled` is false. */
export function useDesignKeyboard({ enabled, selected, undo, redo, duplicateSelected, deleteSelected, updateEl, selectOnly }) {
  useEffect(() => {
    const onKey = (e) => {
      if (!enabled) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && k === 'y') { e.preventDefault(); redo(); return; }
      if (mod && k === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (!selected) return;
      if (e.key === 'Escape') { selectOnly(null); return; }
      if (selected.locked) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return; }
      const step = e.shiftKey ? 10 : 1;
      const nudge = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (nudge) {
        e.preventDefault();
        updateEl(selected.id, { x: selected.x + nudge[0], y: selected.y + nudge[1] }, { key: `nudge-${selected.id}` });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, selected, undo, redo, duplicateSelected, deleteSelected, updateEl, selectOnly]);
}
