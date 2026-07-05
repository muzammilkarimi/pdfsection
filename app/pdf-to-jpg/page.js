import PDFToJPGClient from './PDFToJPGClient';

export const metadata = {
  title: 'PDF to JPG',
  description: 'Convert PDF pages into high-quality JPG images. Extract all images. Free, private, and works in your browser.',
};

export default function PDFToJPGPage() {
  return <PDFToJPGClient />;
}
