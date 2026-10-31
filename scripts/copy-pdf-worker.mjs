// Keeps public/pdf.worker.min.mjs in sync with the installed pdfjs-dist.
// pdf.js refuses to run when the API and worker versions differ.
import { copyFileSync } from 'node:fs';

copyFileSync(
  new URL('../node_modules/pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  new URL('../public/pdf.worker.min.mjs', import.meta.url)
);
