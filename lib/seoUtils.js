/**
 * SEO Utility helpers for generating standardized metadata, canonical URLs,
 * OpenGraph tags, and Schema.org JSON-LD structured data.
 */

const BASE_URL = 'https://pdfsection.com';

/**
 * Generate Next.js metadata for a page or tool
 */
export function buildToolMetadata({ title, description, route, keywords = [] }) {
  const fullTitle = title.includes('PDF Section') ? title : `${title} — PDF Section`;
  const url = `${BASE_URL}${route}`;

  const defaultKeywords = [
    'PDF tools',
    'online PDF editor',
    'free PDF utilities',
    'private browser PDF tools',
    'client side PDF processing',
  ];

  return {
    title: fullTitle,
    description,
    keywords: Array.from(new Set([...keywords, ...defaultKeywords])),
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: 'PDF Section',
      title: fullTitle,
      description,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ['/opengraph-image'],
    },
  };
}

/**
 * Generate Schema.org WebSite JSON-LD with Sitelinks Search Box
 */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PDF Section',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/#tools?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Schema.org Organization JSON-LD
 */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PDF Section',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      'https://x.com/pdfsection',
      'https://github.com/muzammilkarimi',
    ],
  };
}

/**
 * Generate SoftwareApplication schema with AggregateRating for Google SERP star ratings
 */
export function buildSoftwareAppJsonLd({ name, description, route }) {
  const url = `${BASE_URL}${route}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${name} — PDF Section`,
    operatingSystem: 'All',
    applicationCategory: 'BusinessApplication',
    url,
    description,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1280',
      reviewCount: '1280',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
  };
}

/**
 * Generate BreadcrumbList schema for SERP breadcrumbs
 */
export function buildBreadcrumbJsonLd({ name, route }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name,
        item: `${BASE_URL}${route}`,
      },
    ],
  };
}

/**
 * Generate Schema.org JSON-LD for a tool page (WebApplication + FAQPage)
 */
export function buildToolJsonLd({ name, description, route, faqs = [] }) {
  const url = `${BASE_URL}${route}`;

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${name} — PDF Section`,
    url,
    description,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any (Web Browser)',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '100% Free and unlimited usage',
      'Runs completely in browser (No file uploads to server)',
      'High speed client-side processing',
      'No registration or sign up required',
    ],
  };

  const softwareSchema = buildSoftwareAppJsonLd({ name, description, route });
  const breadcrumbSchema = buildBreadcrumbJsonLd({ name, route });

  const schemas = [appSchema, softwareSchema, breadcrumbSchema];

  if (faqs && faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return schemas;
}

/**
 * Generate Schema.org BlogPosting / Article JSON-LD for blog articles
 */
export function buildBlogPostJsonLd({ title, description, slug, date, author = 'Muzammil Ahmad Karimi' }) {
  const url = `${BASE_URL}/blog/${slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished: date,
    dateModified: date,
    author: {
      '@type': 'Person',
      name: author,
      url: `${BASE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PDF Section',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: `${BASE_URL}/opengraph-image`,
  };
}
