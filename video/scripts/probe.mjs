import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
for (const [u, n] of [['/', 'home'], ['/merge-pdf', 'merge'], ['/compress-pdf', 'compress']]) {
  await p.goto('http://localhost:3030' + u, { waitUntil: 'networkidle' });
  await p.screenshot({ path: `footage/probe-${n}.png` });
}
await p.goto('http://localhost:3030/merge-pdf', { waitUntil: 'networkidle' });
await p.setInputFiles('input[type=file]', ['samples/Q3-Report.pdf', 'samples/Invoice-2041.pdf', 'samples/Contract.pdf']);
await p.waitForTimeout(2500);
await p.screenshot({ path: 'footage/probe-merge2.png' });
console.log(await p.$$eval('button', (bs) => bs.map((x) => x.innerText.trim()).filter(Boolean).slice(0, 30)));
await b.close();
