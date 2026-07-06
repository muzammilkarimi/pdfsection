export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import FeatureSandbox from '@/components/FeatureSandbox';

export default function Page() {
  return <FeatureSandbox route="/html-to-pdf" />;
}
