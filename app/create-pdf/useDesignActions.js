'use client';

import { useCallback, useMemo } from 'react';
import { clonePage, createImage, createShape, createText, readImageFile, resizeDesign, uid } from '@/lib/designModel';

/**
 * Everything that changes the elements on the current page.
 * `api` is what the panels and property controls use; the rest is for the canvas and toolbars.
 */
export function useDesignActions({
  update,
  pageIdx,
  page,
  pageW,
  pageH,
  selectedId,
  selected,
  isMobile,
  setPageIdx,
  setSelectedId,
  setEditingId,
  setPanel,
  setNotice,
  zoomToFit,
}) {
  const baseScale = pageW / 595; // default sizes are written for an A4-wide page

  const patchPage = useCallback((index, patch, options) => {
    update((d) => ({ ...d, pages: d.pages.map((p, i) => (i === index ? { ...p, ...patch(p) } : p)) }), options);
  }, [update]);

  const updateEl = useCallback((id, patch, options) => {
    patchPage(pageIdx, (p) => ({ elements: p.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)) }), options);
  }, [patchPage, pageIdx]);

  const measure = useCallback((id, h) => {
    update((d) => {
      let changed = false;
      const pages = d.pages.map((p) => {
        const hit = p.elements.find((el) => el.id === id);
        if (!hit || Math.abs(hit.h - h) < 0.5) return p;
        changed = true;
        return { ...p, elements: p.elements.map((el) => (el.id === id ? { ...el, h } : el)) };
      });
      return changed ? { ...d, pages } : d;
    }, { silent: true });
  }, [update]);

  const addToPage = useCallback((elements) => {
    patchPage(pageIdx, (p) => ({ elements: [...p.elements, ...elements] }));
    setSelectedId(elements[elements.length - 1].id);
    if (isMobile) setPanel(null);
  }, [patchPage, pageIdx, isMobile, setSelectedId, setPanel]);

  const moveLayer = useCallback((id, dir) => {
    patchPage(pageIdx, (p) => {
      const i = p.elements.findIndex((el) => el.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.elements.length) return {};
      const elements = [...p.elements];
      [elements[i], elements[j]] = [elements[j], elements[i]];
      return { elements };
    });
  }, [patchPage, pageIdx]);

  const toggleLock = useCallback((id) => {
    patchPage(pageIdx, (p) => ({ elements: p.elements.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el)) }));
  }, [patchPage, pageIdx]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    patchPage(pageIdx, (p) => ({ elements: p.elements.filter((el) => el.id !== selectedId) }));
    setSelectedId(null);
    setEditingId(null);
  }, [patchPage, pageIdx, selectedId, setSelectedId, setEditingId]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    const copy = { ...selected, id: uid(), x: selected.x + 12, y: selected.y + 12, locked: false };
    patchPage(pageIdx, (p) => ({ elements: [...p.elements, copy] }));
    setSelectedId(copy.id);
  }, [patchPage, pageIdx, selected, setSelectedId]);

  const addImageFile = useCallback(async (file, background) => {
    try {
      const { src, width, height } = await readImageFile(file);
      if (background) {
        const el = createImage(src, { x: 0, y: 0, w: pageW, h: pageH, locked: true });
        patchPage(pageIdx, (p) => ({ elements: [el, ...p.elements] }));
        return;
      }
      const fit = Math.min((pageW * 0.6) / width, (pageH * 0.6) / height);
      const w = width * fit;
      const h = height * fit;
      addToPage([createImage(src, { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h })]);
    } catch (err) {
      setNotice(err.message || 'That image could not be opened');
    }
  }, [addToPage, patchPage, pageIdx, pageW, pageH, setNotice]);

  // ── Editing text in place ──
  const stopEditing = useCallback(() => {
    setEditingId((id) => {
      if (id) {
        const el = page.elements.find((x) => x.id === id);
        if (el && !el.text.trim()) {
          patchPage(pageIdx, (p) => ({ elements: p.elements.filter((x) => x.id !== id) }));
          setSelectedId(null);
        }
      }
      return null;
    });
  }, [page.elements, patchPage, pageIdx, setEditingId, setSelectedId]);

  const startEditing = useCallback((el) => {
    if (el.type === 'text' && !el.locked) {
      setSelectedId(el.id);
      setEditingId(el.id);
    }
  }, [setSelectedId, setEditingId]);

  const typeText = useCallback((id, text) => {
    updateEl(id, { text }, { key: `type-${id}` });
  }, [updateEl]);

  const api = useMemo(() => ({
    select: setSelectedId,
    moveLayer,
    toggleLock,
    deleteSelected,
    duplicateSelected,
    updateSelected: (patch, key) => {
      if (selectedId) updateEl(selectedId, patch, key ? { key: `${key}-${selectedId}` } : undefined);
    },
    addTexts: (specs) => {
      let y = pageH * 0.4;
      const elements = specs.map((spec) => {
        const w = Math.min(pageW * 0.9, spec.w * baseScale);
        const el = createText({
          ...spec,
          w,
          size: spec.size * baseScale,
          letterSpacing: (spec.letterSpacing || 0) * baseScale,
          x: (pageW - w) / 2,
          y,
        });
        y += el.size * 1.4;
        return el;
      });
      addToPage(elements);
    },
    addShape: (kind) => {
      const el = createShape(kind);
      const w = el.w * baseScale;
      const h = kind === 'line' ? el.h : (kind === 'arrow' ? 80 : el.h) * baseScale;
      addToPage([{ ...el, w, h, x: (pageW - w) / 2, y: (pageH - h) / 2, strokeWidth: el.strokeWidth * baseScale, radius: el.radius * baseScale }]);
    },
    addImageFiles: (files) => { files.forEach((f) => addImageFile(f)); },
    addImageSrc: (src) => {
      const w = pageW * 0.4;
      addToPage([createImage(src, { x: (pageW - w) / 2, y: (pageH - w) / 2, w, h: w })]);
    },
    addBackgroundImage: (file) => addImageFile(file, true),
    setBackground: (color, key) => patchPage(pageIdx, () => ({ background: color }), key ? { key } : undefined),
    backgroundToAllPages: () => update((d) => ({ ...d, pages: d.pages.map((p) => ({ ...p, background: page.background })) })),
    applyTemplate: (tpl) => {
      update((d) => ({ ...d, width: tpl.design.width, height: tpl.design.height, unit: tpl.design.unit, pages: tpl.design.pages.map(clonePage) }));
      setPageIdx(0);
      setSelectedId(null);
      zoomToFit();
      if (isMobile) setPanel(null);
    },
    setPageSize: (w, h, unit) => update((d) => resizeDesign(d, Math.max(1, w), Math.max(1, h), unit), { key: 'page-size' }),
  }), [selectedId, updateEl, moveLayer, toggleLock, deleteSelected, duplicateSelected, addToPage, addImageFile, patchPage, pageIdx, pageW, pageH, baseScale, update, page.background, isMobile, setPageIdx, setSelectedId, setPanel, zoomToFit]);

  return { api, updateEl, measure, moveLayer, toggleLock, deleteSelected, duplicateSelected, stopEditing, startEditing, typeText };
}
