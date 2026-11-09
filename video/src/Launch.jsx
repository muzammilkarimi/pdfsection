import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Cam, C, S, Scene, Sfx, fontFamily, sfx, useL } from './lib.jsx';
import {
  Beat, Bg, DeviceIcon, Doc, Flash, Lock, Outline, Pill, Ring, Shake, Sparks, Star, Words, ease, easeOut, useSpring,
} from './fx.jsx';

const pick = (v, a, b) => (v ? b : a);

// ───────────── 1 · HOOK (0–4s) ─────────────
const Hook = () => {
  const { v } = useL();
  const size = pick(v, 230, 270);
  return (
    <Bg tone="dark">
      <Sparks n={30} seed={2} />
      <Beat at={0.0} dur={1}><Words text="Every PDF." size={size} delay={2} /></Beat>
      <Beat at={1.0} dur={1}><Words text="Every tool." size={size} delay={2} /></Beat>
      <Beat at={2.0} dur={1}><Words text="Every device." size={size} delay={2} /></Beat>
      <Beat at={3.0} dur={1}><Words text="No uploads." size={size} delay={2} hi={[1]} /></Beat>
      {[0, 1, 2, 3].map((i) => <Sfx key={i} at={i} name="tick" volume={0.8} />)}
      <Sfx at={3} name="glass" volume={0.8} /><Sfx at={2.2} name="riser" volume={0.6} />
    </Bg>
  );
};

// ───────────── 2 · INTRO (4–10s) ─────────────
const BigScroll = ({ text, dur, size, color, grad }) => {
  const f = useCurrentFrame();
  const { W } = useL();
  const tw = text.length * size * 0.54;
  const x = interpolate(f, [0, S(dur)], [W * 0.95, -tw + W * 0.05], { extrapolateRight: 'clamp', easing: (t) => 1 - (1 - t) ** 1.6 });
  return (
    <div style={{ position: 'absolute', top: '50%', left: 0, transform: `translate(${x}px,-50%)`, fontFamily, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.05, whiteSpace: 'nowrap', lineHeight: 1, color: grad ? 'transparent' : color, background: grad ? 'linear-gradient(90deg,#8A96F5,#B4BCFA)' : undefined, WebkitBackgroundClip: grad ? 'text' : undefined }}>{text}</div>
  );
};

const LogoMark = ({ size }) => {
  const p = useSpring(0, 11, 130);
  return <Img src={staticFile('logo.png')} style={{ width: size, height: size, borderRadius: size * 0.23, transform: `scale(${p}) rotate(${(1 - p) * -35}deg)`, boxShadow: '0 40px 100px rgba(78,92,214,.7)' }} />;
};

const Intro = () => {
  const { v } = useL();
  const size = pick(v, 520, 440);
  const f = useCurrentFrame();
  return (
    <Bg tone="indigo">
      <Flash at={0} />
      <Sparks n={40} seed={5} color="rgba(255,255,255,.7)" />
      {f < S(2) && <BigScroll text="Introducing" dur={2} size={size} color="#fff" />}
      {f >= S(2) - 6 && f < S(4) && <Sequence from={S(2) - 6}><BigScroll text="PDF Section" dur={2} size={size} color="#fff" grad /></Sequence>}
      {f >= S(4) && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: pick(v, 22, 34) }}>
          <Sequence from={S(4)} layout="none"><LogoMark size={pick(v, 190, 240)} /></Sequence>
          <div style={{ display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: v ? 0 : 50 }}>
            <Sequence from={S(4)} layout="none"><Words text="Free." size={pick(v, 150, 170)} delay={0} /></Sequence>
            <Sequence from={S(4.5)} layout="none"><Words text="Private." size={pick(v, 150, 170)} delay={0} /></Sequence>
            <Sequence from={S(5)} layout="none"><Words text="Instant." size={pick(v, 150, 170)} delay={0} hi={[0]} /></Sequence>
          </div>
        </AbsoluteFill>
      )}
      <Ring at={0} size={500} color="#fff" /><Ring at={4} size={380} /><Ring at={5} size={300} color="#B4BCFA" />
      <Sfx at={0} name="boom" volume={0.7} /><Sfx at={0.05} name="swipe" /><Sfx at={2} name="swipe" /><Sfx at={4} name="impact" volume={0.6} />
      <Sfx at={4.05} name="pop" /><Sfx at={4.5} name="pop" /><Sfx at={5} name="glass" volume={0.9} />
    </Bg>
  );
};

// ───────────── 3a · MERGE (10–14s) ─────────────
const Title = ({ text, size, delay = 4, hi = [] }) => {
  const { v, H } = useL();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: H * pick(v, 0.1, 0.16) }}>
      <Words text={text} size={size} delay={delay} hi={hi} />
    </AbsoluteFill>
  );
};

const Merge = () => {
  const { v } = useL();
  const f = useCurrentFrame();
  const w = pick(v, 250, 330);
  const sp = [useSpring(S(0.2), 13), useSpring(S(0.4), 13), useSpring(S(0.6), 13)];
  const m = ease(f, S(1.7), S(2.1), 0, 1, easeOut);
  const fan = [[-1, -9, -1], [0, 0, 0], [1, 9, 1]];
  const start = [[-1.6, -30], [0, -1.4], [1.6, 30]];
  const cols = ['#4E5CD6', '#7B88F0', '#3140B0'];
  const bump = f >= S(2.1) && f < S(2.1) + 10 ? 1 + 0.06 * (1 - (f - S(2.1)) / 10) : 1;
  const badge = useSpring(S(2.2), 12);
  return (
    <Bg tone="dark">
      <Sparks n={18} seed={9} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `translateY(${pick(v, 0, 0)}px)` }}>
        <Outline size={pick(v, 560, 520)} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>MERGE</Outline>
      </AbsoluteFill>
      <Title text="Merge." size={pick(v, 190, 170)} />
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${pick(v, 90, 70)}px) scale(${bump})` }}>
        {[0, 1, 2].map((i) => {
          const [fx, fr] = fan[i], [sx, sr] = start[i];
          const p = sp[i];
          const x = (sx + (fx - sx) * p) * w * 0.95 * (1 - m);
          const y = (i === 1 ? sr * w * 0.3 * (1 - p) : 0) - m * i * 8;
          const rot = (sr * (1 - p) + fr * p) * (1 - m);
          return <Doc key={i} w={w} color={cols[i]} x={x} y={y} rot={rot} z={i} opacity={Math.min(1, p * 3)} glow={m * 40} tag={['A', 'B', 'C'][i]} />;
        })}
      </div>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: pick(v, 80, 150) }}>
        <div style={{ transform: `scale(${badge})`, opacity: Math.min(1, badge * 2) }}><Pill size={pick(v, 54, 46)} bg="rgba(34,201,147,.2)">3 files → 1 PDF</Pill></div>
      </AbsoluteFill>
      <Ring at={2.1} size={w * 1.5} color="#8A96F5" />
      <Sfx at={0} name="whoosh" volume={0.8} /><Sfx at={0.25} name="pop" /><Sfx at={0.45} name="pop" /><Sfx at={0.65} name="pop" />
      <Sfx at={1.75} name="swipe" /><Sfx at={2.1} name="impact" volume={0.6} /><Sfx at={2.2} name="success" volume={0.7} />
    </Bg>
  );
};

// ───────────── 3b · SPLIT (14–18s) ─────────────
const Split = () => {
  const { v, W, H } = useL();
  const f = useCurrentFrame();
  const w = pick(v, 250, 300);
  const open = useSpring(S(1.1), 12, 110);
  const laser = ease(f, S(0.55), S(1.1), 0, 1);
  const lx = (laser - 0.5) * w * 1.3;
  const fan = [-1.5, -0.5, 0.5, 1.5];
  return (
    <Bg tone="dark">
      <Sparks n={18} seed={3} color="rgba(170,182,255,.7)" />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Outline size={pick(v, 540, 520)} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>SPLIT</Outline>
      </AbsoluteFill>
      <Title text="Split." size={pick(v, 190, 170)} />
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${pick(v, 90, 70)}px)` }}>
        {fan.map((k, i) => (
          <Doc key={i} w={w} color={['#4E5CD6', '#6F7CEA', '#8F9AF5', '#3140B0'][i]} z={i} tag={`${i + 1}`}
            x={k * w * 0.72 * open} y={Math.abs(k) * 22 * open} rot={k * 9 * open} opacity={Math.min(1, ease(f, 0, 10, 0, 1) * 3)} />
        ))}
        {f >= S(0.5) && f < S(1.25) && <div style={{ position: 'absolute', left: '50%', top: '50%', width: 6, height: w * 1.7, marginTop: -w * 0.85, marginLeft: lx - 3, background: '#fff', borderRadius: 3, boxShadow: '0 0 30px 10px rgba(150,165,255,.95)', zIndex: 20 }} />}
      </div>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: pick(v, 80, 150) }}>
        <Sequence from={S(1.6)} layout="none"><Words text="Page by page." size={pick(v, 70, 64)} weight={500} delay={0} color="rgba(255,255,255,.85)" /></Sequence>
      </AbsoluteFill>
      <Ring at={1.1} size={w * 1.4} color="#8A96F5" />
      <Sfx at={0} name="whoosh" volume={0.8} /><Sfx at={0.5} name="swipe" /><Sfx at={1.1} name="impact" volume={0.6} /><Sfx at={1.15} name="tick" /><Sfx at={1.25} name="tick" /><Sfx at={1.35} name="tick" />
    </Bg>
  );
};

// ───────────── 3c · COMPRESS (18–24s) ─────────────
const Compress = () => {
  const { v } = useL();
  const f = useCurrentFrame();
  const t = ease(f, S(1.0), S(3.0), 0, 1, (x) => 1 - (1 - x) ** 3);
  const mb = 19.3 - (19.3 - 0.8) * t;
  const squeeze = t < 1 ? 1 + Math.sin(t * Math.PI * 5) * 0.03 * (1 - t) : 1;
  const w = pick(v, 250, 300);
  const card = useSpring(S(3.4), 14, 100);
  const pct = useSpring(S(3.0), 10);
  return (
    <Bg tone="dark">
      <Sparks n={18} seed={11} />
      <Title text="Compress." size={pick(v, 190, 170)} />
      <AbsoluteFill style={{ flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: pick(v, 40, 140), paddingTop: pick(v, 260, 0), paddingBottom: pick(v, 0, 250) }}>
        <div style={{ position: 'relative', width: w * 1.1, height: w * 1.4 }}>
          <Doc w={w} color="#4E5CD6" scale={interpolate(t, [0, 1], [1.12, 0.55])} scaleY={squeeze} tag="PDF" glow={t * 40} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily, fontWeight: 800, fontSize: pick(v, 230, 270), letterSpacing: -10, color: t > 0.98 ? '#22c993' : '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {mb.toFixed(1)}<span style={{ fontSize: pick(v, 110, 120), letterSpacing: -2 }}> MB</span>
          </div>
          <div style={{ transform: `scale(${pct})`, opacity: Math.min(1, pct * 2), marginTop: 10, display: 'flex', justifyContent: 'center' }}>
            <Pill size={pick(v, 56, 50)} bg="rgba(34,201,147,.22)">−96% smaller</Pill>
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: pick(v, 110, 60) }}>
        <div style={{ transform: `translateY(${(1 - card) * 160}px)`, opacity: Math.min(1, card * 2), boxShadow: '0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.4)', borderRadius: 22, overflow: 'hidden' }}>
          <Cam src="compress" startSec={17.5} fw={pick(v, 700, 560)} fh={pick(v, 700, 560) * 150 / 440} keys={[{ t: 0, x: 585, y: 300, w: 440 }, { t: 9, x: 585, y: 300, w: 440 }]} radius={0} />
        </div>
      </AbsoluteFill>
      <Ring at={3.0} size={w * 1.2} color="#22c993" />
      <Sfx at={0} name="whoosh" volume={0.8} /><Sfx at={0.95} name="riser" volume={0.4} /><Sfx at={3.0} name="impact" volume={0.6} /><Sfx at={3.05} name="success" volume={0.7} /><Sfx at={3.45} name="swipe" />
    </Bg>
  );
};

// ───────────── 3d · CONVERT (24–30s) ─────────────
const FORMATS = [['PDF', '#4E5CD6'], ['WORD', '#3A78F2'], ['PDF', '#4E5CD6'], ['EXCEL', '#2F9E8F'], ['PDF', '#4E5CD6'], ['JPG', '#7B88F0'], ['PDF', '#4E5CD6'], ['PPT', '#2E3A9E']];
const Convert = () => {
  const { v } = useL();
  const f = useCurrentFrame();
  const step = 15; // every beat
  const i = Math.max(0, Math.min(FORMATS.length - 1, Math.floor((f - S(0.8)) / step)));
  const local = f - S(0.8) - i * step;
  const flip = f < S(0.8) ? 1 : interpolate(local, [0, 8], [0, 1], { extrapolateRight: 'clamp', easing: easeOut });
  const [label, col] = FORMATS[i];
  const s = pick(v, 460, 520);
  const appear = useSpring(0, 12);
  return (
    <Bg tone="dark">
      <Sparks n={18} seed={21} />
      <Title text="Convert." size={pick(v, 190, 170)} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingTop: pick(v, 140, 110) }}>
        <div style={{ perspective: 1600 }}>
          <div style={{
            width: s, height: s * 0.62, borderRadius: s * 0.1, background: `linear-gradient(135deg, ${col}, ${col}aa)`, display: 'grid', placeItems: 'center',
            boxShadow: `0 40px 120px ${col}88, inset 0 2px 0 rgba(255,255,255,.4)`, transform: `scale(${appear}) rotateY(${(1 - flip) * -90}deg)`,
            fontFamily, fontWeight: 800, fontSize: label.length > 4 ? s * 0.2 : s * 0.3, color: '#fff', letterSpacing: -s * 0.012,
          }}>{label}</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: pick(v, 130, 80) }}>
        <Sequence from={S(3.2)} layout="none"><Words text="Both ways." size={pick(v, 90, 80)} weight={500} delay={0} hi={[1]} /></Sequence>
      </AbsoluteFill>
      <Sfx at={0} name="whoosh" volume={0.8} />
      {FORMATS.map((_, k) => <Sfx key={k} at={0.8 + k * 0.5} name="pop" volume={0.55} />)}
    </Bg>
  );
};

// ───────────── 4 · THE TURN (30–34s) ─────────────
const Turn = () => {
  const { v, W, H } = useL();
  const f = useCurrentFrame();
  const fade = interpolate(f, [S(2.5), S(3.1)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Bg tone="void">
      <Sparks n={26} seed={8} color="rgba(255,255,255,.5)" />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fade, padding: '0 6%' }}>
        <Words text="But where do your files go?" size={pick(v, 160, 150)} delay={S(0.3)} stagger={6} weight={500} color="rgba(255,255,255,.92)" hi={[5]} />
      </AbsoluteFill>
      <Sfx at={0} name="swipe" volume={0.7} /><Sfx at={0.4} name="glass" volume={0.4} />
    </Bg>
  );
};

// ───────────── 5 · PRIVACY (34–40s) ─────────────
const Privacy = () => {
  const { v, H } = useL();
  const f = useCurrentFrame();
  const nowhere = interpolate(f, [S(1.7), S(2.1)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rest = interpolate(f, [S(1.9), S(2.4)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lockP = ease(f, S(2.2), S(2.8), 0, 1, easeOut);
  const card = useSpring(S(3.9), 14, 100);
  const slam = useSpring(0, 9, 180);
  return (
    <Bg tone="indigo">
      <Flash at={0} />
      <Shake at={0} amp={26}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: nowhere }}>
          <div style={{ transform: `scale(${0.7 + slam * 0.3})` }}><Words text="Nowhere." size={pick(v, 215, 330)} delay={0} stagger={1} hi={[0]} /></div>
        </AbsoluteFill>
      </Shake>
      <AbsoluteFill style={{ opacity: rest, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: pick(v, 10, 0), paddingBottom: pick(v, 200, 160) }}>
        <Lock size={pick(v, 250, 230)} closed={lockP} />
        <div style={{ display: 'flex', gap: 28, flexDirection: v ? 'column' : 'row', alignItems: 'center' }}>
          <div style={{ fontFamily, fontWeight: 800, fontSize: pick(v, 330, 300), letterSpacing: -14, color: '#22c993', lineHeight: 1, textShadow: '0 0 60px rgba(34,201,147,.6)' }}>0</div>
          <div style={{ fontFamily, fontWeight: 600, fontSize: pick(v, 100, 90), letterSpacing: -3, color: '#fff' }}>bytes uploaded.</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: pick(v, 150, 70), gap: 26 }}>
        <div style={{ transform: `translateY(${(1 - card) * 120}px)`, opacity: Math.min(1, card * 2), borderRadius: 999, overflow: 'hidden', boxShadow: '0 20px 70px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.5)' }}>
          <Cam src="compress" startSec={17.5} fw={pick(v, 760, 800)} fh={pick(v, 760, 800) * 46 / 430} keys={[{ t: 0, x: 590, y: 598, w: 430 }, { t: 9, x: 590, y: 598, w: 430 }]} radius={0} />
        </div>
        <Sequence from={S(4.5)} layout="none"><Words text="100% in your browser." size={pick(v, 84, 78)} delay={0} hi={[2, 3]} /></Sequence>
      </AbsoluteFill>
      <Ring at={0} size={620} color="#fff" /><Ring at={0.12} size={420} color="#B4BCFA" />
      <Sfx at={0} name="boom" volume={0.9} /><Sfx at={0.05} name="impact" volume={0.8} /><Sfx at={2.6} name="tick" volume={1} /><Sfx at={2.65} name="glass" /><Sfx at={3.9} name="swipe" /><Sfx at={4.5} name="success" volume={0.7} />
    </Bg>
  );
};

// ───────────── 6 · DEVICES (40–46s) ─────────────
const Devices = () => {
  const { v } = useL();
  const f = useCurrentFrame();
  const kinds = [['desktop', 'Desktop'], ['tablet', 'Tablet'], ['phone', 'Phone']];
  const isz = pick(v, 250, 330);
  return (
    <Bg tone="dark">
      <Sparks n={20} seed={14} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: pick(v, 260, 130) }}>
        <Words text="Works on every device." size={pick(v, 150, 130)} delay={3} hi={[3]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: pick(v, 40, 120), paddingTop: pick(v, 260, 180) }}>
        {kinds.map(([k, label], i) => {
          const p = ease(f, S(0.6 + i * 0.5), S(1.3 + i * 0.5), 0, 1, easeOut);
          const sc = useSpringSafe(f, S(0.6 + i * 0.5));
          return (
            <div key={k} style={{ display: 'flex', flexDirection: v ? 'row' : 'column', alignItems: 'center', gap: v ? 40 : 14, transform: `scale(${0.8 + sc * 0.2})`, opacity: Math.min(1, p * 3) }}>
              <DeviceIcon kind={k} size={isz} progress={p} />
              <div style={{ fontFamily, fontWeight: 600, fontSize: pick(v, 76, 60), color: '#fff', letterSpacing: -2 }}>{label}</div>
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: pick(v, 150, 70) }}>
        <Sequence from={S(4)} layout="none"><Words text="Nothing to install." size={pick(v, 96, 86)} weight={500} delay={0} color="rgba(255,255,255,.9)" hi={[2]} /></Sequence>
      </AbsoluteFill>
      <Sfx at={0} name="whoosh" volume={0.8} /><Sfx at={0.6} name="pop" /><Sfx at={1.1} name="pop" /><Sfx at={1.6} name="pop" /><Sfx at={4} name="glass" volume={0.8} />
    </Bg>
  );
};
const useSpringSafe = (f, delay) => interpolate(f - delay, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut });

// ───────────── 7 · TOOL WALL (46–52s) ─────────────
const TOOLS = ['Merge PDF', 'Split PDF', 'Compress PDF', 'Remove Pages', 'Extract Pages', 'Organize PDF', 'OCR PDF', 'PDF to Word', 'PDF to Excel', 'PDF to JPG', 'Edit PDF', 'Sign PDF', 'Protect PDF', 'Unlock PDF', 'Redact PDF', 'Rotate PDF', 'Add Watermark', 'Page Numbers', 'Translate PDF', 'Repair PDF', 'Crop PDF', 'Bates Numbering', 'Grayscale PDF', 'PDF to PDF/A'];
const Wall = () => {
  const { v, W, H } = useL();
  const f = useCurrentFrame();
  const rows = pick(v, 7, 5);
  const rh = H / rows;
  const n = Math.round(ease(f, S(0.4), S(1.8), 0, 34, (x) => 1 - (1 - x) ** 3));
  const sp = useSpring(S(0.3), 12);
  return (
    <Bg tone="dark">
      {Array.from({ length: rows }, (_, r) => {
        const items = TOOLS.slice((r * 5) % 24, ((r * 5) % 24) + 8).concat(TOOLS.slice(0, 8));
        const dir = r % 2 ? 1 : -1;
        const x = ((f * 7 * dir) % 2600) - (dir > 0 ? 2600 : 0);
        return (
          <div key={r} style={{ position: 'absolute', top: r * rh + rh * 0.1, left: 0, transform: `translateX(${x}px)`, display: 'flex', gap: 60 }}>
            {[...items, ...items, ...items].map((t, i) => <Outline key={i} size={rh * 0.8} opacity={0.16}>{t}</Outline>)}
          </div>
        );
      })}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center, rgba(5,6,26,.85) 15%, rgba(5,6,26,0) 70%)' }}>
        <div style={{ transform: `scale(${0.5 + sp * 0.5})`, opacity: sp, textAlign: 'center' }}>
          <div style={{ fontFamily, fontWeight: 800, fontSize: pick(v, 520, 480), letterSpacing: -22, lineHeight: 0.9, color: 'transparent', background: 'linear-gradient(180deg,#C3CAFF,#B4BCFA)', WebkitBackgroundClip: 'text' }}>{n}</div>
          <Sequence from={S(1.8)} layout="none"><Words text="tools. One tab." size={pick(v, 130, 120)} delay={0} hi={[0]} /></Sequence>
        </div>
      </AbsoluteFill>
      <Ring at={1.8} size={500} color="#B4BCFA" />
      <Sfx at={0} name="whoosh" volume={0.8} />{[0.5, 0.8, 1.1, 1.4].map((a) => <Sfx key={a} at={a} name="tick" volume={0.6} />)}<Sfx at={1.8} name="impact" volume={0.6} /><Sfx at={1.85} name="glass" />
    </Bg>
  );
};

// ───────────── 8 · CTA (52–60s) ─────────────
const Cta = () => {
  const { v } = useL();
  const f = useCurrentFrame();
  const end = f >= S(5.3);
  const url = useSpring(S(1.5), 12);
  const endIn = ease(f, S(5.3), S(5.9), 0, 1);
  const fadeOut = ease(f, S(7.3), S(8), 1, 0);
  return (
    <Bg tone="indigo">
      <Flash at={0} />
      <Sparks n={44} seed={31} color="rgba(255,255,255,.8)" />
      <AbsoluteFill style={{ opacity: 1 - endIn, alignItems: 'center', justifyContent: 'center', gap: pick(v, 40, 34) }}>
        <Sequence from={S(0.3)} layout="none"><LogoMark size={pick(v, 220, 200)} /></Sequence>
        <Words text="Try it free." size={pick(v, 230, 250)} delay={S(0.6)} hi={[2]} />
        <div style={{ transform: `scale(${url})`, opacity: Math.min(1, url * 2) }}>
          <div style={{ fontFamily, fontWeight: 600, fontSize: pick(v, 80, 70), color: C.ink, background: '#fff', padding: '18px 70px', borderRadius: 999, boxShadow: '0 30px 80px rgba(20,10,100,.5)' }}>pdfsection.com</div>
        </div>
        <Sequence from={S(2.2)} layout="none"><Words text="Free · Private · No uploads" size={pick(v, 56, 50)} weight={500} delay={0} color="rgba(255,255,255,.85)" /></Sequence>
      </AbsoluteFill>
      {end && (
        <AbsoluteFill style={{ background: '#000', opacity: Math.min(endIn, fadeOut), alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 28 }}>
          <Img src={staticFile('logo.png')} style={{ width: pick(v, 130, 120), height: pick(v, 130, 120), borderRadius: 30 }} />
          <div style={{ fontFamily, fontWeight: 600, fontSize: pick(v, 90, 96), color: '#fff', letterSpacing: -3 }}>PDF Section</div>
        </AbsoluteFill>
      )}
      <Ring at={0} size={700} color="#fff" /><Ring at={0.1} size={500} color="#B4BCFA" />
      <Sfx at={0} name="boom" volume={0.9} /><Sfx at={0.05} name="impact" volume={0.8} /><Sfx at={0.6} name="pop" /><Sfx at={1.5} name="glass" volume={0.9} /><Sfx at={5.3} name="glass" volume={0.6} />
    </Bg>
  );
};

// ───────────── timeline (bar-aligned to the music: 1 bar = 2s) ─────────────
export const Launch = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Audio src={sfx('music')} volume={1} />
    <Scene from={0} dur={4} fade={0}><Hook /></Scene>
    <Scene from={4} dur={6} fade={0}><Intro /></Scene>
    <Scene from={10} dur={4} fade={4}><Merge /></Scene>
    <Scene from={14} dur={4} fade={4}><Split /></Scene>
    <Scene from={18} dur={6} fade={4}><Compress /></Scene>
    <Scene from={24} dur={6} fade={4}><Convert /></Scene>
    <Scene from={30} dur={4} fade={6}><Turn /></Scene>
    <Scene from={34} dur={6} fade={0}><Privacy /></Scene>
    <Scene from={40} dur={6} fade={6}><Devices /></Scene>
    <Scene from={46} dur={6} fade={6}><Wall /></Scene>
    <Scene from={52} dur={8} fade={0}><Cta /></Scene>
  </AbsoluteFill>
);
