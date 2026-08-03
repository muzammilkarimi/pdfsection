import Link from 'next/link';
import { LIVE_TOOLS } from '@/lib/tools';
import { ToolIcon } from './Icons';

export default function RelatedToolsSection({ currentRoute }) {
  // Select related tools excluding current route
  const relatedTools = LIVE_TOOLS.filter((t) => t.route !== currentRoute).slice(0, 6);

  return (
    <section className="related-tools-section" style={{ marginTop: 'var(--space-xxl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--hairline)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
        Related Free PDF Tools
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
        {relatedTools.map((tool) => (
          <li key={tool.id}>
            <Link
              href={tool.route}
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--ink)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: 'var(--rounded-md)',
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--hairline-strong)',
                transition: 'all var(--duration-fast) var(--ease-default)'
              }}
            >
              <ToolIcon name={tool.icon || 'pdf'} size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>{tool.name || tool.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
