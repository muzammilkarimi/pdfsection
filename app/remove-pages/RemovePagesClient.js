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

  const resetFile = () => {
    setFile(null);
    setSelectedPages([]);
    setDone(false);
  };

  const handlePageToggle = (pageIndex) => {
    setDone(false);
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
    <ToolPageLayout
      title="Remove Pages"
      description="Select and delete unwanted pages from your PDF"
      icon="trash"
      iconColor="var(--tool-organize)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Select PDF file"
          id="remove-dropzone"
        />
      ) : (
        <div className="page-editor-workspace">
          <section className="page-preview-panel" aria-label="PDF page previews">
            <PageThumbnails
              file={file}
              selectedPages={selectedPages}
              onPageToggle={handlePageToggle}
              maxWidth={150}
              className="page-preview-grid"
            />
          </section>

          <aside className="page-controls-panel" aria-label="Remove pages settings">
            <div className="page-controls-header">
              <div
                className="tool-page-icon"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--tool-organize) 14%, var(--surface-2))',
                  color: 'var(--tool-organize)',
                }}
              >
                <ToolIcon name="trash" size={22} />
              </div>
              <div className="tool-page-heading">
                <h1 className="tool-page-title">Remove Pages</h1>
                <p className="tool-page-description">Select pages on the left, then create a cleaned PDF.</p>
              </div>
            </div>

            <div className="page-controls-body">
              <div className="page-file-card">
                <div className="page-file-icon">
                  <ToolIcon name="pdf" size={18} />
                </div>
                <div className="page-file-meta">
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <button className="file-item-remove" onClick={resetFile} aria-label={`Remove ${file.name}`}>
                  <ToolIcon name="x" size={14} />
                </button>
              </div>

              <div className="page-control-stat">
                <span>Pages selected</span>
                <strong>{selectedPages.length}</strong>
              </div>

              <div className="page-help-note">
                <ToolIcon name="check" size={16} />
                <span>Click any page thumbnail to mark it for removal. The left panel is only for page preview and selection.</span>
              </div>

              {done && <div className="merge-success">Removal successful. Your PDF has been downloaded.</div>}
            </div>

            <div className="page-controls-footer">
              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleRemove}
                disabled={selectedPages.length === 0 || processing}
                id="remove-button"
              >
                {processing ? 'Removing...' : 'Remove Pages'}
                <ToolIcon name="trash" size={16} />
              </button>
            </div>
          </aside>
        </div>
      )}
    </ToolPageLayout>
  );
}


