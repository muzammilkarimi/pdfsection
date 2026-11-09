import { buildToolMetadata } from '@/lib/seoUtils';
import PDFToPDFAClient from './PDFToPDFAClient';

// Paused tool: keep it out of search results until real PDF/A conversion ships.
export const metadata = {
  ...buildToolMetadata({
    title: 'PDF to PDF/A — Paused',
    description: 'PDF/A conversion on PDF Section is paused while we rebuild it to produce files that pass PDF/A validation.',
    route: '/pdf-to-pdfa',
  }),
  robots: { index: false, follow: true },
};

export default function PDFToPDFAPage() {
  return <PDFToPDFAClient />;
}
