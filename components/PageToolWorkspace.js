'use client';

import { ToolIcon } from './Icons';

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
}) {
  return (
    <div className="page-editor-workspace">
      <section className="page-preview-panel" aria-label="PDF page previews">
        {preview}
      </section>

      <aside className="page-controls-panel" aria-label={ariaLabel || `${title} settings`}>
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
    </div>
  );
}
