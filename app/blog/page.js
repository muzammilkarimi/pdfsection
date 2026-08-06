import BlogListClient from './BlogListClient';
import { buildToolMetadata } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'PDF Security & Privacy Blog — PDF Section',
  description: 'Deep dives into client-side security, local PDF compilation, document privacy risks, and why uploading files online is dangerous.',
  route: '/blog',
  keywords: ['PDF security blog', 'client side PDF compilation', 'document privacy guide', 'stop uploading PDFs'],
});

export default function BlogPage() {
  return <BlogListClient />;
}
