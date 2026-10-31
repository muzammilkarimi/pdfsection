import SplitPDFClient from './SplitPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Split PDF — Separate PDF Pages Online for Free',
  description: 'Split PDF files into individual pages or specific page ranges. Fast, free, private, and works directly in your web browser.',
  route: '/split-pdf',
  keywords: ['Split PDF', 'separate PDF pages', 'extract PDF pages', 'PDF splitter online', 'free PDF splitter'],
});

const jsonLd = buildToolJsonLd({
  name: 'Split PDF Tool',
  description: 'Separate PDF pages into individual documents or extract custom page ranges.',
  route: '/split-pdf',
  faqs: [
    {
      question: 'How do I split pages from a PDF?',
      answer: 'Select your PDF, choose specific pages or page ranges, and click Split PDF to download the separated documents.',
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
      <SplitPDFClient />
      <RelatedGuides route="/split-pdf" />
    </>
  );
}
