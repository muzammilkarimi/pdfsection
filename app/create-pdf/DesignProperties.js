'use client';

import { useMemo, useState } from 'react';
import { DESIGN_FONTS, getFont } from '@/lib/designFonts';
import { fromUnit, toUnit } from '@/lib/designModel';
import DesignIcon from './DesignIcons';

const round = (v, places = 2) => String(+Number(v).toFixed(places));

/** Numeric input: applies each valid value as you type and tolerates half-typed ones. */
export function NumberField({ label, value, onChange, min, places = 2, wide = false }) {
  const [draft, setDraft] = useState(null);
  return (
    <label className={`ds-num ${wide ? 'ds-num-wide' : ''}`}>
      <span>{label}</span>
      <input
        inputMode="decimal"
        value={draft ?? round(value, places)}
        onFocus={() => setDraft(round(value, places))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(min !== undefined ? Math.max(min, v) : v);
        }}
      />
    </label>
  );
}

function documentColors(design) {
  const counts = new Map();
  const add = (c) => { if (c) counts.set(c, (counts.get(c) || 0) + 1); };
  for (const page of design.pages) {
    add(page.background);
    for (const el of page.elements) { add(el.color); add(el.fill); add(el.stroke); }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
}

function ColorField({ label, value, colors, onChange, allowNone = false }) {
  return (
    <div className="ds-group ds-group-tight">
      <span className="ds-prop-label">{label}</span>
      <div className="ds-swatches">
        {allowNone && (
          <button type="button" className={`ds-swatch ds-swatch-none ${!value ? 'active' : ''}`} aria-label={`No ${label.toLowerCase()}`} aria-pressed={!value} onClick={() => onChange(null)} />
        )}
        {colors.map((c) => (
          <button key={c} type="button" className={`ds-swatch ${value === c ? 'active' : ''}`} style={{ background: c }} aria-label={`Use ${c}`} aria-pressed={value === c} onClick={() => onChange(c)} />
        ))}
        <label className="ds-swatch ds-swatch-custom">
          <span className="ds-visually-hidden">Custom {label.toLowerCase()}</span>
          <DesignIcon name="plus" size={14} />
          <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
        </label>
      </div>
    </div>
  );
}

function AlignButtons({ value, onChange }) {
  return (
    <div className="ds-segment" role="group" aria-label="Alignment">
      {[['left', 'alignLeft', 'Align left'], ['center', 'alignCenter', 'Align center'], ['right', 'alignRight', 'Align right']].map(([id, icon, label]) => (
        <button key={id} type="button" className={value === id ? 'active' : ''} aria-label={label} aria-pressed={value === id} onClick={() => onChange(id)}>
          <DesignIcon name={icon} size={16} />
        </button>
      ))}
    </div>
  );
}

function FontSelect({ value, onChange }) {
  return (
    <label className="ds-select">
      <span className="ds-visually-hidden">Font</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {DESIGN_FONTS.map((f) => <option key={f.id} value={f.id}>{f.id}</option>)}
      </select>
    </label>
  );
}

function TextProps({ el, set, colors }) {
  const font = getFont(el.font);
  return (
    <>
      <div className="ds-group ds-group-tight">
        <span className="ds-prop-label">Font</span>
        <FontSelect value={el.font} onChange={(v) => set({ font: v })} />
        <div className="ds-grid-2">
          <NumberField label="Size" value={el.size} min={1} places={1} onChange={(v) => set({ size: v }, 'size')} />
          <div className="ds-segment" role="group" aria-label="Style">
            <button type="button" className={el.bold && font.bold ? 'active' : ''} aria-pressed={!!el.bold && font.bold} aria-label="Bold" disabled={!font.bold} onClick={() => set({ bold: !el.bold })}><b>B</b></button>
            <button type="button" className={el.italic && font.italic ? 'active' : ''} aria-pressed={!!el.italic && font.italic} aria-label="Italic" disabled={!font.italic} onClick={() => set({ italic: !el.italic })}><i style={{ fontFamily: 'Georgia, serif' }}>I</i></button>
          </div>
        </div>
      </div>
      <div className="ds-group ds-group-tight">
        <span className="ds-prop-label">Alignment</span>
        <AlignButtons value={el.align} onChange={(v) => set({ align: v })} />
      </div>
      <div className="ds-grid-2">
        <NumberField wide label="Letter spacing" value={el.letterSpacing} onChange={(v) => set({ letterSpacing: v }, 'spacing')} />
        <NumberField wide label="Line height" value={el.lineHeight} min={0.5} onChange={(v) => set({ lineHeight: v }, 'leading')} />
      </div>
      <ColorField label="Color" value={el.color} colors={colors} onChange={(v) => set({ color: v }, 'color')} />
    </>
  );
}

function ShapeProps({ el, set, colors }) {
  const isLine = el.kind === 'line';
  return (
    <>
      {!isLine && <ColorField label="Fill" value={el.fill} colors={colors} allowNone onChange={(v) => set({ fill: v }, 'fill')} />}
      <ColorField
        label={isLine ? 'Color' : 'Border'}
        value={el.stroke}
        colors={colors}
        allowNone={!isLine}
        onChange={(v) => set(v && !el.strokeWidth ? { stroke: v, strokeWidth: 2 } : { stroke: v }, 'stroke')}
      />
      <div className="ds-grid-2">
        <NumberField wide label={isLine ? 'Thickness' : 'Border width'} value={el.strokeWidth} min={0} onChange={(v) => set({ strokeWidth: v }, 'strokeWidth')} />
        {el.kind === 'rounded' && <NumberField wide label="Corner radius" value={el.radius} min={0} onChange={(v) => set({ radius: v }, 'radius')} />}
      </div>
    </>
  );
}

function CommonProps({ el, unit, set, actions }) {
  const inUnit = (pt) => toUnit(pt, unit);
  const places = unit === 'in' ? 2 : 1;
  return (
    <>
      <label className="ds-group ds-group-tight">
        <span className="ds-prop-label ds-prop-row">Opacity <span>{Math.round(el.opacity * 100)}%</span></span>
        <input type="range" min="0" max="100" value={Math.round(el.opacity * 100)} onChange={(e) => set({ opacity: Number(e.target.value) / 100 }, 'opacity')} />
      </label>
      <div className="ds-group ds-group-tight">
        <span className="ds-prop-label">Position &amp; size ({unit})</span>
        <div className="ds-grid-2">
          <NumberField label="X" places={places} value={inUnit(el.x)} onChange={(v) => set({ x: fromUnit(v, unit) }, 'x')} />
          <NumberField label="Y" places={places} value={inUnit(el.y)} onChange={(v) => set({ y: fromUnit(v, unit) }, 'y')} />
          <NumberField label="W" places={places} min={0.1} value={inUnit(el.w)} onChange={(v) => set({ w: fromUnit(v, unit) }, 'w')} />
          {el.type !== 'text' && !(el.type === 'shape' && el.kind === 'line') && (
            <NumberField label="H" places={places} min={0.1} value={inUnit(el.h)} onChange={(v) => set({ h: fromUnit(v, unit) }, 'h')} />
          )}
          <NumberField label="Angle" places={1} value={el.rotation} onChange={(v) => set({ rotation: v }, 'rotation')} />
        </div>
      </div>
      <div className="ds-grid-2">
        <button type="button" className="ds-secondary-btn" onClick={() => actions.moveLayer(el.id, 1)}>Bring forward</button>
        <button type="button" className="ds-secondary-btn" onClick={() => actions.moveLayer(el.id, -1)}>Send backward</button>
      </div>
    </>
  );
}

function PageProps({ design, page, pageIdx, api }) {
  const { unit } = design;
  return (
    <>
      <p className="ds-panel-hint">Page {pageIdx + 1} of {design.pages.length}. Select something on the page to edit it.</p>
      <div className="ds-group ds-group-tight">
        <span className="ds-prop-label">Page size ({unit})</span>
        <div className="ds-grid-2">
          <NumberField label="W" min={1} places={unit === 'in' ? 2 : 1} value={toUnit(design.width, unit)} onChange={(v) => api.setPageSize(fromUnit(v, unit), design.height, unit)} />
          <NumberField label="H" min={1} places={unit === 'in' ? 2 : 1} value={toUnit(design.height, unit)} onChange={(v) => api.setPageSize(design.width, fromUnit(v, unit), unit)} />
        </div>
      </div>
      <ColorField label="Page color" value={page.background} colors={documentColors(design)} onChange={(v) => api.setBackground(v, 'bg-color')} />
    </>
  );
}

const TITLES = { text: 'Text', shape: 'Shape', image: 'Image' };

export function PropertiesContent({ el, design, page, pageIdx, api }) {
  const colors = useMemo(() => documentColors(design), [design]);
  if (!el) return <PageProps design={design} page={page} pageIdx={pageIdx} api={api} />;
  return (
    <fieldset className="ds-props-body" disabled={el.locked}>
      {el.type === 'text' && <TextProps el={el} set={api.updateSelected} colors={colors} />}
      {el.type === 'shape' && <ShapeProps el={el} set={api.updateSelected} colors={colors} />}
      <CommonProps el={el} unit={design.unit} set={api.updateSelected} actions={api} />
    </fieldset>
  );
}

export function PropertiesHeader({ el, api }) {
  return (
    <div className="ds-side-head">
      <span>{el ? TITLES[el.type] : 'Page'}</span>
      {el && (
        <button type="button" className={`ds-icon-btn-sm ${el.locked ? 'active' : ''}`} aria-label={el.locked ? 'Unlock' : 'Lock'} aria-pressed={el.locked} onClick={() => api.toggleLock(el.id)}>
          <DesignIcon name={el.locked ? 'lock' : 'unlock'} size={16} />
        </button>
      )}
    </div>
  );
}

/** Quick controls floating over the page while something is selected (desktop). */
export function FloatingToolbar({ el, api }) {
  const font = el.type === 'text' ? getFont(el.font) : null;
  return (
    <div className="ds-float" role="toolbar" aria-label="Selected element">
      {el.locked ? (
        <button type="button" className="ds-float-text" onClick={() => api.toggleLock(el.id)}><DesignIcon name="unlock" size={16} /> Unlock to edit</button>
      ) : (
        <>
          {el.type === 'text' && (
            <>
              <FontSelect value={el.font} onChange={(v) => api.updateSelected({ font: v })} />
              <div className="ds-stepper">
                <button type="button" aria-label="Smaller text" onClick={() => api.updateSelected({ size: Math.max(1, Math.round(el.size) - 1) }, 'size')}>−</button>
                <span>{round(el.size, 1)}</span>
                <button type="button" aria-label="Larger text" onClick={() => api.updateSelected({ size: Math.round(el.size) + 1 }, 'size')}>+</button>
              </div>
              <span className="ds-float-sep" />
              <label className="ds-float-color" title="Text color">
                <span className="ds-visually-hidden">Text color</span>
                <b>A</b><span style={{ background: el.color }} />
                <input type="color" value={el.color} onChange={(e) => api.updateSelected({ color: e.target.value }, 'color')} />
              </label>
              <button type="button" className={el.bold && font.bold ? 'active' : ''} aria-label="Bold" aria-pressed={!!el.bold && font.bold} disabled={!font.bold} onClick={() => api.updateSelected({ bold: !el.bold })}><b>B</b></button>
              <button type="button" className={el.italic && font.italic ? 'active' : ''} aria-label="Italic" aria-pressed={!!el.italic && font.italic} disabled={!font.italic} onClick={() => api.updateSelected({ italic: !el.italic })}><i style={{ fontFamily: 'Georgia, serif' }}>I</i></button>
              <button
                type="button"
                aria-label={`Alignment: ${el.align}`}
                onClick={() => api.updateSelected({ align: { left: 'center', center: 'right', right: 'left' }[el.align] })}
              >
                <DesignIcon name={{ left: 'alignLeft', center: 'alignCenter', right: 'alignRight' }[el.align]} size={18} />
              </button>
            </>
          )}
          {el.type === 'shape' && (
            <label className="ds-float-color" title={el.kind === 'line' ? 'Line color' : 'Fill color'}>
              <span className="ds-visually-hidden">{el.kind === 'line' ? 'Line color' : 'Fill color'}</span>
              <span className="ds-float-chip" style={{ background: (el.kind === 'line' ? el.stroke : el.fill) || 'transparent' }} />
              <input
                type="color"
                value={(el.kind === 'line' ? el.stroke : el.fill) || '#000000'}
                onChange={(e) => api.updateSelected(el.kind === 'line' ? { stroke: e.target.value } : { fill: e.target.value }, 'fill')}
              />
            </label>
          )}
          {el.type !== 'image' && <span className="ds-float-sep" />}
          <button type="button" aria-label="Duplicate" onClick={api.duplicateSelected}><DesignIcon name="copy" size={18} /></button>
          <button type="button" className="ds-danger" aria-label="Delete" onClick={api.deleteSelected}><DesignIcon name="trash" size={18} /></button>
        </>
      )}
    </div>
  );
}
