// Lock detection: a PDF encrypted only for permissions (no open password) must not be
// reported as locked, and tools must get a copy pdf-lib can open.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { checkPdfEncryption, openPdfWithoutPassword } from '@/lib/pdfUtils';

async function makePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage().drawText('Hello', { x: 50, y: 700, font });
  return doc.save();
}

test('plain PDF is not locked and is left as is', async () => {
  const bytes = await makePdf();
  assert.deepEqual(await openPdfWithoutPassword(bytes), { locked: false, bytes: null });
  assert.equal(await checkPdfEncryption(new Blob([bytes])), false);
});

test('permission-only encryption is not locked and comes back openable', async () => {
  const bytes = await encryptPDF(await makePdf(), '', { ownerPassword: 'owner123' });
  await assert.rejects(PDFDocument.load(bytes), /encrypted/);

  const result = await openPdfWithoutPassword(bytes);
  assert.equal(result.locked, false);
  const doc = await PDFDocument.load(result.bytes);
  assert.equal(doc.getPageCount(), 1);
  assert.equal(await checkPdfEncryption(new Blob([bytes])), false);
});

test('PDF with an open password is locked', async () => {
  const bytes = await encryptPDF(await makePdf(), 'secret', { ownerPassword: 'owner123' });
  assert.deepEqual(await openPdfWithoutPassword(bytes), { locked: true });
  assert.equal(await checkPdfEncryption(new Blob([bytes])), true);
});

test('damaged file is not reported as locked', async () => {
  const bytes = new TextEncoder().encode('not a pdf at all');
  assert.equal((await openPdfWithoutPassword(bytes)).locked, false);
});
