export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import OfficeToPDFClient from '@/components/OfficeToPDFClient';

export default function Page() {
  return <OfficeToPDFClient toolId="word-to-pdf" />;
}
