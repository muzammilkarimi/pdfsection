import PDFToJPGClient from './PDFToJPGClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'PDF to JPG Converter — Extract Images from PDF',
  description: 'Convert PDF pages into high-resolution JPG or PNG images online. Free, fast, private, and runs directly in your browser.',
  route: '/pdf-to-jpg',
  keywords: ['PDF to JPG', 'PDF to PNG', 'convert PDF pages to images', 'extract images from PDF', 'free PDF to JPG'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF to JPG Converter',
  description: 'Convert PDF document pages into high-quality JPG or PNG images.',
  route: '/pdf-to-jpg',
  faqs: [
    {
      question: 'Can I extract high resolution images from PDF?',
      answer: 'Yes! PDF Section renders each PDF page into high-quality JPG or PNG image files.',
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
      <PDFToJPGClient />
      <RelatedGuides route="/pdf-to-jpg" />
    </>
  );
}
