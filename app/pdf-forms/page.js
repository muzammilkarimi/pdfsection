export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import PDFFormsClient from './PDFFormsClient';

export default function Page() {
  return <PDFFormsClient />;
}
