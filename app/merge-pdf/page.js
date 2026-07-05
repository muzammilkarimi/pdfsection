import MergePDFClient from './MergePDFClient';

export const metadata = {
  title: 'Merge PDF',
  description: 'Combine multiple PDF files into a single document. Drag to reorder pages. Free, private, works in your browser.',
  openGraph: {
    title: 'Merge PDF — PDF Section',
    description: 'Combine multiple PDF files into one document. Free and private.',
  },
};

export default function MergePDFPage() {
  return <MergePDFClient />;
}
