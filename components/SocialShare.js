'use client';

import { useState } from 'react';
import { ToolIcon } from './Icons';

export default function SocialShare({ title, url }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || 'https://pdfsection.com';
  const shareTitle = title || 'PDF Section — Private Local PDF Tools';

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="social-share-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: 'var(--space-md) 0' }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink-subtle)', marginRight: '4px' }}>
        Share article:
      </span>

      {/* Twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '12.5px',
          fontWeight: '600',
          color: 'var(--ink)',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--hairline-strong)',
          borderRadius: 'var(--rounded-full)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast) var(--ease-default)'
        }}
      >
        𝕏 Post
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '12.5px',
          fontWeight: '600',
          color: '#0a66c2',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--hairline-strong)',
          borderRadius: 'var(--rounded-full)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast) var(--ease-default)'
        }}
      >
        LinkedIn
      </a>

      {/* Reddit */}
      <a
        href={`https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '12.5px',
          fontWeight: '600',
          color: '#ff4500',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--hairline-strong)',
          borderRadius: 'var(--rounded-full)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast) var(--ease-default)'
        }}
      >
        Reddit
      </a>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopy}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '12.5px',
          fontWeight: '600',
          color: copied ? '#10b981' : 'var(--ink-muted)',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--hairline-strong)',
          borderRadius: 'var(--rounded-full)',
          cursor: 'pointer',
          transition: 'all var(--duration-fast) var(--ease-default)'
        }}
      >
        <ToolIcon name="link" size={13} />
        <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
      </button>
    </div>
  );
}
