import Link from 'next/link';
import { TOOL_CATEGORIES } from '@/lib/tools';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Group tools into footer columns
  const footerToolColumns = [
    {
      title: 'Popular Tools',
      links: [
        { label: 'Merge PDF', href: '/merge-pdf' },
        { label: 'Split PDF', href: '/split-pdf' },
        { label: 'Compress PDF', href: '/compress-pdf' },
        { label: 'Edit PDF', href: '/edit-pdf' },
        { label: 'Sign PDF', href: '/sign-pdf' },
      ],
    },
    {
      title: 'Convert to PDF',
      links: [
        { label: 'JPG to PDF', href: '/jpg-to-pdf' },
        { label: 'Word to PDF', href: '/word-to-pdf' },
        { label: 'Excel to PDF', href: '/excel-to-pdf' },
        { label: 'PPT to PDF', href: '/powerpoint-to-pdf' },
        { label: 'HTML to PDF', href: '/html-to-pdf' },
      ],
    },
    {
      title: 'Convert from PDF',
      links: [
        { label: 'PDF to JPG', href: '/pdf-to-jpg' },
        { label: 'PDF to Word', href: '/pdf-to-word' },
        { label: 'PDF to Excel', href: '/pdf-to-excel' },
        { label: 'PDF to PPT', href: '/pdf-to-powerpoint' },
      ],
    },
    {
      title: 'More Tools',
      links: [
        { label: 'Rotate PDF', href: '/rotate-pdf' },
        { label: 'Add Page Numbers', href: '/add-page-numbers' },
        { label: 'Watermark PDF', href: '/add-watermark' },
        { label: 'Protect PDF', href: '/protect-pdf' },
        { label: 'Unlock PDF', href: '/unlock-pdf' },
      ],
    },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        {/* Brand column */}
        <div className="footer-brand">
          <div className="footer-brand-name">
            <img
              src="/logo.png"
              alt=""
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--rounded-sm)',
                flexShrink: 0,
              }}
            />
            PDF Section
          </div>
          <p className="footer-brand-desc">
            Every tool you need to work with PDFs in one place. Completely free, private, and runs entirely in your browser.
          </p>
        </div>

        {/* Link columns */}
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

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span>© {currentYear} PDF Section. All rights reserved.</span>
        <span>All processing happens in your browser. Your files never leave your device.</span>
      </div>
    </footer>
  );
}
