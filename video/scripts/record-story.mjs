// Records phone-sized (540x1074) footage of the real tool + a JSON of when each action happened.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = 'http://localhost:3030';
const only = process.argv[2];
fs.mkdirSync('footage/story/raw', { recursive: true });

const TAP = `
(() => {
  const mk = () => {
    if (document.getElementById('tapst')) return;
    const st = document.createElement('style'); st.id = 'tapst';
    st.textContent = 'nextjs-portal,#__next-build-watcher,[data-nextjs-toast]{display:none!important} .tap{position:fixed;z-index:2147483646;pointer-events:none;border-radius:50%;width:70px;height:70px;margin:-35px 0 0 -35px;background:rgba(60,70,160,.28);border:2px solid rgba(60,70,160,.5);animation:tap .5s ease-out forwards} @keyframes tap{from{transform:scale(.4);opacity:1}to{transform:scale(1.25);opacity:0}}';
    document.head.appendChild(st);
    addEventListener('pointerdown', (e) => { const r = document.createElement('div'); r.className = 'tap'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }, true);
  };
  if (document.body) mk(); else addEventListener('DOMContentLoaded', mk);
  new MutationObserver(mk).observe(document.documentElement, { childList: true, subtree: true });
})();`;

const VP = { width: 540, height: 1074 };
async function scenario(name, fn) {
  if (only && only !== name) return;
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await b.newContext({ viewport: VP, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: 'footage/story/raw', size: { width: 1080, height: 2148 } } });
  await ctx.addInitScript(TAP);
  const p = await ctx.newPage();
  const t0 = Date.now(); const ev = {};
  const mark = (k) => { ev[k] = +((Date.now() - t0) / 1000).toFixed(2); };
  const tap = async (loc, wait = 700) => {
    await loc.scrollIntoViewIfNeeded(); await p.waitForTimeout(350);
    const bb = await loc.boundingBox();
    await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(wait);
  };
  await fn(p, { mark, tap });
  await p.waitForTimeout(800);
  const v = p.video(); await ctx.close(); await v.saveAs(`footage/story/${name}.webm`); await b.close();
  fs.writeFileSync(`footage/story/${name}.json`, JSON.stringify(ev, null, 1));
  console.log('saved', name, ev);
}

const compress = (file) => async (p, { mark, tap }) => {
  await p.goto(BASE + '/compress-pdf', { waitUntil: 'networkidle' }); await p.waitForTimeout(1100); mark('loaded');
  await p.evaluate(() => window.scrollTo({ top: 60, behavior: 'smooth' })); await p.waitForTimeout(700);
  mark('chooseTap'); await p.setInputFiles('input[type=file]', [file]); await p.waitForTimeout(2400); mark('fileChosen');
  await tap(p.getByRole('button', { name: /Maximum Compression/ }), 900); mark('levelTap');
  await tap(p.getByRole('button', { name: /Compress PDF/ }).first(), 300); mark('compressTap');
  await p.getByText(/successful|is ready/).first().waitFor({ timeout: 40000 }); await p.waitForTimeout(500); mark('ready');
  await p.waitForTimeout(2200);
  await tap(p.getByRole('button', { name: /Download file/ }).first().or(p.getByText('Download file').first()), 600).catch(() => {}); mark('downloadTap');
  await p.waitForTimeout(900);
};

await scenario('compress-v7', compress('samples/story/Final_FINAL_v7.pdf'));
await scenario('compress-resume', compress('samples/story/Resume_scan_final.pdf'));
await scenario('merge-story', async (p, { mark, tap }) => {
  await p.goto(BASE + '/merge-pdf', { waitUntil: 'networkidle' }); await p.waitForTimeout(1100); mark('loaded');
  await p.evaluate(() => window.scrollTo({ top: 60, behavior: 'smooth' })); await p.waitForTimeout(700);
  mark('chooseTap');
  await p.setInputFiles('input[type=file]', ['samples/Invoice-2041.pdf', 'samples/Q3-Report.pdf', 'samples/Contract.pdf']);
  await p.waitForFunction(() => document.querySelectorAll('.merge-preview-paper img').length >= 3, null, { timeout: 30000 }); await p.waitForTimeout(1200); mark('filesIn');
  await tap(p.getByRole('button', { name: /Merge PDFs/ }).first(), 300); mark('mergeTap');
  await p.getByText(/successful|is ready/).first().waitFor({ timeout: 40000 }); await p.waitForTimeout(500); mark('ready');
  await p.waitForTimeout(2200);
  await tap(p.getByText('Download file').first(), 600).catch(() => {}); mark('downloadTap');
  await p.waitForTimeout(900);
});
