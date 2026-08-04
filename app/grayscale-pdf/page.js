import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';
import GrayscalePDFClient from './GrayscalePDFClient';

export const metadata = buildToolMetadata({
  title: 'Grayscale PDF Converter — Convert PDF to Black & White Free',
  description: 'Convert full-color PDF documents to high-contrast Grayscale (Black & White) format for cheap printing and official document submission with 100% data privacy.',
  route: '/grayscale-pdf',
  keywords: ['grayscale PDF converter', 'PDF to black and white', 'convert PDF color to B&W', 'ink saver PDF converter', 'free grayscale PDF'],
});

const jsonLd = buildToolJsonLd({
  name: 'Grayscale PDF Converter',
  description: 'Convert full-color PDF files to Black & White / Grayscale format for ink-saving printing.',
  route: '/grayscale-pdf',
  faqs: [
    {
      question: 'How does Grayscale PDF conversion work?',
      answer: 'The tool reads each page of your PDF, renders them as canvas elements, processes the pixel colors to extract luma values (grayscale), and compiles them into a new Black & White PDF document.',
    },
    {
      question: 'Will converting to grayscale reduce my PDF file size?',
      answer: 'Yes, converting color images to grayscale can significantly reduce the embedded image stream size, yielding a much smaller output file.',
    }
  ],
});

export default function GrayscalePDFPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GrayscalePDFClient />
    </>
  );
}
