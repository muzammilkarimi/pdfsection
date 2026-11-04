'use client';

import { useState } from 'react';
import { clonePage, createPage } from '@/lib/designModel';
import { PageView } from './DesignRenderer';
import DesignIcon from './DesignIcons';

/** Page thumbnails, with adding, duplicating, deleting and reordering pages. */
export default function DesignPageStrip({ design, pageIdx, update, setPageIdx, setSelectedId, onGoToPage }) {
  const [dragPage, setDragPage] = useState(null);
  const { width: pageW, height: pageH } = design;

  const insertAfterCurrent = (newPage) => {
    update((d) => {
      const pages = [...d.pages];
      pages.splice(pageIdx + 1, 0, newPage);
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

  return (
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
            onClick={() => onGoToPage(i)}
            onDragStart={() => setDragPage(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropPage(i)}
          >
            <PageView design={design} page={p} scale={Math.min(52 / pageW, 72 / pageH)} />
            <span className="ds-strip-num">{i + 1}</span>
          </button>
        ))}
        <button type="button" className="ds-strip-add" onClick={() => insertAfterCurrent(createPage())}>
          <DesignIcon name="plus" size={18} /> Page
        </button>
      </div>
      <div className="ds-strip-actions">
        <button type="button" className="ds-text-btn" onClick={() => insertAfterCurrent(clonePage(design.pages[pageIdx]))}>Duplicate page</button>
        <button type="button" className="ds-text-btn ds-danger" disabled={design.pages.length < 2} onClick={deletePage}>Delete page</button>
      </div>
    </div>
  );
}
