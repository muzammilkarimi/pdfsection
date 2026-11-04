import FilesClient from './FilesClient';

export const metadata = {
  title: 'Your files',
  robots: { index: false, follow: false },
};

export default function FilesPage() {
  return <FilesClient />;
}
