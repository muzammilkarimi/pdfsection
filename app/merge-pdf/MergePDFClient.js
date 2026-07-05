'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { mergePdfs, downloadPdf } from '@/lib/pdfUtils';

export default function MergePDFClient() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((newFiles) => {
    setFiles(newFiles);
    setDone(false);
  }, []);

  const moveFile = (fromIndex, toIndex) => {
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setProgress(10);

    try {
      setProgress(30);
      const mergedDoc = await mergePdfs(files);
      setProgress(80);
      await downloadPdf(mergedDoc, 'merged.pdf');
      setProgress(100);
      setDone(true);
    } catch (err) {
      alert('Error merging PDFs: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into a single document. Drag to reorder."
      icon="merge"
      iconColor="var(--tool-organize)"
    >
      <FileDropzone
        accept=".pdf"
        multiple={true}
        maxFiles={20}
        onFilesSelected={handleFilesSelected}
        label="Drop your PDF files here"
        sublabel="or click to browse · PDF · Up to 20 files"
        id="merge-dropzone"
      />

      {/* Split Workspace */}
      {files.length > 0 && (
        <div className="tool-workspace" style={{ marginTop: 'var(--space-lg)' }}>
          {/* Left panel: File list */}
          <div className="tool-main-panel">
            <p className="eyebrow" style={{ marginBottom: 'var(--space-xs)', color: 'var(--ink-subtle)' }}>
              Reorder Files ({files.length} selected)
            </p>
            <div className="file-list">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="file-item" style={{ gap: 'var(--space-sm)' }}>
                  {/* Order controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      className="file-item-remove"
                      onClick={() => index > 0 && moveFile(index, index - 1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      style={{ opacity: index === 0 ? 0.3 : 1, width: 20, height: 16 }}
                    >
                      ▲
                    </button>
                    <button
                      className="file-item-remove"
                      onClick={() => index < files.length - 1 && moveFile(index, index + 1)}
                      disabled={index === files.length - 1}
                      aria-label="Move down"
                      style={{ opacity: index === files.length - 1 ? 0.3 : 1, width: 20, height: 16 }}
                    >
                      ▼
                    </button>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--ink-tertiary)', width: 24, textAlign: 'center' }}>
                    {index + 1}
                  </span>
                  <ToolIcon name="pdf" size={18} className="ink-subtle" />
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <button className="file-item-remove" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                    <ToolIcon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Extra file drop slot */}
            <div style={{ marginTop: 'var(--space-md)' }}>
              <FileDropzone
                accept=".pdf"
                multiple={true}
                onFilesSelected={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
                label="Add more PDF files"
                sublabel="Drag and drop or click to append"
                id="merge-append-dropzone"
              />
            </div>
          </div>

          {/* Right panel: Actions Sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Merge configuration</p>
              
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="ink-muted">Files to merge:</span>
                  <span style={{ fontWeight: 600 }}>{files.length}</span>
                </div>
              </div>

              {processing && (
                <div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="body-sm ink-subtle" style={{ textAlign: 'center', marginTop: 4 }}>
                    Merging... {progress}%
                  </p>
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
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  ✓ Merge successful!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleMerge}
                disabled={files.length < 2 || processing}
                style={{ width: '100%' }}
                id="merge-button"
              >
                {processing ? 'Merging...' : 'Merge PDFs'}
                <ToolIcon name="merge" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
