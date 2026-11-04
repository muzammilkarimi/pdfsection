'use client';

import { useEffect, useRef } from 'react';
import { MM, textCss } from '@/lib/designModel';
import { HANDLES } from '@/lib/designGeometry';
import { ElementBody, elementBoxStyle } from './DesignRenderer';
import DesignIcon from './DesignIcons';

const SAFE_MARGIN = 5 * MM;

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

/** The scrollable stage holding the page, its elements and the editing overlays. */
export default function DesignCanvas({
  design,
  page,
  selected,
  editingId,
  guides,
  zoom,
  stageRef,
  scalerRef,
  onDeselect,
  onDropImages,
  onStartDrag,
  onStartResize,
  onStartRotate,
  onStartEditing,
  onStopEditing,
  onMeasure,
  onTypeText,
}) {
  const { width: pageW, height: pageH } = design;
  return (
    <div
      ref={stageRef}
      className="ds-stage"
      onPointerDown={(e) => { if (e.target === e.currentTarget || e.target.dataset.deselect) onDeselect(); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
        if (files.length) onDropImages(files);
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
              onPointerDown={onStartDrag}
              onDoubleClick={onStartEditing}
              onMeasure={onMeasure}
              onText={onTypeText}
              onStopEditing={onStopEditing}
            />
          ))}
        </div>
        {design.unit !== 'px' && (
          <div className="ds-safe" style={{ inset: SAFE_MARGIN * zoom }} aria-hidden="true" />
        )}
        {guides?.x !== null && guides?.x !== undefined && <div className="ds-guide ds-guide-v" style={{ left: guides.x * zoom }} />}
        {guides?.y !== null && guides?.y !== undefined && <div className="ds-guide ds-guide-h" style={{ top: guides.y * zoom }} />}
        {selected && !editingId && <SelectionFrame el={selected} zoom={zoom} onResize={onStartResize} onRotate={onStartRotate} />}
      </div>
    </div>
  );
}
