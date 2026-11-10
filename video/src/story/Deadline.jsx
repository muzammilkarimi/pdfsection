import { makeFilm } from './Film.jsx';
import V from './voice/deadline.json';

// "11:58 PM": a scholarship upload that is 19.3 MB — compress.
const { Film, len } = makeFilm({
  name: 'deadline', voice: V,
  room: { sod: 86280, note: { title: 'DEADLINE', big: '12:00 AM' } },
  stamps: ['SUN · 11:58 PM', 'SUN · 11:59 PM'], clock: ['11:58', '11:59'],
  B: { count: 106, file: 'Final_FINAL_v7.pdf', size: '19.3 MB' },
  D: {
    buzz: { name: 'Rhea', hue: '#e07a5f', preview: 'try pdfsection.com' },
    chat: { name: 'Rhea', hue: '#e07a5f', first: "it won't upload 😭", msgs: [{ from: 'them', at: 0.6, text: 'try pdfsection.com' }, { from: 'them', at: 1.9, text: 'it runs right in your browser' }] },
  },
  E: { url: 'pdfsection.com/compress-pdf', footage: 'compress-v7', parts: [{ start: 3.2, dur: 0.9 }, { start: 5.8, dur: 1.1 }, { start: 7.2, dur: 3 }], tap: 2.1, pops: [0.5, 1.1, 2.1] },
  F: { kind: 'press', at: 1.4, before: '19.3 MB', after: '815 KB ✓' },
  G: { kind: 'portal', file: 'Final_FINAL_v7-compressed.pdf', size: '815.9 KB' },
  H: { lines: ['Free.', 'Private.', 'No uploads.'] },
});
export const Deadline = Film;
export const deadlineLen = () => len;
