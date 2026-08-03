import AISummarizerClient from './AISummarizerClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'AI PDF Summarizer — Extract Key Insights & Summaries',
  description: 'Summarize long PDF documents instantly. Get key takeaways, executive summaries, and bullet points from any PDF file. Fast & private.',
  route: '/ai-summarizer',
  keywords: ['AI PDF Summarizer', 'summarize PDF online', 'PDF key insights', 'PDF bullet points', 'AI document summary'],
});

const jsonLd = buildToolJsonLd({
  name: 'AI PDF Summarizer',
  description: 'Extract concise bullet points, executive summaries, and key insights from PDF documents.',
  route: '/ai-summarizer',
  faqs: [
    {
      question: 'How does the AI PDF Summarizer work?',
      answer: 'It extracts and analyzes document text locally to output structured bullet points and key executive summaries.',
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
    </>
  );
}
