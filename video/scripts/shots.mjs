// Crisp still screenshots of the real app for the "Airy" launch video (3D-tilted UI planes).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = 'http://localhost:3030';
const OUT = 'public/shots';
fs.mkdirSync(OUT, { recursive: true });
const HIDE = 'nextjs-portal,#__next-build-watcher,[data-nextjs-toast]{display:none!important}';

const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = async (vp, scale = 2, extra = {}) => {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: scale, ...extra });
  const p = await ctx.newPage();
  p.on('load', () => p.addStyleTag({ content: HIDE }).catch(() => {}));
  return p;
};
const D = { width: 1440, height: 900 };

{ // home: hero + full page
  const p = await page(D);
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.addStyleTag({ content: HIDE }); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/home.png` });
  await p.screenshot({ path: `${OUT}/home-full.png`, fullPage: true });
  await p.context().close();
}
{ // merge with files, then result
  const p = await page(D);
  await p.goto(BASE + '/merge-pdf', { waitUntil: 'networkidle' }); await p.addStyleTag({ content: HIDE }); await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/merge-empty.png` });
  await p.setInputFiles('input[type=file]', ['samples/Q3-Report.pdf', 'samples/Invoice-2041.pdf', 'samples/Contract.pdf']);
  await p.waitForFunction(() => document.querySelectorAll('.merge-preview-paper img').length >= 3, null, { timeout: 30000 }); await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/merge-files.png` });
  await p.getByRole('button', { name: /Merge PDFs/ }).first().click();
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `${OUT}/merge-done.png` });
  await p.context().close();
}
{ // compress result
  const p = await page(D);
  await p.goto(BASE + '/compress-pdf', { waitUntil: 'networkidle' }); await p.addStyleTag({ content: HIDE }); await p.waitForTimeout(800);
  await p.setInputFiles('input[type=file]', ['samples/Big-Scan.pdf']); await p.waitForTimeout(2200);
  await p.screenshot({ path: `${OUT}/compress-file.png` });
  await p.getByRole('button', { name: /Maximum Compression/ }).click(); await p.waitForTimeout(400);
  await p.getByRole('button', { name: /Compress PDF/ }).first().click();
  await p.waitForTimeout(8000);
  await p.screenshot({ path: `${OUT}/compress-done.png` });
  await p.context().close();
}
{ // split with a file
  const p = await page(D);
  await p.goto(BASE + '/split-pdf', { waitUntil: 'networkidle' }); await p.addStyleTag({ content: HIDE }); await p.waitForTimeout(800);
  await p.setInputFiles('input[type=file]', ['samples/Q3-Report.pdf']); await p.waitForTimeout(3000);
  await p.screenshot({ path: `${OUT}/split-file.png` });
  await p.context().close();
}
{ // mobile
  const p = await page({ width: 390, height: 844 }, 3, { hasTouch: true, isMobile: true });
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.addStyleTag({ content: HIDE }); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/mobile.png` });
  await p.screenshot({ path: `${OUT}/mobile-full.png`, fullPage: true });
  await p.mouse.wheel(0, 700); await p.evaluate(() => window.scrollBy(0, 700)); await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/mobile-tools.png` });
  await p.context().close();
}
await b.close();
console.log('shots done');
