'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, rotatePages, downloadPdf } from '@/lib/pdfUtils';

export default function RotatePDFClient() {
  const [file, setFile] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [angle, setAngle] = useState(90);
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
      prev.includes(pageIndex)
        ? prev.filter((i) => i !== pageIndex)
        : [...prev, pageIndex]
    );
  };

  const selectAll = async () => {
    const doc = await loadPdf(file);
    setDone(false);
    setSelectedPages(doc.getPageIndices());
  };

  const handleRotate = async () => {
    if (!file || selectedPages.length === 0) return;
    setProcessing(true);

    try {
      const srcDoc = await loadPdf(file);
      const rotatedDoc = await rotatePages(srcDoc, selectedPages, angle);
      await downloadPdf(rotatedDoc, file.name.replace('.pdf', '-rotated.pdf'));
      setDone(true);
    } catch (err) {
      alert('Error rotating PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const angles = [
    { value: 90, label: '90 deg right' },
    { value: 180, label: '180 deg' },
    { value: 270, label: '90 deg left' },
  ];

  return (
    <ToolPageLayout
      title="Rotate PDF"
      description="Rotate pages to the correct orientation"
      icon="rotate"
      iconColor="var(--tool-edit)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Select PDF file"
          id="rotate-dropzone"
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

          <aside className="page-controls-panel" aria-label="Rotate PDF settings">
            <div className="page-controls-header">
              <div
                className="tool-page-icon"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--tool-edit) 14%, var(--surface-2))',
                  color: 'var(--tool-edit)',
                }}
              >
                <ToolIcon name="rotate" size={22} />
              </div>
              <div className="tool-page-heading">
                <h1 className="tool-page-title">Rotate PDF</h1>
                <p className="tool-page-description">Select pages on the left, then choose the rotation angle.</p>
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

              <div className="page-field-group">
                <label className="body-sm ink-muted">Rotation angle</label>
                <div className="page-option-list">
                  {angles.map((option) => (
                    <button
                      key={option.value}
                      className={`btn ${angle === option.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAngle(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-secondary" onClick={selectAll}>
                Select All Pages
              </button>

              <div className="page-help-note">
                <ToolIcon name="check" size={16} />
                <span>The left panel is dedicated to page previews. All rotation settings stay fixed on the right.</span>
              </div>

              {done && <div className="merge-success">Rotate successful. Your PDF has been downloaded.</div>}
            </div>

            <div className="page-controls-footer">
              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleRotate}
                disabled={selectedPages.length === 0 || processing}
                id="rotate-button"
              >
                {processing ? 'Rotating...' : `Rotate (${selectedPages.length})`}
                <ToolIcon name="rotate" size={16} />
              </button>
            </div>
          </aside>
        </div>
      )}
    </ToolPageLayout>
  );
}


