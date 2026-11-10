import OfficeToPDFClient from '@/components/OfficeToPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Excel to PDF Converter — Free Online, No Upload',
  description: 'Convert Excel (.xlsx) to PDF free in your browser. Keeps cell colors, borders, merged cells, number formats and charts, and turns wide sheets to landscape. No sign-up.',
  route: '/excel-to-pdf',
  keywords: ['Excel to PDF', 'how to convert Excel to PDF', 'XLSX to PDF', 'Excel to PDF converter free online', 'convert Excel to PDF one page'],
});

// The FAQPage schema comes from ToolPageLayout, built from the visible FAQs in lib/seoToolContent.js.
const jsonLd = buildToolJsonLd({
  name: 'Excel to PDF Converter',
  description: 'Convert Excel .xlsx spreadsheets to PDF in your browser, keeping cell formatting, number formats and charts.',
  route: '/excel-to-pdf',
});

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OfficeToPDFClient toolId="excel-to-pdf" />
      <RelatedGuides route="/excel-to-pdf" />
    </>
  );
}
