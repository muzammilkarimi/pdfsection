import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'PDF Section — Free Online PDF Tools',
    template: '%s | PDF Section',
  },
  description:
    'Every PDF tool you need in one place. Merge, split, compress, convert, edit, sign, and secure your PDFs. 100% free, private, and runs entirely in your browser.',
  keywords: [
    'PDF tools',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'convert PDF',
    'edit PDF',
    'PDF editor',
    'free PDF tools',
    'online PDF',
    'PDF to Word',
    'PDF to JPG',
    'JPG to PDF',
    'Word to PDF',
    'sign PDF',
    'watermark PDF',
    'protect PDF',
    'unlock PDF',
  ],
  authors: [{ name: 'PDF Section' }],
  creator: 'PDF Section',
  publisher: 'PDF Section',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pdfsection.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pdfsection.com',
    siteName: 'PDF Section',
    title: 'PDF Section — Free Online PDF Tools',
    description:
      'Every PDF tool you need in one place. Merge, split, compress, convert, edit, and secure PDFs for free.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'PDF Section — Free Online PDF Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Section — Free Online PDF Tools',
    description:
      'Every PDF tool you need in one place. 100% free and private.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PDF Section',
    url: 'https://pdfsection.com',
    description:
      'Every PDF tool you need in one place. Merge, split, compress, convert, edit, and secure PDFs for free.',
    applicationCategory: 'Utility',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Merge PDF',
      'Split PDF',
      'Compress PDF',
      'PDF to Word',
      'Word to PDF',
      'PDF to JPG',
      'JPG to PDF',
      'Edit PDF',
      'Sign PDF',
      'Protect PDF',
      'Unlock PDF',
      'Rotate PDF',
      'Add Watermark',
      'Add Page Numbers',
      'Crop PDF',
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('theme');
                  var theme = storedTheme || 'light';
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
