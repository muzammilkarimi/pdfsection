// PDF utility helpers â€” wraps pdf-lib for common operations
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

/**
 * Load a PDFDocument from a File or ArrayBuffer
 */
export async function loadPdf(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else {
    arrayBuffer = fileOrBuffer;
  }
  return PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
}

/**
 * Save a PDFDocument and return as Uint8Array
 */
export async function savePdf(pdfDoc) {
  return pdfDoc.save();
}

/**
 * Save a PDFDocument and trigger browser download
 */
export async function downloadPdf(pdfDoc, filename = 'output.pdf') {
  const bytes = await savePdf(pdfDoc);
  downloadBlob(bytes, filename, 'application/pdf');
}

/**
 * Download a Blob/Uint8Array as a file
 */
export function downloadBlob(data, filename, mimeType = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Merge multiple PDF files into one
 */
export async function mergePdfs(files) {
  const mergedDoc = await PDFDocument.create();

  for (const file of files) {
    const srcDoc = await loadPdf(file);
    const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    pages.forEach((page) => mergedDoc.addPage(page));
  }

  return mergedDoc;
}

/**
 * Split a PDF into multiple documents by page ranges
 * @param {PDFDocument} srcDoc - Source PDF
 * @param {Array<[number, number]>} ranges - Array of [start, end] (0-indexed, inclusive)
 * @returns {Array<PDFDocument>}
 */
export async function splitPdf(srcDoc, ranges) {
  const results = [];

  for (const [start, end] of ranges) {
    const newDoc = await PDFDocument.create();
    const indices = [];
    for (let i = start; i <= end && i < srcDoc.getPageCount(); i++) {
      indices.push(i);
    }
    const pages = await newDoc.copyPages(srcDoc, indices);
    pages.forEach((page) => newDoc.addPage(page));
    results.push(newDoc);
  }

  return results;
}

/**
 * Split a PDF into individual pages
 */
export async function splitPdfIntoPages(srcDoc) {
  const results = [];
  const pageCount = srcDoc.getPageCount();

  for (let i = 0; i < pageCount; i++) {
    const newDoc = await PDFDocument.create();
    const [page] = await newDoc.copyPages(srcDoc, [i]);
    newDoc.addPage(page);
    results.push(newDoc);
  }

  return results;
}

/**
 * Remove pages from a PDF
 * @param {PDFDocument} srcDoc - Source PDF
 * @param {number[]} pageIndices - 0-indexed page indices to REMOVE
 */
export async function removePages(srcDoc, pageIndicesToRemove) {
  const newDoc = await PDFDocument.create();
  const allIndices = srcDoc.getPageIndices();
  const keepIndices = allIndices.filter((i) => !pageIndicesToRemove.includes(i));

  if (keepIndices.length === 0) throw new Error('Cannot remove all pages');

  const pages = await newDoc.copyPages(srcDoc, keepIndices);
  pages.forEach((page) => newDoc.addPage(page));

  return newDoc;
}

/**
 * Extract specific pages from a PDF
 * @param {PDFDocument} srcDoc - Source PDF
 * @param {number[]} pageIndices - 0-indexed page indices to EXTRACT
 */
export async function extractPages(srcDoc, pageIndicesToExtract) {
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, pageIndicesToExtract);
  pages.forEach((page) => newDoc.addPage(page));
  return newDoc;
}

/**
 * Reorder pages in a PDF
 * @param {PDFDocument} srcDoc - Source PDF
 * @param {number[]} newOrder - Array of 0-indexed page indices in new order
 */
export async function reorderPages(srcDoc, newOrder) {
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, newOrder);
  pages.forEach((page) => newDoc.addPage(page));
  return newDoc;
}

/**
 * Rotate pages in a PDF
 * @param {PDFDocument} srcDoc - Source PDF
 * @param {number[]} pageIndices - 0-indexed page indices to rotate
 * @param {number} angle - Rotation angle (90, 180, 270)
 */
export async function rotatePages(srcDoc, pageIndices, angle) {
  const newDoc = await PDFDocument.create();
  const allPages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());

  allPages.forEach((page, i) => {
    if (pageIndices.includes(i)) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + angle));
    }
    newDoc.addPage(page);
  });

  return newDoc;
}

/**
 * Add page numbers to a PDF
 */
export async function addPageNumbers(srcDoc, options = {}) {
  const {
    position = 'bottom-center', // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
    startNumber = 1,
    fontSize = 12,
    margin = 30,
    format = 'number', // 'number', 'pageOfTotal', 'roman'
  } = options;

  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
  const font = await newDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pages.length;

  pages.forEach((page, i) => {
    newDoc.addPage(page);
    const cropBox = page.getCropBox();
    const visibleX = cropBox.x || 0;
    const visibleY = cropBox.y || 0;
    const visibleWidth = cropBox.width;
    const visibleHeight = cropBox.height;
    const pageNum = i + startNumber;

    let text;
    if (format === 'pageOfTotal') {
      text = `${pageNum} of ${totalPages + startNumber - 1}`;
    } else if (format === 'roman') {
      text = toRoman(pageNum);
    } else {
      text = `${pageNum}`;
    }

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize, { descender: false });
    let x, y;

    if (position.includes('left')) {
      x = visibleX + margin;
    } else if (position.includes('right')) {
      x = visibleX + visibleWidth - textWidth - margin;
    } else {
      x = visibleX + (visibleWidth - textWidth) / 2;
    }

    if (position.includes('top')) {
      y = visibleY + visibleHeight - margin - textHeight;
    } else {
      y = visibleY + margin;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  return newDoc;
}

/**
 * Convert integer to Roman numeral
 */
function toRoman(num) {
  const romanMap = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  for (const [value, symbol] of romanMap) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

/**
 * Add text watermark to all pages
 */
export async function addTextWatermark(srcDoc, options = {}) {
  const {
    text = 'WATERMARK',
    fontSize = 48,
    opacity = 0.15,
    rotation = -45,
    color = { r: 0.5, g: 0.5, b: 0.5 },
  } = options;

  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
  const font = await newDoc.embedFont(StandardFonts.HelveticaBold);

  pages.forEach((page) => {
    newDoc.addPage(page);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  });

  return newDoc;
}

/**
 * Compress PDF by copying pages (removes unused objects)
 * Note: True compression is limited in client-side JS
 */
export async function compressPdf(srcDoc) {
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
  pages.forEach((page) => newDoc.addPage(page));

  // Copy metadata
  const title = srcDoc.getTitle();
  if (title) newDoc.setTitle(title);

  return newDoc;
}

/**
 * Get page count from a file without fully loading the document
 */
export async function getPageCount(file) {
  const doc = await loadPdf(file);
  return doc.getPageCount();
}

/**
 * Get PDF metadata
 */
export async function getPdfMetadata(file) {
  const doc = await loadPdf(file);
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle() || 'Untitled',
    author: doc.getAuthor() || 'Unknown',
    subject: doc.getSubject() || '',
    creator: doc.getCreator() || '',
    producer: doc.getProducer() || '',
    pages: doc.getPages().map((page, i) => {
      const { width, height } = page.getSize();
      return { index: i, width, height, rotation: page.getRotation().angle };
    }),
  };
}

