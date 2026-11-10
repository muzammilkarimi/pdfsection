import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = 'http://localhost:3030';
const only = process.argv[2];
fs.mkdirSync('footage/raw', { recursive: true });

const CURSOR = `
(() => {
  const mk = () => {
    if (document.getElementById('fc')) return;
    const st = document.createElement('style');
    st.textContent = 'nextjs-portal,#__next-build-watcher,[data-nextjs-toast]{display:none!important} #fc{position:fixed;z-index:2147483647;left:0;top:0;pointer-events:none;transition:none;filter:drop-shadow(0 4px 8px rgba(40,30,120,.45))} .rip{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #5e6ad2;border-radius:50%;width:10px;height:10px;margin:-5px 0 0 -5px;animation:rip .55s ease-out forwards} @keyframes rip{to{width:80px;height:80px;margin:-40px 0 0 -40px;opacity:0}}';
    document.head.appendChild(st);
    const c = document.createElement('div'); c.id = 'fc';
    c.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M4 3l16 7-7 2-2 7z" fill="#5e6ad2" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
    addEventListener('mousedown', (e) => { const r = document.createElement('div'); r.className = 'rip'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }, true);
  };
  if (document.body) mk(); else addEventListener('DOMContentLoaded', mk);
  new MutationObserver(mk).observe(document.documentElement, { childList: true, subtree: true });
})();`;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
let cur = { x: 100, y: 100 };
async function glide(p, x, y, ms = 700) {
  const n = Math.max(8, Math.round(ms / 16)), s = { ...cur };
  for (let i = 1; i <= n; i++) { const e = ease(i / n); await p.mouse.move(s.x + (x - s.x) * e, s.y + (y - s.y) * e); await p.waitForTimeout(ms / n); }
  cur = { x, y };
}
async function clickEl(p, loc, ms = 700) {
  const bb = await loc.boundingBox();
  await glide(p, bb.x + bb.width / 2, bb.y + bb.height / 2, ms);
  await p.waitForTimeout(120); await p.mouse.down(); await p.waitForTimeout(70); await p.mouse.up();
}

async function scenario(name, vp, fn, opts = {}) {
  if (only && only !== name) return;
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: 'footage/raw', size: vp }, ...opts });
  await ctx.addInitScript(CURSOR);
  const p = await ctx.newPage();
  cur = { x: vp.width * 0.6, y: vp.height * 0.5 };
  await fn(p, vp);
  await p.waitForTimeout(600);
  const v = p.video(); await ctx.close(); await v.saveAs(`footage/${name}.webm`); await b.close();
  console.log('saved', name);
}

const D = { width: 1600, height: 900 };
const M = { width: 540, height: 1170 };

await scenario('home', D, async (p) => {
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await glide(p, 1100, 290, 900); await p.waitForTimeout(250);
  await p.mouse.wheel(0, 380); await p.waitForTimeout(700);
  await glide(p, 560, 420, 700);
  await p.mouse.wheel(0, 420); await p.waitForTimeout(900);
  await glide(p, 860, 520, 600);
  await p.waitForTimeout(500);
  await p.mouse.wheel(0, -800); await p.waitForTimeout(600);
  await glide(p, 1297, 31, 700); await p.mouse.down(); await p.waitForTimeout(70); await p.mouse.up();
  await p.waitForTimeout(1600);
});

await scenario('merge', D, async (p) => {
  await p.goto(BASE + '/merge-pdf', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await glide(p, 800, 430, 800); await p.waitForTimeout(300);
  await p.setInputFiles('input[type=file]', ['samples/Q3-Report.pdf', 'samples/Invoice-2041.pdf', 'samples/Contract.pdf']);
  await p.waitForFunction(() => document.querySelectorAll('.merge-preview-paper img').length >= 3, null, { timeout: 30000 }); await p.waitForTimeout(900);
  await clickEl(p, p.getByRole('button', { name: 'Down' }).first(), 800); await p.waitForTimeout(900);
  await clickEl(p, p.getByRole('button', { name: /Merge PDFs/ }).first(), 900);
  await p.waitForTimeout(2800);
});

await scenario('compress', D, async (p) => {
  await p.goto(BASE + '/compress-pdf', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await glide(p, 800, 430, 800);
  await p.setInputFiles('input[type=file]', ['samples/Big-Scan.pdf']); await p.waitForTimeout(2200);
  await clickEl(p, p.getByRole('button', { name: /Maximum Compression/ }), 800); await p.waitForTimeout(700);
  await clickEl(p, p.getByRole('button', { name: /Compress PDF/ }).first(), 900);
  await p.waitForTimeout(7000);
});

await scenario('mobile', M, async (p) => {
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 420); await p.waitForTimeout(650); }
  await p.waitForTimeout(400);
}, { hasTouch: true, isMobile: true });
