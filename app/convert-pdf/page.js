import Link from 'next/link';
import { buildToolMetadata } from '@/lib/seoUtils';
import { LIVE_TOOLS } from '@/lib/tools';

export const metadata = buildToolMetadata({
  title: 'Free PDF Converters — Convert Word, Excel, Images & HTML to PDF',
  description: 'Convert PDF files to and from Word, Excel, PowerPoint, JPG, PNG, Markdown, and HTML. 100% free client-side file conversion directly inside your browser tab.',
  route: '/convert-pdf',
  keywords: ['PDF converter free', 'convert PDF to Word', 'Word to PDF online', 'Excel to PDF', 'JPG to PDF', 'HTML to PDF', 'private PDF converter'],
});

export default function ConvertPDFHubPage() {
  const converterTools = LIVE_TOOLS.filter((t) => t.category === 'convert' || t.id.includes('pdf-to') || t.id.includes('-to-pdf'));

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at 50% 10%, rgba(94, 106, 210, 0.05), transparent 60%)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-xxl)' }}>
          <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.08em' }}>
            MASTER CONVERTER HUB
          </span>
          <h1 className="display-sm" style={{ fontWeight: '800', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '38px', letterSpacing: '-0.5px' }}>
            Free Online PDF Converters
          </h1>
          <p className="body-lg ink-muted" style={{ maxWidth: '680px', margin: '0 auto', lineHeight: '1.6', fontSize: '16px' }}>
            Convert documents to and from PDF format with zero file uploads. All formatting is preserved using browser-native client-side conversion engines.
          </p>
        </header>

        {/* Tools Grid */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
            {converterTools.map((t) => (
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
                <span style={{ fontWeight: '700', color: 'var(--ink)', fontSize: '16px' }}>{t.title}</span>
                <span style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: '1.5' }}>{t.description}</span>
                <span style={{ fontSize: '12.5px', color: 'var(--primary)', fontWeight: '600', marginTop: 'auto' }}>Open Converter ➔</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
