'use client';

import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 100;
const COALESCE_MS = 800;

/**
 * Design state with undo/redo.
 * update(next, options): `next` is a design or a function of the current one.
 *   options.silent: no undo step (measurements).
 *   options.key: consecutive updates with the same key within a moment form one undo step (typing, sliders).
 *   options.hold: same key always merges, however long the pause (one drag gesture).
 */
export function useDesignHistory(initial) {
  const [state, setState] = useState({ past: [], present: initial, future: [] });
  const last = useRef({ key: null, at: 0 });

  const update = useCallback((next, { silent = false, key = null, hold = false } = {}) => {
    const now = Date.now();
    const merge = !!key && last.current.key === key && (hold || now - last.current.at < COALESCE_MS);
    if (!silent) last.current = { key, at: now };
    setState((s) => {
      const present = typeof next === 'function' ? next(s.present) : next;
      if (present === s.present) return s;
      if (silent) return { ...s, present };
      if (merge) return { ...s, present, future: [] };
      return { past: [...s.past, s.present].slice(-MAX_HISTORY), present, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = { key: null, at: 0 };
    setState((s) => {
      if (!s.past.length) return s;
      return { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    last.current = { key: null, at: 0 };
    setState((s) => {
      if (!s.future.length) return s;
      return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) };
    });
  }, []);

  return { design: state.present, update, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
