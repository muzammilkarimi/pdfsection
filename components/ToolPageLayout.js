'use client';

import { usePathname } from 'next/navigation';
import { ToolIcon } from './Icons';
import ToolGuideSection from './ToolGuideSection';
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
  showGuide = false,
}) {
  const pathname = usePathname();
  const tool = getToolByRoute(pathname);
  const toolId = tool ? tool.id : null;
  const seoData = (toolId && SEO_TOOL_CONTENT[toolId]) || DEFAULT_SEO_CONTENT;

  const appSchema = {
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
    'step': (seoData.steps || []).map((step, idx) => ({
      '@type': 'HowToStep',
      'position': idx + 1,
      'text': step
    }))
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': `${title} - PDF Section`,
    'operatingSystem': 'All',
    'applicationCategory': 'BusinessApplication',
    'url': `https://pdfsection.com${pathname}`,
    'description': description,
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'ratingCount': '1280',
      'reviewCount': '1280',
      'bestRating': '5',
      'worstRating': '1',
    },
    'offers': {
      '@type': 'Offer',
      'price': '0.00',
      'priceCurrency': 'USD',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://pdfsection.com',
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': title.split('—')[0].trim(),
        'item': `https://pdfsection.com${pathname}`,
      },
    ],
  };

  const schemas = [appSchema, softwareSchema, breadcrumbSchema];

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
      {/* JSON-LD Structured Schema Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
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

          {/* How to Use / Benefits / FAQ Guide Block */}
          {showGuide && (
            <ToolGuideSection title={title} seoData={seoData} />
          )}
        </div>
      </div>
    </main>
  );
}
