import OCRPDFClient from './OCRPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'OCR PDF Online — Convert Scanned PDFs to Searchable Text',
  description: 'Optical Character Recognition (OCR) for scanned PDF documents. Extract selectable and searchable text from scanned pages. Free & private.',
  route: '/ocr-pdf',
  keywords: ['OCR PDF', 'make PDF searchable', 'optical character recognition PDF', 'extract text from scan', 'free OCR PDF'],
});

const jsonLd = buildToolJsonLd({
  name: 'OCR PDF Tool',
  description: 'Optical character recognition tool to extract selectable text from scanned PDF files.',
  route: '/ocr-pdf',
  faqs: [
    {
      question: 'How does OCR PDF work?',
      answer: 'It uses Tesseract OCR in your browser to scan image pixels and convert printed characters into searchable text.',
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
      <OCRPDFClient />
      <RelatedGuides route="/ocr-pdf" />
    </>
  );
}
