import ToolPageLayout from '@/components/ToolPageLayout';
import { buildToolMetadata } from '@/lib/seoUtils';
import GrayscalePDFClient from './GrayscalePDFClient';

export const metadata = buildToolMetadata({
  title: 'Grayscale PDF Converter — Convert PDF to Black & White Free',
  description: 'Convert full-color PDF documents to high-contrast Grayscale (Black & White) format for cheap printing and official document submission with 100% data privacy.',
  route: '/grayscale-pdf',
  keywords: ['grayscale PDF converter', 'PDF to black and white', 'convert PDF color to B&W', 'ink saver PDF converter', 'free grayscale PDF'],
});

export default function GrayscalePDFPage() {
  return (
    <ToolPageLayout
      title="Grayscale PDF Converter"
      description="Convert full-color PDF files to Black & White / Grayscale format for ink-saving printing."
      icon="image"
      iconColor="var(--tool-optimize)"
    >
      <GrayscalePDFClient />
    </ToolPageLayout>
  );
}
