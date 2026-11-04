'use client';

import { useEffect, useEffectEvent, useRef, useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { mergePdfs, downloadPdf, getPageCount } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { generateThumbnail } from '@/lib/renderUtils';

const MAX_FILES = 20;
const LONG_PRESS_MS = 320;
const SCROLL_SLOP_PX = 8; // moving further than this before the hold completes means scrolling

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

// A stable id per file, so a card keeps its element (and the touch) while it moves.
const cardIds = new WeakMap();
let nextCardId = 0;
function cardId(file) {
  if (!cardIds.has(file)) cardIds.set(file, (nextCardId += 1));
  return cardIds.get(file);
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MergePreviewCard({
  file,
  index,
  pageCount,
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
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
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
    <li
      className={`merge-card ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      aria-label={`${file.name}, position ${index + 1}`}
      data-merge-index={index}
    >
      <span
        className="merge-card-handle"
        aria-hidden="true"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
      </span>
      <span className="merge-card-order">{index + 1}</span>
      <button type="button" className="merge-card-remove" onClick={onRemove} aria-label={`Remove ${file.name}`}>
        <ToolIcon name="x" size={15} />
      </button>

      <div className="merge-card-paper">
        {loading ? (
          <span className="merge-card-loading">Loading…</span>
        ) : thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- PDF thumbnails are generated as client-side data URLs.
          <img src={thumbnail} alt={`First page of ${file.name}`} draggable={false} />
        ) : (
          <span className="merge-card-loading">
            <ToolIcon name="pdf" size={30} />
            No preview
          </span>
        )}
      </div>

      <div className="merge-card-meta">
        <strong title={file.name}>{file.name}</strong>
        <span>
          {pageCount ? `${pageCount} page${pageCount === 1 ? '' : 's'} · ` : ''}
          {formatSize(file.size)}
        </span>
      </div>

      <div className="merge-card-move">
        <button type="button" onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move ${file.name} earlier`}>←</button>
        <button type="button" onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Move ${file.name} later`}>→</button>
      </div>
    </li>
  );
}

export default function MergePDFClient() {
  const [files, setFiles] = useState([]);
  const [pageCounts, setPageCounts] = useState({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [mergedDoc, setMergedDoc] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [outputName, setOutputName] = useState('');
  const addInputRef = useRef(null);
  const deliver = useResultHandoff('merge-pdf');

  // Page counts load in the background; the summary fills in as they arrive.
  const requestedCounts = useRef(new Set());
  useEffect(() => {
    files
      .filter((file) => !requestedCounts.current.has(fileKey(file)))
      .forEach((file) => {
        const key = fileKey(file);
        requestedCounts.current.add(key);
        getPageCount(file)
          .then((count) => setPageCounts((prev) => ({ ...prev, [key]: count })))
          .catch(() => setPageCounts((prev) => ({ ...prev, [key]: null })));
      });
  }, [files]);

  const resetOutput = () => {
    setDone(false);
    setMergedDoc(null);
  };

  const handleFilesSelected = useCallback((newFiles) => {
    setFiles(newFiles.slice(0, MAX_FILES));
    setDone(false);
    setMergedDoc(null);
  }, []);

  const appendFiles = useCallback((newFiles) => {
    const incoming = Array.from(newFiles || []).filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (incoming.length === 0) return;

    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
    setDone(false);
    setMergedDoc(null);
  }, []);

  const moveFile = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= files.length || fromIndex === toIndex) return;
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
    resetOutput();
  };

  const sortByName = () => {
    setFiles((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
    resetOutput();
  };

  const reverseOrder = () => {
    setFiles((prev) => [...prev].reverse());
    resetOutput();
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    resetOutput();
  };

  const clearFiles = () => {
    setFiles([]);
    setDone(false);
    setMergedDoc(null);
    setProgress(0);
    setOutputName('');
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

  // Touch reordering from the handle (the browser's built-in drag doesn't work on touchscreens).
  const handleTouchDragStart = (event, index) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragIndex(index);
  };

  const gridRef = useRef(null);
  const longPress = useRef({ timer: null, active: false, index: null, x: 0, y: 0 });

  const onGridTouchStart = useEffectEvent((event) => {
    const press = longPress.current;
    const card = event.target.closest('[data-merge-index]');
    if (!card || event.touches.length > 1 || event.target.closest('button, .merge-card-handle')) return;
    press.x = event.touches[0].clientX;
    press.y = event.touches[0].clientY;
    press.timer = setTimeout(() => {
      press.active = true;
      press.index = Number(card.dataset.mergeIndex);
      setDragIndex(press.index);
      navigator.vibrate?.(15);
    }, LONG_PRESS_MS);
  });

  const onGridTouchMove = useEffectEvent((event) => {
    const press = longPress.current;
    const touch = event.touches[0];
    if (!press.active) {
      if (Math.hypot(touch.clientX - press.x, touch.clientY - press.y) > SCROLL_SLOP_PX) clearTimeout(press.timer);
      return;
    }
    event.preventDefault(); // the finger is dragging a row, not scrolling the page
    const card = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-merge-index]');
    if (!card) return;
    const target = Number(card.dataset.mergeIndex);
    if (target !== press.index) {
      moveFile(press.index, target);
      press.index = target;
      setDragIndex(target);
    }
  });

  const onGridTouchEnd = useEffectEvent(() => {
    const press = longPress.current;
    clearTimeout(press.timer);
    if (press.active) {
      press.active = false;
      setDragIndex(null);
    }
  });

  const hasFiles = files.length > 0;
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const start = (e) => onGridTouchStart(e);
    const move = (e) => onGridTouchMove(e);
    const end = () => onGridTouchEnd();
    grid.addEventListener('touchstart', start, { passive: true });
    // Not passive: a drag must be able to stop the page from scrolling.
    grid.addEventListener('touchmove', move, { passive: false });
    grid.addEventListener('touchend', end);
    grid.addEventListener('touchcancel', end);
    return () => {
      grid.removeEventListener('touchstart', start);
      grid.removeEventListener('touchmove', move);
      grid.removeEventListener('touchend', end);
      grid.removeEventListener('touchcancel', end);
    };
  }, [hasFiles]);

  const handleTouchDragMove = (event) => {
    if (dragIndex === null) return;
    const card = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-merge-index]');
    if (!card) return;
    const target = Number(card.dataset.mergeIndex);
    if (target !== dragIndex) {
      moveFile(dragIndex, target);
      setDragIndex(target);
    }
  };


  const defaultOutputName = files.length
    ? `${files[0].name.replace(/\.pdf$/i, '')}-merged.pdf`
    : 'merged.pdf';
  const outputFilename = (() => {
    const name = outputName.trim();
    if (!name) return defaultOutputName;
    return name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;
  })();

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setProgress(10);

    try {
      setProgress(30);
      const doc = await mergePdfs(files);
      setMergedDoc(doc);
      setProgress(80);
      await deliver(doc, outputFilename, 'application/pdf', { summary: `${files.length} files merged` });
      setProgress(100);
      setDone(true);
    } catch (err) {
      alert('Error merging PDFs: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRedownload = async () => {
    if (mergedDoc) {
      await downloadPdf(mergedDoc, outputFilename);
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const counts = files.map((file) => pageCounts[fileKey(file)]);
  const totalPages = counts.every((count) => typeof count === 'number')
    ? counts.reduce((sum, count) => sum + count, 0)
    : null;

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine PDFs in the order you want. Everything happens in your browser."
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
          description="Combine PDFs in the order you want."
          icon="merge"
          iconColor="var(--tool-organize)"
          ariaLabel="Merge PDF settings"
          preview={(
            <div className="merge-workspace">
              <div className="ws-toolbar">
                <span>
                  <strong>{files.length} file{files.length === 1 ? '' : 's'}</strong> · hold and drag to reorder
                </span>
                <div className="ws-toolbar-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={sortByName} disabled={processing || files.length < 2}>
                    Sort A–Z
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={reverseOrder} disabled={processing || files.length < 2}>
                    Reverse
                  </button>
                </div>
              </div>

              <ol className="merge-grid" ref={gridRef}>
                {files.map((file, index) => (
                  <MergePreviewCard
                    key={cardId(file)}
                    file={file}
                    index={index}
                    pageCount={pageCounts[fileKey(file)]}
                    isDragging={dragIndex === index}
                    isDropTarget={dragOverIndex === index && dragIndex !== null}
                    onDragStart={(event) => {
                      // Touchscreens use the long press above, not the browser's own drag.
                      if (window.matchMedia('(pointer: coarse)').matches) {
                        event.preventDefault();
                        return;
                      }
                      handleDragStart(index);
                    }}
                    onDragOver={(event) => handleDragOver(event, index)}
                    onDrop={(event) => handleDrop(event, index)}
                    onDragEnd={handleDragEnd}
                    onMoveUp={() => moveFile(index, index - 1)}
                    onMoveDown={() => moveFile(index, index + 1)}
                    onRemove={() => removeFile(index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < files.length - 1}
                    onHandlePointerDown={(event) => handleTouchDragStart(event, index)}
                    onHandlePointerMove={handleTouchDragMove}
                    onHandlePointerUp={handleDragEnd}
                  />
                ))}
                {files.length < MAX_FILES && (
                  <li className="merge-add-tile">
                    <button type="button" onClick={() => addInputRef.current?.click()} disabled={processing}>
                      <ToolIcon name="plus" size={26} />
                      Add files
                    </button>
                  </li>
                )}
              </ol>
              <input
                ref={addInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={(event) => {
                  appendFiles(event.target.files);
                  event.target.value = '';
                }}
                hidden
              />
            </div>
          )}
          footer={(
            done ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  className="btn btn-primary btn-lg btn-success-state"
                  onClick={handleRedownload}
                  style={{ width: '100%' }}
                  id="redownload-merge-button"
                >
                  <ToolIcon name="download" size={16} style={{ marginRight: 6 }} />
                  Download Merged PDF Again
                </button>
                <button type="button" className="btn btn-secondary" onClick={clearFiles} disabled={processing} style={{ width: '100%' }}>
                  Merge Other PDFs
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button className="btn btn-primary btn-lg" onClick={handleMerge} disabled={files.length < 2 || processing} id="merge-button" style={{ width: '100%' }}>
                  {processing ? 'Merging...' : `Merge ${files.length} PDF${files.length === 1 ? '' : 's'}`}
                </button>
                <button type="button" className="btn btn-secondary" onClick={clearFiles} disabled={processing} style={{ width: '100%' }}>
                  Start over
                </button>
              </div>
            )
          )}
        >
          <div className="ws-stats ws-stats-3">
            <div className="ws-stat">
              <strong>{files.length}</strong>
              <span>files</span>
            </div>
            <div className="ws-stat">
              <strong>{totalPages ?? '…'}</strong>
              <span>pages</span>
            </div>
            <div className="ws-stat">
              <strong>{formatSize(totalSize)}</strong>
              <span>size</span>
            </div>
          </div>

          <label className="ws-field">
            <span>Output name</span>
            <input
              type="text"
              className="input"
              value={outputName}
              placeholder={defaultOutputName}
              onChange={(event) => setOutputName(event.target.value)}
              disabled={processing}
            />
          </label>

          {files.length < 2 && <div className="merge-warning">Add at least 2 PDFs to merge.</div>}

          {processing && (
            <div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="body-sm ink-subtle" style={{ textAlign: 'center', marginTop: 4 }}>Merging... {progress}%</p>
            </div>
          )}
        </PageToolWorkspace>
      )}

      {done && (
        <ToastNotification
          message="PDFs merged & downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
