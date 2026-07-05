'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, removePages, downloadPdf } from '@/lib/pdfUtils';

export default function RemovePagesClient() {
  const [file, setFile] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setSelectedPages([]);
    setDone(false);
  }, []);

  const handlePageToggle = (pageIndex) => {
    setSelectedPages((prev) =>
      prev.includes(pageIndex) ? prev.filter((i) => i !== pageIndex) : [...prev, pageIndex]
    );
  };

  const handleRemove = async () => {
    if (!file || selectedPages.length === 0) return;
    setProcessing(true);
    try {
      const srcDoc = await loadPdf(file);
      const result = await removePages(srcDoc, selectedPages);
      await downloadPdf(result, file.name.replace('.pdf', '-removed.pdf'));
      setDone(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout title="Remove Pages" description="Select and delete unwanted pages from your PDF" icon="trash" iconColor="var(--tool-organize)">
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Drop your PDF file here" id="remove-dropzone" />
      ) : (
        <div className="tool-workspace">
          {/* Left panel: File info and thumbnails selection */}
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <button className="file-item-remove" onClick={() => { setFile(null); setDone(false); }}>
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <p className="body-sm ink-subtle" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
              Click pages below to select them for removal ({selectedPages.length} marked):
            </p>
            
            <PageThumbnails file={file} selectedPages={selectedPages} onPageToggle={handlePageToggle} maxWidth={140} />
          </div>

          {/* Right panel: Actions sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Actions</p>

              <div style={{ fontSize: 13 }}>
                <span className="ink-muted">Pages to remove:</span>
                <span style={{ fontWeight: 600, marginLeft: 6 }}>{selectedPages.length}</span>
              </div>

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
                  ✓ Removal successful!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleRemove}
                disabled={selectedPages.length === 0 || processing}
                style={{ width: '100%' }}
                id="remove-button"
              >
                {processing ? 'Removing...' : 'Remove Pages'}
                <ToolIcon name="trash" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
