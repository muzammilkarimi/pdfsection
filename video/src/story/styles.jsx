import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat';
import { loadFont as loadMarker } from '@remotion/google-fonts/PermanentMarker';
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

const hand = loadCaveat().fontFamily, marker = loadMarker().fontFamily, anton = loadAnton().fontFamily, inter = loadInter().fontFamily;
const FRAME = staticFile('ref/f4.5.png'), DONE = staticFile('ref/f9.2.png');

const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .4 0 0 0 0 .3 0 0 0 0 .2 0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
const torn = 'polygon(0% 3%,6% 0%,13% 2%,21% 0%,30% 2.5%,39% 0%,48% 2%,58% 0%,67% 2.5%,77% 0%,87% 2%,95% 0%,100% 3%,100% 97%,94% 100%,85% 98%,75% 100%,64% 97.5%,53% 100%,42% 98%,31% 100%,20% 97.5%,11% 100%,4% 98%,0% 100%)';

// ═══ 1 · paper collage ═══
export const Collage = () => (
  <AbsoluteFill style={{ background: '#cdb48a', fontFamily: hand }}>
    <AbsoluteFill style={{ backgroundImage: NOISE, opacity: 0.7 }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 30% 10%, rgba(255,240,200,.5), transparent 60%)' }} />
    {/* torn paper sheet with the problem */}
    <div style={{ position: 'absolute', left: 70, top: 150, width: 600, height: 520, transform: 'rotate(-4deg)', filter: 'drop-shadow(0 14px 18px rgba(60,35,10,.4))' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#fbf7ec', clipPath: torn }} />
      <div style={{ position: 'absolute', left: 50, top: 60, fontFamily: marker, fontSize: 190, color: '#2b2b33', lineHeight: 1 }}>19.3</div>
      <div style={{ position: 'absolute', left: 60, top: 270, fontFamily: marker, fontSize: 110, color: '#2b2b33' }}>MB</div>
      <div style={{ position: 'absolute', left: 50, top: 420, fontSize: 52, color: '#555' }}>limit: 10 MB</div>
    </div>
    {/* red stamp */}
    <div style={{ position: 'absolute', left: 520, top: 520, transform: 'rotate(12deg)', border: '10px solid #c0392b', color: '#c0392b', fontFamily: marker, fontSize: 96, padding: '4px 26px', opacity: 0.88, borderRadius: 10 }}>TOO BIG</div>
    {/* tape */}
    <div style={{ position: 'absolute', left: 250, top: 120, width: 190, height: 60, background: 'rgba(240,226,160,.8)', transform: 'rotate(-6deg)', boxShadow: '0 2px 4px rgba(0,0,0,.2)' }} />
    {/* sticky note */}
    <div style={{ position: 'absolute', left: 700, top: 130, width: 290, height: 290, background: '#ffe066', transform: 'rotate(5deg)', boxShadow: '0 12px 16px rgba(60,35,10,.35)', padding: 30, fontSize: 64, lineHeight: 1.05, color: '#3b3200' }}>
      DEADLINE<br />12:00 AM<div style={{ fontSize: 52, marginTop: 14 }}>11:58 now 😬</div>
    </div>
    {/* real tool footage as a pasted photo */}
    <div style={{ position: 'absolute', left: 300, top: 720, width: 560, background: '#fff', padding: '20px 20px 70px', transform: 'rotate(3deg)', boxShadow: '0 20px 28px rgba(60,35,10,.45)' }}>
      <Img src={FRAME} style={{ width: 520, height: 780, objectFit: 'cover', objectPosition: 'top' }} />
      <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 50, color: '#333' }}>the fix (real app)</div>
    </div>
    <div style={{ position: 'absolute', left: 280, top: 690, width: 170, height: 56, background: 'rgba(240,226,160,.85)', transform: 'rotate(-20deg)' }} />
    {/* ink arrow + note */}
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
      <path d="M180 1010 C 170 880, 230 800, 330 880" stroke="#1f3fbf" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M300 840 L338 886 L284 902" stroke="#1f3fbf" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div style={{ position: 'absolute', left: 40, top: 1030, fontSize: 70, color: '#1f3fbf', transform: 'rotate(-6deg)', width: 280, lineHeight: 1 }}>pick <u>MAX</u></div>
    <div style={{ position: 'absolute', left: 70, right: 70, bottom: 120, textAlign: 'center', fontFamily: marker, fontSize: 70, color: '#2b2b33' }}>shrink it <span style={{ background: '#ffd02f', padding: '0 14px' }}>in seconds</span></div>
  </AbsoluteFill>
);

// ═══ 2 · kinetic typography ═══
export const Kinetic = () => (
  <AbsoluteFill style={{ background: '#4E5CD6', fontFamily: anton, overflow: 'hidden' }}>
    <AbsoluteFill style={{ background: 'repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 60px, transparent 60px 120px)' }} />
    <div style={{ position: 'absolute', left: 60, top: 90, color: '#fff', fontSize: 400, lineHeight: 0.9, letterSpacing: -6, textDecoration: 'line-through', textDecorationThickness: 26, textDecorationColor: '#ff5d5d' }}>19.3</div>
    <div style={{ position: 'absolute', left: 66, top: 470, color: '#c9ceff', fontSize: 170, letterSpacing: 8 }}>MB</div>
    <div style={{ position: 'absolute', right: 50, top: 520, color: '#c9ceff', fontFamily: inter, fontWeight: 800, fontSize: 52, width: 330, textAlign: 'right', lineHeight: 1.1 }}>LIMIT 10 MB<br />DEADLINE IN 2:00</div>
    <div style={{ position: 'absolute', left: 60, top: 760, color: '#ffd02f', fontSize: 330, lineHeight: 0.95, letterSpacing: -4 }}>815<br /><span style={{ fontSize: 200 }}>KB</span></div>
    <div style={{ position: 'absolute', right: 70, top: 800, width: 400, height: 790, borderRadius: 40, overflow: 'hidden', border: '12px solid #fff', transform: 'rotate(5deg)', boxShadow: '0 30px 60px rgba(10,10,60,.55)' }}>
      <Img src={DONE} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
    </div>
    <div style={{ position: 'absolute', left: 60, bottom: 130, color: '#fff', fontFamily: inter, fontWeight: 800, fontSize: 62 }}>FREE · PRIVATE · NO UPLOADS</div>
  </AbsoluteFill>
);

// ═══ 3 · hand-drawn on real footage ═══
const ink = '#ff3b6b';
export const Doodle = () => (
  <AbsoluteFill style={{ background: '#f3f4fb', overflow: 'hidden', fontFamily: hand }}>
    <Img src={FRAME} style={{ position: 'absolute', left: 0, top: -200, width: 1080, height: 2148 }} />
    <AbsoluteFill style={{ background: 'rgba(20,20,60,.12)' }} />
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
      <path d="M70 360 C 60 300, 520 290, 1000 330 C 1030 400, 1020 480, 990 520 C 800 540, 200 545, 80 510 C 40 470, 50 400, 70 360 Z" stroke={ink} strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M640 1010 C 760 930, 700 700, 560 600" stroke={ink} strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M520 660 L560 596 L626 640" stroke={ink} strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M90 1830 C 300 1880, 760 1880, 990 1830" stroke={ink} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M60 1790 C 40 1730, 70 1700, 100 1720" stroke={ink} strokeWidth="9" fill="none" strokeLinecap="round" />
    </svg>
    <div style={{ position: 'absolute', left: 330, top: 1000, fontSize: 118, color: ink, transform: 'rotate(-5deg)', lineHeight: 0.95 }}>pick MAX!<div style={{ fontSize: 70 }}>(19 MB → under 1 MB)</div></div>
    <div style={{ position: 'absolute', left: 70, top: 1630, fontSize: 84, color: ink, transform: 'rotate(-3deg)' }}>then tap this 👇</div>
    <div style={{ position: 'absolute', left: 60, top: 100, fontSize: 92, color: '#222', background: '#ffe066', padding: '0 18px', transform: 'rotate(-2deg)' }}>11:58 PM. file too big.</div>
  </AbsoluteFill>
);

// ═══ 4 · real-world macro (stand-in: real footage can't be shot here) ═══
export const Macro = () => (
  <AbsoluteFill style={{ background: '#16100c', fontFamily: inter, overflow: 'hidden' }}>
    {[[160, 260, 220, '#ffb35c'], [820, 180, 280, '#ff8a3d'], [900, 700, 200, '#ffd9a0'], [90, 820, 260, '#c9733a'], [700, 1500, 330, '#ffb35c'], [120, 1550, 240, '#ff9d4f']].map(([x, y, r, c], i) => (
      <div key={i} style={{ position: 'absolute', left: x - r / 2, top: y - r / 2, width: r, height: r, borderRadius: '50%', background: c, opacity: 0.35, filter: 'blur(14px)' }} />
    ))}
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 760, background: 'linear-gradient(180deg,#3a2616,#1b110a)', transform: 'perspective(900px) rotateX(30deg)', transformOrigin: 'bottom' }} />
    <div style={{ position: 'absolute', left: 230, top: 330, width: 620, height: 1230, borderRadius: 74, background: '#0c0d12', padding: 18, transform: 'rotate(-8deg)', boxShadow: '0 60px 80px rgba(0,0,0,.65)' }}>
      <Img src={FRAME} style={{ width: '100%', height: '100%', borderRadius: 58, objectFit: 'cover', objectPosition: 'top' }} />
    </div>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.7))' }} />
    <div style={{ position: 'absolute', left: 70, bottom: 120, color: '#fff', fontWeight: 800, fontSize: 64, lineHeight: 1.1, textShadow: '0 4px 20px rgba(0,0,0,.8)' }}>11:58 PM.<br /><span style={{ color: '#ffd02f' }}>One tap left.</span></div>
  </AbsoluteFill>
);
