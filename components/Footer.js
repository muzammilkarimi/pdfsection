import Image from 'next/image';
import Link from 'next/link';

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
        {/* Brand column */}
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
