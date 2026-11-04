'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Caveat, Dancing_Script, Great_Vibes } from 'next/font/google';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, savePdf } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';

// Bundled with the site, so typing a signature never requests a font from another server.
const caveat = Caveat({ subsets: ['latin'], display: 'swap' });
const dancingScript = Dancing_Script({ subsets: ['latin'], display: 'swap' });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', display: 'swap' });

const HANDWRITING = [
  { id: 'caveat', family: caveat.style.fontFamily, size: 34 },
  { id: 'dancing', family: dancingScript.style.fontFamily, size: 30 },
  { id: 'vibes', family: greatVibes.style.fontFamily, size: 32 },
];

const INKS = [
  { id: 'blue', label: 'Blue ink', color: '#1d2a8a' },
  { id: 'black', label: 'Black ink', color: '#141320' },
];

// What can be added to a page, and how big it starts (in the 600-unit-wide page space used for placement).
const STAMP_KINDS = [
  { id: 'signature', label: 'Signature', width: 150 },
  { id: 'initials', label: 'Initials', width: 70 },
  { id: 'date', label: 'Date', width: 110 },
  { id: 'text', label: 'Text', width: 160 },
];

const SAVED_KEYS = { signature: 'pdfsection.savedSignature', initials: 'pdfsection.savedInitials' };
const PLACEMENT_WIDTH = 600;
const MIN_STAMP_WIDTH = 30;

function readSaved(kind) {
  if (typeof window === 'undefined' || !SAVED_KEYS[kind]) return null;
  try {
    return localStorage.getItem(SAVED_KEYS[kind]);
  } catch {
    return null;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Crops a canvas to its drawn pixels, with a little padding, so stamps aren't mostly empty space.
function trimCanvas(canvas, padding = 8) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  const out = document.createElement('canvas');
  out.width = right - left + 1 + padding * 2;
  out.height = bottom - top + 1 + padding * 2;
  out.getContext('2d').drawImage(canvas, left, top, right - left + 1, bottom - top + 1, padding, padding, right - left + 1, bottom - top + 1);
  return out;
}

async function textToImage(text, fontFamily, color, fontSize = 96) {
  await document.fonts.load(`${fontSize}px ${fontFamily}`);
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `${fontSize}px ${fontFamily}`;
  const width = Math.ceil(measure.measureText(text).width) + 40;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.ceil(fontSize * 1.6);
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 20, canvas.height / 2);
  return (trimCanvas(canvas) || canvas).toDataURL('image/png');
}

function SignatureDialog({ kind, ink, onInkChange, onClose, onCreate }) {
  const isText = kind === 'text';
  const [method, setMethod] = useState('type');
  const [value, setValue] = useState('');
  const [styleId, setStyleId] = useState(HANDWRITING[0].id);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const padRef = useRef(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const uploadRef = useRef(null);
  const [uploaded, setUploaded] = useState(null);

  const inkColor = INKS.find((i) => i.id === ink).color;
  const title = kind === 'initials' ? 'Create your initials' : isText ? 'Add text' : 'Create your signature';
  const methods = isText ? [] : ['draw', 'type', 'upload'];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const padPoint = (e) => {
    const canvas = padRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e) => {
    const ctx = padRef.current.getContext('2d');
    const { x, y } = padPoint(e);
    padRef.current.setPointerCapture(e.pointerId);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
  };

  const moveDraw = (e) => {
    if (!drawingRef.current) return;
    const ctx = padRef.current.getContext('2d');
    const { x, y } = padPoint(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    hasInkRef.current = true;
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearPad = () => {
    const canvas = padRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
  };

  const handleUpload = async (fileList) => {
    const imageFile = fileList?.[0];
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    try {
      const img = await loadImage(url);
      const scale = Math.min(1, 900 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      setUploaded(canvas.toDataURL('image/png'));
      setError('');
    } catch {
      setError('That image could not be opened. Try a PNG or JPG.');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const create = async () => {
    let image = null;
    if (method === 'draw') {
      if (!hasInkRef.current) {
        setError('Draw your signature in the box first.');
        return;
      }
      image = (trimCanvas(padRef.current) || padRef.current).toDataURL('image/png');
    } else if (method === 'upload') {
      if (!uploaded) {
        setError('Choose an image of your signature first.');
        return;
      }
      image = uploaded;
    } else {
      if (!value.trim()) {
        setError(isText ? 'Type the text to add.' : 'Type your name first.');
        return;
      }
      const family = isText ? 'Inter, system-ui, sans-serif' : HANDWRITING.find((s) => s.id === styleId).family;
      image = await textToImage(value.trim(), family, inkColor, isText ? 64 : 96);
    }
    onCreate(image, !isText && remember);
  };

  return (
    <div className="sign-dialog-backdrop" onClick={onClose}>
      <div
        className="sign-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sign-dialog-head">
          <h2 id="sign-dialog-title">{title}</h2>
          <button type="button" className="sign-dialog-close" onClick={onClose} aria-label="Close">
            <ToolIcon name="x" size={18} />
          </button>
        </div>

        {methods.length > 0 && (
          <div className="ws-tabs sign-dialog-tabs" role="tablist" aria-label="How to create it">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={method === m}
                onClick={() => {
                  setMethod(m);
                  setError('');
                }}
              >
                {m === 'draw' ? 'Draw' : m === 'type' ? 'Type' : 'Upload image'}
              </button>
            ))}
          </div>
        )}

        {method === 'draw' && (
          <div className="sign-pad-wrap">
            <canvas
              ref={padRef}
              width={1120}
              height={360}
              className="sign-pad"
              aria-label="Draw your signature here"
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerCancel={endDraw}
            />
            <button type="button" className="ws-link-button" onClick={clearPad}>Clear</button>
          </div>
        )}

        {method === 'type' && (
          <>
            <label className="ws-field">
              <span>{isText ? 'Text' : kind === 'initials' ? 'Your initials' : 'Your name'}</span>
              <input
                type="text"
                className="input"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                autoFocus
              />
            </label>
            {!isText && (
              <div className="sign-styles" role="radiogroup" aria-label="Signature style">
                {HANDWRITING.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    role="radio"
                    aria-checked={styleId === style.id}
                    className="sign-style"
                    style={{ fontFamily: style.family, fontSize: style.size, color: inkColor }}
                    onClick={() => setStyleId(style.id)}
                  >
                    {value.trim() || (kind === 'initials' ? 'J.D.' : 'Your name')}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {method === 'upload' && (
          <div className="sign-upload">
            {uploaded ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen image
              <img src={uploaded} alt="Your signature image" />
            ) : (
              <span>A photo or scan of your signature. A white or clear background works best.</span>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => uploadRef.current?.click()}>
              {uploaded ? 'Choose another image' : 'Choose image'}
            </button>
            <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => handleUpload(e.target.files)} />
          </div>
        )}

        {method !== 'upload' && (
          <div className="sign-ink" role="radiogroup" aria-label="Ink colour">
            <span>Ink</span>
            {INKS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={ink === option.id}
                aria-label={option.label}
                className="sign-ink-dot"
                style={{ background: option.color, '--ink': option.color }}
                onClick={() => onInkChange(option.id)}
              />
            ))}
          </div>
        )}

        {!isText && (
          <label className="sign-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember this {kind === 'initials' ? 'set of initials' : 'signature'} in this browser
          </label>
        )}

        {error && <p className="sign-error" role="alert">{error}</p>}

        <div className="sign-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={create}>
            {isText ? 'Add text' : `Use ${kind === 'initials' ? 'initials' : 'signature'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignPDFClient() {
  const deliver = useResultHandoff('sign-pdf');
  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [renderingPage, setRenderingPage] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // Images made for each kind (saved signature and initials come back from this browser).
  const [stampImages, setStampImages] = useState(() => ({
    signature: readSaved('signature'),
    initials: readSaved('initials'),
  }));
  const [activeKind, setActiveKind] = useState(null);
  const [dialogKind, setDialogKind] = useState(null);
  const [ink, setInk] = useState('blue');
  const [stampedSignatures, setStampedSignatures] = useState({}); // { pageIndex: [{ x, y, w, aspect, imgData }] }
  const [dragIndex, setDragIndex] = useState(null);
  const [dragStart, setDragStart] = useState({ offsetX: 0, offsetY: 0 });
  // Resizing from the corner handle: which stamp, and where the pointer and width started.
  const [resize, setResize] = useState(null); // { index, startX, startW }
  const justMovedRef = useRef(false);

  const canvasRef = useRef(null);

  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setStampedSignatures({});
    setCurrentPageIndex(0);

    try {
      const doc = await loadPdfForRender(f);
      setPdfRenderDoc(doc);
      setTotalPages(doc.numPages);
    } catch (err) {
      alert('Error loading PDF: ' + err.message);
    }
  }, []);

  const resetFile = () => {
    setFile(null);
    setPdfRenderDoc(null);
    setDone(false);
    setActiveKind(null);
  };

  const renderCurrentPage = useCallback(async () => {
    if (!pdfRenderDoc || !canvasRef.current) return;
    setRenderingPage(true);
    try {
      await renderPageToCanvas(pdfRenderDoc, currentPageIndex + 1, canvasRef.current, 1.5);
    } catch (err) {
      console.error(err);
    } finally {
      setRenderingPage(false);
    }
  }, [pdfRenderDoc, currentPageIndex]);

  useEffect(() => {
    if (pdfRenderDoc) {
      renderCurrentPage();
    }
  }, [pdfRenderDoc, currentPageIndex, renderCurrentPage]);

  const chooseKind = async (kind) => {
    if (kind === 'date') {
      const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      const image = await textToImage(date, 'Inter, system-ui, sans-serif', INKS.find((i) => i.id === ink).color, 64);
      setStampImages((prev) => ({ ...prev, date: image }));
      setActiveKind('date');
      return;
    }
    if (stampImages[kind] && kind !== 'text') {
      setActiveKind(kind);
      return;
    }
    setDialogKind(kind);
  };

  const handleCreate = (image, remember) => {
    const kind = dialogKind;
    setStampImages((prev) => ({ ...prev, [kind]: image }));
    setActiveKind(kind);
    setDialogKind(null);
    if (SAVED_KEYS[kind]) {
      try {
        if (remember) localStorage.setItem(SAVED_KEYS[kind], image);
        else localStorage.removeItem(SAVED_KEYS[kind]);
      } catch {
        // Storage blocked: the stamp still works for this session.
      }
    }
  };

  const handlePageClick = async (e) => {
    const image = activeKind && stampImages[activeKind];
    if (!image || !canvasRef.current || dragIndex !== null) return;
    if (e.target !== canvasRef.current && e.target.id !== 'signature-overlay-container') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const img = await loadImage(image);
    const width = STAMP_KINDS.find((k) => k.id === activeKind).width;
    const aspect = img.width / img.height;
    const wFraction = width / PLACEMENT_WIDTH;
    const hFraction = (wFraction * rect.width) / aspect / rect.height;
    const x = (e.clientX - rect.left) / rect.width - wFraction / 2;
    const y = (e.clientY - rect.top) / rect.height - hFraction / 2;

    setStampedSignatures((prev) => ({
      ...prev,
      [currentPageIndex]: [
        ...(prev[currentPageIndex] || []),
        {
          x: Math.max(0, Math.min(1 - wFraction, x)),
          y: Math.max(0, Math.min(1 - hFraction, y)),
          w: width,
          aspect,
          imgData: image,
        },
      ],
    }));
    setDone(false);
  };

  const deleteSignature = (idx) => {
    setStampedSignatures((prev) => ({
      ...prev,
      [currentPageIndex]: (prev[currentPageIndex] || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSignatureStartDrag = (e, idx, sig) => {
    e.stopPropagation();
    e.preventDefault();
    setDragIndex(idx);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      offsetX: (e.clientX - rect.left) / rect.width - sig.x,
      offsetY: (e.clientY - rect.top) / rect.height - sig.y,
    });
  };

  const handleResizeStart = (e, idx, sig) => {
    e.stopPropagation();
    e.preventDefault();
    setResize({ index: idx, startX: e.clientX, startW: sig.w });
  };

  const handleWorkspacePointerMove = (e) => {
    if (resize) {
      const rect = canvasRef.current.getBoundingClientRect();
      setStampedSignatures((prev) => {
        const pageSigs = [...(prev[currentPageIndex] || [])];
        const sig = pageSigs[resize.index];
        if (!sig) return prev;
        const proposed = resize.startW + ((e.clientX - resize.startX) / rect.width) * PLACEMENT_WIDTH;
        // Keep it on the page both ways: the right edge and, through the aspect ratio, the bottom edge.
        const maxByWidth = (1 - sig.x) * PLACEMENT_WIDTH;
        const maxByHeight = ((1 - sig.y) * rect.height * sig.aspect / rect.width) * PLACEMENT_WIDTH;
        pageSigs[resize.index] = { ...sig, w: Math.max(MIN_STAMP_WIDTH, Math.min(proposed, maxByWidth, maxByHeight)) };
        return { ...prev, [currentPageIndex]: pageSigs };
      });
      return;
    }
    if (dragIndex === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setStampedSignatures((prev) => {
      const pageSigs = [...(prev[currentPageIndex] || [])];
      const sig = pageSigs[dragIndex];
      if (!sig) return prev;
      const wFraction = sig.w / PLACEMENT_WIDTH;
      const hFraction = (wFraction * rect.width) / sig.aspect / rect.height;
      pageSigs[dragIndex] = {
        ...sig,
        x: Math.max(0, Math.min(1 - wFraction, (e.clientX - rect.left) / rect.width - dragStart.offsetX)),
        y: Math.max(0, Math.min(1 - hFraction, (e.clientY - rect.top) / rect.height - dragStart.offsetY)),
      };
      return { ...prev, [currentPageIndex]: pageSigs };
    });
  };

  const handleWorkspacePointerUp = () => {
    if (dragIndex !== null || resize) justMovedRef.current = true;
    setDragIndex(null);
    setResize(null);
  };

  const placedCount = Object.values(stampedSignatures).flat().length;

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const pdfDoc = await loadPdf(file);
      const pages = pdfDoc.getPages();

      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const page = pages[pageIdx];
        const { width, height } = page.getSize();
        for (const sig of stampedSignatures[pageIdx] || []) {
          const bytes = await (await fetch(sig.imgData)).arrayBuffer();
          const embedded = await pdfDoc.embedPng(bytes);
          // Keep the stamp's own proportions, whatever the page size.
          const drawWidth = (sig.w / PLACEMENT_WIDTH) * width;
          const drawHeight = drawWidth / sig.aspect;
          page.drawImage(embedded, {
            x: sig.x * width,
            y: (1 - sig.y) * height - drawHeight,
            width: drawWidth,
            height: drawHeight,
          });
        }
      }

      const signedBytes = await savePdf(pdfDoc);
      await deliver(signedBytes, file.name.replace(/\.pdf$/i, '-signed.pdf'), 'application/pdf', {
        summary: `${placedCount} item${placedCount === 1 ? '' : 's'} added`,
      });
      setDone(true);
    } catch (err) {
      alert('Error signing PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const activeLabel = activeKind ? STAMP_KINDS.find((k) => k.id === activeKind).label.toLowerCase() : '';

  return (
    <ToolPageLayout
      title="Sign PDF"
      description="Draw, type, or stamp signatures directly onto your PDF pages."
      icon="sign"
      iconColor="var(--tool-security)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF to sign"
          id="sign-dropzone"
        />
      ) : (
        <div className="sign-workspace">
          <aside className="sign-palette" aria-label="Add to the page">
            <div className="sign-palette-file">
              <strong>{file.name}</strong>
              <button type="button" className="ws-link-button" onClick={resetFile} disabled={processing}>Change file</button>
            </div>

            <h2>Add to the page</h2>
            {STAMP_KINDS.map((kind) => (
              <div key={kind.id} className={`sign-palette-item ${activeKind === kind.id ? 'is-active' : ''}`}>
                <button type="button" className="sign-palette-main" onClick={() => chooseKind(kind.id)} aria-pressed={activeKind === kind.id}>
                  <span>{kind.label}</span>
                  {stampImages[kind.id] && kind.id !== 'date' && kind.id !== 'text' && (
                    // eslint-disable-next-line @next/next/no-img-element -- stamp preview generated in the browser
                    <img src={stampImages[kind.id]} alt="" />
                  )}
                </button>
                {stampImages[kind.id] && (kind.id === 'signature' || kind.id === 'initials') && (
                  <button type="button" className="ws-link-button sign-palette-change" onClick={() => setDialogKind(kind.id)}>
                    Change
                  </button>
                )}
              </div>
            ))}

            <div className="sign-palette-footer">
              <span className="sign-palette-count">
                {placedCount} item{placedCount === 1 ? '' : 's'} placed
              </span>
              <button
                className={`btn btn-lg ${done ? 'btn-success-state' : 'btn-primary'}`}
                onClick={handleSave}
                disabled={processing || placedCount === 0}
                id="save-signed-pdf-button"
              >
                {processing ? 'Saving…' : 'Save signed PDF'}
              </button>
              <p className="ws-privacy">
                <ToolIcon name="lock" size={13} />
                Signed in your browser. Nothing is uploaded.
              </p>
            </div>
          </aside>

          <section className="sign-stage" aria-label="Page">
            <div className="sign-stage-bar">
              <div className="sign-pager">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPageIndex === 0}
                  onClick={() => setCurrentPageIndex((prev) => prev - 1)}
                  aria-label="Previous page"
                >
                  ←
                </button>
                <span>Page {currentPageIndex + 1} of {totalPages}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPageIndex >= totalPages - 1}
                  onClick={() => setCurrentPageIndex((prev) => prev + 1)}
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
              <span className="sign-hint">
                {activeKind ? `Click the page to place your ${activeLabel}` : 'Pick something to add on the left'}
              </span>
            </div>

            <div
              id="signature-overlay-container"
              className={`sign-page ${activeKind ? 'is-placing' : ''} ${dragIndex !== null ? 'is-dragging' : ''} ${resize ? 'is-resizing' : ''}`}
              onClick={(e) => {
                // The click that ends a drag or resize must not drop a new stamp.
                if (justMovedRef.current) {
                  justMovedRef.current = false;
                  return;
                }
                handlePageClick(e);
              }}
              onPointerMove={handleWorkspacePointerMove}
              onPointerUp={handleWorkspacePointerUp}
              onPointerLeave={handleWorkspacePointerUp}
            >
              <canvas ref={canvasRef} />

              <div className="sign-stamps">
                {(stampedSignatures[currentPageIndex] || []).map((sig, idx) => (
                  <div
                    key={idx}
                    className={`sign-stamp ${dragIndex === idx ? 'is-dragging' : ''}`}
                    style={{ left: `${sig.x * 100}%`, top: `${sig.y * 100}%`, width: `${(sig.w / PLACEMENT_WIDTH) * 100}%` }}
                    onPointerDown={(e) => handleSignatureStartDrag(e, idx, sig)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- stamps are generated in the browser */}
                    <img src={sig.imgData} alt="Placed item" />
                    <button
                      type="button"
                      className="sign-stamp-delete"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSignature(idx);
                      }}
                      aria-label="Remove"
                    >
                      <ToolIcon name="x" size={12} />
                    </button>
                    <span
                      className="sign-stamp-resize"
                      onPointerDown={(e) => handleResizeStart(e, idx, sig)}
                      title="Drag to resize"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>

              {renderingPage && <div className="sign-page-loading">Loading page…</div>}
            </div>
          </section>
        </div>
      )}

      {dialogKind && (
        <SignatureDialog
          kind={dialogKind}
          ink={ink}
          onInkChange={setInk}
          onClose={() => setDialogKind(null)}
          onCreate={handleCreate}
        />
      )}

      {done && (
        <ToastNotification
          message="✓ Signed PDF created and downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
