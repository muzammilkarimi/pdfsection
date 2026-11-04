// Unicode fallback for the PDF editor. The built-in PDF fonts only cover WinAnsi, so text
// with Cyrillic, Greek, Central European or Vietnamese letters would otherwise become "?".
// Noto Sans subsets are served from /fonts and fetched only when a character needs them;
// everything is embedded (subset) into the PDF locally.

import 'regenerator-runtime/runtime'; // fontkit's Indic shaper expects this global
import fontkit from '@pdf-lib/fontkit';

const SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'vietnamese'];

const DEVANAGARI = /[\u0900-\u097F\u1CD0-\u1CFF\uA8E0-\uA8FF]/;
const isDeva = (ch) => DEVANAGARI.test(ch);

// Devanagari needs real shaping (conjuncts, vowel signs, mark positioning), which PDF text
// operators can't do. We shape with fontkit and draw each glyph outline as a vector path.
export function createOutlineFont(kit) {
  const s = (size) => size / kit.unitsPerEm;
  return {
    isOutline: true,
    widthOfTextAtSize(text, size) {
      const { positions } = kit.layout(text);
      return positions.reduce((w, p) => w + p.xAdvance, 0) * s(size);
    },
    /** SVG path (y down, origin at the baseline start) for `text` at `size` points. */
    path(text, size) {
      const { glyphs, positions } = kit.layout(text);
      const k = s(size);
      let pen = 0;
      let d = '';
      glyphs.forEach((g, i) => {
        const pos = positions[i];
        const ox = pen + pos.xOffset * k;
        const oy = pos.yOffset * k;
        const X = (x) => (ox + x * k).toFixed(3);
        const Y = (y) => (-(oy + y * k)).toFixed(3);
        for (const c of g.path.commands) {
          const a = c.args;
          if (c.command === 'moveTo') d += `M${X(a[0])} ${Y(a[1])}`;
          else if (c.command === 'lineTo') d += `L${X(a[0])} ${Y(a[1])}`;
          else if (c.command === 'quadraticCurveTo') d += `Q${X(a[0])} ${Y(a[1])} ${X(a[2])} ${Y(a[3])}`;
          else if (c.command === 'bezierCurveTo') d += `C${X(a[0])} ${Y(a[1])} ${X(a[2])} ${Y(a[3])} ${X(a[4])} ${Y(a[5])}`;
          else if (c.command === 'closePath') d += 'Z';
        }
        pen += pos.xAdvance * k;
      });
      return d;
    },
  };
}

const styleKey = (bold, italic) => `${bold ? 700 : 400}-${italic ? 'italic' : 'normal'}`;

// Scripts drawn as shaped vector outlines (they need real shaping / bidi / huge fonts).
const SCRIPTS = [
  { id: 'deva', test: /[ऀ-ॿ᳐-᳿꣠-ꣿ]/, file: (w) => `noto-sans-devanagari-devanagari-${w}-normal.woff` },
  { id: 'arab', test: /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/, file: (w) => `noto-sans-arabic-arabic-${w}-normal.woff`, rtl: true },
  { id: 'hebr', test: /[֐-׿יִ-ﭏ]/, file: (w) => `noto-sans-hebrew-hebrew-${w}-normal.woff`, rtl: true },
];
const CJK = /[⺀-⿟　-ヿ㄀-ㄯ㆐-ㇿ㐀-䶿一-鿿豈-﫿＀-￯가-힯ᄀ-ᇿ]/;
const KANA = /[぀-ヿ]/;
const HANGUL = /[가-힯ᄀ-ᇿ]/;

const scriptOf = (ch) => {
  for (const s of SCRIPTS) if (s.test.test(ch)) return s.id;
  return CJK.test(ch) ? 'cjk' : 'latin';
};
const RTL_RE = /[֐-׿؀-ۿݐ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿]/;

/** True when most letters of `text` are right-to-left (Arabic, Hebrew). */
export function isRtlDominant(text) {
  let rtl = 0, other = 0;
  for (const ch of text) {
    if (RTL_RE.test(ch)) rtl++;
    else if (/\p{L}/u.test(ch)) other++;
  }
  return rtl > 0 && rtl >= other;
}

export function createUnicodeFallback(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);
  const files = new Map(); // key -> Promise<{ kit, pdfFont } | null>
  const loaded = new Map(); // styleKey -> [{ kit, pdfFont }] in preference order
  const outlines = new Map(); // `${script}-${weight}` -> outline font
  const cjk = { lang: 'sc', index: null, kits: new Map(), fonts: new Map() };

  const fetchBytes = async (url) => {
    try {
      const res = await fetch(url);
      return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
    } catch {
      return null;
    }
  };

  const load = (subset, bold, italic) => {
    const key = `${subset}-${styleKey(bold, italic)}`;
    if (!files.has(key)) {
      files.set(
        key,
        (async () => {
          const bytes = await fetchBytes(`/fonts/noto-sans-${subset}-${styleKey(bold, italic)}.woff`);
          return bytes ? { kit: fontkit.create(bytes), bytes, pdfFont: null } : null;
        })()
      );
    }
    return files.get(key);
  };

  // CJK: one font program per unicode-range slice; each character is looked up by code point.
  const langOrder = () => [cjk.lang, ...['sc', 'jp', 'kr'].filter((l) => l !== cjk.lang)];
  const sliceIn = (lang, cp) => cjk.index?.[lang]?.find((s) => s.r.some(([lo, hi]) => cp >= lo && cp <= hi))?.f || null;
  // the preferred language's font first, then the others (e.g. simplified hanzi missing from the Korean font)
  const sliceFor = (cp) => { for (const l of langOrder()) { const f = sliceIn(l, cp); if (f) return f; } return null; };
  const cjkFont = (bold) => {
    if (!cjk.fonts.has(bold)) {
      const kitOf = (ch) => cjk.kits.get(sliceFor(ch.codePointAt(0)));
      cjk.fonts.set(bold, {
        isOutline: true,
        synthBold: bold, // only the regular weight is bundled; bold is simulated with an outline
        widthOfTextAtSize(text, size) {
          let w = 0;
          for (const ch of text) { const k = kitOf(ch); if (k) w += k.layout(ch).positions[0].xAdvance * (size / k.unitsPerEm); }
          return w;
        },
        path(text, size) {
          let d = '', pen = 0;
          for (const ch of text) {
            const k = kitOf(ch);
            if (!k) continue;
            const { glyphs, positions } = k.layout(ch);
            const sc = size / k.unitsPerEm;
            for (const c of glyphs[0].path.commands) {
              const a = c.args, X = (x) => (pen + x * sc).toFixed(3), Y = (y) => (-y * sc).toFixed(3);
              if (c.command === 'moveTo') d += `M${X(a[0])} ${Y(a[1])}`;
              else if (c.command === 'lineTo') d += `L${X(a[0])} ${Y(a[1])}`;
              else if (c.command === 'quadraticCurveTo') d += `Q${X(a[0])} ${Y(a[1])} ${X(a[2])} ${Y(a[3])}`;
              else if (c.command === 'bezierCurveTo') d += `C${X(a[0])} ${Y(a[1])} ${X(a[2])} ${Y(a[3])} ${X(a[4])} ${Y(a[5])}`;
              else if (c.command === 'closePath') d += 'Z';
            }
            pen += positions[0].xAdvance * sc;
          }
          return d;
        },
      });
    }
    return cjk.fonts.get(bold);
  };

  return {
    /** Make sure every character of `text` that some bundled font can draw has its font loaded. */
    async prepare(text, bold, italic) {
      const k = styleKey(bold, italic);
      const list = loaded.get(k) || [];
      loaded.set(k, list);
      const chars = [...text];
      const w = bold ? 700 : 400;

      for (const s of SCRIPTS) {
        if (!chars.some((c) => s.test.test(c)) || outlines.has(`${s.id}-${w}`)) continue;
        const bytes = await fetchBytes(`/fonts/${s.file(w)}`);
        if (bytes) outlines.set(`${s.id}-${w}`, createOutlineFont(fontkit.create(bytes)));
      }

      const cjkChars = chars.filter((c) => CJK.test(c));
      if (cjkChars.length) {
        cjk.lang = chars.some((c) => KANA.test(c)) ? 'jp' : chars.some((c) => HANGUL.test(c)) ? 'kr' : 'sc';
        if (!cjk.index) cjk.index = await (async () => { try { return await (await fetch('/fonts/cjk/index.json')).json(); } catch { return {}; } })();
        for (const ch of new Set(cjkChars)) {
          const f = sliceFor(ch.codePointAt(0));
          if (f && !cjk.kits.has(f)) {
            const bytes = await fetchBytes(`/fonts/cjk/${f}`);
            if (bytes) cjk.kits.set(f, fontkit.create(bytes));
          }
        }
      }

      const remaining = new Set(chars.filter((c) => scriptOf(c) === 'latin').map((c) => c.codePointAt(0)).filter((cp) => cp > 32));
      for (const entry of list) for (const cp of [...remaining]) if (entry.kit.hasGlyphForCodePoint(cp)) remaining.delete(cp);
      for (const subset of SUBSETS) {
        if (!remaining.size) break;
        const font = await load(subset, bold, italic);
        if (!font) continue;
        const hits = [...remaining].filter((cp) => font.kit.hasGlyphForCodePoint(cp));
        if (!hits.length) continue;
        if (!font.pdfFont) font.pdfFont = await pdfDoc.embedFont(font.bytes, { subset: true });
        if (!list.includes(font)) list.push(font);
        hits.forEach((cp) => remaining.delete(cp));
      }
    },

    /**
     * Split a line into runs that each use one loaded font (visual order: right-to-left lines
     * come back reversed). Characters nobody covers become "?".
     */
    split(text, bold, italic) {
      const list = loaded.get(styleKey(bold, italic)) || [];
      const w = bold ? 700 : 400;
      const runs = [];
      const missing = new Set();
      const chars = [...text];
      const kind = chars.map(scriptOf);
      const isNeutral = (c) => c === ' ' || c === ' ' || /[\p{Cf}\p{Cc}]/u.test(c);
      // spaces / joiners / invisible format characters follow the script of the letters around them
      const neighbour = (i, dir) => {
        for (let j = i + dir; j >= 0 && j < chars.length; j += dir) if (!isNeutral(chars[j])) return kind[j];
        return null;
      };
      const fontFor = (script) => (script === 'cjk' ? (cjk.kits.size ? cjkFont(bold) : null) : outlines.get(`${script}-${w}`) || null);

      for (let ci = 0; ci < chars.length; ci++) {
        const ch = chars[ci];
        const cp = ch.codePointAt(0);
        const isSpace = isNeutral(ch);
        let script = kind[ci];
        if (isSpace) {
          const l = neighbour(ci, -1), r = neighbour(ci, 1);
          script = l && l === r && l !== 'latin' ? l : l === null && r && r !== 'latin' ? r : r === null && l && l !== 'latin' ? l : 'latin';
        }
        if (script !== 'latin') {
          const font = fontFor(script);
          if (font) {
            const out = cp === 0xa0 ? ' ' : ch;
            const last = runs[runs.length - 1];
            if (last && last.font === font) last.text += out;
            else runs.push({ text: out, font });
            continue;
          }
          if (!isSpace && script !== 'latin') { // script font unavailable (offline?)
            missing.add(ch);
            const last = runs[runs.length - 1];
            const f = list[0]?.pdfFont || null;
            if (last && last.font === f) last.text += '?'; else runs.push({ text: '?', font: f });
            continue;
          }
        }
        if (isSpace && ch !== ' ' && cp !== 0xa0) continue; // invisible format character with no script font: drop it
        if (isSpace) { // a space between two scripts with no Latin font loaded borrows the previous run's font
          const f = list[0]?.pdfFont || runs[runs.length - 1]?.font || null;
          if (!f) continue;
          const last = runs[runs.length - 1];
          const out = ' ';
          if (last && last.font === f) last.text += out; else runs.push({ text: out, font: f });
          continue;
        }
        let font = isSpace ? list[0]?.pdfFont || null : list.find((e) => e.kit.hasGlyphForCodePoint(cp))?.pdfFont || null;
        let out = cp === 0xa0 ? ' ' : ch;
        if (!font) {
          font = list[0]?.pdfFont || null;
          out = '?';
          missing.add(ch);
        }
        const last = runs[runs.length - 1];
        if (last && last.font === font) last.text += out;
        else runs.push({ text: out, font });
      }
      if (isRtlDominant(text)) runs.reverse();
      return { runs, missing };
    },
  };
}
