import CompressPDFClient from './CompressPDFClient';

export const metadata = {
  title: 'Compress PDF',
  description: 'Reduce PDF file size while maintaining quality. Three compression levels. Free, private, works in your browser.',
};

export default function CompressPDFPage() {
  return <CompressPDFClient />;
}
