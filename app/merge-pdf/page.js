import MergePDFClient from './MergePDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Merge PDF — Combine PDF Files Online for Free',
  description: 'Combine multiple PDF files into a single document in seconds. Drag and drop to reorder pages. 100% free, private, and runs in your browser.',
  route: '/merge-pdf',
  keywords: ['Merge PDF', 'combine PDF files', 'join PDFs', 'PDF merger online', 'free PDF joiner'],
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
      answer: 'No! PDF Section allows unlimited file merging completely free.',
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
    </>
  );
}
