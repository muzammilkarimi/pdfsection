import PDFToOfficeClient from '@/components/PDFToOfficeClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import RelatedGuides from '@/components/RelatedGuides';

export const metadata = buildToolMetadata({
  title: 'PDF to PowerPoint Converter — Convert PDF to PPTX',
  description: 'Convert PDF files into editable PowerPoint presentations (PPTX). Turn PDF pages into slides easily. Free, private, and fast.',
  route: '/pdf-to-powerpoint',
  keywords: ['PDF to PowerPoint', 'PDF to PPTX', 'convert PDF to slides', 'PDF to presentation', 'free PDF to PPT'],
});

const jsonLd = buildToolJsonLd({
  name: 'PDF to PowerPoint Converter',
  description: 'Transform PDF pages into editable PowerPoint slide decks (PPTX).',
  route: '/pdf-to-powerpoint',
  faqs: [
    {
      question: 'How do I convert PDF to PPTX?',
      answer: 'Upload your PDF, click Convert to PowerPoint, and download your editable PPTX presentation deck.',
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
      <PDFToOfficeClient toolId="pdf-to-powerpoint" />
      <RelatedGuides route="/pdf-to-powerpoint" />
    </>
  );
}
