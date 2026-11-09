'use client';

// Floating tool bar at the bottom of the Edit PDF page area. The main tools sit in the bar;
// "Insert" opens a panel with shapes, marks, date, image and stamps.

import { useEffect, useRef, useState } from 'react';

const P = {
  editText: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  text: <><path d="M5 6V4h14v2" /><path d="M12 4v16" /><path d="M9 20h6" /></>,
  sign: <><path d="M3 17c3-1 4-6 6-6s1 5 3 5 3-4 5-4 2 2 4 2" /><path d="M3 21h18" /></>,
  draw: <><path d="M4 20l1.5-5L16 4.5a2.1 2.1 0 0 1 3 3L8.5 18z" /><path d="M14 6.5l3 3" /></>,
  highlight: <><path d="M9 14l-4 4v2h6l2-2" /><path d="M8 13l7.5-8.5a2 2 0 0 1 3 0l1 1a2 2 0 0 1 0 3L11 16z" /></>,
  erase: <><path d="M7 20h13" /><path d="M5.5 14.5l8.6-8.6a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 18H8.5z" /></>,
  insert: <><circle cx="7" cy="7" r="3" /><rect x="14" y="4" width="6" height="6" rx="1" /><path d="M7 14l3.5 6h-7z" /><path d="M17 14v6M14 17h6" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>,
  rect: <rect x="4" y="5" width="16" height="14" rx="1.5" />,
  ellipse: <ellipse cx="12" cy="12" rx="8.5" ry="7" />,
  line: <path d="M5 19L19 5" />,
  arrow: <><path d="M5 19L19 5" /><path d="M10 5h9v9" /></>,
  check: <path d="M4 12.5l5.5 5.5L20 6" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  date: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  stamp: <><path d="M9 4h6l-1 7h-4z" /><path d="M5 14h14v3H5z" /><path d="M6 20h12" /></>,
  back: <path d="M15 18l-6-6 6-6" />,
  chevron: <path d="M6 15l6-6 6 6" />,
};

function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}

const MAIN = [
  { id: 'edit-text', label: 'Edit', icon: 'editText', hint: 'Click any line of the PDF to change it, or click an item to move it (E)' },
  { id: 'text', label: 'Add text', icon: 'text', hint: 'Click to add a text box (T)' },
  { id: 'sign', label: 'Sign', icon: 'sign', hint: 'Draw, type or upload your signature', action: true },
  { id: 'draw', label: 'Draw', icon: 'draw', hint: 'Draw freehand (D)' },
  { id: 'highlight', label: 'Highlight', icon: 'highlight', hint: 'Drag over text to highlight it (H)' },
  { id: 'erase', label: 'White-out', icon: 'erase', hint: 'Drag to cover something in the page colour (W)' },
];

export const INSERT_ITEMS = [
  { id: 'image', label: 'Image', icon: 'image', action: true },
  { id: 'shape-rect', label: 'Rectangle', icon: 'rect' },
  { id: 'shape-ellipse', label: 'Ellipse', icon: 'ellipse' },
  { id: 'shape-line', label: 'Line', icon: 'line' },
  { id: 'shape-arrow', label: 'Arrow', icon: 'arrow' },
  { id: 'place-check', label: 'Check', icon: 'check' },
  { id: 'place-cross', label: 'Cross', icon: 'cross' },
  { id: 'place-date', label: 'Date', icon: 'date' },
  { id: 'stamp', label: 'Stamp', icon: 'stamp', menu: true },
];
const INSERT_TOOLS = new Set(INSERT_ITEMS.filter((i) => !i.action && !i.menu).map((i) => i.id));

export default function EditToolbar({ activeTool, onTool, onImage, onSign, stamps, onStamp }) {
  const [open, setOpen] = useState(null); // null | 'insert' | 'stamps'
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const insertItem = INSERT_ITEMS.find((i) => i.id === activeTool);
  const insertActive = INSERT_TOOLS.has(activeTool);

  const pickInsert = (item) => {
    if (item.menu) {
      setOpen('stamps');
      return;
    }
    setOpen(null);
    if (item.id === 'image') onImage();
    else onTool(item.id);
  };

  return (
    <div className="edit-toolbar" ref={rootRef}>
      {open && (
        <div className="edit-toolbar-panel" role="menu" aria-label={open === 'stamps' ? 'Stamps' : 'Insert'}>
          {open === 'insert' ? (
            <div className="edit-toolbar-grid">
              {INSERT_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  className="edit-toolbar-item"
                  aria-checked={activeTool === item.id}
                  onClick={() => pickInsert(item)}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="edit-toolbar-stamps">
              <button type="button" className="edit-toolbar-back" onClick={() => setOpen('insert')}>
                <Icon name="back" size={16} /> Stamps
              </button>
              <div className="edit-toolbar-stamp-list">
                {stamps.map((stamp) => (
                  <button
                    key={stamp.label}
                    type="button"
                    role="menuitem"
                    style={{ color: stamp.color, borderColor: stamp.color }}
                    onClick={() => {
                      setOpen(null);
                      onStamp(stamp);
                    }}
                  >
                    {stamp.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="edit-toolbar-bar" role="toolbar" aria-label="Edit tools">
        {MAIN.map((t) => (
          <button
            key={t.id}
            type="button"
            className="edit-toolbar-item"
            aria-pressed={!t.action && activeTool === t.id}
            title={t.hint}
            onClick={() => {
              setOpen(null);
              if (t.id === 'sign') onSign();
              else onTool(t.id);
            }}
          >
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
        <span className="edit-toolbar-sep" aria-hidden="true" />
        <button
          type="button"
          className="edit-toolbar-item"
          aria-pressed={insertActive}
          aria-expanded={!!open}
          aria-haspopup="menu"
          title="Shapes, marks, date, image and stamps"
          onClick={() => setOpen(open ? null : 'insert')}
        >
          <Icon name={insertActive && insertItem ? insertItem.icon : 'insert'} />
          <span>{insertActive && insertItem ? insertItem.label : 'Insert'}</span>
        </button>
      </div>
    </div>
  );
}
