import SignPDFClient from './SignPDFClient';
import { buildToolMetadata, buildToolJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Sign PDF Online — Draw & Place Electronic Signatures',
  description: 'Sign PDF documents electronically online. Draw your signature or upload an image signature and place it on any page. 100% free & secure.',
  route: '/sign-pdf',
  keywords: ['Sign PDF', 'e-sign PDF online', 'electronic signature PDF', 'add signature to PDF', 'free PDF signer'],
});

const jsonLd = buildToolJsonLd({
  name: 'Sign PDF Tool',
  description: 'Create and place electronic signatures onto PDF pages.',
  route: '/sign-pdf',
  faqs: [
    {
      question: 'Is signing a PDF online secure?',
      answer: 'Yes! PDF Section processes signatures 100% locally in your browser. Your signature and document are never uploaded to a server.',
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
      <SignPDFClient />
    </>
  );
}
