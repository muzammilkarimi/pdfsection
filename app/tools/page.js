import ToolsPageClient from './ToolsPageClient';
import { buildToolMetadata } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'All PDF Tools — Free and Private',
  description:
    'Browse every PDF Section tool: merge, split, compress, convert, edit, sign and protect PDFs. All free, all processed in your browser with no uploads.',
  route: '/tools',
  keywords: ['all PDF tools', 'PDF tool list', 'free PDF tools online', 'private PDF tools'],
});

export default function ToolsPage() {
  return <ToolsPageClient />;
}
