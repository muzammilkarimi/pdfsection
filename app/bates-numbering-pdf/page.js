import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import BatesNumberingPDFClient from './BatesNumberingPDFClient';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Bates Numbering PDF — Free Legal Discovery Stamping Tool',
  description: 'Add sequential Bates numbers (e.g., CONFIDENTIAL-000001) to PDF pages online for legal proceedings, law firms, and corporate discovery.',
  route: '/bates-numbering-pdf',
  keywords: ['Bates numbering PDF', 'Bates stamp online free', 'legal document numbering', 'Bates prefix stamp', 'legal discovery PDF'],
});

const jsonLd = buildToolJsonLd({
  name: 'Bates Numbering PDF Tool',
  description: 'Stamp custom sequential Bates numbers onto PDF pages for legal discovery, law firms, and court submissions.',
  route: '/bates-numbering-pdf',
  faqs: [
    {
      question: 'What is Bates numbering?',
      answer: 'Bates numbering (or Bates stamping) is a method of indexing and identifying legal and corporate documents by placing sequential identifying numbers, prefixes, or labels on each page.',
    },
    {
      question: 'Is bates stamping secure on PDF Section?',
      answer: 'Yes, Bates numbering is processed completely locally in your browser memory. Your documents never touch any server, keeping sensitive litigation files fully private.',
    }
  ],
});

export default function BatesNumberingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BatesNumberingPDFClient />
      <RelatedGuides route="/bates-numbering-pdf" />
    </>
  );
}
