import { notFound } from 'next/navigation';
import { PSEO_PAGES } from '@/lib/seoRegistry';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import HowToClientDispatcher from './HowToClientDispatcher';
import { SeoOverrideProvider } from '@/components/SeoOverrideContext';

export async function generateStaticParams() {
  return PSEO_PAGES.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const pageData = PSEO_PAGES.find((p) => p.slug === slug);

  if (!pageData) {
    return {
      title: 'Page Not Found',
    };
  }

  return buildToolMetadata({
    title: pageData.title,
    description: pageData.description,
    route: `/how-to/${slug}`,
    keywords: [pageData.toolTitle, 'how to', 'free online', 'client-side PDF'],
  });
}

export default async function HowToSlugPage({ params }) {
  const { slug } = await params;
  const pageData = PSEO_PAGES.find((p) => p.slug === slug);

  if (!pageData) {
    notFound();
  }

  const jsonLd = buildToolJsonLd({
    name: pageData.toolTitle,
    description: pageData.toolDescription || pageData.description,
    route: `/how-to/${slug}`,
    faqs: pageData.faqs,
    steps: pageData.steps,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoOverrideProvider
        value={{
          title: pageData.toolTitle,
          description: pageData.toolDescription || pageData.description,
          steps: pageData.steps,
          faqs: (pageData.faqs || []).map((faq) => ({ q: faq.question, a: faq.answer })),
        }}
      >
        <HowToClientDispatcher toolId={pageData.toolId} />
      </SeoOverrideProvider>
    </>
  );
}
export const dynamic = 'force-static';
