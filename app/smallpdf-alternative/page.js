import Link from 'next/link';
import { buildToolMetadata } from '@/lib/seoUtils';
import { LIVE_TOOLS } from '@/lib/tools';

export const metadata = buildToolMetadata({
  title: 'Free Smallpdf Alternative — Unlimited Local PDF Tools Without Limits',
  description: 'Hit Smallpdf daily limits or paywall? PDF Section is a 100% free, unlimited Smallpdf alternative that runs completely inside your browser with zero file uploads.',
  route: '/smallpdf-alternative',
  keywords: ['Smallpdf alternative', 'Smallpdf free without limit', 'unlimited PDF merger', 'free Smallpdf substitute', 'private PDF editor'],
});

export default function SmallpdfAlternativePage() {
  const featuredTools = LIVE_TOOLS.slice(0, 8);

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at 90% 10%, rgba(94, 106, 210, 0.05), transparent 50%)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-xxl)' }}>
          <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.08em' }}>
            FREE & UNLIMITED ALTERNATIVE
          </span>
          <h1 className="display-sm" style={{ fontWeight: '800', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '36px' }}>
            The Free, Unlimited Smallpdf Alternative
          </h1>
          <p className="body-lg ink-muted" style={{ maxWidth: '680px', margin: '0 auto', lineHeight: '1.6', fontSize: '16px' }}>
            Stop hitting 2-task daily limits and subscription paywalls. Process unlimited PDF files locally in your browser with 100% data privacy.
          </p>
        </header>

        {/* Feature Comparison Table */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', fontSize: '20px' }}>
            PDF Section vs. Smallpdf
          </h2>

          <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline-strong)', backgroundColor: 'var(--surface-2)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--ink)' }}>Feature</th>
                  <th style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: '700' }}>PDF Section</th>
                  <th style={{ padding: '14px 18px', color: 'var(--ink-subtle)' }}>Smallpdf</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Free Tasks Per Day</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>♾️ Unlimited Free Tasks</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>⚠️ Limited (2 tasks / day cap)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Client-Side Browser Processing</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>🛡️ 100% Local (No Uploads)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Server-side cloud uploads</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Credit Card / Subscription</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>No Card Required</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Monthly subscription fees</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>File Privacy & Confidentiality</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>Files stay on your machine</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Third-party server storage</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Featured Tools Grid */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', fontSize: '20px' }}>
            Start Using Free Local PDF Tools Now
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
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
                  gap: '4px',
                  transition: 'all var(--duration-fast) var(--ease-default)'
                }}
              >
                <span style={{ fontWeight: '700', color: 'var(--ink)', fontSize: '14px' }}>{t.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--ink-subtle)' }}>{t.description}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
