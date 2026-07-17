export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import RedactPDFClient from './RedactPDFClient';

export default function Page() {
  return <RedactPDFClient />;
}
