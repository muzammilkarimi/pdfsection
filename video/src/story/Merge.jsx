import { makeFilm } from './Film.jsx';
import V from './voice/merge.json';

// "4:41 PM": a client will only pay for ONE pdf — merge three files.
const { Film, len } = makeFilm({
  name: 'merge', voice: V,
  room: { day: true, sod: 60060, note: { title: 'PAYOUT', big: '5:00 PM' } },
  stamps: ['THU · 4:41 PM', 'THU · 4:47 PM'], clock: ['4:41', '4:47'],
  B: {
    count: 1140, file: '3 files selected', size: 'Invoice-2041.pdf + 2 more',
    cfg: { url: 'pay.northgate.com', org: 'NORTHGATE', title: 'Vendor payments', step: 'INVOICE PACK', heading: 'Submit your invoice', closes: 'Payment run in', rule: 'ONE PDF only · max 5 MB', error: 'Rejected. Only one PDF per submission.', submit: 'Submit invoice', chip: 'Invoice pack', doneTitle: 'Invoice received', doneSub: 'Payment scheduled · Ref NG-7731', checks: ['Vendor details', 'Bank info'], brand: '#1f5f4a' },
  },
  D: {
    buzz: { name: 'Rhea', hue: '#e07a5f', preview: 'try pdfsection.com' },
    chat: { name: 'Rhea', hue: '#e07a5f', accent: '#2f6df6', first: 'i have 3 files. it wants ONE 😭', msgs: [{ from: 'them', at: 0.6, text: 'try pdfsection.com. Merge PDF' }, { from: 'them', at: 1.9, text: 'free. runs in your browser' }] },
  },
  E: { url: 'pdfsection.com/merge-pdf', footage: 'merge-story', parts: [{ start: 2.6, dur: 0.5 }, { start: 3.6, dur: 0.7 }, { start: 5.2, dur: 1.0 }], tap: 1.4, pops: [0.3, 0.9, 1.4] },
  F: { kind: 'merge', at: 1.0, after: 'merged.pdf ✓' },
  G: {
    kind: 'chat',
    chat: { name: 'Dana (client)', sub: 'active now', hue: '#6d597a', accent: '#2f6df6', msgs: [{ from: 'me', at: 0.15, file: 'merged.pdf', size: '73 KB · 3 files in one' }, { from: 'them', at: 0.65, text: 'got it ✅ paying now' }] },
    banner: { at: 0.95, title: 'Payment received', body: '$2,400.00 · Dana', icon: '$' },
  },
  H: { lines: ['Three files.', 'One tap.'] },
});
export const Merge = Film;
export const mergeLen = () => len;
