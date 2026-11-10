// Full-page screenshots with scroll-reveal animations completed (scrolls through the page first).
import { chromium } from 'playwright-core';
const HIDE = 'nextjs-portal,#__next-build-watcher,[data-nextjs-toast]{display:none!important} *,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
async function full(vp, scale, out, extra = {}) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: scale, ...extra });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3030/', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: HIDE });
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += Math.round(vp.height * 0.5)) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(250); }
  await p.waitForTimeout(800);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
  await p.screenshot({ path: out, fullPage: true });
  await ctx.close();
}
await full({ width: 1440, height: 900 }, 2, 'public/shots/home-full.png');
await full({ width: 390, height: 844 }, 3, 'public/shots/mobile-full.png', { hasTouch: true, isMobile: true });
await b.close();
console.log('full shots done');
