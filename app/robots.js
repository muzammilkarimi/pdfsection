export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/download/',
      },
    ],
    sitemap: 'https://www.pdfsection.com/sitemap.xml',
  };
}
