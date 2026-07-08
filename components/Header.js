'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ToolIcon } from './Icons';
import { LIVE_TOOL_CATEGORIES } from '@/lib/tools';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Tools', href: '/#tools' },
    { label: 'Compress', href: '/compress-pdf' },
    { label: 'Merge', href: '/merge-pdf' },
    { label: 'Split', href: '/split-pdf' },
    { label: 'Convert', href: '/jpg-to-pdf' },
  ];

  return (
    <>
      <header className="nav" role="banner">
        <div className="nav-inner">
          {/* Brand */}
          <Link href="/" className="nav-brand" aria-label="PDF Section Home" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              priority
              style={{
                borderRadius: 'var(--rounded-sm)',
                flexShrink: 0,
                objectFit: 'contain',
              }}
            />
            <span>PDF Section</span>
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <div className="nav-item-dropdown">
              <Link href="/#tools" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Tools <span style={{ fontSize: '10px', opacity: 0.6 }}>v</span>
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
        {navLinks.map((link) => (
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
        {LIVE_TOOL_CATEGORIES.map((cat) => (
          <div key={cat.id} style={{ marginBottom: '16px' }}>
            <div className="eyebrow" style={{ color: cat.color, padding: '8px 16px', fontSize: '11px' }}>
              {cat.label}
            </div>
            {cat.tools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.route}
                className="mobile-nav-link"
                onClick={() => setMobileOpen(false)}
                style={{ paddingLeft: '24px', fontSize: '14px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ToolIcon name={tool.icon} size={16} />
                  {tool.name}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}






