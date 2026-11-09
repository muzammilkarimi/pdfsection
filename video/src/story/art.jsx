import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { FPS, S, fontFamily } from './kit.jsx';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const inOut = Easing.inOut(Easing.cubic);

// ───────────── camera: keyframed pan / zoom over a 1080x1920 world ─────────────
// keys: [{ t, s, x, y }]  (t seconds, s zoom, x/y = world point at the centre of the frame)
export const Cam = ({ keys, shake = 0, ease = inOut, children, style }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ts = keys.map((k) => k.t);
  const at = (p) => interpolate(t, ts, keys.map((k) => k[p]), { ...clamp, easing: ease });
  const s = at('s'), x = at('x'), y = at('y');
  const hx = Math.sin(f / 41) * 3 + (shake ? (Math.sin(f * 1.9) * 9 + Math.sin(f * 3.7) * 5) * shake : 0);
  const hy = Math.cos(f / 37) * 3 + (shake ? (Math.cos(f * 2.3) * 9 + Math.sin(f * 4.1) * 5) * shake : 0);
  return (
    <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(${540 + hx}px, ${960 + hy}px) scale(${s}) translate(${-x}px, ${-y}px)`, ...style }}>{children}</AbsoluteFill>
  );
};

// ───────────── the character ─────────────
const SKIN = '#c98f63', SKIN_D = '#a8704a', HAIR = '#17121f', HOOD = '#e9a93b', HOOD_D = '#c98a22';
const MOODS = {
  neutral: { ri: 0, ro: 0, by: 0, eye: 1, mouth: 'flat' },
  worried: { ri: 14, ro: 3, by: -2, eye: 1.05, mouth: 'frown' },
  panic: { ri: 22, ro: 2, by: -8, eye: 1.3, mouth: 'open' },
  hope: { ri: 8, ro: 0, by: -6, eye: 1.12, mouth: 'flat' },
  relief: { ri: -2, ro: 0, by: -8, eye: 'happy', mouth: 'grin' },
};
export const Person = ({ mood = 'neutral', pose = 'idle', glow, x = 0, y = 0, w = 400, look = [0, 0], uid = 'p', style }) => {
  const f = useCurrentFrame();
  const m = MOODS[mood];
  const bob = Math.sin(f / 24) * 3;
  const tilt = Math.sin(f / 51) * 1.3 + (mood === 'panic' ? Math.sin(f * 1.1) * 2.2 : 0);
  const blink = f % 110 > 104 ? 0.08 : 1;
  const [lx, ly] = look;
  const eyeRy = m.eye === 'happy' ? 0 : 20 * m.eye * blink;
  const drop = ((f % 46) / 46);
  const arm = (side) => {
    const k = side; // -1 left, 1 right
    const px = (v) => 200 + k * v;
    if (pose === 'hairHands') return <g key={side}><path d={`M${px(130)},500 L${px(190)},350 L${px(116)},214`} stroke={HOOD} strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx={px(106)} cy="196" r="34" fill={SKIN} /></g>;
    if (pose === 'armsUp') return <g key={side}><path d={`M${px(120)},450 L${px(196)},250 L${px(214)},40`} stroke={HOOD} strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx={px(214)} cy="28" r="40" fill={SKIN} /></g>;
    return null;
  };
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible', ...style }} width={w} height={w * 1.3} viewBox="0 0 400 520">
      <defs>
        <clipPath id={`${uid}-c`}><ellipse cx="200" cy="190" rx="88" ry="98" /><rect x="170" y="260" width="60" height="70" /></clipPath>
        <linearGradient id={`${uid}-g`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={glow || '#000'} stopOpacity=".26" /><stop offset="1" stopColor={glow || '#000'} stopOpacity="0" /></linearGradient>
      </defs>
      <g transform={`translate(0 ${bob}) rotate(${tilt} 200 400)`}>
        <path d="M104,190 C94,330 118,352 150,334 L250,334 C282,352 306,330 296,190 C296,88 250,58 200,58 C150,58 104,88 104,190 Z" fill={HAIR} />
        <rect x="172" y="262" width="56" height="70" fill={SKIN_D} />
        <path d="M30,520 C30,384 104,336 200,330 C296,336 370,384 370,520 Z" fill={HOOD} />
        <path d="M126,332 C150,384 250,384 274,332 C250,350 150,350 126,332 Z" fill={HOOD_D} />
        <path d="M168,372 L162,430 M232,372 L238,430" stroke="#f6e7c4" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="200" cy="190" rx="88" ry="98" fill={SKIN} />
        <circle cx="113" cy="204" r="15" fill={SKIN} /><circle cx="287" cy="204" r="15" fill={SKIN} />
        {m.eye === 'happy' ? (
          <g stroke={HAIR} strokeWidth="7" strokeLinecap="round" fill="none"><path d="M142,210 Q160,188 178,210" /><path d="M222,210 Q240,188 258,210" /></g>
        ) : (
          <g>
            <ellipse cx="160" cy="205" rx="19" ry={eyeRy} fill="#fff" /><ellipse cx="240" cy="205" rx="19" ry={eyeRy} fill="#fff" />
            <circle cx={160 + lx * 6} cy={205 + ly * 5} r={m.eye > 1.2 ? 6.5 : 8.5} fill={HAIR} opacity={blink} /><circle cx={240 + lx * 6} cy={205 + ly * 5} r={m.eye > 1.2 ? 6.5 : 8.5} fill={HAIR} opacity={blink} />
            <circle cx={163 + lx * 6} cy={202 + ly * 5} r="2.6" fill="#fff" opacity={blink} /><circle cx={243 + lx * 6} cy={202 + ly * 5} r="2.6" fill="#fff" opacity={blink} />
          </g>
        )}
        <g stroke={HAIR} strokeWidth="9" strokeLinecap="round">
          <path d={`M130,${168 + m.by + m.ro} L182,${168 + m.by - m.ri}`} /><path d={`M270,${168 + m.by + m.ro} L218,${168 + m.by - m.ri}`} />
        </g>
        <path d="M200,222 q-7,18 5,22" stroke={SKIN_D} strokeWidth="5" strokeLinecap="round" fill="none" />
        {mood === 'relief' && <g fill="#e2705f" opacity=".35"><circle cx="134" cy="240" r="17" /><circle cx="266" cy="240" r="17" /></g>}
        {m.mouth === 'flat' && <path d="M178,268 Q200,272 222,268" stroke="#7a3a2c" strokeWidth="6" strokeLinecap="round" fill="none" />}
        {m.mouth === 'frown' && <path d="M176,276 Q200,258 224,276" stroke="#7a3a2c" strokeWidth="6" strokeLinecap="round" fill="none" />}
        {m.mouth === 'open' && <g><path d="M178,262 Q200,306 222,262 Q200,252 178,262 Z" fill="#6b2326" /><ellipse cx="200" cy="288" rx="12" ry="6" fill="#d4716f" /></g>}
        {m.mouth === 'grin' && <g><path d="M164,254 Q200,312 236,254 Q200,262 164,254 Z" fill="#6b2326" /><path d="M172,257 Q200,270 228,257 L226,266 Q200,279 174,266 Z" fill="#fff" /></g>}
        <path d="M108,172 C108,92 156,66 206,68 C256,68 294,100 292,172 C262,142 216,126 168,134 C140,140 120,152 108,172 Z" fill={HAIR} />
        <path d="M104,190 C98,226 108,246 120,254 C112,216 110,196 112,176 Z M296,190 C302,226 292,246 280,254 C288,216 290,196 288,176 Z" fill={HAIR} />
        {glow && <g clipPath={`url(#${uid}-c)`}><rect x="90" y="60" width="220" height="280" fill={`url(#${uid}-g)`} style={{ mixBlendMode: 'screen' }} /></g>}
        {(mood === 'worried' || mood === 'panic') && <path d={`M296,${150 + drop * 70} q-9,16 0,24 q9,-8 0,-24 Z`} fill="#9fd8ff" opacity={1 - drop * 0.8} />}
        {arm(-1)}{arm(1)}
      </g>
    </svg>
  );
};

// ───────────── wall clock (real, ticking) ─────────────
export const Clock = ({ cx, cy, r, sod, red = 0 }) => {
  const h = (sod / 3600) % 12, mi = (sod / 60) % 60, s = sod % 60;
  const fl = Math.floor(s), fr = s - fl;
  const sa = (fl + (fr < 0.18 ? Math.sin(fr / 0.18 * Math.PI) * 0.35 : 0)) * 6; // tick with a tiny overshoot
  const hand = (a, len, wd, col) => <line x1="0" y1={len * 0.14} x2="0" y2={-len} stroke={col} strokeWidth={wd} strokeLinecap="round" transform={`rotate(${a})`} />;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r + 14} fill="#0e0f1c" /><circle r={r + 6} fill="#2c2d44" />
      <circle r={r} fill="#f1e9d6" /><circle r={r} fill={`rgba(255,60,60,${red})`} />
      {Array.from({ length: 60 }, (_, i) => <line key={i} x1="0" y1={-r + 8} x2="0" y2={-r + (i % 5 ? 14 : 24)} stroke="#3a3535" strokeWidth={i % 5 ? 2 : 4.5} transform={`rotate(${i * 6})`} />)}
      {[['12', 0, -r + 56], ['3', r - 54, 0], ['6', 0, r - 46], ['9', -r + 54, 0]].map(([t, x, y]) => <text key={t} x={x} y={y + r * 0.1} textAnchor="middle" fontFamily={fontFamily} fontWeight="700" fontSize={r * 0.26} fill="#2a2525">{t}</text>)}
      {hand(h * 30, r * 0.5, r * 0.075, '#241f1f')}{hand(mi * 6, r * 0.75, r * 0.05, '#241f1f')}{hand(sa, r * 0.84, r * 0.022, '#d52b2b')}
      <circle r={r * 0.06} fill="#d52b2b" />
    </g>
  );
};

// ───────────── the night room ─────────────
const STARS = Array.from({ length: 26 }, (_, i) => [(i * 137) % 400 + 20, (i * 71) % 230 + 18, 1.2 + (i % 3) * 0.8]);
const BUILD = [[0, 140, 70], [70, 90, 60], [130, 170, 80], [210, 110, 70], [280, 150, 60], [340, 100, 90]];
const Window = ({ f, day }) => (
  <g transform="translate(70 150)">
    <rect x="-14" y="-14" width="458" height="588" rx="12" fill={day ? "#8b7a68" : "#2a2c52"} />
    <clipPath id="win"><rect width="430" height="560" rx="4" /></clipPath>
    <g clipPath="url(#win)">
      <rect width="430" height="560" fill="url(#sky)" />
      {!day && STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.45 + 0.4 * Math.sin(f / 18 + i)} />)}
      <circle cx="320" cy="150" r="90" fill={day ? "#fff3b0" : "#f4efd8"} opacity={day ? 0.35 : 0.10} /><circle cx="320" cy="150" r="46" fill={day ? "#ffe27a" : "#f4efd8"} />
      {!day && <><circle cx="304" cy="140" r="9" fill="#e0d9bb" /><circle cx="334" cy="166" r="6" fill="#e0d9bb" /></>}
      {BUILD.map(([x, h, w], i) => (
        <g key={i}><rect x={x} y={560 - h - 40} width={w} height={h + 40} fill={day ? (i % 2 ? '#8e9dbd' : '#7d8cae') : (i % 2 ? '#14163a' : '#0f1230')} />
          {Array.from({ length: Math.floor(h / 24) * 2 }, (_, j) => <rect key={j} x={x + 10 + (j % 2) * 26} y={560 - h - 28 + Math.floor(j / 2) * 24} width="12" height="12" fill={(j * 7 + i * 3) % 5 ? (day ? '#dbe7ff' : '#ffd27a') : (day ? '#6f7ea3' : '#1c2150')} opacity={(j * 7 + i * 3) % 5 ? 0.8 : 1} />)}</g>
      ))}
    </g>
    <path d="M215,0 V560 M0,280 H430" stroke={day ? "#8b7a68" : "#2a2c52"} strokeWidth="10" />
  </g>
);
export const RoomScene = ({ sod = 86280, mood = 'neutral', pose = 'idle', glow = '#7fd2ff', look = [0, 0], keys, shake = 0, warm = false, over, personHidden = false, day = false, note = { title: 'DEADLINE', big: '12:00 AM' } }) => {
  const f = useCurrentFrame();
  const t = sod + f / FPS;
  const steam = (i) => ((f / 2 + i * 24) % 70);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Cam keys={keys} shake={shake}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0 }}>
          <defs>
            <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={day ? '#d8c6a6' : warm ? '#2a2650' : '#1c1e40'} /><stop offset="1" stopColor={day ? '#a89478' : '#0f1026'} /></linearGradient>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={day ? '#6fbaf5' : '#070b26'} /><stop offset="1" stopColor={day ? '#d6efff' : '#2d2d78'} /></linearGradient>
            <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a3b2b" /><stop offset="1" stopColor="#24160f" /></linearGradient>
            <linearGradient id="lap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#434958" /><stop offset="1" stopColor="#262a35" /></linearGradient>
            <radialGradient id="lampl" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffb86b" stopOpacity={day ? 0.12 : warm ? 0.55 : 0.42} /><stop offset="1" stopColor="#ffb86b" stopOpacity="0" /></radialGradient>
            <radialGradient id="scr" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={glow} stopOpacity=".5" /><stop offset="1" stopColor={glow} stopOpacity="0" /></radialGradient>
          </defs>
          <rect width="1080" height="1500" fill="url(#wall)" />
          <Window f={f} day={day} />
          <Clock cx={830} cy={330} r={104} sod={t} red={mood === 'panic' ? 0.12 + 0.1 * Math.sin(f / 4) : 0} />
          <g transform="rotate(4 860 600)"><rect x="760" y="520" width="190" height="170" fill="#ffd95a" /><text x="775" y="570" fontFamily={fontFamily} fontWeight="800" fontSize="30" fill="#4a3b00">{note.title}</text><text x="775" y="618" fontFamily={fontFamily} fontWeight="800" fontSize="40" fill="#d22">{note.big}</text><path d="M775,640 q50,12 140,-6" stroke="#d22" strokeWidth="5" fill="none" /></g>
          <rect x="690" y="800" width="340" height="14" fill="#3a2a22" />
          <g><rect x="700" y="740" width="26" height="60" fill="#c5503e" /><rect x="728" y="750" width="22" height="50" fill="#3e74c5" /><rect x="752" y="730" width="28" height="70" fill="#e9a93b" /></g>
          <g transform="translate(920 800)"><path d="M-36,0 L-28,-54 H28 L36,0 Z" fill="#c26b4a" />{[-40, -14, 14, 40].map((a, i) => <path key={i} d="M0,-52 C-6,-110 -30,-120 -52,-112 C-30,-100 -10,-90 0,-52 Z" fill="#2f8a57" transform={`rotate(${a} 0 -52)`} />)}</g>
          <ellipse cx="260" cy="900" rx="700" ry="760" fill="url(#lampl)" style={{ mixBlendMode: 'screen' }} />
          {!personHidden && null}
        </svg>
        {!personHidden && <Person x={310} y={640} w={460} mood={mood} pose={pose} glow={glow} look={look} uid="room" />}
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
          <rect x="0" y="1390" width="1080" height="530" fill="url(#wood)" />
          <rect x="0" y="1390" width="1080" height="8" fill="#8a5d43" opacity=".7" />
          {Array.from({ length: 9 }, (_, i) => <line key={i} x1={i * 140 - 40} y1="1400" x2={i * 140 - 90} y2="1920" stroke="#000" strokeOpacity=".12" strokeWidth="3" />)}
          <ellipse cx="540" cy="1560" rx="400" ry="70" fill="#000" opacity=".35" />
          <g><rect x="258" y="1126" width="564" height="364" rx="28" fill="url(#lap)" /><rect x="258" y="1126" width="564" height="364" rx="28" fill="none" stroke={glow} strokeOpacity=".55" strokeWidth="3" />
            <circle cx="540" cy="1310" r="26" fill="#fff" opacity=".8" /><circle cx="540" cy="1310" r="60" fill="url(#scr)" />
            <rect x="228" y="1486" width="624" height="24" rx="12" fill="#1d2029" /></g>
                    <g transform="translate(160 1400)"><ellipse cx="0" cy="10" rx="90" ry="22" fill="#000" opacity=".4" /><rect x="-60" y="-14" width="120" height="26" rx="12" fill="#2b2d3a" /><path d="M0,-14 L-70,-210 L40,-250" stroke="#3a3d4e" strokeWidth="16" strokeLinecap="round" fill="none" /><path d="M10,-262 L120,-208 L66,-150 L-34,-196 Z" fill="#2b2d3a" /><ellipse cx="46" cy="-170" rx="50" ry="16" fill="#ffe3b0" /></g>
          <g transform="translate(940 1480)"><ellipse cx="0" cy="40" rx="70" ry="16" fill="#000" opacity=".4" /><rect x="-46" y="-50" width="92" height="94" rx="12" fill="#e9e4dc" /><ellipse cx="0" cy="-50" rx="46" ry="12" fill="#5a3320" /><path d="M46,-30 q36,4 30,30 q-4,20 -30,18" stroke="#e9e4dc" strokeWidth="12" fill="none" />
            {[0, 1].map((i) => <path key={i} d={`M${-12 + i * 22},-70 q-10,-20 0,-36 q10,-18 0,-34`} stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity={Math.max(0, 0.5 - steam(i) / 140)} transform={`translate(0 ${-steam(i) * 0.6})`} />)}</g>
          <g transform="rotate(-6 760 1700)"><rect x="620" y="1640" width="300" height="210" fill="#f4f2ea" /><rect x="640" y="1668" width="150" height="12" fill="#4262ff" />{[0, 1, 2, 3].map((i) => <rect key={i} x="640" y={1696 + i * 20} width={240 - i * 24} height="8" fill="#cfcabd" />)}</g>
          <g transform="rotate(8 220 1750)"><rect x="90" y="1680" width="260" height="190" fill="#f4f2ea" />{[0, 1, 2, 3, 4].map((i) => <rect key={i} x="110" y={1706 + i * 22} width={200 - (i % 3) * 30} height="8" fill="#cfcabd" />)}</g>
        </svg>
        {over}
      </Cam>
    </AbsoluteFill>
  );
};

// ───────────── confetti ─────────────
export const Confetti = ({ at = 0, cx = 540, cy = 760, n = 46 }) => {
  const f = useCurrentFrame(); const t = f / FPS - at;
  if (t < 0) return null;
  const COLORS = ['#ffd02f', '#4E5CD6', '#16a36a', '#ff6b81', '#7fd2ff', '#fff'];
  return (
    <svg width="1080" height="1920" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + i, sp = 260 + (i * 47) % 380;
        const x = cx + Math.cos(a) * sp * t * 0.9, y = cy + Math.sin(a) * sp * t * 0.6 - 260 * t + 900 * t * t;
        return <rect key={i} x={x} y={y} width={14 + (i % 3) * 4} height={8 + (i % 2) * 6} fill={COLORS[i % COLORS.length]} opacity={Math.max(0, 1 - t / 2.6)} transform={`rotate(${t * (260 + i * 40)} ${x} ${y})`} />;
      })}
    </svg>
  );
};

// ───────────── hands holding a phone (drawn around PhoneShot's frame) ─────────────
const FINGER = { fill: SKIN, stroke: SKIN_D, strokeWidth: 3 };
export const HandsUnder = () => (
  <svg width="1080" height="1920" style={{ position: 'absolute', left: 0, top: 0 }}>
    <path d="M300,1920 L350,1560 Q540,1470 740,1560 L790,1920 Z" fill={HOOD} />
    <rect x="840" y="690" width="120" height="860" rx="60" fill={SKIN} stroke={SKIN_D} strokeWidth="3" />
    <rect x="140" y="1170" width="130" height="400" rx="62" fill={SKIN} stroke={SKIN_D} strokeWidth="3" />
    <path d="M230,1500 Q540,1420 850,1500 L810,1730 Q540,1810 270,1730 Z" fill={SKIN} stroke={SKIN_D} strokeWidth="3" />
  </svg>
);
export const HandsOver = ({ tap = null }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const press = tap == null ? 0 : Math.max(0, 1 - Math.abs(t - tap) / 0.14);
  return (
    <svg width="1080" height="1920" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      {[0, 1, 2, 3].map((i) => <rect key={i} x="836" y={700 + i * 100} width="122" height="76" rx="38" {...FINGER} transform={`rotate(${-5 + i * 3} 897 ${738 + i * 100})`} />)}
      <rect x={150 + press * 30} y={1210 - press * 30} width="240" height="84" rx="42" {...FINGER} transform="rotate(-38 270 1250)" />
    </svg>
  );
};

// ───────────── the press: 19.3 MB → 815 KB ─────────────
export const PressScene = ({ press = 1.5, before = '19.3 MB', after = '815 KB ✓' }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const down = interpolate(t, [press - 0.5, press], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const up = interpolate(t, [press + 0.5, press + 1.2], [0, 1], { ...clamp, easing: inOut });
  const plateLift = down * (1 - up);
  const squash = interpolate(t, [press, press + 0.14], [1, 0.07], { ...clamp, easing: Easing.out(Easing.quad) });
  const page = interpolate(t, [press + 0.7, press + 1.3], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const shake = t > press && t < press + 0.45 ? Math.exp(-(t - press) * 9) * Math.sin((t - press) * 70) * 14 : 0;
  const SH = 300, baseY = 1180;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, #5a4030, #1c120d 75%)', transform: `translate(${shake}px,${-shake * 0.4}px)` }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        <rect y="1180" width="1080" height="740" fill="url(#wood2)" /><defs><linearGradient id="wood2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6a4632" /><stop offset="1" stopColor="#2a1a12" /></linearGradient></defs>
        <ellipse cx="540" cy="1195" rx="360" ry="34" fill="#000" opacity=".4" />
        <g transform={`translate(0 ${-460 + (460 + (baseY - SH * squash - 146)) * plateLift})`}>
          <rect x="296" y="-400" width="30" height="470" fill="#6a7184" /><rect x="754" y="-400" width="30" height="470" fill="#6a7184" />
          <rect x="240" y="60" width="600" height="86" rx="14" fill="#8a92a6" /><rect x="240" y="60" width="600" height="20" rx="10" fill="#b8bfd0" /><rect x="240" y="126" width="600" height="20" rx="10" fill="#5f667a" />
        </g>
        {/* the stack */}
        <g transform={`translate(0 ${baseY}) scale(1 ${squash}) translate(0 ${-baseY})`} opacity={page > 0.02 ? 0 : 1}>
          {Array.from({ length: 20 }, (_, i) => <rect key={i} x={290 + (i % 3) * 3} y={baseY - (i + 1) * (SH / 20)} width="500" height={SH / 20 + 1} fill={i % 2 ? '#f1eee6' : '#e4e0d4'} stroke="#c9c4b6" strokeWidth="1.5" />)}
          <rect x="290" y={baseY - SH - 4} width="500" height="8" fill="#fff" />
        </g>
        {squash > 0.2 && <g transform={`translate(540 ${baseY - SH * squash - 70})`}><rect x="-120" y="-44" width="240" height="88" rx="10" fill="#ffd95a" transform="rotate(-3)" /><text y="14" textAnchor="middle" fontFamily={fontFamily} fontWeight="800" fontSize="52" fill="#4a3b00" transform="rotate(-3)">{before}</text></g>}
      </svg>
      {/* the result: one crisp page */}
      <div style={{ position: 'absolute', left: 540 - 180, top: 780, width: 360, height: 470, transform: `scale(${page}) rotate(${(1 - page) * -10}deg)`, opacity: page, transformOrigin: '50% 100%', background: '#fbfaf6', borderRadius: 14, boxShadow: '0 30px 60px rgba(0,0,0,.5), 0 0 80px rgba(22,163,106,.45)', padding: 34, boxSizing: 'border-box' }}>
        <div style={{ height: 18, width: '55%', background: '#4262ff', borderRadius: 5, marginBottom: 26 }} />
        {[100, 88, 94, 70, 100, 84, 60].map((p, i) => <div key={i} style={{ height: 9, width: `${p}%`, background: '#d6d2c6', borderRadius: 5, marginBottom: 17 }} />)}
        <div style={{ position: 'absolute', left: -26, bottom: 36, padding: '14px 30px', borderRadius: 18, background: '#16a36a', color: '#fff', fontFamily, fontWeight: 800, fontSize: 56, boxShadow: '0 14px 30px rgba(0,0,0,.4)', transform: 'rotate(-4deg)' }}>{after}</div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────── laptop screen insert (the portal as Maya sees it) ─────────────
export const LaptopInsert = ({ glow = '#7fd2ff', children, scale = 0.92, tilt = 1, url = 'apply.meritaward.org' }) => {
  const f = useCurrentFrame();
  const W = 540 * scale, H = 978 * scale;
  return (
    <AbsoluteFill style={{ fontFamily, background: 'radial-gradient(ellipse at 50% 40%, #232650, #090a18 75%)' }}>
      <AbsoluteFill style={{ transform: `translate(${Math.sin(f / 41) * 4}px,${Math.cos(f / 37) * 4}px) rotate(${Math.sin(f / 53) * 0.3}deg)` }}>
        <div style={{ position: 'absolute', left: 40, top: 250, width: 1000, transform: `perspective(2600px) rotateX(${tilt * 3}deg) rotateY(${tilt * -2}deg)`, transformOrigin: '50% 100%' }}>
          <div style={{ position: 'absolute', inset: -60, borderRadius: 80, background: `radial-gradient(ellipse, ${glow}55, transparent 70%)` }} />
          <div style={{ position: 'relative', padding: 22, borderRadius: 34, background: '#14151d', boxShadow: '0 40px 90px rgba(0,0,0,.6)' }}>
            <div style={{ height: H + 44, borderRadius: 14, overflow: 'hidden', background: '#f4f6fb' }}>
              <div style={{ height: 44, background: '#e3e6ee', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
                {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />)}
                <div style={{ flex: 1, marginLeft: 16, height: 26, borderRadius: 13, background: '#fff', fontFamily, fontSize: 16, color: '#555', display: 'grid', placeItems: 'center' }}>{url}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', height: H }}>
                <div style={{ width: W, height: H, position: 'relative' }}><div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: 540, height: 978 }}>{children}</div></div>
              </div>
            </div>
          </div>
          <div style={{ height: 34, margin: '0 -50px', borderRadius: '0 0 40px 40px', background: 'linear-gradient(#2f313c,#1a1b23)' }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// word-by-word captions driven by the narration timings
export const Captions = ({ words, y = 1530 }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const idx = words.findIndex((w) => t >= w.s && t < w.e + 0.25);
  let i = idx < 0 ? (words.findLastIndex((w) => w.s <= t)) : idx;
  if (i < 0 || t > words[i].e + 0.5) return null;
  // chunk = run of words between sentence/phrase breaks, max 4
  let a = i; while (a > 0 && i - a < 3 && !/[.!?,]$/.test(words[a - 1].w)) a--;
  let b = a; while (b < words.length - 1 && b - a < 3 && !/[.!?,]$/.test(words[b].w)) b++;
  const chunk = words.slice(a, b + 1);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: y, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 22px', fontFamily, fontWeight: 800, fontSize: 78, letterSpacing: -1.5, lineHeight: 1.12, textAlign: 'center', textShadow: '0 4px 0 rgba(0,0,0,.6), 0 0 30px rgba(0,0,0,.75), 0 0 8px rgba(0,0,0,.8)' }}>
      {chunk.map((w, k) => <span key={a + k} style={{ color: a + k === i ? '#ffd02f' : '#fff', transform: a + k === i ? 'scale(1.06)' : 'none', display: 'inline-block' }}>{w.w}</span>)}
    </div>
  );
};

// ───────────── three files → one (the merge metaphor) ─────────────
const SHEETS = [
  { label: 'Invoice', c: '#4262ff', x: -300, r: -12, y: 0 },
  { label: 'Q3 Report', c: '#16a36a', x: 0, r: 4, y: -40 },
  { label: 'Contract', c: '#e9a93b', x: 300, r: 11, y: 10 },
];
export const MergeScene = ({ join = 1.3, after = 'merged.pdf ✓' }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const come = interpolate(t, [0.1, join - 0.1], [0, 1], { ...clamp, easing: inOut });
  const snap = interpolate(t, [join - 0.1, join + 0.05], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const done = interpolate(t, [join + 0.1, join + 0.6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  const shake = t > join && t < join + 0.4 ? Math.exp(-(t - join) * 10) * Math.sin((t - join) * 80) * 10 : 0;
  const bob = (i) => Math.sin(f / 14 + i) * 8 * (1 - come);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, #5a4030, #1c120d 75%)', fontFamily, transform: `translate(${shake}px,${-shake * 0.4}px)` }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920"><rect y="1180" width="1080" height="740" fill="#3a251a" /><ellipse cx="540" cy="1195" rx="380" ry="34" fill="#000" opacity=".4" /></svg>
      {SHEETS.map((sh, i) => {
        const x = 540 + sh.x * (1 - come) - 190, y = 760 + sh.y * (1 - come) + bob(i) - i * 6 * come, rot = sh.r * (1 - come) + (i - 1) * 1.5 * come;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: 380, height: 500, opacity: done > 0.5 ? 0 : 1, transform: `rotate(${rot}deg)`, background: '#fbfaf6', borderRadius: 12, boxShadow: '0 24px 40px rgba(0,0,0,.45)', padding: 30, boxSizing: 'border-box' }}>
            <div style={{ height: 18, width: '55%', background: sh.c, borderRadius: 5, marginBottom: 14 }} />
            <div style={{ fontSize: 34, fontWeight: 800, color: '#222', marginBottom: 20 }}>{sh.label}</div>
            {[100, 86, 92, 64, 100, 80].map((p, k) => <div key={k} style={{ height: 9, width: `${p}%`, background: '#d6d2c6', borderRadius: 5, marginBottom: 15 }} />)}
          </div>
        );
      })}
      {snap > 0 && done < 0.5 && <div style={{ position: 'absolute', left: 540 - 60, top: 740, width: 120, height: 36, borderRadius: 18, background: '#8a92a6', boxShadow: '0 8px 14px rgba(0,0,0,.4)', transform: `scale(${snap})` }} />}
      <div style={{ position: 'absolute', left: 540 - 190, top: 760, width: 380, height: 500, transform: `scale(${done}) rotate(${(1 - done) * -8}deg)`, opacity: done, background: '#fbfaf6', borderRadius: 14, boxShadow: '0 30px 60px rgba(0,0,0,.5), 0 0 80px rgba(22,163,106,.45)', padding: 34, boxSizing: 'border-box' }}>
        <div style={{ height: 18, width: '55%', background: '#4262ff', borderRadius: 5, marginBottom: 26 }} />
        {[100, 88, 94, 70, 100, 84, 60, 90].map((p, i) => <div key={i} style={{ height: 9, width: `${p}%`, background: '#d6d2c6', borderRadius: 5, marginBottom: 17 }} />)}
        <div style={{ position: 'absolute', left: -26, bottom: 36, padding: '14px 30px', borderRadius: 18, background: '#16a36a', color: '#fff', fontWeight: 800, fontSize: 50, boxShadow: '0 14px 30px rgba(0,0,0,.4)', transform: 'rotate(-4deg)' }}>{after}</div>
      </div>
    </AbsoluteFill>
  );
};
