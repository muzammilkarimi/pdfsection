import { LIVE_TOOLS } from '@/lib/tools';
import { BLOG_POSTS } from '@/lib/blog';
import { PSEO_PAGES } from '@/lib/seoRegistry';

export default function sitemap() {
  const baseUrl = 'https://www.pdfsection.com';

  // Homepage and static corporate routes
  const routes = [
    {
      url: baseUrl,
    },
    {
      url: `${baseUrl}/tools`,
    },
    {
      url: `${baseUrl}/blog`,
    },
    {
      url: `${baseUrl}/how-to`,
    },
    {
      url: `${baseUrl}/about`,
    },
    {
      url: `${baseUrl}/privacy`,
    },
    {
      url: `${baseUrl}/terms`,
    },
    {
      url: `${baseUrl}/ilovepdf-alternative`,
    },
    {
      url: `${baseUrl}/smallpdf-alternative`,
    },
    {
      url: `${baseUrl}/adobe-acrobat-alternative`,
    },
    {
      url: `${baseUrl}/pdf24-alternative`,
    },
    {
      url: `${baseUrl}/convert-pdf`,
    },
    {
      url: `${baseUrl}/security-pdf`,
    },
  ];

  // All tool pages
  LIVE_TOOLS.forEach((tool) => {
    routes.push({
      url: `${baseUrl}${tool.route}`,
    });
  });

  // All programmatic long-tail landing pages
  PSEO_PAGES.forEach((page) => {
    routes.push({
      url: `${baseUrl}/how-to/${page.slug}`,
    });
  });

  // All blog posts
  BLOG_POSTS.forEach((post) => {
    routes.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(`${post.date} UTC`),
    });
  });

  return routes;
}
