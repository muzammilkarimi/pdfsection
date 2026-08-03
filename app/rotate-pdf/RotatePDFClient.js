'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
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
    if (!file) return;
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
            <>
              <button
                type="button"
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleRotate}
                disabled={selectedPages.length === 0 || processing}
                id="rotate-button"
              >
                {processing ? 'Rotating...' : 'Rotate PDF'}
                <ToolIcon name="rotate" size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetFile}
                disabled={processing}
              >
                Start over
              </button>
            </>
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

          {done && <div className="merge-success">✓ PDF rotated and downloaded successfully!</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
