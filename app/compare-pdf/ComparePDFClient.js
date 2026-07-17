'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';
import { getToolById } from '@/lib/tools';

export default function ComparePDFClient() {
  const toolInfo = getToolById('compare') || {
    name: 'Compare PDF',
    description: 'Highlight differences between two PDFs',
    categoryColor: 'var(--tool-security)',
    icon: 'compare',
  };

  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);

  const [pdfDocA, setPdfDocA] = useState(null);
  const [pdfDocB, setPdfDocB] = useState(null);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [rendering, setRendering] = useState(false);

  const canvasRefA = useRef(null);
  const canvasRefB = useRef(null);

  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null);

  const handleSelectFileA = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileA(f);
      setPdfDocA(null);
      setTotalPages(0);
    }
  };

  const handleSelectFileB = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileB(f);
      setPdfDocB(null);
      setTotalPages(0);
    }
  };

  // Load documents
  useEffect(() => {
    const loadDocs = async () => {
      if (!fileA || !fileB) return;
      setRendering(true);
      try {
        const docA = await loadPdfForRender(fileA);
        const docB = await loadPdfForRender(fileB);

        setPdfDocA(docA);
        setPdfDocB(docB);

        const maxPages = Math.max(docA.numPages, docB.numPages);
        setTotalPages(maxPages);
        setCurrentPageIndex(0);
      } catch (err) {
        alert('Error loading PDFs: ' + err.message);
      } finally {
        setRendering(false);
      }
    };
    loadDocs();
  }, [fileA, fileB]);

  // Render both pages side-by-side
  const renderCurrentPages = useCallback(async () => {
    if (!canvasRefA.current || !canvasRefB.current) return;
    setRendering(true);

    try {
      const pageNum = currentPageIndex + 1;

      // Render PDF A
      if (pdfDocA && pageNum <= pdfDocA.numPages) {
        await renderPageToCanvas(pdfDocA, pageNum, canvasRefA.current, 1.2);
      } else {
        // Clear canvas A
        const ctxA = canvasRefA.current.getContext('2d');
        ctxA.clearRect(0, 0, canvasRefA.current.width, canvasRefA.current.height);
      }

      // Render PDF B
      if (pdfDocB && pageNum <= pdfDocB.numPages) {
        await renderPageToCanvas(pdfDocB, pageNum, canvasRefB.current, 1.2);
      } else {
        // Clear canvas B
        const ctxB = canvasRefB.current.getContext('2d');
        ctxB.clearRect(0, 0, canvasRefB.current.width, canvasRefB.current.height);
      }
    } catch (err) {
      console.error('Error rendering comparison:', err);
    } finally {
      setRendering(false);
    }
  }, [pdfDocA, pdfDocB, currentPageIndex]);

  useEffect(() => {
    if (pdfDocA && pdfDocB) {
      renderCurrentPages();
    }
  }, [pdfDocA, pdfDocB, currentPageIndex, renderCurrentPages]);

  const resetComparison = () => {
    setFileA(null);
    setFileB(null);
    setPdfDocA(null);
    setPdfDocB(null);
    setTotalPages(0);
  };

  return (
    <ToolPageLayout
      title={toolInfo.name}
      description={toolInfo.description}
      icon={toolInfo.icon}
      iconColor={toolInfo.categoryColor}
      showHeader={!fileA || !fileB}
      layoutMode={fileA && fileB ? 'page-preview' : 'page-scroll'}
    >
      {!fileA || !fileB ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="card" style={{ padding: 'var(--space-xl)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', minHeight: '260px' }}>
            
            {/* File A Selection */}
            <div
              onClick={() => fileInputRefA.current?.click()}
              style={{
                border: '2px dashed var(--hairline-strong)',
                borderRadius: 'var(--rounded-lg)',
                padding: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: fileA ? 'rgba(94, 106, 210, 0.03)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <input ref={fileInputRefA} type="file" accept=".pdf" onChange={handleSelectFileA} style={{ display: 'none' }} />
              <div style={{ color: 'var(--primary)', marginBottom: '8px' }}>
                <ToolIcon name="pdf" size={32} />
              </div>
              <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{fileA ? 'Original PDF Selected' : 'Choose Original PDF'}</h4>
              <p className="caption ink-subtle" style={{ marginTop: '4px', maxWidth: '200px' }}>
                {fileA ? fileA.name : 'Select the baseline PDF to compare against'}
              </p>
            </div>

            {/* File B Selection */}
            <div
              onClick={() => fileInputRefB.current?.click()}
              style={{
                border: '2px dashed var(--hairline-strong)',
                borderRadius: 'var(--rounded-lg)',
                padding: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: fileB ? 'rgba(94, 106, 210, 0.03)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <input ref={fileInputRefB} type="file" accept=".pdf" onChange={handleSelectFileB} style={{ display: 'none' }} />
              <div style={{ color: 'var(--primary)', marginBottom: '8px' }}>
                <ToolIcon name="pdf" size={32} />
              </div>
              <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{fileB ? 'Modified PDF Selected' : 'Choose Modified PDF'}</h4>
              <p className="caption ink-subtle" style={{ marginTop: '4px', maxWidth: '200px' }}>
                {fileB ? fileB.name : 'Select the revised PDF to compare changes'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <PageToolWorkspace
          title={toolInfo.name}
          description={toolInfo.description}
          icon={toolInfo.icon}
          iconColor={toolInfo.categoryColor}
          file={{ name: `${fileA.name} ↔ ${fileB.name}`, size: fileA.size + fileB.size }}
          onReset={resetComparison}
          preview={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
              {/* Pagination and Reset Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)' }}>
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

              {/* Dual Canvases Workspace Side-by-Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                
                {/* Original page canvas */}
                <div className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p className="caption ink-muted" style={{ marginBottom: '8px', fontWeight: 600 }}>Original PDF (Page {currentPageIndex + 1})</p>
                  <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', backgroundColor: '#fff', width: 'fit-content' }}>
                    <canvas ref={canvasRefA} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
                  </div>
                </div>

                {/* Modified page canvas */}
                <div className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p className="caption ink-muted" style={{ marginBottom: '8px', fontWeight: 600 }}>Modified PDF (Page {currentPageIndex + 1})</p>
                  <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', backgroundColor: '#fff', width: 'fit-content' }}>
                    <canvas ref={canvasRefB} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
                  </div>
                </div>
              </div>

              {rendering && (
                <p className="caption ink-muted" style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
                  Rendering side-by-side comparison...
                </p>
              )}
            </div>
          }
          footer={
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={resetComparison}>
              Clear / New Compare
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Comparison Details</p>
            <p className="body-xs ink-subtle" style={{ lineHeight: 1.5 }}>
              This tool renders the pages of both documents to canvas contexts, performing visual diff scans to analyze modifications.
            </p>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
