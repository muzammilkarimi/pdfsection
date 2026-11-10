'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveDesign } from '@/lib/designStore';

/**
 * Saves the design in this browser shortly after each change. Only once the user has changed
 * something, so just opening a template doesn't leave a draft behind. A change still waiting is
 * saved straight away if the page is reloaded, closed or left.
 * @returns {{ saveState: 'idle'|'saving'|'saved'|'failed', saveNow: () => Promise<void> }}
 */
export function useDesignAutosave(design, canUndo) {
  const [saveState, setSaveState] = useState('idle');
  const latestDesign = useRef(design);
  const dirty = useRef(false);
  const waiting = useRef(false);

  useEffect(() => {
    latestDesign.current = design;
    if (canUndo) dirty.current = true;
    if (!dirty.current) return undefined;
    waiting.current = true;
    const timer = setTimeout(() => {
      waiting.current = false;
      setSaveState('saving');
      saveDesign(design).then(() => setSaveState('saved')).catch(() => setSaveState('failed'));
    }, 500);
    return () => clearTimeout(timer);
  }, [design, canUndo]);

  useEffect(() => {
    const saveWaiting = () => {
      if (!waiting.current) return;
      waiting.current = false;
      saveDesign(latestDesign.current).catch(() => {});
    };
    window.addEventListener('pagehide', saveWaiting);
    return () => {
      window.removeEventListener('pagehide', saveWaiting);
      saveWaiting();
    };
  }, []);

  const saveNow = useCallback(async () => {
    waiting.current = false;
    if (dirty.current) await saveDesign(latestDesign.current).catch(() => {});
  }, []);

  return { saveState, saveNow };
}
