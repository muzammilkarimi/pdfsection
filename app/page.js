'use client';

import { useMemo, useState } from 'react';
import ToolCard from '@/components/ToolCard';
import { ToolIcon } from '@/components/Icons';
import { LIVE_TOOL_CATEGORIES, searchLiveTools, LIVE_TOOLS } from '@/lib/tools';

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
              Merge, split, compress, convert, edit, and secure PDF files without
              uploading them to a server.
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

        <div className="home-app-shell">
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
                  {searchQuery.trim() ? 'Search results' : categoryTitle}
                </span>
                <h2 className="home-tools-title">
                  {visibleTools.length} tool{visibleTools.length === 1 ? '' : 's'} ready to use
                </h2>
              </div>
              {searchQuery.trim() && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              )}
            </div>

            {visibleTools.length > 0 ? (
              <div className="tool-grid home-tool-grid">
                {visibleTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    categoryColor={tool.categoryColor || categoryColor}
                  />
                ))}
              </div>
            ) : (
              <div className="home-empty-state">
                <ToolIcon name="search" size={42} />
                <strong>No matching tools</strong>
                <span>Try another keyword or choose a different category.</span>
              </div>
            )}
          </section>
        </div>

        <section className="home-trust-strip" aria-label="Privacy and file handling">
          {[
            { icon: 'lock', title: 'Private', text: 'Files stay in your browser' },
            { icon: 'check', title: 'Free', text: 'No account needed' },
            { icon: 'compress', title: 'Fast', text: 'Start from the tool screen' },
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




