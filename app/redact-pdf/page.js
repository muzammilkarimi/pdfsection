import RedactPDFClient from './RedactPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Redact PDF Online — Black Out Sensitive Information Permanently',
  description: 'Permanently hide and redact sensitive text or images in your PDF files. 100% private, client-side redaction directly in your browser.',
  route: '/redact-pdf',
  keywords: ['Redact PDF', 'black out PDF text', 'hide sensitive info in PDF', 'permanent PDF redaction', 'free PDF redact'],
});

const jsonLd = buildToolJsonLd({
  name: 'Redact PDF Tool',
  description: 'Permanently remove and black out confidential text or images from PDF files.',
  route: '/redact-pdf',
  faqs: [
    {
      question: 'Is redaction permanent?',
      answer: 'Yes! PDF Section permanently draws black redaction blocks into the PDF document structure before downloading.',
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
      <RedactPDFClient />
      <RelatedGuides route="/redact-pdf" />
    </>
  );
}
