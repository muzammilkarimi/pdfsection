// Synthesizes all sound effects + a music bed as 44.1kHz mono WAVs (no external assets).
import fs from 'node:fs';
import path from 'node:path';

const SR = 44100;
const out = path.resolve('public/sfx');
fs.mkdirSync(out, { recursive: true });

const buf = (sec) => new Float32Array(Math.floor(sec * SR));
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function write(name, data, gain = 0.9) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const k = peak > 0 ? gain / peak : 1;
  const b = Buffer.alloc(44 + data.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + data.length * 2, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => b.writeInt16LE(Math.max(-1, Math.min(1, v * k)) * 32767, 44 + i * 2));
  fs.writeFileSync(path.join(out, name), b);
}

// one-pole low-pass sweep helper
const whoosh = (sec, from, to) => {
  const d = buf(sec); let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / d.length;
    const f = from + (to - from) * Math.sin(t * Math.PI);
    const a = Math.min(1, (2 * Math.PI * f) / SR);
    lp += a * (rnd() - lp);
    d[i] = lp * Math.sin(t * Math.PI) ** 1.5;
  }
  return d;
};
const tone = (sec, f0, f1, decay, wave = 'sine') => {
  const d = buf(sec); let ph = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const f = f0 + (f1 - f0) * Math.min(1, t / sec);
    ph += (2 * Math.PI * f) / SR;
    const s = wave === 'square' ? Math.sign(Math.sin(ph)) * 0.5 : Math.sin(ph);
    d[i] = s * Math.exp(-t * decay) * Math.min(1, t * 400);
  }
  return d;
};
const mix = (...arr) => {
  const n = Math.max(...arr.map((a) => a.length));
  const d = buf(n / SR);
  arr.forEach((a) => a.forEach((v, i) => (d[i] += v)));
  return d;
};

// --- SFX ---
write('whoosh.wav', whoosh(0.7, 400, 6000));
write('whoosh-short.wav', whoosh(0.35, 800, 7000));
write('pop.wav', tone(0.18, 700, 220, 22));
write('tick.wav', tone(0.06, 1800, 1200, 70, 'square'), 0.5);
write('ding.wav', mix(tone(1.2, 1318, 1318, 4), tone(1.2, 1976, 1976, 6), tone(1.2, 2637, 2637, 9)), 0.7);
write('impact.wav', mix(tone(1.0, 110, 38, 5), whoosh(0.5, 300, 2500).map((v) => v * 0.5)), 1);
write('riser.wav', (() => {
  const d = buf(2); let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / d.length;
    lp += Math.min(1, (2 * Math.PI * (200 + t * t * 9000)) / SR) * (rnd() - lp);
    d[i] = lp * t * t + Math.sin(2 * Math.PI * (200 + t * t * 1500) * (i / SR)) * 0.15 * t;
  }
  return d;
})(), 0.8);
write('swipe.wav', whoosh(0.25, 1500, 9000), 0.7);
write('success.wav', (() => {
  const d = buf(0.9);
  [[0, 784], [0.09, 988], [0.18, 1318]].forEach(([at, f]) => {
    const t = tone(0.6, f, f, 7);
    t.forEach((v, i) => { const j = i + Math.floor(at * SR); if (j < d.length) d[j] += v; });
  });
  return d;
})(), 0.7);

// --- Music bed: 60s, 120 BPM, Am - F - C - G ---
{
  const secs = 60, d = buf(secs), beat = 0.5;
  const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  const add = (at, tn) => tn.forEach((v, i) => { const j = i + Math.floor(at * SR); if (j < d.length) d[j] += v; });
  const energy = (t) => (t < 4 ? 0.35 : t > 52 ? 0.9 : 1); // sparse intro, full middle
  for (let b = 0; b < secs / beat; b++) {
    const t = b * beat, e = energy(t);
    const chord = chords[Math.floor(b / 8) % 4];
    // kick on every beat
    if (t >= 4 || b % 2 === 0) add(t, tone(0.3, 140, 45, 14).map((v) => v * 0.9 * e));
    // offbeat hat
    if (t >= 8) add(t + beat / 2, tone(0.05, 7000, 7000, 90, 'square').map((v) => v * 0.07 * e));
    // clap on 2 & 4
    if (t >= 8 && b % 2 === 1) add(t, whoosh(0.12, 3000, 6000).map((v) => v * 0.5 * e));
    // bass
    add(t, tone(beat * 0.9, hz(chord[0] - 12), hz(chord[0] - 12), 5).map((v) => v * 0.5 * e));
    // 8th-note arp
    if (t >= 4) {
      [0, 1].forEach((h) => add(t + h * beat / 2, tone(0.25, hz(chord[(b * 2 + h) % 3] + 12), hz(chord[(b * 2 + h) % 3] + 12), 11).map((v) => v * 0.18 * e)));
    }
  }
  // fade tail
  for (let i = 0; i < d.length; i++) d[i] *= Math.min(1, (secs - i / SR) / 1.5);
  write('music.wav', d, 0.55);
}
console.log('audio written to', out);

// extra: glass ping + soft boom (appended)
{
  const g = (() => { const a = tone(1.0, 2093, 2093, 7), b = tone(1.0, 3136, 3136, 9), c = tone(1.0, 4186, 4186, 12); return mix(a, b.map((v) => v * 0.5), c.map((v) => v * 0.3)); })();
  write('glass.wav', g, 0.6);
  write('boom.wav', mix(tone(1.6, 70, 32, 3), whoosh(0.8, 200, 1500).map((v) => v * 0.35)), 1);
}
