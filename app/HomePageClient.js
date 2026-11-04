'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ToolCard from '@/components/ToolCard';
import { ToolIcon } from '@/components/Icons';
import { DropCard, DropOverlay, DropResults, OpenFileCard, useSmartDrop } from '@/components/SmartDrop';
import { listLibrary } from '@/lib/fileLibrary';
import { formatBytes } from '@/lib/fileInsights';
import { LIVE_TOOL_CATEGORIES, searchLiveTools, LIVE_TOOLS } from '@/lib/tools';
import { isIndependenceDayActive, FESTIVE_CONFIG } from '@/lib/festiveConfig';
import { IndianFlagIcon, triggerIndependenceConfetti } from '@/components/IndependenceConfetti';

const POPULAR_TOOL_IDS = [
  'merge', 'split', 'compress', 'edit', 'sign',
  'pdf-to-word', 'word-to-pdf', 'jpg-to-pdf', 'protect', 'summarizer',
];

const PROMISES = [
  { title: 'Runs in your browser', text: 'Files are processed on your device. Nothing is uploaded, so nothing can leak.' },
  { title: 'No account needed', text: 'Open a tool and start. No sign-up, no email, no login to remember.' },
  { title: 'Free, no watermarks', text: 'Every tool is free to use, with no stamps added to your output.' },
];

export default function HomePageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const isIndependenceActive = useMemo(() => isIndependenceDayActive(), []);
  const drop = useSmartDrop();
  const [recentFiles, setRecentFiles] = useState([]);

  useEffect(() => {
    listLibrary()
      .then((entries) => setRecentFiles(entries.slice(0, 2)))
      .catch(() => setRecentFiles([]));
  }, []);

  const popularTools = useMemo(
    () => POPULAR_TOOL_IDS.map((id) => LIVE_TOOLS.find((tool) => tool.id === id)).filter(Boolean),
    []
  );
  const searchResults = useMemo(() => searchLiveTools(searchQuery.trim()), [searchQuery]);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="main home-main">
      <DropOverlay dragging={drop.dragging} />

      <section className={`home-hero container ${isIndependenceActive ? 'home-hero-festive' : ''}`}>
        <div className="home-hero-copy">
          <div className="home-kicker-row">
            {isIndependenceActive && (
              <button
                type="button"
                className="independence-hero-badge"
                onClick={triggerIndependenceConfetti}
                title="Celebrate Indian Independence Day! Click for festive confetti ✨"
              >
                <IndianFlagIcon width={19} height={12.5} />
                <span className="independence-hero-badge-text">{FESTIVE_CONFIG.HERO_BADGE_TEXT}</span>
                <span className="independence-hero-badge-sparkle" aria-hidden="true">✨</span>
              </button>
            )}
            <span className="home-badge">
              <ToolIcon name="lock" size={13} />
              Runs in your browser · nothing uploaded
            </span>
          </div>
          <h1 className="home-hero-title">
            <span className="home-title-desktop">
              Free PDF tools.
              <span>Nothing uploaded.</span>
            </span>
            <span className="home-title-mobile">What do you want to do with your PDF?</span>
          </h1>
          <p className="home-hero-subtitle">
            Merge, split, compress, convert, edit and sign PDFs for free. Your files are processed on your own
            device and{' '}
            <Link href="/blog/stop-uploading-pdfs-online-privacy-risks" title="Why local processing is safer than cloud uploading">
              never sent to a server
            </Link>
            .
          </p>
          <label className="home-hero-search">
            <ToolIcon name="search" size={18} />
            <input
              type="search"
              placeholder="What do you want to do? e.g. compress"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search PDF tools"
              id="tool-search"
            />
          </label>
        </div>

        <DropCard drop={drop} />
        <OpenFileCard drop={drop} />
      </section>

      <DropResults drop={drop} />

      {isSearching ? (
        <section className="home-section container" aria-label="Search results">
          <div className="home-section-head">
            <h2>
              {searchResults.length} tool{searchResults.length === 1 ? '' : 's'} matching &quot;{searchQuery.trim()}&quot;
            </h2>
            <button type="button" className="btn btn-secondary" onClick={() => setSearchQuery('')}>
              Clear search
            </button>
          </div>
          {searchResults.length > 0 ? (
            <div className="home-popular-grid">
              {searchResults.map((tool) => (
                <ToolCard key={tool.id} tool={tool} categoryColor={tool.categoryColor} />
              ))}
            </div>
          ) : (
            <div className="home-empty-state">
              <ToolIcon name="search" size={42} />
              <strong>No matching tools found</strong>
              <span>
                Try another word, or <Link href="/tools">browse all tools</Link>.
              </span>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="home-section container" aria-labelledby="popular-heading">
            <div className="home-section-head">
              <h2 id="popular-heading">Popular tools</h2>
              <span>{LIVE_TOOLS.length} tools, all free</span>
              <Link href="/tools" className="home-see-all">See all</Link>
            </div>
            <div className="home-popular-grid">
              {popularTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} categoryColor={tool.categoryColor} />
              ))}
            </div>
          </section>

          {recentFiles.length > 0 && (
            <section className="home-recent container" aria-labelledby="recent-heading">
              <h2 id="recent-heading">Recent</h2>
              {recentFiles.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="home-recent-item"
                  onClick={() => drop.handleFiles([new File([entry.blob], entry.filename, { type: entry.mime })])}
                >
                  <span className="home-recent-ext">{entry.filename.split('.').pop().toUpperCase()}</span>
                  <span className="home-recent-text">
                    <strong>{entry.filename}</strong>
                    <span>{formatBytes(entry.size)}</span>
                  </span>
                </button>
              ))}
            </section>
          )}

          <section className="home-categories" id="tools" aria-labelledby="categories-heading">
            <div className="container">
              <div className="home-section-head">
                <h2 id="categories-heading">All tools by category</h2>
                <Link href="/tools">See all tools →</Link>
              </div>
              <div className="home-category-columns">
                {LIVE_TOOL_CATEGORIES.map((category) => (
                  <div key={category.id} className="home-category-column">
                    <h3>
                      <span className="home-category-dot" style={{ backgroundColor: category.color }} />
                      {category.label}
                    </h3>
                    {category.tools.map((tool) => (
                      <Link key={tool.id} href={tool.route}>{tool.name}</Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="home-promises container" aria-label="Privacy and file handling">
        {PROMISES.map((promise) => (
          <div key={promise.title} className="home-promise">
            <strong>{promise.title}</strong>
            <span>{promise.text}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
