import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat';
import { loadFont as loadMarker } from '@remotion/google-fonts/PermanentMarker';
import { S, FPS } from './kit.jsx';
import { Sfx, sfx } from '../lib.jsx';
import V from './voice/doodle.json';

const hand = loadCaveat().fontFamily, marker = loadMarker().fontFamily;
const INK = '#ff3b6b', BLUE = '#2347d6', PAPER = '#f3f4fb';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

// ───────────── timeline: driven by the narration ─────────────
const GAP = 0.2, LEAD = 0.4, TAIL = 1.3;
const L = {}; let tcur = LEAD;
for (const l of V) { L[l.id] = { ...l, s: tcur, e: tcur + l.dur }; tcur += l.dur + GAP; }
export const doodleLen = () => tcur + TAIL;
const cut = (id) => L[id].s - 0.12;
const SCN = { A: [0, cut('d3')], B: [cut('d3'), cut('d4')], C: [cut('d4'), cut('d5')], D: [cut('d5'), cut('d6')], E: [cut('d6'), cut('d7')], F: [cut('d7'), cut('d8')], G: [cut('d8'), cut('d9')], H: [cut('d9'), doodleLen()] };
const dur = (k) => SCN[k][1] - SCN[k][0];
const at = (k, id, off = 0) => Math.max(0, L[id].s + off - SCN[k][0]); // narration cue, local to scene k

// captions: each caption token spread over its line's spoken span
const CAP = V.flatMap((l) => {
  const toks = l.text.split(' '); const a = L[l.id].s + (l.words[0]?.s ?? 0), b = L[l.id].s + (l.words.at(-1)?.e ?? l.dur);
  const tot = toks.reduce((n, w) => n + w.length + 1, 0); let t0 = a;
  return toks.map((w, i) => { const d = ((w.length + 1) / tot) * (b - a); const o = { w, s: t0, e: t0 + d, line: l.id, i }; t0 += d; return o; });
});

const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .4 0 0 0 0 .3 0 0 0 0 .2 0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

// ───────────── doodle primitives (local time t comes from the scene) ─────────────
const useT = () => useCurrentFrame() / FPS;

// a pen stroke that draws itself
const Pen = ({ d, at: t0, len = 0.5, color = INK, w = 11, fill = 'none' }) => {
  const t = useT(); const p = interpolate(t, [t0, t0 + len], [0, 1], clamp);
  return <path d={d} pathLength={1} stroke={color} strokeWidth={w} fill={fill} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} opacity={p > 0 ? 1 : 0} />;
};
const Ink = ({ children }) => <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>{children}</svg>;

// handwriting that wipes in left to right
const Write = ({ children, at: t0, len = 0.45, style }) => {
  const t = useT(); const p = interpolate(t, [t0, t0 + len], [0, 1], clamp);
  return <div style={{ position: 'absolute', fontFamily: hand, fontWeight: 700, color: INK, lineHeight: 1, whiteSpace: 'nowrap', clipPath: `inset(-20px ${(1 - p) * 100}% -20px -20px)`, opacity: p > 0 ? 1 : 0, ...style }}>{children}</div>;
};
const Note = ({ children, at: t0, style }) => {
  const t = useT(); const p = interpolate(t, [t0, t0 + 0.28], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  return <div style={{ position: 'absolute', fontFamily: hand, fontWeight: 700, background: '#ffe066', color: '#2b2400', padding: '22px 30px', boxShadow: '0 14px 20px rgba(40,30,0,.28)', opacity: p, transform: `${style?.transform ?? ''} scale(${0.7 + 0.3 * p}) translateY(${(1 - p) * 26}px)`, ...style }}>{children}</div>;
};
const Stamp = ({ children, at: t0, style }) => {
  const t = useT(); const p = interpolate(t, [t0, t0 + 0.14], [0, 1], clamp);
  return <div style={{ position: 'absolute', fontFamily: marker, color: '#c0392b', border: '10px solid #c0392b', borderRadius: 10, padding: '4px 28px', opacity: p * 0.9, transform: `${style?.transform ?? ''} scale(${2.2 - 1.2 * p})`, ...style }}>{children}</div>;
};

// ───────────── footage layers ─────────────
const Footage = ({ k, from, to, top = 0, shake = 1 }) => {
  const f = useCurrentFrame();
  const sc = 1.02 + (f / 90) * 0.012, rx = Math.sin(f / 37) * 5 * shake, ry = Math.sin(f / 23) * 4 * shake, rot = Math.sin(f / 51) * 0.25 * shake;
  return (
    <AbsoluteFill style={{ transform: `translate(${rx}px,${ry}px) rotate(${rot}deg) scale(${sc})` }}>
      <div style={{ position: 'absolute', left: 0, top, width: 1080, height: 2148, boxShadow: '0 0 60px rgba(0,0,0,.25)' }}>
        <OffthreadVideo src={staticFile('footage/compress-v7.mp4')} startFrom={S(from)} playbackRate={Math.min(4, Math.max(0.2, (to - from) / dur(k)))} muted style={{ width: 1080, height: 2148 }} />
      </div>
    </AbsoluteFill>
  );
};
const Hold = ({ img, top = 0, shake = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ transform: `translate(${Math.sin(f / 37) * 5 * shake}px,${Math.sin(f / 23) * 4 * shake}px) rotate(${Math.sin(f / 51) * 0.25 * shake}deg) scale(${1.02 + (f / 90) * 0.012})` }}>
      <Img src={staticFile(`ref/${img}`)} style={{ position: 'absolute', left: 0, top, width: 1080, height: 2148 }} />
    </AbsoluteFill>
  );
};

const Sc = ({ k, children }) => <Sequence from={S(SCN[k][0])} durationInFrames={S(dur(k)) + 3}>{children}</Sequence>;

// paper-label captions at the top, active word highlighted
const Captions = () => {
  const t = useT();
  if (t >= SCN.H[0]) return null;
  const cur = CAP.findIndex((w) => t >= w.s && t < w.e);
  if (cur < 0) return null;
  const w0 = CAP[cur], lineWords = CAP.filter((w) => w.line === w0.line);
  const start = Math.floor(w0.i / 4) * 4, chunk = lineWords.slice(start, start + 4), curI = w0.i - start;
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 46, display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(255,252,238,.96)', padding: '14px 36px 20px', transform: 'rotate(-1.2deg)', boxShadow: '0 10px 18px rgba(30,25,10,.3)', fontFamily: hand, fontWeight: 700, fontSize: 92, color: '#23232f', lineHeight: 1.05, textAlign: 'center' }}>
        {chunk.map((w, j) => <span key={j} style={{ background: j === curI ? '#ffd02f' : 'transparent', padding: '0 10px', borderRadius: 8 }}>{w.w} </span>)}
      </div>
    </div>
  );
};

// hand-drawn wobble that re-seeds ~8x a second (the "boiling line" of hand animation)
const Wobble = ({ children }) => {
  const seed = Math.floor(useCurrentFrame() / 4) % 4;
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}><filter id="wob"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed={seed + 1} /><feDisplacementMap in="SourceGraphic" scale="7" /></filter></svg>
      <AbsoluteFill style={{ filter: 'url(#wob)' }}>{children}</AbsoluteFill>
    </>
  );
};

const Cue = ({ t, name, v = 0.5 }) => <Sfx at={t} name={name} volume={v} />;

export const Doodle = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    {/* A · 11:58 PM — the problem, on the real tool's start page */}
    <Sc k="A">
      <Hold img="f1.0.png" />
      <AbsoluteFill style={{ background: 'rgba(30,20,60,.18)' }} />
      <Wobble>
        <Note at={0.5} style={{ left: 70, top: 760, width: 470, fontSize: 96, lineHeight: 1, transform: 'rotate(-5deg)' }}>11:58 PM<div style={{ fontSize: 56, marginTop: 8 }}>closes at 12:00</div></Note>
        <Write at={at('A', 'd2', 1.3)} style={{ left: 560, top: 1010, fontSize: 150, transform: 'rotate(-4deg)' }}>19.3 MB</Write>
        <Ink><Pen d="M545 1100 C 700 1060, 900 1090, 1010 1040" at={at('A', 'd2', 2.0)} color="#c0392b" w={14} /></Ink>
        <Write at={at('A', 'd2', 2.6)} style={{ left: 600, top: 1160, fontSize: 80, color: '#c0392b', transform: 'rotate(-3deg)' }}>limit: 10 MB</Write>
      </Wobble>
      <Cue t={0.5} name="pop" /><Cue t={at('A', 'd2', 1.3)} name="tick" v={0.5} /><Cue t={at('A', 'd2', 3.2)} name="impact" v={0.5} />
    </Sc>

    {/* B · a friend's tip */}
    <Sc k="B">
      <Hold img="f1.0.png" />
      <AbsoluteFill style={{ background: 'rgba(30,20,60,.1)' }} />
      <Wobble>
        <Ink>
          <Pen d="M30 398 C 200 380, 380 420, 560 392 S 900 380, 1050 398" at={at('B', 'd3', 1.6)} w={12} />
          <Pen d="M280 1000 C 240 920, 300 840, 330 800" at={at('B', 'd3', 2.6)} w={10} />
          <Pen d="M300 842 L332 796 L372 830" at={at('B', 'd3', 3.0)} w={10} />
        </Ink>
        <Write at={at('B', 'd3', 0.6)} style={{ left: 60, top: 1010, fontSize: 104, transform: 'rotate(-3deg)' }}>free · no sign-up</Write>
        <Write at={at('B', 'd3', 2.2)} style={{ left: 330, top: 1120, fontSize: 84, color: BLUE, transform: 'rotate(2deg)' }}>runs in your browser</Write>
      </Wobble>
      <Cue t={at('B', 'd3', 0.6)} name="tick" v={0.5} /><Cue t={at('B', 'd3', 1.6)} name="tick" v={0.5} />
    </Sc>

    {/* C · select the file */}
    <Sc k="C">
      <Footage k="C" from={1.0} to={2.2} />
      <Wobble>
        <Ink>
          <Pen d="M135 590 C 130 480, 560 470, 950 510 C 1010 560, 1000 650, 940 690 C 700 715, 300 715, 150 680 C 100 650, 110 610, 135 590 Z" at={0.15} len={0.55} />
          <Pen d="M860 900 C 930 830, 960 760, 890 700" at={0.5} w={10} />
          <Pen d="M860 740 L888 696 L936 724" at={0.8} w={10} />
        </Ink>
        <Write at={0.45} style={{ left: 600, top: 920, fontSize: 96, transform: 'rotate(-4deg)' }}>start here!</Write>
      </Wobble>
      <Cue t={0.15} name="tick" v={0.5} /><Cue t={0.9} name="pop" />
    </Sc>

    {/* D · pick maximum */}
    <Sc k="D">
      <Footage k="D" from={4.5} to={5.9} top={-200} />
      <Wobble>
        <Ink>
          <Pen d="M70 360 C 60 300, 520 290, 1000 330 C 1030 400, 1020 480, 990 520 C 800 540, 200 545, 80 510 C 40 470, 50 400, 70 360 Z" at={0.1} len={0.55} />
          <Pen d="M640 1010 C 760 930, 700 700, 560 600" at={0.5} w={11} />
          <Pen d="M520 660 L560 596 L626 640" at={0.85} w={11} />
        </Ink>
        <Write at={0.45} style={{ left: 330, top: 1030, fontSize: 132, transform: 'rotate(-5deg)' }}>pick MAX!</Write>
        <Write at={0.9} style={{ left: 360, top: 1180, fontSize: 70, color: BLUE, transform: 'rotate(-2deg)' }}>smallest file ↓</Write>
      </Wobble>
      <Cue t={0.1} name="tick" v={0.5} /><Cue t={0.95} name="pop" />
    </Sc>

    {/* E · tap compress */}
    <Sc k="E">
      <Footage k="E" from={6.0} to={8.2} top={-200} />
      <Wobble>
        <Ink>
          <Pen d="M50 1850 C 40 1790, 400 1770, 1030 1800 C 1060 1850, 1050 1900, 1010 1915 C 700 1925, 300 1925, 70 1910 C 40 1890, 40 1870, 50 1850 Z" at={0.1} len={0.55} />
          <Pen d="M540 1620 C 520 1680, 530 1730, 540 1770" at={0.45} w={11} />
          <Pen d="M500 1730 L540 1776 L586 1728" at={0.75} w={11} />
        </Ink>
        <Write at={0.4} style={{ left: 300, top: 1500, fontSize: 130, transform: 'rotate(-3deg)' }}>tap compress</Write>
      </Wobble>
      <Cue t={0.1} name="tick" v={0.5} /><Cue t={0.7} name="pop" />
    </Sc>

    {/* F · 19.3 MB → 815 KB */}
    <Sc k="F">
      <Footage k="F" from={9.0} to={12.4} />
      <Wobble>
        <Write at={0.25} len={0.4} style={{ left: 120, top: 1290, fontSize: 170, color: '#2b2b33', transform: 'rotate(-3deg)' }}>19.3 MB</Write>
        <Ink>
          <Pen d="M100 1400 C 300 1360, 520 1400, 720 1350" at={0.75} w={16} color="#c0392b" />
          <Pen d="M760 1560 C 700 1500, 600 1500, 470 1510" at={1.15} w={11} />
          <Pen d="M505 1470 L462 1512 L512 1552" at={1.45} w={11} />
        </Ink>
        <Write at={1.4} len={0.5} style={{ left: 250, top: 1550, fontSize: 210, color: '#0a9a56', transform: 'rotate(-2deg)', background: 'linear-gradient(transparent 55%, #ffe066 55%)', padding: '0 14px' }}>815 KB</Write>
        <Write at={2.2} style={{ left: 330, top: 1780, fontSize: 78, color: BLUE, transform: 'rotate(2deg)' }}>96% smaller ✓</Write>
      </Wobble>
      <Cue t={0.25} name="tick" v={0.5} /><Cue t={0.75} name="tick" v={0.5} /><Cue t={1.4} name="success" v={0.7} />
    </Sc>

    {/* G · submitted */}
    <Sc k="G">
      <Hold img="f13.0.png" />
      <Wobble>
        <Ink><Pen d="M60 1120 C 60 1080, 520 1070, 1020 1100 C 1050 1180, 1030 1260, 990 1280 C 700 1300, 200 1300, 90 1270 C 40 1230, 40 1160, 60 1120 Z" at={0.15} len={0.6} color="#0a9a56" w={12} /></Ink>
        <Stamp at={0.8} style={{ left: 110, top: 1470, fontSize: 130, transform: 'rotate(-8deg)' }}>SUBMITTED</Stamp>
        <Note at={1.2} style={{ left: 600, top: 1640, width: 360, fontSize: 82, lineHeight: 1, transform: 'rotate(6deg)' }}>11:59 PM<div style={{ fontSize: 56 }}>just in time 😮‍💨</div></Note>
      </Wobble>
      <Cue t={0.15} name="tick" v={0.5} /><Cue t={0.8} name="impact" v={0.7} /><Cue t={1.2} name="pop" /><Cue t={0.2} name="success" v={0.8} />
    </Sc>

    {/* H · end card, drawn on paper */}
    <Sc k="H">
      <AbsoluteFill style={{ background: PAPER }} />
      <AbsoluteFill style={{ backgroundImage: NOISE, opacity: 0.22 }} />
      <Wobble>
        <Write at={0.1} len={0.6} style={{ left: 90, top: 330, fontSize: 210, fontFamily: marker, color: '#2b2b33', transform: 'rotate(-3deg)' }}>No uploads.</Write>
        <Write at={0.8} style={{ left: 130, top: 640, fontSize: 92, color: BLUE }}>your file never leaves your phone</Write>
        {['Free', 'Private', 'No sign-up'].map((x, i) => (
          <React.Fragment key={x}>
            <Ink><Pen d={`M130 ${900 + i * 140} L180 ${950 + i * 140} L270 ${840 + i * 140}`} at={1.3 + i * 0.3} len={0.25} color="#0a9a56" w={20} /></Ink>
            <Write at={1.3 + i * 0.3} style={{ left: 320, top: 860 + i * 140, fontSize: 110, color: '#2b2b33' }}>{x}</Write>
          </React.Fragment>
        ))}
        <Write at={2.4} len={0.6} style={{ left: 120, top: 1480, fontSize: 138, fontFamily: marker, color: '#4E5CD6', transform: 'rotate(-2deg)' }}>pdfsection.com</Write>
        <Ink><Pen d="M110 1650 C 400 1700, 700 1620, 1000 1670" at={3.0} w={14} /></Ink>
      </Wobble>
      <Cue t={0.1} name="pop" /><Cue t={1.3} name="pop" v={0.4} /><Cue t={1.6} name="pop" v={0.4} /><Cue t={1.9} name="pop" v={0.4} /><Cue t={2.4} name="glass" v={0.5} />
    </Sc>

    <Captions />
    <AbsoluteFill style={{ opacity: 0.12, mixBlendMode: 'multiply', backgroundImage: NOISE, pointerEvents: 'none' }} />
    {V.map((l) => <Sequence key={l.id} from={S(L[l.id].s)}><Audio src={staticFile(`voice/doodle/${l.id}.mp3`)} /></Sequence>)}
    <Audio src={sfx('music')} volume={0.09} />
  </AbsoluteFill>
);
