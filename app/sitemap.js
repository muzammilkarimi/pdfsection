import { LIVE_TOOLS } from '@/lib/tools';

export default function sitemap() {
  const baseUrl = 'https://pdfsection.com';

  // Homepage
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  // All tool pages
  LIVE_TOOLS.forEach((tool) => {
    routes.push({
      url: `${baseUrl}${tool.route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  });

  return routes;
}
