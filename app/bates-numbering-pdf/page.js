import ToolPageLayout from '@/components/ToolPageLayout';
import { buildToolMetadata } from '@/lib/seoUtils';
import BatesNumberingPDFClient from './BatesNumberingPDFClient';

export const metadata = buildToolMetadata({
  title: 'Bates Numbering PDF — Free Legal Discovery Stamping Tool',
  description: 'Add sequential Bates numbers (e.g., CONFIDENTIAL-000001) to PDF pages online for legal proceedings, law firms, and corporate discovery.',
  route: '/bates-numbering-pdf',
  keywords: ['Bates numbering PDF', 'Bates stamp online free', 'legal document numbering', 'Bates prefix stamp', 'legal discovery PDF'],
});

export default function BatesNumberingPage() {
  return (
    <ToolPageLayout
      title="Bates Numbering PDF"
      description="Stamp custom sequential Bates numbers onto PDF pages for legal discovery, law firms, and court submissions."
      icon="hash"
      iconColor="var(--tool-edit)"
    >
      <BatesNumberingPDFClient />
    </ToolPageLayout>
  );
}
