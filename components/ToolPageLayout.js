'use client';

import { ToolIcon } from './Icons';

export default function ToolPageLayout({
  title,
  description,
  icon,
  iconColor,
  children,
}) {
  return (
    <main className="main">
      <div className="container">
        <div className="tool-page page-enter">
          {/* Tool page header */}
          <div className="tool-page-header">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-lg)',
              }}
            >
              <div
                className="tool-card-icon"
                style={{
                  width: 56,
                  height: 56,
                  fontSize: 28,
                  backgroundColor: `color-mix(in srgb, ${iconColor || 'var(--primary)'} 15%, var(--surface-2))`,
                  color: iconColor || 'var(--primary)',
                  borderRadius: 'var(--rounded-lg)',
                }}
              >
                <ToolIcon name={icon || 'pdf'} size={28} />
              </div>
            </div>
            <h1 className="tool-page-title">{title}</h1>
            <p className="tool-page-description">{description}</p>
          </div>

          {/* Tool page body */}
          <div className="tool-page-body">{children}</div>
        </div>
      </div>
    </main>
  );
}
