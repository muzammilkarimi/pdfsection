import PDFToOfficeClient from '@/components/PDFToOfficeClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'PDF to Excel Converter — Extract Data to XLSX',
  description: 'Convert PDF tables and documents to editable Excel spreadsheets (XLSX). Free, fast, private, and runs entirely in your web browser.',
  route: '/pdf-to-excel',
  keywords: ['PDF to Excel', 'PDF to XLSX', 'extract PDF data to Excel', 'convert PDF to spreadsheet', 'free PDF to Excel'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF to Excel Converter',
  description: 'Extract PDF data and tables directly into Microsoft Excel spreadsheets (XLSX).',
  route: '/pdf-to-excel',
  faqs: [
    {
      question: 'Can I convert PDF tables to Excel cells?',
      answer: 'Yes! PDF Section extracts text content and structured table rows from your PDF directly into Excel spreadsheet format.',
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
      <PDFToOfficeClient toolId="pdf-to-excel" />
      <RelatedGuides route="/pdf-to-excel" />
    </>
  );
}
