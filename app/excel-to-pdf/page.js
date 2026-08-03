import OfficeToPDFClient from '@/components/OfficeToPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Excel to PDF Converter — Free Online & Private',
  description: 'Convert Excel spreadsheets (XLSX, XLS) to clean PDF documents. Preserve cell data and tables. 100% free, private, and runs in your browser.',
  route: '/excel-to-pdf',
  keywords: ['Excel to PDF', 'XLSX to PDF', 'convert Excel to PDF', 'free Excel to PDF converter', 'spreadsheet to PDF'],
});

const jsonLd = buildToolJsonLd({
  name: 'Excel to PDF Converter',
  description: 'Convert Excel spreadsheets (XLSX/XLS) into PDF format with tabular formatting preserved.',
  route: '/excel-to-pdf',
  faqs: [
    {
      question: 'How do I convert Excel to PDF online?',
      answer: 'Simply upload your XLSX file, click Convert to PDF, and download your formatted PDF document.',
    },
    {
      question: 'Is my spreadsheet data kept private?',
      answer: 'Yes, your spreadsheet files remain 100% private because all processing is performed locally in your browser.',
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
      <OfficeToPDFClient toolId="excel-to-pdf" />
    </>
  );
}
