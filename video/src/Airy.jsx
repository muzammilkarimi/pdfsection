// "Airy" launch film: light/dark acts, word-by-word blur reveals, sparkle transitions, real UI on 3D planes.
// Style reference: Zelios SaaS films (LangEase, Supahub). 60s, works for 16:9 and 9:16 via useL().
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { useL, Sfx } from './lib.jsx';
import { AppCursor, COMPRESS_PTS, CompressApp, FILES, FileCard, HomeApp, MergeApp, MobileApp, SplitApp, SuccessCard } from './AppUI.jsx';

const { fontFamily: inter } = loadFont('normal', { weights: ['400', '500', '600'] });

const A = { bg: '#f6f6fd', ink: '#15173d', soft: '#6b6f9a', brand: '#4E5CD6', dark: '#080920', lilac: '#c3caff' };
const GRAD = 'linear-gradient(95deg,#4E5CD6 0%,#6f7cff 50%,#9aa6ff 100%)';
const GRAD_D = 'linear-gradient(95deg,#8d99ff 0%,#b9c1ff 55%,#e6e9ff 100%)';
const STAR = 'M50 0 C54 36 64 46 100 50 C64 54 54 64 50 100 C46 64 36 54 0 50 C36 46 46 36 50 0Z';

// ---------- motion helpers ----------
const FPS = 30;
const fr = (s) => Math.round(s * FPS);
const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const BACK = Easing.out(Easing.back(1.7));
const ip = (s, a, b, x, y, e = OUT) => interpolate(s, [a, b], [x, y], { ...CL, easing: e });
const kf = (s, ks, e = IO) => interpolate(s, ks.map((k) => k[0]), ks.map((k) => k[1]), { ...CL, easing: e });
const pick = (v, a, b) => (v ? b : a);
const useS = () => useCurrentFrame() / FPS;

// ---------- type ----------
const Word = ({ text, t, out, kind = 'ink', dark }) => {
  const s = useS();
  const p = ip(s, t, t + 0.42, 0, 1);
  const o = out == null ? 1 : ip(s, out, out + 0.32, 1, 0, Easing.in(Easing.cubic));
  const grad = kind === 'grad';
  const glow = kind === 'glow' || (grad && dark);
  const col = grad
    ? { backgroundImage: dark ? GRAD_D : GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: '0.08em' }
    : { color: kind === 'white' ? '#ffffff' : kind === 'soft' ? A.soft : kind === 'glow' ? '#d9ddff' : A.ink };
  return (
    <span style={{
      display: 'inline-block', whiteSpace: 'pre', opacity: p * o,
      transform: `translateY(${(1 - p) * 0.3}em) scale(${0.94 + 0.06 * p + (1 - o) * 0.08})`,
      filter: `blur(${(1 - p) * 14 + (1 - o) * 18}px)${glow ? ' drop-shadow(0 0 22px rgba(130,145,255,.7))' : ''}`, ...col,
    }}>{text}</span>
  );
};
const Spark = ({ t, out, size, dark, color }) => {
  const s = useS();
  const p = ip(s, t, t + 0.45, 0, 1, BACK);
  const o = out == null ? 1 : ip(s, out, out + 0.3, 1, 0);
  return (
    <span style={{ display: 'inline-block', width: size * 0.62, height: size * 0.62, alignSelf: 'center', transform: `scale(${p * o}) rotate(${(1 - p) * -140 + s * 20}deg)`, filter: `drop-shadow(0 0 ${dark ? 18 : 10}px rgba(120,135,255,.85))` }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%"><path d={STAR} fill={color || (dark ? '#ffffff' : A.brand)} /></svg>
    </span>
  );
};
// words: [text, t, kind]; '✦' = sparkle
const Line = ({ words, size, top, dark, out, weight = 500, align = 'center', left = '5%', right = '5%', gap = 0.26 }) => {
  const { H } = useL();
  return (
    <div style={{
      position: 'absolute', left, right, top: top ?? H / 2, transform: 'translateY(-50%)', display: 'flex', flexWrap: 'wrap',
      justifyContent: align, alignItems: 'baseline', columnGap: `${gap}em`, rowGap: '0.04em', fontFamily: inter, fontWeight: weight,
      fontSize: size, letterSpacing: '-0.035em', lineHeight: 1.12, textAlign: align,
    }}>
      {words.map(([text, t, kind], i) => (text === '✦'
        ? <Spark key={i} t={t} out={out} size={size} dark={dark} />
        : <Word key={i} text={text} t={t} out={out} kind={kind} dark={dark} />))}
    </div>
  );
};
const StarAt = ({ x, y, size, rot = 0, color = '#fff', glow = 'rgba(140,155,255,.9)', op = 1, blur = 0 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `rotate(${rot}deg)`, opacity: op, filter: `drop-shadow(0 0 ${Math.max(8, size * 0.08)}px ${glow})${blur ? ` blur(${blur}px)` : ''}`, overflow: 'visible' }}>
    <path d={STAR} fill={color} />
  </svg>
);
const Twinkles = ({ pts, t0 = 0, dark }) => {
  const s = useS();
  return pts.map(([x, y, sz, d], i) => {
    const k = Math.max(0, Math.sin((s - t0 - d) * 3.2));
    return s > t0 + d ? <StarAt key={i} x={x} y={y} size={sz * (0.4 + 0.6 * k)} rot={s * 40 + i * 30} color={dark ? '#fff' : A.brand} op={0.35 + 0.65 * k} /> : null;
  });
};

// ---------- backgrounds ----------
const LightBg = ({ k = 1 }) => {
  const s = useS(); const { W, H } = useL();
  return (
    <AbsoluteFill style={{ background: A.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: W * 1.3, height: H * 0.9, left: -W * 0.15 + Math.sin(s * 0.5) * 40, top: H * 0.62, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(146,158,255,.55), rgba(146,158,255,0))', opacity: k }} />
      <div style={{ position: 'absolute', width: W * 0.8, height: H * 0.8, left: -W * 0.25, top: H * 0.45 + Math.cos(s * 0.4) * 30, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(196,176,255,.5), rgba(196,176,255,0))', opacity: k }} />
      <div style={{ position: 'absolute', width: W * 0.7, height: H * 0.7, right: -W * 0.2, top: -H * 0.25, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(178,190,255,.3), rgba(178,190,255,0))' }} />
    </AbsoluteFill>
  );
};
const DarkBg = ({ arc = true, glow = 1 }) => {
  const s = useS(); const { W, H } = useL();
  const r = Math.max(W, H) * 0.7;
  return (
    <AbsoluteFill style={{ background: A.dark, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: W * 1.1, height: H * 1.1, right: -W * 0.45, bottom: -H * 0.55, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(78,92,214,.55), rgba(78,92,214,0))', opacity: glow }} />
      <div style={{ position: 'absolute', width: W * 0.9, height: H * 0.9, left: -W * 0.4, top: -H * 0.45, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(92,70,190,.4), rgba(92,70,190,0))', opacity: glow }} />
      {arc && (
        <div style={{
          position: 'absolute', width: r * 2, height: r * 2, left: W / 2 - r + Math.sin(s * 0.3) * 30, top: H * 0.24, borderRadius: '50%',
          border: '2px solid rgba(200,206,255,.75)', boxShadow: '0 0 30px rgba(120,135,255,.65), inset 0 0 30px rgba(120,135,255,.35)',
          WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 8%,transparent 26%)', maskImage: 'linear-gradient(180deg,#000 0%,#000 8%,transparent 26%)',
        }} />
      )}
    </AbsoluteFill>
  );
};

// ---------- UI pieces ----------
// a tilted screen: shows an image (src) or a live animated UI (children, laid out in a bw-wide base space)
const Plane = ({ src, children, bw = 1440, w, h, x, y, rx = 0, ry = 0, rz = 0, sc = 1, op = 1, radius = 26, glow = 1, dark, fade = 0, pos = 'top', blur = 0 }) => (
  <div style={{
    position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: op, borderRadius: radius, overflow: 'hidden', background: '#fff',
    transform: `perspective(2600px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`, filter: blur ? `blur(${blur}px)` : undefined,
    boxShadow: dark
      ? `0 0 0 2px rgba(176,186,255,${0.85 * glow}), 0 0 70px rgba(110,125,255,${0.55 * glow}), 0 50px 100px rgba(0,0,0,.55)`
      : `0 0 0 1.5px rgba(150,162,255,${0.9 * glow}), 0 0 44px rgba(120,135,255,${0.32 * glow}), 0 40px 90px rgba(40,40,120,.16)`,
  }}>
    {children
      ? <div style={{ position: 'absolute', left: 0, top: 0, width: bw, height: (h / w) * bw, transform: `scale(${w / bw})`, transformOrigin: '0 0' }}>{children}</div>
      : <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />}
    {fade > 0 && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) ${100 - fade * 100}%, ${dark ? A.dark : A.bg})` }} />}
  </div>
);
const Cursor = ({ x, y, press = 0, op = 1, size = 44 }) => (
  <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', background: '#1d1e2c', border: '3px solid rgba(255,255,255,.95)', boxSizing: 'border-box', boxShadow: '0 8px 18px rgba(10,10,40,.35)', opacity: op, transform: `scale(${1 - press * 0.28})` }} />
);
const Ripple = ({ x, y, t }) => {
  const s = useS(); const p = ip(s, t, t + 0.5, 0, 1);
  if (s < t || p >= 1) return null;
  return <div style={{ position: 'absolute', left: x - 60 * p, top: y - 60 * p, width: 120 * p, height: 120 * p, borderRadius: '50%', border: `3px solid ${A.brand}`, opacity: 1 - p }} />;
};
// Close-up 3D camera flying over a live UI screen (Quill-style showcase).
// keys: [{ t, x, y, z, rx, ry, rz }] -> focus point (x,y) in the screen's base space, zoom z, tilt in degrees.
const TOP_FADE = 'linear-gradient(180deg, transparent 16%, #000 33%, #000 86%, transparent 100%)';
const Cam3D = ({ t, keys, bw = 1440, bh = 900, sx = 0.5, sy = 0.55, dark, mask, op = 1, blur = 0, children }) => {
  const { W, H } = useL();
  const L = (p, d = 0) => interpolate(t, keys.map((k) => k.t), keys.map((k) => k[p] ?? d), { ...CL, easing: IO });
  const x = L('x'), y = L('y'), z = L('z', 1), rx = L('rx'), ry = L('ry'), rz = L('rz');
  const m = mask ?? 'radial-gradient(ellipse 70% 72% at 50% 52%, #000 58%, transparent 100%)';
  return (
    <AbsoluteFill style={{ opacity: op, filter: blur ? `blur(${blur}px)` : undefined, WebkitMaskImage: m, maskImage: m }}>
      <div style={{ position: 'absolute', left: W * sx, top: H * sy, width: 0, height: 0, transform: `perspective(1800px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${z})` }}>
        <div style={{ position: 'absolute', left: -x, top: -y, width: bw, height: bh, borderRadius: 22, overflow: 'hidden', boxShadow: dark ? '0 0 0 2px rgba(176,186,255,.85), 0 0 90px rgba(110,125,255,.5)' : '0 0 0 1.5px rgba(150,162,255,.85), 0 40px 100px rgba(40,40,120,.18)' }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

const LogoLockup = ({ size, t, dark, x, y }) => { // logo mark + wordmark sliding out from behind it
  const s = useS();
  const m = ip(s, t, t + 0.45, 0, 1, BACK);
  const slide = ip(s, t + 0.45, t + 1.0, 0, 1, IO);
  const ww = size * 5.9, gap = size * 0.32; // wordmark box width (Inter 600 "PDF Section") + gap after the mark
  const shift = (ww * 0.97 + gap) / 2 * slide;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', width: 0, height: 0 }}>
      <div style={{ position: 'absolute', left: -shift + size * 0.62 + gap, top: -size * 0.62, width: ww, height: size * 1.24, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', display: 'flex', alignItems: 'center', fontFamily: inter, fontWeight: 600, fontSize: size, letterSpacing: '-0.04em', whiteSpace: 'nowrap', transform: `translateX(${(slide - 1) * ww}px)`, opacity: slide > 0 ? 1 : 0 }}>
          <span style={{ color: dark ? '#fff' : A.ink }}>PDF</span>&nbsp;<span style={{ color: dark ? '#aeb7ff' : A.brand }}>Section</span>
        </div>
      </div>
      <Img src={staticFile('logo.png')} style={{ position: 'absolute', left: -shift - size * 0.62, top: -size * 0.62, width: size * 1.24, height: size * 1.24, borderRadius: size * 0.28, transform: `scale(${m}) rotate(${(1 - m) * -30}deg)`, boxShadow: dark ? '0 0 50px rgba(110,125,255,.6)' : '0 16px 40px rgba(78,92,214,.35)' }} />
    </div>
  );
};

// ======================= SCENES (local seconds) =======================

// A 0-6: dark hook -> star swallows the screen
const SHook = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 104, 84);
  const g = size * 0.62;
  const grow = ip(s, 4.0, 5.95, 0, 1, Easing.in(Easing.exp));
  const starSize = g + grow * 16000;
  return (
    <AbsoluteFill>
      <DarkBg glow={ip(s, 0, 1.2, 0, 1)} arc={false} />
      <Line size={size} dark out={2.35} words={[['Still', 0.15, 'glow'], ['uploading', 0.5, 'white'], ['your PDFs', 0.85, 'grad']]} />
      <div style={{ position: 'absolute', right: W / 2 + g * 0.8, top: H / 2, transform: 'translateY(-50%)', fontFamily: inter, fontWeight: 500, fontSize: size, letterSpacing: '-0.035em', display: 'flex', gap: '0.26em' }}>
        <Word text="to" t={2.55} out={4.0} kind="white" dark /><Word text="random" t={2.8} out={4.0} kind="grad" dark />
      </div>
      <div style={{ position: 'absolute', left: W / 2 + g * 0.8, top: H / 2, transform: 'translateY(-50%)', fontFamily: inter, fontWeight: 500, fontSize: size, letterSpacing: '-0.035em' }}>
        <Word text="sites?" t={3.3} out={4.0} kind="white" dark />
      </div>
      {s >= 3.05 && <StarAt x={W / 2} y={H / 2} size={starSize * ip(s, 3.05, 3.5, 0, 1, BACK)} rot={(1 - ip(s, 3.05, 3.5, 0, 1)) * -140 + grow * 75 + s * 12} color={grow > 0.02 ? A.bg : '#fff'} />}
      <AbsoluteFill style={{ background: A.bg, opacity: ip(s, 5.75, 5.98, 0, 1) }} />
      <Sfx at={0.3} name="glass" volume={0.35} /><Sfx at={3.05} name="glass" volume={0.5} /><Sfx at={4.6} name="whoosh" volume={0.5} />
    </AbsoluteFill>
  );
};

// B 6-9: brand star lands, morphs into logo, wordmark slides out
const SLogo = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 118, 96);
  const land = ip(s, 0, 0.75, 0, 1, Easing.out(Easing.exp));
  const morph = ip(s, 0.7, 0.95, 1, 0);
  const out = ip(s, 2.55, 2.95, 0, 1, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill>
      <LightBg k={ip(s, 0, 1, 0.3, 1)} />
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, filter: `blur(${out * 16}px)`, transform: `scale(${1 + out * 0.06})` }}>
        {morph > 0 && <StarAt x={W / 2} y={H / 2} size={(size * 1.6 + (1 - land) * 3000) * morph} rot={(1 - land) * -120} color={A.brand} glow="rgba(78,92,214,.5)" />}
        <LogoLockup size={size} t={0.72} x={W / 2} y={H / 2} />
      </div>
      <Sfx at={0.7} name="pop" volume={0.6} /><Sfx at={1.2} name="swipe" volume={0.4} />
    </AbsoluteFill>
  );
};

// C 9-14: sentence, then a depth-blurred keyword cloud with a sharp focus word
const CLOUD = ['Rotate', 'Watermark', 'Sign', 'Unlock', 'Protect', 'OCR', 'Crop', 'Page numbers', 'Edit text', 'JPG to PDF', 'Word to PDF', 'PDF to Excel', 'Repair', 'Organize', 'Extract pages', 'Flatten'];
const FOCUS = [['Merging', 1.7], ['Splitting', 2.5], ['Compressing', 3.3], ['Converting', 4.1]];
const SToolkit = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 104, 88);
  const T = Math.max(0, s - 1.6);
  const cloudIn = ip(s, 1.6, 2.1, 0, 1), cloudOut = ip(s, 4.75, 5.0, 1, 0);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return (
    <AbsoluteFill>
      <LightBg />
      <Line size={size} out={1.45} words={[['The', 0.1], ['free', 0.35, 'grad'], ['PDF toolkit', 0.6], ['for', 0.9]]} />
      {s > 1.55 && CLOUD.map((w, i) => {
        const z = 0.25 + rnd() * 0.75;
        let x = 0.06 + rnd() * 0.88, y = 0.1 + rnd() * 0.8;
        if (Math.abs(y - 0.5) < 0.12) y += y < 0.5 ? -0.14 : 0.14;
        const k = 1 + 0.16 * T * (0.5 + z);
        const px = W / 2 + (x * W - W / 2) * k, py = H / 2 + (y * H - H / 2) * k;
        const fs = pick(v, 30, 30) + z * pick(v, 36, 30);
        return (
          <div key={w} style={{ position: 'absolute', left: px, top: py, transform: 'translate(-50%,-50%)', fontFamily: inter, fontWeight: 500, fontSize: fs * (0.9 + 0.1 * k), whiteSpace: 'nowrap', letterSpacing: '-0.02em', backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent', filter: `blur(${0.6 + (1 - z) * 5}px)`, opacity: (0.35 + 0.6 * z) * cloudIn * cloudOut }}>{w}</div>
        );
      })}
      {FOCUS.map(([w, t], i) => {
        const nt = FOCUS[i + 1] ? FOCUS[i + 1][1] : 4.8;
        const a = ip(s, t, t + 0.28, 0, 1), b = ip(s, nt, nt + 0.3, 0, 1, Easing.in(Easing.quad));
        if (s < t || b >= 1) return null;
        return <div key={w} style={{ position: 'absolute', left: 0, right: 0, top: H / 2, textAlign: 'center', transform: `translateY(-50%) scale(${0.6 + 0.4 * a + b * 1.1})`, fontFamily: inter, fontWeight: 600, fontSize: size * 1.12, letterSpacing: '-0.04em', color: A.ink, opacity: a * (1 - b), filter: `blur(${(1 - a) * 10 + b * 14}px)` }}>{w}</div>;
      })}
      {FOCUS.map(([, t]) => <Sfx key={t} at={t} name="whoosh-short" volume={0.25} />)}
    </AbsoluteFill>
  );
};

// D 14-18: concentric glowing rings + "✦ Merge / ✦ Split / ✦ Compress / ✦ Convert anything"
const Ring = ({ cx, cy, r, op = 1 }) => (
  <div style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', border: '3px solid rgba(160,150,255,.85)', boxShadow: '0 0 26px rgba(150,140,255,.55), inset 0 0 26px rgba(150,140,255,.35)', opacity: op }} />
);
const SRings = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 112, 96);
  const steps = [[[['✦', 0.12], ['Merge', 0.25]], 1.0], [[['✦', 1.08], ['Split', 1.2]], 1.95], [[['✦', 2.02], ['Compress', 2.15]], 2.85], [[['✦', 2.95], ['Convert', 3.08], ['anything', 3.3, 'grad']], 3.75]];
  const m = s / 4;
  return (
    <AbsoluteFill>
      <LightBg />
      <Ring cx={W * (0.12 + 0.1 * m)} cy={H * (0.12 - 0.08 * m)} r={H * pick(v, 0.42, 0.26)} op={ip(s, 0, 0.5, 0, 1)} />
      <Ring cx={W * (1.0 - 0.1 * m)} cy={H * (0.55 + 0.05 * m)} r={H * pick(v, 0.46, 0.3)} op={ip(s, 0.2, 0.7, 0, 1)} />
      <Ring cx={W * (0.35 + 0.15 * m)} cy={H * (1.25 - 0.1 * m)} r={H * pick(v, 0.6, 0.38)} op={ip(s, 0.4, 0.9, 0, 1) * 0.8} />
      {steps.map(([words, out], i) => <Line key={i} size={size} out={out} weight={500} words={words} />)}
      {[0.12, 1.08, 2.02, 2.95].map((t) => <Sfx key={t} at={t} name="pop" volume={0.35} />)}
    </AbsoluteFill>
  );
};

// E 18-22: file chips gather and orbit the app icon
const CHIPS = [
  { label: 'report.docx', tag: 'DOC', c: '#4f7cff', bg: '#e6edff' }, { label: 'budget.xlsx', tag: 'XLS', c: '#1fa971', bg: '#dff5eb' },
  { label: 'slides.pptx', tag: 'PPT', c: '#f07a3a', bg: '#ffeadf' }, { label: 'photo.jpg', tag: 'JPG', c: '#b55be0', bg: '#f4e6fb' },
  { label: 'scan.pdf', tag: 'PDF', c: '#e5484d', bg: '#ffe4e5' },
];
const Chip = ({ c, x, y, sc = 1, op = 1, bob = 0 }) => (
  <div style={{ position: 'absolute', left: x, top: y + bob, transform: `translate(-50%,-50%) scale(${sc})`, opacity: op, display: 'flex', alignItems: 'center', gap: 16, height: 80, padding: '0 30px 0 12px', borderRadius: 40, background: c.bg, boxShadow: '0 14px 30px rgba(60,60,140,.14), inset 0 0 0 1.5px rgba(255,255,255,.8)', fontFamily: inter, whiteSpace: 'nowrap' }}>
    <div style={{ height: 56, minWidth: 74, borderRadius: 28, background: c.c, color: '#fff', fontWeight: 600, fontSize: 22, display: 'grid', placeItems: 'center', letterSpacing: 0.5 }}>{c.tag}</div>
    <div style={{ fontWeight: 500, fontSize: 30, color: A.ink, letterSpacing: '-0.02em' }}>{c.label}</div>
  </div>
);
const SChips = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 104, 90);
  const P1 = v ? [[0.3, 0.2], [0.72, 0.3], [0.74, 0.7], [0.28, 0.79], [0.5, 0.9]] : [[0.2, 0.23], [0.8, 0.22], [0.83, 0.74], [0.2, 0.76], [0.5, 0.86]];
  const m = ip(s, 1.7, 2.5, 0, 1, IO);
  const tile = ip(s, 1.75, 2.2, 0, 1, BACK);
  const zoom = ip(s, 3.55, 4.0, 0, 1, Easing.in(Easing.cubic));
  const rx = pick(v, W * 0.3, W * 0.36), ry = pick(v, H * 0.3, H * 0.19);
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + zoom * 2.2})`, opacity: 1 - zoom * 0.9, filter: `blur(${zoom * 10}px)` }}>
        <Line size={size} out={1.55} words={[['Any', 0.15], ['format,', 0.38, 'grad']]} />
        <div style={{ position: 'absolute', left: W / 2 - 130, top: H / 2 - 130, width: 260, height: 260, borderRadius: 74, background: 'rgba(255,255,255,.6)', boxShadow: '0 0 0 1.5px rgba(255,255,255,.9), 0 30px 70px rgba(78,92,214,.2)', transform: `scale(${tile})`, display: 'grid', placeItems: 'center' }}>
          <Img src={staticFile('logo.png')} style={{ width: 150, height: 150, borderRadius: 40 }} />
        </div>
        {tile > 0 && <Line size={pick(v, 48, 42)} top={H / 2 + pick(v, 230, 230)} words={[['one', 2.0, 'soft'], ['place.', 2.15, 'grad']]} out={3.5} />}
        {CHIPS.map((c, i) => {
          const a = ip(s, 0.1 + i * 0.12, 0.55 + i * 0.12, 0, 1, BACK);
          const ang = (i / CHIPS.length) * Math.PI * 2 + (s - 1.7) * 0.7 - Math.PI / 2;
          const ox = W / 2 + Math.cos(ang) * rx, oy = H / 2 + Math.sin(ang) * ry;
          const x = P1[i][0] * W * (1 - m) + ox * m, y = P1[i][1] * H * (1 - m) + oy * m;
          return <Chip key={i} c={c} x={x} y={y} sc={a * pick(v, 1.3, 1.15) * (1 - 0.15 * m)} op={a > 0 ? 1 : 0} bob={Math.sin(s * 2 + i) * 8} />;
        })}
        <Twinkles t0={2.0} pts={[[W * 0.35, H * 0.3, 34, 0], [W * 0.66, H * 0.36, 26, 0.3], [W * 0.62, H * 0.7, 30, 0.6], [W * 0.38, H * 0.66, 22, 0.9]]} />
      </div>
      {CHIPS.map((_, i) => <Sfx key={i} at={0.1 + i * 0.12} name="pop" volume={0.25} />)}
      <Sfx at={1.75} name="glass" volume={0.4} /><Sfx at={3.55} name="whoosh" volume={0.45} />
    </AbsoluteFill>
  );
};

// F 22-28: dark act - runs in your browser, then a close-up camera flies over the live Merge page
const SBrowser = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 98, 80);
  const push = ip(s, 5.35, 6.0, 0, 1, Easing.in(Easing.cubic));
  const sw = ip(s, 0, 0.7, 0, 1, Easing.inOut(Easing.quad));
  const gl = ip(s, 3.6, 5.0, 0, 1, IO);
  const t = s - 2.0;
  const keys = [
    { t: 0, x: 540, y: 300, z: 1.0, rx: 34 }, { t: 0.7, x: 420, y: 290, z: 1.55, rx: 14, ry: 8 }, { t: 1.3, x: 420, y: 290, z: 1.6, rx: 10, ry: 5 },
    { t: 1.9, x: 760, y: 330, z: 1.3, rx: 8, ry: -4 }, { t: 2.4, x: 1240, y: 540, z: 1.8, rx: 8, ry: -12 }, { t: 3.4, x: 1200, y: 500, z: 1.6, rx: 6, ry: -14 },
  ];
  return (
    <AbsoluteFill>
      <DarkBg />
      {sw < 1 && <StarAt x={-200 + sw * (W + 400)} y={H * 0.5 - sw * H * 0.12} size={120} rot={sw * 360} color="#fff" />}
      {sw < 1 && <div style={{ position: 'absolute', left: -200 + sw * (W + 400) - 520, top: H * 0.5 - sw * H * 0.12 - 6, width: 520, height: 12, borderRadius: 6, background: 'linear-gradient(90deg, rgba(160,170,255,0), rgba(200,206,255,.9))', filter: 'blur(4px)' }} />}
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + push * 0.25})`, opacity: 1 - push, filter: `blur(${push * 14}px)` }}>
        <Line size={size} dark out={1.95} words={[['Everything', 0.35, 'white'], ['runs', 0.62, 'white'], ['in your browser,', 0.9, 'grad']]} />
        {s > 1.95 && (
          <Cam3D t={t} keys={keys} dark sy={pick(v, 0.6, 0.6)} mask={TOP_FADE} op={ip(s, 1.95, 2.3, 0, 1)}>
            <MergeApp t={t} />
          </Cam3D>
        )}
        <Line size={size * 0.9} dark top={H * pick(v, 0.13, 0.16)} words={[['and', 2.35, 'white'], ['your files', 2.6, 'grad'], ['stay yours.', 2.9, 'grad']]} />
        {s > 3.6 && s < 5.2 && <StarAt x={W * (0.85 - 0.6 * gl)} y={H * (0.95 - 0.3 * gl)} size={pick(v, 260, 210) * Math.sin(gl * Math.PI)} rot={gl * 200} color="#fff" glow="rgba(170,180,255,1)" />}
      </div>
      <Sfx at={0} name="swipe" volume={0.5} /><Sfx at={2.0} name="whoosh" volume={0.4} /><Sfx at={2.95} name="tick" volume={0.5} /><Sfx at={3.6} name="glass" volume={0.4} /><Sfx at={4.1} name="tick" volume={0.6} /><Sfx at={5.4} name="whoosh-short" volume={0.4} />
    </AbsoluteFill>
  );
};

// G 28-32: nothing gets uploaded
const SNothing = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 108, 88);
  return (
    <AbsoluteFill>
      <DarkBg arc={false} />
      <Line size={size} dark out={1.9} words={[['Nothing', 0.1, 'white'], ['gets uploaded', 0.4, 'grad'], ['✦', 0.8]]} />
      {s < 2.1 && <Twinkles dark t0={0.9} pts={[[W * 0.5 + pick(v, 560, 330), H / 2 - pick(v, 70, 120), 30, 0], [W * 0.5 + pick(v, 610, 380), H / 2 - pick(v, 20, 70), 18, 0.25]]} />}
      <Line size={size} dark out={3.75} words={[['Processed', 2.05, 'white'], ['on your device.', 2.35, 'grad']]} />
      <Sfx at={0.8} name="glass" volume={0.4} />
    </AbsoluteFill>
  );
};

// H 32-36: close-up on the live Compress page - pick Maximum, compress, watch the size drop
const SCard = () => {
  const s = useS(); const { H, v } = useL();
  const size = pick(v, 96, 80);
  const out = ip(s, 3.6, 4.0, 0, 1, Easing.in(Easing.cubic));
  const t = s;
  const P = COMPRESS_PTS;
  const cursor = {
    x: kf(t, [[0.25, 1450], [0.72, P.max.x], [1.0, P.max.x], [1.22, P.btn.x], [2.3, P.btn.x], [2.7, 1330]]),
    y: kf(t, [[0.25, 820], [0.72, P.max.y], [1.0, P.max.y], [1.22, P.btn.y], [2.3, P.btn.y], [2.7, 560]]),
    press: Math.max(ip(t, 0.78, 0.84, 0, 1) * ip(t, 0.88, 0.96, 1, 0), ip(t, 1.28, 1.34, 0, 1) * ip(t, 1.38, 1.46, 1, 0)),
    op: t > 0.25 ? 1 : 0,
  };
  const keys = [
    { t: 0, x: 1120, y: 420, z: 1.05, rx: 18, ry: -22 }, { t: 0.6, x: 1229, y: 440, z: pick(v, 1.9, 1.75), rx: 8, ry: -14 }, { t: 1.15, x: 1229, y: 560, z: pick(v, 1.9, 1.75), rx: 8, ry: -12 },
    { t: 2.0, x: 1229, y: 470, z: pick(v, 1.75, 1.65), rx: 6, ry: -10 }, { t: 3.6, x: 1180, y: 450, z: pick(v, 1.55, 1.5), rx: 6, ry: -16 },
  ];
  return (
    <AbsoluteFill>
      <DarkBg arc={false} />
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, filter: `blur(${out * 14}px)` }}>
        <Cam3D t={t} keys={keys} dark sx={pick(v, 0.7, 0.5)} sy={pick(v, 0.53, 0.6)} op={ip(s, 0, 0.35, 0, 1)}
          mask={v ? TOP_FADE : 'linear-gradient(90deg, transparent 40%, #000 56%, #000 94%, transparent 100%)'}>
          <CompressApp t={t} cursor={cursor} />
        </Cam3D>
        <Line size={size} dark top={pick(v, H / 2, H * 0.15)} left="5%" right={pick(v, '58%', '5%')} align={pick(v, 'flex-start', 'center')} words={[['Shrink', 1.45, 'white'], ['heavy PDFs', 1.7, 'grad']]} />
      </div>
      <Sfx at={0} name="whoosh-short" volume={0.4} /><Sfx at={0.8} name="tick" volume={0.7} /><Sfx at={1.3} name="tick" volume={0.7} /><Sfx at={2.15} name="success" volume={0.5} />
    </AbsoluteFill>
  );
};

// I 36-40: close-up on the homepage search - type "merge", results drop down, pick Merge PDF, dive in
const STools = () => {
  const s = useS(); const { H, v } = useL();
  const size = pick(v, 96, 84);
  const lineTop = kf(s, [[0.7, H / 2], [1.2, H * pick(v, 0.12, 0.15)]]);
  const t = s - 0.9;
  const q = 'merge';
  const n = Math.max(0, Math.min(q.length, Math.floor((t - 0.75) / 0.12) + 1));
  const drop = ip(t, 1.45, 1.75, 0, 1);
  const pickP = ip(t, 1.98, 2.06, 0, 1) * ip(t, 2.1, 2.2, 1, 0);
  const cursor = { x: kf(t, [[1.5, 1320], [1.95, 1080]]), y: kf(t, [[1.5, 720], [1.95, 362]]), press: pickP, op: t > 1.5 ? 1 : 0 };
  const push = ip(s, 3.1, 4.0, 0, 1, Easing.in(Easing.cubic));
  const keys = [
    { t: 0, x: 860, y: 320, z: 1.0, rx: 26 }, { t: 0.65, x: 980, y: 250, z: pick(v, 2.0, 1.75), rx: 10, ry: -6 }, { t: 1.4, x: 1000, y: 280, z: pick(v, 2.0, 1.75), rx: 8, ry: -4 },
    { t: 1.85, x: 1050, y: 330, z: pick(v, 1.95, 1.7), rx: 8, ry: -2 }, { t: 2.2, x: 1080, y: 362, z: pick(v, 2.1, 1.85), rx: 6 }, { t: 3.1, x: 1080, y: 362, z: 5.5, rx: 0 },
  ];
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - ip(s, 3.6, 4.0, 0, 1) }}>
        {s > 0.85 && (
          <Cam3D t={t} keys={keys} sy={pick(v, 0.6, 0.58)} mask={TOP_FADE} op={ip(s, 1.15, 1.45, 0, 1)} blur={push * 10}>
            <HomeApp t={t + 1.2} query={q.slice(0, t > 0.75 ? n : 0)} typing={t > 0.4 && t < 1.7} drop={drop} pick={pickP} cursor={cursor} clickAt={2.0 + 1.2} />
          </Cam3D>
        )}
        <Line size={size} top={lineTop} out={3.1} words={[['Every tool', 0.1], ['you need,', 0.4, 'grad']]} />
      </div>
      <Sfx at={0} name="impact" volume={0.35} /><Sfx at={0.9} name="whoosh" volume={0.4} />
      {Array.from({ length: 5 }, (_, i) => <Sfx key={i} at={0.9 + 0.75 + i * 0.12} name="tick" volume={0.25} />)}
      <Sfx at={2.9} name="tick" volume={0.7} /><Sfx at={3.15} name="whoosh-short" volume={0.4} />
    </AbsoluteFill>
  );
};

// J 40-44: live file cards -> Merge PDFs -> progress -> success card + download click + confetti
const CONF = Array.from({ length: 34 }, (_, i) => i);
const SMerge = () => {
  const s = useS(); const { W, H, v } = useL();
  const cw = pick(v, 250, 230), k = cw / 232, chh = 365 * k;
  const gapx = cw * 1.12;
  const by = pick(v, H * 0.4, H * 0.42);
  const btnY = by + chh / 2 + pick(v, 110, 120);
  const ia = (i) => ip(s, 0.05 + i * 0.12, 0.6 + i * 0.12, 0, 1, OUT);
  const press = ip(s, 1.4, 1.5, 0, 1) * ip(s, 1.55, 1.65, 1, 0);
  const merge = ip(s, 1.6, 2.0, 0, 1, Easing.in(Easing.cubic));
  const prog = ip(s, 2.05, 2.9, 0, 1, Easing.inOut(Easing.quad));
  const cx = kf(s, [[0.8, W * 0.9], [1.35, W / 2 + 60]]), cy = kf(s, [[0.8, H * 1.0], [1.35, btnY + 12]]);
  const bw = pick(v, W * 0.46, W * 0.72);
  const st = s - 2.95; // success card local time
  const sw = pick(v, 700, 760), sk = sw / 1020, shh = 600 * sk;
  const sy = H / 2 + pick(v, 70, 60);
  const conf = Math.max(0, s - 3.0);
  const scx = kf(st, [[0.15, 1000], [0.5, 560]]), scy = kf(st, [[0.15, 640], [0.5, 410]]);
  return (
    <AbsoluteFill>
      <LightBg />
      {merge < 1 && [0, 1, 2].map((i) => {
        const a = ia(i);
        const fx = W / 2 + (i - 1) * gapx, from = [[-W * 0.6, -H * 0.2], [0, -H], [W * 0.6, -H * 0.2]][i];
        const x = fx + from[0] * (1 - a) + (W / 2 - fx) * merge, y = by + from[1] * (1 - a);
        return (
          <div key={i} style={{ position: 'absolute', left: x - cw / 2, top: y - chh / 2, width: cw, height: chh, transform: `perspective(1600px) rotateY(${(1 - a) * (i - 1) * 40}deg) rotateZ(${(1 - a) * (i - 1) * 12 + (i - 1) * 3 * (1 - merge)}deg) scale(${1 - merge * 0.4})`, opacity: a * (1 - merge * 0.8) }}>
            <div style={{ width: 232, height: 365, transform: `scale(${k})`, transformOrigin: '0 0', filter: 'drop-shadow(0 20px 40px rgba(60,60,140,.16))' }}><FileCard f={FILES[i]} n={i + 1} t={s} at={0.05 + i * 0.12} badge={ip(s, 0.35 + i * 0.12, 0.65 + i * 0.12, 0, 1, BACK)} /></div>
          </div>
        );
      })}
      {s > 0.55 && merge < 1 && (
        <div style={{ position: 'absolute', left: W / 2 - 230, top: btnY - 44, width: 460, height: 88, borderRadius: 44, background: A.brand, color: '#fff', fontFamily: inter, fontWeight: 600, fontSize: 36, display: 'grid', placeItems: 'center', boxShadow: '0 18px 40px rgba(78,92,214,.4)', transform: `scale(${ip(s, 0.55, 0.85, 0, 1, BACK) * (1 - press * 0.08)})`, opacity: 1 - merge }}>Merge PDFs  +</div>
      )}
      {s > 0.8 && s < 2.0 && <Cursor x={cx} y={cy} press={press} />}
      <Ripple x={W / 2 + 60} y={btnY + 12} t={1.45} />
      {s > 2.0 && st < 0.1 && (
        <div style={{ position: 'absolute', left: W / 2 - bw / 2, top: H / 2 - 20, width: bw, opacity: ip(s, 2.0, 2.15, 0, 1) * (1 - ip(s, 2.9, 3.0, 0, 1)) }}>
          <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontFamily: inter, fontWeight: 500, fontSize: 44, color: A.soft, letterSpacing: '-0.02em' }}>
            <span>Merging…</span><span style={{ backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent', fontWeight: 600 }}>{Math.round(prog * 100)}%</span>
          </div>
          <div style={{ height: 40, borderRadius: 20, background: 'rgba(78,92,214,.1)', overflow: 'hidden' }}>
            <div style={{ width: `${prog * 100}%`, height: '100%', borderRadius: 20, background: 'linear-gradient(90deg,#b4bcfa,#4E5CD6 60%,#7d8bff)', boxShadow: '0 0 30px rgba(78,92,214,.5)' }} />
          </div>
        </div>
      )}
      {st > 0 && (
        <>
          {CONF.map((i) => {
            const ang = (i / CONF.length) * Math.PI * 2 + i * 0.7, sp = 900 + (i * 137) % 700;
            const x = W / 2 + Math.cos(ang) * sp * conf * 0.9, y = sy + Math.sin(ang) * sp * conf * 0.7 + 900 * conf * conf;
            const col = ['#4E5CD6', '#8a96f5', '#c3caff', '#ff8fd8', '#7aa8ff'][i % 5];
            return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 16 + (i % 3) * 8, height: 10 + (i % 2) * 8, borderRadius: 3, background: col, transform: `rotate(${conf * (300 + i * 40)}deg) skewX(${(i % 4) * 12}deg)`, opacity: Math.max(0, 1 - conf / 1.0) }} />;
          })}
          <Line size={pick(v, 96, 88)} top={sy - shh / 2 - pick(v, 80, 110)} words={[['Done', 0.0 + 2.95, 'grad'], ['✦', 3.15]]} />
          <div style={{ position: 'absolute', left: W / 2 - sw / 2, top: sy - shh / 2, width: sw, height: shh, borderRadius: 28, overflow: 'hidden', boxShadow: '0 0 0 1.5px rgba(150,162,255,.8), 0 40px 90px rgba(60,60,140,.2)', transform: `scale(${ip(st, 0, 0.4, 0.85, 1, BACK)})`, opacity: ip(st, 0, 0.2, 0, 1) }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 1020, height: 600, transform: `scale(${sk})`, transformOrigin: '0 0' }}>
              <SuccessCard t={st} pressAt={0.62} detail="7.3 KB · 3 files merged" />
              {st > 0.15 && <AppCursor x={scx} y={scy} size={44} press={ip(st, 0.55, 0.62, 0, 1) * ip(st, 0.66, 0.74, 1, 0)} />}
            </div>
          </div>
        </>
      )}
      <Sfx at={0.05} name="swipe" volume={0.3} /><Sfx at={1.45} name="tick" volume={0.7} /><Sfx at={1.65} name="whoosh-short" volume={0.35} /><Sfx at={2.95} name="success" volume={0.6} /><Sfx at={3.57} name="tick" volume={0.6} />
    </AbsoluteFill>
  );
};

// K 44-46.5: giant gradient "free"
const SFree = () => {
  const s = useS(); const { W, H, v } = useL();
  const big = pick(v, 560, 400);
  const out = ip(s, 2.15, 2.5, 0, 1, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill>
      <LightBg k={1.2} />
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, filter: `blur(${out * 18}px)`, transform: `scale(${1 + out * 0.1})` }}>
        <Line size={pick(v, 64, 56)} top={H / 2 - big * 0.62} words={[['100%', 0.05, 'soft']]} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: H / 2, transform: 'translateY(-46%)', display: 'flex', justifyContent: 'center', fontFamily: inter, fontWeight: 600, fontSize: big, letterSpacing: '-0.06em', lineHeight: 1 }}>
          {'free'.split('').map((c, i) => {
            const p = ip(s, 0.2 + i * 0.07, 0.65 + i * 0.07, 0, 1, OUT);
            return <span key={i} style={{ display: 'inline-block', backgroundImage: GRAD, backgroundSize: `${big * 2}px 100%`, backgroundPosition: `${-i * big * 0.5}px 0`, WebkitBackgroundClip: 'text', color: 'transparent', transform: `translateY(${(1 - p) * 0.4}em)`, opacity: p, filter: `blur(${(1 - p) * 16}px)`, paddingBottom: '0.06em' }}>{c}</span>;
          })}
        </div>
        <Twinkles t0={0.85} pts={[[W / 2 + big * 1.05, H / 2 - big * 0.42, pick(v, 70, 56), 0], [W / 2 + big * 1.22, H / 2 - big * 0.6, pick(v, 34, 28), 0.2]]} />
      </div>
      <Sfx at={0.2} name="impact" volume={0.4} /><Sfx at={0.85} name="glass" volume={0.45} />
    </AbsoluteFill>
  );
};

// L 46.5-50: dark - no installs / no uploads, then a giant browser bar types pdfsection.com
const SType = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 104, 86);
  const url = 'pdfsection.com';
  const n = Math.max(0, Math.min(url.length, Math.floor((s - 2.45) / 0.055) + 1));
  const bar = ip(s, 2.2, 2.55, 0, 1, OUT);
  const press = ip(s, 3.2, 3.26, 0, 1) * ip(s, 3.3, 3.4, 1, 0);
  const bw = pick(v, W * 0.82, W * 0.9), bh = pick(v, 170, 140), fs = pick(v, 92, 62);
  const caret = n < url.length || Math.floor(s * 3) % 2 === 0;
  return (
    <AbsoluteFill>
      <DarkBg arc={false} />
      <Line size={size} dark out={1.05} words={[['No', 0.1, 'white'], ['installs.', 0.3, 'grad']]} />
      <Line size={size} dark out={1.95} words={[['No', 1.15, 'white'], ['uploads.', 1.35, 'grad']]} />
      {s > 2.2 && (
        <div style={{ position: 'absolute', left: W / 2 - bw / 2, top: H / 2 - bh / 2, width: bw, height: bh, borderRadius: bh / 2, background: '#fff', display: 'flex', alignItems: 'center', gap: bh * 0.22, padding: `0 ${bh * 0.2}px 0 ${bh * 0.36}px`, boxSizing: 'border-box', boxShadow: '0 0 0 3px rgba(176,186,255,.9), 0 0 80px rgba(110,125,255,.55), 0 40px 90px rgba(0,0,0,.5)', opacity: bar, transform: `perspective(1600px) rotateX(${(1 - bar) * 20 + 4}deg) scale(${0.9 + 0.1 * bar + ip(s, 2.4, 3.5, 0, 0.03, Easing.linear)})`, filter: `blur(${(1 - bar) * 12}px)` }}>
          <svg width={fs * 0.62} height={fs * 0.62} viewBox="0 0 24 24" fill="none" stroke={A.brand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></svg>
          <div style={{ flex: 1, fontFamily: inter, fontWeight: 500, fontSize: fs, letterSpacing: '-0.03em', color: A.ink, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
            {url.slice(0, n)}<span style={{ display: 'inline-block', width: 5, height: fs * 0.95, marginLeft: 6, background: A.brand, opacity: caret ? 1 : 0 }} />
          </div>
          <div style={{ width: bh * 0.66, height: bh * 0.66, borderRadius: '50%', background: A.brand, display: 'grid', placeItems: 'center', transform: `scale(${1 - press * 0.12})`, boxShadow: `0 0 0 ${press * 14}px rgba(78,92,214,.2)` }}>
            <svg width={bh * 0.3} height={bh * 0.3} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </div>
        </div>
      )}
      {Array.from({ length: 14 }, (_, i) => <Sfx key={i} at={2.45 + i * 0.055} name="tick" volume={0.16} />)}
      <Sfx at={2.2} name="whoosh-short" volume={0.4} /><Sfx at={3.2} name="pop" volume={0.6} />
    </AbsoluteFill>
  );
};

// M 50-54: works on every device - laptop plane + phone
const SDevices = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 92, 80);
  const circ = ip(s, 0, 0.6, 0, 1, BACK);
  const lap = ip(s, 0.55, 1.35, 0, 1, Easing.out(Easing.cubic));
  const ph = ip(s, 0.75, 1.55, 0, 1, Easing.out(Easing.cubic));
  const out = ip(s, 3.6, 4.0, 0, 1, Easing.in(Easing.cubic));
  const lw = pick(v, 1080, 860), lh = lw * 0.625;
  const phH = pick(v, 680, 1000), phW = phH * (390 / 844);
  const r = Math.min(W, H) * 0.46;
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, filter: `blur(${out * 14}px)` }}>
        <div style={{ position: 'absolute', left: W / 2 - r, top: H * 0.56 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,.9), rgba(205,198,255,.55) 70%)', boxShadow: '0 0 0 2px rgba(255,255,255,.8), 0 0 60px rgba(160,150,255,.4)', transform: `scale(${circ})` }} />
        <Line size={size} top={H * pick(v, 0.12, 0.13)} words={[['Works on', 0.15], ['every device.', 0.45, 'grad']]} />
        <Plane w={lw} h={lh} x={W * pick(v, 0.42, 0.5)} y={H * pick(v, 0.6, 0.42) + (1 - lap) * H * 0.6} rx={pick(v, 14, 10)} ry={pick(v, 16, 0)} op={pick(v, 1, 0.9)}>
          <HomeApp t={s - 0.45} hoverAt={2.0} />
        </Plane>
        <div style={{ position: 'absolute', left: W * pick(v, 0.73, 0.5) - phW / 2 - 12, top: H * pick(v, 0.6, 0.66) - phH / 2 - 12 + (1 - ph) * H * 0.7, width: phW, height: phH, borderRadius: 58, border: `12px solid ${A.ink}`, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 90px rgba(30,30,90,.3), 0 0 0 2px rgba(150,162,255,.6)', transform: `perspective(2000px) rotateY(${pick(v, -14, -6)}deg) rotateZ(${pick(v, 4, 2)}deg)` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 390, height: 844, transform: `scale(${phW / 390})`, transformOrigin: '0 0' }}><MobileApp t={s - 0.7} tapAt={1.55} scrollAt={2.0} /></div>
        </div>
        <Twinkles t0={1.6} pts={[[W * pick(v, 0.88, 0.85), H * pick(v, 0.3, 0.33), 40, 0], [W * pick(v, 0.14, 0.15), H * pick(v, 0.78, 0.82), 30, 0.4]]} />
      </div>
      <Sfx at={0.55} name="whoosh" volume={0.35} /><Sfx at={0.8} name="swipe" volume={0.3} /><Sfx at={1.6} name="glass" volume={0.35} />
    </AbsoluteFill>
  );
};

// N 54-57: dark close-up on the live Split page + "Merge. Split. Compress." -> "Do more ✦ with PDFs"
const SMore = () => {
  const s = useS(); const { H, v } = useL();
  const size = pick(v, 92, 78);
  const t = s - 0.1;
  const keys = [{ t: 0, x: 520, y: 230, z: 1.15, rx: 26, ry: 10 }, { t: 0.8, x: 500, y: 235, z: pick(v, 1.7, 1.55), rx: 10, ry: 8 }, { t: 2.9, x: 650, y: 245, z: pick(v, 1.55, 1.45), rx: 8, ry: -6 }];
  return (
    <AbsoluteFill>
      <DarkBg arc={false} />
      <Cam3D t={t} keys={keys} dark sy={0.62} mask={TOP_FADE} op={ip(s, 0, 0.35, 0, 1)}><SplitApp t={t} pressAt={0.95} /></Cam3D>
      <Line size={size} dark top={H * pick(v, 0.14, 0.15)} out={1.35} words={[['Merge.', 0.1, 'white'], ['Split.', 0.3, 'grad'], ['Compress.', 0.5, 'white']]} />
      <Line size={size} dark top={H * pick(v, 0.14, 0.15)} out={2.8} words={[['Do more', 1.45, 'white'], ['✦', 1.7], ['with PDFs', 1.85, 'grad']]} />
      <Sfx at={0.1} name="whoosh" volume={0.35} /><Sfx at={1.05} name="whoosh-short" volume={0.35} /><Sfx at={1.7} name="glass" volume={0.4} />
    </AbsoluteFill>
  );
};

// O 57-60: end card
const SEnd = () => {
  const s = useS(); const { W, H, v } = useL();
  const size = pick(v, 120, 96);
  const glint = ip(s, 1.55, 2.25, 0, 1, IO);
  return (
    <AbsoluteFill>
      <DarkBg arc={false} glow={1.2} />
      <AbsoluteFill style={{ background: '#fff', opacity: ip(s, 0, 0.35, 0.55, 0) }} />
      <LogoLockup size={size} t={0.05} dark x={W / 2} y={H * 0.46} />
      <Line size={pick(v, 50, 42)} dark top={H * 0.46 + size * 1.25} words={[['Free PDF tools at', 0.85, 'white'], ['pdfsection.com', 1.1, 'grad']]} />
      {s > 1.55 && s < 2.3 && <StarAt x={W / 2 + pick(v, 260, 230) * (glint - 0.3)} y={H * 0.46 + size * 1.25 - 4} size={70 * Math.sin(glint * Math.PI)} rot={glint * 180} />}
      <AbsoluteFill style={{ background: '#000', opacity: ip(s, 2.65, 3.0, 0, 1) }} />
      <Sfx at={0.05} name="pop" volume={0.5} /><Sfx at={1.6} name="glass" volume={0.45} />
    </AbsoluteFill>
  );
};

const TIMELINE = [
  [SHook, 0, 6], [SLogo, 6, 3], [SToolkit, 9, 5], [SRings, 14, 4], [SChips, 18, 4], [SBrowser, 22, 6], [SNothing, 28, 4], [SCard, 32, 4],
  [STools, 36, 4], [SMerge, 40, 4], [SFree, 44, 2.5], [SType, 46.5, 3.5], [SDevices, 50, 4], [SMore, 54, 3], [SEnd, 57, 3],
];

export const Airy = () => (
  <AbsoluteFill style={{ background: A.bg, fontFamily: inter }}>
    {TIMELINE.map(([C, from, dur]) => (
      <Sequence key={from} from={fr(from)} durationInFrames={fr(dur)}><C /></Sequence>
    ))}
    <Audio src={staticFile('sfx/music-airy.wav')} />
  </AbsoluteFill>
);
