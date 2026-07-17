'use client';

import { useState, useCallback, useRef } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { createWorker } from 'tesseract.js';

export default function OCRPDFClient() {
  const toolInfo = getToolById('ocr-pdf') || {
    name: 'OCR PDF',
    description: 'Make scanned PDFs searchable with optical recognition',
    categoryColor: 'var(--tool-optimize)',
    icon: 'search',
  };

  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [done, setDone] = useState(false);

  const canvasRef = useRef(null);

  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setExtractedText('');
    setDone(false);
    setProgress(0);
    setCurrentPageIndex(0);

    try {
      const renderDoc = await loadPdfForRender(f);
      setPdfRenderDoc(renderDoc);
      setTotalPages(renderDoc.numPages);
    } catch (err) {
      alert('Error loading PDF: ' + err.message);
    }
  }, []);

  const runOCR = async () => {
    if (!pdfRenderDoc || !canvasRef.current) return;
    setProcessing(true);
    setProgress(10);
    setExtractedText('');

    let worker = null;
    try {
      worker = await createWorker(ocrLanguage);
      setProgress(30);

      const pageNum = currentPageIndex + 1;
      const canvas = canvasRef.current;
      
      // Render page at high scale for OCR quality
      await renderPageToCanvas(pdfRenderDoc, pageNum, canvas, 2.0);
      setProgress(50);

      const { data: { text } } = await worker.recognize(canvas);
      setProgress(90);
      
      setExtractedText(text);
      setDone(true);
      setProgress(100);
    } catch (err) {
      alert('Error running OCR: ' + err.message);
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setProcessing(false);
    }
  };

  const downloadOCRText = () => {
    if (!extractedText) return;
    downloadBlob(
      new Blob([extractedText], { type: 'text/plain;charset=utf-8' }),
      file.name.replace('.pdf', '_ocr.txt'),
      'text/plain'
    );
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
          label="Upload your scanned PDF to perform OCR character matching"
          id="ocr-dropzone"
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
            setExtractedText('');
            setDone(false);
          }}
          preview={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', alignItems: 'center' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)', width: '100%' }}>
                <div className="card" style={{ padding: 'var(--space-md)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <p className="caption ink-muted" style={{ marginBottom: '8px', fontWeight: 600 }}>OCR Extracted Text Output</p>
                  
                  {processing && (
                    <div style={{ margin: '30px auto', width: '100%', maxWidth: '300px', textAlign: 'center' }}>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)' }}>
                        Analyzing characters... {progress}%
                      </p>
                    </div>
                  )}

                  {!processing && !extractedText && (
                    <p className="body-sm ink-subtle" style={{ fontStyle: 'italic', padding: '40px', textAlign: 'center' }}>
                      Click "Run OCR Page Scanning" in the sidebar to read image characters.
                    </p>
                  )}

                  {!processing && extractedText && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <textarea
                        readOnly
                        className="input"
                        value={extractedText}
                        style={{
                          width: '100%',
                          height: '220px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          lineHeight: 1.5,
                          backgroundColor: '#0a0a0c',
                          color: 'var(--ink-subtle)',
                          resize: 'none',
                        }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={downloadOCRText}
                        style={{ alignSelf: 'flex-end', fontSize: '12px', padding: '6px 12px' }}
                      >
                        Download OCR Text (.txt)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden canvas used for rendering image frames */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          }
          footer={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
              {done && (
                <div style={{ padding: '8px', borderRadius: 'var(--rounded-md)', backgroundColor: 'rgba(39, 166, 68, 0.08)', color: 'var(--semantic-success)', fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
                  ✓ OCR process completed!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={runOCR}
                disabled={processing}
                style={{ width: '100%' }}
                id="run-ocr-button"
              >
                {processing ? 'Processing...' : 'Run OCR Page Scanning'}
                <ToolIcon name="search" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>OCR Configuration</p>
            
            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px' }}>Target Language:</label>
              <select
                className="input"
                value={ocrLanguage}
                onChange={(e) => setOcrLanguage(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="eng">English</option>
                <option value="spa">Spanish (Español)</option>
                <option value="fra">French (Français)</option>
                <option value="deu">German (Deutsch)</option>
              </select>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
