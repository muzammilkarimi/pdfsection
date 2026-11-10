import Link from 'next/link';
import { buildToolMetadata } from '@/lib/seoUtils';
import { LIVE_TOOLS } from '@/lib/tools';

export const metadata = buildToolMetadata({
  title: 'Free iLovePDF Alternative — Private PDF Tools in Your Browser',
  description: 'Looking for a private, free alternative to iLovePDF? PDF Section processes your files in your browser, with no file uploads and no sign-up.',
  route: '/ilovepdf-alternative',
  keywords: ['iLovePDF alternative', 'private iLovePDF substitute', 'free online PDF tools no upload', 'browser PDF editor', 'secure PDF tools'],
});

export default function ILovePDFAlternativePage() {
  const featuredTools = LIVE_TOOLS.slice(0, 8);

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at 10% 20%, rgba(94, 106, 210, 0.05), transparent 50%)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-xxl)' }}>
          <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.08em' }}>
            PRIVACY COMPARISON & ALTERNATIVE
          </span>
          <h1 className="display-sm" style={{ fontWeight: '800', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '36px' }}>
            The Private, In-Browser Alternative to iLovePDF
          </h1>
          <p className="body-lg ink-muted" style={{ maxWidth: '680px', margin: '0 auto', lineHeight: '1.6', fontSize: '16px' }}>
            Why upload confidential contracts, tax forms, and financial statements to remote servers when you can merge, split, compress, edit, sign, and convert PDFs 100% locally in your browser?
          </p>
        </header>

        {/* Feature Comparison Table */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', fontSize: '20px' }}>
            Feature & Privacy Comparison
          </h2>

          <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline-strong)', backgroundColor: 'var(--surface-2)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--ink)' }}>Feature</th>
                  <th style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: '700' }}>PDF Section</th>
                  <th style={{ padding: '14px 18px', color: 'var(--ink-subtle)' }}>iLovePDF</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>File Uploads Required?</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>❌ Never (100% Local Browser)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>⚠️ Yes (Uploaded to Remote Servers)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Data Privacy & Compliance</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>🛡️ Files are processed on your device</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Server storage logs</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Daily Processing Limits</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>♾️ Unlimited Free Usage</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Daily free caps & paywalls</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Account Registration</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>No Registration Needed</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Sign-ups forced for large files</td>
                </tr>
                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--ink)' }}>Processing Speed</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: '700' }}>⚡ Instant (Zero Network Lag)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--ink-muted)' }}>Network upload/download wait times</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Featured Tools Grid */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', fontSize: '20px' }}>
            Explore Free Local PDF Tools
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
