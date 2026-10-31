import OfficeToPDFClient from '@/components/OfficeToPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'PowerPoint to PDF Converter — Convert PPTX to PDF',
  description: 'Convert PowerPoint presentations (PPTX, PPT) to PDF documents. Preserve slide layouts, titles, and text. 100% free and browser-based.',
  route: '/powerpoint-to-pdf',
  keywords: ['PowerPoint to PDF', 'PPTX to PDF', 'convert PPT to PDF', 'slides to PDF', 'free PowerPoint converter'],
});

const jsonLd = buildToolJsonLd({
  name: 'PowerPoint to PDF Converter',
  description: 'Convert PowerPoint slide presentations into clean PDF documents.',
  route: '/powerpoint-to-pdf',
  faqs: [
    {
      question: 'Will each PowerPoint slide become a PDF page?',
      answer: 'Yes, each slide in your PPTX presentation is mapped directly into a page in the generated PDF document.',
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
      <OfficeToPDFClient toolId="powerpoint-to-pdf" />
      <RelatedGuides route="/powerpoint-to-pdf" />
    </>
  );
}
