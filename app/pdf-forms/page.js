import PDFFormsClient from './PDFFormsClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Fillable PDF Form Editor — Fill & Save PDF Forms Online',
  description: 'Fill out interactive PDF forms directly in your browser. Edit text fields, checkboxes, dropdowns, and download completed forms. 100% free and private.',
  route: '/pdf-forms',
  keywords: ['PDF forms', 'fill PDF form online', 'edit PDF form fields', 'interactive PDF form filler', 'free PDF form filler'],
});

const jsonLd = buildToolJsonLd({
  name: 'Fillable PDF Form Editor',
  description: 'Interactive client-side editor for filling out text fields, checkboxes, and radio buttons in PDF forms.',
  route: '/pdf-forms',
  faqs: [
    {
      question: 'How do I fill out a PDF form online?',
      answer: 'Upload your PDF form, click on any interactive form field to type or check boxes, and download your completed form.',
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
      <PDFFormsClient />
    </>
  );
}
