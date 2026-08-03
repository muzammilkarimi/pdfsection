import Link from 'next/link';
import { buildToolMetadata } from '@/lib/seoUtils';
import { LIVE_TOOLS } from '@/lib/tools';

export const metadata = buildToolMetadata({
  title: 'Free Adobe Acrobat Alternative — Private Online PDF Tools Without Subscription',
  description: 'Looking for a free Adobe Acrobat Pro alternative? PDF Section provides 100% free, browser-native tools to edit, sign, merge, split, compress, and convert PDFs without monthly fees or software downloads.',
  route: '/adobe-acrobat-alternative',
  keywords: ['Adobe Acrobat alternative', 'free Adobe Acrobat substitute', 'edit PDF without Acrobat', 'free PDF software no subscription', 'Acrobat online alternative'],
});

export default function AdobeAcrobatAlternativePage() {
  const featuredTools = LIVE_TOOLS.slice(0, 10);

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at 15% 15%, rgba(94, 106, 210, 0.06), transparent 50%)' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-xxl)' }}>
          <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.08em' }}>
            ACROBAT PRO ALTERNATIVE
          </span>
          <h1 className="display-sm" style={{ fontWeight: '800', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '36px', letterSpacing: '-0.5px' }}>
            The Free, Private Alternative to Adobe Acrobat Pro
          </h1>
          <p className="body-lg ink-muted" style={{ maxWidth: '700px', margin: '0 auto', lineHeight: '1.6', fontSize: '16px' }}>
            Stop paying $239/year for basic document edits. PDF Section gives you desktop-class PDF tools directly in your browser with 100% data privacy and zero software installs.
          </p>
        </header>

        {/* Feature Comparison Table */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', fontSize: '20px' }}>
            PDF Section vs. Adobe Acrobat Pro
          </h2>

          <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline-strong)', backgroundColor: 'var(--surface-2)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--ink)' }}>Feature</th>
                  <th style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: '700' }}>PDF Section</th>
                  <th style={{ padding: '14px 18px', color: 'var(--ink-subtle)' }}>Adobe Acrobat Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Pricing & Subscription</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>🆓 100% Free Forever</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>💰 $19.99 / month subscription</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Data Privacy & Security</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>🛡️ 100% Local Browser Memory</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Cloud document sync & storage</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Software Download Required?</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>❌ No (Runs in Any Web Browser)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Heavy desktop installation</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Account Registration</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>No Registration Required</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Adobe ID login required</td>
                </tr>
                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Speed & System Impact</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>⚡ Lightweight & Instant</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>High RAM & storage footprint</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Featured Tools Grid */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', fontSize: '20px' }}>
            Free Online Acrobat Tools
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
            {featuredTools.map((t) => (
              <Link
                key={t.id}
                href={t.route}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-md)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all var(--duration-fast) var(--ease-default)'
                }}
              >
                <span style={{ fontWeight: '700', color: 'var(--ink)', fontSize: '14px' }}>{t.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--ink-subtle)', lineHeight: '1.4' }}>{t.description}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
