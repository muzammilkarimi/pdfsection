'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ToolCard from '@/components/ToolCard';
import { ToolIcon } from '@/components/Icons';
import { LIVE_TOOL_CATEGORIES, searchLiveTools, LIVE_TOOLS } from '@/lib/tools';

const POPULAR_TOOLS = [
  { id: 'merge', name: 'Merge PDF', description: 'Combine multiple PDFs', route: '/merge-pdf', icon: 'merge', categoryColor: 'var(--tool-organize)' },
  { id: 'split', name: 'Split PDF', description: 'Separate pages to files', route: '/split-pdf', icon: 'split', categoryColor: 'var(--tool-organize)' },
  { id: 'compress', name: 'Compress PDF', description: 'Reduce PDF file size', route: '/compress-pdf', icon: 'compress', categoryColor: 'var(--tool-optimize)' },
  { id: 'ocr-pdf', name: 'OCR PDF', description: 'Make scanned text searchable', route: '/ocr-pdf', icon: 'search', categoryColor: 'var(--tool-optimize)' }
];

const ALL_CATEGORY = 'all';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  const selectedCategoryData = LIVE_TOOL_CATEGORIES.find(
    (category) => category.id === selectedCategory
  );

  const visibleTools = useMemo(() => {
    const query = searchQuery.trim();

    if (query) {
      const results = searchLiveTools(query);
      if (selectedCategory === ALL_CATEGORY) return results;
      return results.filter((tool) => tool.category === selectedCategory);
    }

    if (selectedCategoryData) {
      return selectedCategoryData.tools.map((tool) => ({
        ...tool,
        category: selectedCategoryData.id,
        categoryLabel: selectedCategoryData.label,
        categoryColor: selectedCategoryData.color,
      }));
    }

    return LIVE_TOOLS;
  }, [searchQuery, selectedCategory, selectedCategoryData]);

  const categoryTitle = selectedCategoryData?.label || 'All PDF tools';
  const categoryColor = selectedCategoryData?.color || 'var(--primary)';
  const toolCount = LIVE_TOOLS.length;

  return (
    <main className="main home-main">
      <section className="home-dashboard container" aria-label="PDF tools dashboard">
        <div className="home-hero-panel">
          <div className="home-hero-copy">
            <span className="home-kicker">
              <ToolIcon name="lock" size={14} />
              Private browser PDF tools
            </span>
            <h1 className="home-title">PDF Section</h1>
            <p className="home-subtitle">
              Merge, split, compress, convert, edit, and secure PDF files{' '}
              <strong style={{ color: 'var(--brand-yellow)', fontWeight: '700' }}>without uploading them to a server</strong>
              <Link 
                href="/blog/stop-uploading-pdfs-online-privacy-risks" 
                title="Why local processing is safer than cloud uploading"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                  color: 'var(--brand-yellow)',
                  fontSize: '10px', 
                  fontWeight: '800',
                  textDecoration: 'none',
                  marginLeft: '6px',
                  verticalAlign: 'middle',
                  transition: 'background-color var(--duration-fast)',
                  cursor: 'pointer',
                  border: '1px solid color-mix(in srgb, var(--brand-yellow) 30%, transparent)'
                }}
              >
                ?
              </Link>
            </p>
          </div>

          <div className="home-search-panel">
            <label className="home-search-label" htmlFor="tool-search">
              Find a PDF tool
            </label>
            <div className="search-wrapper home-search-wrapper">
              <span className="search-icon">
                <ToolIcon name="search" size={18} />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search merge, split, compress..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search PDF tools"
                id="tool-search"
              />
            </div>
          </div>
        </div>

        {!searchQuery.trim() ? (
          <>
            {/* Desktop Dashboard view (shows category filtering sidebar) */}
            <div className="home-app-shell desktop-only-layout">
              <aside className="home-sidebar" aria-label="PDF tool categories">
                <button
                  type="button"
                  className={`home-category-button ${selectedCategory === ALL_CATEGORY ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(ALL_CATEGORY)}
                >
                  <span className="home-category-icon" style={{ color: 'var(--primary)' }}>
                    <ToolIcon name="reorder" size={18} />
                  </span>
                  <span>
                    <strong>All PDF tools</strong>
                    <small>{toolCount} tools</small>
                  </span>
                </button>

                {LIVE_TOOL_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`home-category-button ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="home-category-icon" style={{ color: category.color }}>
                      <ToolIcon name={category.tools[0]?.icon || 'file'} size={18} />
                    </span>
                    <span>
                      <strong>{category.label}</strong>
                      <small>{category.tools.length} tool{category.tools.length === 1 ? '' : 's'}</small>
                    </span>
                  </button>
                ))}
              </aside>

              <section className="home-tools-panel" aria-label={categoryTitle}>
                <div className="home-tools-header">
                  <div>
                    <span className="category-label" style={{ color: categoryColor }}>
                      {categoryTitle}
                    </span>
                    <h2 className="home-tools-title">
                      {visibleTools.length} tool{visibleTools.length === 1 ? '' : 's'} ready to use
                    </h2>
                  </div>
                </div>

                <div className="tool-grid home-tool-grid">
                  {visibleTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      categoryColor={tool.categoryColor || categoryColor}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Mobile Grouped categories dashboard */}
            <div className="mobile-only-layout mobile-dashboard">
              {/* Popular list */}
              <div className="mobile-dashboard-section">
                <h3 className="mobile-section-title">Popular Tools</h3>
                <div className="mobile-popular-row">
                  {POPULAR_TOOLS.map((tool) => (
                    <Link href={tool.route} key={tool.id} className="mobile-popular-card">
                      <div className="mobile-popular-icon" style={{ backgroundColor: `color-mix(in srgb, ${tool.categoryColor} 15%, var(--surface-2))`, color: tool.categoryColor }}>
                        <ToolIcon name={tool.icon} size={20} />
                      </div>
                      <strong>{tool.name}</strong>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categorized decks */}
              {LIVE_TOOL_CATEGORIES.map((category) => (
                <div key={category.id} className="mobile-category-deck">
                  <div className="mobile-deck-header" style={{ borderLeftColor: category.color }}>
                    <h4 style={{ color: category.color }}>{category.label}</h4>
                    <span className="mobile-deck-badge">{category.tools.length} Tools</span>
                  </div>
                  
                  <div className="mobile-deck-grid">
                    {category.tools.map((tool) => (
                      <Link href={tool.route} key={tool.id} className="mobile-deck-item">
                        <div className="mobile-deck-item-icon" style={{ backgroundColor: `color-mix(in srgb, ${category.color} 12%, var(--surface-2))`, color: category.color }}>
                          <ToolIcon name={tool.icon} size={16} />
                        </div>
                        <div className="mobile-deck-item-meta">
                          <strong>{tool.name}</strong>
                          <span>{tool.description}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Search Results (Desktop & Mobile Unified) */
          <div className="search-results-layout">
            <div className="home-tools-header">
              <div>
                <span className="category-label" style={{ color: 'var(--primary)' }}>
                  Search results
                </span>
                <h2 className="home-tools-title">
                  {visibleTools.length} tool{visibleTools.length === 1 ? '' : 's'} matching "{searchQuery}"
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            </div>

            {visibleTools.length > 0 ? (
              <div className="tool-grid home-tool-grid">
                {visibleTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    categoryColor={tool.categoryColor || 'var(--primary)'}
                  />
                ))}
              </div>
            ) : (
              <div className="home-empty-state">
                <ToolIcon name="search" size={42} />
                <strong>No matching tools found</strong>
                <span>Try searching another keyword or select a category below.</span>
              </div>
            )}
          </div>
        )}

        <section className="home-trust-strip" aria-label="Privacy and file handling">
          {[
            { icon: 'lock', title: 'Private', text: 'Files stay in your browser' },
            { icon: 'check', title: 'Free', text: 'No account needed' },
            { icon: 'zap', title: 'Fast', text: 'Start from the tool screen' },
          ].map((item) => (
            <div key={item.title} className="home-trust-item">
              <ToolIcon name={item.icon} size={18} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </span>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}




