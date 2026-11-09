// Usage: node scripts/make-voice.mjs deadline
// Generates one mp3 per narration line (public/voice/<story>/<id>.mp3) and a timing file
// (src/story/voice/<story>.json) with each line's duration and word offsets, used to time the animation.
import fs from 'node:fs';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const story = process.argv[2];
const { voice, lines } = await import(`./stories/${story}.mjs`);
const dir = `public/voice/${story}`;
fs.mkdirSync(dir, { recursive: true });

const tts = new MsEdgeTTS();
await tts.setMetadata(voice.name, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });

const out = [];
for (const ln of lines) {
  const { audioStream, metadataStream } = tts.toStream(ln.say, { rate: voice.rate });
  const chunks = []; const words = [];
  metadataStream?.on('data', (d) => {
    for (const m of JSON.parse(d.toString()).Metadata ?? []) {
      if (m.Type === 'WordBoundary') words.push({ w: m.Data.text.Text, s: m.Data.Offset / 1e7, e: (m.Data.Offset + m.Data.Duration) / 1e7 });
    }
  });
  audioStream.on('data', (c) => chunks.push(c));
  await new Promise((r) => audioStream.on('close', r));
  const buf = Buffer.concat(chunks);
  fs.writeFileSync(`${dir}/${ln.id}.mp3`, buf);
  const dur = +(buf.length * 8 / 96000).toFixed(2); // 96 kbps CBR
  out.push({ id: ln.id, text: ln.text, dur, words });
  console.log(ln.id, dur + 's', words.length + ' words');
}
fs.writeFileSync(`src/story/voice/${story}.json`, JSON.stringify(out, null, 1));
