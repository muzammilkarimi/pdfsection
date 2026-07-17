'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at top right, rgba(94, 106, 210, 0.03), transparent 40%)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Back Button */}
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', padding: '8px 16px', gap: '8px', marginBottom: 'var(--space-xl)', fontSize: '13px', width: 'fit-content' }}>
          ◀ Back to workspace
        </Link>

        {/* Hero Section: Split Layout (Founder Image on Left, Intro on Right) */}
        <section style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-xxl)' }}>
          {/* Left: Avatar / Portrait */}
          <div style={{ flexShrink: 0, margin: '0 auto' }}>
            <div 
              style={{ 
                position: 'relative', 
                width: '240px', 
                height: '240px', 
                borderRadius: 'var(--rounded-xl)', 
                overflow: 'hidden', 
                border: '1.5px solid var(--hairline-strong)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                backgroundColor: 'var(--surface-2)'
              }}
            >
              <Image 
                src="/founder.png" 
                alt="Muzammil A Karimi" 
                fill 
                priority
                style={{ objectFit: 'cover' }} 
              />
            </div>
            
            {/* Social handles bar below photo */}
            <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'center', marginTop: 'var(--space-sm)' }}>
              <a href="https://github.com/muzammilkarimi" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }} title="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
              </a>
              <a href="https://www.linkedin.com/in/makarimi01/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }} title="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
              <a href="https://x.com/muzammilkarimi" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }} title="Twitter / X">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
              </a>
              <a href="https://www.instagram.com/muzammilkarimiiiii/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }} title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
            </div>
          </div>

          {/* Right: Info */}
          <div style={{ flex: 1, minWidth: '320px' }}>
            <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '600', letterSpacing: '0.05em' }}>MEET THE FOUNDER</span>
            <h1 className="display-sm" style={{ fontWeight: '800', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '32px' }}>
              Muzammil A Karimi
            </h1>
            <p className="body-md ink-muted" style={{ lineHeight: '1.6', fontSize: '16px', marginBottom: 'var(--space-md)' }}>
              As an <strong>IIT Patna alumnus</strong>, I am building <strong>PDF Section</strong> from a simple frustration: handling PDF documents shouldn't require uploading sensitive files to remote servers, navigating ad-filled platforms, or paying for expensive software.
            </p>
            <p className="body-md ink-muted" style={{ lineHeight: '1.6', fontSize: '16px' }}>
              PDF Section exists so people can manage their documents locally, securely, and completely free—right inside their browser.
            </p>
          </div>
        </section>

        {/* Highlight Cards Grid */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
            
            <div className="seo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div style={{ fontSize: '24px' }}>🛡️</div>
              <h3 className="body-sm" style={{ fontWeight: '700', color: 'var(--ink)' }}>Everyday Security</h3>
              <p className="caption ink-subtle" style={{ lineHeight: '1.5' }}>
                Sensitive documents move fast. Uploading them to remote servers creates unnecessary security risks. We process files locally.
              </p>
            </div>

            <div className="seo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div style={{ fontSize: '24px' }}>⚡</div>
              <h3 className="body-sm" style={{ fontWeight: '700', color: 'var(--ink)' }}>Local Performance</h3>
              <p className="caption ink-subtle" style={{ lineHeight: '1.5' }}>
                Runs 100% inside your local browser memory. Files are loaded, compiled, and edited instantly without server wait times.
              </p>
            </div>

            <div className="seo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div style={{ fontSize: '24px' }}>💻</div>
              <h3 className="body-sm" style={{ fontWeight: '700', color: 'var(--ink)' }}>Productivity Focused</h3>
              <p className="caption ink-subtle" style={{ lineHeight: '1.5' }}>
                Tailored for students, founders, developers, creators, and anyone who works with documents daily. Zero friction.
              </p>
            </div>

          </div>
        </section>

        {/* Why We Built & Mission Section */}
        <section 
          style={{ 
            backgroundColor: 'var(--surface-1)', 
            border: '1px solid var(--hairline-strong)', 
            borderRadius: 'var(--rounded-lg)', 
            padding: 'var(--space-xl)',
            marginBottom: 'var(--space-xxl)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.01)'
          }}
        >
          <h2 className="body-lg" style={{ fontWeight: '800', marginBottom: 'var(--space-md)', color: 'var(--ink)' }}>Why We Built PDF Section</h2>
          <div className="body-sm ink-muted" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', lineHeight: '1.6', fontSize: '14.5px' }}>
            <p>
              The modern web is full of friction. When you need to quickly sign a contract, merge invoices, or compress a file, you are forced to upload your sensitive files to remote servers, deal with pop-up ads, or pay for expensive subscription services. For people who handle documents rapidly, this is a bottleneck.
            </p>
            <p>
              We built PDF Section to bridge that gap. By combining local PDF compiling engines with local browser execution, PDF Section allows you to process documents instantly—directly in your browser window. No files are ever saved, stored, or sent to a server.
            </p>
          </div>
        </section>

        {/* Design Philosophy section */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-lg" style={{ fontWeight: '800', marginBottom: 'var(--space-lg)', textAlign: 'center', color: 'var(--ink)' }}>Our Design Philosophy</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
            
            <div 
              style={{ 
                borderLeft: '4px solid var(--primary)', 
                backgroundColor: 'rgba(94, 106, 210, 0.02)',
                padding: 'var(--space-md) var(--space-md) var(--space-md) var(--space-sm)',
                borderRadius: '0 var(--rounded-md) var(--rounded-md) 0'
              }}
            >
              <h3 className="body-sm" style={{ fontWeight: '700', color: 'var(--ink)' }}>Privacy Conscious</h3>
              <p className="caption ink-subtle" style={{ marginTop: '4px', lineHeight: '1.5' }}>
                Your data belongs to you. Files are processed entirely inside your local browser memory and are discarded immediately.
              </p>
            </div>

            <div 
              style={{ 
                borderLeft: '4px solid var(--primary)', 
                backgroundColor: 'rgba(94, 106, 210, 0.02)',
                padding: 'var(--space-md) var(--space-md) var(--space-md) var(--space-sm)',
                borderRadius: '0 var(--rounded-md) var(--rounded-md) 0'
              }}
            >
              <h3 className="body-sm" style={{ fontWeight: '700', color: 'var(--ink)' }}>Frictionless Integration</h3>
              <p className="caption ink-subtle" style={{ marginTop: '4px', lineHeight: '1.5' }}>
                No account registrations, no payment prompts, and no daily limits. PDF Section is built to get the job done instantly.
              </p>
            </div>

            <div 
              style={{ 
                borderLeft: '4px solid var(--primary)', 
                backgroundColor: 'rgba(94, 106, 210, 0.02)',
                padding: 'var(--space-md) var(--space-md) var(--space-md) var(--space-sm)',
                borderRadius: '0 var(--rounded-md) var(--rounded-md) 0'
              }}
            >
              <h3 className="body-sm" style={{ fontWeight: '700', color: 'var(--ink)' }}>For Fast Thinkers</h3>
              <p className="caption ink-subtle" style={{ marginTop: '4px', lineHeight: '1.5' }}>
                We design specifically for people who value speed, efficiency, and a clean workspace free from visual clutter or intrusive ads.
              </p>
            </div>

          </div>
        </section>

        {/* CTA Banner */}
        <section 
          className="card" 
          style={{ 
            textAlign: 'center', 
            padding: 'var(--space-xl)', 
            border: '1px solid var(--primary)', 
            borderRadius: 'var(--rounded-xl)',
            backgroundColor: 'color-mix(in srgb, var(--primary) 4%, var(--surface-1))',
            boxShadow: '0 8px 30px rgba(94, 106, 210, 0.05)'
          }}
        >
          <h3 className="body-lg" style={{ fontWeight: '800', color: 'var(--ink)' }}>Start Managing Documents Securely</h3>
          <p className="body-sm ink-muted" style={{ margin: 'var(--space-xs) 0 var(--space-md)', fontSize: '14px' }}>
            Experience local, secure, and instant PDF processing with zero compromises.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', padding: '10px 24px', textDecoration: 'none', fontWeight: '600' }}>
            Go to Workspace Tools
          </Link>
        </section>

      </div>
    </main>
  );
}
