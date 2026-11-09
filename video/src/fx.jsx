import React from 'react';
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, S, fontFamily, useL } from './lib.jsx';

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const out = Easing.bezier(0.16, 1, 0.3, 1);

// cinematic background: aurora blobs + dot grid + vignette + film grain
export const Bg = ({ tone = 'dark', children }) => {
  const f = useCurrentFrame();
  const { W, H } = useL();
  const palettes = {
    dark: ['rgba(78,92,214,.85)', 'rgba(110,125,255,.5)', 'rgba(40,90,230,.4)', '#05061a'],
    indigo: ['rgba(150,162,255,.85)', 'rgba(140,152,255,.5)', 'rgba(90,110,255,.55)', '#232b82'],
    mint: ['rgba(34,201,147,.55)', 'rgba(78,92,214,.7)', 'rgba(40,120,255,.4)', '#04100f'],
    void: ['rgba(60,50,140,.35)', 'rgba(50,60,170,.3)', 'rgba(30,60,140,.2)', '#020208'],
  };
  const [a, b, c, base] = palettes[tone];
  const s = f / 90;
  return (
    <AbsoluteFill style={{ background: base, fontFamily, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: W * 1.0, height: W * 1.0, left: -W * 0.25 + Math.sin(s) * W * 0.08, top: H * 0.35 + Math.cos(s * 0.8) * H * 0.05, borderRadius: '50%', background: `radial-gradient(circle, ${a}, transparent 65%)`, filter: 'blur(30px)' }} />
      <div style={{ position: 'absolute', width: W * 0.8, height: W * 0.8, right: -W * 0.2 + Math.cos(s * 1.1) * W * 0.06, top: -H * 0.15 + Math.sin(s) * H * 0.05, borderRadius: '50%', background: `radial-gradient(circle, ${b}, transparent 65%)`, filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', width: W * 0.6, height: W * 0.6, left: W * 0.35 + Math.sin(s * 1.3) * W * 0.1, top: H * 0.55, borderRadius: '50%', background: `radial-gradient(circle, ${c}, transparent 65%)`, filter: 'blur(40px)' }} />
      <AbsoluteFill style={{ opacity: 0.1, backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 1.2px, transparent 1.4px)', backgroundSize: '46px 46px', backgroundPosition: `${f * 0.4}px ${f * 0.3}px` }} />
      {children}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.65) 100%)', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ backgroundImage: GRAIN, backgroundSize: '240px', backgroundPosition: `${(f * 37) % 240}px ${(f * 91) % 240}px`, opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

// word-by-word masked reveal
export const Words = ({ text, size = 120, delay = 0, stagger = 4, weight = 600, color = '#fff', hi = [], style, lineHeight = 1 }) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${size * 0.26}px`, fontFamily, fontSize: size, fontWeight: weight, letterSpacing: -size * 0.04, lineHeight, ...style }}>
      {words.map((w, i) => {
        const p = interpolate(f - delay - i * stagger, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: out });
        const g = hi.includes(i);
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.16, marginBottom: -size * 0.16, paddingRight: size * 0.04 }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 115}%) rotate(${(1 - p) * 4}deg)`, transformOrigin: '0 100%', opacity: Math.min(1, p * 2.5), color: g ? 'transparent' : color, background: g ? 'linear-gradient(90deg,#8A96F5,#AEB7FB 55%,#C9CFFF)' : undefined, WebkitBackgroundClip: g ? 'text' : undefined, backgroundClip: g ? 'text' : undefined }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

export const Outline = ({ children, size, style, opacity = 0.14 }) => (
  <div style={{ fontFamily, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.05, color: 'transparent', WebkitTextStroke: `2px rgba(255,255,255,${opacity})`, whiteSpace: 'nowrap', lineHeight: 1, ...style }}>{children}</div>
);

export const Ring = ({ at, size = 400, color = '#8A96F5', dur = 26, x = '50%', y = '50%' }) => {
  const f = useCurrentFrame() - S(at);
  if (f < 0 || f > dur) return null;
  const p = f / dur;
  return <div style={{ position: 'absolute', left: x, top: y, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: '50%', border: `${6 * (1 - p) + 1}px solid ${color}`, opacity: 1 - p, transform: `scale(${0.2 + p * 2.6})`, boxShadow: `0 0 60px ${color}` }} />;
};

export const Flash = ({ at = 0, color = '#fff', dur = 9 }) => {
  const f = useCurrentFrame() - S(at);
  return <AbsoluteFill style={{ background: color, opacity: f >= 0 && f < dur ? (1 - f / dur) * 0.9 : 0, pointerEvents: 'none' }} />;
};

export const Shake = ({ at = 0, amp = 16, children }) => {
  const f = useCurrentFrame() - S(at);
  const k = f >= 0 && f < 14 ? (1 - f / 14) * amp : 0;
  return <AbsoluteFill style={{ transform: `translate(${Math.sin(f * 6.1) * k}px, ${Math.cos(f * 7.7) * k}px)` }}>{children}</AbsoluteFill>;
};

// shown between at..at+dur, slides out on exit
export const Beat = ({ at, dur, children }) => {
  const f = useCurrentFrame();
  const a = S(at), d = S(dur);
  if (f < a || f >= a + d) return null;
  return (
    <Sequence from={a} durationInFrames={d}>
      <Exit dur={d}>{children}</Exit>
    </Sequence>
  );
};
const Exit = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [dur - 6, dur], [1, 0], { extrapolateLeft: 'clamp' });
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${(1 - o) * -40}px)`, alignItems: 'center', justifyContent: 'center' }}>{children}</AbsoluteFill>;
};

// floating particles
export const Sparks = ({ n = 36, seed = 1, color = 'rgba(170,182,255,.8)' }) => {
  const f = useCurrentFrame();
  const { W, H } = useL();
  const r = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233 + seed * 3.1) * 43758.5453; return x - Math.floor(x); };
  return (
    <AbsoluteFill>
      {Array.from({ length: n }, (_, i) => {
        const sp = 0.4 + r(i, 1) * 1.4, size = 2 + r(i, 2) * 5;
        const y = (H + 40) - ((f * sp * 1.6 + r(i, 3) * H * 2) % (H + 80));
        const x = r(i, 4) * W + Math.sin(f / 30 + i) * 20;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: color, opacity: 0.3 + r(i, 5) * 0.6, filter: 'blur(.5px)' }} />;
      })}
    </AbsoluteFill>
  );
};

// a clean paper sheet
export const Doc = ({ w = 260, color = '#4E5CD6', rot = 0, x = 0, y = 0, scale = 1, scaleY = 1, opacity = 1, tag = 'PDF', z = 0, glow = 0 }) => {
  const h = w * 1.32;
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, zIndex: z, opacity,
      transform: `translate(${x}px,${y}px) rotate(${rot}deg) scale(${scale}, ${scale * scaleY})`,
      borderRadius: w * 0.07, background: 'linear-gradient(160deg,#ffffff 0%,#eef0ff 100%)',
      boxShadow: `0 ${w * 0.12}px ${w * 0.3}px rgba(5,3,40,.55), 0 0 0 1px rgba(255,255,255,.7) inset, 0 0 ${glow}px ${color}`, overflow: 'hidden',
    }}>
      <div style={{ height: h * 0.2, background: `linear-gradient(120deg, ${color}, #8A96F5)` }} />
      <div style={{ padding: `${w * 0.09}px ${w * 0.1}px` }}>
        <div style={{ width: '55%', height: w * 0.05, borderRadius: 99, background: '#2b2b52', marginBottom: w * 0.07 }} />
        {[1, 0.92, 1, 0.78, 0.96, 0.6, 0.9].map((k, i) => <div key={i} style={{ width: `${k * 100}%`, height: w * 0.035, borderRadius: 99, background: '#d6d9f3', marginBottom: w * 0.055 }} />)}
      </div>
      <div style={{ position: 'absolute', right: w * 0.07, bottom: w * 0.07, fontFamily, fontWeight: 800, fontSize: w * 0.085, color: '#fff', background: color, padding: `${w * 0.02}px ${w * 0.05}px`, borderRadius: 99 }}>{tag}</div>
    </div>
  );
};

export const Pill = ({ children, size = 44, bg = 'rgba(255,255,255,.1)', color = '#fff', style }) => (
  <div style={{ fontFamily, fontWeight: 600, fontSize: size, color, padding: `${size * 0.28}px ${size * 0.8}px`, borderRadius: 999, background: bg, border: '1.5px solid rgba(255,255,255,.28)', backdropFilter: 'blur(10px)', boxShadow: '0 12px 40px rgba(10,5,60,.45), inset 0 1px 0 rgba(255,255,255,.3)', whiteSpace: 'nowrap', ...style }}>{children}</div>
);

export const useSpring = (delay = 0, damping = 13, stiffness = 140) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, stiffness, mass: 0.8 } });
};

export const ease = (f, a, b, from = 0, to = 1, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// draw-on line icons
const stroke = { fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };
export const DeviceIcon = ({ kind, size = 240, progress = 1 }) => {
  const dash = (len) => ({ strokeDasharray: len, strokeDashoffset: len * (1 - progress) });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 14px rgba(138,150,245,.7))' }}>
      {kind === 'desktop' && <><rect x="10" y="18" width="80" height="52" rx="5" {...stroke} {...dash(260)} /><path d="M40 86h20M50 70v16" {...stroke} {...dash(60)} /></>}
      {kind === 'tablet' && <><rect x="22" y="10" width="56" height="80" rx="7" {...stroke} {...dash(280)} /><path d="M46 80h8" {...stroke} {...dash(10)} /></>}
      {kind === 'phone' && <><rect x="33" y="8" width="34" height="84" rx="8" {...stroke} {...dash(260)} /><path d="M45 17h10M46 83h8" {...stroke} {...dash(30)} /></>}
    </svg>
  );
};

export const Lock = ({ size = 260, closed = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 24px rgba(34,201,147,.8))' }}>
    <path d={`M31 ${46 - (1 - closed) * 14}V34a19 19 0 0138 0v${12 + 0}`} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" transform={`translate(0 ${-(1 - closed) * 10})`} />
    <rect x="22" y="44" width="56" height="42" rx="9" fill="#22c993" />
    <circle cx="50" cy="62" r="5" fill="#05061a" /><rect x="48" y="64" width="4" height="10" rx="2" fill="#05061a" />
  </svg>
);

export const Star = ({ size, rot = 0, glow = 0.7 }) => (
  <svg width={size} height={size} viewBox="-1 -1 2 2" style={{ transform: `rotate(${rot}deg)`, filter: `drop-shadow(0 0 ${40 * glow}px rgba(138,150,245,.8))` }}>
    <defs><linearGradient id="sg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8A96F5" /><stop offset="1" stopColor="#B4BCFA" /></linearGradient></defs>
    <path d="M0,-1 C0.1,-0.14 0.14,-0.1 1,0 C0.14,0.1 0.1,0.14 0,1 C-0.1,0.14 -0.14,0.1 -1,0 C-0.14,-0.1 -0.1,-0.14 0,-1Z" fill="url(#sg2)" />
  </svg>
);
