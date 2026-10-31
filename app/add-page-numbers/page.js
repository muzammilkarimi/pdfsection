import AddPageNumbersClient from './AddPageNumbersClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Add Page Numbers to PDF — Number PDF Pages Online',
  description: 'Add page numbers to PDF documents online. Choose position, font size, margin, and numbering format. 100% free, private, and fast.',
  route: '/add-page-numbers',
  keywords: ['Add page numbers to PDF', 'number PDF pages', 'PDF page numbering', 'add footer page numbers', 'free PDF page numberer'],
});

const jsonLd = buildToolJsonLd({
  name: 'Add Page Numbers Tool',
  description: 'Add customizable page numbers and footers to PDF documents.',
  route: '/add-page-numbers',
  faqs: [
    {
      question: 'Where can I position the page numbers?',
      answer: 'You can position page numbers at top-left, top-center, top-right, bottom-left, bottom-center, or bottom-right.',
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
      <AddPageNumbersClient />
      <RelatedGuides route="/add-page-numbers" />
    </>
  );
}
