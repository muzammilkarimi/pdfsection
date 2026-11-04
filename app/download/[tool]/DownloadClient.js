'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ToolIcon } from '@/components/Icons';
import { downloadBlob } from '@/lib/pdfUtils';
import { loadResult, clearResult } from '@/lib/resultStore';
import { setIncomingFiles } from '@/lib/incomingFiles';
import { generateThumbnail } from '@/lib/renderUtils';
import { LIVE_TOOLS } from '@/lib/tools';

// Tools that can take a finished PDF straight away, in the order they're offered.
const NEXT_PDF_TOOL_IDS = ['compress', 'sign', 'protect', 'page-numbers', 'watermark', 'merge'];
const MAX_NEXT_TOOLS = 4;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileLabel(result) {
  const ext = result.filename.split('.').pop();
  return ext ? ext.toUpperCase() : 'FILE';
}

function SuccessBadge() {
  return (
    <div className="dl-badge" aria-hidden="true">
      <svg className="dl-check" viewBox="0 0 64 64">
        <circle className="dl-check-circle" cx="32" cy="32" r="29" />
        <path className="dl-check-mark" d="M19 33.5 28 42.5 45.5 23" />
      </svg>
    </div>
  );
}

export default function DownloadClient({ slug, tool }) {
  const router = useRouter();
  const [state, setState] = useState('loading'); // loading | ready | empty
  const [result, setResult] = useState(null);
  const [thumbnail, setThumbnail] = useState('');
  const [canShare, setCanShare] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadResult(slug).then(async (found) => {
      if (cancelled) return;
      setResult(found);
      setState(found ? 'ready' : 'empty');
      if (!found) return;

      const file = new File([found.blob], found.filename, { type: found.mime });
      setCanShare(typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }));

      if (found.mime === 'application/pdf') {
        try {
          const preview = await generateThumbnail(await found.blob.arrayBuffer(), 1, 260);
          if (!cancelled) setThumbnail(preview);
        } catch {
          // No preview: the file icon is shown instead.
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isPdf = result?.mime === 'application/pdf';

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadBlob(result.blob, result.filename, result.mime);
    setDownloaded(true);
  }, [result]);

  const handlePreview = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    window.open(url, '_blank', 'noopener');
    // Give the new tab time to load the file before the link is released.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [result]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    const file = new File([result.blob], result.filename, { type: result.mime });
    try {
      await navigator.share({ files: [file], title: result.filename });
    } catch {
      // Cancelled by the user.
    }
  }, [result]);

  const continueWith = useCallback(
    (nextTool) => {
      setIncomingFiles([new File([result.blob], result.filename, { type: result.mime })]);
      router.push(nextTool.route);
    },
    [result, router]
  );

  const nextTools = isPdf
    ? NEXT_PDF_TOOL_IDS
        .filter((id) => id !== tool.id)
        .map((id) => LIVE_TOOLS.find((t) => t.id === id))
        .filter(Boolean)
        .slice(0, MAX_NEXT_TOOLS)
    : [];

  if (state !== 'ready' || !result) {
    return (
      <main className="main download-page">
        <div className="dl-hero">
          {state === 'loading' && (
            <div className="dl-center" role="status">
              <span className="dl-spinner" aria-hidden="true" />
              <p className="dl-sub">Preparing your file…</p>
            </div>
          )}

          {state === 'empty' && (
            <div className="dl-center">
              <h1 className="dl-title">No file to download</h1>
              <p className="dl-sub">
                This download has expired or was opened directly. Files only live in your browser, so you&apos;ll need to run {tool.name} again.
              </p>
              <Link href={tool.route} className="btn btn-primary btn-lg dl-btn">Go to {tool.name}</Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="main download-page">
      <div className="dl-result container">
        <div className="dl-mobile-bar">
          <Link href="/" aria-label="Close" className="dl-mobile-close">
            <ToolIcon name="x" size={22} />
          </Link>
          <Link href={tool.route} onClick={clearResult}>Start over</Link>
        </div>
        <section className="dl-card" aria-labelledby="dl-title">
          <div className="dl-preview">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated client-side as a data URL
              <img src={thumbnail} alt={`First page of ${result.filename}`} />
            ) : (
              <span className="dl-file-icon">
                <ToolIcon name="pdf" size={34} />
                {fileLabel(result)}
              </span>
            )}
          </div>

          <div className="dl-details">
            <SuccessBadge />
            <h1 className="dl-title" id="dl-title">{isPdf ? 'Your PDF is ready' : 'Your file is ready'}</h1>
            <p className="dl-sub">
              <strong>{result.filename}</strong>
              <br />
              {formatSize(result.blob.size)}
              {result.meta?.summary ? ` · ${result.meta.summary}` : ''}
            </p>

            <div className="dl-actions">
              <button
                type="button"
                className={`btn btn-primary btn-lg dl-download${downloaded ? ' is-done' : ''}`}
                onClick={handleDownload}
                id="download-result-button"
              >
                <ToolIcon name={downloaded ? 'check' : 'download'} size={18} />
                {downloaded ? 'Downloaded — save again' : 'Download'}
              </button>
              {isPdf && (
                <button type="button" className="btn btn-secondary btn-lg" onClick={handlePreview}>
                  Preview
                </button>
              )}
              {canShare && (
                <button type="button" className="btn btn-secondary btn-lg" onClick={handleShare}>
                  Share
                </button>
              )}
            </div>

            <p className="dl-privacy">
              <ToolIcon name="lock" size={13} />
              Made in your browser. This file is kept only on this device.
            </p>
            <Link href={tool.route} className="dl-link" onClick={clearResult}>
              Start over with {tool.name}
            </Link>
          </div>
        </section>

        {nextTools.length > 0 && (
          <section className="dl-next" aria-labelledby="dl-next-title">
            <h2 id="dl-next-title">Keep working on this file</h2>
            <div className="dl-next-grid">
              {nextTools.map((next) => (
                <button key={next.id} type="button" className="dl-next-item" onClick={() => continueWith(next)}>
                  <span
                    className="dl-next-icon"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${next.categoryColor} 14%, var(--surface-2))`,
                      color: next.categoryColor,
                    }}
                  >
                    <ToolIcon name={next.icon} size={20} />
                  </span>
                  <span className="dl-next-text">
                    <strong>{next.name}</strong>
                    <span>{next.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
