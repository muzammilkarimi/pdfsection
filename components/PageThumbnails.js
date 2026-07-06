'use client';

import { useState, useEffect } from 'react';
import { generateAllThumbnails } from '@/lib/renderUtils';

export default function PageThumbnails({
  file,
  selectedPages = [],
  onPageToggle,
  onPageClick,
  selectable = true,
  showPageNumbers = true,
  maxWidth = 150,
  className = '',
}) {
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) {
      return;
    }

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setProgress(0);
        setThumbnails([]);
      }
    });

    generateAllThumbnails(file, maxWidth, (current, total) => {
      if (!cancelled) setProgress(Math.round((current / total) * 100));
    }).then((thumbs) => {
      if (!cancelled) {
        setThumbnails(thumbs);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [file, maxWidth]);

  if (!file) return null;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <div className="progress-track" style={{ maxWidth: 300, margin: '0 auto var(--space-md)' }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="body-sm ink-subtle">Loading pages... {progress}%</p>
      </div>
    );
  }

  if (thumbnails.length === 0) return null;

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${maxWidth - 20}px, 1fr))`,
        gap: 'var(--space-md)',
        padding: 'var(--space-md) 0',
      }}
    >
      {thumbnails.map((thumb) => {
        const isSelected = selectedPages.includes(thumb.pageNumber - 1);
        return (
          <div
            key={thumb.pageNumber}
            onClick={() => {
              if (selectable && onPageToggle) onPageToggle(thumb.pageNumber - 1);
              if (onPageClick) onPageClick(thumb.pageNumber - 1);
            }}
            style={{
              cursor: selectable ? 'pointer' : 'default',
              borderRadius: 'var(--rounded-lg)',
              border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--hairline)'}`,
              backgroundColor: isSelected ? 'rgba(94,106,210,0.08)' : 'var(--surface-1)',
              padding: 'var(--space-sm)',
              transition: 'all var(--duration-fast) var(--ease-default)',
              position: 'relative',
            }}
          >
            {/* Selection indicator */}
            {selectable && isSelected && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 22,
                  height: 22,
                  borderRadius: 'var(--rounded-full)',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  zIndex: 1,
                }}
              >
                ✓
              </div>
            )}

            {/* Thumbnail image */}
            {/* eslint-disable-next-line @next/next/no-img-element -- PDF thumbnails are generated as client-side data URLs. */}
            <img
              src={thumb.dataUrl}
              alt={`Page ${thumb.pageNumber}`}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 'var(--rounded-sm)',
                display: 'block',
              }}
              draggable={false}
            />

            {/* Page number */}
            {showPageNumbers && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: 'var(--space-xs)',
                  fontSize: 12,
                  color: isSelected ? 'var(--primary)' : 'var(--ink-subtle)',
                  fontWeight: isSelected ? 500 : 400,
                }}
              >
                Page {thumb.pageNumber}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
