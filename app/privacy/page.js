'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at top right, rgba(94, 106, 210, 0.02), transparent 40%)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Back Button */}
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', padding: '8px 16px', gap: '8px', marginBottom: 'var(--space-xl)', fontSize: '13px', width: 'fit-content' }}>
          ◀ Back to workspace
        </Link>

        {/* Header */}
        <header style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 className="display-sm" style={{ fontWeight: '800', marginBottom: 'var(--space-xs)' }}>
            Privacy Policy
          </h1>
          <p className="caption ink-subtle">Last updated: July 17, 2026</p>
        </header>

        {/* Content */}
        <article className="body-sm ink-muted" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', lineHeight: '1.6', fontSize: '14.5px' }}>
          
          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>1. Our Commitment to Your Privacy</h2>
            <p>
              At **PDF Section**, we prioritize document privacy above everything else. Unlike traditional online PDF tools that require uploading your private files to remote cloud servers, PDF Section utilizes a **100% client-side architecture**. This means your files never leave your device.
            </p>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>2. How We Handle Your Files</h2>
            <p>
              All document operations—including merging, splitting, compressing, organizing, signing, and converting—are computed locally inside your web browser using HTML5, WebAssembly, and local JavaScript libraries (such as pdf-lib and PDF.js). 
            </p>
            <ul style={{ margin: 'var(--space-xs) 0 0 var(--space-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>❌ **No Uploads**: Your documents are never transmitted over the internet to our servers.</li>
              <li>❌ **No Logs**: We do not capture, cache, inspect, or save any text content, passwords, metadata, or images from your files.</li>
              <li>❌ **No Storage**: File buffers exist only temporarily within your local browser memory tab and are wiped instantly when the tab is closed.</li>
            </ul>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>3. Information We Collect</h2>
            <p>
              We do not collect personal information. We do not require account registration, email addresses, or phone numbers to use PDF Section.
            </p>
            <p style={{ marginTop: 'var(--space-xs)' }}>
              To monitor application reliability and design quality, we use standard, anonymous analytics providers (such as Vercel Analytics). These platforms only track non-personally identifiable information, such as page views, button clicks, performance speed, and browser user-agents.
            </p>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>4. Local Storage Usage</h2>
            <p>
              We use the browser's standard Local Storage mechanism to persist only your UI layout preferences (such as light vs. dark theme selection). No personal or document-related data is ever stored in Local Storage.
            </p>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>5. Third-Party Links</h2>
            <p>
              Our website may contain links to external sites (such as GitHub, LinkedIn, or Twitter). We are not responsible for the privacy practices of external web platforms.
            </p>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>6. Changes to this Policy</h2>
            <p>
              We reserve the right to update this Privacy Policy at any time. Any changes will be posted directly on this page with an updated timestamp.
            </p>
          </section>

          <section style={{ borderTop: '1px solid var(--hairline-strong)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <p>
              If you have any questions about this privacy statement, please feel free to reach out to the founder on Twitter / X: 
              {' '}
              <a href="https://x.com/muzammilkarimi" target="_blank" rel="noopener noreferrer" className="link-primary" style={{ fontWeight: '500' }}>
                @muzammilkarimi
              </a>.
            </p>
          </section>

        </article>

      </div>
    </main>
  );
}
