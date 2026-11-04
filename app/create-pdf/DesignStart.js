'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ToastNotification from '@/components/ToastNotification';
import { PAGE_PRESETS, createDesign, parseDesign } from '@/lib/designModel';
import { TEMPLATES, TEMPLATE_CATEGORIES, designFromTemplate } from '@/lib/designTemplates';
import { deleteDesign, listDesigns } from '@/lib/designStore';
import { PageView } from './DesignRenderer';
import DesignIcon from './DesignIcons';

const MAX_PREVIEW_W = 104;
const MAX_PREVIEW_H = 96;
const MAX_CUSTOM = { mm: 2000, in: 80, px: 8000 };

export default function DesignStart({ onOpen }) {
  const [saved, setSaved] = useState([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState({ w: '210', h: '297', unit: 'mm' });
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    listDesigns().then((list) => { if (!cancelled) setSaved(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const templates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) =>
      (category === 'All' || t.category === category) &&
      (!q || t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    );
  }, [category, query]);

  const openFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      onOpen(parseDesign(JSON.parse(await file.text())));
    } catch {
      setError('That file is not a saved PDF Section design.');
    }
  };

  const createCustom = (e) => {
    e.preventDefault();
    const w = parseFloat(custom.w);
    const h = parseFloat(custom.h);
    const max = MAX_CUSTOM[custom.unit];
    if (!(w > 0 && h > 0 && w <= max && h <= max)) {
      setError(`Enter a width and height between 1 and ${max} ${custom.unit}.`);
      return;
    }
    onOpen(createDesign({ w, h, unit: custom.unit }));
  };

  const removeSaved = async (design) => {
    if (!window.confirm(`Delete "${design.name}" from this browser?`)) return;
    await deleteDesign(design.id).catch(() => {});
    setSaved((list) => list.filter((d) => d.id !== design.id));
  };

  return (
    <div className="ds-start">
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={openFile} />
      <ToastNotification message={error} type="error" onClose={() => setError('')} />

      {saved.length > 0 && (
        <section className="ds-section">
          <div className="ds-section-head"><h2>Continue a design</h2></div>
          <div className="ds-saved-row">
            {saved.map((d) => (
              <div key={d.id} className="ds-saved">
                <button type="button" className="ds-saved-open" onClick={() => onOpen(d)}>
                  <span className="ds-template-frame ds-saved-frame">
                    <PageView design={d} page={d.pages[0]} scale={Math.min(150 / d.width, 150 / d.height)} />
                  </span>
                  <span className="ds-saved-name">{d.name}</span>
                </button>
                <button type="button" className="ds-saved-delete" aria-label={`Delete ${d.name}`} onClick={() => removeSaved(d)}>
                  <DesignIcon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="ds-section">
        <div className="ds-section-head">
          <h2>Start with a blank page</h2>
          <button type="button" className="btn btn-secondary ds-open-btn" onClick={() => fileRef.current?.click()}>
            <DesignIcon name="folder" size={18} /> Open saved design
          </button>
        </div>
        <div className="ds-size-grid">
          {PAGE_PRESETS.map((p) => {
            const ratio = Math.min(MAX_PREVIEW_W / p.w, MAX_PREVIEW_H / p.h);
            return (
              <button key={p.id} type="button" className="ds-size-card" onClick={() => onOpen(createDesign({ w: p.w, h: p.h, unit: p.unit }))}>
                <span className="ds-size-shape" style={{ width: p.w * ratio, height: p.h * ratio }} />
                <span className="ds-size-label">{p.label}</span>
                <span className="ds-size-hint">{p.hint}</span>
              </button>
            );
          })}
          <form className="ds-size-card ds-size-custom" onSubmit={createCustom}>
            <span className="ds-size-label">Custom size</span>
            <div className="ds-custom-row">
              <label>W<input inputMode="decimal" value={custom.w} onChange={(e) => setCustom({ ...custom, w: e.target.value })} /></label>
              <label>H<input inputMode="decimal" value={custom.h} onChange={(e) => setCustom({ ...custom, h: e.target.value })} /></label>
            </div>
            <div className="ds-custom-row">
              <label className="ds-sr-label">
                <span>Unit</span>
                <select value={custom.unit} onChange={(e) => setCustom({ ...custom, unit: e.target.value })}>
                  <option value="mm">mm</option>
                  <option value="in">in</option>
                  <option value="px">px</option>
                </select>
              </label>
              <button type="submit" className="ds-custom-go">Create</button>
            </div>
          </form>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section-head">
          <h2>Or start from a template</h2>
          <label className="ds-search">
            <DesignIcon name="search" size={18} />
            <span className="ds-visually-hidden">Search templates</span>
            <input type="search" placeholder="Search templates" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
        <div className="ds-chips">
          {['All', ...TEMPLATE_CATEGORIES].map((c) => (
            <button key={c} type="button" className={`ds-chip ${category === c ? 'active' : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        {templates.length > 0 ? (
          <div className="ds-template-grid">
            {templates.map((t) => (
              <button key={t.id} type="button" className="ds-template" onClick={() => onOpen(designFromTemplate(t))}>
                <span className="ds-template-frame">
                  <PageView design={t.design} page={t.design.pages[0]} scale={Math.min(230 / t.design.width, 311 / t.design.height)} />
                </span>
                <span className="ds-template-meta">
                  <span className="ds-template-name">{t.label}</span>
                  <span className="ds-template-size">{t.sizeLabel}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="ds-empty">No templates match that search.</p>
        )}
      </section>
    </div>
  );
}
