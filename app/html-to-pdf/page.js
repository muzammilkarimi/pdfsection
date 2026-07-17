export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import HTMLToPDFClient from './HTMLToPDFClient';

export default function Page() {
  return <HTMLToPDFClient />;
}
