import Link from 'next/link';
import { PSEO_PAGES } from '@/lib/seoRegistry';
import { getToolByRoute } from '@/lib/tools';

/**
 * Server component: links a tool page to its long-tail how-to guides so each guide
 * has a relevant internal link (not only a sitemap entry). Renders nothing if the
 * tool has no guides.
 */
export default function RelatedGuides({ route }) {
  const tool = getToolByRoute(route);
  if (!tool) return null;

  const guides = PSEO_PAGES.filter((page) => page.toolId === tool.id);
  if (guides.length === 0) return null;

  return (
    <section className="container related-guides" aria-label={`${tool.name} guides`} style={{ paddingBottom: 'var(--space-xxl)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
        {tool.name} guides
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link href={`/how-to/${guide.slug}`} style={{ fontWeight: 600 }}>
              {guide.title.split('—')[0].trim()}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
