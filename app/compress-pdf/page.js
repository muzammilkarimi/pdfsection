import CompressPDFClient from './CompressPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Compress PDF — Reduce PDF File Size Online',
  description: 'Reduce PDF file size while maintaining document quality. Choose from multiple compression levels. 100% free and private.',
  route: '/compress-pdf',
  keywords: ['Compress PDF', 'reduce PDF size', 'shrink PDF', 'PDF compressor online', 'free PDF size reducer'],
});

const jsonLd = buildToolJsonLd({
  name: 'Compress PDF Tool',
  description: 'Compress and shrink PDF document file size while preserving readability and image quality.',
  route: '/compress-pdf',
  faqs: [
    {
      question: 'How much can I compress my PDF?',
      answer: 'Compression ratio depends on embedded images and elements, typically reducing file size by 30% to 80%.',
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
      <CompressPDFClient />
    </>
  );
}
