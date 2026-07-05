'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, splitPdf, splitPdfIntoPages, savePdf, downloadBlob } from '@/lib/pdfUtils';

export default function SplitPDFClient() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('all'); // 'all', 'ranges', 'every'
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
  }, []);

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const srcDoc = await loadPdf(file);
      const pageCount = srcDoc.getPageCount();
      let results;

      if (mode === 'all') {
        results = await splitPdfIntoPages(srcDoc);
      } else if (mode === 'ranges') {
        // Parse ranges like "1-3, 5, 7-10"
        const ranges = rangeInput.split(',').map((r) => {
          const parts = r.trim().split('-').map((n) => parseInt(n.trim()) - 1);
          if (parts.length === 1) return [parts[0], parts[0]];
          return [parts[0], parts[1]];
        }).filter(([s, e]) => !isNaN(s) && !isNaN(e) && s >= 0 && e < pageCount);

        if (ranges.length === 0) {
          alert('Invalid page ranges. Use format: 1-3, 5, 7-10');
          setProcessing(false);
          return;
        }
        results = await splitPdf(srcDoc, ranges);
      } else if (mode === 'every') {
        const ranges = [];
        for (let i = 0; i < pageCount; i += everyN) {
          ranges.push([i, Math.min(i + everyN - 1, pageCount - 1)]);
        }
        results = await splitPdf(srcDoc, ranges);
      }

      // Download as ZIP if multiple files
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
    { id: 'all', label: 'Extract All Pages', desc: 'Every page becomes a separate PDF' },
    { id: 'ranges', label: 'Custom Ranges', desc: 'Split by page ranges (e.g. 1-3, 5, 7-10)' },
    { id: 'every', label: 'Split Every N Pages', desc: 'Split into groups of N pages' },
  ];

  return (
    <ToolPageLayout
      title="Split PDF"
      description="Separate pages or extract specific ranges from your PDF"
      icon="split"
      iconColor="var(--tool-organize)"
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF file here"
          id="split-dropzone"
        />
      ) : (
        <div className="tool-workspace">
            {/* Left Panel: File info and page thumbnails preview */}
            <div className="tool-main-panel">
              <div className="file-item">
                <ToolIcon name="pdf" size={18} className="ink-subtle" />
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                <button className="file-item-remove" onClick={() => { setFile(null); setDone(false); }}>
                  <ToolIcon name="x" size={14} />
                </button>
              </div>

              <PageThumbnails file={file} selectable={false} maxWidth={120} />
            </div>

            {/* Right Panel: Split configurations and action buttons */}
            <div className="tool-action-sidebar">
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Split Options</p>
                
                {/* Split mode selector */}
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {modes.map((m) => (
                      <button
                        key={m.id}
                        className={`card ${mode === m.id ? 'card-featured' : ''}`}
                        onClick={() => setMode(m.id)}
                        style={{
                          padding: 'var(--space-sm) var(--space-md)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          border: mode === m.id ? '1px solid var(--primary)' : '1px solid var(--hairline)',
                        }}
                      >
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-subtle)', marginTop: 2 }}>{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode-specific options */}
                {mode === 'ranges' && (
                  <div>
                    <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Page Ranges</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 1-3, 5, 7-10"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                    />
                  </div>
                )}

                {mode === 'every' && (
                  <div>
                    <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Group size</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span className="body-sm">Every</span>
                      <input
                        type="number"
                        className="input"
                        min="1"
                        max="100"
                        value={everyN}
                        onChange={(e) => setEveryN(parseInt(e.target.value) || 1)}
                        style={{ width: 80 }}
                      />
                      <span className="body-sm">pages</span>
                    </div>
                  </div>
                )}

                {done && (
                  <div
                    style={{
                      padding: 'var(--space-sm)',
                      backgroundColor: 'rgba(39, 166, 68, 0.08)',
                      borderRadius: 'var(--rounded-md)',
                      border: '1px solid rgba(39, 166, 68, 0.2)',
                      textAlign: 'center',
                      color: 'var(--semantic-success)',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    ✓ Split successful!
                  </div>
                )}

                <button
                  className="btn btn-primary btn-lg btn-attention"
                  onClick={handleSplit}
                  disabled={processing}
                  style={{ width: '100%' }}
                  id="split-button"
                >
                  {processing ? 'Splitting...' : 'Split PDF'}
                  <ToolIcon name="split" size={16} style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          </div>
      )}
    </ToolPageLayout>
  );
}
