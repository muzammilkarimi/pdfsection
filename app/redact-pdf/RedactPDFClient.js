'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { PDFDocument, rgb } from 'pdf-lib';

export default function RedactPDFClient() {
  const toolInfo = getToolById('redact') || {
    name: 'Redact PDF',
    description: 'Permanently black out sensitive information',
    categoryColor: 'var(--tool-security)',
    icon: 'redact',
  };

  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Accumulator of redactions by page index
  // { pageIndex: [ { x: 0.1, y: 0.2, w: 0.3, h: 0.1 } ] }
  const [redactions, setRedactions] = useState({});
  const [renderingPage, setRenderingPage] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const workspaceRef = useRef(null);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);

  // Load PDF for visual representation
  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setRedactions({});
    setCurrentPageIndex(0);

    try {
      const renderDoc = await loadPdfForRender(f);
      setPdfRenderDoc(renderDoc);
      setTotalPages(renderDoc.numPages);
    } catch (err) {
      alert('Error loading PDF: ' + err.message);
    }
  }, []);

  // Render current PDF page
  const renderCurrentPage = useCallback(async () => {
    if (!pdfRenderDoc || !canvasRef.current) return;
    setRenderingPage(true);
    try {
      const pageNum = currentPageIndex + 1;
      const canvas = canvasRef.current;
      const renderMeta = await renderPageToCanvas(pdfRenderDoc, pageNum, canvas, 1.3);

      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = renderMeta.width;
        overlayCanvasRef.current.height = renderMeta.height;
        drawExistingRedactions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRenderingPage(false);
    }
  }, [pdfRenderDoc, currentPageIndex, redactions]);

  useEffect(() => {
    if (pdfRenderDoc) {
      renderCurrentPage();
    }
  }, [pdfRenderDoc, currentPageIndex, renderCurrentPage]);

  // Draw black rectangles of the current page on overlay canvas
  const drawExistingRedactions = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageReds = redactions[currentPageIndex] || [];
    pageReds.forEach((r) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(r.x * canvas.width, r.y * canvas.height, r.w * canvas.width, r.h * canvas.height);
    });
  };

  const getCanvasMousePos = (e) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse or touch event
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getCanvasMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getCanvasMousePos(e);
    
    const x = Math.min(pos.x, startPos.x);
    const y = Math.min(pos.y, startPos.y);
    const w = Math.abs(pos.x - startPos.x);
    const h = Math.abs(pos.y - startPos.y);

    setCurrentRect({ x, y, w, h });

    // Draw previous + current drag rect
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawExistingRedactions();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#e5484d';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentRect && currentRect.w > 4 && currentRect.h > 4) {
      const canvas = overlayCanvasRef.current;
      const relativeRect = {
        x: currentRect.x / canvas.width,
        y: currentRect.y / canvas.height,
        w: currentRect.w / canvas.width,
        h: currentRect.h / canvas.height,
      };

      setRedactions((prev) => {
        const pageReds = prev[currentPageIndex] || [];
        return {
          ...prev,
          [currentPageIndex]: [...pageReds, relativeRect],
        };
      });
    }

    setCurrentRect(null);
  };

  const clearCurrentRedactions = () => {
    setRedactions((prev) => ({
      ...prev,
      [currentPageIndex]: [],
    }));
  };

  const handleApplyRedactions = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      Object.entries(redactions).forEach(([pageIdxStr, pageReds]) => {
        const pageIdx = parseInt(pageIdxStr);
        const page = pages[pageIdx];
        if (!page) return;

        const { x: ox, y: oy, width, height } = page.getMediaBox();

        pageReds.forEach((r) => {
          // Convert from relative screen coordinates back to bottom-left origin PDF coordinates
          const pdfX = r.x * width;
          const pdfY = (1 - r.y - r.h) * height;
          const pdfW = r.w * width;
          const pdfH = r.h * height;

          page.drawRectangle({
            x: ox + pdfX,
            y: oy + pdfY,
            width: pdfW,
            height: pdfH,
            color: rgb(0, 0, 0), // solid black
          });
        });
      });

      const finalBytes = await pdfDoc.save();
      downloadBlob(
        new Blob([finalBytes], { type: 'application/pdf' }),
        file.name.replace('.pdf', '_redacted.pdf'),
        'application/pdf'
      );

      setDone(true);
    } catch (err) {
      alert('Error applying redactions: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title={toolInfo.name}
      description={toolInfo.description}
      icon={toolInfo.icon}
      iconColor={toolInfo.categoryColor}
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Upload your PDF to redact content"
          id="redact-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title={toolInfo.name}
          description={toolInfo.description}
          icon={toolInfo.icon}
          iconColor={toolInfo.categoryColor}
          file={file}
          onReset={() => {
            setFile(null);
            setPdfRenderDoc(null);
            setRedactions({});
            setDone(false);
          }}
          preview={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <button
                  type="button"
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
                  type="button"
                  className="btn btn-secondary btn-icon"
                  disabled={currentPageIndex === totalPages - 1}
                  onClick={() => setCurrentPageIndex((prev) => prev + 1)}
                  style={{ padding: '6px 12px' }}
                >
                  ▶
                </button>
              </div>

              {/* Drawing Canvas Container */}
              <div
                ref={workspaceRef}
                style={{
                  position: 'relative',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-lg)',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  cursor: 'crosshair',
                  width: 'fit-content',
                  margin: '0 auto',
                }}
              >
                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
                
                {/* Drawing overlay */}
                <canvas
                  ref={overlayCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={(e) => startDrawing(e.touches[0])}
                  onTouchMove={(e) => draw(e.touches[0])}
                  onTouchEnd={endDrawing}
                />

                {renderingPage && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                    <p style={{ color: '#fff', fontSize: '13px' }}>Loading view...</p>
                  </div>
                )}
              </div>
            </div>
          }
          footer={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
              {done && (
                <div style={{ padding: '8px', borderRadius: 'var(--rounded-md)', backgroundColor: 'rgba(39, 166, 68, 0.08)', color: 'var(--semantic-success)', fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
                  ✓ PDF redacted and downloaded!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleApplyRedactions}
                disabled={processing || renderingPage}
                style={{ width: '100%' }}
                id="apply-redactions-button"
              >
                {processing ? 'Redacting...' : 'Apply Redactions'}
                <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Redaction Instructions</p>
            
            <p className="body-xs ink-subtle" style={{ lineHeight: 1.5 }}>
              Click and drag your mouse directly on the page preview to draw black redaction rectangles over sensitive text or images.
            </p>

            <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--hairline)', paddingTop: '8px' }}>
              <span className="ink-muted">Drawn on this page:</span>
              <span style={{ fontWeight: 600 }}>{(redactions[currentPageIndex] || []).length} redactions</span>
            </div>

            <button
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 12px', borderColor: 'rgba(229, 72, 77, 0.3)', color: 'var(--semantic-error)' }}
              onClick={clearCurrentRedactions}
            >
              Clear Page Redactions
            </button>

            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span className="ink-muted">Total document blocks:</span>
              <span style={{ fontWeight: 600 }}>{Object.values(redactions).flat().length} blocks</span>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
