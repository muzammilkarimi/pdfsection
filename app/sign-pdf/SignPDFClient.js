'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, savePdf, downloadBlob } from '@/lib/pdfUtils';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';

export default function SignPDFClient() {
  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [renderingPage, setRenderingPage] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // Signature drawing pad states
  const [sigMode, setSigMode] = useState('draw'); // 'draw', 'type'
  const [typedName, setTypedName] = useState('');
  const [signatureImage, setSignatureImage] = useState(null); // base64 PNG of signature
  const [stampedSignatures, setStampedSignatures] = useState({}); // { pageIndex: [ { x: 0.1, y: 0.2, w: 100, h: 50, imgData: ... } ] }
  const [dragIndex, setDragIndex] = useState(null);
  const [dragStart, setDragStart] = useState({ offsetX: 0, offsetY: 0 });

  const canvasRef = useRef(null);
  const sigCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Load PDF for rendering
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

  // Render current page to canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfRenderDoc || !canvasRef.current) return;
    setRenderingPage(true);
    try {
      const pageNum = currentPageIndex + 1;
      await renderPageToCanvas(pdfRenderDoc, pageNum, canvasRef.current, 1.5);
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

  // Drawing Pad Handlers
  const startSigDrawing = (e) => {
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    isDrawingRef.current = true;
  };

  const drawSig = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const endSigDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSigPad = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage(null);
  };

  // Convert Drawn or Typed signature to image
  const saveSignature = () => {
    if (sigMode === 'draw') {
      const canvas = sigCanvasRef.current;
      if (!canvas) return;
      // Check if blank
      const ctx = canvas.getContext('2d');
      const buffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const isBlank = !buffer.data.some(colorVal => colorVal !== 0);
      if (isBlank) {
        alert('Please draw a signature first.');
        return;
      }
      setSignatureImage(canvas.toDataURL('image/png'));
    } else {
      if (!typedName.trim()) {
        alert('Please type a name.');
        return;
      }
      // Draw typed name onto hidden canvas
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'italic bold 36px Georgia, serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 150, 50);
      setSignatureImage(canvas.toDataURL('image/png'));
    }
  };

  // Stamp saved signature onto page
  const handlePageClick = (e) => {
    if (!signatureImage || !canvasRef.current) return;
    if (dragIndex !== null) return;
    
    // Only stamp if clicked on the rendering canvas or the overlay container
    if (e.target !== canvasRef.current && e.target.id !== 'signature-overlay-container') {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newSig = {
      x: x - 0.1, // Center slightly on click
      y: y - 0.05,
      w: 120,
      h: 60,
      imgData: signatureImage,
    };

    setStampedSignatures((prev) => ({
      ...prev,
      [currentPageIndex]: [...(prev[currentPageIndex] || []), newSig],
    }));
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
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickXPercent = (clientX - rect.left) / rect.width;
    const clickYPercent = (clientY - rect.top) / rect.height;
    
    setDragStart({
      offsetX: clickXPercent - sig.x,
      offsetY: clickYPercent - sig.y
    });
  };

  const handleWorkspaceMouseMove = (e) => {
    if (dragIndex === null) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const rect = canvasRef.current.getBoundingClientRect();
    let nextX = (clientX - rect.left) / rect.width - dragStart.offsetX;
    let nextY = (clientY - rect.top) / rect.height - dragStart.offsetY;
    
    // Clamp inside canvas bounds
    const sigWidthPercent = 120 / rect.width;
    const sigHeightPercent = 60 / rect.height;
    
    nextX = Math.max(0, Math.min(1 - sigWidthPercent, nextX));
    nextY = Math.max(0, Math.min(1 - sigHeightPercent, nextY));
    
    setStampedSignatures((prev) => {
      const pageSigs = [...(prev[currentPageIndex] || [])];
      if (pageSigs[dragIndex]) {
        pageSigs[dragIndex] = {
          ...pageSigs[dragIndex],
          x: nextX,
          y: nextY
        };
      }
      return {
        ...prev,
        [currentPageIndex]: pageSigs
      };
    });
  };

  const handleWorkspaceMouseUp = () => {
    setDragIndex(null);
  };

  const clearPageSignatures = () => {
    setStampedSignatures((prev) => ({
      ...prev,
      [currentPageIndex]: [],
    }));
  };

  // Compile signatures using pdf-lib
  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const pdfDoc = await loadPdf(file);
      const pages = pdfDoc.getPages();

      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const page = pages[pageIdx];
        const { width, height } = page.getSize();
        const pageSigs = stampedSignatures[pageIdx] || [];

        for (const sig of pageSigs) {
          // Fetch image bytes
          const response = await fetch(sig.imgData);
          const arrayBuffer = await response.arrayBuffer();
          const embeddedImg = await pdfDoc.embedPng(arrayBuffer);

          const drawWidth = (sig.w / 600) * width; // Scale signature relative to page size
          const drawHeight = (sig.h / 800) * height;

          page.drawImage(embeddedImg, {
            x: sig.x * width,
            y: (1 - sig.y) * height - drawHeight,
            width: drawWidth,
            height: drawHeight,
          });
        }
      }

      const signedBytes = await savePdf(pdfDoc);
      downloadBlob(signedBytes, file.name.replace('.pdf', '-signed.pdf'), 'application/pdf');
      setDone(true);
    } catch (err) {
      alert('Error signing PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

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
        <PageToolWorkspace
          title="Sign PDF"
          description="Draw, type, or stamp signatures directly onto your PDF pages."
          icon="sign"
          iconColor="var(--tool-security)"
          file={file}
          onReset={() => {
            setFile(null);
            setPdfRenderDoc(null);
            setDone(false);
          }}
          preview={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%', alignItems: 'center' }}>
              {/* Pagination and page actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)', width: '100%', maxWidth: '650px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <button
                    className="btn btn-secondary btn-icon"
                    disabled={currentPageIndex === 0}
                    onClick={() => setCurrentPageIndex((prev) => prev - 1)}
                    style={{ padding: '6px 12px' }}
                  >
                    ◀
                  </button>
                  <span className="body-sm ink-muted" style={{ fontWeight: 500 }}>
                    Page {currentPageIndex + 1} of {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-icon"
                    disabled={currentPageIndex === totalPages - 1}
                    onClick={() => setCurrentPageIndex((prev) => prev + 1)}
                    style={{ padding: '6px 12px' }}
                  >
                    ▶
                  </button>
                </div>
                
                <button className="btn btn-tertiary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={clearPageSignatures}>
                  Clear Page
                </button>
              </div>

              {/* Rendering canvas */}
              <div
                id="signature-overlay-container"
                style={{
                  position: 'relative',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-lg)',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  cursor: dragIndex !== null ? 'grabbing' : (signatureImage ? 'cell' : 'default'),
                  alignSelf: 'center',
                  width: '100%',
                  maxWidth: '650px',
                  userSelect: 'none',
                }}
                onClick={handlePageClick}
                onMouseMove={handleWorkspaceMouseMove}
                onTouchMove={handleWorkspaceMouseMove}
                onMouseUp={handleWorkspaceMouseUp}
                onTouchEnd={handleWorkspaceMouseUp}
                onMouseLeave={handleWorkspaceMouseUp}
              >
                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto' }} />

                {/* Draw placed signatures */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {(stampedSignatures[currentPageIndex] || []).map((sig, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${sig.x * 100}%`,
                        top: `${sig.y * 100}%`,
                        width: `${(sig.w / 600) * 100}%`,
                        height: 'auto',
                        border: dragIndex === idx ? '2px solid var(--brand-blue)' : '1.5px dashed var(--brand-blue)',
                        cursor: 'move',
                        pointerEvents: 'auto',
                        touchAction: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box'
                      }}
                      onMouseDown={(e) => handleSignatureStartDrag(e, idx, sig)}
                      onTouchStart={(e) => handleSignatureStartDrag(e, idx, sig)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- Signature stamps are generated as client-side data URLs. */}
                      <img
                        src={sig.imgData}
                        alt="Placed signature"
                        style={{
                          display: 'block',
                          width: '100%',
                          height: 'auto',
                          pointerEvents: 'none',
                        }}
                      />
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteSignature(idx);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ff4d4f',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          pointerEvents: 'auto',
                        }}
                        title="Delete Signature"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {renderingPage && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Loading page view...</p>
                  </div>
                )}
              </div>
            </div>
          }
          footer={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
              <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span className="ink-muted">Placed signatures:</span>
                <span style={{ fontWeight: 600 }}>{Object.values(stampedSignatures).flat().length}</span>
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
                  ✓ Signed successfully!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleSave}
                disabled={processing || Object.values(stampedSignatures).flat().length === 0}
                style={{ width: '100%' }}
                id="save-signed-pdf-button"
              >
                {processing ? 'Saving...' : 'Download Signed PDF'}
                <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          }
        >
          {/* Signature creator inside aside settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)', marginBottom: '4px' }}>Signature Stamp</p>

            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: 'var(--space-xxs)' }}>
              <button
                className={`btn ${sigMode === 'draw' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                onClick={() => { setSigMode('draw'); setSignatureImage(null); }}
              >
                Draw
              </button>
              <button
                className={`btn ${sigMode === 'type' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                onClick={() => { setSigMode('type'); setSignatureImage(null); }}
              >
                Type
              </button>
            </div>

            {/* Signature Input Options */}
            {sigMode === 'draw' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <canvas
                  ref={sigCanvasRef}
                  width={300}
                  height={120}
                  style={{
                    border: '1px solid var(--hairline-strong)',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--rounded-md)',
                    cursor: 'crosshair',
                    display: 'block',
                    margin: '0 auto',
                    width: '100%',
                    maxWidth: '300px',
                    height: '120px'
                  }}
                  onMouseDown={startSigDrawing}
                  onMouseMove={drawSig}
                  onMouseUp={endSigDrawing}
                  onMouseLeave={endSigDrawing}
                  onTouchStart={(e) => startSigDrawing(e.touches[0])}
                  onTouchMove={(e) => drawSig(e.touches[0])}
                  onTouchEnd={endSigDrawing}
                />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-xs)' }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={clearSigPad}>
                    Clear Pad
                  </button>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={saveSignature}>
                    Save Signature
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Type your signature..."
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  style={{ fontSize: '13px', padding: '10px 14px', height: '40px' }}
                />
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', alignSelf: 'flex-end', marginTop: '4px' }} onClick={saveSignature}>
                  Generate
                </button>
              </div>
            )}

            {/* Saved Signature Stamp Indicator */}
            {signatureImage && (
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-sm)', textAlign: 'center', marginTop: '8px' }}>
                <p className="caption ink-subtle" style={{ marginBottom: 8, fontSize: '11px', fontWeight: '500' }}>Active stamp (click PDF page to place):</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- Signature previews are generated as client-side data URLs. */}
                <img
                  src={signatureImage}
                  alt="Signature"
                  style={{
                    maxHeight: 50,
                    maxWidth: '100%',
                    border: '1.5px dashed var(--brand-blue)',
                    borderRadius: 'var(--rounded-sm)',
                    padding: '6px',
                    backgroundColor: '#ffffff',
                    margin: '0 auto',
                  }}
                />
              </div>
            )}
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
