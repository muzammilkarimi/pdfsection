// Animated recreations of the real PDF Section UI (homepage, merge, compress, split, success) for the Airy film.
// Every screen renders in its own base coordinate space and is driven by a local time `t` (seconds).
import React from 'react';
import { Easing, interpolate } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily: inter } = loadFont('normal', { weights: ['400', '500', '600', '700'] });

const U = {
  page: '#f6f5fb', panel: '#f1f0f8', line: '#e3e2ee', card: '#ffffff', ink: '#16172b', gray: '#6b6d85', faint: '#9a9cb3',
  brand: '#4E5CD6', brandSoft: '#e9eafb', green: '#22c55e',
};
const CAT = {
  red: ['#ef5b6b', '#fde4e7'], teal: ['#1fa59a', '#d6f1ee'], blue: ['#4f6bdc', '#e2e7fb'],
  pink: ['#d6457f', '#fbe1ec'], green: ['#22a06b', '#ddf3e8'], orange: ['#e98a2b', '#fdeedd'],
};
const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const BACK = Easing.out(Easing.back(1.7));
const ip = (t, a, b, x, y, e = OUT) => interpolate(t, [a, b], [x, y], { ...CL, easing: e });
const kf = (t, ks, e = IO) => interpolate(t, ks.map((k) => k[0]), ks.map((k) => k[1]), { ...CL, easing: e });
const rise = (p, d = 24) => ({ opacity: p, transform: `translateY(${(1 - p) * d}px)` });

// ---------- icons ----------
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  scissors: 'M8.5 8.5L20 19M8.5 15.5L20 5M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  extract: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  compress: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
  wrench: 'M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  image: 'M4 5h16v14H4zM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM20 16l-5-5-8 8',
  rotate: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  x: 'M6 6l12 12M18 6L6 18',
  menu: 'M8 6h12M8 12h12M8 18h12',
  chev: 'M6 9l6 6 6-6',
};
export const Ico = ({ n, size = 20, color = 'currentColor', sw = 1.9, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}><path d={PATHS[n]} /></svg>
);
const Tile = ({ n, cat = 'red', size = 40 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.22, background: CAT[cat][1], display: 'grid', placeItems: 'center', flex: 'none' }}><Ico n={n} size={size * 0.5} color={CAT[cat][0]} /></div>
);
export const Logo = ({ size = 30 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.32 }}>
    <div style={{ width: size, height: size, borderRadius: size * 0.26, background: U.brand, display: 'grid', placeItems: 'center' }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24"><path d="M7 2.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V4a1.5 1.5 0 0 1 1-1.5z" fill="#fff" /><path d="M9 14h6M9 17h6" stroke={U.brand} strokeWidth="1.6" strokeLinecap="round" /></svg>
    </div>
    <div style={{ fontWeight: 700, fontSize: size * 0.68, letterSpacing: '-0.03em', color: U.ink }}>PDF <span style={{ color: U.brand }}>Section</span></div>
  </div>
);
// round "showcase" cursor (as in the Quill reference), drawn inside a screen's coordinate space
export const AppCursor = ({ x, y, press = 0, size = 30, op = 1 }) => (
  <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', background: '#1d1e2c', border: `${Math.max(2, size * 0.08)}px solid rgba(255,255,255,.95)`, boxSizing: 'border-box', boxShadow: '0 6px 14px rgba(10,10,40,.35)', opacity: op, transform: `scale(${1 - press * 0.28})`, zIndex: 50 }} />
);
const Ring = ({ x, y, t, at, size = 70 }) => {
  const p = ip(t, at, at + 0.5, 0, 1);
  if (t < at || p >= 1) return null;
  return <div style={{ position: 'absolute', left: x - size * p / 2, top: y - size * p / 2, width: size * p, height: size * p, borderRadius: '50%', border: `3px solid ${U.brand}`, opacity: 1 - p, zIndex: 49 }} />;
};

const Header = ({ w = 1440 }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: 62, background: '#fff', borderBottom: `1px solid ${U.line}`, display: 'flex', alignItems: 'center', padding: '0 96px', boxSizing: 'border-box', fontFamily: inter }}>
    <Logo size={30} />
    <div style={{ display: 'flex', gap: 28, marginLeft: 'auto', marginRight: 'auto', fontSize: 15, color: '#4a4c63' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Tools <Ico n="chev" size={13} /></span><span>Compress</span><span>Merge</span><span>Blog</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 17, border: `1px solid ${U.line}`, background: U.page, fontSize: 13, color: '#4a4c63' }}><Ico n="search" size={14} /> Search <span style={{ fontSize: 10, border: `1px solid ${U.line}`, borderRadius: 4, padding: '1px 4px', background: '#fff' }}>Ctrl K</span></div>
      <Ico n="moon" size={18} color={U.ink} />
      <div style={{ height: 34, padding: '0 16px', borderRadius: 17, background: U.brand, color: '#fff', fontSize: 14, fontWeight: 600, display: 'grid', placeItems: 'center' }}>Merge PDF</div>
    </div>
  </div>
);

// ---------- page preview (thumbnail) with lines that draw in ----------
const PagePreview = ({ color, title, w, h, t = 9, at = 0 }) => (
  <div style={{ width: w, height: h, background: '#fff', borderRadius: 4, boxShadow: '0 2px 8px rgba(30,30,80,.12)', overflow: 'hidden', position: 'relative' }}>
    <div style={{ height: h * 0.11, background: color, color: '#fff', fontSize: h * 0.045, fontWeight: 700, display: 'flex', alignItems: 'center', padding: `0 ${w * 0.06}px`, justifyContent: 'space-between' }}><span>{title}</span><span style={{ opacity: 0.8, fontWeight: 500 }}>Page 1</span></div>
    {Array.from({ length: 13 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: w * 0.08, top: h * (0.18 + i * 0.058), height: h * 0.018, borderRadius: 2, background: '#dfe0ea', width: `${(i % 4 === 3 ? 58 : 84) * ip(t, at + i * 0.03, at + i * 0.03 + 0.25, 0, 1)}%` }} />
    ))}
  </div>
);
export const FILES = [
  { name: 'Q3-Report.pdf', title: 'Q3 Report', size: 3.5, color: '#4E5CD6' },
  { name: 'Invoice-2041.pdf', title: 'Invoice 2041', size: 2.1, color: '#22a06b' },
  { name: 'Contract.pdf', title: 'Contract', size: 3.0, color: '#e5484d' },
];
export const FileCard = ({ f, n, t, at, w = 232, h = 365, lift = 0, badge = 1 }) => (
  <div style={{ width: w, height: h, background: '#fff', borderRadius: 14, border: `1px solid ${U.line}`, boxShadow: `0 ${4 + lift * 26}px ${10 + lift * 40}px rgba(40,40,110,${0.08 + lift * 0.18})`, position: 'relative', fontFamily: inter, boxSizing: 'border-box', padding: 14 }}>
    <div style={{ height: 230, borderRadius: 10, background: U.panel, border: `1px solid ${U.line}`, display: 'grid', placeItems: 'center' }}><PagePreview color={f.color} title={f.title} w={150} h={200} t={t} at={at + 0.15} /></div>
    <div style={{ position: 'absolute', left: -8, top: -8, width: 30, height: 30, borderRadius: 15, background: U.brand, color: '#fff', fontSize: 15, fontWeight: 700, display: 'grid', placeItems: 'center', transform: `scale(${badge})`, boxShadow: '0 3px 8px rgba(78,92,214,.4)' }}>{n}</div>
    <div style={{ position: 'absolute', right: 20, top: 22, color: U.gray }}><Ico n="menu" size={16} /></div>
    <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700, color: U.ink }}>{f.name}</div>
    <div style={{ fontSize: 12.5, color: U.gray, marginTop: 3 }}>{f.size.toFixed(1)} KB</div>
    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
      {['Up', 'Down'].map((b) => <div key={b} style={{ flex: 1, height: 30, borderRadius: 8, border: `1px solid ${U.line}`, fontSize: 12.5, color: '#4a4c63', display: 'grid', placeItems: 'center' }}>{b}</div>)}
      <div style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${U.line}`, display: 'grid', placeItems: 'center' }}><Ico n="x" size={13} color={U.gray} /></div>
    </div>
  </div>
);

// ---------- MERGE PAGE (1440x900): files drop in, drag-reorder, merge button progress ----------
export const MergeApp = ({ t }) => {
  const SL = [37, 289, 541], Y = 97;
  const app = FILES.map((_, i) => ip(t, 0.2 + i * 0.22, 0.6 + i * 0.22, 0, 1, BACK));
  const count = app.filter((p) => p > 0.5).length;
  const total = FILES.reduce((a, f, i) => a + (app[i] > 0.5 ? f.size : 0), 0);
  // drag Contract (index 2) to the front
  const grab = ip(t, 0.95, 1.05, 0, 1), drop = ip(t, 1.6, 1.72, 0, 1);
  const dragX = kf(t, [[1.05, SL[2]], [1.6, SL[0]]]);
  const shift = ip(t, 1.25, 1.6, 0, 1, IO);
  const order = drop >= 1 ? [2, 0, 1] : [0, 1, 2];
  const xs = [SL[0] + (SL[1] - SL[0]) * shift, SL[1] + (SL[2] - SL[1]) * shift, t < 1.05 ? SL[2] : dragX];
  const lift = grab * (1 - drop);
  // cursor path: in -> grab card 3 -> drag -> merge button -> press
  const cx = kf(t, [[0.6, 1500], [0.95, SL[2] + 116], [1.05, SL[2] + 116], [1.6, SL[0] + 116], [1.75, SL[0] + 116], [2.05, 1240]]);
  const cy = kf(t, [[0.6, 760], [0.95, 270], [1.6, 270], [1.75, 270], [2.05, 595]]);
  const press = ip(t, 2.1, 2.18, 0, 1) * ip(t, 2.22, 2.3, 1, 0);
  const prog = ip(t, 2.25, 3.0, 0, 1, Easing.inOut(Easing.quad));
  const done = t >= 3.02;
  const empty = 1 - ip(t, 0.15, 0.35, 0, 1);
  return (
    <div style={{ position: 'absolute', inset: 0, background: U.page, fontFamily: inter, overflow: 'hidden' }}>
      <Header />
      <div style={{ position: 'absolute', left: 21, top: 80, width: 1023, height: 400, borderRadius: 14, background: U.panel, border: `1px solid ${U.line}` }} />
      {empty > 0 && (
        <div style={{ position: 'absolute', left: 37, top: 96, width: 991, height: 368, borderRadius: 12, border: `2px dashed #c9cbe6`, display: 'grid', placeItems: 'center', opacity: empty, color: U.gray, fontSize: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}><Ico n="upload" size={36} color={U.brand} />Drop PDFs here</div>
        </div>
      )}
      {FILES.map((f, i) => {
        const n = order.indexOf(i) + 1;
        const badge = drop > 0 && drop < 1 ? 1 + Math.sin(drop * Math.PI) * 0.35 : 1;
        return (
          <div key={i} style={{ position: 'absolute', left: xs[i], top: Y - lift * (i === 2 ? 14 : 0), transform: `scale(${(0.85 + 0.15 * app[i]) * (i === 2 ? 1 + lift * 0.05 : 1)}) rotate(${i === 2 ? lift * 2.5 : 0}deg)`, opacity: Math.min(1, app[i] * 1.5), zIndex: i === 2 ? 5 : 1 }}>
            <FileCard f={f} n={n} t={t} at={0.2 + i * 0.22} lift={i === 2 ? lift : 0} badge={badge * ip(t, 0.35 + i * 0.22, 0.6 + i * 0.22, 0, 1, BACK)} />
          </div>
        );
      })}
      {/* right panel */}
      <div style={{ position: 'absolute', left: 1060, top: 80, width: 359, height: 590, borderRadius: 14, background: '#fff', border: `1px solid ${U.line}`, padding: 18, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}><Tile n="plus" cat="red" size={44} />
          <div><div style={{ fontSize: 24, fontWeight: 600, color: U.ink, letterSpacing: '-0.02em' }}>Merge PDF</div><div style={{ fontSize: 13.5, color: U.gray, marginTop: 4, lineHeight: 1.35 }}>Drag first-page previews into the final merged order.</div></div>
        </div>
        <div style={{ marginTop: 22, height: 54, borderRadius: 10, border: `1px solid ${U.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontSize: 14, color: U.ink }}>
          Files selected <span key={count} style={{ fontSize: 24, fontWeight: 700, transform: `scale(${count ? 1 + 0.25 * Math.max(0, 1 - ((t - 0.4 - (count - 1) * 0.22) * 5)) : 1})`, display: 'inline-block' }}>{count}</span>
        </div>
        {[['Total size', `${total.toFixed(1)} KB`], ['Output', 'merged.pdf'], ['Limit', `${count} / 20`]].map(([a, b]) => (
          <div key={a} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: U.gray, marginTop: 14 }}><span>{a}</span><span style={{ color: U.ink, fontWeight: 600 }}>{b}</span></div>
        ))}
        <div style={{ marginTop: 20, height: 46, borderRadius: 10, border: `1.5px dashed #c9cbe6`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13.5, color: U.ink }}><Ico n="upload" size={15} /> Add more PDFs</div>
        <div style={{ marginTop: 14, borderRadius: 10, background: U.brandSoft, padding: '12px 14px', fontSize: 12.5, color: '#4a4c7a', lineHeight: 1.4 }}>The first preview becomes the first file in the merged PDF. Drag cards to reorder.</div>
        <div style={{ position: 'absolute', left: 18, right: 18, top: 492, height: 48, borderRadius: 24, background: done ? U.green : U.brand, overflow: 'hidden', transform: `scale(${1 - press * 0.05})`, boxShadow: '0 8px 20px rgba(78,92,214,.35)' }}>
          {prog > 0 && !done && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: 'linear-gradient(90deg,#6c79f0,#8d99ff)' }} />}
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', fontSize: 15, fontWeight: 600 }}>
            {done ? <><Ico n="check" size={18} sw={2.6} /> Merged</> : prog > 0 ? `Merging… ${Math.round(prog * 100)}%` : <>Merge PDFs <Ico n="plus" size={16} /></>}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 18, right: 18, top: 548, height: 34, borderRadius: 17, border: `1px solid ${U.line}`, display: 'grid', placeItems: 'center', fontSize: 13.5, color: U.ink }}>Start over</div>
      </div>
      {t > 0.6 && <AppCursor x={cx} y={cy} press={Math.max(press, grab * (1 - drop) * 0.6)} />}
      <Ring x={1240} y={595} t={t} at={2.15} />
    </div>
  );
};

// ---------- HOMEPAGE (1440x900): hero, categories, tool cards stagger in, hover + click Merge ----------
const CATS = [['All PDF tools', '34 tools', 'grid', 'blue'], ['Organize PDF', '6 tools', 'plus', 'red'], ['Optimize PDF', '3 tools', 'compress', 'teal'], ['Convert to PDF', '5 tools', 'image', 'blue'], ['Convert from PDF', '5 tools', 'image', 'pink'], ['Edit PDF', '7 tools', 'rotate', 'green']];
const TOOLS = [['Merge PDF', 'Combine multiple PDFs into a single document', 'plus', 'red'], ['Split PDF', 'Separate PDF pages into individual files', 'scissors', 'red'], ['Remove Pages', 'Delete unwanted pages from your PDF', 'trash', 'red'], ['Extract Pages', 'Extract specific pages from a PDF', 'extract', 'red'], ['Organize PDF', 'Sort and rearrange PDF pages with drag & drop', 'grid', 'red'], ['Scan to PDF', 'Convert camera scans or images to PDF', 'camera', 'red']];
export const HomeApp = ({ t, hoverAt = 99, clickAt = 99, cursor, query = '', typing = false, drop = 0, pick = 0 }) => {
  const hov = ip(t, hoverAt, hoverAt + 0.25, 0, 1);
  const press = ip(t, clickAt, clickAt + 0.08, 0, 1) * ip(t, clickAt + 0.12, clickAt + 0.22, 1, 0);
  const n = Math.round(ip(t, 0.3, 1.1, 0, 34, Easing.out(Easing.cubic)));
  return (
    <div style={{ position: 'absolute', inset: 0, background: U.page, fontFamily: inter, overflow: 'hidden' }}>
      <Header />
      <div style={{ position: 'absolute', left: 100, top: 88, width: 1240, height: 250, borderRadius: 18, background: '#efeef8', border: `1px solid ${U.line}`, ...rise(ip(t, 0, 0.4, 0, 1)) }}>
        <div style={{ position: 'absolute', left: 24, top: 24, height: 26, padding: '0 12px', borderRadius: 13, background: U.brand, color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 0.6, display: 'flex', alignItems: 'center', gap: 6 }}><Ico n="lock" size={13} /> PRIVATE BROWSER PDF TOOLS</div>
        <div style={{ position: 'absolute', left: 22, top: 58, fontSize: 62, fontWeight: 700, letterSpacing: '-0.04em', color: U.ink }}>PDF Section</div>
        <div style={{ position: 'absolute', left: 24, top: 140, fontSize: 26, fontWeight: 500, color: U.ink, letterSpacing: '-0.02em' }}>Free Online PDF Tools</div>
        <div style={{ position: 'absolute', left: 24, top: 178, width: 680, fontSize: 17, lineHeight: 1.45, color: U.gray }}>Merge, split, compress, convert, edit, and secure PDF files <b style={{ color: U.brand }}>without uploading them to a server</b></div>
        <div style={{ position: 'absolute', left: 746, top: 152, fontSize: 14, fontWeight: 700, color: U.ink }}>Find a PDF tool</div>
        <div style={{ position: 'absolute', left: 746, top: 178, width: 468, height: 46, borderRadius: 11, background: '#fff', border: `1.5px solid ${query || typing ? U.brand : '#d9d8e8'}`, boxShadow: query || typing ? '0 0 0 4px rgba(78,92,214,.14)' : 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', boxSizing: 'border-box', fontSize: 15, color: query ? U.ink : U.faint }}>
          <Ico n="search" size={17} color={U.brand} />{query || 'Search merge, split, compress, edit…'}
          {typing && <span style={{ width: 2, height: 20, background: U.brand, marginLeft: -8, opacity: Math.floor(t * 3) % 2 || query ? 1 : 0 }} />}
          <span style={{ marginLeft: 'auto', fontSize: 11, border: `1px solid ${U.line}`, borderRadius: 5, padding: '2px 6px', color: U.gray }}>Ctrl K</span>
        </div>
      </div>
      {drop > 0 && (
        <div style={{ position: 'absolute', left: 846, top: 322, width: 468, borderRadius: 14, background: '#fff', border: `1px solid ${U.line}`, boxShadow: '0 24px 50px rgba(40,40,110,.18)', padding: 8, boxSizing: 'border-box', opacity: drop, transform: `translateY(${(1 - drop) * -10}px)`, zIndex: 20 }}>
          {[['Merge PDF', 'Combine multiple PDFs into a single document', 'plus', 'red'], ['Organize PDF', 'Sort and rearrange PDF pages with drag & drop', 'grid', 'red']].map(([a, b, ic, cat], i) => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: i === 0 ? `rgba(78,92,214,${0.1 + pick * 0.08})` : 'transparent', transform: i === 0 ? `scale(${1 - pick * 0.02})` : undefined }}>
              <Tile n={ic} cat={cat} size={36} />
              <div><div style={{ fontSize: 15, fontWeight: 600, color: i === 0 ? U.brand : U.ink }}>{a}</div><div style={{ fontSize: 12.5, color: U.gray }}>{b}</div></div>
              {i === 0 && <span style={{ marginLeft: 'auto', fontSize: 12, color: U.gray }}>↵</span>}
            </div>
          ))}
        </div>
      )}
      <div style={{ position: 'absolute', left: 100, top: 358, width: 270, height: 560, borderRadius: 16, background: '#f3f2fa', border: `1px solid ${U.line}`, padding: 12, boxSizing: 'border-box' }}>
        {CATS.map(([a, b, ic, cat], i) => (
          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 62, padding: '0 12px', borderRadius: 30, marginBottom: 6, background: i === 0 ? '#e9e9f8' : 'transparent', border: i === 0 ? `1.5px solid ${U.brand}` : '1.5px solid transparent', ...rise(ip(t, 0.15 + i * 0.06, 0.5 + i * 0.06, 0, 1), 14) }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: '#fff', border: `1px solid ${U.line}`, display: 'grid', placeItems: 'center' }}><Ico n={ic} size={18} color={CAT[cat][0]} /></div>
            <div><div style={{ fontSize: 15.5, fontWeight: 600, color: i === 0 ? U.brand : U.ink }}>{a}</div><div style={{ fontSize: 12.5, color: U.gray }}>{i === 0 ? `${n} tools` : b}</div></div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 390, top: 358, width: 950, height: 560, borderRadius: 16, background: '#f3f2fa', border: `1px solid ${U.line}` }}>
        <div style={{ position: 'absolute', left: 21, top: 30, fontSize: 13, fontWeight: 700, color: U.brand, letterSpacing: 0.8 }}>ALL PDF TOOLS</div>
        <div style={{ position: 'absolute', left: 21, top: 52, fontSize: 26, fontWeight: 600, color: U.ink, letterSpacing: '-0.02em' }}>{n} tools ready to use</div>
        {TOOLS.map(([a, b, ic, cat], i) => {
          const p = ip(t, 0.25 + i * 0.08, 0.65 + i * 0.08, 0, 1, BACK);
          const h = i === 0 ? hov : 0;
          return (
            <div key={a} style={{ position: 'absolute', left: 21 + (i % 3) * 308, top: 100 + Math.floor(i / 3) * 180, width: 291, height: 163, borderRadius: 14, background: '#fff', border: `1.5px solid ${h ? `rgba(78,92,214,${h})` : U.line}`, boxShadow: `0 ${4 + h * 18}px ${12 + h * 30}px rgba(60,60,140,${0.06 + h * 0.16})`, padding: 21, boxSizing: 'border-box', opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 30 - h * 8}px) scale(${(0.92 + 0.08 * p) * (i === 0 ? 1 - press * 0.03 : 1)})` }}>
              <div style={{ transform: `scale(${1 + h * 0.12})`, transformOrigin: '0 0', width: 40 }}><Tile n={ic} cat={cat} size={40} /></div>
              <div style={{ fontSize: 18, fontWeight: 600, color: h ? U.brand : U.ink, marginTop: 18, letterSpacing: '-0.01em' }}>{a}</div>
              <div style={{ fontSize: 13.5, color: U.gray, marginTop: 8, lineHeight: 1.4 }}>{b}</div>
            </div>
          );
        })}
      </div>
      {cursor && <AppCursor {...cursor} size={30} />}
      {cursor && <Ring x={cursor.x} y={cursor.y} t={t} at={clickAt} />}
    </div>
  );
};
export const HOME_MERGE_CARD = { x: 390 + 21 + 145, y: 358 + 100 + 82 }; // centre of the Merge card in HomeApp space

// ---------- SUCCESS CARD (1020 wide, content centred vertically): check draws, rise, button shimmer, click ----------
export const SuccessCard = ({ t, title = 'Merge PDF successful!', file = 'merged.pdf', detail, pressAt = 99, sizeText, badge }) => {
  const c = ip(t, 0, 0.4, 0, 1, BACK);
  const draw = ip(t, 0.15, 0.5, 0, 1);
  const sh = ip(t, 0.85, 1.5, -0.3, 1.3, Easing.inOut(Easing.quad));
  const press = ip(t, pressAt, pressAt + 0.08, 0, 1) * ip(t, pressAt + 0.12, pressAt + 0.22, 1, 0);
  const dl = t > pressAt + 0.1;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', fontFamily: inter, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
      <div style={{ width: 120, height: 120, borderRadius: 60, background: U.green, display: 'grid', placeItems: 'center', transform: `scale(${c})`, boxShadow: `0 0 0 ${18 * c}px rgba(34,197,94,.12), 0 16px 40px rgba(34,197,94,.35)` }}>
        <svg width="70" height="70" viewBox="0 0 24 24"><path d={PATHS.check} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - draw)} /></svg>
      </div>
      <div style={{ marginTop: 40, fontSize: 52, fontWeight: 700, letterSpacing: '-0.03em', color: U.ink, textAlign: 'center', lineHeight: 1.1, maxWidth: 900, ...rise(ip(t, 0.2, 0.55, 0, 1)) }}>{title}</div>
      <div style={{ marginTop: 18, fontSize: 23, color: U.gray, textAlign: 'center', maxWidth: 880, lineHeight: 1.4, ...rise(ip(t, 0.3, 0.65, 0, 1)) }}>
        <b style={{ color: U.ink }}>{file}</b> is ready · {sizeText || detail}
        {badge && <span style={{ display: 'inline-block', marginLeft: 10, padding: '2px 12px', borderRadius: 14, background: '#dcfce7', color: '#15803d', fontWeight: 700, transform: `scale(${ip(t, badge.at, badge.at + 0.35, 0, 1, BACK)})` }}>{badge.text}</span>}
      </div>
      <div style={{ marginTop: 36, width: 440, height: 70, borderRadius: 35, background: U.brand, color: '#fff', fontSize: 25, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 8px rgba(78,92,214,.12), 0 14px 30px rgba(78,92,214,.35)', transform: `scale(${(1 - press * 0.05)})`, ...rise(ip(t, 0.4, 0.75, 0, 1)) }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 120, left: `${sh * 100}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))', transform: 'skewX(-20deg)' }} />
        <Ico n={dl ? 'check' : 'download'} size={26} sw={2.4} style={{ transform: `translateY(${dl ? 0 : Math.max(0, Math.sin((t - 1.5) * 6)) * -4}px)` }} /> {dl ? 'Downloaded' : 'Download file'}
      </div>
      <div style={{ marginTop: 26, fontSize: 19, color: U.brand, ...rise(ip(t, 0.5, 0.85, 0, 1)) }}>Start over with {title.split(' successful')[0]}</div>
    </div>
  );
};

// ---------- COMPRESS CARD (1080x900): compressing progress -> success with size counter ----------
export const CompressCard = ({ t }) => {
  const prog = ip(t, 0.15, 1.0, 0, 1, Easing.inOut(Easing.quad));
  const kb = ip(t, 1.15, 1.75, 19763, 815.9, Easing.out(Easing.cubic));
  const sizeText = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
  if (t < 1.05) {
    const o = 1 - ip(t, 0.95, 1.05, 0, 1);
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#fff', fontFamily: inter, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 110px', boxSizing: 'border-box', opacity: o }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: 24, borderRadius: 18, border: `1px solid ${U.line}` }}>
          <Tile n="compress" cat="teal" size={78} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 32, fontWeight: 700, color: U.ink }}>Big-Scan.pdf</div><div style={{ fontSize: 22, color: U.gray, marginTop: 4 }}>19.3 MB · 8 pages</div></div>
          <div style={{ fontSize: 20, fontWeight: 600, color: U.brand, padding: '8px 16px', borderRadius: 20, background: U.brandSoft }}>Maximum</div>
        </div>
        <div style={{ marginTop: 50, display: 'flex', justifyContent: 'space-between', fontSize: 28, color: U.gray }}><span>Compressing…</span><b style={{ color: U.brand }}>{Math.round(prog * 100)}%</b></div>
        <div style={{ marginTop: 16, height: 26, borderRadius: 13, background: U.brandSoft, overflow: 'hidden' }}><div style={{ width: `${prog * 100}%`, height: '100%', borderRadius: 13, background: 'linear-gradient(90deg,#8d99ff,#4E5CD6)' }} /></div>
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080 / 1.14, height: 900 / 1.14, transform: 'scale(1.14)', transformOrigin: '0 0' }}>
      <SuccessCard t={t - 1.05} title="Compress PDF successful!" file="Big-Scan-compressed.pdf" sizeText={`${sizeText} (was 19.3 MB)`} badge={{ text: '−96%', at: 0.7 }} />
    </div>
  );
};

// ---------- SPLIT PAGE (1440x900): pages pop in, button press, pages separate into files ----------
export const SplitApp = ({ t, pressAt = 1.0 }) => {
  const sep = ip(t, pressAt + 0.15, pressAt + 0.7, 0, 1, IO);
  const press = ip(t, pressAt, pressAt + 0.08, 0, 1) * ip(t, pressAt + 0.12, pressAt + 0.2, 1, 0);
  return (
    <div style={{ position: 'absolute', inset: 0, background: U.page, fontFamily: inter, overflow: 'hidden' }}>
      <Header />
      <div style={{ position: 'absolute', left: 21, top: 80, width: 1000, height: 330, borderRadius: 14, background: U.panel, border: `1px solid ${U.line}` }} />
      {Array.from({ length: 6 }, (_, i) => {
        const p = ip(t, 0.1 + i * 0.08, 0.45 + i * 0.08, 0, 1, BACK);
        const x = 38 + i * 164 + (i - 2.5) * sep * 10;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: 98 - sep * (i % 2 ? 8 : -8), width: 150, height: 230, borderRadius: 12, background: '#fff', border: `1.5px solid ${sep > 0.5 ? U.brand : U.line}`, padding: 10, boxSizing: 'border-box', opacity: Math.min(1, p * 1.4), transform: `scale(${0.85 + 0.15 * p}) rotate(${sep * (i - 2.5) * 1.5}deg)`, boxShadow: `0 ${4 + sep * 12}px ${10 + sep * 20}px rgba(60,60,140,${0.06 + sep * 0.12})` }}>
            <PagePreview color={U.brand} title="Q3 Report" w={128} h={168} t={t} at={0.15 + i * 0.08} />
            <div style={{ textAlign: 'center', fontSize: 13, color: sep > 0.5 ? U.brand : U.gray, marginTop: 10, fontWeight: sep > 0.5 ? 600 : 400 }}>{sep > 0.5 ? `page-${i + 1}.pdf` : `Page ${i + 1}`}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 1040, top: 80, width: 379, height: 640, borderRadius: 14, background: '#fff', border: `1px solid ${U.line}`, padding: 18, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 14 }}><Tile n="scissors" cat="red" size={44} /><div><div style={{ fontSize: 24, fontWeight: 600, color: U.ink }}>Split PDF</div><div style={{ fontSize: 13.5, color: U.gray, marginTop: 4 }}>Choose how pages should be separated into new PDFs.</div></div></div>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, border: `1px solid ${U.line}` }}><Tile n="doc" cat="blue" size={36} /><div><div style={{ fontSize: 14, fontWeight: 600 }}>Q3-Report.pdf</div><div style={{ fontSize: 12, color: U.gray }}>6 pages</div></div></div>
        {[['All pages', 'Every page becomes a PDF', true], ['Ranges', 'Use 1-3, 5, 7-10'], ['Every N', 'Split into page groups']].map(([a, b, on]) => (
          <div key={a} style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${on ? U.brand : U.line}`, background: on ? U.brandSoft : '#fff' }}><div style={{ fontSize: 14, fontWeight: 600 }}>{a}</div><div style={{ fontSize: 12, color: U.gray }}>{b}</div></div>
        ))}
        <div style={{ marginTop: 14, fontSize: 13, color: '#4a4c7a', display: 'flex', gap: 6, alignItems: 'center' }}><Ico n="check" size={14} color={U.brand} /> 6 separate PDF files will be created.</div>
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 22, height: 50, borderRadius: 25, background: sep > 0.9 ? U.green : U.brand, color: '#fff', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transform: `scale(${1 - press * 0.05})` }}>{sep > 0.9 ? <><Ico n="check" size={18} sw={2.6} /> 6 files ready</> : <>Split PDF <Ico n="scissors" size={16} /></>}</div>
      </div>
    </div>
  );
};

// success screen inside the full app chrome (1440x900)
export const SuccessPage = ({ t, pressAt }) => (
  <div style={{ position: 'absolute', inset: 0, background: U.page, overflow: 'hidden' }}>
    <Header />
    <div style={{ position: 'absolute', left: 720 - 510 * 0.9, top: 95, width: 1020, height: 770, transform: 'scale(0.9)', transformOrigin: '0 0', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(60,60,140,.1)' }}>
      <SuccessCard t={t} pressAt={pressAt} detail="7.3 KB · 3 files merged" />
    </div>
  </div>
);

// ---------- COMPRESS PAGE (1440x900): pick a level, compress, live size result ----------
const LEVELS = [['Recommended', 'Good quality, smaller size'], ['Strong', 'Smaller file, good quality'], ['Maximum Compression', 'Smallest possible file size']];
export const COMPRESS_PTS = { max: { x: 1229, y: 475 }, btn: { x: 1229, y: 673 }, result: { x: 1229, y: 440 } };
export const CompressApp = ({ t, selAt = 0.8, pressAt = 1.3, resAt = 2.15, cursor }) => {
  const sel = t >= selAt ? 2 : 0;
  const pop = ip(t, selAt, selAt + 0.3, 0, 1, BACK);
  const press = ip(t, pressAt, pressAt + 0.08, 0, 1) * ip(t, pressAt + 0.12, pressAt + 0.22, 1, 0);
  const prog = ip(t, pressAt + 0.05, resAt - 0.05, 0, 1, Easing.inOut(Easing.quad));
  const res = ip(t, resAt, resAt + 0.35, 0, 1);
  const kb = ip(t, resAt + 0.1, resAt + 0.7, 19763, 815.9, Easing.out(Easing.cubic));
  const size = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
  const sh = ip(t, resAt + 0.8, resAt + 1.4, -0.3, 1.3, Easing.inOut(Easing.quad));
  return (
    <div style={{ position: 'absolute', inset: 0, background: U.page, fontFamily: inter, overflow: 'hidden' }}>
      <Header />
      <div style={{ position: 'absolute', left: 21, top: 80, width: 1000, height: 640, borderRadius: 14, background: U.panel, border: `1px solid ${U.line}` }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ position: 'absolute', left: 250 + i * 270, top: 70, transform: `rotate(${i ? 3 : -3}deg) scale(${1 - res * 0.04})` }}>
            <div style={{ width: 230, height: 300, background: '#fbfaf6', borderRadius: 6, boxShadow: '0 10px 30px rgba(40,40,110,.15)', overflow: 'hidden', position: 'relative' }}>
              {Array.from({ length: 16 }, (_, k) => <div key={k} style={{ position: 'absolute', left: 22, top: 30 + k * 16, height: 6, borderRadius: 3, width: `${k % 5 === 4 ? 50 : 80}%`, background: '#cfcfd8' }} />)}
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.025) 0 2px, transparent 2px 4px)' }} />
            </div>
          </div>
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontSize: 20, fontWeight: 700, color: U.ink }}>Big-Scan.pdf</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 452, textAlign: 'center', fontSize: 15, color: U.gray }}>8 pages · <b style={{ color: res > 0.5 ? '#15803d' : U.ink }}>{res > 0 ? size : '19.3 MB'}</b></div>
      </div>
      <div style={{ position: 'absolute', left: 1040, top: 80, width: 379, height: 640, borderRadius: 14, background: '#fff', border: `1px solid ${U.line}`, padding: 18, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 14 }}><Tile n="compress" cat="teal" size={44} /><div><div style={{ fontSize: 24, fontWeight: 600, color: U.ink }}>Compress PDF</div><div style={{ fontSize: 13.5, color: U.gray, marginTop: 4 }}>Reduce file size while keeping quality</div></div></div>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, border: `1px solid ${U.line}` }}><Tile n="doc" cat="blue" size={36} /><div><div style={{ fontSize: 14, fontWeight: 600 }}>Big-Scan.pdf</div><div style={{ fontSize: 12, color: U.gray }}>19.3 MB · 8 pages</div></div></div>
        <div style={{ position: 'absolute', left: 18, right: 18, top: 192, opacity: 1 - res }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: U.ink, marginBottom: 12 }}>Compression level</div>
          {LEVELS.map(([a, b], i) => {
            const on = i === sel;
            return (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 62, padding: '0 14px', marginBottom: 10, borderRadius: 12, border: `1.5px solid ${on ? U.brand : U.line}`, background: on ? U.brandSoft : '#fff', boxSizing: 'border-box', transform: on && i === 2 ? `scale(${1 + Math.sin(pop * Math.PI) * 0.03})` : undefined }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${on ? U.brand : '#c4c5d6'}`, display: 'grid', placeItems: 'center' }}><div style={{ width: 10, height: 10, borderRadius: 5, background: U.brand, transform: `scale(${on ? (i === 2 ? pop : 1) : 0})` }} /></div>
                <div><div style={{ fontSize: 14.5, fontWeight: 600, color: on ? U.brand : U.ink }}>{a}</div><div style={{ fontSize: 12, color: U.gray }}>{b}</div></div>
              </div>
            );
          })}
        </div>
        {res > 0 && (
          <div style={{ position: 'absolute', left: 18, right: 18, top: 200, opacity: res, transform: `translateY(${(1 - res) * 16}px)`, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: U.green, margin: '0 auto', display: 'grid', placeItems: 'center', transform: `scale(${ip(t, resAt, resAt + 0.4, 0, 1, BACK)})`, boxShadow: '0 0 0 10px rgba(34,197,94,.12)' }}><Ico n="check" size={34} color="#fff" sw={3} /></div>
            <div style={{ marginTop: 18, fontSize: 15, color: U.gray }}>Compression complete</div>
            <div style={{ marginTop: 10, fontSize: 18, color: U.faint, textDecoration: 'line-through' }}>19.3 MB</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: U.ink, letterSpacing: '-0.03em' }}>{size}</div>
            <div style={{ display: 'inline-block', marginTop: 8, padding: '4px 14px', borderRadius: 14, background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 16, transform: `scale(${ip(t, resAt + 0.6, resAt + 0.9, 0, 1, BACK)})` }}>96% smaller</div>
          </div>
        )}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 22, height: 50, borderRadius: 25, background: U.brand, color: '#fff', overflow: 'hidden', transform: `scale(${1 - press * 0.05})`, boxShadow: '0 8px 20px rgba(78,92,214,.35)' }}>
          {prog > 0 && res === 0 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: 'linear-gradient(90deg,#6c79f0,#8d99ff)' }} />}
          {res > 0 && <div style={{ position: 'absolute', top: 0, bottom: 0, width: 90, left: `${sh * 100}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))', transform: 'skewX(-20deg)' }} />}
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            {res > 0 ? <><Ico n="download" size={18} sw={2.4} /> Download file</> : prog > 0 ? `Compressing… ${Math.round(prog * 100)}%` : <>Compress PDF <Ico n="compress" size={16} /></>}
          </div>
        </div>
      </div>
      {cursor && <AppCursor {...cursor} />}
      {cursor && <Ring x={COMPRESS_PTS.max.x} y={COMPRESS_PTS.max.y} t={t} at={selAt} />}
      {cursor && <Ring x={COMPRESS_PTS.btn.x} y={COMPRESS_PTS.btn.y} t={t} at={pressAt} />}
    </div>
  );
};

// ---------- MOBILE HOMEPAGE (390x844): hero, popular tools pop in, tap Compress, list slides up while scrolling ----------
const POP = [['Merge PDF', 'plus', 'red'], ['Split PDF', 'scissors', 'red'], ['Compress PDF', 'compress', 'teal'], ['OCR PDF', 'search', 'teal']];
const ORG = [['Merge PDF', 'Combine multiple PDFs into a single document', 'plus'], ['Split PDF', 'Separate PDF pages into individual files', 'scissors'], ['Remove Pages', 'Delete unwanted pages from your PDF', 'trash'], ['Extract Pages', 'Extract specific pages from a PDF', 'extract'], ['Organize PDF', 'Sort and rearrange PDF pages', 'grid']];
export const MobileApp = ({ t, tapAt = 1.5, scrollAt = 2.0 }) => {
  const tap = ip(t, tapAt, tapAt + 0.08, 0, 1) * ip(t, tapAt + 0.14, tapAt + 0.26, 1, 0);
  const sc = ip(t, scrollAt, scrollAt + 0.9, 0, 360, IO);
  return (
    <div style={{ position: 'absolute', inset: 0, background: U.page, fontFamily: inter, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-sc}px)` }}>
        <div style={{ position: 'absolute', left: 12, top: 76, width: 366, height: 262, borderRadius: 16, background: '#efeef8', border: `1px solid ${U.line}`, textAlign: 'center', ...rise(ip(t, 0, 0.4, 0, 1)) }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 14, height: 24, padding: '0 11px', borderRadius: 12, background: U.brand, color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5 }}><Ico n="lock" size={11} /> PRIVATE BROWSER PDF TOOLS</div>
          <div style={{ marginTop: 10, fontSize: 31, fontWeight: 700, letterSpacing: '-0.04em', color: U.ink }}>PDF Section</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: U.ink }}>Free Online PDF Tools</div>
          <div style={{ margin: '8px 18px 0', fontSize: 12.5, lineHeight: 1.45, color: U.gray }}>Merge, split, compress, convert, edit, and secure PDF files <b style={{ color: U.brand }}>without uploading them to a server</b></div>
          <div style={{ margin: '14px 16px 0', height: 40, borderRadius: 10, background: '#fff', border: '1px solid #d9d8e8', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', fontSize: 13, color: U.faint }}><Ico n="search" size={15} color={U.gray} /> Search merge, split, compress…</div>
        </div>
        <div style={{ position: 'absolute', left: 14, top: 360, fontSize: 12.5, fontWeight: 600, letterSpacing: 1, color: U.gray, opacity: ip(t, 0.3, 0.6, 0, 1) }}>POPULAR TOOLS</div>
        {POP.map(([a, ic, cat], i) => {
          const p = ip(t, 0.4 + i * 0.1, 0.8 + i * 0.1, 0, 1, BACK);
          const on = i === 2 && t >= tapAt;
          return (
            <div key={a} style={{ position: 'absolute', left: 12 + (i % 2) * 187, top: 388 + Math.floor(i / 2) * 82, width: 179, height: 72, borderRadius: 14, background: on ? U.brandSoft : '#fff', border: `1.5px solid ${on ? U.brand : U.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', boxSizing: 'border-box', opacity: Math.min(1, p * 1.4), transform: `scale(${(0.85 + 0.15 * p) * (i === 2 ? 1 - tap * 0.06 : 1)})` }}>
              <Tile n={ic} cat={cat} size={36} /><div style={{ fontSize: 14, fontWeight: 600, color: on ? U.brand : U.ink, lineHeight: 1.2 }}>{a}</div>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 12, top: 568, width: 366, height: 470, borderRadius: 16, background: '#fff', border: `1px solid ${U.line}`, padding: '16px 14px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: '#e5484d' }}><div style={{ width: 3, height: 20, borderRadius: 2, background: '#e5484d' }} /> Organize PDF<span style={{ marginLeft: 'auto', fontSize: 11, color: U.gray, background: U.panel, borderRadius: 10, padding: '3px 9px' }}>6 Tools</span></div>
          {ORG.map(([a, b, ic], i) => {
            const p = ip(t, scrollAt + 0.2 + i * 0.09, scrollAt + 0.6 + i * 0.09, 0, 1);
            return (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', borderBottom: i < ORG.length - 1 ? `1px solid ${U.line}` : 'none', opacity: 0.25 + 0.75 * p, transform: `translateX(${(1 - p) * 24}px)` }}>
                <Tile n={ic} cat="red" size={34} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: U.ink }}>{a}</div><div style={{ fontSize: 11.5, color: U.gray }}>{b}</div></div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 60, background: '#fff', borderBottom: `1px solid ${U.line}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12 }}>
        <Logo size={28} />
        <div style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, background: U.panel, display: 'grid', placeItems: 'center' }}><Ico n="search" size={16} color={U.ink} /></div>
        <Ico n="moon" size={18} color={U.ink} /><Ico n="menu" size={20} color={U.ink} />
      </div>
      <Ring x={12 + 89} y={388 + 82 + 36 - sc} t={t} at={tapAt} size={60} />
    </div>
  );
};
