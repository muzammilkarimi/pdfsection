'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
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
        <div className="tool-workspace">
          {/* Left panel: Document Signing Workspace */}
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <button
                className="file-item-remove"
                onClick={() => {
                  setFile(null);
                  setPdfRenderDoc(null);
                  setDone(false);
                }}
              >
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {/* Pagination and page actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
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
                  Clear Page Signatures
                </button>
              </div>

              {/* Rendering canvas */}
              <div
                style={{
                  position: 'relative',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-lg)',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  cursor: signatureImage ? 'cell' : 'default',
                  alignSelf: 'center',
                  width: '100%',
                  maxWidth: '650px',
                }}
                onClick={handlePageClick}
              >
                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto' }} />

                {/* Draw placed signatures */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {(stampedSignatures[currentPageIndex] || []).map((sig, idx) => (
                    <span key={idx}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- Signature stamps are generated as client-side data URLs. */}
                      <img
                        src={sig.imgData}
                        alt="Placed signature"
                        style={{
                          position: 'absolute',
                          left: `${sig.x * 100}%`,
                          top: `${sig.y * 100}%`,
                          width: `${(sig.w / 600) * 100}%`,
                          height: 'auto',
                          border: '1px dashed var(--primary)',
                        }}
                      />
                    </span>
                  ))}
                </div>

                {renderingPage && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Loading page view...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Signature Creator and Compile Actions sidebar */}
          <div className="tool-action-sidebar">
            {/* Signature creation card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Signature Stamp</p>

              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: 'var(--space-xxs)' }}>
                <button
                  className={`btn ${sigMode === 'draw' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 8px', fontSize: '11px' }}
                  onClick={() => { setSigMode('draw'); setSignatureImage(null); }}
                >
                  Draw
                </button>
                <button
                  className={`btn ${sigMode === 'type' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 8px', fontSize: '11px' }}
                  onClick={() => { setSigMode('type'); setSignatureImage(null); }}
                >
                  Type
                </button>
              </div>

              {/* Signature Input Options */}
              {sigMode === 'draw' ? (
                <div>
                  <canvas
                    ref={sigCanvasRef}
                    width={220}
                    height={90}
                    style={{
                      border: '1px solid var(--hairline-strong)',
                      backgroundColor: '#ffffff',
                      borderRadius: 'var(--rounded-md)',
                      cursor: 'crosshair',
                      display: 'block',
                      margin: '0 auto var(--space-xs)',
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
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={clearSigPad}>
                      Clear Pad
                    </button>
                    <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={saveSignature}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Type your signature..."
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    style={{ fontSize: '13px', padding: '6px 10px' }}
                  />
                  <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px', alignSelf: 'flex-end' }} onClick={saveSignature}>
                    Generate
                  </button>
                </div>
              )}

              {/* Saved Signature Stamp Indicator */}
              {signatureImage && (
                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-sm)', textAlign: 'center' }}>
                  <p className="caption ink-subtle" style={{ marginBottom: 6 }}>Ready to place (click PDF page):</p>
                  {/* eslint-disable-next-line @next/next/no-img-element -- Signature previews are generated as client-side data URLs. */}
                  <img
                    src={signatureImage}
                    alt="Signature"
                    style={{
                      maxHeight: 45,
                      maxWidth: '100%',
                      border: '1px dashed var(--primary)',
                      borderRadius: 'var(--rounded-sm)',
                      padding: 4,
                      backgroundColor: '#ffffff',
                      margin: '0 auto',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Actions Sidebar card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Compile Actions</p>

              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="ink-muted">Placed signatures:</span>
                  <span style={{ fontWeight: 600 }}>{Object.values(stampedSignatures).flat().length}</span>
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
                  ✓ Signed successfully!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleSave}
                disabled={processing || Object.keys(stampedSignatures).length === 0}
                style={{ width: '100%' }}
                id="save-signed-pdf-button"
              >
                {processing ? 'Saving...' : 'Download Signed PDF'}
                <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
