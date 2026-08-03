'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LIVE_TOOLS } from '@/lib/tools';
import { BLOG_POSTS } from '@/lib/blog';
import { ToolIcon } from './Icons';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef(null);

  // Combine tools & articles for unified search
  const toolsList = LIVE_TOOLS.map((t) => ({
    ...t,
    title: t.name || t.title || '',
    type: 'tool',
  }));
  const blogsList = BLOG_POSTS.map((b) => ({
    id: `blog-${b.slug}`,
    title: b.title || '',
    description: b.description || '',
    route: `/blog/${b.slug}`,
    type: 'blog',
  }));

  const allItems = [...toolsList, ...blogsList];

  const filteredItems = query.trim() === ''
    ? allItems.slice(0, 10)
    : allItems.filter((item) => {
        const itemTitle = (item.title || item.name || '').toLowerCase();
        const itemDesc = (item.description || '').toLowerCase();
        const q = query.toLowerCase();
        return itemTitle.includes(q) || itemDesc.includes(q);
      }).slice(0, 12);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (item) => {
    onClose();
    router.push(item.route);
  };

  const handleKeyDownInModal = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(14, 13, 21, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        className="cmd-palette-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--hairline-strong)',
          borderRadius: 'var(--rounded-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
          <ToolIcon name="search" size={20} style={{ color: 'var(--ink-muted)', marginRight: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInModal}
            placeholder="Type a tool name or topic... (e.g. Merge, Convert, Sign)"
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--ink)',
              fontSize: '16px',
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--ink-subtle)',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: '4px',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-subtle)', fontSize: '14px' }}>
              No matching PDF tools or articles found.
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={item.id || item.route}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--rounded-md)',
                  cursor: 'pointer',
                  backgroundColor: selectedIndex === idx ? 'color-mix(in srgb, var(--primary) 12%, var(--surface-1))' : 'transparent',
                  transition: 'background-color 0.1s ease',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--rounded-sm)',
                    backgroundColor: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0,
                  }}
                >
                  <ToolIcon name={item.type === 'blog' ? 'blog' : (item.icon || 'pdf')} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--ink)' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--ink-subtle)', textTransform: 'uppercase', fontWeight: '600' }}>
                  {item.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
