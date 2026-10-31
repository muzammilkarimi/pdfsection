import RemovePagesClient from './RemovePagesClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'Remove Pages from PDF Free — Delete PDF Pages',
  description: 'Free PDF page remover: delete pages from a PDF in seconds. Click the pages to remove, including blank pages, and download the new file. No sign-up, files never leave your device.',
  route: '/remove-pages',
  keywords: ['remove page from PDF', 'remove pages from PDF', 'delete pages from PDF', 'remove blank pages from PDF', 'delete page from PDF', 'delete PDF pages', 'remove PDF pages', 'PDF page remover online', 'remove pages from PDF without Acrobat', 'PDF page remover'],
});

const jsonLd = buildToolJsonLd({
  name: 'Remove PDF Pages Tool',
  description: 'Selectively remove and delete unwanted pages from PDF files.',
  route: '/remove-pages',
  faqs: [
    {
      question: 'How do I delete specific pages from a PDF?',
      answer: 'Select the pages you want to delete by clicking page thumbnails, then click Remove Pages to download the updated file.',
    },
    {
      question: 'How do I remove a blank page from a PDF?',
      answer: 'Open your PDF, click the blank page thumbnails to select them, and export. The blank pages are deleted and the rest of the document is unchanged.',
    },
    {
      question: 'Can I remove pages from a PDF without Adobe Acrobat?',
      answer: 'Yes. PDF Section works in any modern browser on Windows, Mac, iPhone and Android, so you do not need Acrobat or any software.',
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
      <RemovePagesClient />
      <RelatedGuides route="/remove-pages" />
    </>
  );
}
