export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import PDFToOfficeClient from '@/components/PDFToOfficeClient';

export default function Page() {
  return <PDFToOfficeClient toolId="pdf-to-excel" />;
}
