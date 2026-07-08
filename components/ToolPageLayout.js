'use client';

import { ToolIcon } from './Icons';

export default function ToolPageLayout({
  title,
  description,
  icon,
  iconColor,
  children,
  showHeader = true,
  layoutMode = 'page-scroll',
}) {
  return (
    <main className={`main tool-page-shell tool-layout-${layoutMode}`}>
      <div className="container">
        <div className="tool-page page-enter">
          {showHeader && (
            <div className="tool-page-header">
              <div
                className="tool-page-icon"
                style={{
                  backgroundColor: `color-mix(in srgb, ${iconColor || 'var(--primary)'} 14%, var(--surface-2))`,
                  color: iconColor || 'var(--primary)',
                }}
              >
                <ToolIcon name={icon || 'pdf'} size={22} />
              </div>
              <div className="tool-page-heading">
                <h1 className="tool-page-title">{title}</h1>
                <p className="tool-page-description">{description}</p>
              </div>
            </div>
          )}
          <div className="tool-page-body">{children}</div>
        </div>
      </div>
    </main>
  );
}
