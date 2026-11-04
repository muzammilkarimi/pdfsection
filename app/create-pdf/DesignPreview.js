'use client';

import { useEffect, useRef, useState } from 'react';
import { PageView } from './DesignRenderer';
import DesignIcon from './DesignIcons';

export default function DesignPreview({ design, startIndex, onClose }) {
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
