// Copies the Noto font files the editor/converters need for Arabic, Hebrew and CJK text into
// public/fonts, and writes public/fonts/cjk/index.json (which slice covers which characters).
// Run manually after changing the @fontsource dev dependencies: node scripts/build-script-fonts.mjs
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const NM = new URL('../node_modules/@fontsource/', import.meta.url);
const OUT = new URL('../public/fonts/', import.meta.url);
mkdirSync(new URL('cjk/', OUT), { recursive: true });

// Arabic / Hebrew: a single script subset in regular + bold.
for (const [pkg, subset] of [['noto-sans-arabic', 'arabic'], ['noto-sans-hebrew', 'hebrew']]) {
  for (const w of [400, 700]) {
    const name = `${pkg}-${subset}-${w}-normal.woff`;
    copyFileSync(new URL(`${pkg}/files/${name}`, NM), new URL(name, OUT));
  }
}

// CJK: regular weight only (bold is simulated), sliced by unicode-range.
const index = {};
for (const [key, pkg] of [['sc', 'noto-sans-sc'], ['jp', 'noto-sans-jp'], ['kr', 'noto-sans-kr']]) {
  const css = readFileSync(new URL(`${pkg}/400.css`, NM), 'utf8');
  const slices = [];
  for (const block of css.split('@font-face').slice(1)) {
    const file = /url\(\.\/files\/([^)]+?\.woff2)\)/.exec(block)?.[1];
    const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1];
    if (!file || !range) continue;
    const r = range.split(',').map((s) => {
      const [lo, hi] = s.trim().replace(/^U\+/i, '').split('-');
      return [parseInt(lo, 16), parseInt(hi || lo, 16)];
    });
    copyFileSync(new URL(`${pkg}/files/${file}`, NM), new URL(`cjk/${file}`, OUT));
    slices.push({ f: file, r });
  }
  index[key] = slices;
}
writeFileSync(new URL('cjk/index.json', OUT), JSON.stringify(index));
const n = readdirSync(new URL('cjk/', OUT)).length;
console.log(`copied ${n} CJK files`);

// Create PDF designer: display fonts (Latin subset; anything else falls back to the Noto files above).
mkdirSync(new URL('design/', OUT), { recursive: true });
for (const pkg of ['inter', 'poppins', 'montserrat', 'oswald', 'bebas-neue', 'playfair-display', 'lora', 'dancing-script']) {
  for (const name of readdirSync(new URL(`${pkg}/files/`, NM))) {
    if (new RegExp(`^${pkg}-latin-(400|700)-(normal|italic)\.woff$`).test(name)) {
      copyFileSync(new URL(`${pkg}/files/${name}`, NM), new URL(`design/${name}`, OUT));
    }
  }
}
