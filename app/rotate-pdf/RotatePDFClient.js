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

  const handlePageToggle = (pageIndex) => {
    setSelectedPages((prev) =>
      prev.includes(pageIndex)
        ? prev.filter((i) => i !== pageIndex)
        : [...prev, pageIndex]
    );
  };

  const selectAll = async () => {
    const doc = await loadPdf(file);
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
    { value: 180, label: '180°' },
    { value: 270, label: '90° Left' },
  ];

  return (
    <ToolPageLayout title="Rotate PDF" description="Rotate pages to the correct orientation" icon="rotate" iconColor="var(--tool-edit)">
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Drop your PDF file here" id="rotate-dropzone" />
      ) : (
        <div className="tool-workspace">
          {/* Left panel: File details and thumbnail pages selection */}
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <button className="file-item-remove" onClick={() => { setFile(null); setDone(false); }}>
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <p className="body-sm ink-subtle" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
              Click pages below to select/deselect them for rotation ({selectedPages.length} selected):
            </p>
            
            <PageThumbnails file={file} selectedPages={selectedPages} onPageToggle={handlePageToggle} maxWidth={140} />
          </div>

          {/* Right panel: Rotation configurations sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Rotate Settings</p>
              
              {/* Rotation angles */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 6 }}>Orientation Angle</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  {angles.map((a) => (
                    <button
                      key={a.value}
                      className={`btn ${angle === a.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAngle(a.value)}
                      style={{ fontSize: 13, padding: '8px 12px' }}
                    >
                      {a.label}
                    </button>
                  ))}
                  <button className="btn btn-tertiary" onClick={selectAll} style={{ fontSize: 13, marginTop: 4 }}>
                    Select All Pages
                  </button>
                </div>
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
                  ✓ Rotate successful!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleRotate}
                disabled={selectedPages.length === 0 || processing}
                style={{ width: '100%' }}
                id="rotate-button"
              >
                {processing ? 'Rotating...' : `Rotate (${selectedPages.length})`}
                <ToolIcon name="rotate" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
