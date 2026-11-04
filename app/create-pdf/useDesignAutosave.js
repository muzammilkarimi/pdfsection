'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveDesign } from '@/lib/designStore';

/**
 * Saves the design in this browser shortly after each change. Only once the user has changed
 * something, so just opening a template doesn't leave a draft behind.
 * @returns {{ saveState: 'idle'|'saving'|'saved'|'failed', saveNow: () => Promise<void> }}
 */
export function useDesignAutosave(design, canUndo) {
  const [saveState, setSaveState] = useState('idle');
  const latestDesign = useRef(design);
  const dirty = useRef(false);

  useEffect(() => {
    latestDesign.current = design;
    if (canUndo) dirty.current = true;
    if (!dirty.current) return undefined;
    const timer = setTimeout(() => {
      setSaveState('saving');
      saveDesign(design).then(() => setSaveState('saved')).catch(() => setSaveState('failed'));
    }, 500);
    return () => clearTimeout(timer);
  }, [design, canUndo]);

  const saveNow = useCallback(async () => {
    if (dirty.current) await saveDesign(latestDesign.current).catch(() => {});
  }, []);

  return { saveState, saveNow };
}
