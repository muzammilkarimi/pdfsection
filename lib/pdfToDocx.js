import { getPdfjs } from '@/lib/renderUtils';
import { extractDocumentLayout } from '@/lib/pdfLayout';
import { buildDocx, canvasMeasure } from '@/lib/docxBuilder';
import { detectTables } from '@/lib/pdfTables';

/**
 * Convert a loaded pdf.js document to a .docx that keeps the PDF's page layout.
 * @returns {{ blob: Blob, warnings: string[] }}
 */
export async function pdfToDocx(pdfDoc, { title, onProgress } = {}) {
  const pdfjs = await getPdfjs();
  const pages = await extractDocumentLayout(pdfDoc, pdfjs, {}, (done, total) =>
    onProgress?.(Math.round((done / total) * 85))
  );
  pages.forEach((page) => detectTables(page));
  const blob = await buildDocx(pages, { title, measureText: canvasMeasure() });
  onProgress?.(95);
  const warnings = [...new Set(pages.flatMap((p) => p.warnings))];
  return { blob, warnings };
}
