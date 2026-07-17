import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerToolColumns = [
    {
      title: 'Popular Tools',
      links: [
        { label: 'Merge PDF', href: '/merge-pdf' },
        { label: 'Split PDF', href: '/split-pdf' },
        { label: 'Compress PDF', href: '/compress-pdf' },
        { label: 'Organize PDF', href: '/organize-pdf' },
        { label: 'Sign PDF', href: '/sign-pdf' },
      ],
    },
    {
      title: 'Organize PDF',
      links: [
        { label: 'Remove Pages', href: '/remove-pages' },
        { label: 'Extract Pages', href: '/extract-pages' },
        { label: 'Rotate PDF', href: '/rotate-pdf' },
        { label: 'Add Page Numbers', href: '/add-page-numbers' },
        { label: 'Add Watermark', href: '/add-watermark' },
      ],
    },
    {
      title: 'Convert PDF',
      links: [
        { label: 'PDF to JPG', href: '/pdf-to-jpg' },
        { label: 'JPG to PDF', href: '/jpg-to-pdf' },
        { label: 'PDF to Markdown', href: '/pdf-to-markdown' },
      ],
    },
    {
      title: 'Security',
      links: [
        { label: 'Protect PDF', href: '/protect-pdf' },
        { label: 'Unlock PDF', href: '/unlock-pdf' },
        { label: 'Edit PDF', href: '/edit-pdf' },
      ],
    },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-brand-name">
            <Image
              src="/logo.png"
              alt=""
              width={24}
              height={24}
              style={{
                borderRadius: 'var(--rounded-sm)',
                flexShrink: 0,
              }}
            />
            PDF Section
          </div>
          <p className="footer-brand-desc">
            Every tool you need to work with PDFs in one place. Completely free, private, and runs entirely in your browser.
          </p>
          <div className="footer-social" style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: '8px' }}>
            <a
              href="https://x.com/pdfsection"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Follow PDF Section on X"
              style={{
                color: '#a5a8b5',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'color var(--duration-fast) var(--ease-default)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
              Follow on X
            </a>
          </div>
        </div>

        {footerToolColumns.map((col) => (
          <div key={col.title}>
            <div className="footer-column-title">{col.title}</div>
            <div className="footer-links">
              {col.links.map((link) => (
                <Link key={link.href} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>
          (c) {currentYear} PDF Section. All rights reserved. Made with ❤️ by{' '}
          <a
            href="https://x.com/muzammilkarimi"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-author-link"
            style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '500' }}
          >
            MAK
          </a>
        </span>
        <span>All processing happens in your browser. Your files never leave your device.</span>
      </div>
    </footer>
  );
}
