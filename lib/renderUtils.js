// PDF rendering utilities using PDF.js
// Used for generating page thumbnails/previews

let pdfjsLib = null;

/**
 * Lazily load PDF.js (only when needed)
 */
async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;

  pdfjsLib = await import('pdfjs-dist');

  // Set worker source
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  return pdfjsLib;
}

/**
 * Load a PDF document for rendering
 * @param {File|ArrayBuffer|Uint8Array} source
 * @returns {PDFDocumentProxy}
 */
export async function loadPdfForRender(source) {
  const pdfjs = await getPdfjs();
  let data;

  if (source instanceof File) {
    data = await source.arrayBuffer();
  } else {
    data = source;
  }

  const loadingTask = pdfjs.getDocument({ data });
  return loadingTask.promise;
}

/**
 * Render a PDF page to a canvas element
 * @param {PDFDocumentProxy} pdfDoc
 * @param {number} pageNumber - 1-indexed
 * @param {HTMLCanvasElement} canvas
 * @param {number} scale - Render scale (default 1.0)
 */
export async function renderPageToCanvas(pdfDoc, pageNumber, canvas, scale = 1.0) {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return { width: viewport.width, height: viewport.height };
}

/**
 * Generate a thumbnail data URL for a PDF page
 * @param {File|ArrayBuffer} source - PDF file
 * @param {number} pageNumber - 1-indexed
 * @param {number} maxWidth - Max thumbnail width
 * @returns {string} Data URL (image/png)
 */
export async function generateThumbnail(source, pageNumber, maxWidth = 200) {
  const pdfDoc = await loadPdfForRender(source);
  const page = await pdfDoc.getPage(pageNumber);

  // Calculate scale to fit maxWidth
  const origViewport = page.getViewport({ scale: 1.0 });
  const scale = maxWidth / origViewport.width;
  const viewport = page.getViewport({ scale });

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  const dataUrl = canvas.toDataURL('image/png');
  pdfDoc.cleanup();

  return dataUrl;
}

/**
 * Generate thumbnails for all pages
 * @param {File} file - PDF file
 * @param {number} maxWidth - Max thumbnail width
 * @param {Function} onProgress - Called with (pageNum, total)
 * @returns {Array<{pageNumber: number, dataUrl: string, width: number, height: number}>}
 */
export async function generateAllThumbnails(file, maxWidth = 180, onProgress = null) {
  const pdfDoc = await loadPdfForRender(file);
  const totalPages = pdfDoc.numPages;
  const thumbnails = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const origViewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / origViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    thumbnails.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height,
    });

    onProgress?.(i, totalPages);
  }

  pdfDoc.cleanup();
  return thumbnails;
}

/**
 * Render a PDF page to a data URL (for JPG export)
 * @param {File|ArrayBuffer} source
 * @param {number} pageNumber - 1-indexed
 * @param {number} dpi - Output DPI (default 150)
 * @param {string} format - 'image/jpeg' or 'image/png'
 * @param {number} quality - JPEG quality 0-1
 */
export async function renderPageToImage(source, pageNumber, dpi = 150, format = 'image/jpeg', quality = 0.92) {
  const pdfDoc = await loadPdfForRender(source);
  const page = await pdfDoc.getPage(pageNumber);

  const scale = dpi / 72; // PDF default is 72 DPI
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');

  // White background for JPEG (transparent PNG doesn't need it)
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  await page.render({ canvasContext: ctx, viewport }).promise;

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, quality));
  pdfDoc.cleanup();

  return blob;
}
