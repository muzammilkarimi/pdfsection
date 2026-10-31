'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, rotatePages, downloadPdf } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';

export default function RotatePDFClient() {
  const deliver = useResultHandoff('rotate-pdf');
  const [file, setFile] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [angle, setAngle] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [rotatedPdfDoc, setRotatedPdfDoc] = useState(null);

  const handleFilesSelected = useCallback(async (files) => {
    const selectedFile = files[0] || null;
    setFile(selectedFile);
    setDone(false);
    setRotatedPdfDoc(null);

    if (selectedFile) {
      try {
        const pdf = await loadPdf(selectedFile);
        const count = pdf.getPageCount();
        setSelectedPages(Array.from({ length: count }, (_, i) => i + 1));
      } catch {
        setSelectedPages([]);
      }
    } else {
      setSelectedPages([]);
    }
  }, []);

  const handlePageToggle = (pageNumber) => {
    setSelectedPages((prev) =>
      prev.includes(pageNumber)
        ? prev.filter((p) => p !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
    setDone(false);
    setRotatedPdfDoc(null);
  };

  const selectAll = async () => {
    if (!file) return;
    try {
      const pdf = await loadPdf(file);
      const count = pdf.getPageCount();
      setSelectedPages(Array.from({ length: count }, (_, i) => i + 1));
    } catch {
      // fallback
    }
  };

  const resetFile = () => {
    setFile(null);
    setSelectedPages([]);
    setDone(false);
    setRotatedPdfDoc(null);
  };

  const handleRotate = async () => {
    if (!file || selectedPages.length === 0) return;
    setProcessing(true);

    try {
      const srcDoc = await loadPdf(file);
      const rotatedDoc = await rotatePages(srcDoc, selectedPages, angle);
      setRotatedPdfDoc(rotatedDoc);
      await deliver(rotatedDoc, file.name.replace('.pdf', '-rotated.pdf'));
      setDone(true);
    } catch (err) {
      alert('Error rotating PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRedownload = async () => {
    if (rotatedPdfDoc && file) {
      await downloadPdf(rotatedPdfDoc, file.name.replace('.pdf', '-rotated.pdf'));
    }
  };

  const angles = [
    { value: 90, label: '90° Right' },
    { value: 180, label: '180° Flip' },
    { value: 270, label: '90° Left' },
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
        <PageToolWorkspace
          title="Rotate PDF"
          description="Select pages on the left, then choose the rotation angle."
          icon="rotate"
          iconColor="var(--tool-edit)"
          file={file}
          onReset={resetFile}
          ariaLabel="Rotate PDF workspace"
          preview={(
            <PageThumbnails
              file={file}
              selectedPages={selectedPages}
              onPageToggle={handlePageToggle}
              maxWidth={150}
              className="page-preview-grid"
            />
          )}
          footer={(
            done ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  className="btn btn-primary btn-lg btn-attention btn-success-state"
                  onClick={handleRedownload}
                  style={{ width: '100%' }}
                  id="redownload-rotate-button"
                >
                  <ToolIcon name="download" size={16} style={{ marginRight: 6 }} />
                  Download Rotated PDF Again
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetFile} disabled={processing} style={{ width: '100%' }}>
                  Rotate Another PDF
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-attention"
                  onClick={handleRotate}
                  disabled={selectedPages.length === 0 || processing}
                  id="rotate-button"
                  style={{ width: '100%' }}
                >
                  {processing ? 'Rotating...' : 'Rotate PDF'}
                  <ToolIcon name="rotate" size={16} style={{ marginLeft: 6 }} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetFile}
                  disabled={processing}
                  style={{ width: '100%' }}
                >
                  Start over
                </button>
              </div>
            )
          )}
        >
          <div className="page-control-stat">
            <span>Pages selected</span>
            <strong>{selectedPages.length}</strong>
          </div>

          <div style={{ display: 'flex', gap: '8px', margin: 'var(--space-xs) 0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', flex: 1 }}
              onClick={selectAll}
            >
              Select All Pages
            </button>
            <button
              type="button"
              className="btn btn-tertiary"
              style={{ fontSize: '12px' }}
              onClick={() => setSelectedPages([])}
            >
              Clear
            </button>
          </div>

          <div className="page-field-group" style={{ marginTop: 'var(--space-sm)' }}>
            <label className="body-sm ink-muted">Rotation Angle</label>
            <div className="page-option-list" style={{ marginTop: 'var(--space-xs)' }}>
              {angles.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`btn ${angle === option.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => setAngle(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="page-help-note" style={{ marginTop: 'var(--space-md)' }}>
            <ToolIcon name="check" size={16} />
            <span>Click thumbnails to toggle selection. Selected pages will be rotated by {angle}°.</span>
          </div>
        </PageToolWorkspace>
      )}

      {done && (
        <ToastNotification
          message="✓ PDF rotated and downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
