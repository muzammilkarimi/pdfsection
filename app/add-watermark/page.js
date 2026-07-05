import WatermarkPDFClient from './WatermarkPDFClient';

export const metadata = {
  title: 'Add Watermark to PDF',
  description: 'Stamp a text or image watermark over your PDF pages. Custom font, opacity, rotation, and size. Free, private, and works in your browser.',
};

export default function WatermarkPDFPage() {
  return <WatermarkPDFClient />;
}
