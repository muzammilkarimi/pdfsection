import Link from 'next/link';
import { buildToolMetadata } from '@/lib/seoUtils';
import { LIVE_TOOLS } from '@/lib/tools';

export const metadata = buildToolMetadata({
  title: 'Free PDF Security Tools — Protect, Unlock, Redact & Sign PDFs',
  description: '100% Client-side PDF security suite. Password protect, decrypt, permanently redact sensitive data, and stamp electronic signatures without uploading files.',
  route: '/security-pdf',
  keywords: ['PDF security tools', 'protect PDF password', 'unlock PDF online', 'redact PDF text free', 'sign PDF legally', 'private browser PDF security'],
});

export default function SecurityPDFHubPage() {
  const securityTools = LIVE_TOOLS.filter((t) => t.category === 'security' || ['protect-pdf', 'unlock-pdf', 'redact-pdf', 'sign-pdf'].includes(t.id));

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at 50% 10%, rgba(94, 106, 210, 0.05), transparent 60%)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-xxl)' }}>
          <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.08em' }}>
            SECURITY & PRIVACY HUB
          </span>
          <h1 className="display-sm" style={{ fontWeight: '800', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '38px', letterSpacing: '-0.5px' }}>
            Free PDF Security & Privacy Suite
          </h1>
          <p className="body-lg ink-muted" style={{ maxWidth: '680px', margin: '0 auto', lineHeight: '1.6', fontSize: '16px' }}>
            Protect, decrypt, redact, and sign your sensitive documents with 100% client-side security guarantees. Your files and passwords never leave your device.
          </p>
        </header>

        {/* Security Tools Grid */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
            {securityTools.map((t) => (
              <Link
                key={t.id}
                href={t.route}
                style={{
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-lg)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                  transition: 'all var(--duration-fast) var(--ease-default)'
                }}
              >
                <span style={{ fontWeight: '700', color: 'var(--ink)', fontSize: '16px' }}>🛡️ {t.title}</span>
                <span style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: '1.5' }}>{t.description}</span>
                <span style={{ fontSize: '12.5px', color: 'var(--primary)', fontWeight: '600', marginTop: 'auto' }}>Open Security Tool ➔</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
