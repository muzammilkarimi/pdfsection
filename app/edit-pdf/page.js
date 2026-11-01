import EditPDFClient from './EditPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Edit PDF Online — Add Text, Annotations & Shapes',
  description: 'Edit PDF documents online. Add text (including Hindi), drawings, shapes and annotations directly to your PDF pages. 100% free and private.',
  route: '/edit-pdf',
  keywords: ['Edit PDF', 'PDF editor online', 'add text to PDF', 'annotate PDF', 'free online PDF editor', 'Hindi PDF editor online', 'add Hindi text to PDF'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF Editor',
  description: 'Online PDF editor for adding text, drawings, shapes, and annotations directly to PDF documents.',
  route: '/edit-pdf',
  faqs: [
    {
      question: 'Can I add text or annotations to my PDF?',
      answer: 'Yes! PDF Section allows you to click anywhere on a PDF page to type text, draw, or add shapes.',
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
      <EditPDFClient />
      <RelatedGuides route="/edit-pdf" />
    </>
  );
}
