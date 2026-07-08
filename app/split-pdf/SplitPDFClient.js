'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, splitPdf, splitPdfIntoPages, savePdf, downloadBlob } from '@/lib/pdfUtils';

export default function SplitPDFClient() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState('all');
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback(async (files) => {
    const selectedFile = files[0] || null;
    setFile(selectedFile);
    setDone(false);

    if (!selectedFile) {
      setPageCount(0);
      return;
    }

    try {
      const doc = await loadPdf(selectedFile);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const resetFile = () => {
    setFile(null);
    setPageCount(0);
    setDone(false);
    setRangeInput('');
    setEveryN(1);
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const srcDoc = await loadPdf(file);
      const totalPages = srcDoc.getPageCount();
      let results;

      if (mode === 'all') {
        results = await splitPdfIntoPages(srcDoc);
      } else if (mode === 'ranges') {
        const ranges = rangeInput.split(',').map((range) => {
          const parts = range.trim().split('-').map((number) => parseInt(number.trim()) - 1);
          if (parts.length === 1) return [parts[0], parts[0]];
          return [parts[0], parts[1]];
        }).filter(([start, end]) => !isNaN(start) && !isNaN(end) && start >= 0 && end < totalPages && start <= end);

        if (ranges.length === 0) {
          alert('Invalid page ranges. Use format: 1-3, 5, 7-10');
          setProcessing(false);
          return;
        }
        results = await splitPdf(srcDoc, ranges);
      } else if (mode === 'every') {
        const groupSize = Math.max(1, everyN);
        const ranges = [];
        for (let i = 0; i < totalPages; i += groupSize) {
          ranges.push([i, Math.min(i + groupSize - 1, totalPages - 1)]);
        }
        results = await splitPdf(srcDoc, ranges);
      }

      if (results.length === 1) {
        const bytes = await savePdf(results[0]);
        downloadBlob(bytes, 'split-page.pdf', 'application/pdf');
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 0; i < results.length; i++) {
          const bytes = await savePdf(results[i]);
          zip.file(`page-${i + 1}.pdf`, bytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'split-pages.zip', 'application/zip');
      }

      setDone(true);
    } catch (err) {
      alert('Error splitting PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const modes = [
    { id: 'all', label: 'All pages', detail: 'Every page becomes a PDF' },
    { id: 'ranges', label: 'Ranges', detail: 'Use 1-3, 5, 7-10' },
    { id: 'every', label: 'Every N', detail: 'Split into page groups' },
  ];

  const outputText = (() => {
    if (!pageCount) return 'Output will be calculated after loading the PDF.';
    if (mode === 'all') return `${pageCount} separate PDF files will be created.`;
    if (mode === 'every') return `${Math.ceil(pageCount / Math.max(1, everyN))} PDF files will be created.`;
    return 'Only the ranges you enter will be exported.';
  })();

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
        <PageToolWorkspace
          title="Split PDF"
          description="Choose how pages should be separated into new PDFs."
          icon="split"
          iconColor="var(--tool-organize)"
          file={file}
          onReset={resetFile}
          ariaLabel="Split PDF settings"
          preview={<PageThumbnails file={file} selectable={false} maxWidth={150} className="page-preview-grid" />}
          footer={(
            <button className="btn btn-primary btn-lg btn-attention" onClick={handleSplit} disabled={processing || (mode === 'ranges' && !rangeInput.trim())} id="split-button">
              {processing ? 'Splitting...' : 'Split PDF'}
              <ToolIcon name="split" size={16} />
            </button>
          )}
        >
          <div className="page-control-stat">
            <span>Total pages</span>
            <strong>{pageCount || 0}</strong>
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">Split mode</label>
            <div className="split-mode-grid" role="tablist" aria-label="Split mode">
              {modes.map((item) => (
                <button key={item.id} type="button" className={`split-mode-button ${mode === item.id ? 'active' : ''}`} onClick={() => setMode(item.id)} role="tab" aria-selected={mode === item.id}>
                  <span>{item.label}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </div>

          {mode === 'ranges' && (
            <div className="page-field-group">
              <label className="body-sm ink-muted" htmlFor="split-ranges">Page ranges</label>
              <input id="split-ranges" type="text" className="input" placeholder="e.g. 1-3, 5, 7-10" value={rangeInput} onChange={(event) => setRangeInput(event.target.value)} />
            </div>
          )}

          {mode === 'every' && (
            <div className="page-field-group">
              <label className="body-sm ink-muted" htmlFor="split-every">Group size</label>
              <div className="split-inline-field">
                <span>Every</span>
                <input id="split-every" type="number" className="input" min="1" max="100" value={everyN} onChange={(event) => setEveryN(parseInt(event.target.value) || 1)} />
                <span>pages</span>
              </div>
            </div>
          )}

          <div className="split-output-note">
            <ToolIcon name="check" size={16} />
            <span>{outputText}</span>
          </div>

          {done && <div className="merge-success">Split complete. Check your downloaded file.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}


