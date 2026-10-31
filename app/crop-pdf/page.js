import CropPDFClient from './CropPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Crop PDF Online — Trim Page Margins & Borders',
  description: 'Crop PDF page margins and trim borders visually. Adjust page boundaries with custom margins. 100% free, private, and runs in your browser.',
  route: '/crop-pdf',
  keywords: ['Crop PDF', 'trim PDF margins', 'crop PDF pages online', 'adjust PDF page size', 'free PDF crop tool'],
});

const jsonLd = buildToolJsonLd({
  name: 'Crop PDF Tool',
  description: 'Visually crop PDF document margins and trim page dimensions directly in your web browser.',
  route: '/crop-pdf',
  faqs: [
    {
      question: 'Can I crop specific margins on a PDF?',
      answer: 'Yes! PDF Section allows you to visually drag crop handles or enter numeric margin values to trim PDF pages.',
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
      <CropPDFClient />
      <RelatedGuides route="/crop-pdf" />
    </>
  );
}
