export default function manifest() {
  return {
    name: 'PDF Section — Private Client-Side PDF Tools',
    short_name: 'PDF Section',
    description: '100% Free, private, client-side PDF utility suite. Merge, split, compress, edit, sign, and convert PDF files directly in your browser without file uploads.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0e0d15',
    theme_color: '#5e6ad2',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
