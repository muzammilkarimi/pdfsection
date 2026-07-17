import { LIVE_TOOLS } from '@/lib/tools';
import { BLOG_POSTS } from '@/lib/blog';

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
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
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

  // All blog posts
  BLOG_POSTS.forEach((post) => {
    routes.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  return routes;
}
