import RemovePagesClient from './RemovePagesClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Remove Pages from PDF — Delete PDF Pages Online',
  description: 'Delete unwanted pages from your PDF file online. Select pages visually to remove and download a clean PDF. Free & private.',
  route: '/remove-pages',
  keywords: ['Remove pages from PDF', 'delete PDF pages', 'remove PDF pages online', 'PDF page remover', 'free PDF page remover'],
});

const jsonLd = buildToolJsonLd({
  name: 'Remove PDF Pages Tool',
  description: 'Selectively remove and delete unwanted pages from PDF files.',
  route: '/remove-pages',
  faqs: [
    {
      question: 'How do I delete specific pages from a PDF?',
      answer: 'Select the pages you want to delete by clicking page thumbnails, then click Remove Pages to download the updated file.',
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
      <RemovePagesClient />
    </>
  );
}
