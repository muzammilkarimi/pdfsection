'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="caption ink-subtle" style={{ fontSize: '12px' }}>Last updated: July 17, 2026</p>
          </header>

          {/* Content Sections */}
          <div className="prose" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', lineHeight: '1.7', fontSize: '15px', color: 'var(--ink-muted)' }}>
            
            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>1. Acceptance of Terms</h2>
              <p>
                By accessing or using the <strong>PDF Section</strong> web application (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>2. Description of Service</h2>
              <p>
                PDF Section provides a web-based document editing utility. All processing—including file conversion, split, merge, compress, watermarking, and electronic signature stamp placement—is executed entirely <strong>locally within the user's browser tab</strong> using client-side resources.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>3. License and Acceptable Use</h2>
              <p>
                We grant you a free, non-exclusive, non-transferable, revocable license to use PDF Section for both personal and commercial purposes. 
              </p>
              <p style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
                You agree not to use the Service to:
              </p>
              <ul style={{ margin: 'var(--space-xs) 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'none', padding: 0 }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>🛑</span>
                  <p className="body-sm ink-muted">Attempt to reverse-engineer, modify, or interfere with the local script execution of the web app.</p>
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>🛑</span>
                  <p className="body-sm ink-muted">Automate file processes via bots or scripts that cause excessive memory load on the client side.</p>
                </li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>🛑</span>
                  <p className="body-sm ink-muted">Distribute malicious files, viruses, or locked/corrupted documents intentionally.</p>
                </li>
              </ul>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>4. Privacy & Data Integrity</h2>
              <p>
                Because the Service runs local client-side scripts, we do not receive, store, or have access to any documents you upload, modify, or download. You retain full ownership, responsibility, and liability for the content of your documents.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>5. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ACCURATE, OR ERROR-FREE. 
              </p>
              <p style={{ marginTop: 'var(--space-xs)' }}>
                We are not responsible for any file corruptions, loss of data, document errors, or signature rendering issues that occur during client-side execution.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>6. Limitation of Liability</h2>
              <p>
                IN NO EVENT SHALL THE FOUNDER, DEVELOPERS, OR CONTRIBUTORS OF PDF SECTION BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </section>

            <section style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)', fontSize: '17px' }}>7. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of your jurisdiction, without regard to conflict of law principles.
              </p>
            </section>

            <section style={{ borderTop: '1px solid var(--hairline-strong)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)', fontSize: '13.5px' }}>
              <p>
                If you have any suggestions or bug reports regarding these terms, please feel free to report them on Twitter / X: 
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
