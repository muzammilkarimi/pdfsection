import HomePageClient from './HomePageClient';
import { buildToolMetadata } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'PDF Section — Free, Private PDF Tools in Your Browser',
  description:
    'Every PDF tool in one place. Merge, split, compress, convert, edit, and sign PDFs 100% free in your browser with zero file uploads. Private & instant.',
  route: '',
  keywords: [
    'free PDF tools',
    'online PDF editor',
    'merge PDF online',
    'compress PDF browser',
    'split PDF private',
  ],
});

export default function HomePage() {
  return <HomePageClient />;
}
