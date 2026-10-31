import MergePDFClient from './MergePDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Merge PDF Files Online Free — Combine PDFs',
  description: 'Merge PDF files online: combine and join multiple PDFs into one document. Drag to reorder, then download. Free, no sign-up, files never leave your browser.',
  route: '/merge-pdf',
  keywords: ['merge PDF files', 'combine PDF files', 'combine PDF', 'join PDF', 'merge PDF online free', 'PDF merger'],
});

const jsonLd = buildToolJsonLd({
  name: 'Merge PDF Tool',
  description: 'Combine multiple PDF files into one organized PDF document with page reordering.',
  route: '/merge-pdf',
  faqs: [
    {
      question: 'How do I merge multiple PDFs into one file?',
      answer: 'Upload your PDF files, drag to reorder them in your preferred sequence, and click Merge PDF to download your combined document.',
    },
    {
      question: 'Is there a limit on how many PDFs I can merge?',
      answer: 'You can combine up to 20 PDF files at once, and merging is completely free. Run it again to combine more.',
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
      <MergePDFClient />
      <RelatedGuides route="/merge-pdf" />
    </>
  );
}
