import PDFToPDFAClient from './PDFToPDFAClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'PDF to PDF/A Converter — Archival PDF Compliance',
  description: 'Convert standard PDF documents into ISO-compliant PDF/A format for long-term archiving and document preservation. Free & private.',
  route: '/pdf-to-pdfa',
  keywords: ['PDF to PDF/A', 'convert PDF to PDF/A', 'archival PDF converter', 'ISO compliant PDF', 'free PDF/A converter'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF to PDF/A Converter',
  description: 'Convert standard PDF files into ISO-compliant PDF/A files for long-term archiving.',
  route: '/pdf-to-pdfa',
  faqs: [
    {
      question: 'What is PDF/A format?',
      answer: 'PDF/A is an ISO-standardized version of PDF specialized for archiving and long-term preservation of digital documents.',
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
      <PDFToPDFAClient />
    </>
  );
}
