import ProtectPDFClient from './ProtectPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Protect PDF — Add Password & AES-256 Encryption',
  description: 'Password protect your PDF files with secure AES-256 encryption. Set owner/user passwords and permissions. 100% free and private.',
  route: '/protect-pdf',
  keywords: ['Protect PDF', 'encrypt PDF', 'password protect PDF', 'AES 256 PDF encryption', 'free PDF protection'],
});

const jsonLd = buildToolJsonLd({
  name: 'Protect PDF Tool',
  description: 'Password protect PDF documents using secure AES-256 client-side encryption.',
  route: '/protect-pdf',
  faqs: [
    {
      question: 'How does PDF password protection work?',
      answer: 'It encrypts your PDF file structure using AES-256 standard so users must enter a password to open or edit it.',
    },
  ],
});

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProtectPDFClient />
    </>
  );
}
