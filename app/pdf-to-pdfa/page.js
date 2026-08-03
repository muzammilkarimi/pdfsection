import ToolPageLayout from '@/components/ToolPageLayout';
import { buildToolMetadata } from '@/lib/seoUtils';
import PDFToPDFAClient from './PDFToPDFAClient';

export const metadata = buildToolMetadata({
  title: 'PDF to PDF/A Converter — Free ISO Archival Standard Online',
  description: 'Convert PDF files to PDF/A (PDF/A-1b, PDF/A-2b, PDF/A-3b) format for long-term document archiving and court compliance with zero file uploads.',
  route: '/pdf-to-pdfa',
  keywords: ['PDF to PDF/A', 'convert PDF to PDFA', 'ISO 19005 converter', 'court PDF/A compliance', 'free archival PDF converter'],
});

export default function PDFToPDFAPage() {
  return (
    <ToolPageLayout
      title="Convert PDF to PDF/A"
      description="Convert standard PDF documents into ISO 19005 compliant PDF/A archival format for long-term preservation."
      icon="check"
      iconColor="var(--tool-convert-from)"
    >
      <PDFToPDFAClient />
    </ToolPageLayout>
  );
}
