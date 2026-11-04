// Keeps public/pdf.worker.min.mjs in sync with the installed pdfjs-dist.
// pdf.js refuses to run when the API and worker versions differ.
import { copyFileSync, cpSync } from 'node:fs';

copyFileSync(
  new URL('../node_modules/pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  new URL('../public/pdf.worker.min.mjs', import.meta.url)
);

// Standard-14 font programs, so unembedded fonts (Helvetica, Times...) render and report correctly.
cpSync(
  new URL('../node_modules/pdfjs-dist/standard_fonts/', import.meta.url),
  new URL('../public/pdfjs/standard_fonts/', import.meta.url),
  { recursive: true }
);

// Character maps, so text in fonts that use predefined encodings (common in Indic and CJK PDFs) decodes correctly.
cpSync(
  new URL('../node_modules/pdfjs-dist/cmaps/', import.meta.url),
  new URL('../public/pdfjs/cmaps/', import.meta.url),
  { recursive: true }
);
