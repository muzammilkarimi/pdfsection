export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import AISummarizerClient from './AISummarizerClient';

export default function Page() {
  return <AISummarizerClient />;
}
