import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import PDFToPDFAClient from './PDFToPDFAClient';

export const metadata = buildToolMetadata({
  title: 'PDF to PDF/A Converter — Free ISO Archival Standard Online',
  description: 'Convert PDF files to PDF/A (PDF/A-1b, PDF/A-2b, PDF/A-3b) format for long-term document archiving and court compliance with zero file uploads.',
  route: '/pdf-to-pdfa',
  keywords: ['PDF to PDF/A', 'convert PDF to PDFA', 'ISO 19005 converter', 'court PDF/A compliance', 'free archival PDF converter'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF to PDF/A Converter',
  description: 'Convert standard PDF documents into ISO 19005 compliant PDF/A archival format for long-term preservation.',
  route: '/pdf-to-pdfa',
  faqs: [
    {
      question: 'What is PDF/A format?',
      answer: 'PDF/A is an ISO-standardized version of the Portable Document Format (PDF) specialized for use in the archiving and long-term preservation of electronic documents.',
    },
    {
      question: 'Is conversion to PDF/A done locally?',
      answer: 'Yes, PDF Section processes everything client-side inside your browser. No files are uploaded to our servers, ensuring absolute privacy.',
    }
  ],
});

export default function PDFToPDFAPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PDFToPDFAClient />
    </>
  );
}
