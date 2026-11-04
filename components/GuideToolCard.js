'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ToolIcon } from './Icons';
import { setIncomingFiles } from '@/lib/incomingFiles';

const ACCEPT_BY_TOOL = {
  'jpg-to-pdf': 'image/jpeg,image/png,image/webp',
  'word-to-pdf': '.doc,.docx',
  'excel-to-pdf': '.xls,.xlsx',
  'powerpoint-to-pdf': '.ppt,.pptx',
};

// These tools pick files with their own controls, so a file can't be handed over to them.
const NO_HANDOFF = new Set(['scan-to-pdf', 'compare', 'html-to-pdf']);

/** Sidebar card on a guide: drop or choose a file and it opens the guide's tool with the file loaded. */
export default function GuideToolCard({ tool }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const open = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setIncomingFiles(files);
    router.push(tool.route);
  };

  const canHandOff = !NO_HANDOFF.has(tool.id);
  const accept = ACCEPT_BY_TOOL[tool.id] || '.pdf';
  const fileWord = accept === '.pdf' ? 'PDF' : 'file';

  return (
    <div className="guide-tool-card">
      <span
        className="guide-tool-icon"
        style={{
          backgroundColor: `color-mix(in srgb, ${tool.categoryColor} 14%, var(--surface-2))`,
          color: tool.categoryColor,
        }}
      >
        <ToolIcon name={tool.icon} size={22} />
      </span>
      <strong>Try it on your file</strong>
      {canHandOff ? (
        <>
          <span className="guide-tool-text">Drop a {fileWord} here. It opens {tool.name} with your file ready.</span>
          <div
            className={`guide-tool-drop ${dragOver ? 'is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              open(e.dataTransfer.files);
            }}
          >
            <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
              Choose {fileWord}
            </button>
            <span>Never uploaded</span>
            <input ref={inputRef} type="file" accept={accept} multiple hidden onChange={(e) => open(e.target.files)} />
          </div>
        </>
      ) : (
        <>
          <span className="guide-tool-text">Free, private and right in your browser.</span>
          <Link href={tool.route} className="btn btn-primary">Open {tool.name}</Link>
        </>
      )}
    </div>
  );
}
