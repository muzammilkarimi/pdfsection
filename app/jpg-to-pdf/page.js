import JPGToPDFClient from './JPGToPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'JPG to PDF Converter — Convert Images to PDF',
  description: 'Convert JPG, PNG, WEBP, and BMP images into a clean PDF document. Reorder images and adjust margins. 100% free and private.',
  route: '/jpg-to-pdf',
  keywords: ['JPG to PDF', 'PNG to PDF', 'convert image to PDF', 'images to PDF document', 'free JPG converter'],
});

const jsonLd = buildToolJsonLd({
  name: 'JPG to PDF Converter',
  description: 'Convert images (JPG, PNG, WEBP) into a single formatted PDF document.',
  route: '/jpg-to-pdf',
  faqs: [
    {
      question: 'Can I combine multiple images into one PDF?',
      answer: 'Yes! You can upload multiple JPG or PNG images and combine them into a single PDF document.',
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
      <JPGToPDFClient />
      <RelatedGuides route="/jpg-to-pdf" />
    </>
  );
}
