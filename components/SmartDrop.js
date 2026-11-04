'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ToolIcon } from './Icons';
import { analyzeFiles, formatBytes } from '@/lib/fileInsights';
import { setIncomingFiles, takeIncomingFiles } from '@/lib/incomingFiles';
import { generateThumbnail } from '@/lib/renderUtils';
import { LIVE_TOOLS } from '@/lib/tools';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
const OTHER_PDF_TOOL_IDS = ['edit', 'sign', 'merge', 'split', 'protect', 'page-numbers', 'watermark', 'pdf-to-jpg', 'summarizer'];

function hasFiles(event) {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}

/**
 * State for the home page drop flow: checking files, the suggestions, and a page-wide
 * drag target so a file can be dropped anywhere on the page.
 */
export function useSmartDrop() {
  const router = useRouter();
  const inputRef = useRef(null);
  const runId = useRef(0);
  const [state, setState] = useState({ status: 'idle' });
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(async (list) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    const id = ++runId.current;
    setState({ status: 'checking', files });
    try {
      const result = await analyzeFiles(files);
      if (id !== runId.current) return;
      setState({ status: 'ready', ...result });
      if (result.kind === 'pdf' && result.files.length === 1 && !result.locked) {
        generateThumbnail(result.files[0], 1, 260)
          .then((thumbnail) => {
            if (id === runId.current) setState((prev) => ({ ...prev, thumbnail }));
          })
          .catch(() => {});
      }
    } catch {
      if (id === runId.current) setState({ status: 'error', files });
    }
  }, []);

  // A file sent here from the Files page ("Use in a tool") is checked straight away.
  useEffect(() => {
    const incoming = takeIncomingFiles();
    if (incoming.length) queueMicrotask(() => handleFiles(incoming));
  }, [handleFiles]);

  const reset = useCallback(() => {
    runId.current += 1;
    setState({ status: 'idle' });
  }, []);

  const choose = useCallback(() => inputRef.current?.click(), []);

  const openTool = useCallback(
    (tool, files) => {
      setIncomingFiles(files);
      router.push(tool.route);
    },
    [router]
  );

  useEffect(() => {
    let depth = 0;
    const onEnter = (e) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setDragging(true);
    };
    const onLeave = (e) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onOver = (e) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDrop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    };
    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('dragover', onOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleFiles]);

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      multiple
      hidden
      onChange={(e) => {
        handleFiles(e.target.files);
        e.target.value = '';
      }}
    />
  );

  return { state, dragging, handleFiles, reset, choose, openTool, input };
}

export function DropCard({ drop }) {
  const checking = drop.state.status === 'checking';
  return (
    <div className="smart-drop-card">
      <div className="smart-drop-zone">
        <span className="smart-drop-icon" aria-hidden="true">
          <ToolIcon name="upload" size={28} />
        </span>
        <span className="smart-drop-title">{checking ? 'Checking your file…' : 'Drop PDFs or documents here'}</span>
        <span className="smart-drop-hint">PDF, Word, Excel, PowerPoint, JPG, PNG</span>
        <button type="button" className="btn btn-primary smart-drop-button" onClick={drop.choose} disabled={checking}>
          Choose files
        </button>
        <span className="smart-drop-hint">We&apos;ll suggest the right tool for your file</span>
      </div>
      {drop.input}
    </div>
  );
}

/** Phones: nothing to drag from, so files, photos and the camera are one tap each. */
export function OpenFileCard({ drop }) {
  const photoRef = useRef(null);
  const checking = drop.state.status === 'checking';
  return (
    <div className="open-file-card">
      <div className="open-file-head">
        <span className="open-file-icon" aria-hidden="true"><ToolIcon name="upload" size={22} /></span>
        <span className="open-file-text">
          <strong>{checking ? 'Checking your file…' : 'Open a file'}</strong>
          <span>PDF, Word, Excel, images</span>
        </span>
      </div>
      <div className="open-file-actions">
        <button type="button" className="open-file-primary" onClick={drop.choose} disabled={checking}>Files</button>
        <button type="button" onClick={() => photoRef.current?.click()} disabled={checking}>Photos</button>
        <Link href="/scan-to-pdf">Scan</Link>
      </div>
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          drop.handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function DropOverlay({ dragging }) {
  if (!dragging) return null;
  return (
    <div className="smart-drop-overlay" aria-hidden="true">
      <div className="smart-drop-overlay-card">
        <span className="smart-drop-icon">
          <ToolIcon name="upload" size={30} />
        </span>
        <strong>Drop to open</strong>
        <span>We&apos;ll look at your file and suggest the right tools.</span>
        <span className="smart-drop-privacy">
          <ToolIcon name="lock" size={13} />
          Checked in your browser — the file is never uploaded
        </span>
      </div>
    </div>
  );
}

const FACT_ICONS = { warn: 'zap', ok: 'check', info: 'search', neutral: 'pdf' };

export function DropResults({ drop }) {
  const { state } = drop;
  const resultsRef = useRef(null);

  useEffect(() => {
    if (state.status === 'ready' || state.status === 'error') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.status]);

  if (state.status !== 'ready' && state.status !== 'error') return null;

  const title = state.files.length === 1 ? state.files[0].name : `${state.files.length} files`;
  const otherTools = state.kind === 'pdf'
    ? OTHER_PDF_TOOL_IDS
        .filter((id) => !state.picks.some((p) => p.tool.id === id))
        .map((id) => LIVE_TOOLS.find((t) => t.id === id))
        .filter(Boolean)
    : [];

  return (
    <section ref={resultsRef} className="smart-results container" aria-label="Suggested tools for your file">
      <aside className="smart-results-file">
        {state.thumbnail && (
          <div className="smart-results-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.thumbnail} alt={`First page of ${title}`} />
          </div>
        )}
        <div className="smart-results-name">
          <strong>{title}</strong>
          {state.files.length > 1 && <span>{formatBytes(state.totalBytes)}</span>}
        </div>
        {state.status === 'ready' && state.facts.length > 0 && (
          <div className="smart-results-facts">
            <span className="smart-eyebrow">What we noticed</span>
            {state.facts.map((fact) => (
              <span key={fact.text} className={`smart-fact smart-fact-${fact.tone}`}>
                <span className="smart-fact-icon"><ToolIcon name={FACT_ICONS[fact.tone]} size={13} /></span>
                {fact.text}
              </span>
            ))}
          </div>
        )}
        <div className="smart-results-actions">
          <button type="button" className="btn btn-secondary" onClick={drop.choose}>Change files</button>
          <button type="button" className="btn btn-secondary" onClick={drop.reset}>Clear</button>
        </div>
        <span className="smart-drop-privacy">
          <ToolIcon name="lock" size={13} />
          Checked in your browser. Not uploaded.
        </span>
      </aside>

      <div className="smart-results-main">
        {state.status === 'error' ? (
          <>
            <h2 className="smart-results-title">We couldn&apos;t read this file</h2>
            <p className="smart-results-sub">It may be damaged. Try Repair PDF, or pick a tool yourself.</p>
            <div className="smart-chip-row">
              <Link href="/repair-pdf" className="smart-chip">Repair PDF</Link>
              <Link href="/tools" className="smart-chip smart-chip-link">All tools →</Link>
            </div>
          </>
        ) : state.picks.length === 0 ? (
          <>
            <h2 className="smart-results-title">We can&apos;t work with this file type yet</h2>
            <p className="smart-results-sub">PDF, Word, Excel, PowerPoint, JPG and PNG files work.</p>
          </>
        ) : (
          <>
            <h2 className="smart-results-title">Here&apos;s what we&apos;d do with {state.files.length === 1 ? 'it' : 'them'}</h2>
            <p className="smart-results-sub">Picked from what&apos;s inside your file{state.files.length === 1 ? '' : 's'}.</p>
            <ol className="smart-picks">
              {state.picks.map((p, index) => (
                <li key={p.tool.id} className={`smart-pick ${index === 0 ? 'smart-pick-best' : ''}`}>
                  <span
                    className="smart-pick-icon"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${p.tool.categoryColor} 14%, var(--surface-2))`,
                      color: p.tool.categoryColor,
                    }}
                  >
                    <ToolIcon name={p.tool.icon} size={22} />
                  </span>
                  <span className="smart-pick-text">
                    <span className="smart-pick-name">
                      {p.tool.name}
                      {index === 0 && <span className="smart-best-badge">Best match</span>}
                    </span>
                    <span className="smart-pick-reason">{p.reason}</span>
                  </span>
                  <button
                    type="button"
                    className={`btn ${index === 0 ? 'btn-primary' : 'btn-secondary'} smart-pick-open`}
                    onClick={() => drop.openTool(p.tool, p.files)}
                  >
                    Open
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}

        {state.unsupported?.length > 0 && state.picks.length > 0 && (
          <p className="smart-results-note">
            Skipped {state.unsupported.map((f) => f.name).join(', ')} — that file type isn&apos;t supported.
          </p>
        )}

        {otherTools.length > 0 && (
          <div className="smart-others">
            <h3>Other things you can do with a PDF</h3>
            <div className="smart-chip-row">
              {otherTools.map((tool) => (
                <button key={tool.id} type="button" className="smart-chip" onClick={() => drop.openTool(tool, state.files)}>
                  {tool.name}
                </button>
              ))}
              <Link href="/tools" className="smart-chip smart-chip-link">All {LIVE_TOOLS.length} tools →</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
