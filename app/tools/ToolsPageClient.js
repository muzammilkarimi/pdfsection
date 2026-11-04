'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ToolIcon } from '@/components/Icons';
import { LIVE_TOOL_CATEGORIES, LIVE_TOOLS } from '@/lib/tools';

const ALL = 'all';

function matches(tool, query) {
  return tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query);
}

export default function ToolsPageClient() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIVE_TOOL_CATEGORIES
      .filter((group) => category === ALL || group.id === category)
      .map((group) => ({ ...group, tools: q ? group.tools.filter((tool) => matches(tool, q)) : group.tools }))
      .filter((group) => group.tools.length > 0);
  }, [query, category]);

  return (
    <main className="main">
      <div className="tools-page container">
        <div className="tools-page-head">
          <div>
            <h1>All PDF tools</h1>
            <p>{LIVE_TOOLS.length} free tools. Every one runs in your browser.</p>
          </div>
          <label className="home-hero-search">
            <ToolIcon name="search" size={18} />
            <input
              type="search"
              placeholder="Filter tools"
              aria-label="Filter tools"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="tools-page-chips" role="group" aria-label="Show category">
          <button type="button" className="tools-page-chip" aria-pressed={category === ALL} onClick={() => setCategory(ALL)}>
            All
          </button>
          {LIVE_TOOL_CATEGORIES.map((group) => (
            <button
              key={group.id}
              type="button"
              className="tools-page-chip"
              aria-pressed={category === group.id}
              onClick={() => setCategory(group.id)}
            >
              {group.label}
            </button>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="home-empty-state">
            <ToolIcon name="search" size={42} />
            <strong>No tools match &quot;{query.trim()}&quot;</strong>
            <span>Try another word, or clear the filter.</span>
          </div>
        )}

        {groups.map((group) => (
          <section key={group.id} className="tools-page-group" aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`}>
              <span className="home-category-dot" style={{ backgroundColor: group.color }} />
              {group.label}
              <small>{group.tools.length} tool{group.tools.length === 1 ? '' : 's'}</small>
            </h2>
            <div className="tools-page-grid">
              {group.tools.map((tool) => (
                <Link key={tool.id} href={tool.route} className="tools-page-item">
                  <span
                    className="tools-page-item-icon"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${group.color} 14%, var(--surface-2))`,
                      color: group.color,
                    }}
                  >
                    <ToolIcon name={tool.icon} size={20} />
                  </span>
                  <span className="tools-page-item-text">
                    <strong>{tool.name}</strong>
                    <span>{tool.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
