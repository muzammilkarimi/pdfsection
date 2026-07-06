'use client';

import { useState, useMemo } from 'react';
import ToolCard from '@/components/ToolCard';
import { ToolIcon } from '@/components/Icons';
import { LIVE_TOOL_CATEGORIES, searchLiveTools, LIVE_TOOLS } from '@/lib/tools';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return null; // show categories
    return searchLiveTools(searchQuery);
  }, [searchQuery]);

  const toolCount = LIVE_TOOLS.length;

  return (
    <main className="main">
      {/* ── Hero Section ── */}
      <section className="hero" aria-label="Hero">
        <div className="container">
          <h1 className="hero-title">
            Every PDF tool<br />
            <span className="shimmer-text">you&apos;ll ever need</span>
          </h1>
          <p className="hero-subtitle">
            {toolCount}+ free tools to merge, split, compress, convert, edit, and secure
            your PDFs. 100% private — files never leave your browser.
          </p>
          <div className="hero-actions">
            <a href="#tools" className="btn btn-primary btn-lg">
              Explore All Tools
              <ToolIcon name="arrowRight" size={18} />
            </a>
            <a href="#tools" className="btn btn-secondary btn-lg">
              How It Works
            </a>
          </div>

          {/* Trust indicators */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-xl)',
              marginTop: 'var(--space-xxl)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: 'lock', text: '100% Private' },
              { icon: 'compress', text: 'No File Limits' },
              { icon: 'check', text: 'Free Forever' },
            ].map((item) => (
              <div
                key={item.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  color: 'var(--ink-subtle)',
                  fontSize: '14px',
                }}
              >
                <ToolIcon name={item.icon} size={16} />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search Bar ── */}
      <section id="tools" className="container" style={{ scrollMarginTop: 'var(--nav-height)' }}>
        <div className="search-wrapper">
          <span className="search-icon">
            <ToolIcon name="search" size={18} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search PDF tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search PDF tools"
            id="tool-search"
          />
        </div>

        {/* ── Search Results ── */}
        {filteredTools !== null ? (
          <div style={{ marginBottom: 'var(--space-section)' }}>
            <div
              className="category-header"
              style={{ marginBottom: 'var(--space-lg)' }}
            >
              <span className="category-label" style={{ color: 'var(--ink-muted)' }}>
                {filteredTools.length} result{filteredTools.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </span>
            </div>
            {filteredTools.length > 0 ? (
              <div className="tool-grid">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} categoryColor={tool.categoryColor} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-xxl)',
                  color: 'var(--ink-subtle)',
                }}
              >
                <ToolIcon name="search" size={48} className="ink-tertiary" />
                <p style={{ marginTop: 'var(--space-md)', fontSize: '16px' }}>
                  No tools found. Try a different search term.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── Tool Categories Grid ── */
          LIVE_TOOL_CATEGORIES.map((category) => (
            <section
              key={category.id}
              className="category-section"
              aria-label={category.label}
            >
              <div className="category-header">
                <span
                  className="category-dot"
                  style={{ backgroundColor: category.color }}
                />
                <span className="category-label">{category.label}</span>
              </div>
              <div className="tool-grid">
                {category.tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} categoryColor={category.color} />
                ))}
              </div>
            </section>
          ))
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="container" style={{ paddingBottom: 'var(--space-section)' }}>
        <div
          className="card card-xl"
          style={{
            textAlign: 'center',
            padding: 'var(--space-xxl)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <h2 className="headline">Your files stay on your device</h2>
          <p
            className="body-lg"
            style={{
              color: 'var(--ink-muted)',
              maxWidth: '480px',
            }}
          >
            Every operation runs entirely in your browser using WebAssembly
            and JavaScript. No uploads, no servers, no data collection.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['AES-256 Encryption', 'Zero Server Processing', 'GDPR Compliant'].map(
              (badge) => (
                <span key={badge} className="badge">
                  <ToolIcon name="check" size={12} />
                  {badge}
                </span>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
