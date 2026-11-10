import { makeFilm } from './Film.jsx';
import V from './voice/resume.json';

// "8:15 AM": the dream job wants a resume under 2 MB — the scan is 19 MB.
const { Film, len } = makeFilm({
  name: 'resume', voice: V,
  room: { day: true, sod: 29700, note: { title: 'APPLY BY', big: '9:00 AM' } },
  stamps: ['TUE · 8:15 AM', 'TUE · 8:21 AM'], clock: ['8:15', '8:21'],
  B: {
    count: 2700, file: 'Resume_scan_final.pdf', size: '19.3 MB',
    cfg: { url: 'careers.northwind.co', org: 'NORTHWIND', title: 'Careers', step: 'APPLICATION 4 OF 4', heading: 'Attach your resume', closes: 'Applications close in', rule: 'PDF only · max file size 2 MB', error: 'Upload failed. File exceeds the 2 MB limit.', submit: 'Submit application', chip: 'Resume PDF', doneTitle: 'Application received', doneSub: 'We will be in touch · Ref NW-5520', checks: ['Contact details', 'Cover note'], brand: '#2a6f6a' },
  },
  D: {
    buzz: { name: 'Rhea', hue: '#e07a5f', preview: 'try pdfsection.com' },
    chat: { name: 'Rhea', hue: '#e07a5f', accent: '#2f6df6', first: "the resume is 19 MB 😭", msgs: [{ from: 'them', at: 0.6, text: 'try pdfsection.com' }, { from: 'them', at: 1.9, text: 'it shrinks scans in your browser' }] },
  },
  E: { url: 'pdfsection.com/compress-pdf', footage: 'compress-resume', parts: [{ start: 2.0, dur: 0.6 }, { start: 3.6, dur: 0.9 }, { start: 5.5, dur: 0.7 }, { start: 7.2, dur: 1.5 }], tap: 2.4, pops: [0.4, 1.8, 2.4] },
  F: { kind: 'press', at: 1.4, before: '19.3 MB', after: '815 KB ✓' },
  G: {
    kind: 'chat',
    chat: { name: 'Northwind HR', sub: 'recruiter', hue: '#2a9d8f', accent: '#1f9d6b', msgs: [{ from: 'me', at: 0.15, file: 'Resume_scan_final-compressed.pdf', size: '815.9 KB' }, { from: 'them', at: 0.65, text: 'Perfect, thank you!' }] },
    banner: { at: 0.95, title: 'Northwind HR', body: 'Can you interview Thursday?', icon: '✉' },
  },
  H: { lines: ['A 19 MB resume?', 'Fixed in seconds.'] },
});
export const Resume = Film;
export const resumeLen = () => len;
