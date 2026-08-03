import RepairPDFClient from './RepairPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Repair PDF Online — Fix Corrupted & Damaged PDF Files',
  description: 'Repair damaged or corrupted PDF files online. Rebuild PDF structures and recover page content. 100% free, private, and browser-based.',
  route: '/repair-pdf',
  keywords: ['Repair PDF', 'fix corrupted PDF', 'recover PDF file', 'repair damaged PDF', 'free PDF repair tool'],
});

const jsonLd = buildToolJsonLd({
  name: 'Repair PDF Tool',
  description: 'Analyze and repair corrupted or unreadable PDF document structures.',
  route: '/repair-pdf',
  faqs: [
    {
      question: 'Can I repair a unopenable PDF?',
      answer: 'PDF Section attempts to rebuild cross-reference tables and recover pages from corrupted PDF streams.',
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
      <RepairPDFClient />
    </>
  );
}
