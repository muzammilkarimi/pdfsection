import CompressPDFClient from './CompressPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Compress PDF Online Free — Reduce PDF File Size',
  description: 'Compress PDF online for free and reduce file size to fit email limits. Pick a compression level and keep text sharp. No upload, no sign-up, 100% private.',
  route: '/compress-pdf',
  keywords: ['compress PDF online', 'compress PDF free', 'reduce PDF size', 'reduce PDF file size', 'shrink PDF', 'PDF compressor'],
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
      <RelatedGuides route="/compress-pdf" />
    </>
  );
}
