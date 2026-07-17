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

          {/* SEO Instructions and FAQs Section */}
          {layoutMode === 'page-scroll' && (
            <section className="tool-seo-section" aria-label={`Instructions and FAQs for ${title}`}>
              <div className="tool-seo-container">
                <div className="tool-seo-grid">
                  {/* How-To Column */}
                  <div className="seo-card seo-how-to-card">
                    <h2 className="body-lg" style={{ fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ToolIcon name="reorder" size={18} style={{ color: 'var(--primary)' }} />
                      How to use {title}
                    </h2>
                    <ol className="seo-steps-list">
                      {seoData.steps.map((step, index) => (
                        <li key={index} className="seo-step-item">
                          <span className="seo-step-number">{index + 1}</span>
                          <p className="body-sm ink-muted">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* FAQ Accordion Column */}
                  <div className="seo-card seo-faq-card">
                    <h2 className="body-lg" style={{ fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ToolIcon name="forms" size={18} style={{ color: 'var(--primary)' }} />
                      Frequently Asked Questions
                    </h2>
                    <div className="seo-faq-list">
                      {seoData.faqs.map((faq, index) => (
                        <div key={index} className="seo-faq-item">
                          <h3 className="body-sm" style={{ fontWeight: 600, color: 'var(--ink)' }}>{faq.q}</h3>
                          <p className="body-sm ink-muted" style={{ marginTop: 4, lineHeight: 1.5 }}>{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
