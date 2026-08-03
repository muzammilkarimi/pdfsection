import ScanPDFClient from './ScanPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Scan to PDF — Convert Camera & Scanned Images to PDF',
  description: 'Convert document photos, camera scans, and images into a clean PDF file. Auto-enhance contrast and crop margins. Free & private.',
  route: '/scan-to-pdf',
  keywords: ['Scan to PDF', 'convert scans to PDF', 'camera scan to PDF', 'document scan converter', 'free scan to PDF'],
});

const jsonLd = buildToolJsonLd({
  name: 'Scan to PDF Tool',
  description: 'Convert camera photos and document scans into clean PDF files.',
  route: '/scan-to-pdf',
  faqs: [
    {
      question: 'Can I convert mobile camera photos to PDF?',
      answer: 'Yes! Upload photo scans from your phone or camera and convert them into a PDF document.',
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
      <ScanPDFClient />
    </>
  );
}
