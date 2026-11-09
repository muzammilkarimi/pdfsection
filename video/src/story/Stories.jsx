import React from 'react';
import { Audio, Sequence } from 'remotion';
import { Banner, Browser, Chat, Cuts, EndCard, PhoneShot, Portal, Room, S, Stamp, Sub, Y, cutsLen } from './kit.jsx';
import { Sfx, sfx } from '../lib.jsx';

// a scene starting at `at` seconds and lasting `dur`
const Sc = ({ at, dur, children }) => <Sequence from={S(at)} durationInFrames={S(dur)}>{children}</Sequence>;
const Ticks = ({ n, vol = 0.32 }) => <>{Array.from({ length: n }, (_, i) => <Sfx key={i} at={0.2 + i} name="tick" volume={vol} />)}</>;
const Music = ({ at = 0, vol = 0.16 }) => <Sequence from={S(at)}><Audio src={sfx('music')} volume={vol} /></Sequence>;
const Pops = ({ at, vol = 0.55 }) => <>{at.map((a) => <Sfx key={a} at={a} name="pop" volume={vol} />)}</>;
const Outro = ({ lines, dark }) => (
  <>
    <EndCard dark={dark} lines={lines} url="pdfsection.com" />
    <Music vol={0.12} /><Sfx at={0.5} name="pop" /><Sfx at={1.0} name="pop" /><Sfx at={2} name="glass" volume={0.5} />
  </>
);

// ═══════════ 1 · "11:58 PM" — compress ═══════════
const P1 = [{ start: 1.0, dur: 1.8 }, { start: 3.0, dur: 1.2 }, { start: 5.7, dur: 3.0 }, { start: 9.6, dur: 2.4 }];
const L1 = { s2: 5.6, s3: 12.6, tail: 5.8 };
export const story1Len = () => L1.s3 + cutsLen(P1) + L1.tail + 5.2;
export const Story1 = () => {
  const fl = cutsLen(P1);
  return (
    <Room theme="night">
      <Sc at={0} dur={L1.s2}>
        <Stamp>SUN · 11:58 PM</Stamp>
        <PhoneShot dur={L1.s2} clock="11:58" shakeAt={2.8} push={0.07}>
          <Portal mode="fail" count={118} file="Final_FINAL_v7.pdf" size="19.3 MB" attach={0.7} err={2.8} />
        </PhoneShot>
        <Sub at={0.2} to={2.5}>Scholarship portal closes at <Y>midnight.</Y></Sub>
        <Sub at={3.0} to={5.4}>The file is <Y>too big.</Y></Sub>
        <Ticks n={5} /><Sfx at={0.7} name="pop" volume={0.6} /><Sfx at={2.8} name="impact" volume={0.9} /><Sfx at={2.85} name="boom" volume={0.5} />
      </Sc>
      <Sc at={L1.s2} dur={L1.s3 - L1.s2}>
        <Stamp>11:59 PM</Stamp>
        <PhoneShot dur={L1.s3 - L1.s2} clock="11:59" dark push={0.05}>
          <Chat dark name="Rhea" msgs={[
            { from: 'me', at: 0.5, text: "it won't upload 😭" },
            { from: 'them', at: 1.9, text: 'how big is the file' },
            { from: 'me', at: 3.1, text: '19 MB. limit is 10' },
            { from: 'them', at: 4.7, text: 'pdfsection.com. it shrinks it right in your browser' },
            { from: 'them', at: 6.0, text: 'nothing gets uploaded. go go go' },
          ]} />
        </PhoneShot>
        <Sub at={5.2} to={6.9}><Y>No upload.</Y> It runs on your phone.</Sub>
        <Ticks n={7} /><Sfx at={0} name="swipe" volume={0.4} />
        <Pops at={[0.5, 1.9, 3.1, 4.7, 6.0]} />
      </Sc>
      <Sc at={L1.s3} dur={fl}>
        <PhoneShot dur={fl} clock="11:59" push={0.08}>
          <Browser url="pdfsection.com/compress-pdf"><Cuts name="compress-v7" parts={P1} /></Browser>
        </PhoneShot>
        <Sub at={0.1} to={1.7}>Open <Y>pdfsection.com</Y></Sub>
        <Sub at={1.9} to={3.0}>Drop the file.</Sub>
        <Sub at={3.1} to={5.9}>Pick <Y>Maximum.</Y> Tap <Y>Compress.</Y></Sub>
        <Sub at={6.1} to={fl - 0.1}><Y>19.3 MB → 815 KB</Y></Sub>
        <Music />
        <Sfx at={0} name="swipe" volume={0.4} /><Sfx at={1.9} name="pop" /><Sfx at={3.3} name="pop" /><Sfx at={4.7} name="pop" /><Sfx at={6.3} name="success" volume={0.7} />
      </Sc>
      <Sc at={L1.s3 + fl} dur={L1.tail}>
        <PhoneShot dur={L1.tail} clock="11:59" push={0.06}>
          <Portal mode="ok" count={47} file="Final_FINAL_v7-compressed.pdf" size="815.9 KB" attach={0.4} ok={1.0} submit={2.0} done={2.6} />
        </PhoneShot>
        <Sub at={3.0} to={5.6}>Submitted. <Y>47 seconds</Y> to spare.</Sub>
        <Music />
        <Sfx at={0.4} name="pop" /><Sfx at={2.0} name="pop" volume={0.7} /><Sfx at={2.6} name="success" volume={0.9} /><Sfx at={2.65} name="glass" volume={0.4} />
      </Sc>
      <Sc at={L1.s3 + fl + L1.tail} dur={5.2}>
        <Outro dark lines={['Deadline?', 'Handled.']} />
      </Sc>
    </Room>
  );
};

// ═══════════ 2 · "One PDF" — merge ═══════════
const P2 = [{ start: 0.9, dur: 1.6 }, { start: 3.3, dur: 2.6 }, { start: 7.6, dur: 2.2 }];
export const story2Len = () => 11.2 + cutsLen(P2) + 5;
const DANA = { name: 'Dana (client)', sub: 'active now', hue: '#6d597a', accent: '#2f6df6' };
export const Story2 = () => {
  const fl = cutsLen(P2);
  return (
    <Room theme="day">
      <Sc at={0} dur={5.6}>
        <Stamp dark={false}>THU · 4:41 PM</Stamp>
        <PhoneShot dur={5.6} clock="4:41" push={0.06}>
          <Chat {...DANA} msgs={[
            { from: 'them', at: 0.4, text: 'Invoice looks good 👍' },
            { from: 'them', at: 1.7, text: 'can you send the invoice, Q3 report and signed contract as ONE pdf?' },
            { from: 'them', at: 3.3, text: 'payment goes out today if I have it by 5' },
            { from: 'me', at: 4.5, text: 'on it!' },
          ]} />
        </PhoneShot>
        <Sub at={3.5} to={5.5}>Three files. <Y>One PDF.</Y></Sub>
        <Pops at={[0.4, 1.7, 3.3, 4.5]} />
      </Sc>
      <Sc at={5.6} dur={fl}>
        <PhoneShot dur={fl} clock="4:43" push={0.08}>
          <Browser url="pdfsection.com/merge-pdf"><Cuts name="merge-story" parts={P2} /></Browser>
        </PhoneShot>
        <Sub at={0.1} to={1.7}>Merge PDF. <Y>Free.</Y></Sub>
        <Sub at={2.0} to={4.5}>Drop all three. Tap <Y>Merge.</Y></Sub>
        <Sub at={4.7} to={fl - 0.1}><Y>One file.</Y> Done.</Sub>
        <Music />
        <Sfx at={0} name="swipe" volume={0.4} /><Sfx at={1.9} name="pop" /><Sfx at={3.9} name="pop" /><Sfx at={4.3} name="success" volume={0.7} />
      </Sc>
      <Sc at={5.6 + fl} dur={5.6}>
        <Stamp dark={false}>4:47 PM</Stamp>
        <PhoneShot dur={5.6} clock="4:47" push={0.06}>
          <Chat {...DANA} msgs={[
            { from: 'me', at: 0.3, file: 'merged.pdf', size: '73 KB · 3 files in one' },
            { from: 'them', at: 1.5, text: 'got it ✅' },
            { from: 'them', at: 2.6, text: 'sending the payment now' },
          ]} />
          <Banner at={3.6} title="Payment received" body="$2,400.00 · Dana" />
        </PhoneShot>
        <Sub at={3.9} to={5.5}><Y>4:47 PM.</Y> Paid.</Sub>
        <Music />
        <Pops at={[0.3, 1.5, 2.6]} /><Sfx at={3.6} name="ding" volume={0.9} />
      </Sc>
      <Sc at={11.2 + fl} dur={5}>
        <Outro dark={false} lines={['Three files.', 'One tap.']} />
      </Sc>
    </Room>
  );
};

// ═══════════ 3 · "19 MB resume" — compress ═══════════
const P3 = [{ start: 1.0, dur: 1.8 }, { start: 3.0, dur: 1.2 }, { start: 5.6, dur: 3.0 }, { start: 9.6, dur: 2.4 }];
export const story3Len = () => 11 + cutsLen(P3) + 5;
const HR = { name: 'Northwind HR', sub: 'recruiter', hue: '#2a9d8f', accent: '#1f9d6b' };
export const Story3 = () => {
  const fl = cutsLen(P3);
  return (
    <Room theme="day">
      <Sc at={0} dur={5.5}>
        <Stamp dark={false}>TUE · 8:15 AM</Stamp>
        <PhoneShot dur={5.5} clock="8:15" push={0.06}>
          <Chat {...HR} msgs={[
            { from: 'them', at: 0.4, text: 'Hi Sam! We got your resume 🙂' },
            { from: 'them', at: 1.8, text: 'but our system only takes files under 2 MB. yours is 19 MB' },
            { from: 'them', at: 3.4, text: 'can you resend by 9?' },
            { from: 'me', at: 4.5, text: 'sure, give me 5 min' },
          ]} />
        </PhoneShot>
        <Sub at={3.3} to={5.4}>You scanned it. <Y>19 MB.</Y></Sub>
        <Pops at={[0.4, 1.8, 3.4, 4.5]} />
      </Sc>
      <Sc at={5.5} dur={fl}>
        <PhoneShot dur={fl} clock="8:17" push={0.08}>
          <Browser url="pdfsection.com/compress-pdf"><Cuts name="compress-resume" parts={P3} /></Browser>
        </PhoneShot>
        <Sub at={0.1} to={1.7}>Compress PDF. <Y>Free.</Y></Sub>
        <Sub at={1.9} to={3.0}>Drop the file.</Sub>
        <Sub at={3.1} to={5.9}>Pick a level. <Y>Compress.</Y></Sub>
        <Sub at={6.1} to={fl - 0.1}><Y>815 KB.</Y> Done.</Sub>
        <Music />
        <Sfx at={0} name="swipe" volume={0.4} /><Sfx at={1.9} name="pop" /><Sfx at={3.3} name="pop" /><Sfx at={4.7} name="pop" /><Sfx at={6.3} name="success" volume={0.7} />
      </Sc>
      <Sc at={5.5 + fl} dur={5.5}>
        <Stamp dark={false}>8:21 AM</Stamp>
        <PhoneShot dur={5.5} clock="8:21" push={0.06}>
          <Chat {...HR} msgs={[
            { from: 'me', at: 0.3, file: 'Resume_scan_final-compressed.pdf', size: '815.9 KB' },
            { from: 'them', at: 1.6, text: 'Perfect, thank you!' },
            { from: 'them', at: 2.9, text: 'Can you do an interview Thursday?' },
            { from: 'me', at: 4.1, text: 'Yes!! 🎉' },
          ]} />
        </PhoneShot>
        <Sub at={3.3} to={5.4}>Interview <Y>Thursday.</Y></Sub>
        <Music />
        <Pops at={[0.3, 1.6, 2.9, 4.1]} />
      </Sc>
      <Sc at={11 + fl} dur={5}>
        <Outro dark={false} lines={['19 MB resume?', 'Fixed in seconds.']} />
      </Sc>
    </Room>
  );
};
