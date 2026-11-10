import React from 'react';
import { registerRoot, Still, AbsoluteFill } from 'remotion';
import { C, Cam, Grad, Icon, Pill, DarkBg, fontFamily } from './lib.jsx';

const KEYS = [{ t: 0, x: 470, y: 50, w: 660 }];
const MARK = [{ x: 596, y: 217, w: 408, h: 80, t0: -1, t1: 99 }];
const SRC = { src: 'compress', startSec: 1, keys: KEYS, marks: MARK };

const Logo = ({ dark = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily, fontWeight: 600, fontSize: 40, color: dark ? '#fff' : '#1c1c1e' }}>
    <div style={{ width: 54, height: 54, borderRadius: 16, background: C.violet, display: 'grid', placeItems: 'center' }}><Icon name="file" size={30} /></div>
    PDF <span style={{ color: dark ? C.glow : C.violet }}>Section</span>
  </div>
);

const Caption = ({ words, hi, size = 76, color = '#fff', hiColor = C.glow, shadow }) => (
  <div style={{ fontFamily, fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: -2, textAlign: 'center', color, textShadow: shadow }}>
    {words.map((w, i) => <span key={i} style={{ color: i === hi ? hiColor : color }}>{w} </span>)}
  </div>
);

// ---------- A: Dark Glow ----------
const A = () => (
  <DarkBg>
    <div style={{ position: 'absolute', top: 90, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}><Logo /></div>
    <div style={{ position: 'absolute', top: 230, left: 60, right: 60, textAlign: 'center', fontFamily, fontWeight: 800, fontSize: 112, letterSpacing: -4, lineHeight: 1.02, color: '#fff' }}>
      PDF too big<br />to <Grad>email?</Grad>
    </div>
    <div style={{ position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center', perspective: 2400 }}>
      <div style={{ padding: 12, borderRadius: 44, background: 'rgba(255,255,255,.14)', border: '1.5px solid rgba(255,255,255,.35)', boxShadow: '0 60px 140px rgba(40,20,140,.6), 0 0 120px rgba(138,150,245,.35)', transform: 'rotateX(6deg) rotateZ(-1.5deg)' }}>
        <Cam {...SRC} fw={900} fh={760} radius={34} />
      </div>
    </div>
    <div style={{ position: 'absolute', top: 590, right: 70 }}><Pill size={40}>Step 1 · Open the tool</Pill></div>
    <div style={{ position: 'absolute', bottom: 250, left: 60, right: 60 }}>
      <Caption words={['Drop', 'your', 'file', 'in']} hi={2} />
    </div>
    <div style={{ position: 'absolute', bottom: 120, left: 120, right: 120, height: 10, borderRadius: 9, background: 'rgba(255,255,255,.15)' }}>
      <div style={{ width: '34%', height: '100%', borderRadius: 9, background: 'linear-gradient(90deg,#8A96F5,#C9CFFF)' }} />
    </div>
  </DarkBg>
);

// ---------- B: Soft Pastel Studio ----------
const blob = (c, s, l, t) => ({ position: 'absolute', width: s, height: s, left: l, top: t, borderRadius: '50%', background: c, filter: 'blur(70px)', opacity: 0.85 });
const B = () => (
  <AbsoluteFill style={{ background: '#fff9ee', fontFamily, overflow: 'hidden' }}>
    <div style={blob('#ffd8f4', 760, -220, -120)} />
    <div style={blob('#c3faf5', 700, 520, 520)} />
    <div style={blob('#ffe9a8', 640, -160, 1300)} />
    <div style={blob('#dcd8ff', 560, 600, -140)} />
    <div style={{ position: 'absolute', top: 90, left: 70 }}><Logo dark={false} /></div>
    <div style={{ position: 'absolute', top: 90, right: 70, padding: '14px 30px', borderRadius: 999, background: '#1c1c1e', color: '#fff', fontWeight: 600, fontSize: 34 }}>Free</div>
    <div style={{ position: 'absolute', top: 250, left: 70, right: 70, color: '#1c1c1e', fontWeight: 800, fontSize: 118, letterSpacing: -4, lineHeight: 1.0 }}>
      Shrink a PDF<br />in <span style={{ background: '#ffd02f', padding: '0 20px', borderRadius: 24, display: 'inline-block', transform: 'rotate(-2deg)' }}>10 sec</span>
    </div>
    <div style={{ position: 'absolute', top: 700, left: 90, right: 90 }}>
      <div style={{ padding: 14, borderRadius: 52, background: '#fff', boxShadow: '0 30px 80px rgba(120,90,60,.22), 0 4px 0 #f0e6d4', transform: 'rotate(1.2deg)' }}>
        <Cam {...SRC} fw={880} fh={700} radius={40} />
      </div>
      <div style={{ position: 'absolute', top: -46, left: -26, width: 112, height: 112, borderRadius: '50%', background: '#4262ff', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 64, boxShadow: '0 14px 30px rgba(66,98,255,.45)', transform: 'rotate(-8deg)' }}>1</div>
      <div style={{ position: 'absolute', bottom: -40, right: -10, padding: '18px 36px', borderRadius: 28, background: '#c3faf5', color: '#187574', fontWeight: 800, fontSize: 48, boxShadow: '0 14px 30px rgba(24,117,116,.25)', transform: 'rotate(3deg)' }}>12 MB → 1.4 MB</div>
    </div>
    <div style={{ position: 'absolute', bottom: 180, left: 70, right: 70 }}>
      <Caption words={['Drop', 'your', 'file', 'in']} hi={2} color="#1c1c1e" hiColor="#4262ff" size={80} />
    </div>
    <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ width: i === 0 ? 70 : 20, height: 20, borderRadius: 10, background: i === 0 ? '#4262ff' : '#d9d2c3' }} />)}
    </div>
  </AbsoluteFill>
);

// ---------- C: Tactile Desk ----------
const Paper = ({ x, y, rot, w = 400, h = 520, color = '#fff', lines = true, style }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: color, borderRadius: 8, transform: `rotate(${rot}deg)`, boxShadow: '0 2px 0 rgba(0,0,0,.06), 0 18px 40px rgba(70,45,20,.28)', padding: 34, boxSizing: 'border-box', ...style }}>
    {lines && <><div style={{ height: 16, width: '55%', background: '#4262ff', borderRadius: 4, marginBottom: 26 }} />{[88, 100, 72, 94, 60, 100, 80].map((p, i) => <div key={i} style={{ height: 9, width: `${p}%`, background: '#d9d6cf', borderRadius: 4, marginBottom: 18 }} />)}</>}
  </div>
);
const Cc = () => (
  <AbsoluteFill style={{ fontFamily, overflow: 'hidden', background: 'radial-gradient(ellipse at 40% 25%, #f1e6d3, #d9c8ac 70%, #c9b695)' }}>
    {/* wood-ish grain */}
    <AbsoluteFill style={{ background: 'repeating-linear-gradient(90deg, rgba(120,80,40,.05) 0 3px, transparent 3px 22px)' }} />
    <div style={{ position: 'absolute', top: 90, left: 70 }}><Logo dark={false} /></div>
    {/* fat stack on the left, thin on the right: the compress metaphor */}
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Paper key={i} x={60 + i * 3} y={300 - i * 9} rot={-6 + (i % 3)} w={360} h={470} lines={i === 7} />)}
    <div style={{ position: 'absolute', left: 78, top: 700, color: '#6b5336', fontWeight: 800, fontSize: 44 }}>12 MB</div>
    <svg style={{ position: 'absolute', left: 440, top: 460 }} width="200" height="120" viewBox="0 0 200 120" fill="none" stroke="#4262ff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"><path d="M10 60 C70 10 130 10 185 58" /><path d="M150 36 L186 58 L156 90" /></svg>
    <Paper x={680} y={380} rot={4} w={330} h={430} lines style={{ boxShadow: '0 2px 0 rgba(0,0,0,.06), 0 8px 16px rgba(70,45,20,.25)' }} />
    <div style={{ position: 'absolute', left: 720, top: 830, color: '#187574', fontWeight: 800, fontSize: 44 }}>1.4 MB ✓</div>
    {/* sticky note */}
    <div style={{ position: 'absolute', right: 60, top: 150, width: 330, height: 300, background: '#ffe46b', transform: 'rotate(5deg)', boxShadow: '0 16px 30px rgba(70,45,20,.3)', padding: 34, boxSizing: 'border-box', fontWeight: 800, fontSize: 56, lineHeight: 1.1, color: '#4a3b00', letterSpacing: -1 }}>PDF too big to email?</div>
    {/* paperclip */}
    <svg style={{ position: 'absolute', left: 260, top: 250 }} width="60" height="150" viewBox="0 0 60 150" fill="none" stroke="#9aa0ad" strokeWidth="6" strokeLinecap="round"><path d="M18 120 V30 a14 14 0 0 1 28 0 V118 a22 22 0 0 1-44 0 V50" /></svg>
    {/* device on the desk */}
    <div style={{ position: 'absolute', left: 90, right: 90, top: 1000 }}>
      <div style={{ padding: 18, borderRadius: 54, background: '#1c1c1e', boxShadow: '0 40px 70px rgba(60,35,10,.45)', transform: 'rotate(-1.5deg)' }}>
        <Cam {...SRC} fw={860} fh={540} radius={38} keys={[{ t: 0, x: 400, y: 120, w: 800 }]} marks={[{ x: 596, y: 217, w: 408, h: 80, t0: -1, t1: 99 }]} />
      </div>
    </div>
    <div style={{ position: 'absolute', bottom: 120, left: 60, right: 60 }}>
      <Caption words={['Drop', 'your', 'file', 'in']} hi={2} color="#3b2a14" hiColor="#4262ff" size={76} />
    </div>
  </AbsoluteFill>
);

registerRoot(() => (
  <>
    <Still id="A" component={A} width={1080} height={1920} />
    <Still id="B" component={B} width={1080} height={1920} />
    <Still id="C" component={Cc} width={1080} height={1920} />
  </>
));
