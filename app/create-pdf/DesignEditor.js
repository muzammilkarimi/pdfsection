'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import ToastNotification from '@/components/ToastNotification';
import {
  MM,
  PAGE_PRESETS,
  clonePage,
  createImage,
  createPage,
  createShape,
  createText,
  fromUnit,
  readImageFile,
  resizeDesign,
  textCss,
  uid,
} from '@/lib/designModel';
import { saveDesign } from '@/lib/designStore';
import { PanelContent, PANELS } from './DesignPanels';
import { ElementBody, PageView, elementBoxStyle } from './DesignRenderer';
import { FloatingToolbar, PropertiesContent, PropertiesHeader } from './DesignProperties';
import DesignDownload from './DesignDownload';
import DesignIcon from './DesignIcons';
import { useDesignHistory } from './useDesignHistory';

const MIN_SIZE = 6;
const SAFE_MARGIN = 5 * MM;
const HANDLES = { nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0] };
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4;
const MOBILE_QUERY = '(max-width: 899px)';

function useIsMobile() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  );
}

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

/** Pulls a moving box onto page edges/centers and other elements' edges/centers. */
function snapBox(x, y, w, h, others, pageW, pageH, threshold) {
  const targetsX = [0, pageW / 2, pageW];
  const targetsY = [0, pageH / 2, pageH];
  for (const o of others) {
    targetsX.push(o.x, o.x + o.w / 2, o.x + o.w);
    targetsY.push(o.y, o.y + o.h / 2, o.y + o.h);
  }
  const best = (pos, size, targets) => {
    let hit = null;
    for (const offset of [0, size / 2, size]) {
      for (const t of targets) {
        const d = t - (pos + offset);
        if (Math.abs(d) < threshold && (!hit || Math.abs(d) < Math.abs(hit.d))) hit = { d, line: t };
      }
    }
    return hit;
  };
  const hx = best(x, w, targetsX);
  const hy = best(y, h, targetsY);
  return { x: x + (hx?.d || 0), y: y + (hy?.d || 0), guideX: hx?.line ?? null, guideY: hy?.line ?? null };
}

/** An element on the editable page. */
function EditableElement({ el, editing, onPointerDown, onDoubleClick, onMeasure, onText, onStopEditing }) {
  const textRef = useRef(null);
  const areaRef = useRef(null);
  const isText = el.type === 'text';

  useEffect(() => {
    if (!isText || !textRef.current) return undefined;
    const node = textRef.current;
    const observer = new ResizeObserver(() => onMeasure(el.id, node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, [isText, el.id, onMeasure]);

  useEffect(() => {
    if (!editing || !areaRef.current) return;
    const area = areaRef.current;
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
  }, [editing]);

  return (
    <div
      ref={textRef}
      className={`ds-el ${el.locked ? 'ds-el-locked' : ''}`}
      style={elementBoxStyle(el)}
      onPointerDown={(e) => onPointerDown(e, el)}
      onDoubleClick={() => onDoubleClick(el)}
    >
      <ElementBody el={el} hidden={editing} />
      {editing && (
        <textarea
          ref={areaRef}
          className="ds-el-textarea"
          aria-label="Edit text"
          dir="auto"
          style={textCss(el)}
          value={el.text}
          onChange={(e) => onText(el.id, e.target.value)}
          onScroll={(e) => { e.currentTarget.scrollTop = 0; }}
          onBlur={onStopEditing}
          onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); e.stopPropagation(); }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

/** Selection frame with resize and rotate handles. Drawn outside the scaled page so handles keep their size. */
function SelectionFrame({ el, zoom, onResize, onRotate }) {
  const isLine = el.type === 'shape' && el.kind === 'line';
  let dirs = Object.keys(HANDLES);
  if (isLine) dirs = ['w', 'e'];
  else if (el.type === 'text') dirs = ['nw', 'ne', 'sw', 'se', 'w', 'e'];
  return (
    <div
      className={`ds-frame ${el.locked ? 'ds-frame-locked' : ''}`}
      style={{
        left: el.x * zoom,
        top: el.y * zoom,
        width: el.w * zoom,
        height: el.h * zoom,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
    >
      {!el.locked && dirs.map((dir) => (
        <span
          key={dir}
          className={`ds-handle ds-handle-${dir}`}
          style={{ left: `${((HANDLES[dir][0] + 1) / 2) * 100}%`, top: `${((HANDLES[dir][1] + 1) / 2) * 100}%` }}
          onPointerDown={(e) => onResize(e, el, dir)}
        />
      ))}
      {!el.locked && (
        <span className="ds-rotate" onPointerDown={(e) => onRotate(e, el)}>
          <DesignIcon name="rotate" size={14} />
        </span>
      )}
    </div>
  );
}

function PreviewDialog({ design, startIndex, onClose }) {
  const ref = useRef(null);
  const [index, setIndex] = useState(startIndex);
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  const scale = Math.min((window.innerWidth * 0.9) / design.width, (window.innerHeight - 140) / design.height);
  return (
    <dialog ref={ref} className="ds-preview" aria-label="Preview" onClose={onClose}>
      <PageView design={design} page={design.pages[index]} scale={scale} />
      <div className="ds-preview-bar">
        <button type="button" className="ds-icon-btn" aria-label="Previous page" disabled={index === 0} onClick={() => setIndex(index - 1)}><DesignIcon name="back" /></button>
        <span>Page {index + 1} of {design.pages.length}</span>
        <button type="button" className="ds-icon-btn" aria-label="Next page" disabled={index === design.pages.length - 1} onClick={() => setIndex(index + 1)}><DesignIcon name="forward" /></button>
        <button type="button" className="ds-secondary-btn" onClick={onClose}>Close preview</button>
      </div>
    </dialog>
  );
}

export default function DesignEditor({ initial, onExit }) {
  const { design, update, undo, redo, canUndo, canRedo } = useDesignHistory(initial);
  const isMobile = useIsMobile();

  const [rawPageIdx, setPageIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [panel, setPanel] = useState(() => (window.matchMedia(MOBILE_QUERY).matches ? null : 'text'));
  const [propsOpen, setPropsOpen] = useState(false);
  const [zoomOverride, setZoomOverride] = useState(null);
  const [fitZoom, setFitZoom] = useState(0.5);
  const [guides, setGuides] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [showDownload, setShowDownload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState('');
  const [dragPage, setDragPage] = useState(null);

  const stageRef = useRef(null);
  const scalerRef = useRef(null);
  const gestureId = useRef(0);

  const pageIdx = Math.min(rawPageIdx, design.pages.length - 1);
  const page = design.pages[pageIdx];
  const selected = page.elements.find((el) => el.id === selectedId) || null;
  const zoom = zoomOverride ?? fitZoom;
  const { width: pageW, height: pageH } = design;
  const baseScale = pageW / 595; // default sizes are written for an A4-wide page

  // ── Autosave ──
  // Only once the user has changed something, so just opening a template doesn't leave a draft behind.
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

  const exit = useCallback(async () => {
    if (dirty.current) await saveDesign(latestDesign.current).catch(() => {});
    onExit();
  }, [onExit]);

  // ── Fit to window ──
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
  }, [pageW, pageH, isMobile]);

  // ── Changing elements ──
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
  }, [patchPage, pageIdx, isMobile]);

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
  }, [patchPage, pageIdx, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    const copy = { ...selected, id: uid(), x: selected.x + 12, y: selected.y + 12, locked: false };
    patchPage(pageIdx, (p) => ({ elements: [...p.elements, copy] }));
    setSelectedId(copy.id);
  }, [patchPage, pageIdx, selected]);

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
  }, [addToPage, patchPage, pageIdx, pageW, pageH]);

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
      setZoomOverride(null);
      if (isMobile) setPanel(null);
    },
    setPageSize: (w, h, unit) => update((d) => resizeDesign(d, Math.max(1, w), Math.max(1, h), unit), { key: 'page-size' }),
  }), [selectedId, updateEl, moveLayer, toggleLock, deleteSelected, duplicateSelected, addToPage, addImageFile, patchPage, pageIdx, pageW, pageH, baseScale, update, page.background, isMobile]);

  // ── Pointer gestures ──
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
  }, [editingId, selectedId, page.elements, zoom, pageW, pageH, updateEl]);

  const startResize = useCallback((e, el, dir) => {
    e.stopPropagation();
    e.preventDefault();
    document.activeElement?.blur(); // a focused number field would keep showing its old value
    const [hx, hy] = HANDLES[dir];
    const key = `g${++gestureId.current}`;
    const rad = (el.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const cx0 = el.x + el.w / 2;
    const cy0 = el.y + el.h / 2;
    const corner = !!(hx && hy);
    const isText = el.type === 'text';
    track(e, {
      move: (dx, dy, ev) => {
        // pointer movement in the element's own (rotated) axes
        const lx = (dx * cos + dy * sin) / zoom;
        const ly = (-dx * sin + dy * cos) / zoom;
        let w = Math.max(MIN_SIZE, el.w + hx * lx);
        let h = hy ? Math.max(MIN_SIZE, el.h + hy * ly) : el.h;
        let ratio = 1;
        if (corner && (isText || el.type === 'image' || ev.shiftKey)) {
          ratio = Math.max(w / el.w, h / el.h);
          w = el.w * ratio;
          h = el.h * ratio;
        }
        const sx = (hx * (w - el.w)) / 2;
        const sy = (hy * (h - el.h)) / 2;
        const cx = cx0 + sx * cos - sy * sin;
        const cy = cy0 + sx * sin + sy * cos;
        const patch = { x: cx - w / 2, y: cy - h / 2, w, h };
        if (isText && corner) {
          patch.size = Math.max(1, el.size * ratio);
          patch.letterSpacing = el.letterSpacing * ratio;
        }
        updateEl(el.id, patch, { key, hold: true });
      },
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
      move: (_dx, _dy, ev) => {
        // the handle sits below the element, so "straight down" means 0°
        let angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI - 90;
        if (ev.shiftKey) angle = Math.round(angle / 15) * 15;
        else {
          const nearest = Math.round(angle / 45) * 45;
          if (Math.abs(angle - nearest) < 3) angle = nearest;
        }
        angle = ((angle + 540) % 360) - 180;
        updateEl(el.id, { rotation: Math.round(angle * 10) / 10 }, { key, hold: true });
      },
    });
  }, [zoom, updateEl]);

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
  }, [page.elements, patchPage, pageIdx]);

  const startEditing = useCallback((el) => {
    if (el.type === 'text' && !el.locked) {
      setSelectedId(el.id);
      setEditingId(el.id);
    }
  }, []);

  const typeText = useCallback((id, text) => {
    updateEl(id, { text }, { key: `type-${id}` });
  }, [updateEl]);

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e) => {
      if (showDownload || showPreview) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && k === 'y') { e.preventDefault(); redo(); return; }
      if (mod && k === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (!selected) return;
      if (e.key === 'Escape') { setSelectedId(null); return; }
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
  }, [selected, undo, redo, duplicateSelected, deleteSelected, updateEl, showDownload, showPreview]);

  // ── Pages ──
  const addPage = () => {
    const blank = createPage();
    update((d) => {
      const pages = [...d.pages];
      pages.splice(pageIdx + 1, 0, blank);
      return { ...d, pages };
    });
    setPageIdx(pageIdx + 1);
    setSelectedId(null);
  };

  const duplicatePage = () => {
    update((d) => {
      const pages = [...d.pages];
      pages.splice(pageIdx + 1, 0, clonePage(page));
      return { ...d, pages };
    });
    setPageIdx(pageIdx + 1);
    setSelectedId(null);
  };

  const deletePage = () => {
    if (design.pages.length < 2) return;
    update((d) => ({ ...d, pages: d.pages.filter((_, i) => i !== pageIdx) }));
    setPageIdx(Math.max(0, pageIdx - 1));
    setSelectedId(null);
  };

  const dropPage = (target) => {
    if (dragPage === null || dragPage === target) return;
    update((d) => {
      const pages = [...d.pages];
      const [moved] = pages.splice(dragPage, 1);
      pages.splice(target, 0, moved);
      return { ...d, pages };
    });
    setPageIdx(target);
    setDragPage(null);
  };

  const goToPage = (i) => {
    setPageIdx(i);
    setSelectedId(null);
    setEditingId(null);
  };

  const pageStrip = (
    <div className="ds-strip">
      <div className="ds-strip-pages">
        {design.pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`ds-strip-page ${i === pageIdx ? 'active' : ''}`}
            aria-label={`Page ${i + 1}`}
            aria-current={i === pageIdx}
            draggable
            onClick={() => goToPage(i)}
            onDragStart={() => setDragPage(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropPage(i)}
          >
            <PageView design={design} page={p} scale={Math.min(52 / pageW, 72 / pageH)} />
            <span className="ds-strip-num">{i + 1}</span>
          </button>
        ))}
        <button type="button" className="ds-strip-add" onClick={addPage}>
          <DesignIcon name="plus" size={18} /> Page
        </button>
      </div>
      <div className="ds-strip-actions">
        <button type="button" className="ds-text-btn" onClick={duplicatePage}>Duplicate page</button>
        <button type="button" className="ds-text-btn ds-danger" disabled={design.pages.length < 2} onClick={deletePage}>Delete page</button>
      </div>
    </div>
  );

  const presetValue = PAGE_PRESETS.find((p) => Math.abs(fromUnit(p.w, p.unit) - pageW) < 0.5 && Math.abs(fromUnit(p.h, p.unit) - pageH) < 0.5)?.id || 'custom';
  const statusText = { idle: 'Autosaves in this browser', saved: 'Saved in this browser', saving: 'Saving…', failed: "Couldn't save in this browser" }[saveState];
  const mobilePanels = [...PANELS, { id: 'pages', label: 'Pages', icon: 'pages' }];
  const panelInfo = mobilePanels.find((p) => p.id === panel);
  const showMobileProps = isMobile && propsOpen && selected;

  return (
    <div className="ds-editor">
      <ToastNotification message={notice} type="error" onClose={() => setNotice('')} />

      <header className="ds-topbar">
        <div className="ds-topbar-side">
          <button type="button" className="ds-icon-btn" aria-label="Back to start" onClick={exit}><DesignIcon name="back" /></button>
          <div className="ds-title">
            <label>
              <span className="ds-visually-hidden">Design name</span>
              <input value={design.name} onChange={(e) => update((d) => ({ ...d, name: e.target.value }), { key: 'name' })} />
            </label>
            <span className={`ds-status ${saveState === 'failed' ? 'failed' : ''}`} role="status"><span className="ds-status-dot" />{statusText}</span>
          </div>
          <span className="ds-topbar-sep" />
          <button type="button" className="ds-icon-btn" aria-label="Undo" disabled={!canUndo} onClick={undo}><DesignIcon name="undo" /></button>
          <button type="button" className="ds-icon-btn ds-hide-mobile" aria-label="Redo" disabled={!canRedo} onClick={redo}><DesignIcon name="redo" /></button>
        </div>
        <label className="ds-size-select ds-hide-mobile">
          <span className="ds-visually-hidden">Page size</span>
          <select
            value={presetValue}
            onChange={(e) => {
              const p = PAGE_PRESETS.find((x) => x.id === e.target.value);
              if (p) update((d) => resizeDesign(d, fromUnit(p.w, p.unit), fromUnit(p.h, p.unit), p.unit));
            }}
          >
            {PAGE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label} · {p.hint}</option>)}
            {presetValue === 'custom' && <option value="custom">Custom size</option>}
          </select>
        </label>
        <div className="ds-topbar-side ds-topbar-end">
          <button type="button" className="ds-secondary-btn ds-hide-mobile" onClick={() => setShowPreview(true)}><DesignIcon name="eye" size={18} /> Preview</button>
          <button type="button" className="ds-primary-btn ds-download-btn" aria-label="Download" onClick={() => { setEditingId(null); setShowDownload(true); }}>
            <DesignIcon name="download" size={18} /> <span className="ds-hide-mobile">Download PDF</span>
          </button>
        </div>
      </header>

      <div className="ds-body">
        <nav className="ds-rail" aria-label="Editor panels">
          {(isMobile ? mobilePanels : PANELS).map((p) => (
            <button key={p.id} type="button" className={panel === p.id ? 'active' : ''} aria-pressed={panel === p.id} onClick={() => setPanel(panel === p.id ? null : p.id)}>
              <DesignIcon name={p.icon} size={22} />
              {p.label}
            </button>
          ))}
        </nav>

        {panel && (
          <aside className="ds-panel" aria-label={panelInfo?.label}>
            <div className="ds-panel-head">
              <span>{panelInfo?.label}</span>
              <button type="button" className="ds-icon-btn-sm" aria-label="Close panel" onClick={() => setPanel(null)}><DesignIcon name="close" size={16} /></button>
            </div>
            <div className="ds-panel-body">
              {panel === 'pages' ? pageStrip : <PanelContent id={panel} api={api} design={design} page={page} selected={selected} />}
            </div>
          </aside>
        )}

        <section className="ds-workspace" aria-label="Page canvas">
          {selected && !isMobile && !editingId && <FloatingToolbar el={selected} api={api} />}

          <div
            ref={stageRef}
            className="ds-stage"
            onPointerDown={(e) => { if (e.target === e.currentTarget || e.target.dataset.deselect) { setSelectedId(null); setEditingId(null); } }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
              if (files.length) api.addImageFiles(files);
            }}
          >
            <div ref={scalerRef} className="ds-scaler" style={{ width: pageW * zoom, height: pageH * zoom }}>
              <div
                className="ds-page"
                data-deselect="1"
                style={{ width: pageW, height: pageH, background: page.background, transform: `scale(${zoom})` }}
              >
                {page.elements.map((el) => (
                  <EditableElement
                    key={el.id}
                    el={el}
                    editing={editingId === el.id}
                    onPointerDown={startDrag}
                    onDoubleClick={startEditing}
                    onMeasure={measure}
                    onText={typeText}
                    onStopEditing={stopEditing}
                  />
                ))}
              </div>
              {design.unit !== 'px' && (
                <div className="ds-safe" style={{ inset: SAFE_MARGIN * zoom }} aria-hidden="true" />
              )}
              {guides?.x !== null && guides?.x !== undefined && <div className="ds-guide ds-guide-v" style={{ left: guides.x * zoom }} />}
              {guides?.y !== null && guides?.y !== undefined && <div className="ds-guide ds-guide-h" style={{ top: guides.y * zoom }} />}
              {selected && !editingId && <SelectionFrame el={selected} zoom={zoom} onResize={startResize} onRotate={startRotate} />}
            </div>
          </div>

          <div className="ds-zoom">
            <button type="button" aria-label="Zoom out" onClick={() => setZoomOverride(Math.max(ZOOM_MIN, zoom / 1.2))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setZoomOverride(Math.min(ZOOM_MAX, zoom * 1.2))}>+</button>
            <button type="button" className="ds-zoom-fit" onClick={() => setZoomOverride(null)}>Fit</button>
          </div>

          {isMobile ? (
            <div className="ds-page-nav">
              <button type="button" className="ds-round-btn" aria-label="Previous page" disabled={pageIdx === 0} onClick={() => goToPage(pageIdx - 1)}><DesignIcon name="back" size={16} /></button>
              <span>Page {pageIdx + 1} of {design.pages.length}</span>
              <button type="button" className="ds-round-btn" aria-label="Next page" disabled={pageIdx === design.pages.length - 1} onClick={() => goToPage(pageIdx + 1)}><DesignIcon name="forward" size={16} /></button>
            </div>
          ) : pageStrip}

          {isMobile && selected && !panel && (
            <div className="ds-context" role="toolbar" aria-label="Selected element">
              {selected.locked ? (
                <button type="button" onClick={() => toggleLock(selected.id)}><DesignIcon name="unlock" size={18} />Unlock</button>
              ) : (
                <>
                  {selected.type === 'text' && <button type="button" onClick={() => startEditing(selected)}><DesignIcon name="text" size={18} />Edit</button>}
                  <button type="button" onClick={() => setPropsOpen(true)}><DesignIcon name="sliders" size={18} />Style</button>
                  <button type="button" onClick={duplicateSelected}><DesignIcon name="copy" size={18} />Copy</button>
                  <button type="button" onClick={() => moveLayer(selected.id, 1)}><DesignIcon name="up" size={18} />Forward</button>
                  <button type="button" className="ds-danger" onClick={deleteSelected}><DesignIcon name="trash" size={18} />Delete</button>
                </>
              )}
            </div>
          )}
        </section>

        {!isMobile && (
          <aside className="ds-side" aria-label="Properties">
            <PropertiesHeader el={selected} api={api} />
            <div className="ds-side-body">
              <PropertiesContent el={selected} design={design} page={page} pageIdx={pageIdx} api={api} />
            </div>
          </aside>
        )}

        {showMobileProps && (
          <aside className="ds-panel ds-panel-props" aria-label="Properties">
            <div className="ds-panel-head">
              <PropertiesHeader el={selected} api={api} />
              <button type="button" className="ds-icon-btn-sm" aria-label="Close" onClick={() => setPropsOpen(false)}><DesignIcon name="close" size={16} /></button>
            </div>
            <div className="ds-panel-body">
              <PropertiesContent el={selected} design={design} page={page} pageIdx={pageIdx} api={api} />
            </div>
          </aside>
        )}
      </div>

      {showDownload && <DesignDownload design={design} pageIdx={pageIdx} onClose={() => setShowDownload(false)} />}
      {showPreview && <PreviewDialog design={design} startIndex={pageIdx} onClose={() => setShowPreview(false)} />}
    </div>
  );
}
