import OfficeToPDFClient from '@/components/OfficeToPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Word to PDF Converter — Free Online & Private',
  description: 'Convert DOCX and DOC Word files to PDF with formatting, tables, images, and fonts intact. 100% free, private, and runs directly in your browser.',
  route: '/word-to-pdf',
  keywords: ['Word to PDF', 'DOCX to PDF', 'convert Word to PDF online', 'free Word to PDF converter', 'private DOCX converter'],
});

const jsonLd = buildToolJsonLd({
  name: 'Word to PDF Converter',
  description: 'Convert Word documents (DOCX/DOC) to PDF with full layout and image formatting preserved.',
  route: '/word-to-pdf',
  faqs: [
    {
      question: 'Is Word to PDF conversion free?',
      answer: 'Yes, PDF Section offers 100% free Word to PDF conversion with no limits, registration, or file size restrictions.',
    },
    {
      question: 'Are my Word files uploaded to a server?',
      answer: 'No. All processing happens 100% locally in your web browser. Your document content never leaves your computer.',
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
      <OfficeToPDFClient toolId="word-to-pdf" />
      <RelatedGuides route="/word-to-pdf" />
    </>
  );
}
