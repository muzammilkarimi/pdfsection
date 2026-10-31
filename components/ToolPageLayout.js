'use client';

import { usePathname } from 'next/navigation';
import { ToolIcon } from './Icons';
import ToolGuideSection from './ToolGuideSection';
import RelatedToolsSection from './RelatedToolsSection';
import { getToolByRoute } from '@/lib/tools';
import { useSeoOverride } from './SeoOverrideContext';
import { SEO_TOOL_CONTENT, DEFAULT_SEO_CONTENT } from '@/lib/seoMetadata';

export default function ToolPageLayout({
  title: titleProp,
  description: descriptionProp,
  icon,
  iconColor,
  children,
  showHeader = true,
  layoutMode = 'page-scroll',
  showGuide = false,
}) {
  const pathname = usePathname();
  const tool = getToolByRoute(pathname);
  const toolId = tool ? tool.id : null;
  const override = useSeoOverride();
  const title = override?.title || titleProp;
  const description = override?.description || descriptionProp;
  // Content is keyed by tool id or, for tools whose id differs from their route, by route slug.
  const baseSeoData =
    (toolId && SEO_TOOL_CONTENT[toolId]) ||
    SEO_TOOL_CONTENT[pathname.replace(/^\//, '')] ||
    DEFAULT_SEO_CONTENT;
  const seoData = override
    ? { ...baseSeoData, steps: override.steps || baseSeoData.steps, faqs: override.faqs || baseSeoData.faqs }
    : baseSeoData;

  // WebApplication, breadcrumb and HowTo schema come from each page's buildToolJsonLd();
  // this layout only emits the FAQPage so it always matches the FAQs shown on the page.
  const schemas = [];

  if (seoData.faqs && seoData.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': seoData.faqs.map((faq) => ({
        '@type': 'Question',
        'name': faq.q || faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.a || faq.answer
        }
      }))
    });
  }

  return (
    <main className={`main tool-page-shell tool-layout-${layoutMode}`}>
      {/* FAQ structured data, matching the visible FAQ section */}
      {schemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />
      )}
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

          {/* Related Tools Internal Link Network */}
          <RelatedToolsSection currentRoute={pathname} />

          {/* How to Use / Benefits / FAQ Guide Block */}
          {(showGuide || layoutMode === 'page-scroll') && (
            <ToolGuideSection title={title} seoData={seoData} />
          )}
        </div>
      </div>
    </main>
  );
}
