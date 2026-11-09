// Fonts used by the Edit PDF editor. Each family has a metric-compatible open font (same
// character widths as the font PDFs usually name), so text measured on screen wraps and ends
// exactly where it will in the saved PDF:
//   Helvetica/Arial -> Arimo, Times -> Tinos, Courier -> Cousine,
//   Calibri -> Carlito, Cambria -> Caladea.
// Helvetica, Times and Courier are saved with the PDF's built-in fonts (identical metrics, no
// embedding). Calibri and Cambria are saved by embedding Carlito / Caladea (subset).
// Files live in /public/fonts/edit and only download when a page uses them.

import { registerDesignFonts } from '@/lib/designFonts';

export const EDIT_FONTS = [
  { id: 'Helvetica', label: 'Helvetica / Arial', file: 'arimo', css: 'Helvetica, Arial, sans-serif', builtIn: true },
  { id: 'Times', label: 'Times Roman', file: 'tinos', css: '"Times New Roman", Times, serif', builtIn: true },
  { id: 'Courier', label: 'Courier', file: 'cousine', css: '"Courier New", Courier, monospace', builtIn: true },
  { id: 'Calibri', label: 'Carlito (like Calibri)', file: 'carlito', css: 'Calibri, sans-serif', builtIn: false },
  { id: 'Cambria', label: 'Caladea (like Cambria)', file: 'caladea', css: 'Cambria, serif', builtIn: false },
];

export const getEditFont = (id) => EDIT_FONTS.find((f) => f.id === id) || EDIT_FONTS[0];

/** Closest editor family for a font name found in a PDF ("ABCDEF+Calibri-Bold", "TimesNewRomanPSMT", ...). */
export function editFamily(fontName = '') {
  const f = String(fontName).toLowerCase();
  if (/calibri|carlito/.test(f)) return 'Calibri';
  if (/cambria|caladea/.test(f)) return 'Cambria';
  if (/courier|mono|consolas|menlo|typewriter|lucida console|cousine/.test(f)) return 'Courier';
  if (/times|serif|georgia|garamond|palatino|bookman|minion|century|baskerville|didot|tinos/.test(f) && !/sans/.test(f)) {
    return 'Times';
  }
  return 'Helvetica';
}

/** URL of one style of a family's font file. */
export const editFontUrl = (id, bold, italic) =>
  `/fonts/edit/${getEditFont(id).file}-latin-${bold ? 700 : 400}-${italic ? 'italic' : 'normal'}.woff`;

const faceName = (id) => `EF ${getEditFont(id).id}`;

/** CSS font-family for an editor family: the matching font, then system lookalikes and script fallbacks. */
export const cssFontStack = (id) =>
  `'${faceName(id)}', ${getEditFont(id).css}`.replace(/, (sans-serif|serif|monospace)$/, ", 'DS Fallback', $1");

/**
 * CSS font-family for a styled run: the PDF's own font first (pdf.js registers it on the page under
 * its font id), then the editor family for any letter that font lacks.
 */
export const cssRunFamily = (family, fontId) => (fontId ? `'${fontId}', ${cssFontStack(family)}` : cssFontStack(family));

let registered = false;

/** Registers every face with document.fonts; nothing downloads until text uses it. */
export function registerEditFonts() {
  if (registered || typeof document === 'undefined' || typeof FontFace === 'undefined') return;
  registered = true;
  registerDesignFonts(); // provides 'DS Fallback' (Cyrillic, Greek, Arabic, Hebrew, Devanagari...)
  for (const f of EDIT_FONTS) {
    for (const bold of [false, true]) {
      for (const italic of [false, true]) {
        document.fonts.add(new FontFace(faceName(f.id), `url(${editFontUrl(f.id, bold, italic)})`, {
          weight: bold ? '700' : '400',
          style: italic ? 'italic' : 'normal',
        }));
      }
    }
  }
}

/** Waits until a family/style is loaded, so canvas measurements use the real font. */
export async function loadEditFont(id, bold, italic) {
  registerEditFonts();
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  try {
    await document.fonts.load(`${italic ? 'italic ' : ''}${bold ? 700 : 400} 16px '${faceName(id)}'`);
  } catch {
    // measuring with a fallback font is still close
  }
}
