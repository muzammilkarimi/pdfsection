// Upload a rendered video to YouTube (as a Short) with the YouTube Data API.
//
//   node scripts/upload-youtube.mjs auth
//   node scripts/upload-youtube.mjs upload <video.mp4> <meta.json> [--public] [--at 2026-11-02T09:00:00Z]
//
// meta.json: { "title": "...", "description": "...", "tags": ["pdf", ...] }
// Setup: put the OAuth "Desktop app" client file at secrets/client_secret.json,
// then run `auth` once. The token is saved to secrets/token.json (gitignored).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { google } from 'googleapis';

const SECRETS = path.resolve('secrets');
const CLIENT = path.join(SECRETS, 'client_secret.json');
const TOKEN = path.join(SECRETS, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const PORT = 53682;

const die = (m) => { console.error(m); process.exit(1); };

function oauth() {
  if (!fs.existsSync(CLIENT)) die(`Missing ${CLIENT}. See the setup steps.`);
  const raw = JSON.parse(fs.readFileSync(CLIENT, 'utf8'));
  const c = raw.installed || raw.web;
  return new google.auth.OAuth2(c.client_id, c.client_secret, `http://localhost:${PORT}`);
}

async function auth() {
  const client = oauth();
  const url = client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });
  console.log('Open this URL in your browser and approve access:\n\n' + url + '\n');
  const code = await new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const q = new URL(req.url, `http://localhost:${PORT}`).searchParams;
      res.end('You can close this tab and return to the terminal.');
      srv.close();
      q.get('code') ? resolve(q.get('code')) : reject(new Error(q.get('error') || 'no code'));
    }).listen(PORT);
  });
  const { tokens } = await client.getToken(code);
  fs.mkdirSync(SECRETS, { recursive: true });
  fs.writeFileSync(TOKEN, JSON.stringify(tokens, null, 2));
  console.log('Saved', TOKEN);
}

async function upload(video, metaFile, flags) {
  if (!video || !metaFile) die('usage: upload <video.mp4> <meta.json> [--public] [--at ISO]');
  if (!fs.existsSync(TOKEN)) die('Not authorised yet. Run: node scripts/upload-youtube.mjs auth');
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const client = oauth();
  client.setCredentials(JSON.parse(fs.readFileSync(TOKEN, 'utf8')));
  const yt = google.youtube({ version: 'v3', auth: client });

  const at = flags.includes('--at') ? flags[flags.indexOf('--at') + 1] : null;
  // Uploads default to private so nothing goes live by accident.
  const privacyStatus = at ? 'private' : flags.includes('--public') ? 'public' : 'private';
  const desc = meta.description.includes('#Shorts') ? meta.description : `${meta.description}\n\n#Shorts`;

  const res = await yt.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title: meta.title.slice(0, 100), description: desc, tags: meta.tags || [], categoryId: '28' },
      status: { privacyStatus, selfDeclaredMadeForKids: false, ...(at ? { publishAt: at } : {}) },
    },
    media: { body: fs.createReadStream(video) },
  });
  console.log(`Uploaded (${at ? 'scheduled ' + at : privacyStatus}): https://youtube.com/shorts/${res.data.id}`);
}

const [cmd, ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith('--') || rest[rest.indexOf(a) - 1] === '--at');
const pos = rest.filter((a) => !flags.includes(a));
if (cmd === 'auth') await auth();
else if (cmd === 'upload') await upload(pos[0], pos[1], rest);
else die('usage: auth | upload <video> <meta.json> [--public] [--at ISO]');
