import RotatePDFClient from './RotatePDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Rotate PDF — Rotate PDF Pages Online for Free',
  description: 'Rotate PDF pages clockwise or counterclockwise. Rotate individual pages or all pages at once. 100% free, fast, and private.',
  route: '/rotate-pdf',
  keywords: ['Rotate PDF', 'rotate PDF pages', 'turn PDF pages', 'PDF rotator online', 'free PDF rotate'],
});

const jsonLd = buildToolJsonLd({
  name: 'Rotate PDF Tool',
  description: 'Rotate individual pages or entire PDF documents clockwise or counterclockwise.',
  route: '/rotate-pdf',
  faqs: [
    {
      question: 'Can I rotate specific pages in a PDF?',
      answer: 'Yes! You can rotate individual pages 90°, 180°, or 270° degrees, or rotate all pages at once.',
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
      <RotatePDFClient />
    </>
  );
}
