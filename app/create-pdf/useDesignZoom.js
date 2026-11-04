'use client';

import { useCallback, useEffect, useState } from 'react';

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4;

/** Zoom level of the page: fits the window until the user picks a level of their own. */
export function useDesignZoom(stageRef, pageW, pageH, isMobile) {
  const [zoomOverride, setZoomOverride] = useState(null);
  const [fitZoom, setFitZoom] = useState(0.5);
  const zoom = zoomOverride ?? fitZoom;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const compute = () => {
      // matches .ds-stage padding, which leaves room for the floating toolbar on desktop
      const padX = isMobile ? 32 : 64;
      const padY = isMobile ? 32 : 100;
      const fit = Math.min((stage.clientWidth - padX) / pageW, (stage.clientHeight - padY) / pageH);
      setFitZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fit)));
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stageRef, pageW, pageH, isMobile]);

  const zoomIn = () => setZoomOverride(Math.min(ZOOM_MAX, zoom * 1.2));
  const zoomOut = () => setZoomOverride(Math.max(ZOOM_MIN, zoom / 1.2));
  const zoomToFit = useCallback(() => setZoomOverride(null), []);

  return { zoom, zoomIn, zoomOut, zoomToFit };
}
