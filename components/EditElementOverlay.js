'use client';

import { elementBounds, handlePoint, RESIZE_HANDLES, CORNER_HANDLES, strokePath, arrowHead, MARK_PATHS, MARK_STROKE } from '@/lib/editModel';
import { DEFAULT_STROKE } from '@/lib/editPdfExport';
import EditRichText from '@/components/EditRichText';

// One added or edited element drawn over the PDF page. Positions are base-view page fractions and
// sizes in points are turned into `cqw` (the page is a size container), so what you see scales with
// zoom and matches the saved PDF.

const pct = (v) => `${v * 100}%`;

function Actions({ style, onDuplicate, onDelete, label, onMoveStart, onParagraph }) {
  return (
    <div className="edit-el-actions" style={style} onPointerDown={(e) => e.stopPropagation()}>
      {onParagraph && (
        <button type="button" onClick={onParagraph} aria-label="Edit the whole paragraph" title="Edit the whole paragraph (text reflows)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 4v16M17 4v16M19 4H9.5a4.5 4.5 0 0 0 0 9H13" /></svg>
        </button>
      )}
      {onMoveStart && (
        <button type="button" className="edit-el-grip" onPointerDown={onMoveStart} aria-label={`Move ${label}`} title="Drag to move">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" /></svg>
        </button>
      )}
      <button type="button" onClick={onDuplicate} aria-label={`Duplicate ${label}`} title="Duplicate (Ctrl+D)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
      </button>
      <button type="button" className="edit-el-delete" onClick={onDelete} aria-label={`Delete ${label}`} title="Delete (Del)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

const HANDLE_CURSOR = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };

function Handle({ x, y, mode, onStartDrag, el, cursor = 'nwse-resize', label = 'Resize', side = false }) {
  return (
    <div
      className={`edit-el-handle${side ? ' is-edge' : ''}`}
      role="presentation"
      title={label}
      style={{ left: pct(x), top: pct(y), cursor }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onStartDrag(e, el, mode);
      }}
    />
  );
}

function TextElement({ el, selected, ghost, pagePt, onStartDrag, onTextChange, onTextFocus, actions }) {
  return (
    <div
      className={`edit-el edit-el-text${selected ? ' is-selected' : ''}${el.oneLine ? ' is-one-line' : ''}${ghost ? ' is-ghost' : ''}`}
      style={{
        caretColor: el.color,
        left: pct(el.x),
        top: pct(el.y),
        // a one-line edit grows with its text; a paragraph wraps at its width
        width: el.oneLine ? 'max-content' : pct(el.width || 0.2),
        minWidth: el.oneLine ? pct(el.width || 0.02) : undefined,
        color: el.color,
        fontSize: `${((el.size || 16) / pagePt.width) * 100}cqw`,
        WebkitTextStroke: el.boost > 0 && !el.fontId ? `${(el.boost / pagePt.width) * 100}cqw ${el.color}` : undefined,
      }}
      onPointerDown={(e) => {
        // a selected box: clicks inside the text place the caret; the grip and the edge still drag
        if (selected && e.target.closest?.('.edit-el-rich')) {
          e.stopPropagation();
          return;
        }
        onStartDrag(e, el, 'move');
      }}
    >
      <EditRichText el={el} selected={selected} pagePt={pagePt} onChange={onTextChange} onFocus={onTextFocus} />
      {selected && (
        <>
          {/* corners scale the text; the sides set the width (the text then wraps) */}
          {['nw', 'ne', 'se', 'sw'].map((dir) => (
            <div
              key={dir}
              className={`edit-el-handle edit-el-handle-text at-${dir}`}
              role="presentation"
              title="Drag to make the text bigger or smaller"
              onPointerDown={(e) => {
                e.stopPropagation();
                onStartDrag(e, el, `resize-${dir}`);
              }}
            />
          ))}
          {['e', 'w'].map((dir) => (
            <div
              key={dir}
              className={`edit-el-handle edit-el-handle-side at-${dir}`}
              role="presentation"
              title="Drag to set the width (the text then wraps)"
              onPointerDown={(e) => {
                e.stopPropagation();
                onStartDrag(e, el, `resize-${dir}`);
              }}
            />
          ))}
        </>
      )}
      {actions}
    </div>
  );
}

export default function EditElementOverlay({
  el,
  selected,
  ghost = false,
  pagePt,
  onStartDrag,
  onTextChange,
  onTextFocus,
  onDuplicate,
  onDelete,
  onParagraph,
}) {
  const bounds = elementBounds(el);
  const isText = el.type === 'text';
  const actions = selected && (
    <Actions
      // text boxes can grow with their text, so their buttons sit inside the box's own frame
      style={isText ? { left: '100%', top: 0 } : { left: pct(bounds.x + bounds.width), top: pct(bounds.y) }}
      label={isText ? 'text' : 'item'}
      onDuplicate={() => onDuplicate(el.id)}
      onDelete={() => onDelete(el.id)}
      // a selected text box takes clicks for the caret, so it moves by this grip (or its edge)
      onMoveStart={isText ? (e) => onStartDrag(e, el, 'move') : undefined}
      onParagraph={isText && onParagraph ? () => onParagraph(el.id) : undefined}
    />
  );
  // resize from every corner and side (only the corners for things that keep their shape)
  const corner = selected && (
    <>
      {(el.aspect ? CORNER_HANDLES : RESIZE_HANDLES).map((dir) => {
        const at = handlePoint(bounds, dir);
        return (
          <Handle
            key={dir}
            el={el}
            mode={`resize-${dir}`}
            onStartDrag={onStartDrag}
            x={at.x}
            y={at.y}
            cursor={HANDLE_CURSOR[dir]}
            side={dir.length === 1}
          />
        );
      })}
    </>
  );
  const startMove = (e) => onStartDrag(e, el, 'move');

  if (el.type === 'text') {
    return (
      <>
        <TextElement el={el} selected={selected} ghost={ghost} pagePt={pagePt} onStartDrag={onStartDrag} onTextChange={onTextChange} onTextFocus={onTextFocus} actions={actions} />
      </>
    );
  }

  // Lines and freehand strokes: SVG in page points, so stroke widths match the PDF exactly.
  if (el.type === 'shape-line' || el.type === 'draw') {
    const sw = el.strokeWidth ?? DEFAULT_STROKE[el.type];
    let d;
    if (el.type === 'draw') {
      d = strokePath(el.points, pagePt.width, pagePt.height);
    } else {
      const p1 = [el.x1 * pagePt.width, el.y1 * pagePt.height];
      const p2 = [el.x2 * pagePt.width, el.y2 * pagePt.height];
      d = `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}`;
      if (el.arrow) {
        const [l, r] = arrowHead(p1[0], p1[1], p2[0], p2[1], sw);
        d += ` M${l[0]} ${l[1]} L${p2[0]} ${p2[1]} L${r[0]} ${r[1]}`;
      }
    }
    return (
      <>
        <svg className="edit-el-svg" viewBox={`0 0 ${pagePt.width} ${pagePt.height}`} preserveAspectRatio="none" aria-hidden="true">
          {selected && el.type === 'draw' && (
            <rect
              className="edit-el-bbox"
              x={bounds.x * pagePt.width - sw / 2}
              y={bounds.y * pagePt.height - sw / 2}
              width={bounds.width * pagePt.width + sw}
              height={bounds.height * pagePt.height + sw}
            />
          )}
          <path d={d} fill="none" stroke={el.color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          {/* wide invisible stroke that is easy to click */}
          <path className="edit-el-hit" d={d} fill="none" strokeWidth={Math.max(sw + 8, 12)} strokeLinecap="round" strokeLinejoin="round" onPointerDown={startMove} />
        </svg>
        {actions}
        {el.type === 'draw' && corner}
        {selected && el.type === 'shape-line' && (
          <>
            <Handle el={el} mode="p1" onStartDrag={onStartDrag} x={el.x1} y={el.y1} cursor="move" label="Drag to move this end" />
            <Handle el={el} mode="p2" onStartDrag={onStartDrag} x={el.x2} y={el.y2} cursor="move" label="Drag to move this end" />
          </>
        )}
      </>
    );
  }

  const box = { left: pct(el.x), top: pct(el.y), width: pct(el.width), height: pct(el.height) };
  let style;
  let content = null;
  if (el.type === 'stamp') {
    style = {
      ...box,
      border: `${(2.5 / pagePt.width) * 100}cqw solid ${el.color}`,
      color: el.color,
      // half the box height, or narrower if the word would overflow; same rule as the saved PDF
      fontSize: `min(${el.height * (pagePt.height / pagePt.width) * 50}cqw, ${(el.width * 100) / Math.max(1, (el.text || '').length * 0.72)}cqw)`,
    };
    content = el.text;
  } else if (el.type === 'image') {
    style = box;
    // eslint-disable-next-line @next/next/no-img-element -- user image made in the browser
    content = <img src={el.dataUrl} alt="" draggable={false} />;
  } else if (el.type === 'erase') {
    style = { ...box, backgroundColor: el.color || '#ffffff' };
  } else if (el.type === 'highlight') {
    style = { ...box, backgroundColor: el.color, opacity: el.opacity ?? 0.35 };
  } else if (el.type === 'shape-rect' || el.type === 'shape-ellipse') {
    style = { ...box, border: `${((el.strokeWidth ?? DEFAULT_STROKE[el.type]) / pagePt.width) * 100}cqw solid ${el.color}` };
  } else if (el.type === 'mark' && MARK_PATHS[el.symbol]) {
    style = box;
    content = (
      <svg viewBox="0 0 24 24" preserveAspectRatio="none" aria-hidden="true">
        <path d={MARK_PATHS[el.symbol]} fill="none" stroke={el.color} strokeWidth={MARK_STROKE} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else {
    return null;
  }

  return (
    <>
      <div
        className={`edit-el edit-el-${el.type}${selected ? ' is-selected' : ''}${el.linkedTo ? ' is-cover' : ''}${ghost ? ' is-ghost' : ''}`}
        style={style}
        onPointerDown={startMove}
      >
        {content}
      </div>
      {actions}
      {corner}
    </>
  );
}
