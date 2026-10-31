'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ToolIcon } from '@/components/Icons';
import { downloadBlob } from '@/lib/pdfUtils';
import { loadResult, clearResult } from '@/lib/resultStore';

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [state, setState] = useState('loading'); // loading | ready | empty
  const [result, setResult] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadResult(slug).then((found) => {
      if (cancelled) return;
      setResult(found);
      setState(found ? 'ready' : 'empty');
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadBlob(result.blob, result.filename, result.mime);
    setDownloaded(true);
  }, [result]);

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

        {state === 'ready' && result && (
          <>
            <SuccessBadge />
            <h1 className="dl-title">{tool.name} successful!</h1>
            <p className="dl-sub">
              <strong>{result.filename}</strong> is ready · {formatSize(result.blob.size)}
              {result.meta?.summary ? ` · ${result.meta.summary}` : ''}
            </p>

            <button
              type="button"
              className={`btn btn-primary btn-lg dl-btn dl-download${downloaded ? ' is-done' : ''}`}
              onClick={handleDownload}
              id="download-result-button"
            >
              <ToolIcon name={downloaded ? 'check' : 'download'} size={20} />
              {downloaded ? 'Downloaded — save again' : 'Download file'}
            </button>

            <Link href={tool.route} className="dl-link" onClick={clearResult}>
              Start over with {tool.name}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
