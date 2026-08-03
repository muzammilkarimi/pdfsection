import ExtractPagesClient from './ExtractPagesClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Extract Pages from PDF — Save Specific PDF Pages',
  description: 'Extract specific pages from a PDF document into a new file. Select pages visually or specify page ranges. 100% free and private.',
  route: '/extract-pages',
  keywords: ['Extract pages from PDF', 'save specific PDF pages', 'PDF page extractor', 'extract PDF online', 'free PDF page extractor'],
});

const jsonLd = buildToolJsonLd({
  name: 'Extract PDF Pages Tool',
  description: 'Extract specific pages or page ranges from a PDF document into a standalone PDF.',
  route: '/extract-pages',
  faqs: [
    {
      question: 'How do I extract pages from a PDF?',
      answer: 'Select the pages you want to keep and click Extract Pages to download them as a new PDF document.',
    },
  ],
});

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExtractPagesClient />
    </>
  );
}
