'use client';

import { useCallback, useMemo } from 'react';
import { storeAsset } from '@/lib/designAssets';
import { clonePage, createImage, createShape, createText, readImageFile, resizeDesign, uid } from '@/lib/designModel';
import { copyElements, patchElements, removeElements } from '@/lib/designSelection';

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
  selectedIds,
  isMobile,
  setPageIdx,
  selectOnly,
  setSelectedIds,
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
    selectOnly(elements[elements.length - 1].id);
    if (isMobile) setPanel(null);
  }, [patchPage, pageIdx, isMobile, selectOnly, setPanel]);

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
    if (!selectedIds.length) return;
    patchPage(pageIdx, (p) => ({ elements: removeElements(p.elements, selectedIds) }));
    selectOnly(null);
    setEditingId(null);
  }, [patchPage, pageIdx, selectedIds, selectOnly, setEditingId]);

  const duplicateSelected = useCallback(() => {
    const copies = copyElements(page.elements, selectedIds);
    if (!copies.length) return;
    patchPage(pageIdx, (p) => ({ elements: [...p.elements, ...copies] }));
    setSelectedIds(copies.map((el) => el.id));
  }, [patchPage, pageIdx, page.elements, selectedIds, setSelectedIds]);

  const addImageFile = useCallback(async (file, background) => {
    try {
      const { src, width, height } = await readImageFile(file);
      const fit = Math.min((pageW * 0.6) / width, (pageH * 0.6) / height);
      const w = width * fit;
      const h = height * fit;
      const el = background
        ? createImage(null, { x: 0, y: 0, w: pageW, h: pageH, locked: true })
        : createImage(null, { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h });
      const newAssetId = uid();
      update((d) => {
        const { assets, assetId } = storeAsset(d.assets, src, newAssetId);
        const placed = { ...el, assetId };
        return {
          ...d,
          assets,
          pages: d.pages.map((p, i) => (i === pageIdx ? { ...p, elements: background ? [placed, ...p.elements] : [...p.elements, placed] } : p)),
        };
      });
      if (background) return;
      selectOnly(el.id);
      if (isMobile) setPanel(null);
    } catch (err) {
      setNotice(err.message || 'That image could not be opened');
    }
  }, [update, pageIdx, pageW, pageH, isMobile, selectOnly, setPanel, setNotice]);

  // ── Editing text in place ──
  const stopEditing = useCallback(() => {
    setEditingId((id) => {
      if (id) {
        const el = page.elements.find((x) => x.id === id);
        if (el && !el.text.trim()) {
          patchPage(pageIdx, (p) => ({ elements: p.elements.filter((x) => x.id !== id) }));
          selectOnly(null);
        }
      }
      return null;
    });
  }, [page.elements, patchPage, pageIdx, setEditingId, selectOnly]);

  const startEditing = useCallback((el) => {
    if (el.type === 'text' && !el.locked) {
      selectOnly(el.id);
      setEditingId(el.id);
    }
  }, [selectOnly, setEditingId]);

  const typeText = useCallback((id, text) => {
    updateEl(id, { text }, { key: `type-${id}` });
  }, [updateEl]);

  const api = useMemo(() => ({
    select: selectOnly,
    moveLayer,
    toggleLock,
    deleteSelected,
    duplicateSelected,
    updateSelected: (patch, key) => {
      if (!selectedIds.length) return;
      patchPage(pageIdx, (p) => ({ elements: patchElements(p.elements, selectedIds, patch) }), key ? { key: `${key}-${selectedIds.join()}` } : undefined);
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
    addImageAsset: (assetId) => {
      const w = pageW * 0.4;
      addToPage([createImage(assetId, { x: (pageW - w) / 2, y: (pageH - w) / 2, w, h: w })]);
    },
    addBackgroundImage: (file) => addImageFile(file, true),
    setBackground: (color, key) => patchPage(pageIdx, () => ({ background: color }), key ? { key } : undefined),
    backgroundToAllPages: () => update((d) => ({ ...d, pages: d.pages.map((p) => ({ ...p, background: page.background })) })),
    applyTemplate: (tpl) => {
      update((d) => ({ ...d, width: tpl.design.width, height: tpl.design.height, unit: tpl.design.unit, pages: tpl.design.pages.map(clonePage) }));
      setPageIdx(0);
      selectOnly(null);
      zoomToFit();
      if (isMobile) setPanel(null);
    },
    setPageSize: (w, h, unit) => update((d) => resizeDesign(d, Math.max(1, w), Math.max(1, h), unit), { key: 'page-size' }),
  }), [selectedIds, moveLayer, toggleLock, deleteSelected, duplicateSelected, addToPage, addImageFile, patchPage, pageIdx, pageW, pageH, baseScale, update, page.background, isMobile, setPageIdx, selectOnly, setPanel, zoomToFit]);

  return { api, updateEl, measure, moveLayer, toggleLock, deleteSelected, duplicateSelected, stopEditing, startEditing, typeText };
}
