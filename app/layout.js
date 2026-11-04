import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seoUtils';

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
    default: 'PDF Section — Free Online PDF Tools (100% Private)',
    template: '%s | PDF Section',
  },
  description:
    'Every PDF tool in one place. Merge, split, compress, convert, edit, and sign PDFs 100% free in your browser with zero file uploads. Private & instant.',
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
  metadataBase: new URL('https://www.pdfsection.com'),
  alternates: {
    canonical: 'https://www.pdfsection.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.pdfsection.com',
    siteName: 'PDF Section',
    title: 'PDF Section — Free Online PDF Tools (100% Private)',
    description:
      'Every PDF tool in one place. Merge, split, compress, convert, edit, and sign PDFs 100% free in your browser with zero file uploads. Private & instant.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'PDF Section — Free Online PDF Tools (100% Private)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Section — Free Online PDF Tools (100% Private)',
    description:
      'Every PDF tool in one place. Merge, split, compress, convert, edit, and sign PDFs 100% free in your browser.',
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
  const jsonLdSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PDF Section',
      url: 'https://www.pdfsection.com',
      description:
        'Every PDF tool in one place. Merge, split, compress, convert, edit, and sign PDFs 100% free in your browser with zero file uploads.',
      applicationCategory: 'UtilityApplication',
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
    },
    buildWebSiteJsonLd(),
    buildOrganizationJsonLd(),
  ];

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('theme');
                  var theme = storedTheme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : (storedTheme || 'light');
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchemas) }}
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
        <MobileTabBar />
        <Analytics />
        {gaId && <GoogleAnalytics gaId={gaId} />}
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
      </body>
    </html>
  );
}
