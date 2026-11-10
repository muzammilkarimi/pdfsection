import AISummarizerClient from './AISummarizerClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'PDF Summarizer — Pull the Key Sentences From Any PDF',
  description: 'Summarize long PDF documents in your browser. It picks out the most important sentences so you can skim fast. Free, with no file upload.',
  route: '/ai-summarizer',
  keywords: ['PDF summarizer', 'summarize PDF online', 'summarize PDF free', 'PDF key points', 'PDF summary'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF Summarizer',
  description: 'Pick out the most important sentences from a long PDF document.',
  route: '/ai-summarizer',
  faqs: [
    {
      question: 'How does the PDF Summarizer work?',
      answer: 'It scores each sentence by how important its words are and returns the top ones. It picks existing sentences rather than writing new text, and it runs in your browser.',
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
      <AISummarizerClient />
      <RelatedGuides route="/ai-summarizer" />
    </>
  );
}
