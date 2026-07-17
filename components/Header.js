'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ToolIcon } from './Icons';
import { LIVE_TOOL_CATEGORIES } from '@/lib/tools';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        setTheme(storedTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(storedTheme);
      } else if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.add('light');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(nextTheme);
      localStorage.setItem('theme', nextTheme);
    }
  };

  const navLinks = [
    { label: 'Tools', href: '/#tools' },
    { label: 'Compress', href: '/compress-pdf' },
    { label: 'Merge', href: '/merge-pdf' },
    { label: 'Blog', href: '/blog' },
  ];

  return (
    <>
      <header className="nav" role="banner">
        <div className="nav-inner">
          {/* Brand */}
          <Link href="/" className="nav-brand" aria-label="PDF Section Home" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', textDecoration: 'none' }}>
            <Image
              src="/logo.png"
              alt=""
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
              <Link href="/#tools" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Tools 
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

            <Link href="/merge-pdf" className="btn btn-primary nav-primary-action">
              Merge PDF
            </Link>
            
            <button
              className="nav-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <ToolIcon name={mobileOpen ? 'x' : 'menu'} size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`} role="navigation" aria-label="Mobile navigation">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink-subtle)' }}>Theme</span>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--hairline)',
              color: 'var(--ink)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px'
            }}
          >
            <ToolIcon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <hr className="divider" style={{ margin: '12px 0' }} />

        {navLinks.filter(link => link.label !== 'Tools').map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        <hr className="divider" style={{ margin: '12px 0' }} />

        {/* Tool categories in mobile menu */}
        <div style={{ padding: '0 16px', marginTop: '12px' }}>
          <div className="eyebrow" style={{ color: 'var(--ink-tertiary)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
            PDF Tools By Category
          </div>
          {LIVE_TOOL_CATEGORIES.map((cat) => {
            const isExpanded = !!expandedCategories[cat.id];
            return (
              <div key={cat.id} style={{ marginBottom: '8px', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', backgroundColor: 'var(--surface-1)' }}>
                <button
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cat.color }}></span>
                    {cat.label}
                  </span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ 
                      transition: 'transform var(--duration-normal)', 
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: 'var(--ink-tertiary)'
                    }}
                  >
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                
                <div className={`mobile-accordion ${isExpanded ? 'open' : ''}`}>
                  <div className="mobile-accordion-inner" style={{ borderTop: isExpanded ? '1px solid var(--hairline-soft)' : '1px solid transparent', backgroundColor: 'var(--canvas)' }}>
                    <div style={{ padding: '6px 0' }}>
                      {cat.tools.map((tool) => (
                        <Link
                          key={tool.id}
                          href={tool.route}
                          className="mobile-nav-link"
                          onClick={() => setMobileOpen(false)}
                          style={{ 
                            padding: '10px 16px 10px 32px', 
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none',
                            color: 'var(--ink-muted)'
                          }}
                        >
                          <ToolIcon name={tool.icon} size={15} style={{ color: cat.color }} />
                          {tool.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
