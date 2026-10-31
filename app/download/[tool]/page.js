import { notFound } from 'next/navigation';
import DownloadClient from './DownloadClient';
import { ALL_TOOLS } from '@/lib/tools';

const slugOf = (tool) => tool.route.replace(/^\//, '');

export function generateStaticParams() {
  return ALL_TOOLS.map((tool) => ({ tool: slugOf(tool) }));
}

export async function generateMetadata({ params }) {
  const { tool: slug } = await params;
  const tool = ALL_TOOLS.find((t) => slugOf(t) === slug);
  return {
    title: tool ? `Download your file — ${tool.name}` : 'Download',
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }) {
  const { tool: slug } = await params;
  const tool = ALL_TOOLS.find((t) => slugOf(t) === slug);
  if (!tool) notFound();

  return (
    <DownloadClient
      slug={slug}
      tool={{ id: tool.id, name: tool.name, route: tool.route, icon: tool.icon }}
    />
  );
}
