'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, savePdf, downloadBlob } from '@/lib/pdfUtils';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';
import { rgb, degrees, StandardFonts } from 'pdf-lib';

export default function EditPDFClient() {
  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Editor States
  const [tool, setTool] = useState('select'); // 'select', 'text', 'draw'
  const [textColor, setTextColor] = useState('#5e6ad2');
  const [textSize, setTextSize] = useState(16);
  
  // Accumulators for edits
  const [annotations, setAnnotations] = useState({}); // { pageIndex: [ { type: 'text', x: 0.1, y: 0.2, text: 'Hello', color: '#5e6ad2', size: 16 } ] }
  const [drawings, setDrawings] = useState({}); // { pageIndex: [ { color: '#5e6ad2', width: 3, points: [[x,y], ...] } ] }
  
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [renderingPage, setRenderingPage] = useState(false);

  const canvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const workspaceRef = useRef(null);
  
  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  // Load PDF for rendering in background when file is uploaded
  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setAnnotations({});
    setDrawings({});
    setCurrentPageIndex(0);

    try {
      const doc = await loadPdfForRender(f);
      setPdfRenderDoc(doc);
      setTotalPages(doc.numPages);
    } catch (err) {
      alert('Error loading PDF: ' + err.message);
    }
  }, []);

  // Redraw freehand drawings on the overlay canvas
  const redrawCurrentPageDrawings = useCallback(() => {
    const dCanvas = drawingCanvasRef.current;
    if (!dCanvas) return;
    const ctx = dCanvas.getContext('2d');
    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);

    const pageDraws = drawings[currentPageIndex] || [];
    pageDraws.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0][0] * dCanvas.width, stroke.points[0][1] * dCanvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i][0] * dCanvas.width, stroke.points[i][1] * dCanvas.height);
      }
      ctx.stroke();
    });
  }, [drawings, currentPageIndex]);

  // Render current page to canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfRenderDoc || !canvasRef.current) return;
    setRenderingPage(true);
    try {
      const pageNum = currentPageIndex + 1;
      const canvas = canvasRef.current;
      
      // Render at a decent scale for resolution
      const renderMeta = await renderPageToCanvas(pdfRenderDoc, pageNum, canvas, 1.5);
      
      // Match drawing canvas size
      if (drawingCanvasRef.current) {
        drawingCanvasRef.current.width = renderMeta.width;
        drawingCanvasRef.current.height = renderMeta.height;
        redrawCurrentPageDrawings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRenderingPage(false);
    }
  }, [pdfRenderDoc, currentPageIndex, redrawCurrentPageDrawings]);

  useEffect(() => {
    if (pdfRenderDoc) {
      renderCurrentPage();
    }
  }, [pdfRenderDoc, renderCurrentPage]);

  // Redraw drawings on dynamic state change
  useEffect(() => {
    redrawCurrentPageDrawings();
  }, [redrawCurrentPageDrawings]);
  // Handle click on canvas to add text annotation
  const handleWorkspaceClick = (e) => {
    if (tool !== 'text' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const text = prompt('Enter annotation text:');
    if (!text) return;

    const newAnn = {
      type: 'text',
      x,
      y,
      text,
      color: textColor,
      size: textSize,
    };

    setAnnotations((prev) => ({
      ...prev,
      [currentPageIndex]: [...(prev[currentPageIndex] || []), newAnn],
    }));
  };

  // Drawing event handlers
  const startDrawing = (e) => {
    if (tool !== 'draw' || !drawingCanvasRef.current) return;
    setIsDrawing(true);
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setCurrentStroke([[x, y]]);
  };

  const draw = (e) => {
    if (!isDrawing || tool !== 'draw' || !drawingCanvasRef.current) return;
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setCurrentStroke((prev) => {
      const updated = [...prev, [x, y]];
      
      // Draw immediately on screen for responsiveness
      const dCanvas = drawingCanvasRef.current;
      const ctx = dCanvas.getContext('2d');
      ctx.beginPath();
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(prev[prev.length - 1][0] * dCanvas.width, prev[prev.length - 1][1] * dCanvas.height);
      ctx.lineTo(x * dCanvas.width, y * dCanvas.height);
      ctx.stroke();

      return updated;
    });
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      const newStroke = {
        color: textColor,
        width: 3,
        points: currentStroke,
      };
      setDrawings((prev) => ({
        ...prev,
        [currentPageIndex]: [...(prev[currentPageIndex] || []), newStroke],
      }));
    }
    setCurrentStroke([]);
  };

  // Hex to RGB parser for pdf-lib
  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return rgb(r, g, b);
  };

  // Compile annotations and drawings onto the final PDF
  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const pdfDoc = await loadPdf(file);
      const pagesInDoc = pdfDoc.getPages();
      const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Iterate through pages and draw elements
      pagesInDoc.forEach((page, pageIdx) => {
        const { width, height } = page.getSize();

        // 1. Draw Text Annotations
        const pageAnns = annotations[pageIdx] || [];
        pageAnns.forEach((ann) => {
          if (ann.type === 'text') {
            const fontWidth = standardFont.widthOfTextAtSize(ann.text, ann.size);
            // x coordinate is relative x * width
            const targetX = ann.x * width;
            // y coordinate is (1 - relative y) * height - size (approx font baseline offset)
            const targetY = (1 - ann.y) * height - ann.size;

            page.drawText(ann.text, {
              x: targetX,
              y: targetY,
              size: ann.size,
              font: standardFont,
              color: hexToRgb(ann.color),
            });
          }
        });

        // 2. Draw Vector Strokes
        const pageDraws = drawings[pageIdx] || [];
        pageDraws.forEach((stroke) => {
          if (stroke.points.length < 2) return;
          for (let i = 0; i < stroke.points.length - 1; i++) {
            const p1 = stroke.points[i];
            const p2 = stroke.points[i + 1];

            page.drawLine({
              start: { x: p1[0] * width, y: (1 - p1[1]) * height },
              end: { x: p2[0] * width, y: (1 - p2[1]) * height },
              thickness: stroke.width * (width / 600), // Scale thickness relatively to standard page width
              color: hexToRgb(stroke.color),
            });
          }
        });
      });

      const updatedBytes = await savePdf(pdfDoc);
      downloadBlob(updatedBytes, file.name.replace('.pdf', '-edited.pdf'), 'application/pdf');
      setDone(true);
    } catch (err) {
      alert('Error editing PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const clearCurrentPage = () => {
    if (confirm('Clear all edits on the current page?')) {
      setAnnotations((prev) => ({ ...prev, [currentPageIndex]: [] }));
      setDrawings((prev) => ({ ...prev, [currentPageIndex]: [] }));
    }
  };

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Add text annotations, annotations, and draw directly onto pages."
      icon="edit"
      iconColor="var(--tool-edit)"
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF to edit"
          id="edit-dropzone"
        />
      ) : (
        <div className="tool-workspace">
          {/* Left panel: Editor canvas and pagination */}
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

            {/* Editor Workspace Canvas */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                position: 'relative',
              }}
            >
              {/* Pagination and page controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)' }}>
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

              {/* Interactive Canvas Container */}
              <div
                ref={workspaceRef}
                style={{
                  position: 'relative',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-lg)',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  cursor: tool === 'text' ? 'text' : tool === 'draw' ? 'crosshair' : 'default',
                  width: '100%',
                  maxWidth: '650px',
                }}
                onClick={handleWorkspaceClick}
              >
                {/* Underlying rendered PDF page */}
                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto' }} />

                {/* Overlay Canvas for Freehand Drawing */}
                <canvas
                  ref={drawingCanvasRef}
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

                {/* DOM Overlay layer for Text annotations preview */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 3,
                  }}
                >
                  {(annotations[currentPageIndex] || []).map((ann, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${ann.x * 100}%`,
                        top: `${ann.y * 100}%`,
                        color: ann.color,
                        fontSize: `${ann.size * 1.5}px`, // Scaled visually for 1.5x canvas
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontWeight: 'bold',
                        transform: 'translate(-5%, -50%)',
                        whiteSpace: 'nowrap',
                        textShadow: '1px 1px 0px #ffffff, -1px -1px 0px #ffffff, 1px -1px 0px #ffffff, -1px 1px 0px #ffffff',
                      }}
                    >
                      {ann.text}
                    </div>
                  ))}
                </div>

                {/* Page loading indicator */}
                {renderingPage && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 4,
                    }}
                  >
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>Loading view...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Editor tools and configs sidebar */}
          <div className="tool-action-sidebar">
            {/* Tool settings card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Editing Tools</p>
              
              {/* Tool selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxs)' }}>
                {[
                  { id: 'select', label: 'View Only', icon: 'check' },
                  { id: 'text', label: 'Add Text', icon: 'forms' },
                  { id: 'draw', label: 'Draw Freehand', icon: 'sign' },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={`btn ${tool === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '8px 12px', justifyContent: 'flex-start', width: '100%' }}
                    onClick={() => setTool(t.id)}
                  >
                    <ToolIcon name={t.icon} size={14} style={{ marginRight: 6 }} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Formatting details (colors / size) */}
              {(tool === 'text' || tool === 'draw') && (
                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <div>
                    <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Color</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        height: 38,
                      }}
                    />
                  </div>

                  {tool === 'text' && (
                    <div>
                      <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Text Size</label>
                      <select
                        className="input"
                        style={{ width: '100%' }}
                        value={textSize}
                        onChange={(e) => setTextSize(parseInt(e.target.value))}
                      >
                        {[12, 14, 16, 20, 24, 32].map((s) => (
                          <option key={s} value={s}>
                            {s}px
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Reset page */}
              <button
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '6px 12px', borderColor: 'rgba(229, 72, 77, 0.3)', color: 'var(--semantic-error)' }}
                onClick={clearCurrentPage}
              >
                Clear Page Markups
              </button>
            </div>

            {/* Action Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Compile & Export</p>
              
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="ink-muted">Text edits:</span>
                  <span style={{ fontWeight: 600 }}>{Object.values(annotations).flat().length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="ink-muted">Drawing strokes:</span>
                  <span style={{ fontWeight: 600 }}>{Object.values(drawings).flat().length}</span>
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
                  ✓ Saved successfully!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleSave}
                disabled={processing || renderingPage}
                style={{ width: '100%' }}
                id="save-pdf-button"
              >
                {processing ? 'Saving...' : 'Download PDF'}
                <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
