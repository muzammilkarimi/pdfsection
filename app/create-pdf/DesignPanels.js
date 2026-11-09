'use client';

import { useMemo, useRef, useState } from 'react';
import { usedAssetIds } from '@/lib/designAssets';
import { DESIGN_FONTS, fontStack } from '@/lib/designFonts';
import { createShape, shapePath } from '@/lib/designModel';
import { TEMPLATES } from '@/lib/designTemplates';
import { PageView } from './DesignRenderer';
import DesignIcon from './DesignIcons';

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif';

const BACKGROUNDS = ['#ffffff', '#f7f1e8', '#ffd23f', '#ff7a45', '#00875a', '#5e6ad2', '#1b1f4b', '#141320'];

const SHAPES = [
  { kind: 'rect', label: 'Square' },
  { kind: 'rounded', label: 'Rounded square' },
  { kind: 'ellipse', label: 'Circle' },
  { kind: 'triangle', label: 'Triangle' },
  { kind: 'star', label: 'Star' },
  { kind: 'arrow', label: 'Arrow' },
  { kind: 'line', label: 'Line' },
];

const COMBOS = [
  { id: 'sale', bg: '#1b1f4b', fg: '#ffffff', head: 'BIG SALE', sub: 'THIS WEEKEND', headFont: 'Bebas Neue', headBold: false, headItalic: false, headPt: 30, subSpacing: 1 },
  { id: 'date', bg: '#f7f1e8', fg: '#3d2b1f', head: 'Save the date', sub: '12 · 12 · 2026', headFont: 'Playfair Display', headBold: false, headItalic: true, headPt: 18, subSpacing: 1 },
  { id: 'open', bg: '#ffd23f', fg: '#141320', head: 'Grand Opening', sub: 'Join us on Friday', headFont: 'Inter', headBold: true, headItalic: false, headPt: 15, subSpacing: 0 },
  { id: 'cert', bg: '#ffffff', fg: '#141320', head: 'Certificate', sub: 'OF COMPLETION', headFont: 'Playfair Display', headBold: true, headItalic: false, headPt: 20, subSpacing: 1.5 },
];

function TemplatesPanel({ api }) {
  return (
    <div className="ds-panel-templates">
      {TEMPLATES.map((t) => (
        <button key={t.id} type="button" className="ds-panel-template" onClick={() => api.applyTemplate(t)} aria-label={`Use template: ${t.label}`}>
          <PageView design={t.design} page={t.design.pages[0]} scale={Math.min(118 / t.design.width, 160 / t.design.height)} />
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function TextPanel({ api, selectedText }) {
  const [query, setQuery] = useState('');
  const fonts = useMemo(() => DESIGN_FONTS.filter((f) => f.id.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  const addCombo = (c) => {
    api.addTexts([
      { text: c.head, font: c.headFont, bold: c.headBold, italic: c.headItalic, size: c.headPt * 2, align: 'center', w: 360 },
      { text: c.sub, font: 'Inter', size: 14, align: 'center', w: 360, letterSpacing: c.subSpacing },
    ]);
  };

  return (
    <>
      <button type="button" className="ds-primary-btn" onClick={() => api.addTexts([{ text: 'Your text', size: 20, w: 300 }])}>
        <DesignIcon name="plus" size={18} /> Add a text box
      </button>

      <div className="ds-group">
        <span className="ds-group-label">Default styles</span>
        <button type="button" className="ds-style-btn ds-style-h" onClick={() => api.addTexts([{ text: 'Add a heading', size: 44, bold: true, w: 460 }])}>Add a heading</button>
        <button type="button" className="ds-style-btn ds-style-sh" onClick={() => api.addTexts([{ text: 'Add a subheading', size: 24, bold: true, w: 360 }])}>Add a subheading</button>
        <button type="button" className="ds-style-btn" onClick={() => api.addTexts([{ text: 'Add a little body text', size: 14, w: 300, lineHeight: 1.45 }])}>Add a little body text</button>
      </div>

      <div className="ds-group">
        <span className="ds-group-label">Font combinations</span>
        <div className="ds-combo-grid">
          {COMBOS.map((c) => (
            <button key={c.id} type="button" className="ds-combo" style={{ background: c.bg, color: c.fg }} onClick={() => addCombo(c)}>
              <span style={{ fontFamily: fontStack(c.headFont), fontWeight: c.headBold ? 700 : 400, fontStyle: c.headItalic ? 'italic' : 'normal', fontSize: c.headPt, lineHeight: 1.05 }}>{c.head}</span>
              <span className="ds-combo-sub">{c.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ds-group">
        <span className="ds-group-label">{selectedText ? 'Change font' : 'Fonts'}</span>
        <label className="ds-search ds-search-small">
          <DesignIcon name="search" size={16} />
          <span className="ds-visually-hidden">Search fonts</span>
          <input type="search" placeholder="Search fonts" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="ds-font-list">
          {fonts.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`ds-font-item ${selectedText?.font === f.id ? 'active' : ''}`}
              style={{ fontFamily: fontStack(f.id) }}
              onClick={() => (selectedText ? api.updateSelected({ font: f.id }) : api.addTexts([{ text: f.id, font: f.id, size: 24, w: 300 }]))}
            >
              {f.id}
            </button>
          ))}
        </div>
      </div>

      <div className="ds-note">
        <DesignIcon name="globe" size={18} />
        <span>Type in Hindi (हिन्दी), Arabic, Chinese and more. The fonts are embedded in your PDF.</span>
      </div>
    </>
  );
}

function ElementsPanel({ api }) {
  return (
    <div className="ds-shape-grid">
      {SHAPES.map((s) => {
        const sample = createShape(s.kind, s.kind === 'line' ? { w: 44, h: 44, strokeWidth: 3, stroke: 'currentColor' } : { w: 44, h: s.kind === 'arrow' ? 28 : 44, radius: 10, fill: 'currentColor' });
        return (
          <button key={s.kind} type="button" className="ds-shape" aria-label={`Add ${s.label.toLowerCase()}`} onClick={() => api.addShape(s.kind)}>
            <svg width="44" height="44" style={{ overflow: 'visible' }} aria-hidden="true">
              <path d={shapePath(sample)} fill={sample.fill || 'none'} stroke={sample.stroke || 'none'} strokeWidth={sample.strokeWidth} />
            </svg>
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ImagesPanel({ api, design }) {
  const inputRef = useRef(null);
  const used = useMemo(() => [...usedAssetIds(design)], [design]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES}
        multiple
        hidden
        onChange={(e) => {
          api.addImageFiles([...e.target.files]);
          e.target.value = '';
        }}
      />
      <button type="button" className="ds-primary-btn" onClick={() => inputRef.current?.click()}>
        <DesignIcon name="plus" size={18} /> Add an image
      </button>
      <p className="ds-panel-hint">PNG, JPG, WebP or GIF. You can also drop images onto the page. They stay on your device.</p>
      {used.length > 0 && (
        <div className="ds-group">
          <span className="ds-group-label">In this design</span>
          <div className="ds-image-grid">
            {used.map((assetId, i) => (
              <button key={assetId} type="button" className="ds-image-thumb" aria-label={`Add image ${i + 1} again`} onClick={() => api.addImageAsset(assetId)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a user's local image held as a data URL */}
                <img src={design.assets?.[assetId]} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function BackgroundPanel({ api, page }) {
  const inputRef = useRef(null);
  return (
    <>
      <div className="ds-group">
        <span className="ds-group-label">Page color</span>
        <div className="ds-swatches">
          {BACKGROUNDS.map((c) => (
            <button
              key={c}
              type="button"
              className={`ds-swatch ${page.background === c ? 'active' : ''}`}
              style={{ background: c }}
              aria-label={`Use ${c} as the page color`}
              aria-pressed={page.background === c}
              onClick={() => api.setBackground(c)}
            />
          ))}
          <label className="ds-swatch ds-swatch-custom">
            <span className="ds-visually-hidden">Custom page color</span>
            <DesignIcon name="plus" size={14} />
            <input type="color" value={page.background} onChange={(e) => api.setBackground(e.target.value, 'bg-color')} />
          </label>
        </div>
        <button type="button" className="ds-text-btn" onClick={api.backgroundToAllPages}>Use this color on all pages</button>
      </div>
      <div className="ds-group">
        <span className="ds-group-label">Background image</span>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES}
          hidden
          onChange={(e) => {
            if (e.target.files[0]) api.addBackgroundImage(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <button type="button" className="ds-secondary-btn" onClick={() => inputRef.current?.click()}>
          <DesignIcon name="image" size={18} /> Choose an image
        </button>
        <p className="ds-panel-hint">Fills the page and is locked behind everything else. Click it and press the lock button to change it.</p>
      </div>
    </>
  );
}

const layerLabel = (el) => {
  if (el.type === 'text') return el.text.split('\n')[0].slice(0, 28) || 'Empty text';
  if (el.type === 'image') return 'Image';
  return SHAPES.find((s) => s.kind === el.kind)?.label || 'Shape';
};

function LayersPanel({ api, page, selectedId }) {
  if (!page.elements.length) return <p className="ds-panel-hint">Nothing on this page yet.</p>;
  const count = page.elements.length;
  return (
    <ul className="ds-layers">
      {[...page.elements].reverse().map((el, i) => (
        <li key={el.id} className={el.id === selectedId ? 'active' : ''}>
          <button type="button" className="ds-layer-name" onClick={() => api.select(el.id)}>
            <DesignIcon name={el.type === 'text' ? 'text' : el.type === 'image' ? 'image' : 'elements'} size={16} />
            <span>{layerLabel(el)}</span>
          </button>
          <button type="button" className="ds-icon-btn-sm" aria-label="Bring forward" disabled={i === 0} onClick={() => api.moveLayer(el.id, 1)}><DesignIcon name="up" size={16} /></button>
          <button type="button" className="ds-icon-btn-sm" aria-label="Send backward" disabled={i === count - 1} onClick={() => api.moveLayer(el.id, -1)}><DesignIcon name="down" size={16} /></button>
          <button type="button" className="ds-icon-btn-sm" aria-label={el.locked ? 'Unlock' : 'Lock'} aria-pressed={el.locked} onClick={() => api.toggleLock(el.id)}><DesignIcon name={el.locked ? 'lock' : 'unlock'} size={16} /></button>
        </li>
      ))}
    </ul>
  );
}

export const PANELS = [
  { id: 'templates', label: 'Templates', icon: 'templates' },
  { id: 'text', label: 'Text', icon: 'text' },
  { id: 'elements', label: 'Elements', icon: 'elements' },
  { id: 'images', label: 'Images', icon: 'image' },
  { id: 'background', label: 'Background', icon: 'background' },
  { id: 'layers', label: 'Layers', icon: 'layers' },
];

export function PanelContent({ id, api, design, page, selected }) {
  if (id === 'templates') return <TemplatesPanel api={api} />;
  if (id === 'text') return <TextPanel api={api} selectedText={selected?.type === 'text' ? selected : null} />;
  if (id === 'elements') return <ElementsPanel api={api} />;
  if (id === 'images') return <ImagesPanel api={api} design={design} />;
  if (id === 'background') return <BackgroundPanel api={api} page={page} />;
  if (id === 'layers') return <LayersPanel api={api} page={page} selectedId={selected?.id} />;
  return null;
}
