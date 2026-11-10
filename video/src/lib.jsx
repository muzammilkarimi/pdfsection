import React from 'react';
import {
  AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

export const { fontFamily } = loadFont('normal', { weights: ['300', '500', '600', '800'] });

export const C = {
  ink: '#07061a', violet: '#4E5CD6', deep: '#2a1f7a', glow: '#8A96F5', pink: '#B4BCFA', blue: '#4aa8ff',
  lav: '#eceaff', white: '#ffffff', green: '#22c993', red: '#ff5d7a',
};
export const FPS = 30;
export const S = (s) => Math.round(s * FPS);
export const sfx = (n) => staticFile(`sfx/${n}.wav`);

// layout helper: wide (16:9) or vertical (9:16)
export const useL = () => {
  const { width: W, height: H } = useVideoConfig();
  return { W, H, v: H > W, u: W / 1920 };
};

export const Sfx = ({ at, name, volume = 1 }) => (
  <Sequence from={S(at)} durationInFrames={S(3)} layout="none"><Audio src={sfx(name)} volume={volume * 0.55} /></Sequence>
);

const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const useIn = (delay = 0, dur = 20) => {
  const f = useCurrentFrame();
  return interpolate(f - delay, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
};

// ---- backgrounds ----
export const DarkBg = ({ children, hue = 0 }) => {
  const f = useCurrentFrame();
  const { W, H } = useL();
  const a = Math.sin(f / 70), b = Math.cos(f / 90);
  return (
    <AbsoluteFill style={{ background: C.ink, fontFamily, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: W * 1.1, height: W * 1.1, left: -W * 0.2 + a * 80, top: H * 0.45 + b * 60, borderRadius: '50%', background: `radial-gradient(circle, rgba(${110 + hue},70,255,.75), rgba(60,30,160,.0) 65%)` }} />
      <div style={{ position: 'absolute', width: W * 0.8, height: W * 0.8, right: -W * 0.25 - a * 60, top: -H * 0.2 + b * 50, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,80,255,.45), rgba(60,30,160,0) 65%)' }} />
      {children}
    </AbsoluteFill>
  );
};

export const LightBg = ({ children }) => {
  const f = useCurrentFrame();
  const { W, H } = useL();
  return (
    <AbsoluteFill style={{ background: '#f6f5ff', fontFamily, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: W * 0.9, height: W * 0.9, right: -W * 0.2 + Math.sin(f / 60) * 70, bottom: -H * 0.25, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,150,245,.55), rgba(138,150,245,0) 65%)' }} />
      <div style={{ position: 'absolute', width: W * 0.7, height: W * 0.7, left: -W * 0.2, top: -H * 0.2 + Math.cos(f / 80) * 50, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,125,255,.3), rgba(199,125,255,0) 65%)' }} />
      {children}
    </AbsoluteFill>
  );
};

// cross-fade wrapper (scene starts a little early and fades in over the previous one)
export const Scene = ({ children, from, dur, fade = 8 }) => (
  <Sequence from={S(from) - fade} durationInFrames={S(dur) + fade}>
    <SceneFade fade={fade}>{children}</SceneFade>
  </Sequence>
);
const SceneFade = ({ children, fade }) => {
  const f = useCurrentFrame();
  const o = fade > 0 ? interpolate(f, [0, fade], [0, 1], { extrapolateRight: 'clamp' }) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// ---- type ----
export const Txt = ({ children, size = 64, weight = 500, color = '#fff', delay = 0, style, rise = 24, center = true }) => {
  const p = useIn(delay, 22);
  return (
    <div style={{
      fontFamily, fontSize: size, fontWeight: weight, color, letterSpacing: -size * 0.025, lineHeight: 1.08,
      opacity: p, transform: `translateY(${(1 - p) * rise}px)`, filter: `blur(${(1 - p) * 8}px)`,
      textAlign: center ? 'center' : 'left', ...style,
    }}>{children}</div>
  );
};

export const Grad = ({ children }) => (
  <span style={{ background: 'linear-gradient(90deg,#8A96F5,#B4BCFA 60%,#C9CFFF)', WebkitBackgroundClip: 'text', color: 'transparent' }}>{children}</span>
);

// giant word that scrolls across and crops off-screen
export const BigScroll = ({ text, dur, size, color = '#fff', from = 1, y = '50%', weight = 600 }) => {
  const f = useCurrentFrame();
  const { W } = useL();
  const tw = text.length * size * 0.56;
  const t = interpolate(f, [0, S(dur)], [0, 1], { easing: Easing.bezier(0.3, 0.1, 0.3, 1), extrapolateRight: 'clamp' });
  const x = interpolate(t, [0, 1], from > 0 ? [W * 0.92, -tw + W * 0.1] : [-tw + W * 0.1, W * 0.92]);
  return (
    <div style={{ position: 'absolute', top: y, left: 0, transform: `translate(${x}px,-50%)`, fontFamily, fontSize: size, fontWeight: weight, color, letterSpacing: -size * 0.04, whiteSpace: 'nowrap', lineHeight: 1 }}>{text}</div>
  );
};

// ---- icons ----
const ICONS = {
  plus: <path d="M12 5v14M5 12h14" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  file: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></>,
  compress: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />,
  scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M8.5 8l11 10M8.5 16L19.5 6" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></>,
};
export const Icon = ({ name, size = 60, color = '#fff', stroke = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{ICONS[name]}</svg>
);

export const GlassTile = ({ name, size = 150, style, delay = 0 }) => {
  const f = useCurrentFrame();
  const p = useIn(delay, 24);
  const bob = Math.sin((f + delay * 3) / 22) * 10;
  return (
    <div style={{
      position: 'absolute', width: size, height: size, borderRadius: size * 0.24, display: 'grid', placeItems: 'center',
      background: 'linear-gradient(145deg, rgba(255,255,255,.14), rgba(255,255,255,.03))', border: '1.5px solid rgba(255,255,255,.22)',
      boxShadow: '0 20px 60px rgba(20,10,80,.5), inset 0 1px 0 rgba(255,255,255,.25)', backdropFilter: 'blur(8px)',
      opacity: p, transform: `translateY(${bob + (1 - p) * 60}px) scale(${0.6 + p * 0.4})`, ...style,
    }}><Icon name={name} size={size * 0.46} /></div>
  );
};

// ---- real UI footage with a camera that pushes into regions ----
// keys: [{ t, x, y, w }] in footage pixels (1600x900), t in scene seconds
export const Cam = ({ src, startSec, rate = 1, fw, fh, keys, marks = [], radius = 26, vw = 1600, vh = 900 }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const ts = keys.map((k) => k.t);
  const lerp = (p) => interpolate(t, ts, keys.map((k) => k[p]), { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const x = lerp('x'), y = lerp('y'), w = lerp('w');
  const s = fw / w;
  return (
    <div style={{ width: fw, height: fh, overflow: 'hidden', position: 'relative', borderRadius: radius, background: '#f7f8fa' }}>
      <div style={{ position: 'absolute', width: vw, height: vh, transformOrigin: '0 0', transform: `translate(${-x * s}px,${-y * s}px) scale(${s})` }}>
        <OffthreadVideo src={staticFile(`footage/${src}.mp4`)} startFrom={S(startSec)} playbackRate={rate} muted style={{ width: vw, height: vh }} />
        {marks.map((m, i) => {
          const a = interpolate(t, [m.t0, m.t0 + 0.35, m.t1 - 0.3, m.t1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return <div key={i} style={{ position: 'absolute', left: m.x, top: m.y, width: m.w, height: m.h, borderRadius: 22, border: '4px solid #8A96F5', boxShadow: '0 0 0 6px rgba(138,150,245,.18), 0 0 40px rgba(138,150,245,.7)', opacity: a, transform: `scale(${1.06 - a * 0.06})` }} />;
        })}
      </div>
    </div>
  );
};

// framed UI with optional 3D tilt
export const Frame = ({ children, tilt = 0, scale = 1, style, w, h }) => (
  <div style={{ perspective: 2400, ...style }}>
    <div style={{
      width: w, height: h, borderRadius: 30, padding: 10, boxSizing: 'content-box',
      background: 'rgba(255,255,255,.55)', border: '1px solid rgba(255,255,255,.7)',
      boxShadow: '0 50px 120px rgba(40,20,140,.45), 0 0 0 1px rgba(255,255,255,.4) inset',
      transform: `rotateX(${tilt}deg) scale(${scale})`, transformOrigin: '50% 100%',
    }}>{children}</div>
  </div>
);

export const Chip = ({ children, delay = 0, color = C.glow, size = 40 }) => {
  const p = useIn(delay, 18);
  return (
    <div style={{ fontFamily, fontStyle: 'italic', fontWeight: 600, fontSize: size, letterSpacing: -1, color, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>{children}</div>
  );
};

export const Pill = ({ children, size = 44 }) => (
  <div style={{
    flex: 'none', fontFamily, fontWeight: 500, fontSize: size, color: '#fff', padding: `${size * 0.35}px ${size * 0.9}px`, borderRadius: 999,
    background: 'linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.05))', border: '1.5px solid rgba(255,255,255,.25)',
    boxShadow: '0 10px 30px rgba(20,10,80,.4), inset 0 1px 0 rgba(255,255,255,.3)', whiteSpace: 'nowrap',
  }}>{children}</div>
);

export const Spring = (delay = 0, damping = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, stiffness: 120, mass: 0.8 } });
};
