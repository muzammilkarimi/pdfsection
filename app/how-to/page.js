import Link from 'next/link';
import { PSEO_PAGES } from '@/lib/seoRegistry';
import { getToolById } from '@/lib/tools';
import { buildToolMetadata, buildBreadcrumbJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'PDF How-To Guides — Free Step-by-Step Tutorials',
  description:
    'Step-by-step guides for common PDF tasks: compress a PDF to a target size, merge, split, sign, unlock, redact and more. Every guide uses a free, private in-browser tool.',
  route: '/how-to',
  keywords: ['PDF how to guides', 'PDF tutorials', 'how to compress PDF', 'how to merge PDF', 'PDF tips'],
});

const breadcrumbJsonLd = buildBreadcrumbJsonLd({ name: 'How-To Guides', route: '/how-to' });

function groupByTool() {
  const groups = new Map();
  for (const page of PSEO_PAGES) {
    const tool = getToolById(page.toolId);
    const key = page.toolId;
    if (!groups.has(key)) {
      groups.set(key, { name: tool?.name || page.toolTitle, route: tool?.route, pages: [] });
    }
    groups.get(key).pages.push(page);
  }
  return Array.from(groups.values()).sort((a, b) => b.pages.length - a.pages.length);
}

export default function HowToIndexPage() {
  const groups = groupByTool();

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container" style={{ maxWidth: '900px' }}>
        <header style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 className="display-sm" style={{ fontWeight: '800', marginBottom: 'var(--space-xs)' }}>
            PDF How-To Guides
          </h1>
          <p className="body-sm ink-muted" style={{ lineHeight: 1.6 }}>
            Step-by-step guides for common PDF tasks. Each one opens a free tool that runs in your browser, so your files stay on your device.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {groups.map((group) => (
            <section key={group.name} aria-label={group.name}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                {group.route ? <Link href={group.route}>{group.name}</Link> : group.name}
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.pages.map((page) => (
                  <li key={page.slug}>
                    <Link href={`/how-to/${page.slug}`} style={{ fontWeight: 600 }}>
                      {page.title.split('—')[0].trim()}
                    </Link>
                    <span className="ink-subtle" style={{ display: 'block', fontSize: '13.5px', lineHeight: 1.5 }}>
                      {page.description}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
