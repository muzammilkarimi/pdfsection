'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import ToastNotification from '@/components/ToastNotification';
import SignatureDialog, { INKS, SAVED_KEYS, readSaved, loadImage, textToImage } from '@/components/SignatureDialog';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, savePdf } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';

// What can be added to a page, and how big it starts (in the 600-unit-wide page space used for placement).
const STAMP_KINDS = [
  { id: 'signature', label: 'Signature', width: 150 },
  { id: 'initials', label: 'Initials', width: 70 },
  { id: 'date', label: 'Date', width: 110 },
  { id: 'text', label: 'Text', width: 160 },
];
const PLACEMENT_WIDTH = 600;
const MIN_STAMP_WIDTH = 30;

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
  const [newStamp, setNewStamp] = useState(null); // { page, index } of the stamp just added, shown with a pulse

  const canvasRef = useRef(null);
  const stampedRef = useRef({});
  useEffect(() => { stampedRef.current = stampedSignatures; }, [stampedSignatures]);
  // the pulse on a new stamp fades after a moment
  useEffect(() => {
    if (!newStamp) return undefined;
    const t = setTimeout(() => setNewStamp(null), 1600);
    return () => clearTimeout(t);
  }, [newStamp]);

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
      placeInView('date', image);
      return;
    }
    if (stampImages[kind] && kind !== 'text') {
      setActiveKind(kind);
      placeInView(kind, stampImages[kind]);
      return;
    }
    setDialogKind(kind);
  };

  const handleCreate = (image, remember) => {
    const kind = dialogKind;
    setStampImages((prev) => ({ ...prev, [kind]: image }));
    setActiveKind(kind);
    setDialogKind(null);
    // on a phone the keyboard may still be closing and the page moving: place it once that settles
    setTimeout(() => placeInView(kind, image), window.matchMedia?.('(pointer: coarse)').matches ? 350 : 0);
    if (SAVED_KEYS[kind]) {
      try {
        if (remember) localStorage.setItem(SAVED_KEYS[kind], image);
        else localStorage.removeItem(SAVED_KEYS[kind]);
      } catch {
        // Storage blocked: the stamp still works for this session.
      }
    }
  };

  // Puts a stamp on the current page centred on (cx, cy), given as page fractions.
  const placeStamp = async (kind, image, cx, cy) => {
    if (!image || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const img = await loadImage(image);
    const width = STAMP_KINDS.find((k) => k.id === kind).width;
    const aspect = img.width / img.height;
    const wFraction = width / PLACEMENT_WIDTH;
    const hFraction = (wFraction * rect.width) / aspect / rect.height;
    const x = cx - wFraction / 2;
    const y = cy - hFraction / 2;

    setNewStamp({ page: currentPageIndex, index: (stampedRef.current[currentPageIndex] || []).length });
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

  const handlePageClick = (e) => {
    const image = activeKind && stampImages[activeKind];
    if (!image || !canvasRef.current || dragIndex !== null) return;
    if (e.target !== canvasRef.current && e.target.id !== 'signature-overlay-container') return;
    const rect = canvasRef.current.getBoundingClientRect();
    placeStamp(activeKind, image, (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  };

  // A new stamp goes straight onto the page, in the middle of the part you can see, and the page is
  // brought into view. On a phone the page is below the options, so tapping it was easy to miss.
  const placeInView = (kind, image) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    const onScreen = visibleBottom - visibleTop > 80;
    const cy = onScreen ? ((visibleTop + visibleBottom) / 2 - rect.top) / rect.height : 0.5;
    placeStamp(kind, image, 0.5, Math.max(0.05, Math.min(0.95, cy)));
    if (!onScreen) canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                {activeKind ? `Drag it into place, or tap the page to add another ${activeLabel}` : 'Pick something to add'}
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
                    className={`sign-stamp ${dragIndex === idx ? 'is-dragging' : ''} ${newStamp?.page === currentPageIndex && newStamp.index === idx ? 'is-new' : ''}`}
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
