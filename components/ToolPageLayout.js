'use client';

import { usePathname } from 'next/navigation';
import { ToolIcon } from './Icons';
import { getToolByRoute } from '@/lib/tools';
import { SEO_TOOL_CONTENT, DEFAULT_SEO_CONTENT } from '@/lib/seoMetadata';

export default function ToolPageLayout({
  title,
  description,
  icon,
  iconColor,
  children,
  showHeader = true,
  layoutMode = 'page-scroll',
}) {
  const pathname = usePathname();
  const tool = getToolByRoute(pathname);
  const toolId = tool ? tool.id : null;
  const seoData = (toolId && SEO_TOOL_CONTENT[toolId]) || DEFAULT_SEO_CONTENT;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': `${title} - PDF Section`,
    'description': description,
    'url': `https://pdfsection.com${pathname}`,
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'All',
    'browserRequirements': 'Requires JavaScript. Requires HTML5.',
    'offers': {
      '@type': 'Offer',
      'price': '0.00',
      'priceCurrency': 'USD'
    },
    'step': seoData.steps.map((step, idx) => ({
      '@type': 'HowToStep',
      'position': idx + 1,
      'text': step
    }))
  };

  return (
    <main className={`main tool-page-shell tool-layout-${layoutMode}`}>
      {/* JSON-LD Structured Schema Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container">
        <div className="tool-page page-enter">
          {showHeader && (
            <div className="tool-page-header">
              <div
                className="tool-page-icon"
                style={{
                  backgroundColor: `color-mix(in srgb, ${iconColor || 'var(--primary)'} 14%, var(--surface-2))`,
                  color: iconColor || 'var(--primary)',
                }}
              >
                <ToolIcon name={icon || 'pdf'} size={22} />
              </div>
              <div className="tool-page-heading">
                <h1 className="tool-page-title">{title}</h1>
                <p className="tool-page-description">{description}</p>
              </div>
            </div>
          )}
          <div className="tool-page-body">{children}</div>


        </div>
      </div>
    </main>
  );
}
