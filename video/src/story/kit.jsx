import React from 'react';
import { AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { fontFamily, FPS, S } from '../lib.jsx';

export { S, FPS, fontFamily };
export const SW = 540, SH = 1170; // phone screen coordinate system

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const out = Easing.bezier(0.22, 1, 0.36, 1);
const fmt = (s) => { const m = Math.max(0, Math.floor(s)); return [Math.floor(m / 3600), Math.floor((m % 3600) / 60), m % 60].map((n) => String(n).padStart(2, '0')).join(':'); };

// ───────────── room: the "desk" the phone sits on ─────────────
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
export const Room = ({ theme = 'night', children }) => {
  const f = useCurrentFrame();
  const night = theme === 'night';
  const lamp = night ? 'rgba(255,176,96,.30)' : 'rgba(255,236,200,.75)';
  return (
    <AbsoluteFill style={{ fontFamily, overflow: 'hidden', background: night ? '#0a0b10' : '#cfc6b8' }}>
      <AbsoluteFill style={{ background: night
        ? 'radial-gradient(ellipse 80% 55% at 18% 8%, rgba(255,170,90,.22), transparent 70%), linear-gradient(180deg,#14131a,#08090d 70%)'
        : 'radial-gradient(ellipse 90% 60% at 80% 0%, rgba(255,244,214,.9), transparent 70%), linear-gradient(180deg,#d8cfbf,#b9ad9a)' }} />
      {/* wood grain on the desk */}
      <AbsoluteFill style={{ opacity: night ? 0.16 : 0.22, background: 'repeating-linear-gradient(92deg, rgba(0,0,0,.35) 0 2px, transparent 2px 19px, rgba(255,255,255,.08) 19px 21px, transparent 21px 47px)' }} />
      <div style={{ position: 'absolute', width: 1400, height: 900, left: -200, top: -250, borderRadius: '50%', background: `radial-gradient(circle, ${lamp}, transparent 68%)`, transform: `translate(${Math.sin(f / 90) * 12}px, ${Math.cos(f / 110) * 8}px)` }} />
      {children}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%)' }} />
      <AbsoluteFill style={{ opacity: night ? 0.16 : 0.1, mixBlendMode: 'overlay', backgroundImage: GRAIN, backgroundPosition: `${(f * 53) % 300}px ${(f * 91) % 300}px` }} />
    </AbsoluteFill>
  );
};

// ───────────── phone with handheld camera ─────────────
export const PhoneShot = ({ children, dur = 5, push = 0.05, w = 660, y = 150, clock = '11:58', dark = false, shakeAt = null, lean = 0, under = null, over = null, bg = true }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const k = w / SW;
  const prog = interpolate(f, [0, S(dur)], [0, 1], clamp);
  const sc = 1 + push * prog;
  const hx = Math.sin(f / 37) * 5 + Math.sin(f / 13) * 1.6;
  const hy = Math.cos(f / 29) * 5 + Math.sin(f / 11) * 1.4;
  const hr = Math.sin(f / 53) * 0.35 + lean;
  const sh = shakeAt == null ? 0 : (t > shakeAt ? Math.exp(-(t - shakeAt) * 7) * Math.sin((t - shakeAt) * 60) * 18 : 0);
  return (
    <AbsoluteFill style={{ transform: `translate(${hx + sh}px, ${hy}px) rotate(${hr}deg) scale(${sc})`, transformOrigin: '50% 55%' }}>
      {under}
      <div style={{ position: 'absolute', left: (1080 - w) / 2 - 16, top: y, width: w + 32, height: SH * k + 32 }}>
        <div style={{ position: 'absolute', left: 30, right: 30, bottom: -50, height: 90, borderRadius: '50%', background: 'rgba(0,0,0,.55)', filter: 'blur(36px)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 92, background: 'linear-gradient(160deg,#2a2b31,#0c0c0f)', boxShadow: '0 0 0 2px #3b3c44, inset 0 0 0 2px #000' }} />
        <div style={{ position: 'absolute', left: 16, top: 16, width: SW, height: SH, transform: `scale(${k})`, transformOrigin: '0 0', borderRadius: 52, overflow: 'hidden', background: '#fff', fontFamily }}>
          {children}
          <StatusBar clock={clock} dark={dark} />
        </div>
        {/* glass reflection */}
        <div style={{ position: 'absolute', left: 16, top: 16, width: w, height: SH * k, borderRadius: 52 * k, background: 'linear-gradient(115deg, rgba(255,255,255,.10) 0%, transparent 28%)', pointerEvents: 'none' }} />
      </div>
      {over}
    </AbsoluteFill>
  );
};

const StatusBar = ({ clock, dark }) => {
  const c = dark ? '#fff' : '#111';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 38px 0', color: c, fontWeight: 600, fontSize: 19, zIndex: 20 }}>
      <span>{clock}</span>
      <div style={{ position: 'absolute', left: '50%', top: 12, width: 110, height: 28, marginLeft: -55, borderRadius: 20, background: '#000' }} />
      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <svg width="22" height="15" viewBox="0 0 22 15" fill={c}><rect x="0" y="9" width="4" height="6" rx="1" /><rect x="6" y="6" width="4" height="9" rx="1" /><rect x="12" y="3" width="4" height="12" rx="1" /><rect x="18" y="0" width="4" height="15" rx="1" /></svg>
        <svg width="34" height="16" viewBox="0 0 34 16" fill="none"><rect x="1" y="1" width="28" height="14" rx="4" stroke={c} strokeWidth="1.6" opacity=".55" /><rect x="3.5" y="3.5" width="18" height="9" rx="2" fill={c} /></svg>
      </span>
    </div>
  );
};

// browser chrome (status bar overlay is added by PhoneShot)
export const Browser = ({ url, children, dark = false }) => (
  <div style={{ position: 'absolute', inset: 0, background: dark ? '#111' : '#fff' }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 96, background: dark ? '#1c1c1e' : '#f3f3f6', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 10, height: 44, borderRadius: 22, background: dark ? '#2c2c30' : '#e6e7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 21, color: dark ? '#ddd' : '#333', fontWeight: 500 }}>
        <svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>{url}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 96, bottom: 0, overflow: 'hidden' }}>{children}</div>
  </div>
);

// slice of the real screen recording
export const Clip = ({ name, start, w = SW, h = SH - 96 }) => (
  <OffthreadVideo src={staticFile(`footage/${name}.mp4`)} startFrom={S(start)} muted style={{ width: w, height: h, objectFit: 'cover' }} />
);
// a timeline of jump cuts: parts = [{ start, dur }]
export const Cuts = ({ name, parts }) => {
  let at = 0;
  return <>{parts.map((p, i) => { const from = at; at += S(p.dur); return <Sequence key={i} from={from} durationInFrames={S(p.dur)}><Clip name={name} start={p.start} /></Sequence>; })}</>;
};
export const cutsLen = (parts) => parts.reduce((a, p) => a + p.dur, 0);

// ───────────── messenger ─────────────
const Dots = ({ dark }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ alignSelf: 'flex-start', padding: '20px 26px', borderRadius: 30, background: dark ? '#26272d' : '#e9e9ee', display: 'flex', gap: 9 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: dark ? '#8d8f9a' : '#9a9aa4', opacity: 0.4 + 0.6 * Math.max(0, Math.sin(f / 4 - i * 0.9)) }} />)}
    </div>
  );
};
export const Chat = ({ name, sub = 'online', hue = '#e07a5f', msgs, dark = false, accent = '#3a7bfd', url }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const bg = dark ? '#101116' : '#f6f4f1';
  const shown = msgs.filter((m) => t >= m.at);
  const next = msgs.find((m) => t < m.at);
  const typing = next && next.from === 'them' && t >= next.at - 1.0;
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg, color: dark ? '#f2f2f5' : '#161618' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 150, background: dark ? '#17181e' : '#fff', borderBottom: `1px solid ${dark ? '#26272d' : '#e3e0db'}`, display: 'flex', alignItems: 'flex-end', padding: '0 24px 16px', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: hue, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 26, color: '#fff' }}>{name[0]}</div>
        <div><div style={{ fontWeight: 700, fontSize: 27 }}>{name}</div><div style={{ fontSize: 18, color: dark ? '#7f8190' : '#8a8a92' }}>{sub}</div></div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, bottom: 110, padding: '0 22px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12, overflow: 'hidden' }}>
        {shown.map((m, i) => {
          const p = interpolate(t - m.at, [0, 0.22], [0, 1], { ...clamp, easing: out });
          const me = m.from === 'me';
          return (
            <div key={i} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '80%', opacity: p, transform: `translateY(${(1 - p) * 22}px) scale(${0.94 + p * 0.06})`, transformOrigin: me ? '100% 100%' : '0 100%' }}>
              {m.file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderRadius: 26, background: me ? accent : (dark ? '#26272d' : '#e9e9ee'), color: me ? '#fff' : 'inherit' }}>
                  <div style={{ width: 54, height: 66, borderRadius: 8, background: '#fff', color: '#e04646', fontWeight: 800, fontSize: 15, display: 'grid', placeItems: 'end center', paddingBottom: 8, boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}>PDF</div>
                  <div><div style={{ fontWeight: 600, fontSize: 23 }}>{m.file}</div><div style={{ fontSize: 18, opacity: 0.8 }}>{m.size}</div></div>
                </div>
              ) : (
                <div style={{ padding: '17px 24px', borderRadius: 30, fontSize: 27, lineHeight: 1.28, fontWeight: 500, background: me ? accent : (dark ? '#26272d' : '#e9e9ee'), color: me ? '#fff' : 'inherit', borderBottomRightRadius: me ? 8 : 30, borderBottomLeftRadius: me ? 30 : 8 }}>{m.text}</div>
              )}
            </div>
          );
        })}
        {typing && <Dots dark={dark} />}
      </div>
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 26, height: 64, borderRadius: 32, background: dark ? '#1d1e25' : '#fff', border: `1px solid ${dark ? '#2a2b33' : '#e3e0db'}`, padding: '0 26px', display: 'flex', alignItems: 'center', fontSize: 24, color: dark ? '#6d6f7c' : '#a3a3ab' }}>Message</div>
      {url}
    </div>
  );
};

// transient banner notification
export const Banner = ({ at, title, body, icon = '$' }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const p = interpolate(t - at, [0, 0.35], [0, 1], { ...clamp, easing: out });
  return (
    <div style={{ position: 'absolute', left: 16, right: 16, top: 54, zIndex: 30, padding: '20px 24px', borderRadius: 30, background: 'rgba(250,250,252,.96)', boxShadow: '0 14px 40px rgba(0,0,0,.35)', color: '#111', transform: `translateY(${(1 - p) * -160}px)`, opacity: p, display: 'flex', gap: 18, alignItems: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: '#0f9d6b', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 32 }}>{icon}</div>
      <div><div style={{ fontWeight: 700, fontSize: 25 }}>{title}</div><div style={{ fontSize: 22, color: '#555' }}>{body}</div></div>
    </div>
  );
};

// ───────────── fictional deadline portal ─────────────
const Spinner = () => { const f = useCurrentFrame(); return <div style={{ width: 28, height: 28, borderRadius: '50%', border: '4px solid #cfd6e6', borderTopColor: '#1d3a8a', transform: `rotate(${f * 14}deg)` }} />; };
const Bare = ({ children }) => <div style={{ position: 'relative', width: 540, height: 978, overflow: 'hidden' }}>{children}</div>;
export const PORTAL = { url: 'apply.meritaward.org', org: 'MERIT AWARD 2026', title: 'Application portal', step: 'STEP 3 OF 3', heading: 'Upload your application', closes: 'Portal closes in', rule: 'PDF only · max file size 10 MB', error: 'Upload failed. File exceeds the 10 MB limit.', submit: 'Submit application', chip: 'Application PDF', doneTitle: 'Application submitted', doneSub: 'Received 11:59 PM · Ref MA-20418', checks: ['Transcript', 'Personal essay'], brand: '#12307a' };
export const Portal = ({ mode, count = 120, file, size, attach = 0.6, err = 2.8, ok = 1.0, submit = 2.0, done = 2.6, bare = false, cfg: c0 }) => {
  const c = { ...PORTAL, ...c0 };
  const Wrap = bare ? Bare : Browser;
  const f = useCurrentFrame(); const t = f / FPS;
  const attached = t >= attach;
  const failed = mode === 'fail' && t >= err;
  const uploading = mode === 'fail' && attached && !failed;
  const ready = mode === 'ok' && t >= ok;
  const pressed = mode === 'ok' && t >= submit && t < submit + 0.25;
  const finished = mode === 'ok' && t >= done;
  const prog = interpolate(t, [attach + 0.4, err - 0.1], [0, 0.93], clamp);
  const remain = mode === 'ok' ? count : count - t;
  const urgent = remain < 70;
  const dp = interpolate(t - done, [0, 0.4], [0, 1], { ...clamp, easing: out });
  return (
    <Wrap url={c.url}>
      <div style={{ position: 'absolute', inset: 0, background: '#f4f6fb', color: '#10203f' }}>
        <div style={{ height: 130, background: c.brand, color: '#fff', padding: '26px 28px' }}>
          <div style={{ fontSize: 17, letterSpacing: 3, opacity: 0.7, fontWeight: 600 }}>{c.org}</div>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>{c.title}</div>
        </div>
        <div style={{ padding: '26px 28px' }}>
          <div style={{ fontSize: 20, color: '#5b6a8c', fontWeight: 600 }}>{c.step}</div>
          <div style={{ fontSize: 31, fontWeight: 700, margin: '4px 0 20px' }}>{c.heading}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderRadius: 18, background: urgent ? '#fdeaea' : '#fff', border: `2px solid ${urgent ? '#e25555' : '#dde3f0'}` }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: urgent ? '#b32020' : '#445' }}>{c.closes}</div>
            <div style={{ fontSize: 40, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: urgent ? '#d22' : '#10203f', letterSpacing: 1 }}>{fmt(remain)}</div>
          </div>
          <div style={{ marginTop: 22, height: 300, borderRadius: 22, border: `3px dashed ${failed ? '#e25555' : '#aab6d3'}`, background: '#fff', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {!attached ? (
              <><div style={{ fontSize: 28, fontWeight: 700 }}>Tap to choose your file</div><div style={{ fontSize: 21, color: '#6b7896', marginTop: 8 }}>{c.rule}</div></>
            ) : (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 54, height: 66, borderRadius: 8, background: '#fff', border: '2px solid #d6dbe8', color: '#e04646', fontWeight: 800, fontSize: 15, display: 'grid', placeItems: 'end center', paddingBottom: 8 }}>PDF</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 23, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file}</div>
                    <div style={{ fontSize: 20, color: failed ? '#d22' : '#6b7896', fontWeight: failed ? 700 : 500 }}>{size}</div>
                  </div>
                  {uploading && <Spinner />}
                  {ready && <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#16a36a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 24 }}>✓</div>}
                  {failed && <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e25555', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 24 }}>!</div>}
                </div>
                {uploading && <div style={{ height: 10, borderRadius: 6, background: '#e3e8f3', marginTop: 20 }}><div style={{ width: `${prog * 100}%`, height: '100%', borderRadius: 6, background: '#12307a' }} /></div>}
                {failed && <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 14, background: '#fdeaea', color: '#b32020', fontSize: 21, fontWeight: 600 }}>{c.error}</div>}
                {ready && <div style={{ marginTop: 20, fontSize: 21, color: '#0f7f55', fontWeight: 600 }}>Ready to submit</div>}
              </div>
            )}
          </div>
          <div style={{ marginTop: 26, height: 84, borderRadius: 42, display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, color: '#fff', background: ready ? c.brand : '#b9c1d6', transform: pressed ? 'scale(.97)' : 'none', boxShadow: ready ? '0 10px 24px rgba(18,48,122,.35)' : 'none' }}>{c.submit}</div>
          <div style={{ marginTop: 26, padding: '6px 22px', borderRadius: 18, background: '#fff', border: '2px solid #dde3f0' }}>
            {[...c.checks.map((x) => [x, true]), [c.chip, ready || finished]].map(([l, d], i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 0', borderTop: i ? '1px solid #e8ecf5' : 'none', fontSize: 23, fontWeight: 600, color: d ? '#10203f' : '#7c88a6' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: d ? '#16a36a' : 'transparent', border: d ? 'none' : '2.5px solid #b9c1d6', color: '#fff', fontSize: 18, display: 'grid', placeItems: 'center', fontWeight: 800 }}>{d ? '✓' : ''}</div>{l}
              </div>
            ))}
          </div>
        </div>
        {finished && (
          <div style={{ position: 'absolute', inset: 0, background: '#effaf4', opacity: dp, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', background: '#16a36a', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 88, fontWeight: 800, transform: `scale(${0.6 + dp * 0.4})`, boxShadow: '0 18px 50px rgba(22,163,106,.4)' }}>✓</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#0b5a3c', marginTop: 20 }}>{c.doneTitle}</div>
            <div style={{ fontSize: 23, color: '#3d7a63' }}>{c.doneSub}</div>
          </div>
        )}
      </div>
    </Wrap>
  );
};

// ───────────── type ─────────────
export const Sub = ({ at, to, children, y = 1690 }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const p = interpolate(t, [at, at + 0.18, to - 0.15, to], [0, 1, 1, 0], clamp);
  if (t < at || t > to) return null;
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: y, transform: `translateY(${(1 - p) * 14}px)`, opacity: p, textAlign: 'center', fontFamily, fontWeight: 800, fontSize: 64, lineHeight: 1.12, letterSpacing: -1.2, color: '#fff', textShadow: '0 3px 0 rgba(0,0,0,.55), 0 0 28px rgba(0,0,0,.65), 0 0 6px rgba(0,0,0,.7)' }}>{children}</div>
  );
};
export const Y = ({ children }) => <span style={{ color: '#ffd02f' }}>{children}</span>;

export const Stamp = ({ children, dark = true }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: 70, top: 70, display: 'flex', alignItems: 'center', gap: 14, fontFamily, fontWeight: 600, fontSize: 30, letterSpacing: 5, color: dark ? 'rgba(255,255,255,.78)' : 'rgba(30,24,16,.8)' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ff4545', opacity: f % 40 < 24 ? 1 : 0.25 }} />{children}
    </div>
  );
};

// plain typographic end card
export const EndCard = ({ lines, url, dark = true }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: dark ? '#fff' : '#1d1810', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 70, opacity: interpolate(t, [0, 0.4], [0, 1], clamp) }}>
        <div style={{ width: 96, height: 96, borderRadius: 28, background: '#4E5CD6', display: 'grid', placeItems: 'center' }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg>
        </div>
        <div style={{ fontSize: 66, fontWeight: 700, letterSpacing: -1.5 }}>PDF <span style={{ color: '#8A96F5' }}>Section</span></div>
      </div>
      {lines.map((l, i) => {
        const p = interpolate(t, [0.5 + i * 0.5, 0.8 + i * 0.5], [0, 1], { ...clamp, easing: out });
        return <div key={i} style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, lineHeight: 1.08, opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}>{l}</div>;
      })}
      <div style={{ marginTop: 80, fontSize: 52, fontWeight: 600, padding: '20px 48px', borderRadius: 999, background: dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)', border: `2px solid ${dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.2)'}`, opacity: interpolate(t, [2, 2.4], [0, 1], clamp) }}>{url}</div>
      <div style={{ marginTop: 40, fontSize: 36, opacity: interpolate(t, [2.4, 2.9], [0, 0.75], clamp) }}>A new PDF fix every day</div>
    </AbsoluteFill>
  );
};
