import UnlockPDFClient from './UnlockPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Unlock PDF — Remove PDF Passwords & Security Restrictions',
  description: 'Remove passwords and restriction security from protected PDF files online. Quick, easy, free, and private.',
  route: '/unlock-pdf',
  keywords: ['Unlock PDF', 'remove PDF password', 'decrypt PDF online', 'PDF password remover', 'free PDF unlocker'],
});

const jsonLd = buildToolJsonLd({
  name: 'Unlock PDF Tool',
  description: 'Remove password encryption and restriction security from PDF documents.',
  route: '/unlock-pdf',
  faqs: [
    {
      question: 'How do I remove password protection from a PDF?',
      answer: 'Upload your encrypted PDF, enter the password if required, and click Unlock PDF to download an unencrypted file.',
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
      <UnlockPDFClient />
    </>
  );
}
