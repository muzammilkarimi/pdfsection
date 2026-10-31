export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/download/',
      },
    ],
    sitemap: 'https://pdfsection.com/sitemap.xml',
  };
}
