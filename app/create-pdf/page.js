import CreatePDFClient from './CreatePDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Create PDF Online — Free Poster & Flyer Maker',
  description: 'Design posters, flyers, certificates, invoices and resumes from scratch or from a template, then download a print-ready PDF. Free, no sign-up, runs in your browser.',
  route: '/create-pdf',
  keywords: ['create PDF', 'PDF maker', 'poster maker', 'flyer maker', 'certificate maker', 'invoice maker', 'resume maker', 'free poster maker online', 'make a poster PDF'],
});

const jsonLd = buildToolJsonLd({
  name: 'Create PDF & Poster Maker',
  description: 'Browser-based design tool for making posters, flyers, certificates and documents, and downloading them as print-ready PDF, PNG or JPG.',
  route: '/create-pdf',
  faqs: [
    {
      question: 'Is the poster maker free, and does it add a watermark?',
      answer: 'It is free, needs no account, and adds no watermark to your PDF or images.',
    },
    {
      question: 'Are my designs and images uploaded?',
      answer: 'No. Designing and exporting both happen in your browser, and your designs are saved only on your device.',
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
      <CreatePDFClient />
      <RelatedGuides route="/create-pdf" />
    </>
  );
}
