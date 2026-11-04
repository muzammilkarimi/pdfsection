'use client';

import { ToolIcon } from '@/components/Icons';

// One added/edited element drawn on top of the PDF page (text, stamp, image, shape, highlight...).
// Positions are page fractions so the overlay scales with the canvas.
export default function EditElementOverlay({
  el,
  selectedId,
  pagePt,
  setSelectedId,
  setDragState,
  updateElementProps,
  duplicateElement,
  deleteElement,
}) {
  const isSelected = selectedId === el.id;

  // 1. Text Element
  if (el.type === 'text') {
    return (
      <div
        key={el.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
          setDragState({
            id: el.id,
            mode: 'move',
            startX: e.clientX,
            startY: e.clientY,
            initX: el.x,
            initY: el.y,
            initW: el.width,
            initH: el.height,
          });
        }}
        style={{
          position: 'absolute',
          left: `${el.x * 100}%`,
          top: `${el.y * 100}%`,
          width: `${(el.width || 0.2) * 100}%`,
          color: el.color,
          fontSize: `${((el.size || 16) / pagePt.width) * 100}cqw`,
          fontFamily: el.fontFamily === 'Times' ? '"Times New Roman", Times, serif' : el.fontFamily === 'Courier' ? '"Courier New", Courier, monospace' : 'Helvetica, Arial, sans-serif',
          fontWeight: el.isBold ? 'bold' : 'normal',
          fontStyle: el.isItalic ? 'italic' : 'normal',
          WebkitTextStroke: el.boost > 0 ? `${(el.boost / pagePt.width) * 100}cqw ${el.color}` : undefined,
          padding: 0,
          outline: isSelected ? '1.5px solid var(--primary)' : 'none',
          outlineOffset: '1px',
          borderRadius: '3px',
          backgroundColor: isSelected ? 'rgba(94, 106, 210, 0.08)' : 'transparent',
          cursor: 'move',
          userSelect: 'none',
          display: 'inline-flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
        }}
      >
        <textarea dir="auto"
          value={el.text}
          onChange={(e) => updateElementProps(el.id, { text: e.target.value })}
          onFocus={() => setSelectedId(el.id)}
          onClick={(e) => e.stopPropagation()}
          rows={Math.max(1, el.text.split('\n').length)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'inherit',
            font: 'inherit',
            width: '100%',
            minHeight: '100%',
            resize: 'none',
            overflow: 'visible',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            padding: 0,
            margin: 0,
            lineHeight: el.lineHeight || 1.25,
          }}
        />
        {isSelected && (
          <div style={{ position: 'absolute', top: '-14px', right: '-10px', display: 'flex', gap: '4px', zIndex: 12 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                duplicateElement(el.id);
              }}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
              title="Duplicate"
            >
              📋
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(el.id);
              }}
              style={{
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
              title="Delete text"
            >
              ✕
            </button>
          </div>
        )}
        {/* Text area resize handle */}
        {isSelected && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragState({
                id: el.id,
                mode: 'resize',
                startX: e.clientX,
                startY: e.clientY,
                initX: el.x,
                initY: el.y,
                initW: el.width,
                initH: el.height,
                initSize: el.size || 16,
              });
            }}
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '10px',
              height: '10px',
              backgroundColor: 'var(--primary)',
              borderRadius: '2px',
              cursor: 'nwse-resize',
            }}
          />
        )}
      </div>
    );
  }

  // 2. Stamp Overlay
  if (el.type === 'stamp') {
    return (
      <div
        key={el.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
          setDragState({
            id: el.id,
            mode: 'move',
            startX: e.clientX,
            startY: e.clientY,
            initX: el.x,
            initY: el.y,
            initW: el.width,
            initH: el.height,
          });
        }}
        style={{
          position: 'absolute',
          left: `${el.x * 100}%`,
          top: `${el.y * 100}%`,
          width: `${el.width * 100}%`,
          height: `${el.height * 100}%`,
          border: `2.5px solid ${el.color}`,
          borderRadius: '4px',
          color: el.color,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          // Half the box height, or narrower if the word would overflow; same rule as the saved PDF.
          fontSize: `min(${el.height * (pagePt.height / pagePt.width) * 50}cqw, ${(el.width * 100) / Math.max(1, (el.text || '').length * 0.72)}cqw)`,
          letterSpacing: '1px',
          whiteSpace: 'nowrap',
          overflow: 'visible',
          cursor: 'move',
          boxShadow: isSelected ? '0 0 0 2px var(--primary)' : '0 2px 8px rgba(0,0,0,0.1)',
          pointerEvents: 'auto',
        }}
      >
        {el.text}
        {isSelected && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(el.id);
              }}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                setDragState({
                  id: el.id,
                  mode: 'resize',
                  startX: e.clientX,
                  startY: e.clientY,
                  initX: el.x,
                  initY: el.y,
                  initW: el.width,
                  initH: el.height,
                });
              }}
              title="Drag to resize"
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--primary)',
                borderRadius: '2px',
                cursor: 'nwse-resize',
              }}
            />
          </>
        )}
      </div>
    );
  }

  // 3. Image Overlay
  if (el.type === 'image') {
    return (
      <div
        key={el.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
          setDragState({
            id: el.id,
            mode: 'move',
            startX: e.clientX,
            startY: e.clientY,
            initX: el.x,
            initY: el.y,
            initW: el.width,
            initH: el.height,
          });
        }}
        style={{
          position: 'absolute',
          left: `${el.x * 100}%`,
          top: `${el.y * 100}%`,
          width: `${el.width * 100}%`,
          height: `${el.height * 100}%`,
          border: isSelected ? '2px solid var(--primary)' : '1px dashed transparent',
          cursor: 'move',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
        }}
      >
        <img
          src={el.dataUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
        {isSelected && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(el.id);
              }}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                setDragState({
                  id: el.id,
                  mode: 'resize',
                  startX: e.clientX,
                  startY: e.clientY,
                  initX: el.x,
                  initY: el.y,
                  initW: el.width,
                  initH: el.height,
                });
              }}
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--primary)',
                borderRadius: '2px',
                cursor: 'nwse-resize',
              }}
            />
          </>
        )}
      </div>
    );
  }

  // 4. Erase / Highlight / Shapes Overlay
  if (el.type === 'erase' || el.type === 'highlight' || el.type === 'shape-rect' || el.type === 'shape-line') {
    // Each side is set on its own: mixing `border` with `borderTop` makes React warn and can mis-style on re-render.
    const side = el.type === 'shape-rect' ? `2px solid ${el.color}` : el.type === 'shape-line' ? 'none' : isSelected ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.1)';
    return (
      <div
        key={el.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
          setDragState({
            id: el.id,
            mode: 'move',
            startX: e.clientX,
            startY: e.clientY,
            initX: el.x,
            initY: el.y,
            initW: el.width,
            initH: el.height,
          });
        }}
        style={{
          position: 'absolute',
          left: `${el.x * 100}%`,
          top: `${el.y * 100}%`,
          width: `${el.width * 100}%`,
          height: `${el.height * 100}%`,
          backgroundColor: el.type === 'erase' ? '#ffffff' : el.type === 'highlight' ? el.color : 'transparent',
          opacity: el.type === 'highlight' ? el.opacity : 1,
          borderTop: el.type === 'shape-line' ? `3px solid ${el.color}` : side,
          borderRight: side,
          borderBottom: side,
          borderLeft: side,
          cursor: 'move',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
        }}
      >
        {isSelected && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(el.id);
              }}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                setDragState({
                  id: el.id,
                  mode: 'resize',
                  startX: e.clientX,
                  startY: e.clientY,
                  initX: el.x,
                  initY: el.y,
                  initW: el.width,
                  initH: el.height,
                });
              }}
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--primary)',
                borderRadius: '2px',
                cursor: 'nwse-resize',
              }}
            />
          </>
        )}
      </div>
    );
  }

  return null;
}
