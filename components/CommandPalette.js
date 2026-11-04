'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LIVE_TOOLS } from '@/lib/tools';
import { BLOG_POSTS } from '@/lib/blog';
import { listLibrary } from '@/lib/fileLibrary';
import { setIncomingFiles } from '@/lib/incomingFiles';
import { ToolIcon } from './Icons';

const LIMITS = { tools: 6, guides: 3, files: 3 };
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function matches(query, ...fields) {
  const q = query.trim().toLowerCase();
  return !q || fields.some((field) => (field || '').toLowerCase().includes(q));
}

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentFiles, setRecentFiles] = useState([]);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 30);
    // Recent files live in this browser's file library; none if storage is off or blocked.
    listLibrary()
      .then((entries) => setRecentFiles(entries))
      .catch(() => setRecentFiles([]));
    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const groups = useMemo(() => {
    const tools = LIVE_TOOLS
      .filter((t) => matches(query, t.name, t.description, t.categoryLabel))
      .slice(0, LIMITS.tools)
      .map((t) => ({
        key: `tool-${t.id}`,
        title: t.name,
        description: t.description,
        icon: t.icon,
        color: t.categoryColor,
        open: () => router.push(t.route),
      }));
    const guides = BLOG_POSTS
      .filter((b) => matches(query, b.title, b.description, b.category))
      .slice(0, LIMITS.guides)
      .map((b) => ({
        key: `guide-${b.slug}`,
        title: b.title,
        description: `Guide · ${b.readTime}`,
        icon: 'pdf',
        color: 'var(--ink-subtle)',
        open: () => router.push(`/blog/${b.slug}`),
      }));
    const files = recentFiles
      .filter((f) => matches(query, f.filename))
      .slice(0, LIMITS.files)
      .map((f) => {
        const tool = LIVE_TOOLS.find((t) => t.route === `/${f.tool}`);
        return {
          key: `file-${f.id}`,
          title: f.filename,
          description: `${tool ? `${tool.name} · ` : ''}${dateFormat.format(f.createdAt)}`,
          icon: 'pdf',
          color: 'var(--tool-organize)',
          open: () => {
            setIncomingFiles([new File([f.blob], f.filename, { type: f.mime })]);
            router.push('/');
          },
        };
      });
    return [
      { title: 'Tools', items: tools },
      { title: 'Guides', items: guides },
      { title: 'Recent files in this browser', items: files },
    ].filter((group) => group.items.length > 0);
  }, [query, recentFiles, router]);

  const flatItems = groups.flatMap((group) => group.items);
  const activeIndex = Math.min(selectedIndex, Math.max(0, flatItems.length - 1));

  const handleSelect = (item) => {
    onClose();
    item.open();
  };

  const handleKeyDownInModal = (e) => {
    if (!flatItems.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((activeIndex + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((activeIndex - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(flatItems[activeIndex]);
    }
  };

  if (!isOpen) return null;

  let runningIndex = -1;

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div
        className="cmd-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="cmd-search">
          <ToolIcon name="search" size={20} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInModal}
            placeholder="Search tools, guides and your files"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-results"
            aria-activedescendant={flatItems[activeIndex] ? `cmd-${flatItems[activeIndex].key}` : undefined}
          />
          <kbd>Esc</kbd>
        </label>

        <div className="cmd-results" id="cmd-results" role="listbox" aria-label="Results">
          {groups.length === 0 ? (
            <p className="cmd-empty">Nothing matches “{query.trim()}”.</p>
          ) : (
            groups.map((group) => (
              <div key={group.title} role="group" aria-label={group.title}>
                <span className="cmd-group-title">{group.title}</span>
                {group.items.map((item) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const selected = index === activeIndex;
                  return (
                    <div
                      key={item.key}
                      id={`cmd-${item.key}`}
                      role="option"
                      aria-selected={selected}
                      className="cmd-item"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span
                        className="cmd-item-icon"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${item.color} 14%, var(--surface-1))`,
                          color: item.color,
                        }}
                      >
                        <ToolIcon name={item.icon} size={17} />
                      </span>
                      <span className="cmd-item-text">
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </span>
                      {selected && <span className="cmd-item-enter">Enter ↵</span>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="cmd-footer" aria-hidden="true">
          <span>↑ ↓ to move</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
