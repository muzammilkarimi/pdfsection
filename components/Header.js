'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ToolIcon } from './Icons';
import { LIVE_TOOL_CATEGORIES } from '@/lib/tools';
import CommandPalette from './CommandPalette';
import IndependenceBanner from './IndependenceBanner';
import { applyTheme } from '@/lib/preferences';

export default function Header() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      // 'system' is resolved by the inline script in layout.js, so read the applied class.
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && storedTheme !== 'system') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(storedTheme);
    } else if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'All tools', href: '/tools' },
    { label: 'Merge', href: '/merge-pdf' },
    { label: 'Compress', href: '/compress-pdf' },
    { label: 'Edit', href: '/edit-pdf' },
    { label: 'Create', href: '/create-pdf' },
    { label: 'Guides', href: '/blog' },
  ];

  return (
    <>
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      <div className="nav-fixed-holder">
        <IndependenceBanner />
        <header className="nav" role="banner">
        <div className="nav-inner">
          {/* Brand */}
          <Link href="/" className="nav-brand" aria-label="PDF Section Home" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', textDecoration: 'none' }}>
            <Image
              src="/logo.png"
              alt="PDF Section Logo"
              width={32}
              height={32}
              priority
              style={{
                borderRadius: 'var(--rounded-sm)',
                flexShrink: 0,
                objectFit: 'contain',
              }}
            />
            <span style={{ fontWeight: '800', letterSpacing: '-0.6px', fontSize: '18px', color: 'var(--ink)' }}>
              PDF <span style={{ color: 'var(--brand-yellow)', marginLeft: '1px' }}>Section</span>
            </span>
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <div className="nav-item-dropdown">
              <Link href="/tools" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                All tools
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="dropdown-chevron" style={{ transition: 'transform var(--duration-fast) var(--ease-default)', marginLeft: '2px' }}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </Link>
              
              <div className="mega-menu">
                <div className="mega-menu-grid-flat">
                  {LIVE_TOOL_CATEGORIES.map((cat) =>
                    cat.tools.map((tool) => (
                      <Link key={tool.id} href={tool.route} className="mega-menu-tool-link-compact">
                        <ToolIcon name={tool.icon} size={15} style={{ color: cat.color, flexShrink: 0 }} />
                        <span className="mega-menu-tool-name-compact">{tool.name}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="nav-actions">
            {/* Quick Search Ctrl+K Button */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              aria-label="Search tools"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--hairline-strong)',
                borderRadius: 'var(--rounded-full)',
                color: 'var(--ink-muted)',
                fontSize: '12.5px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-default)'
              }}
            >
              <ToolIcon name="search" size={15} />
              <span className="desktop-only-inline">Search</span>
              <kbd className="desktop-only-inline" style={{ fontSize: '10px', backgroundColor: 'var(--surface-1)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--hairline)', color: 'var(--ink-subtle)' }}>Ctrl K</kbd>
            </button>

            <Link href="/files" className="nav-icon-link desktop-only-inline" aria-label="Your recent files" title="Your files">
              <ToolIcon name="folder" size={18} />
            </Link>
            <Link href="/settings" className="nav-icon-link nav-settings-link" aria-label="Settings" title="Settings">
              <ToolIcon name="settings" size={18} />
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-xs)',
                borderRadius: 'var(--rounded-full)',
                width: '36px',
                height: '36px',
                transition: 'background var(--duration-fast) var(--ease-default)'
              }}
            >
              <ToolIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

          </div>
        </div>
      </header>
      </div>

    </>
  );
}
