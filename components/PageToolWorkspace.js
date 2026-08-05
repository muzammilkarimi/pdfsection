'use client';

import { useState } from 'react';
import { ToolIcon } from './Icons';

export default function PageToolWorkspace({
  title,
  description,
  icon,
  iconColor = 'var(--primary)',
  file,
  files,
  onReset,
  onAddMore,
  preview,
  children,
  footer,
  ariaLabel,
}) {
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const fileCount = files ? files.length : file ? 1 : 0;

  const toggleMobileSettings = () => setMobileSettingsOpen((prev) => !prev);

  return (
    <div className={`page-editor-workspace ${mobileSettingsOpen ? 'mobile-settings-expanded' : ''}`}>
      {/* Sticky Top-Right Quick Action FABs on Mobile (Settings Icon & Add File) */}
      <div className="mobile-floating-top-actions">
        {onAddMore && (
          <button
            type="button"
            className="mobile-fab-btn mobile-fab-add"
            onClick={onAddMore}
            aria-label="Add more files"
            title="Add more files"
          >
            {fileCount > 0 && <span className="mobile-fab-badge">{fileCount}</span>}
            <ToolIcon name="plus" size={20} />
          </button>
        )}

        <button
          type="button"
          className={`mobile-fab-btn mobile-fab-settings ${mobileSettingsOpen ? 'active' : ''}`}
          onClick={toggleMobileSettings}
          aria-label={mobileSettingsOpen ? 'Close settings' : 'Open settings'}
          title="Settings"
        >
          <ToolIcon name={mobileSettingsOpen ? 'x' : 'settings'} size={20} />
        </button>
      </div>

      {/* Main Preview / Canvas Area */}
      <section className="page-preview-panel" aria-label="PDF page previews">
        {preview}
      </section>

      {/* Settings Panel Backdrop for Mobile Drawer */}
      {mobileSettingsOpen && (
        <div
          className="mobile-settings-backdrop"
          onClick={() => setMobileSettingsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Controls & Settings Side Panel (Desktop Sidebar / Mobile Drawer) */}
      <aside className={`page-controls-panel ${mobileSettingsOpen ? 'open' : ''}`} aria-label={ariaLabel || `${title} settings`}>
        <div className="page-controls-header">
          <div
            className="tool-page-icon"
            style={{
              backgroundColor: `color-mix(in srgb, ${iconColor} 14%, var(--surface-2))`,
              color: iconColor,
            }}
          >
            <ToolIcon name={icon || 'pdf'} size={22} />
          </div>
          <div className="tool-page-heading">
            <h1 className="tool-page-title">{title}</h1>
            <p className="tool-page-description">{description}</p>
          </div>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileSettingsOpen(false)}
            aria-label="Close settings drawer"
          >
            <ToolIcon name="x" size={18} />
          </button>
        </div>

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

        {footer && <div className="page-controls-footer">{footer}</div>}
      </aside>

      {/* Clean Floating Primary Action Button on Mobile */}
      {footer && (
        <div className="mobile-floating-action-container">
          <div className="mobile-floating-action-wrapper">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}


