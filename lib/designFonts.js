// Fonts offered by the Create PDF designer. The same files draw the on-screen page and get
// embedded in the PDF, so both use identical glyphs and widths. Registered with the FontFace API
// under a "DS " prefix so they can never change the look of the rest of the site.

export const DESIGN_FONTS = [
  { id: 'Inter', slug: 'inter', bold: true, italic: true },
  { id: 'Poppins', slug: 'poppins', bold: true, italic: true },
  { id: 'Montserrat', slug: 'montserrat', bold: true, italic: true },
  { id: 'Oswald', slug: 'oswald', bold: true, italic: false },
  { id: 'Bebas Neue', slug: 'bebas-neue', bold: false, italic: false },
  { id: 'Playfair Display', slug: 'playfair-display', bold: true, italic: true },
  { id: 'Lora', slug: 'lora', bold: true, italic: true },
  { id: 'Dancing Script', slug: 'dancing-script', bold: true, italic: false },
];

const FALLBACK_FAMILY = 'DS Fallback';

// Characters the display fonts lack: same Noto files the PDF export falls back to.
const FALLBACK_FACES = [
  { file: (w) => `noto-sans-devanagari-devanagari-${w}-normal.woff`, range: 'U+0900-097F,U+1CD0-1CFF,U+A8E0-A8FF' },
  { file: (w) => `noto-sans-arabic-arabic-${w}-normal.woff`, range: 'U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF' },
  { file: (w) => `noto-sans-hebrew-hebrew-${w}-normal.woff`, range: 'U+0590-05FF,U+FB1D-FB4F' },
  { file: (w) => `noto-sans-latin-ext-${w}-normal.woff`, range: 'U+0100-02AF,U+1E00-1E9F,U+2020,U+20A0-20AA,U+20AC-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF' },
  { file: (w) => `noto-sans-vietnamese-${w}-normal.woff`, range: 'U+1EA0-1EF9,U+20AB' },
  { file: (w) => `noto-sans-cyrillic-${w}-normal.woff`, range: 'U+0400-052F,U+2116' },
  { file: (w) => `noto-sans-greek-${w}-normal.woff`, range: 'U+0370-03FF,U+1F00-1FFF' },
];

export const getFont = (id) => DESIGN_FONTS.find((f) => f.id === id) || DESIGN_FONTS[0];
const family = (id) => `DS ${getFont(id).id}`;

/** CSS font-family for an element's font, including script fallbacks. */
export const fontStack = (id) => `'${family(id)}', '${FALLBACK_FAMILY}', sans-serif`;

/** URL of the font file for a font and style. Assumes the style exists: check with getFont(). */
export const fontFileUrl = (id, bold, italic) =>
  `/fonts/design/${getFont(id).slug}-latin-${bold ? 700 : 400}-${italic ? 'italic' : 'normal'}.woff`;

let registered = false;

/** Adds every face to document.fonts. They only download once something on the page uses them. */
export function registerDesignFonts() {
  if (registered || typeof document === 'undefined' || typeof FontFace === 'undefined') return;
  registered = true;
  const add = (name, url, descriptors) => document.fonts.add(new FontFace(name, `url(${url})`, descriptors));
  for (const f of DESIGN_FONTS) {
    for (const bold of f.bold ? [false, true] : [false]) {
      for (const italic of f.italic ? [false, true] : [false]) {
        add(family(f.id), fontFileUrl(f.id, bold, italic), { weight: bold ? '700' : '400', style: italic ? 'italic' : 'normal' });
      }
    }
  }
  for (const face of FALLBACK_FACES) {
    for (const w of [400, 700]) add(FALLBACK_FAMILY, `/fonts/${face.file(w)}`, { weight: String(w), unicodeRange: face.range });
  }
}

/** Waits until the fonts needed to draw `text` are ready, so measuring it gives final widths. */
export async function loadFontsFor(id, bold, italic, text) {
  registerDesignFonts();
  const spec = `${italic ? 'italic ' : ''}${bold ? 700 : 400} 16px '${family(id)}', '${FALLBACK_FAMILY}'`;
  await document.fonts.load(spec, text || 'A');
}
