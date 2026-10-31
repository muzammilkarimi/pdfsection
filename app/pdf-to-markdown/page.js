import PDFToMarkdownClient from './PDFToMarkdownClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'PDF to Markdown Converter — Extract PDF to MD Files',
  description: 'Convert PDF documents into formatted Markdown (.md) text files. Extract headings, lists, and paragraphs. 100% free, private, and fast.',
  route: '/pdf-to-markdown',
  keywords: ['PDF to Markdown', 'PDF to MD', 'convert PDF to Markdown', 'extract text to MD', 'free PDF to Markdown'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF to Markdown Converter',
  description: 'Convert PDF files into formatted Markdown (.md) files.',
  route: '/pdf-to-markdown',
  faqs: [
    {
      question: 'How do I convert a PDF to Markdown?',
      answer: 'Upload your PDF, click Convert to Markdown, and copy or download the generated .md text file.',
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
      <PDFToMarkdownClient />
      <RelatedGuides route="/pdf-to-markdown" />
    </>
  );
}
