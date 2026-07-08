'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { mergePdfs, downloadPdf } from '@/lib/pdfUtils';
import { generateThumbnail } from '@/lib/renderUtils';

const MAX_FILES = 20;

function MergePreviewCard({
  file,
  index,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  formatSize,
}) {
  const [thumbnail, setThumbnail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setThumbnail('');
      }
    });

    generateThumbnail(file, 1, 190)
      .then((dataUrl) => {
        if (!cancelled) setThumbnail(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setThumbnail('');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <article
      className={`merge-preview-card ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      aria-label={`${file.name}, position ${index + 1}`}
    >
      <div className="merge-preview-order">{index + 1}</div>
      <div className="merge-preview-drag" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="merge-preview-paper">
        {loading ? (
          <div className="merge-preview-loading">Loading...</div>
        ) : thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- PDF thumbnails are generated as client-side data URLs.
          <img src={thumbnail} alt={`First page preview of ${file.name}`} draggable={false} />
        ) : (
          <div className="merge-preview-fallback">
            <ToolIcon name="pdf" size={34} />
            <span>Preview unavailable</span>
          </div>
        )}
      </div>

      <div className="merge-preview-meta">
        <strong>{file.name}</strong>
        <span>{formatSize(file.size)}</span>
      </div>

      <div className="merge-preview-actions">
        <button type="button" className="merge-icon-button" onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move ${file.name} up`}>
          Up
        </button>
        <button type="button" className="merge-icon-button" onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Move ${file.name} down`}>
          Down
        </button>
        <button type="button" className="merge-remove-button" onClick={onRemove} aria-label={`Remove ${file.name}`}>
          <ToolIcon name="x" size={14} />
        </button>
      </div>
    </article>
  );
}

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
      showHeader={files.length === 0}
      layoutMode={files.length > 0 ? 'page-preview' : 'page-scroll'}
    >
      {files.length === 0 ? (
        <FileDropzone
          accept=".pdf"
          multiple={true}
          maxFiles={MAX_FILES}
          onFilesSelected={handleFilesSelected}
          label="Select PDF files"
          id="merge-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title="Merge PDF"
          description="Drag first-page previews into the final merged order."
          icon="merge"
          iconColor="var(--tool-organize)"
          ariaLabel="Merge PDF settings"
          preview={(
            <div className="merge-preview-grid">
              {files.map((file, index) => (
                <MergePreviewCard
                  key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  file={file}
                  index={index}
                  isDragging={dragIndex === index}
                  isDropTarget={dragOverIndex === index && dragIndex !== null}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDrop={(event) => handleDrop(event, index)}
                  onDragEnd={handleDragEnd}
                  onMoveUp={() => moveFile(index, index - 1)}
                  onMoveDown={() => moveFile(index, index + 1)}
                  onRemove={() => removeFile(index)}
                  canMoveUp={index > 0}
                  canMoveDown={index < files.length - 1}
                  formatSize={formatSize}
                />
              ))}
            </div>
          )}
          footer={(
            <>
              <button className="btn btn-primary btn-lg btn-attention" onClick={handleMerge} disabled={files.length < 2 || processing} id="merge-button">
                {processing ? 'Merging...' : 'Merge PDFs'}
                <ToolIcon name="merge" size={16} />
              </button>
              <button type="button" className="btn btn-secondary" onClick={clearFiles} disabled={processing}>
                Start over
              </button>
            </>
          )}
        >
          <div className="page-control-stat">
            <span>Files selected</span>
            <strong>{files.length}</strong>
          </div>

          <div className="merge-summary-list">
            <div>
              <span className="ink-muted">Total size</span>
              <strong>{formatSize(totalSize)}</strong>
            </div>
            <div>
              <span className="ink-muted">Output</span>
              <strong>merged.pdf</strong>
            </div>
            <div>
              <span className="ink-muted">Limit</span>
              <strong>{files.length} / {MAX_FILES}</strong>
            </div>
          </div>

          <button type="button" className="merge-add-card" onClick={() => addInputRef.current?.click()} disabled={files.length >= MAX_FILES}>
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

          <div className="page-help-note">
            <ToolIcon name="reorder" size={16} />
            <span>The first preview becomes the first file in the merged PDF. Drag cards to reorder.</span>
          </div>

          {files.length < 2 && <div className="merge-warning">Add at least 2 PDFs to merge.</div>}

          {processing && (
            <div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="body-sm ink-subtle" style={{ textAlign: 'center', marginTop: 4 }}>Merging... {progress}%</p>
            </div>
          )}

          {done && <div className="merge-success">Merge complete. Check your downloaded file.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}



