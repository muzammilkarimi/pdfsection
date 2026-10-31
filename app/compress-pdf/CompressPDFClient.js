'use client';

import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, downloadBlob, checkPdfEncryption } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { loadPdfForRender } from '@/lib/renderUtils';

const COMPRESSION_LEVELS = {
  low: {
    label: 'Low Compression',
    desc: 'Lossless PDF optimization. Keeps text selectable, preserves vectors, and cleans up document headers.',
    icon: 'Low',
    mode: 'lossless',
  },
  medium: {
    label: 'Recommended',
    desc: 'Balances quality and size. Best for scanned files, targeting sizes under 1MB–2MB.',
    icon: 'Med',
    mode: 'raster',
    dpi: 115,
    quality: 0.72,
    maxDimension: 1800,
  },
  high: {
    label: 'Maximum Compression',
    desc: 'Smallest file size. Optimizes image grids to target sizes under 100KB–200KB.',
    icon: 'Max',
    mode: 'raster',
    dpi: 92,
    quality: 0.58,
    maxDimension: 1450,
  },
};

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function blobFromCanvas(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create compressed page image'));
    }, 'image/jpeg', quality);
  });
}

async function compressLossless(file) {
  const srcDoc = await loadPdf(file);
  return srcDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
    objectsPerTick: 50,
  });
}

async function compressRaster(file, settings, onProgress) {
  const renderDoc = await loadPdfForRender(file);
  const outputDoc = await PDFDocument.create({ updateMetadata: false });

  try {
    for (let pageNumber = 1; pageNumber <= renderDoc.numPages; pageNumber++) {
      const sourcePage = await renderDoc.getPage(pageNumber);
      const baseViewport = sourcePage.getViewport({ scale: 1 });
      const requestedScale = settings.dpi / 72;
      const maxSide = Math.max(baseViewport.width, baseViewport.height);
      const scale = Math.min(requestedScale, settings.maxDimension / maxSide);
      const viewport = sourcePage.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await sourcePage.render({ canvasContext: ctx, viewport }).promise;

      const imageBlob = await blobFromCanvas(canvas, settings.quality);
      const imageBytes = await imageBlob.arrayBuffer();
      const image = await outputDoc.embedJpg(imageBytes);
      const page = outputDoc.addPage([baseViewport.width, baseViewport.height]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      });

      canvas.width = 1;
      canvas.height = 1;
      sourcePage.cleanup?.();
      onProgress?.(Math.round((pageNumber / renderDoc.numPages) * 100));
    }

    return outputDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false,
      objectsPerTick: 25,
    });
  } finally {
    renderDoc.cleanup?.();
    renderDoc.destroy?.();
  }
}

export default function CompressPDFClient() {
  const deliver = useResultHandoff('compress-pdf');
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleFilesSelected = useCallback(async (files) => {
    const selectedFile = files[0] || null;
    setFile(selectedFile);
    setResult(null);
    setShowToast(false);
    setProgress(0);
    setIsLocked(false);

    if (selectedFile) {
      const locked = await checkPdfEncryption(selectedFile);
      if (locked) {
        setIsLocked(true);
      }
    }
  }, []);

  const resetFile = () => {
    setFile(null);
    setResult(null);
    setShowToast(false);
    setProgress(0);
    setIsLocked(false);
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      const settings = COMPRESSION_LEVELS[level];
      let bytes;
      if (settings.mode === 'lossless') {
        setProgress(50);
        bytes = await compressLossless(file);
        if (bytes.byteLength >= file.size) {
          bytes = new Uint8Array(await file.arrayBuffer());
        }
        setProgress(100);
      } else {
        bytes = await compressRaster(file, settings, (p) => setProgress(p));
        // Smart Fallback Protection:
        // If raster mode inflates file size (common on small vector/text PDFs),
        // try lossless optimization or fall back to original file bytes.
        if (bytes.byteLength >= file.size) {
          const losslessBytes = await compressLossless(file);
          if (losslessBytes.byteLength < file.size) {
            bytes = losslessBytes;
          } else {
            bytes = new Uint8Array(await file.arrayBuffer());
          }
        }
      }

      const compressedSize = bytes.byteLength;
      const originalSize = file.size;
      const rawReduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
      const reduction = Math.max(0, rawReduction);
      const isAlreadyOptimized = compressedSize >= originalSize;

      setResult({
        bytes,
        filename: file.name.replace('.pdf', '-compressed.pdf'),
        originalSize,
        compressedSize,
        reduction,
        isAlreadyOptimized,
      });
      await deliver(bytes, file.name.replace('.pdf', '-compressed.pdf'), 'application/pdf', {
        summary: isAlreadyOptimized ? 'Already optimized' : `${reduction}% smaller (was ${(originalSize / 1024 / 1024).toFixed(1)} MB)`,
      });
      setShowToast(true);
    } catch (err) {
      alert('Compression error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const levels = [
    { id: 'low', ...COMPRESSION_LEVELS.low },
    { id: 'medium', ...COMPRESSION_LEVELS.medium },
    { id: 'high', ...COMPRESSION_LEVELS.high },
  ];

  return (
    <ToolPageLayout
      title="Compress PDF"
      description="Reduce PDF size in your browser. Choose your preferred compression mode."
      icon="compress"
      iconColor="var(--tool-optimize)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Select PDF file"
          id="compress-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title="Compress PDF"
          description="Choose a compression level below, then export your optimized PDF."
          icon="compress"
          iconColor="var(--tool-optimize)"
          file={file}
          onReset={resetFile}
          ariaLabel="Compress PDF workspace"
          preview={(
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {result ? (
                <div
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--space-xl) var(--space-lg)',
                    borderRadius: 'var(--rounded-xl)',
                    backgroundColor: result.isAlreadyOptimized ? 'rgba(94, 106, 210, 0.04)' : 'rgba(39, 166, 68, 0.04)',
                    border: result.isAlreadyOptimized ? '1px solid rgba(94, 106, 210, 0.25)' : '1px solid rgba(39, 166, 68, 0.25)',
                    textAlign: 'center',
                    gap: 'var(--space-md)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                    animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: result.isAlreadyOptimized ? 'rgba(94, 106, 210, 0.14)' : 'rgba(39, 166, 68, 0.14)',
                      color: result.isAlreadyOptimized ? 'var(--primary)' : 'var(--semantic-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ToolIcon name={result.isAlreadyOptimized ? 'info' : 'check'} size={32} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink-base)' }}>
                      {result.isAlreadyOptimized ? 'PDF Already Fully Optimized!' : 'PDF Compressed Successfully!'}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--ink-subtle)', margin: 0 }}>
                      {result.isAlreadyOptimized ? (
                        <>Your file is already at minimal size (<strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatSize(result.originalSize)}</strong>). Retained original file for optimal quality.</>
                      ) : (
                        <>Your document is now <strong style={{ color: 'var(--semantic-success)', fontWeight: 700 }}>{result.reduction}% smaller</strong>.</>
                      )}
                    </p>
                  </div>

                  {/* Size comparison display */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-md)',
                      width: '100%',
                      maxWidth: '380px',
                      margin: 'var(--space-xs) 0',
                      padding: 'var(--space-md)',
                      backgroundColor: 'var(--surface-1)',
                      borderRadius: 'var(--rounded-lg)',
                      border: '1px solid var(--hairline-strong)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original Size</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-subtle)', textDecoration: result.isAlreadyOptimized ? 'none' : 'line-through', marginTop: 4 }}>
                        {formatSize(result.originalSize)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Optimized Size</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: result.isAlreadyOptimized ? 'var(--primary)' : 'var(--semantic-success)', marginTop: 4 }}>
                        {formatSize(result.compressedSize)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {!isLocked && (
                    <>
                      <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Select Compression Level</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {levels.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="card"
                            onClick={() => setLevel(item.id)}
                            disabled={processing}
                            style={{
                              padding: 'var(--space-md)',
                              textAlign: 'left',
                              cursor: processing ? 'not-allowed' : 'pointer',
                              border: level === item.id ? '2px solid var(--primary)' : '1px solid var(--hairline-strong)',
                              backgroundColor: level === item.id ? 'rgba(94, 106, 210, 0.05)' : 'var(--surface-1)',
                              borderRadius: 'var(--rounded-lg)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                              <span style={{ minWidth: 40, fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{item.icon}</span>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-subtle)', marginTop: 4, lineHeight: 1.4 }}>{item.desc}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {isLocked && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: 'rgba(255, 75, 75, 0.06)', border: '1px solid var(--semantic-error)', borderRadius: 'var(--rounded-md)', color: 'var(--ink)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--semantic-error)', fontWeight: '700' }}>
                        <ToolIcon name="lock" size={20} />
                        <span>This PDF File is Password-Protected</span>
                      </div>
                      <p className="caption" style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-muted)' }}>
                        This document is encrypted and locked. Please remove its password restrictions using our free <a href="/unlock-pdf" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: '600' }}>Unlock PDF tool</a> first, then try again.
                      </p>
                    </div>
                  )}

                  {processing && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)', textAlign: 'center' }}>
                        Optimizing PDF streams... {progress}%
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          footer={(
            result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-attention btn-success-state"
                  onClick={() => downloadBlob(result.bytes, result.filename, 'application/pdf')}
                  style={{ width: '100%' }}
                  id="redownload-compress-button"
                >
                  <ToolIcon name="download" size={16} style={{ marginRight: 6 }} />
                  Download Compressed PDF
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetFile}
                  style={{ width: '100%' }}
                  id="reset-compress-button"
                >
                  Compress Another PDF
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-attention"
                  onClick={handleCompress}
                  disabled={processing || isLocked}
                  id="compress-button"
                  style={{ width: '100%' }}
                >
                  {processing ? `Compressing (${progress}%)...` : 'Compress PDF'}
                  <ToolIcon name="compress" size={16} style={{ marginLeft: 6 }} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetFile}
                  disabled={processing}
                  style={{ width: '100%' }}
                >
                  Start over
                </button>
              </div>
            )
          )}
        >
          <div className="page-control-stat">
            <span>Original File Size</span>
            <strong>{formatSize(file.size)}</strong>
          </div>

          <div className="merge-summary-list">
            <div>
              <span className="ink-muted">Selected Level</span>
              <strong>{COMPRESSION_LEVELS[level].label}</strong>
            </div>
            <div>
              <span className="ink-muted">Compression Mode</span>
              <strong style={{ textTransform: 'capitalize' }}>{COMPRESSION_LEVELS[level].mode}</strong>
            </div>
            {result && (
              <>
                <div>
                  <span className="ink-muted">New File Size</span>
                  <strong style={{ color: result.isAlreadyOptimized ? 'var(--primary)' : 'var(--primary)' }}>{formatSize(result.compressedSize)}</strong>
                </div>
                <div>
                  <span className="ink-muted">Size Reduction</span>
                  <strong style={{ color: result.isAlreadyOptimized ? 'var(--primary)' : 'var(--semantic-success)' }}>
                    {result.isAlreadyOptimized ? '0% (Already Optimal)' : `-${result.reduction}%`}
                  </strong>
                </div>
              </>
            )}
          </div>

          <div className="page-help-note">
            <ToolIcon name="check" size={16} />
            <span>Files are processed 100% locally in your browser. Your documents never touch external servers.</span>
          </div>
        </PageToolWorkspace>
      )}

      {result && showToast && (
        <ToastNotification
          message={
            result.isAlreadyOptimized
              ? `✓ PDF is already fully optimized at ${formatSize(result.originalSize)}!`
              : `✓ PDF compressed! Saved ${result.reduction}% (${formatSize(result.originalSize)} ➔ ${formatSize(result.compressedSize)})`
          }
          onClose={() => setShowToast(false)}
        />
      )}
    </ToolPageLayout>
  );
}
