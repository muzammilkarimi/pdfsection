'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import { registerDesignFonts } from '@/lib/designFonts';
import { migrateDesign } from '@/lib/designMigrations';
import { getDesign } from '@/lib/designStore';
import DesignStart from './DesignStart';
import DesignEditor from './DesignEditor';

// The open design's id is in the URL, so reloading and the browser's back and forward buttons work.
// A design nobody has changed isn't saved as a draft, so this tab keeps a copy to reload it from.
const SESSION_KEY = 'pdfsection-open-design';

const idInUrl = () => new URLSearchParams(window.location.search).get('design');
const noSubscription = () => () => {};

function rememberForThisTab(design) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(design));
  } catch {
    // Too large or blocked: it just won't survive a reload until its first change is saved.
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* storage is blocked */ }
  }
}

function recallFromThisTab(id) {
  try {
    const design = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return design?.id === id ? migrateDesign(design) : null;
  } catch {
    return null;
  }
}

async function findDesign(id) {
  const saved = await getDesign(id).catch(() => null);
  return saved || recallFromThisTab(id);
}

export default function CreatePDFClient() {
  const [design, setDesign] = useState(null);
  const [settled, setSettled] = useState(false);
  const openId = useRef(null);
  const urlHasDesign = useSyncExternalStore(noSubscription, () => !!idInUrl(), () => false);
  const restoring = !design && !settled && urlHasDesign;

  useEffect(() => {
    registerDesignFonts();
    const followUrl = async () => {
      const id = idInUrl();
      if (id !== openId.current) {
        const found = id ? await findDesign(id) : null;
        if (id && !found) window.history.replaceState(null, '', window.location.pathname);
        openId.current = found?.id ?? null;
        setDesign(found);
      }
      setSettled(true);
    };
    followUrl();
    window.addEventListener('popstate', followUrl);
    return () => window.removeEventListener('popstate', followUrl);
  }, []);

  const open = useCallback((next) => {
    openId.current = next.id;
    rememberForThisTab(next);
    window.history.pushState(null, '', `?design=${encodeURIComponent(next.id)}`);
    setDesign(next);
  }, []);

  const exit = useCallback(() => {
    openId.current = null;
    window.history.pushState(null, '', window.location.pathname);
    setDesign(null);
  }, []);

  return (
    <ToolPageLayout
      title="Create PDF & Poster Maker"
      description="Design posters, flyers, certificates and documents from scratch, then download a print-ready PDF. Everything runs in your browser. Nothing is uploaded, no account needed."
      icon="create"
      iconColor="var(--tool-edit)"
      showHeader={!design && !restoring}
      layoutMode={design ? 'app-fixed' : 'page-scroll'}
    >
      {design && <DesignEditor key={design.id} initial={design} onExit={exit} />}
      {!design && !restoring && <DesignStart onOpen={open} />}
    </ToolPageLayout>
  );
}
