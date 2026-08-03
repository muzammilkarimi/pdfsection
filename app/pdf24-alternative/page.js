import Link from 'next/link';
import { buildToolMetadata } from '@/lib/seoUtils';
import { LIVE_TOOLS } from '@/lib/tools';

export const metadata = buildToolMetadata({
  title: 'Free PDF24 Alternative — Modern Online Browser PDF Suite',
  description: 'Looking for a modern, web-native alternative to PDF24 Creator? PDF Section provides 100% free, private PDF tools with zero installation, zero server uploads, and sleek design.',
  route: '/pdf24-alternative',
  keywords: ['PDF24 alternative', 'PDF24 creator online substitute', 'modern PDF24 alternative', 'free PDF software no download', 'private PDF tools'],
});

export default function PDF24AlternativePage() {
  const featuredTools = LIVE_TOOLS.slice(0, 10);

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at 85% 15%, rgba(94, 106, 210, 0.05), transparent 50%)' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-xxl)' }}>
          <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.08em' }}>
            PDF24 CREATOR ALTERNATIVE
          </span>
          <h1 className="display-sm" style={{ fontWeight: '800', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '36px', letterSpacing: '-0.5px' }}>
            The Modern, Web-Native Alternative to PDF24
          </h1>
          <p className="body-lg ink-muted" style={{ maxWidth: '700px', margin: '0 auto', lineHeight: '1.6', fontSize: '16px' }}>
            Process PDF documents in a sleek, modern interface directly inside your web browser. No bloated installer packages, zero file uploads, and 100% free.
          </p>
        </header>

        {/* Feature Comparison Table */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', fontSize: '20px' }}>
            PDF Section vs. PDF24
          </h2>

          <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline-strong)', backgroundColor: 'var(--surface-2)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--ink)' }}>Feature</th>
                  <th style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: '700' }}>PDF Section</th>
                  <th style={{ padding: '14px 18px', color: 'var(--ink-subtle)' }}>PDF24 Creator</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Interface & Design</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>✨ Modern Glassmorphic UX</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Legacy desktop UI</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Browser Native (No Download)</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>🌐 Works in Any Web Browser</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Requires desktop software install</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Client-Side Privacy</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>🛡️ 100% Local Tab Memory</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Server tools upload files</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Cross-Platform (Mac/Win/iOS/Android)</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>📱 100% Mobile & Desktop Ready</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Windows desktop focused</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Featured Tools Grid */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', fontSize: '20px' }}>
            Free Online PDF Tools
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
