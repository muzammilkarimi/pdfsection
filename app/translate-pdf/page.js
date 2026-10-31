import TranslatePDFClient from './TranslatePDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Translate PDF Online — Free Document Language Translation',
  description: 'Translate PDF document text into multiple languages online for free. Quick machine translation of your PDF text, with no sign-up.',
  route: '/translate-pdf',
  keywords: ['Translate PDF', 'PDF translator online', 'translate PDF text', 'free PDF language translation', 'PDF reader translate'],
});

const jsonLd = buildToolJsonLd({
  name: 'Translate PDF Tool',
  description: 'Extract and translate PDF document text into multiple target languages.',
  route: '/translate-pdf',
  faqs: [
    {
      question: 'How do I translate a PDF?',
      answer: 'Upload your PDF document, select your desired language, and view translated page text instantly.',
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
      <TranslatePDFClient />
      <RelatedGuides route="/translate-pdf" />
    </>
  );
}
