'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, splitPdf, splitPdfIntoPages, extractPages, savePdf } from '@/lib/pdfUtils';
import { setIncomingFiles } from '@/lib/incomingFiles';
import { useResultHandoff } from '@/lib/useResultHandoff';

const MODES = [
  { id: 'pick', label: 'Pick pages' },
  { id: 'ranges', label: 'By ranges' },
  { id: 'every', label: 'Every N pages' },
];

// "1-3, 5" -> [[0, 2], [4, 4]] (zero-based), dropping anything outside the document.
function parseRanges(input, totalPages) {
  return input
    .split(',')
    .map((range) => {
      const parts = range.trim().split('-').map((number) => parseInt(number.trim(), 10) - 1);
      return parts.length === 1 ? [parts[0], parts[0]] : [parts[0], parts[1]];
    })
    .filter(([start, end]) => !isNaN(start) && !isNaN(end) && start >= 0 && end < totalPages && start <= end);
}

// [0, 1, 2, 4] -> "1-3, 5"
function pagesToRanges(pageIndexes) {
  const sorted = [...pageIndexes].sort((a, b) => a - b);
  const ranges = [];
  for (const page of sorted) {
    const last = ranges.at(-1);
    if (last && page === last[1] + 1) last[1] = page;
    else ranges.push([page, page]);
  }
  return ranges.map(([start, end]) => (start === end ? `${start + 1}` : `${start + 1}-${end + 1}`)).join(', ');
}

// Page numbers turned differently from most of the document (1-based).
function findSidewaysPages(doc) {
  const landscape = doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return page.getRotation().angle % 180 !== 0 ? height > width : width > height;
  });
  const count = landscape.filter(Boolean).length;
  if (count === 0 || count >= landscape.length / 2) return [];
  return landscape.flatMap((isLandscape, i) => (isLandscape ? [i + 1] : []));
}

function listPages(numbers) {
  if (numbers.length === 1) return `Page ${numbers[0]} is`;
  if (numbers.length <= 4) return `Pages ${numbers.slice(0, -1).join(', ')} and ${numbers.at(-1)} are`;
  return `${numbers.length} pages are`;
}

export default function SplitPDFClient() {
  const router = useRouter();
  const deliver = useResultHandoff('split-pdf');
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [sidewaysPages, setSidewaysPages] = useState([]);
  const [mode, setMode] = useState('pick');
  const [pickOutput, setPickOutput] = useState('single'); // single | perPage
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(2);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback(async (files) => {
    const selectedFile = files[0] || null;
    setFile(selectedFile);
    setDone(false);
    setSidewaysPages([]);

    if (!selectedFile) {
      setPageCount(0);
      return;
    }

    try {
      const doc = await loadPdf(selectedFile);
      setPageCount(doc.getPageCount());
      setSidewaysPages(findSidewaysPages(doc));
    } catch {
      setPageCount(0);
    }
  }, []);

  const resetFile = () => {
    setFile(null);
    setPageCount(0);
    setSidewaysPages([]);
    setDone(false);
    setRangeInput('');
    setEveryN(2);
  };

  const rotateFirst = () => {
    setIncomingFiles([file]);
    router.push('/rotate-pdf');
  };

  const enteredRanges = parseRanges(rangeInput, pageCount);
  const selectedPages = [...new Set(enteredRanges.flatMap(([start, end]) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i)
  ))].sort((a, b) => a - b);
  const groupSize = Math.max(1, everyN || 1);

  const outputCount = (() => {
    if (!pageCount) return 0;
    if (mode === 'every') return Math.ceil(pageCount / groupSize);
    if (mode === 'ranges') return enteredRanges.length;
    if (selectedPages.length === 0) return 0;
    return pickOutput === 'single' ? 1 : selectedPages.length;
  })();

  const actionLabel = (() => {
    if (outputCount === 0) return mode === 'ranges' ? 'Enter page ranges' : 'Pick pages first';
    if (mode === 'pick' && pickOutput === 'single') {
      return `Extract ${selectedPages.length} page${selectedPages.length === 1 ? '' : 's'}`;
    }
    return outputCount === 1 ? 'Create 1 PDF' : `Split into ${outputCount} PDFs`;
  })();

  const togglePage = (pageIndex) => {
    const pages = new Set(selectedPages);
    if (pages.has(pageIndex)) pages.delete(pageIndex);
    else pages.add(pageIndex);
    setRangeInput(pagesToRanges(pages));
    setDone(false);
  };

  const handleSplit = async () => {
    if (!file || outputCount === 0) return;
    setProcessing(true);

    try {
      const srcDoc = await loadPdf(file);
      const baseName = file.name.replace(/\.pdf$/i, '');
      let results;
      let partName = (i) => `${baseName}-part-${i + 1}.pdf`;

      if (mode === 'every') {
        const ranges = [];
        for (let i = 0; i < pageCount; i += groupSize) {
          ranges.push([i, Math.min(i + groupSize - 1, pageCount - 1)]);
        }
        results = await splitPdf(srcDoc, ranges);
      } else if (mode === 'ranges') {
        results = await splitPdf(srcDoc, enteredRanges);
      } else if (pickOutput === 'single') {
        results = [await extractPages(srcDoc, selectedPages)];
      } else if (selectedPages.length === pageCount) {
        results = await splitPdfIntoPages(srcDoc);
        partName = (i) => `${baseName}-page-${i + 1}.pdf`;
      } else {
        results = await splitPdf(srcDoc, selectedPages.map((page) => [page, page]));
        partName = (i) => `${baseName}-page-${selectedPages[i] + 1}.pdf`;
      }

      if (results.length === 1) {
        const suffix = mode === 'pick' ? 'extract' : 'split';
        await deliver(await savePdf(results[0]), `${baseName}-${suffix}.pdf`, 'application/pdf', {
          summary: `${results[0].getPageCount()} pages`,
        });
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (let i = 0; i < results.length; i++) {
          zip.file(partName(i), await savePdf(results[i]));
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        await deliver(zipBlob, `${baseName}-split.zip`, 'application/zip', { summary: `${results.length} PDFs in a ZIP` });
      }

      setDone(true);
    } catch (err) {
      alert('Error splitting PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="Split PDF"
      description="Separate pages or extract specific ranges from your PDF."
      icon="split"
      iconColor="var(--tool-organize)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Select PDF file" id="split-dropzone" />
      ) : (
        <>
          <div className="ws-topbar">
            <div className="ws-topbar-title">
              <Link href="/tools" aria-label="Back to all tools" className="ws-mobile-back">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
              <span
                className="tool-page-icon"
                style={{ backgroundColor: 'color-mix(in srgb, var(--tool-organize) 14%, var(--surface-2))', color: 'var(--tool-organize)' }}
              >
                <ToolIcon name="split" size={24} />
              </span>
              <div>
                <h1>Split PDF</h1>
                <span className="ws-topbar-file">
                  {file.name}{pageCount > 0 ? ` · ${pageCount} pages` : ''}
                  <button type="button" className="ws-link-button" onClick={resetFile} disabled={processing}>Change file</button>
                </span>
              </div>
            </div>
            <div className="ws-tabs" role="tablist" aria-label="Split mode">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === item.id}
                  onClick={() => {
                    setMode(item.id);
                    setDone(false);
                  }}
                  disabled={processing}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <PageToolWorkspace
            title="Split PDF"
            description="Separate pages or pull out the ones you need."
            icon="split"
            iconColor="var(--tool-organize)"
            showHeading={false}
            ariaLabel="Split PDF settings"
            preview={(
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {mode !== 'every' && pageCount > 0 && (
                  <div className="ws-toolbar">
                    <span>
                      <strong>{selectedPages.length} of {pageCount}</strong> pages selected · click to select
                    </span>
                    <div className="ws-toolbar-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setRangeInput(`1-${pageCount}`)}
                        disabled={processing}
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setRangeInput('')}
                        disabled={processing || selectedPages.length === 0}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                <PageThumbnails
                  file={file}
                  selectable={mode !== 'every'}
                  selectedPages={mode !== 'every' ? selectedPages : []}
                  onPageToggle={togglePage}
                  maxWidth={150}
                  className="page-preview-grid"
                />
              </div>
            )}
            footer={(
              <button
                className={`btn btn-lg ${done ? 'btn-success-state' : 'btn-primary'}`}
                onClick={handleSplit}
                disabled={processing || outputCount === 0}
                id="split-button"
                style={{ width: '100%' }}
              >
                {processing ? 'Splitting…' : done ? '✓ Done — run again' : actionLabel}
              </button>
            )}
          >
            <h2 className="ws-section-title">You&apos;ll get</h2>

            {mode === 'pick' && (
              <>
                <label className="ws-field">
                  <span>Selected pages</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="Click pages on the left"
                    value={rangeInput}
                    onChange={(event) => {
                      setRangeInput(event.target.value);
                      setDone(false);
                    }}
                  />
                </label>
                <div className="ws-radio-list" role="radiogroup" aria-label="Output">
                  <label className={`ws-radio ${pickOutput === 'single' ? 'is-checked' : ''}`}>
                    <input type="radio" name="split-output" checked={pickOutput === 'single'} onChange={() => setPickOutput('single')} />
                    One PDF with {selectedPages.length ? `these ${selectedPages.length} pages` : 'the selected pages'}
                  </label>
                  <label className={`ws-radio ${pickOutput === 'perPage' ? 'is-checked' : ''}`}>
                    <input type="radio" name="split-output" checked={pickOutput === 'perPage'} onChange={() => setPickOutput('perPage')} />
                    A separate PDF per page (ZIP)
                  </label>
                </div>
              </>
            )}

            {mode === 'ranges' && (
              <>
                <label className="ws-field">
                  <span>Page ranges</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 1-3, 5, 7-10"
                    value={rangeInput}
                    onChange={(event) => {
                      setRangeInput(event.target.value);
                      setDone(false);
                    }}
                  />
                </label>
                <p className="ws-note ws-note-info">
                  {enteredRanges.length
                    ? `One PDF per range: ${enteredRanges.length} PDF${enteredRanges.length === 1 ? '' : 's'}${enteredRanges.length > 1 ? ' in a ZIP' : ''}.`
                    : 'Type ranges like 1-3, 5 — each range becomes its own PDF.'}
                </p>
              </>
            )}

            {mode === 'every' && (
              <>
                <label className="ws-field">
                  <span>Pages per PDF</span>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    max={pageCount || 100}
                    value={everyN}
                    onChange={(event) => {
                      setEveryN(parseInt(event.target.value, 10) || 1);
                      setDone(false);
                    }}
                  />
                </label>
                <p className="ws-note ws-note-info">
                  {outputCount} PDF{outputCount === 1 ? '' : 's'} of up to {groupSize} page{groupSize === 1 ? '' : 's'} each
                  {outputCount > 1 ? ', in a ZIP.' : '.'}
                </p>
              </>
            )}

            {sidewaysPages.length > 0 && (
              <p className="ws-note ws-note-warn">
                {listPages(sidewaysPages)} sideways.{' '}
                <button type="button" className="ws-link-button" onClick={rotateFirst}>Rotate them first</button>
              </p>
            )}
          </PageToolWorkspace>
        </>
      )}

      {done && (
        <ToastNotification
          message="Split complete! Check your downloaded file."
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
