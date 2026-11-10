// Phone-vibration sound effect (two short bursts) -> public/sfx/buzz.wav
import fs from 'node:fs';
const SR = 44100, dur = 0.85, n = Math.floor(SR * dur), d = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const t = i / SR, env = t < 0.34 ? 1 : (t > 0.44 && t < 0.78 ? 1 : 0);
  const am = 0.6 + 0.4 * Math.sign(Math.sin(2 * Math.PI * 38 * t));
  d[i] = env * am * (Math.sign(Math.sin(2 * Math.PI * 150 * t)) * 0.45 + Math.sin(2 * Math.PI * 300 * t) * 0.25) * 0.8;
}
const b = Buffer.alloc(44 + n * 2);
b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
d.forEach((v, i) => b.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, 44 + i * 2));
fs.writeFileSync('public/sfx/buzz.wav', b);
