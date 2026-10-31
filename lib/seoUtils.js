/**
 * SEO Utility helpers for generating standardized metadata, canonical URLs,
 * OpenGraph tags, and Schema.org JSON-LD structured data.
 */

const BASE_URL = 'https://pdfsection.com';

/**
 * Generate Next.js metadata for a page or tool
 */
export function buildToolMetadata({ title, description, route, keywords = [], ogType = 'website' }) {
  // The root layout's title template already appends " | PDF Section", so only titles
  // that carry the brand themselves are set as absolute to avoid a doubled suffix.
  const hasBrand = title.includes('PDF Section');
  const fullTitle = hasBrand ? title : `${title} | PDF Section`;
  const url = `${BASE_URL}${route}`;

  const defaultKeywords = [
    'PDF tools',
    'online PDF editor',
    'free PDF utilities',
    'private browser PDF tools',
    'client side PDF processing',
  ];

  return {
    title: hasBrand ? { absolute: title } : title,
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
      type: ogType,
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
 * Generate SoftwareApplication schema. No aggregateRating: only add one if it is backed by real, visible user reviews.
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
export function buildBreadcrumbJsonLd({ name, route, parent }) {
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
      ...(parent
        ? [{ '@type': 'ListItem', position: 2, name: parent.name, item: `${BASE_URL}${parent.route}` }]
        : []),
      {
        '@type': 'ListItem',
        position: parent ? 3 : 2,
        name,
        item: `${BASE_URL}${route}`,
      },
    ],
  };
}

/**
 * Generate Schema.org JSON-LD for a tool page (WebApplication + FAQPage)
 */
export function buildToolJsonLd({ name, description, route, faqs = [], steps = [] }) {
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

  if (steps && steps.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to ${name.replace(' — PDF Section', '')}`,
      description,
      step: steps.map((stepText, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: `Step ${idx + 1}`,
        text: stepText,
        url: `${url}#step-${idx + 1}`,
      })),
    });
  }

  // FAQPage is emitted by ToolPageLayout from the FAQs actually rendered on the page,
  // so `faqs` here is intentionally not turned into a second FAQPage block.
  return schemas;
}

/**
 * Generate Schema.org BlogPosting / Article JSON-LD for blog articles
 */
export function buildBlogPostJsonLd({ title, description, slug, date, updated, author = 'Muzammil Ahmad Karimi' }) {
  const url = `${BASE_URL}/blog/${slug}`;
  // Google requires ISO 8601 dates; blog data stores human-readable strings.
  const isoDate = new Date(`${date} UTC`).toISOString().slice(0, 10);
  const isoModified = updated ? new Date(`${updated} UTC`).toISOString().slice(0, 10) : isoDate;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished: isoDate,
    dateModified: isoModified,
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
    image: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/opengraph-image`,
      width: 1200,
      height: 630,
    },
  };
}
