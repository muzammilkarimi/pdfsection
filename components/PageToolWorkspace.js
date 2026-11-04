'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToolIcon } from './Icons';
import { getToolByRoute } from '@/lib/tools';

export default function PageToolWorkspace({
  title,
  description,
  icon,
  iconColor = 'var(--primary)',
  file,
  onReset,
  preview,
  children,
  footer,
  ariaLabel,
  // Shown under the main action. Turn off for tools that send anything over the network.
  privacyNote = true,
  // Off when the page shows its own heading above the workspace.
  showHeading = true,
}) {
  const tool = getToolByRoute(usePathname());

  return (
    <div className="page-editor-workspace">
      {/* Phones: back arrow and centred title in place of the site header */}
      {showHeading && (
        <div className="ws-mobile-bar">
          <Link href="/tools" aria-label="Back to all tools" className="ws-mobile-back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <span className="ws-mobile-title">{title}</span>
          <span className="ws-mobile-spacer" />
        </div>
      )}

      {/* Main Preview / Canvas Area */}
      <section className="page-preview-panel" aria-label="PDF page previews">
        {preview}
      </section>

      {/* Controls: a side panel on desktop, in the page flow on phones */}
      <aside className="page-controls-panel" aria-label={ariaLabel || `${title} settings`}>
        {showHeading && (
          <div className="page-controls-header">
            <div className="page-controls-heading">
              <nav className="tool-breadcrumb" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/tools">{tool?.categoryLabel || 'All tools'}</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{tool?.name || title}</span>
              </nav>
              <div className="page-controls-title-row">
                <div
                  className="tool-page-icon"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${iconColor} 14%, var(--surface-2))`,
                    color: iconColor,
                  }}
                >
                  <ToolIcon name={icon || 'pdf'} size={22} />
                </div>
                <h1 className="tool-page-title">{title}</h1>
              </div>
              <p className="tool-page-description">{description}</p>
            </div>
          </div>
        )}

        <div className="page-controls-body">
          {file && (
            <div className="page-file-card">
              <div className="page-file-icon">
                <ToolIcon name="pdf" size={18} />
              </div>
              <div className="page-file-meta">
                <strong>{file.name}</strong>
                <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              {onReset && (
                <button className="file-item-remove" onClick={onReset} aria-label={`Remove ${file.name}`}>
                  <ToolIcon name="x" size={14} />
                </button>
              )}
            </div>
          )}
          {children}
        </div>

        {footer && (
          <div className="page-controls-footer">
            {footer}
            {privacyNote && (
              <p className="ws-privacy">
                <ToolIcon name="lock" size={13} />
                Processed in your browser. Nothing is uploaded.
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
