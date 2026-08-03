import ComparePDFClient from './ComparePDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Compare PDF Files — Visual & Text Diff Tool',
  description: 'Compare two PDF documents side-by-side to highlight visual changes, text edits, and differences instantly. Free and private.',
  route: '/compare-pdf',
  keywords: ['Compare PDF', 'PDF diff tool', 'compare two PDFs online', 'visual PDF comparison', 'free PDF compare'],
});

const jsonLd = buildToolJsonLd({
  name: 'Compare PDF Tool',
  description: 'Side-by-side visual and structural diff tool to compare two PDF files and highlight differences.',
  route: '/compare-pdf',
  faqs: [
    {
      question: 'How does PDF comparison work?',
      answer: 'Upload two PDF documents, and PDF Section will render side-by-side pages with highlighted visual and text differences.',
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
      <ComparePDFClient />
    </>
  );
}
