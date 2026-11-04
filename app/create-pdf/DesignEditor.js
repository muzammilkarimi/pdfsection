'use client';

import { useCallback, useRef, useState } from 'react';
import ToastNotification from '@/components/ToastNotification';
import { PAGE_PRESETS, fromUnit, resizeDesign } from '@/lib/designModel';
import { PanelContent, PANELS } from './DesignPanels';
import { FloatingToolbar, PropertiesContent, PropertiesHeader } from './DesignProperties';
import DesignCanvas from './DesignCanvas';
import DesignDownload from './DesignDownload';
import DesignIcon from './DesignIcons';
import DesignPageStrip from './DesignPageStrip';
import DesignPreview from './DesignPreview';
import { useDesignActions } from './useDesignActions';
import { useDesignAutosave } from './useDesignAutosave';
import { useDesignGestures } from './useDesignGestures';
import { useDesignHistory } from './useDesignHistory';
import { useDesignKeyboard } from './useDesignKeyboard';
import { useDesignZoom } from './useDesignZoom';
import { MOBILE_QUERY, useIsMobile } from './useIsMobile';

const SAVE_STATUS = { idle: 'Autosaves in this browser', saved: 'Saved in this browser', saving: 'Saving…', failed: "Couldn't save in this browser" };

export default function DesignEditor({ initial, onExit }) {
  const { design, update, undo, redo, canUndo, canRedo } = useDesignHistory(initial);
  const isMobile = useIsMobile();

  const [rawPageIdx, setPageIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [panel, setPanel] = useState(() => (window.matchMedia(MOBILE_QUERY).matches ? null : 'text'));
  const [propsOpen, setPropsOpen] = useState(false);
  const [guides, setGuides] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState('');

  const stageRef = useRef(null);
  const scalerRef = useRef(null);

  const pageIdx = Math.min(rawPageIdx, design.pages.length - 1);
  const page = design.pages[pageIdx];
  const selected = page.elements.find((el) => el.id === selectedId) || null;
  const { width: pageW, height: pageH } = design;

  const { saveState, saveNow } = useDesignAutosave(design, canUndo);
  const { zoom, zoomIn, zoomOut, zoomToFit } = useDesignZoom(stageRef, pageW, pageH, isMobile);
  const {
    api,
    updateEl,
    measure,
    moveLayer,
    toggleLock,
    deleteSelected,
    duplicateSelected,
    stopEditing,
    startEditing,
    typeText,
  } = useDesignActions({
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
  });
  const { startDrag, startResize, startRotate } = useDesignGestures({
    page,
    pageW,
    pageH,
    zoom,
    scalerRef,
    selectedId,
    editingId,
    setSelectedId,
    setEditingId,
    setGuides,
    updateEl,
  });
  useDesignKeyboard({
    enabled: !showDownload && !showPreview,
    selected,
    undo,
    redo,
    duplicateSelected,
    deleteSelected,
    updateEl,
    setSelectedId,
  });

  const exit = useCallback(async () => {
    await saveNow();
    onExit();
  }, [saveNow, onExit]);

  const goToPage = (i) => {
    setPageIdx(i);
    setSelectedId(null);
    setEditingId(null);
  };

  const pageStrip = (
    <DesignPageStrip
      design={design}
      pageIdx={pageIdx}
      update={update}
      setPageIdx={setPageIdx}
      setSelectedId={setSelectedId}
      onGoToPage={goToPage}
    />
  );

  const presetValue = PAGE_PRESETS.find((p) => Math.abs(fromUnit(p.w, p.unit) - pageW) < 0.5 && Math.abs(fromUnit(p.h, p.unit) - pageH) < 0.5)?.id || 'custom';
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
            <span className={`ds-status ${saveState === 'failed' ? 'failed' : ''}`} role="status"><span className="ds-status-dot" />{SAVE_STATUS[saveState]}</span>
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

          <DesignCanvas
            design={design}
            page={page}
            selected={selected}
            editingId={editingId}
            guides={guides}
            zoom={zoom}
            stageRef={stageRef}
            scalerRef={scalerRef}
            onDeselect={() => { setSelectedId(null); setEditingId(null); }}
            onDropImages={api.addImageFiles}
            onStartDrag={startDrag}
            onStartResize={startResize}
            onStartRotate={startRotate}
            onStartEditing={startEditing}
            onStopEditing={stopEditing}
            onMeasure={measure}
            onTypeText={typeText}
          />

          <div className="ds-zoom">
            <button type="button" aria-label="Zoom out" onClick={zoomOut}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={zoomIn}>+</button>
            <button type="button" className="ds-zoom-fit" onClick={zoomToFit}>Fit</button>
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
      {showPreview && <DesignPreview design={design} startIndex={pageIdx} onClose={() => setShowPreview(false)} />}
    </div>
  );
}
