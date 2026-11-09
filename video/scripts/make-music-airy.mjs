// Bright, airy 60s track for the "Airy" launch video: 120 BPM, C major (C-G-Am-F), bells + plucks, light kick.
// Bar-aligned (1 bar = 2s) to the light/dark acts of the video:
//  0-6 dark intro | 6 LIGHT DROP | 6-22 groove | 22-36 dark half-time | 36 DROP 2 | 36-56 full | 57 final hit | 57-60 outro
import fs from 'node:fs';

const SR = 44100, DUR = 60, N = SR * DUR, BEAT = 0.5, BAR = 2;
const L = new Float32Array(N), R = new Float32Array(N);       // dry bus
const ML = new Float32Array(N), MR = new Float32Array(N);     // music bus (sidechained + reverb)
const WL = new Float32Array(N), WR = new Float32Array(N);     // extra reverb send (snare/clap)
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const lpc = (fc) => 1 - Math.exp((-2 * Math.PI * fc) / SR);
const put = (bl, br, at, sig, g = 1, pan = 0) => {
  const s = Math.floor(at * SR), a = Math.cos(((pan + 1) * Math.PI) / 4) * g, b = Math.sin(((pan + 1) * Math.PI) / 4) * g;
  for (let i = 0; i < sig.length && s + i < N; i++) { bl[s + i] += sig[i] * a; br[s + i] += sig[i] * b; }
};

// ---------- voices ----------
const kick = () => { // tighter, lighter kick
  const n = Math.floor(0.3 * SR), o = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (2 * Math.PI * (52 + 140 * Math.exp(-t * 38))) / SR; o[i] = Math.sin(ph) * Math.exp(-t * 13) * Math.min(1, t * 900) + (i < 70 ? rnd() * 0.25 * (1 - i / 70) : 0); }
  return o;
};
const bell = (f, len = 1.2) => { // FM-ish glassy bell
  const n = Math.floor(len * SR), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR, m = Math.sin(2 * Math.PI * f * 3.5 * t) * 1.4 * Math.exp(-t * 7); o[i] = (Math.sin(2 * Math.PI * f * t + m) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 5)) * Math.exp(-t * 3.2) * Math.min(1, t * 700); }
  return o;
};
const noiseBand = (len, lo, hi, decay, att = 0.001) => {
  const n = Math.floor(len * SR), o = new Float32Array(n); let a = 0, b = 0;
  const ca = lpc(hi), cb = lpc(lo);
  for (let i = 0; i < n; i++) { const t = i / SR, x = rnd(); a += ca * (x - a); b += cb * (x - b); o[i] = (a - b) * Math.exp(-t * decay) * Math.min(1, t / att); }
  return o;
};
const snare = () => { const n = noiseBand(0.3, 1200, 9000, 16); for (let i = 0; i < n.length; i++) n[i] = n[i] * 2.2 + Math.sin(2 * Math.PI * 190 * (i / SR)) * Math.exp(-(i / SR) * 24) * 0.5; return n; };
const clap = () => { const o = new Float32Array(Math.floor(0.4 * SR)); [0, 0.011, 0.023].forEach((d) => { const b = noiseBand(0.12, 900, 6500, 38); b.forEach((v, i) => { const j = i + Math.floor(d * SR); if (j < o.length) o[j] += v * 1.6; }); }); noiseBand(0.38, 900, 5000, 11).forEach((v, i) => (o[i] += v * 0.9)); return o; };
const hat = (open = false) => noiseBand(open ? 0.3 : 0.07, 6500, 16000, open ? 11 : 55).map((v) => v * 2.4);
const crash = () => noiseBand(2.4, 3000, 16000, 2.2, 0.004).map((v) => v * 2);
const boom = () => { const n = Math.floor(1.8 * SR), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += (2 * Math.PI * (30 + 60 * Math.exp(-t * 3))) / SR; o[i] = Math.sin(ph) * Math.exp(-t * 1.9); } return o; };
const riser = (len, from = 400, to = 9000) => {
  const n = Math.floor(len * SR), o = new Float32Array(n); let lp = 0, hp = 0;
  for (let i = 0; i < n; i++) { const p = i / n, c = lpc(from + (to - from) * p * p); lp += c * (rnd() - lp); hp += lpc(300) * (lp - hp); o[i] = (lp - hp) * p ** 1.8 * 2.5; }
  return o;
};
const reverseSwell = (len) => { const n = Math.floor(len * SR), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const p = i / n; ph += (2 * Math.PI * (200 + 1800 * p * p)) / SR; o[i] = (Math.sin(ph) + 0.5 * Math.sin(ph * 1.5)) * p ** 2.5 * 0.3; } return o; };
const bass = (f, len) => {
  const n = Math.floor((len + 0.08) * SR), o = new Float32Array(n); let lp = 0, ph = 0, ph2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; ph += f / SR; ph2 += (f * 1.005) / SR;
    const saw = (ph % 1) * 2 - 1 + ((ph2 % 1) * 2 - 1), c = lpc(180 + 700 * Math.exp(-t * 10));
    lp += c * (saw - lp);
    o[i] = (lp * 0.55 + Math.sin(2 * Math.PI * f * (i / SR)) * 0.8) * Math.min(1, t * 400) * (t < len ? 1 : Math.max(0, 1 - (t - len) / 0.08));
  }
  return o;
};
const padVoice = (f, len, cut = 2200) => {
  const n = Math.floor((len + 0.7) * SR), a = new Float32Array(n), b = new Float32Array(n);
  const dets = [-9, -4, 0, 4, 9], ph = [0.1, 0.35, 0.6, 0.8, 0.95]; const lps = [0, 0, 0, 0, 0], c = lpc(cut);
  for (let i = 0; i < n; i++) {
    const t = i / SR; const env = Math.min(1, t / 0.45) * (t < len ? 1 : Math.max(0, 1 - (t - len) / 0.7));
    let sl = 0, sr = 0;
    for (let v = 0; v < 5; v++) { ph[v] += (f * 2 ** (dets[v] / 1200)) / SR; const s = (ph[v] % 1) * 2 - 1; lps[v] += c * (s - lps[v]); (v % 2 ? (sr += lps[v]) : (sl += lps[v])); }
    a[i] = (sl + sr * 0.4) * env * 0.22; b[i] = (sr + sl * 0.4) * env * 0.22;
  }
  return [a, b];
};
const pluck = (f, len = 0.4) => {
  const n = Math.floor(len * SR), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR, e = Math.exp(-t * 9) * Math.min(1, t * 500); const x = 2 * Math.PI * f * t; o[i] = (Math.sin(x) + 0.45 * Math.sin(2 * x) * Math.exp(-t * 14) + 0.25 * Math.sin(3 * x) * Math.exp(-t * 20)) * e; }
  return o;
};
const lead = (f, len) => {
  const n = Math.floor((len + 0.12) * SR), o = new Float32Array(n); let ph = 0, ph2 = 0, lp = 0, vib = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; vib = Math.sin(2 * Math.PI * 5.6 * t) * Math.min(1, t * 3) * 0.004;
    ph += (f * (1 + vib)) / SR; ph2 += (f * 1.006 * (1 + vib)) / SR;
    const s = ((ph % 1) * 2 - 1) * 0.6 + ((ph2 % 1) < 0.5 ? 0.35 : -0.35);
    lp += lpc(3200) * (s - lp);
    o[i] = lp * Math.min(1, t * 120) * (t < len ? 1 : Math.max(0, 1 - (t - len) / 0.12)) * 0.55;
  }
  return o;
};

// ---------- composition ----------
const ROOT = [48, 43, 45, 41];                                  // C3 G2 A2 F2
const TRI = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]];
const HOOK = [
  [76, 0, 79, 0, 84, 0, 79, 76], [74, 0, 79, 0, 83, 0, 79, 74],
  [72, 0, 76, 0, 81, 0, 79, 76], [72, 0, 77, 0, 81, 0, 84, 81],
];
const K = kick(), SN = snare(), CL = clap(), HC = hat(false), HO = hat(true);
const kickTimes = [];
const bars = DUR / BAR;
const inR = (b, a, z) => b >= a && b <= z;

for (let b = 0; b < bars; b++) {
  const t0 = b * BAR, ch = b % 4;
  const intro = inR(b, 0, 2), grooveA = inR(b, 3, 10), dark = inR(b, 11, 17), grooveB = inR(b, 18, 28), outro = b === 29;
  const full = grooveA || grooveB;

  // pad
  const cut = intro ? 1100 : dark ? 1500 : outro ? 1800 : 3000;
  TRI[ch].forEach((m) => { const [x, y] = padVoice(hz(m - 12), BAR + 0.05, cut); put(ML, MR, t0, x, 0.8, -0.5); put(ML, MR, t0, y, 0.8, 0.5); });
  { const [x, y] = padVoice(hz(TRI[ch][2]), BAR + 0.05, cut + 800); put(ML, MR, t0, x, 0.35, -0.3); put(ML, MR, t0, y, 0.35, 0.3); }

  // pluck arp: 8ths in intro/dark, 16ths in grooves
  if (b >= 1 && !outro) {
    const step = full ? 0.125 : 0.25;
    const pat = [0, 1, 2, 1, 2, 0, 2, 1];
    for (let s = 0, k = 0; s < BAR - 1e-6; s += step, k++) {
      const m = TRI[ch][pat[k % 8]] + 12 + (k % 8 === 4 ? 12 : 0);
      const g = (intro ? 0.32 : dark ? 0.36 : 0.42) * (k % 2 ? 0.75 : 1);
      put(ML, MR, t0 + s, pluck(hz(m), 0.35), g, k % 2 ? 0.5 : -0.5);
    }
  }
  // bell hook
  if (b === 2) [0, 4].forEach((i) => put(ML, MR, t0 + i * 0.25, bell(hz(HOOK[ch][i])), 0.5, 0.2));
  if (inR(b, 5, 10) || grooveB) HOOK[ch].forEach((m, i) => { if (m) { put(ML, MR, t0 + i * 0.25, bell(hz(m), 0.9), grooveB ? 0.62 : 0.5, 0.15); if (grooveB) put(ML, MR, t0 + i * 0.25, bell(hz(m + 12), 0.6), 0.16, -0.25); } });
  if (dark) HOOK[ch].forEach((m, i) => { if (m && i % 4 === 0) put(ML, MR, t0 + i * 0.25, bell(hz(m), 1.6), 0.42, 0.1); });

  if (full && !(b === 28 && false)) {
    for (let q = 0; q < 4; q++) { const at = t0 + q * BEAT; if (b === 28 && at >= 57) break; kickTimes.push(at); put(L, R, at, K, 0.95); }
    [1, 3].forEach((q) => { if (b === 28 && q === 3) return; put(L, R, t0 + q * BEAT, CL, 0.42); put(WL, WR, t0 + q * BEAT, CL, 0.35); });
    for (let q = 0; q < 4; q++) put(L, R, t0 + q * BEAT + BEAT / 2, HC, 0.18, 0.3);
    for (let s = 0; s < 8; s++) if (s % 2) put(L, R, t0 + s * 0.25 + 0.125, HC, 0.08, -0.3);
    if (b % 4 === 3) put(L, R, t0 + 1.75, HO, 0.14, 0.2);
    const f = hz(ROOT[ch]);
    [0.25, 0.75, 1.25, 1.75].forEach((s, i) => { if (b === 28 && t0 + s >= 57) return; put(L, R, t0 + s, bass(i === 3 ? f * 2 : f, 0.2), 0.62); });
  }
  if (dark) { // half-time: kick 1 & 3, clap on 3, soft 8th hats, long bass
    [0, 2].forEach((q) => { kickTimes.push(t0 + q * BEAT); put(L, R, t0 + q * BEAT, K, 0.75); });
    put(L, R, t0 + 1.5, CL, 0.35); put(WL, WR, t0 + 1.5, CL, 0.4);
    for (let q = 0; q < 8; q++) put(L, R, t0 + q * 0.25, HC, q % 2 ? 0.07 : 0.11, 0.25);
    put(L, R, t0, bass(hz(ROOT[ch]), 1.85), 0.5);
    if (b === 17) for (let s = 0; s < 16; s++) put(L, R, t0 + s * 0.125, SN, 0.1 + s * 0.04);
  }
  if (intro && b >= 1) put(L, R, t0, bass(hz(ROOT[ch]), 1.85), 0.3);
}

// transitions / FX
const fx = (at, sig, g = 1) => put(L, R, at, sig, g);
fx(0.0, boom(), 0.2);
fx(3.9, reverseSwell(2.1), 0.8);
fx(4, riser(2.0, 500, 9000), 0.42);              // into the light
fx(6, crash(), 0.45); fx(6, boom(), 0.7);         // drop 1 (light)
fx(14, crash(), 0.2); fx(18, crash(), 0.2);
fx(20, riser(2.0, 400, 7000), 0.3);
fx(22, crash(), 0.3); fx(22, boom(), 0.6);        // dark act
fx(28, crash(), 0.18);
fx(34, riser(2.0, 400, 10000), 0.5);
fx(36, crash(), 0.55); fx(36, boom(), 0.9);       // drop 2 (light)
fx(44, crash(), 0.25); fx(46.5, crash(), 0.2); fx(50, crash(), 0.25); fx(54, crash(), 0.25);
fx(55, riser(2.0, 500, 9000), 0.45);
fx(57, crash(), 0.6); fx(57, boom(), 0.9);        // final hit -> end card
put(ML, MR, 57, bell(hz(84), 2.8), 0.55, 0); put(ML, MR, 57, bell(hz(79), 2.8), 0.4, -0.3); put(ML, MR, 57, bell(hz(76), 2.8), 0.35, 0.3);
{ const [x, y] = padVoice(hz(60), 2.6, 2200); put(ML, MR, 57, x, 0.8, -0.4); put(ML, MR, 57, y, 0.8, 0.4); }

// ---------- mix ----------
// sidechain ducking driven by kick times
const duck = new Float32Array(N); { let kt = 0, last = -9; kickTimes.sort((a, b) => a - b); for (let i = 0; i < N; i++) { const t = i / SR; while (kt < kickTimes.length && kickTimes[kt] <= t) last = kickTimes[kt++]; duck[i] = 1 - 0.62 * Math.exp(-(t - last) / 0.13) * (t - last < 0.6 ? 1 : 0); } }

// simple Freeverb-ish reverb
function reverb(inp, off) {
  const cl = [1116, 1188, 1277, 1356, 1422, 1491].map((x) => x + off), al = [556 + off, 441 + off];
  const out = new Float32Array(N);
  const combs = cl.map((d) => ({ b: new Float32Array(d), i: 0, s: 0 }));
  const aps = al.map((d) => ({ b: new Float32Array(d), i: 0 }));
  for (let n = 0; n < N; n++) {
    const x = inp[n] * 0.02; let y = 0;
    for (const c of combs) { const o = c.b[c.i]; c.s = o * 0.7 + c.s * 0.3; c.b[c.i] = x + c.s * 0.86; c.i = (c.i + 1) % c.b.length; y += o; }
    for (const a of aps) { const o = a.b[a.i]; const v = y + o * 0.5; a.b[a.i] = v; y = o - v * 0.5; a.i = (a.i + 1) % a.b.length; }
    out[n] = y;
  }
  return out;
}
// ping-pong style feedback delay on the music bus (dotted 8th)
function delay(buf, d, fb, mix) { const o = new Float32Array(N); for (let i = 0; i < N; i++) { const x = buf[i] + (i >= d ? o[i - d] * fb : 0); o[i] = x - buf[i]; } return o.map((v, i) => v * mix); }

// section energy: quiet intro, hollow breakdown, full drops
const sec = (t) => (t < 6 ? 0.36 + 0.2 * (t / 6) : t < 22 ? 1 : t < 36 ? 0.72 : t < 57 ? 1.05 : 0.8);
for (let i = 0; i < N; i++) { const e = sec(i / SR); ML[i] *= duck[i] * e; MR[i] *= duck[i] * e; WL[i] *= e; WR[i] *= e; }
const dl = delay(ML, Math.floor(0.375 * SR), 0.38, 0.35), dr = delay(MR, Math.floor(0.375 * SR), 0.38, 0.35);
const sendL = new Float32Array(N), sendR = new Float32Array(N);
for (let i = 0; i < N; i++) { sendL[i] = ML[i] * 0.55 + WL[i] + dl[i] * 0.3; sendR[i] = MR[i] * 0.55 + WR[i] + dr[i] * 0.3; }
const rl = reverb(sendL, 0), rr = reverb(sendR, 23);

const outL = new Float32Array(N), outR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  // breakdown cut: kill drums/bass at 33.5, resume with the drop at 34
  const gate = (t >= 5.75 && t < 6) || (t >= 35.75 && t < 36) ? 0.15 : 1;
  const d = (a) => a * gate;
  outL[i] = d(L[i]) + ML[i] * 0.85 + dl[i] * 0.5 + rl[i] * 0.85;
  outR[i] = d(R[i]) + MR[i] * 0.85 + dr[i] * 0.5 + rr[i] * 0.85;
}
let peak = 0; for (let i = 0; i < N; i++) { outL[i] = Math.tanh(outL[i] * 0.8); outR[i] = Math.tanh(outR[i] * 0.8); peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i])); }
const k = 0.89 / peak;
for (let i = 0; i < N; i++) { const t = i / SR, f = Math.min(1, t / 0.05) * Math.min(1, (DUR - t) / 2.0); outL[i] *= k * f; outR[i] *= k * f; }

// write stereo wav
const b = Buffer.alloc(44 + N * 4);
b.write('RIFF', 0); b.writeUInt32LE(36 + N * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { b.writeInt16LE(Math.round(outL[i] * 32767), 44 + i * 4); b.writeInt16LE(Math.round(outR[i] * 32767), 46 + i * 4); }
fs.mkdirSync('public/sfx', { recursive: true });
fs.writeFileSync('public/sfx/music-airy.wav', b);
console.log('music-airy.wav written', (b.length / 1e6).toFixed(1) + ' MB');
