import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('D:/pdfsection/package.json');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const docs = [['Q3 Report', 6, [0.37, 0.42, 0.82]], ['Invoice 2041', 3, [0.13, 0.7, 0.55]], ['Contract', 5, [0.9, 0.35, 0.5]], ['Big Scan', 14, [0.3, 0.3, 0.4]]];
for (const [name, pages, c] of docs) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const p = pdf.addPage([595, 842]);
    p.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: rgb(...c) });
    p.drawText(name, { x: 40, y: 780, size: 30, font, color: rgb(1, 1, 1) });
    p.drawText(`Page ${i + 1}`, { x: 480, y: 784, size: 16, font: reg, color: rgb(1, 1, 1) });
    for (let l = 0; l < 22; l++) p.drawRectangle({ x: 40, y: 690 - l * 28, width: 515 - (l * 37 % 150), height: 10, color: rgb(0.86, 0.87, 0.93) });
    if (name === 'Big Scan') for (let k = 0; k < 400; k++) p.drawRectangle({ x: (k * 53) % 560, y: (k * 97) % 700, width: 30, height: 30, color: rgb((k % 7) / 7, (k % 5) / 5, (k % 3) / 3), opacity: 0.4 });
  }
  fs.writeFileSync(`samples/${name.replace(/ /g, '-')}.pdf`, await pdf.save());
}
console.log('ok');
