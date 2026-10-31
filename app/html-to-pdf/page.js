import HTMLToPDFClient from './HTMLToPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'HTML to PDF Converter — Convert Code or Webpages to PDF',
  description: 'Convert HTML code snippets or web page content into PDF documents online. Free, fast, private, and runs in your browser.',
  route: '/html-to-pdf',
  keywords: ['HTML to PDF', 'convert HTML to PDF', 'webpage to PDF', 'HTML code to PDF', 'free HTML to PDF'],
});

const jsonLd = buildToolJsonLd({
  name: 'HTML to PDF Converter',
  description: 'Convert web pages or raw HTML markup directly into clean PDF documents.',
  route: '/html-to-pdf',
  faqs: [
    {
      question: 'Can I convert raw HTML code to PDF?',
      answer: 'Yes! You can paste raw HTML code directly or enter text markup to render it into a PDF file.',
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
      <HTMLToPDFClient />
      <RelatedGuides route="/html-to-pdf" />
    </>
  );
}
