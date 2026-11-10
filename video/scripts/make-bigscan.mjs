import { chromium } from 'playwright-core';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('D:/pdfsection/package.json');
const { PDFDocument } = require('pdf-lib');
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
const pdf = await PDFDocument.create();
for (let i = 0; i < 8; i++) {
  const b64 = await p.evaluate((seed) => {
    const c = document.createElement('canvas'); c.width = 1654; c.height = 2339; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 1654, 2339); g.addColorStop(0, '#f4f1ea'); g.addColorStop(1, '#d9d2c3'); x.fillStyle = g; x.fillRect(0, 0, 1654, 2339);
    const d = x.getImageData(0, 0, 1654, 2339); let s = seed * 9301 + 49297;
    for (let k = 0; k < d.data.length; k += 4) { s = (s * 9301 + 49297) % 233280; const n = (s / 233280 - 0.5) * 70; d.data[k] += n; d.data[k + 1] += n; d.data[k + 2] += n; }
    x.putImageData(d, 0, 0); x.fillStyle = '#2a2a33'; x.font = 'bold 90px serif'; x.fillText('SCANNED DOCUMENT ' + (seed + 1), 120, 200);
    for (let l = 0; l < 40; l++) x.fillRect(120, 300 + l * 48, 1400 - ((l * 83) % 400), 14);
    return c.toDataURL('image/jpeg', 0.97).split(',')[1];
  }, i);
  const img = await pdf.embedJpg(Buffer.from(b64, 'base64'));
  const page = pdf.addPage([595, 842]); page.drawImage(img, { x: 0, y: 0, width: 595, height: 842 });
}
fs.writeFileSync('samples/Big-Scan.pdf', await pdf.save());
console.log((fs.statSync('samples/Big-Scan.pdf').size / 1e6).toFixed(1) + ' MB');
await b.close();
