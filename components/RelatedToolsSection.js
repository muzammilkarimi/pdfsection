import Link from 'next/link';
import { LIVE_TOOLS } from '@/lib/tools';
import { BLOG_POSTS } from '@/lib/blog';

export default function RelatedToolsSection({ currentRoute }) {
  // Select related tools excluding current route
  const relatedTools = LIVE_TOOLS.filter((t) => t.route !== currentRoute).slice(0, 6);
  const recentArticles = BLOG_POSTS.slice(0, 3);

  return (
    <section className="related-tools-section" style={{ marginTop: 'var(--space-xxl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--hairline)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Related PDF Tools */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)' }}>
            Related Free PDF Tools
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {relatedTools.map((tool) => (
              <li key={tool.id}>
                <Link
                  href={tool.route}
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-muted)',
                    textDecoration: 'none',
                    display: 'block',
                    padding: '6px 10px',
                    borderRadius: 'var(--rounded-sm)',
                    backgroundColor: 'var(--surface-1)',
                    border: '1px solid var(--hairline-strong)',
                    transition: 'all var(--duration-fast) var(--ease-default)'
                  }}
                >
                  {tool.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Learn & Guides */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)' }}>
            PDF Guides & Security Articles
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentArticles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/blog/${article.slug}`}
                  style={{
                    fontSize: '13px',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    lineHeight: '1.4',
                    display: 'block',
                  }}
                >
                  📖 {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
