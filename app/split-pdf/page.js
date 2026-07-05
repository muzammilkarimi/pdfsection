import SplitPDFClient from './SplitPDFClient';

export const metadata = {
  title: 'Split PDF',
  description: 'Separate PDF pages into individual files or extract specific page ranges. Free, private, works in your browser.',
  openGraph: {
    title: 'Split PDF — PDF Section',
    description: 'Split PDF pages into separate files. Free and private.',
  },
};

export default function SplitPDFPage() {
  return <SplitPDFClient />;
}
