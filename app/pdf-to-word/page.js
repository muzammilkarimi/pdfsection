import PDFToOfficeClient from '@/components/PDFToOfficeClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'PDF to Word Converter — Free Online & Editable DOCX',
  description: 'Convert PDF files to editable DOCX Word documents online. Preserve text structure, paragraphs, and tables. 100% free, fast, and private.',
  route: '/pdf-to-word',
  keywords: ['PDF to Word', 'PDF to DOCX', 'convert PDF to Word', 'editable DOCX converter', 'free PDF to Word online'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF to Word Converter',
  description: 'Convert PDF documents into editable Microsoft Word DOCX files directly in your web browser.',
  route: '/pdf-to-word',
  faqs: [
    {
      question: 'Can I edit the converted Word document?',
      answer: 'Yes! The resulting DOCX file can be opened and edited in Microsoft Word, Google Docs, or LibreOffice.',
    },
    {
      question: 'Is my PDF document safe?',
      answer: 'Absolutely. All processing occurs 100% inside your web browser. Your document is never uploaded to any cloud server.',
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
      <PDFToOfficeClient toolId="pdf-to-word" />
      <RelatedGuides route="/pdf-to-word" />
    </>
  );
}
