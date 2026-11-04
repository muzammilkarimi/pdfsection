// Looks at files dropped on the home page and picks the tools that fit them.
// Every check runs in the browser; nothing is uploaded.
import { PDFDocument } from 'pdf-lib';
import { getToolById } from '@/lib/tools';
import { getPdfjs } from '@/lib/renderUtils';

const MB = 1024 * 1024;
const LARGE_PDF_BYTES = 10 * MB;
const LONG_PDF_PAGES = 30;
const TEXT_SAMPLE_PAGES = 3;
const MIN_TEXT_CHARS = 20;
const TEXT_CHECK_TIMEOUT_MS = 2500;
const MAX_PICKS = 4;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const OFFICE_TOOLS = {
  doc: 'word-to-pdf',
  docx: 'word-to-pdf',
  xls: 'excel-to-pdf',
  xlsx: 'excel-to-pdf',
  ppt: 'powerpoint-to-pdf',
  pptx: 'powerpoint-to-pdf',
};

// Fill PDF forms has its own page but is not in the tool registry.
const FORMS_TOOL = {
  id: 'pdf-forms',
  name: 'Fill PDF form',
  icon: 'forms',
  route: '/pdf-forms',
  categoryColor: 'var(--tool-edit)',
};

function extensionOf(file) {
  return file.name.split('.').pop().toLowerCase();
}

export function fileKind(file) {
  const ext = extensionOf(file);
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (OFFICE_TOOLS[ext]) return 'office';
  return 'other';
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

function isEncryptionError(err) {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('encrypted') || msg.includes('password') || msg.includes('decrypt');
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

function listPages(numbers) {
  if (numbers.length === 1) return `Page ${numbers[0]} is`;
  if (numbers.length <= 4) return `Pages ${numbers.slice(0, -1).join(', ')} and ${numbers.at(-1)} are`;
  return `${numbers.length} pages are`;
}

async function hasTextLayer(bytes, pageCount) {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes.slice(0)),
    standardFontDataUrl: '/pdfjs/standard_fonts/',
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
  });
  try {
    const doc = await task.promise;
    let chars = 0;
    for (let n = 1; n <= Math.min(TEXT_SAMPLE_PAGES, pageCount); n += 1) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      chars += content.items.reduce((sum, item) => sum + (item.str?.trim().length || 0), 0);
      if (chars >= MIN_TEXT_CHARS) return true;
    }
    return false;
  } finally {
    task.destroy();
  }
}

async function inspectPdf(file) {
  const bytes = await file.arrayBuffer();
  let doc;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (isEncryptionError(err)) return { encrypted: true };
    throw err;
  }

  const pages = doc.getPages();
  const landscape = pages.map((page) => {
    const { width, height } = page.getSize();
    const quarterTurn = page.getRotation().angle % 180 !== 0;
    return quarterTurn ? height > width : width > height;
  });
  const landscapeCount = landscape.filter(Boolean).length;
  // Only flag the odd pages out: a fully landscape document is fine as it is.
  const sideways = landscapeCount > 0 && landscapeCount < pages.length / 2
    ? landscape.flatMap((isLandscape, i) => (isLandscape ? [i + 1] : []))
    : [];

  let formFields = 0;
  try {
    formFields = doc.getForm().getFields().length;
  } catch {
    formFields = 0;
  }

  // null means the check ran out of time, so we don't claim either way.
  const searchable = await withTimeout(
    hasTextLayer(bytes, pages.length).catch(() => null),
    TEXT_CHECK_TIMEOUT_MS,
    null
  );

  return { encrypted: false, pageCount: pages.length, sideways, formFields, scanned: searchable === false };
}

function pick(toolId, reason, files) {
  const tool = toolId === FORMS_TOOL.id ? FORMS_TOOL : getToolById(toolId);
  return tool ? { tool, reason, files } : null;
}

function fillWithFallbacks(picks, fallbacks) {
  const seen = new Set(picks.map((p) => p.tool.id));
  for (const fallback of fallbacks) {
    if (picks.length >= MAX_PICKS) break;
    if (fallback && !seen.has(fallback.tool.id)) {
      picks.push(fallback);
      seen.add(fallback.tool.id);
    }
  }
  return picks.slice(0, MAX_PICKS);
}

async function analyzeSinglePdf(file) {
  const info = await inspectPdf(file);
  const facts = [{ tone: 'neutral', text: info.encrypted ? formatBytes(file.size) : `${info.pageCount} pages · ${formatBytes(file.size)}` }];
  const picks = [];
  const files = [file];

  if (info.encrypted) {
    facts.push({ tone: 'warn', text: 'Locked with a password' });
    picks.push(pick('unlock', 'It’s password-protected. Unlock it with the password to use other tools.', files));
    return { locked: true, facts, picks: picks.filter(Boolean) };
  }

  if (info.scanned) {
    facts.push({ tone: 'warn', text: 'Scanned — the text can’t be selected' });
    picks.push(pick('ocr-pdf', 'It’s a scan, so you can’t search or copy the text yet. OCR fixes that.', files));
  }
  if (file.size > LARGE_PDF_BYTES) {
    facts.push({ tone: 'warn', text: `Large file — ${formatBytes(file.size)}` });
    picks.push(pick('compress', `${formatBytes(file.size)} is heavy for email and upload forms. Make it smaller.`, files));
  }
  if (info.sideways.length) {
    facts.push({ tone: 'warn', text: `${listPages(info.sideways)} turned differently` });
    picks.push(pick('rotate', `${listPages(info.sideways)} turned differently from the rest. Turn them upright.`, files));
  }
  if (info.formFields > 0) {
    facts.push({ tone: 'info', text: `Has a form with ${info.formFields} field${info.formFields === 1 ? '' : 's'}` });
    picks.push(pick(FORMS_TOOL.id, 'It has fillable fields. Type your answers straight into the form.', files));
  }
  if (info.pageCount > LONG_PDF_PAGES) {
    facts.push({ tone: 'info', text: `Long document — ${info.pageCount} pages` });
    picks.push(pick('split', 'Need only part of it? Split it or pull out the pages you want.', files));
  }
  if (!info.scanned && file.size <= LARGE_PDF_BYTES && !info.sideways.length) {
    facts.push({ tone: 'ok', text: 'Nothing to fix — ready for any tool' });
  }

  const fallbacks = [
    pick('edit', 'Change text, add images or shapes.', files),
    pick('sign', 'Draw or type your signature and place it on the page.', files),
    pick('compress', 'Make it smaller for email and uploads.', files),
    pick('pdf-to-word', 'Get an editable Word document.', files),
  ];
  return { facts, picks: fillWithFallbacks(picks.filter(Boolean), fallbacks) };
}

/**
 * Returns { files, kind, facts, picks, unsupported }. Each pick carries the subset of
 * files its tool accepts, so the tool page can load them straight away.
 */
export async function analyzeFiles(fileList) {
  const files = Array.from(fileList);
  const byKind = { pdf: [], image: [], office: [], other: [] };
  files.forEach((file) => byKind[fileKind(file)].push(file));
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const result = { files, totalBytes, facts: [], picks: [], unsupported: byKind.other };

  const supported = files.length - byKind.other.length;
  if (supported === 0) return { ...result, kind: 'none' };

  if (supported === 1 && byKind.pdf.length === 1) {
    return { ...result, kind: 'pdf', ...(await analyzeSinglePdf(byKind.pdf[0])) };
  }

  const picks = [];
  const facts = [{ tone: 'neutral', text: `${supported} files · ${formatBytes(totalBytes)}` }];

  if (byKind.pdf.length >= 2) {
    picks.push(pick('merge', `Combine your ${byKind.pdf.length} PDFs into one file, in the order you choose.`, byKind.pdf));
    picks.push(pick('compress', 'Make the PDFs smaller for email and uploads.', byKind.pdf));
  } else if (byKind.pdf.length === 1) {
    picks.push(pick('compress', 'Make the PDF smaller for email and uploads.', byKind.pdf));
  }
  if (byKind.image.length) {
    const n = byKind.image.length;
    picks.push(pick('jpg-to-pdf', n === 1 ? 'Turn your image into a PDF.' : `Make one PDF from your ${n} images.`, byKind.image));
  }
  for (const ext of new Set(byKind.office.map(extensionOf))) {
    const officeFiles = byKind.office.filter((f) => extensionOf(f) === ext);
    picks.push(pick(OFFICE_TOOLS[ext], `Convert your .${ext} file${officeFiles.length === 1 ? '' : 's'} to PDF.`, officeFiles));
  }
  if (byKind.pdf.length && byKind.image.length) {
    facts.push({ tone: 'info', text: 'A mix of PDFs and images' });
  }
  if (totalBytes > LARGE_PDF_BYTES && byKind.pdf.length) {
    facts.push({ tone: 'warn', text: `Large — ${formatBytes(totalBytes)} in total` });
  }

  const kind = byKind.pdf.length ? 'pdf' : byKind.image.length ? 'image' : 'document';
  return { ...result, kind, facts, picks: picks.filter(Boolean).slice(0, MAX_PICKS) };
}
