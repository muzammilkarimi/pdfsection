export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import CropPDFClient from './CropPDFClient';

export default function Page() {
  return <CropPDFClient />;
}
