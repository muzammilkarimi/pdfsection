'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { PDFDocument } from 'pdf-lib';

export default function CropPDFClient() {
  const toolInfo = getToolById('crop') || {
    name: 'Crop PDF',
    description: 'Adjust visible area and crop margins',
    categoryColor: 'var(--tool-edit)',
    icon: 'crop',
  };

  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [renderingPage, setRenderingPage] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // Crop Margins in Percentage (%)
  const [cropLeft, setCropLeft] = useState(10);
  const [cropRight, setCropRight] = useState(10);
  const [cropTop, setCropTop] = useState(10);
  const [cropBottom, setCropBottom] = useState(10);
  const [applyToAll, setApplyToAll] = useState(true);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // File selection
  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setCurrentPageIndex(0);

    try {
      const renderDoc = await loadPdfForRender(f);
      setPdfRenderDoc(renderDoc);
      setTotalPages(renderDoc.numPages);
    } catch (err) {
      alert('Error loading PDF: ' + err.message);
    }
  }, []);

  // Render current PDF page to canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfRenderDoc || !canvasRef.current) return;
    setRenderingPage(true);
    try {
      const pageNum = currentPageIndex + 1;
      const canvas = canvasRef.current;
      await renderPageToCanvas(pdfRenderDoc, pageNum, canvas, 1.2);
    } catch (err) {
      console.error('Error rendering page:', err);
    } finally {
      setRenderingPage(false);
    }
  }, [pdfRenderDoc, currentPageIndex]);

  useEffect(() => {
    if (pdfRenderDoc) {
      renderCurrentPage();
    }
  }, [pdfRenderDoc, currentPageIndex, renderCurrentPage]);

  const handleCrop = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      const cropPage = (page) => {
        const { x, y, width, height } = page.getMediaBox();
        const l = width * (cropLeft / 100);
        const r = width * (cropRight / 100);
        const t = height * (cropTop / 100);
        const b = height * (cropBottom / 100);

        page.setCropBox(x + l, y + b, width - l - r, height - t - b);
      };

      if (applyToAll) {
        pages.forEach((page) => cropPage(page));
      } else {
        cropPage(pages[currentPageIndex]);
      }

      const finalBytes = await pdfDoc.save();
      downloadBlob(
        new Blob([finalBytes], { type: 'application/pdf' }),
        file.name.replace('.pdf', '_cropped.pdf'),
        'application/pdf'
      );

      setDone(true);
    } catch (err) {
      alert('Error cropping PDF: ' + err.message);
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
          label="Upload your PDF to crop margins"
          id="crop-dropzone"
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
            setDone(false);
          }}
          preview={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
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

              {/* Canvas workspace container with absolute margins border overlay */}
              <div
                ref={containerRef}
                style={{
                  position: 'relative',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-lg)',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  width: 'fit-content',
                  margin: '0 auto',
                }}
              >
                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />

                {/* Crop visual overlay lines */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${cropLeft}%`,
                    right: `${cropRight}%`,
                    top: `${cropTop}%`,
                    bottom: `${cropBottom}%`,
                    border: '2px dashed var(--primary)',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                    pointerEvents: 'none',
                    zIndex: 2,
                    transition: 'all 0.15s ease',
                  }}
                />

                {renderingPage && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                    <p style={{ color: '#fff', fontSize: '13px' }}>Loading page...</p>
                  </div>
                )}
              </div>
            </div>
          }
          footer={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
              {done && (
                <div style={{ padding: '8px', borderRadius: 'var(--rounded-md)', backgroundColor: 'rgba(39, 166, 68, 0.08)', color: 'var(--semantic-success)', fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
                  ✓ PDF cropped and downloaded!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleCrop}
                disabled={processing || renderingPage}
                style={{ width: '100%' }}
                id="crop-pdf-button"
              >
                {processing ? 'Cropping...' : 'Download Cropped PDF'}
                <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Crop Margins (%)</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {/* Top Margin */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <span className="ink-muted">Top:</span>
                  <span style={{ fontWeight: 600 }}>{cropTop}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={cropTop}
                  onChange={(e) => setCropTop(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Bottom Margin */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <span className="ink-muted">Bottom:</span>
                  <span style={{ fontWeight: 600 }}>{cropBottom}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={cropBottom}
                  onChange={(e) => setCropBottom(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Left Margin */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <span className="ink-muted">Left:</span>
                  <span style={{ fontWeight: 600 }}>{cropLeft}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={cropLeft}
                  onChange={(e) => setCropLeft(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Right Margin */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <span className="ink-muted">Right:</span>
                  <span style={{ fontWeight: 600 }}>{cropRight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={cropRight}
                  onChange={(e) => setCropRight(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Apply margins to all pages</span>
              </label>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
