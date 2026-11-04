import { sectionsToPdf, materializeGeneratedContent } from '@/lib/domToPdf';

const isZip = (bytes) => bytes[0] === 0x50 && bytes[1] === 0x4b;

/** Render a .docx with docx-preview into `container` (a visible, laid-out element). */
export async function renderDocx(arrayBuffer, container) {
  if (!isZip(new Uint8Array(arrayBuffer, 0, 4))) {
    throw new Error('This looks like a legacy .doc file. Please save it as .docx in Word and try again.');
  }
  const { renderAsync } = await import('docx-preview');
  await renderAsync(arrayBuffer, container, undefined, {
    className: 'docx',
    inWrapper: true,
    breakPages: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    useBase64URL: true,
    experimental: true, // enables tab-stop positioning (left/center/right tabs, TOC-style lines)
  });
  if (document.fonts?.ready) await document.fonts.ready;
  // docx-preview positions tab stops in a 500ms timer after rendering; wait for it to finish.
  await new Promise((resolve) => setTimeout(resolve, 700));
  return [...container.querySelectorAll('section.docx')];
}

/**
 * Convert a .docx File/ArrayBuffer to PDF bytes, keeping page size, margins,
 * fonts, colours, tables, images, headers and footers.
 */
export async function wordToPdf(file, { onProgress } = {}) {
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();

  // Off-screen but laid out (not display:none), so geometry is real.
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;width:auto;pointer-events:none;';
  document.body.appendChild(host);
  try {
    onProgress?.(15);
    const sections = await renderDocx(buffer, host);
    if (!sections.length) throw new Error('No pages found in this document.');
    onProgress?.(40);
    const restore = materializeGeneratedContent(sections);
    try {
      return await sectionsToPdf(sections, {
        onProgress: (done, total) => onProgress?.(40 + Math.round((done / total) * 55)),
      });
    } finally {
      restore();
    }
  } finally {
    host.remove();
  }
}
