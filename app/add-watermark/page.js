import WatermarkPDFClient from './WatermarkPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Add Watermark to PDF — Text & Stamp Watermarking',
  description: 'Add custom text watermarks, stamps, or logos to your PDF pages online. Customize font size, rotation, opacity, and position. Free & private.',
  route: '/add-watermark',
  keywords: ['Add Watermark to PDF', 'PDF watermark online', 'stamp PDF', 'watermark PDF pages', 'free PDF watermark'],
});

const jsonLd = buildToolJsonLd({
  name: 'Add Watermark to PDF Tool',
  description: 'Add customizable text watermarks, stamps, or logos across PDF pages.',
  route: '/add-watermark',
  faqs: [
    {
      question: 'Can I customize the watermark text and opacity?',
      answer: 'Yes, you can customize text, font size, rotation angle, opacity, and positioning.',
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
      <WatermarkPDFClient />
      <RelatedGuides route="/add-watermark" />
    </>
  );
}
