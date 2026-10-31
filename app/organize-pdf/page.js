import OrganizePDFClient from './OrganizePDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Organize PDF Pages — Drag & Drop Page Reordering',
  description: 'Organize and reorder PDF pages visually with drag and drop. Move, delete, or rotate pages before saving. Free and private.',
  route: '/organize-pdf',
  keywords: ['Organize PDF', 'reorder PDF pages', 'arrange PDF pages', 'PDF page organizer', 'free PDF organizer'],
});

const jsonLd = buildToolJsonLd({
  name: 'Organize PDF Tool',
  description: 'Drag and drop interface to organize, reorder, rotate, and delete PDF pages.',
  route: '/organize-pdf',
  faqs: [
    {
      question: 'How do I reorder pages in a PDF?',
      answer: 'Upload your PDF, drag page thumbnails into your desired order, and click Organize PDF to save.',
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
      <OrganizePDFClient />
      <RelatedGuides route="/organize-pdf" />
    </>
  );
}
