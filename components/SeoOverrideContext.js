'use client';

import { createContext, useContext } from 'react';

const SeoOverrideContext = createContext(null);

/**
 * Lets a server page (e.g. a programmatic /how-to/[slug] page) supply its own
 * H1, intro, steps and FAQs to the shared ToolPageLayout without importing the
 * whole registry into every tool page bundle.
 */
export function SeoOverrideProvider({ value, children }) {
  return <SeoOverrideContext.Provider value={value}>{children}</SeoOverrideContext.Provider>;
}

export function useSeoOverride() {
  return useContext(SeoOverrideContext);
}
