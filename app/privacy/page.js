'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at top right, rgba(94, 106, 210, 0.02), transparent 45%)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Back Button */}
        <Link href="/" className="btn btn-secondary btn-icon" style={{ display: 'inline-flex', padding: '8px 16px', gap: '8px', marginBottom: 'var(--space-xl)', fontSize: '13px' }}>
          ◀ Back to workspace
        </Link>

        {/* Article Card */}
        <article style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)', padding: 'var(--space-xl)', boxShadow: '0 4px 24px rgba(0,0,0,0.01)' }}>
          
          {/* Header */}
          <header style={{ marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--hairline-strong)', paddingBottom: 'var(--space-md)' }}>
            <h1 className="display-sm" style={{ fontWeight: '800', marginBottom: 'var(--space-xs)', fontSize: '30px', letterSpacing: '-0.5px' }}>
              Privacy Policy
            </h1>
            <p className="caption ink-subtle" style={{ fontSize: '12px' }}>Last updated: July 17, 2026</p>
          </header>

          {/* Content Sections */}
          <div className="prose" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', lineHeight: '1.7', fontSize: '15px', color: 'var(--ink-muted)' }}>
            
            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>1. Our Commitment to Your Privacy</h2>
              <p>
                At <strong>PDF Section</strong>, we prioritize document privacy above everything else. Unlike traditional online PDF tools that require uploading your private files to remote cloud servers, PDF Section utilizes a <strong>100% client-side architecture</strong>. This means your files never leave your device.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>2. How We Handle Your Files</h2>
              <p style={{ marginBottom: 'var(--space-sm)' }}>
                All document operations—including merging, splitting, compressing, organizing, signing, and converting—are computed locally inside your web browser using HTML5, WebAssembly, and local JavaScript libraries (such as pdf-lib and PDF.js). 
              </p>
              <ul style={{ margin: 'var(--space-xs) 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'none', padding: 0 }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>❌</span>
                  <p className="body-sm ink-muted"><strong>No Uploads:</strong> Your documents are never transmitted over the internet to our servers.</p>
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>❌</span>
                  <p className="body-sm ink-muted"><strong>No Logs:</strong> We do not capture, cache, inspect, or save any text content, passwords, metadata, or images from your files.</p>
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>❌</span>
                  <p className="body-sm ink-muted"><strong>No Storage:</strong> File buffers exist only temporarily within your local browser memory tab and are wiped instantly when the tab is closed.</p>
                </li>
              </ul>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>3. Information We Collect</h2>
              <p>
                We do not collect personal information. We do not require account registration, email addresses, or phone numbers to use PDF Section.
              </p>
              <p style={{ marginTop: 'var(--space-xs)' }}>
                To monitor application reliability and design quality, we use standard, anonymous analytics providers (such as Vercel Analytics). These platforms only track non-personally identifiable information, such as page views, button clicks, performance speed, and browser user-agents.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>4. Local Storage Usage</h2>
              <p>
                We use the browser's standard Local Storage mechanism to persist only your UI layout preferences (such as light vs. dark theme selection). No personal or document-related data is ever stored in Local Storage.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>5. Third-Party Links</h2>
              <p>
                Our website may contain links to external sites (such as GitHub, LinkedIn, or Twitter). We are not responsible for the privacy practices of external web platforms.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>6. Changes to this Policy</h2>
              <p>
                We reserve the right to update this Privacy Policy at any time. Any changes will be posted directly on this page with an updated timestamp.
              </p>
            </section>

            <section style={{ borderTop: '1px solid var(--hairline-strong)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)', fontSize: '13.5px' }}>
              <p>
                If you have any questions about this privacy statement, please feel free to reach out to the founder on Twitter / X: 
                {' '}
                <a href="https://x.com/muzammilkarimi" target="_blank" rel="noopener noreferrer" className="link-primary" style={{ fontWeight: '600', textDecoration: 'none' }}>
                  @muzammilkarimi
                </a>.
              </p>
            </section>

          </div>
        </article>

      </div>
    </main>
  );
}
