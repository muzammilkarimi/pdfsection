'use client';

import { useState, useCallback, useRef } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { mergePdfs, downloadPdf } from '@/lib/pdfUtils';

const MAX_FILES = 20;

export default function MergePDFClient() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const addInputRef = useRef(null);

  const handleFilesSelected = useCallback((newFiles) => {
    setFiles(newFiles.slice(0, MAX_FILES));
    setDone(false);
  }, []);

  const appendFiles = useCallback((newFiles) => {
    const incoming = Array.from(newFiles || []).filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (incoming.length === 0) return;

    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
    setDone(false);
  }, []);

  const moveFile = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= files.length || fromIndex === toIndex) return;
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
    setDone(false);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setDone(false);
  };

  const clearFiles = () => {
    setFiles([]);
    setDone(false);
    setProgress(0);
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
    setDragOverIndex(index);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    if (dragIndex !== null) moveFile(dragIndex, index);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
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

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document. Drag files to set the final order."
      icon="merge"
      iconColor="var(--tool-organize)"
    >
      {files.length === 0 ? (
        <FileDropzone
          accept=".pdf"
          multiple={true}
          maxFiles={MAX_FILES}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF files here"
          id="merge-dropzone"
        />
      ) : (
        <div className="merge-workspace">
          <div className="merge-main-panel">
            <div className="merge-panel-header">
              <div>
                <p className="eyebrow ink-subtle">Reorder files</p>
                <h2 className="merge-panel-title">Drag into the final PDF order</h2>
              </div>
              <span className="badge">{files.length} of {MAX_FILES} files</span>
            </div>

            <div className="merge-drop-hint">
              <ToolIcon name="reorder" size={16} />
              <span>Drag a row up or down. The first file becomes the first pages in your merged PDF.</span>
            </div>

            <div className="merge-file-list">
              {files.map((file, index) => {
                const isDragging = dragIndex === index;
                const isDropTarget = dragOverIndex === index && dragIndex !== null;

                return (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className={`merge-file-row ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(event) => handleDragOver(event, index)}
                    onDrop={(event) => handleDrop(event, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="merge-drag-handle" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="merge-file-index">{index + 1}</div>

                    <div className="merge-file-icon">
                      <ToolIcon name="pdf" size={18} />
                    </div>

                    <div className="merge-file-meta">
                      <span className="merge-file-name">{file.name}</span>
                      <span className="merge-file-detail">{formatSize(file.size)}</span>
                    </div>

                    <div className="merge-row-actions">
                      <button
                        type="button"
                        className="merge-icon-button"
                        onClick={() => moveFile(index, index - 1)}
                        disabled={index === 0}
                        aria-label={`Move ${file.name} up`}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="merge-icon-button"
                        onClick={() => moveFile(index, index + 1)}
                        disabled={index === files.length - 1}
                        aria-label={`Move ${file.name} down`}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="merge-remove-button"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <ToolIcon name="x" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="merge-add-card"
              onClick={() => addInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
            >
              <ToolIcon name="upload" size={18} />
              <span>{files.length >= MAX_FILES ? 'Maximum files added' : 'Add more PDFs'}</span>
            </button>
            <input
              ref={addInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={(event) => {
                appendFiles(event.target.files);
                event.target.value = '';
              }}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </div>

          <aside className="merge-sidebar">
            <div className="card merge-summary-card">
              <p className="eyebrow ink-subtle">Merge configuration</p>

              <div className="merge-summary-list">
                <div>
                  <span className="ink-muted">Files</span>
                  <strong>{files.length}</strong>
                </div>
                <div>
                  <span className="ink-muted">Total size</span>
                  <strong>{formatSize(totalSize)}</strong>
                </div>
                <div>
                  <span className="ink-muted">Output</span>
                  <strong>merged.pdf</strong>
                </div>
              </div>

              {files.length < 2 && (
                <div className="merge-warning">Add at least 2 PDFs to merge.</div>
              )}

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
                <div className="merge-success">Merge complete. Check your downloaded file.</div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleMerge}
                disabled={files.length < 2 || processing}
                style={{ width: '100%' }}
                id="merge-button"
              >
                {processing ? 'Merging...' : 'Merge PDFs'}
                <ToolIcon name="merge" size={16} />
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearFiles}
                disabled={processing}
                style={{ width: '100%' }}
              >
                Start over
              </button>
            </div>
          </aside>
        </div>
      )}
    </ToolPageLayout>
  );
}