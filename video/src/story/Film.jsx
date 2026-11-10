import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Banner, Browser, Chat, Cuts, EndCard, PhoneShot, Portal, S, Stamp, FPS } from './kit.jsx';
import { Captions, Confetti, HandsOver, HandsUnder, LaptopInsert, MergeScene, PressScene, RoomScene } from './art.jsx';
import { Sfx, sfx } from '../lib.jsx';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const Shot = ({ from, to, children }) => <Sequence from={S(from)} durationInFrames={Math.max(1, S(to - from))}>{children}</Sequence>;
const Cue = ({ at, name, v = 0.6 }) => <Sfx at={at} name={name} volume={v} />;
const Ticks = ({ from = 0.2, to, v = 0.3 }) => <>{Array.from({ length: Math.max(0, Math.floor(to - from)) + 1 }, (_, i) => <Sfx key={i} at={from + i} name="tick" volume={v} />)}</>;
const Blur = ({ children, px = 16 }) => <AbsoluteFill style={{ filter: `blur(${px}px) brightness(.8)`, transform: 'scale(1.06)' }}>{children}</AbsoluteFill>;

// the phone buzzing on the desk, with the friend's message preview
const BuzzPhone = ({ at = 0.45, who }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const buzz = (t > at && t < at + 0.4) || (t > at + 0.7 && t < at + 1.1);
  const jx = buzz ? Math.sin(f * 2.8) * 8 : 0, jy = buzz ? Math.cos(f * 3.3) * 5 : 0;
  const lit = t > at;
  const p = interpolate(t, [at, at + 0.3], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 470, top: 1340, width: 320, height: 620, transform: `translate(${jx}px,${jy}px) rotate(13deg)`, transformOrigin: '50% 50%' }}>
      <div style={{ position: 'absolute', inset: -70, borderRadius: 120, background: 'radial-gradient(ellipse, rgba(127,210,255,.35), transparent 65%)', opacity: lit ? 1 : 0 }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 52, background: '#0b0c12', border: '3px solid #2f3140', boxShadow: '0 30px 50px rgba(0,0,0,.6)' }} />
      <div style={{ position: 'absolute', inset: 12, borderRadius: 42, background: lit ? 'linear-gradient(160deg,#27305c,#12142b)' : '#07080d', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 14, right: 14, top: 40, padding: '16px 18px', borderRadius: 24, background: 'rgba(250,250,252,.96)', display: 'flex', gap: 14, alignItems: 'center', opacity: p, transform: `translateY(${(1 - p) * -40}px)` }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: who.hue, color: '#fff', fontWeight: 700, fontSize: 26, display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif' }}>{who.name[0]}</div>
          <div style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}><div style={{ fontWeight: 700, fontSize: 24, color: '#111' }}>{who.name}</div><div style={{ fontSize: 20, color: '#555' }}>{who.preview}</div></div>
        </div>
      </div>
      {buzz && [-1, 1].map((k) => <svg key={k} width="60" height="300" style={{ position: 'absolute', top: 160, [k < 0 ? 'left' : 'right']: -62 }}><path d={k < 0 ? 'M50,20 Q10,150 50,280' : 'M10,20 Q50,150 10,280'} stroke="#ffd02f" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".85" /></svg>)}
    </div>
  );
};

const heldPhone = (children, { tap, shot } = {}) => (
  <PhoneShot dur={4} y={250} push={0.03} under={<HandsUnder />} over={<HandsOver tap={tap} />} {...shot}>{children}</PhoneShot>
);

/*
  A narrated, animated story film. Every story has the same eight beats and differs only by this config:
  A establish · B the upload fails · C panic · D phone buzzes, a friend tips you · E the real tool · F the metaphor · G payoff · H end card
  Voice lines must be ids l1..l11 (A: l1-2, B: l3-4, C: l5, D: l6-7, E: l8, F: l9, G: l10, H: l11).
*/
export const makeFilm = (cfg) => {
  const V = cfg.voice, GAP = 0.15, LEAD = 0.3, TAIL = 1.0;
  const L = {}; let tcur = LEAD;
  for (const l of V) { const d = Math.min(l.dur, (l.words.at(-1)?.e ?? l.dur) + 0.3); L[l.id] = { ...l, s: tcur, e: tcur + d }; tcur += d + GAP; } // trim the voice's silent tail
  const len = tcur + TAIL;
  const cut = (id) => L[id].s - 0.12;
  const SCN = { A: [0, cut('l3')], B: [cut('l3'), cut('l5')], C: [cut('l5'), cut('l6')], D: [cut('l6'), cut('l8')], E: [cut('l8'), cut('l9')], F: [cut('l9'), cut('l10')], G: [cut('l10'), cut('l11')], H: [cut('l11'), len] };
  const dur = (k) => SCN[k][1] - SCN[k][0];
  const rel = (k, id, off = 0) => L[id].s + off - SCN[k][0];
  const CAP = V.flatMap((l) => {
    const toks = l.text.split(' '); const a = L[l.id].s + (l.words[0]?.s ?? 0), b = L[l.id].s + (l.words.at(-1)?.e ?? l.dur);
    const tot = toks.reduce((n, w) => n + w.length + 1, 0); let at = a;
    return toks.map((w) => { const d = ((w.length + 1) / tot) * (b - a); const o = { w, s: at, e: at + d }; at += d; return o; });
  });
  const Sc = ({ k, children }) => <Sequence from={S(SCN[k][0])} durationInFrames={S(dur(k)) + 2}>{children}</Sequence>;

  const { room, stamps, clock, B, D, E, F, G, H } = cfg;
  const day = !!room.day, sod = (n) => room.sod + n;
  const Room = (p) => <RoomScene day={day} note={room.note} {...p} />;

  const Overlays = () => {
    const t = useCurrentFrame() / FPS;
    const low = t >= SCN.D[0] + rel('D', 'l7', -0.1) && t < SCN.F[0];
    const darkBg = !day || (t >= SCN.F[0] && t < SCN.G[0]); // the press / merge scenes are dark even in a day story
    return (<><Stamp dark={darkBg}>{t < SCN.G[0] ? stamps[0] : stamps[1]}</Stamp>{t < SCN.H[0] && <Captions words={CAP} y={low ? 1752 : 1530} />}</>);
  };

  const Film = () => {
    const dA = dur('A'), dB = dur('B'), dC = dur('C'), dD = dur('D'), dE = dur('E'), dF = dur('F'), dG = dur('G');
    const b1 = 0.9, b3 = dB - 1.4, d1 = rel('D', 'l7', -0.1), g1 = 1.4;
    const prtl = { bare: true, count: B.count, file: B.file, size: B.size, cfg: B.cfg };
    return (
      <AbsoluteFill style={{ background: day ? '#a89478' : '#08091a' }}>
        {/* A · establish: window → clock → her */}
        <Sc k="A">
          <Room sod={sod(0)} mood="neutral" look={[0.3, 0.2]} keys={[
            { t: 0, s: 2.0, x: 300, y: 430 }, { t: 0.5, s: 2.0, x: 300, y: 450 },
            { t: rel('A', 'l1', 0.5), s: 2.4, x: 830, y: 345 }, { t: rel('A', 'l2', -0.1), s: 2.4, x: 830, y: 345 },
            { t: dA, s: 1.12, x: 540, y: 930 }]} />
          <Ticks to={dA} /><Cue at={0} name="whoosh-short" v={0.25} />
        </Sc>

        {/* B · the upload fails */}
        <Sc k="B">
          <Shot from={0} to={b1}>
            <Room sod={sod(12)} mood="hope" look={[0.4, 0.5]} keys={[{ t: 0, s: 2.1, x: 540, y: 850 }, { t: b1, s: 2.35, x: 540, y: 850 }]} />
          </Shot>
          <Shot from={b1} to={b3}>
            <LaptopInsert url={B.cfg?.url}>
              <Portal {...prtl} mode="fail" attach={0.4} err={(b3 - b1) - 0.9} />
            </LaptopInsert>
            <Cue at={0.4} name="pop" v={0.5} /><Cue at={(b3 - b1) - 0.9} name="impact" v={0.9} /><Cue at={(b3 - b1) - 0.85} name="boom" v={0.5} />
          </Shot>
          <Shot from={b3} to={dB}>
            <Room sod={sod(21)} mood="worried" glow="#ff7b7b" look={[0, 0.6]} shake={0.6} keys={[{ t: 0, s: 1.9, x: 540, y: 850 }, { t: dB - b3, s: 2.2, x: 540, y: 850 }]} />
          </Shot>
          <Cue at={0} name="whoosh-short" v={0.3} /><Cue at={b1} name="swipe" v={0.35} /><Cue at={b3} name="swipe" v={0.35} />
          <Ticks from={0.5} to={dB} v={0.25} />
        </Sc>

        {/* C · the clock, panic */}
        <Sc k="C">
          <Shot from={0} to={0.9}>
            <Room sod={sod(40)} mood="panic" personHidden keys={[{ t: 0, s: 2.6, x: 830, y: 345 }, { t: 0.9, s: 3.5, x: 830, y: 345 }]} />
          </Shot>
          <Shot from={0.9} to={dC}>
            <Room sod={sod(41)} mood="panic" pose="hairHands" glow="#ff7b7b" look={[0, 0]} shake={1} keys={[{ t: 0, s: 1.25, x: 540, y: 860 }, { t: dC - 0.9, s: 1.5, x: 540, y: 860 }]} />
          </Shot>
          <Ticks from={0} to={dC} v={0.45} /><Cue at={0} name="whoosh-short" v={0.3} /><Cue at={0.9} name="impact" v={0.5} />
        </Sc>

        {/* D · the phone buzzes; a friend */}
        <Sc k="D">
          <Shot from={0} to={d1}>
            <Room sod={sod(50)} personHidden over={<BuzzPhone at={0.45} who={D.buzz} />} keys={[{ t: 0, s: 1.35, x: 640, y: 1500 }, { t: d1, s: 1.75, x: 630, y: 1640 }]} />
            <Cue at={0.45} name="buzz" v={0.9} /><Cue at={1.15} name="buzz" v={0.9} /><Cue at={0.6} name="ding" v={0.4} />
          </Shot>
          <Shot from={d1} to={dD}>
            <Blur><Room sod={sod(55)} personHidden keys={[{ t: 0, s: 1.1, x: 540, y: 960 }, { t: 7, s: 1.2, x: 540, y: 960 }]} /></Blur>
            {heldPhone(
              <Chat dark={!day} {...D.chat} msgs={[{ from: 'me', at: -9, text: D.chat.first }, ...D.chat.msgs]} />, { shot: { dur: dD - d1, dark: !day, clock: clock[0] } })}
            <Cue at={0} name="swipe" v={0.4} />{D.chat.msgs.map((m) => <Cue key={m.at} at={m.at} name="pop" v={0.55} />)}
          </Shot>
          <Cue at={0} name="whoosh-short" v={0.3} />
        </Sc>

        {/* E · the real tool on a held phone */}
        <Sc k="E">
          <Blur><Room sod={sod(65)} personHidden keys={[{ t: 0, s: 1.1, x: 540, y: 960 }, { t: 4, s: 1.2, x: 540, y: 960 }]} /></Blur>
          {heldPhone(
            <Browser url={E.url}><Cuts name={E.footage} parts={E.parts} /></Browser>, { tap: E.tap, shot: { dur: dE, clock: clock[1] } })}
          <Cue at={0} name="whoosh-short" v={0.3} />{E.pops.map((a) => <Cue key={a} at={a} name="pop" />)}
        </Sc>

        {/* F · the metaphor */}
        <Sc k="F">
          {F.kind === 'merge'
            ? <><MergeScene join={F.at} after={F.after} /><Cue at={F.at} name="impact" v={0.9} /><Cue at={F.at + 0.1} name="boom" v={0.5} /><Cue at={F.at + 0.8} name="success" v={0.7} /></>
            : <><PressScene press={F.at} before={F.before} after={F.after} /><Cue at={F.at} name="boom" v={0.9} /><Cue at={F.at + 0.02} name="impact" v={0.8} /><Cue at={F.at + 0.85} name="success" v={0.7} /></>}
          <Cue at={0} name="whoosh-short" v={0.3} />
        </Sc>

        {/* G · payoff, then relief */}
        <Sc k="G">
          <Shot from={0} to={g1}>
            {G.kind === 'chat' ? (
              <>
                <Blur><Room sod={sod(72)} personHidden keys={[{ t: 0, s: 1.1, x: 540, y: 960 }, { t: 4, s: 1.2, x: 540, y: 960 }]} /></Blur>
                {heldPhone(
                  <>
                    <Chat dark={!day} {...G.chat} msgs={G.chat.msgs} />
                    <Banner at={G.banner.at} title={G.banner.title} body={G.banner.body} icon={G.banner.icon} />
                  </>, { shot: { dur: g1, dark: !day, clock: clock[1] } })}
                <Cue at={G.chat.msgs[0].at} name="pop" v={0.6} /><Cue at={G.banner.at} name="ding" v={0.9} />
              </>
            ) : (
              <>
                <LaptopInsert url={B.cfg?.url} glow="#5df2a8" tilt={-1}>
                  <Portal {...prtl} file={G.file} size={G.size} count={47} mode="ok" attach={0} ok={0.05} submit={0.15} done={0.45} />
                </LaptopInsert>
                <Cue at={0.15} name="pop" v={0.6} /><Cue at={0.45} name="success" v={0.9} /><Cue at={0.5} name="glass" v={0.4} />
              </>
            )}
          </Shot>
          <Shot from={g1} to={dG}>
            <Room sod={sod(73)} mood="relief" pose="armsUp" glow="#5df2a8" warm look={[0, 0]} keys={[{ t: 0, s: 1.35, x: 540, y: 820 }, { t: dG - g1, s: 1.0, x: 540, y: 960 }]} over={<Confetti at={0.1} />} />
            <Cue at={0.1} name="whoosh" v={0.5} />
          </Shot>
          <Cue at={0} name="whoosh-short" v={0.3} />
        </Sc>

        {/* H · end card */}
        <Sc k="H">
          <Blur px={22}><Room sod={sod(73)} personHidden warm keys={[{ t: 0, s: 1.1, x: 540, y: 960 }, { t: 6, s: 1.2, x: 540, y: 960 }]} /></Blur>
          <AbsoluteFill style={{ background: day ? 'rgba(250,244,232,.72)' : 'rgba(6,7,20,.6)' }} />
          <EndCard dark={!day} lines={H.lines} url="pdfsection.com" />
          <Cue at={0.1} name="pop" /><Cue at={0.6} name="pop" /><Cue at={1.1} name="pop" /><Cue at={2.4} name="glass" v={0.5} />
        </Sc>

        <Overlays />
        {V.map((l) => <Sequence key={l.id} from={S(L[l.id].s)}><Audio src={staticFile(`voice/${cfg.name}/${l.id}.mp3`)} volume={1} /></Sequence>)}
        <Audio src={sfx('music')} volume={0.1} />
      </AbsoluteFill>
    );
  };
  return { Film, len };
};
