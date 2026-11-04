'use client';

import { useState, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, downloadBlob, checkPdfEncryption } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { loadPdfForRender } from '@/lib/renderUtils';
import { usePref } from '@/lib/preferences';

const COMPRESSION_LEVELS = {
  low: {
    label: 'Light',
    desc: 'No quality loss and text stays selectable. Best for text documents.',
    mode: 'lossless',
  },
  medium: {
    label: 'Balanced',
    badge: 'Recommended',
    desc: 'Good for scans and photo-heavy files. Pages are saved as images, so text can’t be selected afterwards.',
    mode: 'raster',
    dpi: 115,
    quality: 0.72,
    maxDimension: 1800,
  },
  high: {
    label: 'Smallest',
    desc: 'For strict upload limits. Lower image quality, and pages are saved as images.',
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

// Renders one page to a JPEG with the level's settings. Shared by compression and the estimate.
async function renderPageJpeg(renderDoc, pageNumber, settings) {
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
  canvas.width = 1;
  canvas.height = 1;
  sourcePage.cleanup?.();
  return { blob: imageBlob, width: baseViewport.width, height: baseViewport.height };
}

const EMAIL_LIMIT_BYTES = 10 * 1024 * 1024;
const ESTIMATE_SAMPLE_PAGES = 3;
// Rough per-page cost of the PDF structure around each embedded image.
const PAGE_OVERHEAD_BYTES = 600;

// Expected output size per level. Light runs for real (no rendering, so it is quick);
// the image levels render a few pages spread through the document and scale up.
// Like the real run, a level never ends up larger than the original file.
async function estimateSizes(file) {
  const lossless = Math.min((await compressLossless(file)).byteLength, file.size);
  const renderDoc = await loadPdfForRender(file);
  try {
    const total = renderDoc.numPages;
    const count = Math.min(ESTIMATE_SAMPLE_PAGES, total);
    const samples = Array.from({ length: count }, (_, i) => 1 + Math.floor((i * total) / count));
    const estimates = { low: lossless };
    for (const id of ['medium', 'high']) {
      let sampleBytes = 0;
      for (const pageNumber of samples) {
        sampleBytes += (await renderPageJpeg(renderDoc, pageNumber, COMPRESSION_LEVELS[id])).blob.size;
      }
      const raster = (sampleBytes / count + PAGE_OVERHEAD_BYTES) * total;
      estimates[id] = Math.min(raster, lossless);
    }
    return estimates;
  } finally {
    renderDoc.cleanup?.();
    renderDoc.destroy?.();
  }
}

async function compressRaster(file, settings, onProgress) {
  const renderDoc = await loadPdfForRender(file);
  const outputDoc = await PDFDocument.create({ updateMetadata: false });

  try {
    for (let pageNumber = 1; pageNumber <= renderDoc.numPages; pageNumber++) {
      const { blob, width, height } = await renderPageJpeg(renderDoc, pageNumber, settings);
      const image = await outputDoc.embedJpg(await blob.arrayBuffer());
      const page = outputDoc.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
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
  const preferredLevel = usePref('compressLevel');
  const [chosenLevel, setLevel] = useState(null);
  const level = chosenLevel ?? (COMPRESSION_LEVELS[preferredLevel] ? preferredLevel : 'medium');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  // null while estimating, 'failed' if the sample could not be measured.
  const [estimates, setEstimates] = useState(null);
  const estimateRun = useRef(0);

  const handleFilesSelected = useCallback(async (files) => {
    const selectedFile = files[0] || null;
    const run = ++estimateRun.current;
    setFile(selectedFile);
    setResult(null);
    setShowToast(false);
    setProgress(0);
    setIsLocked(false);
    setEstimates(null);

    if (selectedFile) {
      const locked = await checkPdfEncryption(selectedFile);
      if (locked) {
        setIsLocked(true);
        return;
      }
      estimateSizes(selectedFile)
        .then((sizes) => {
          if (run === estimateRun.current) setEstimates(sizes);
        })
        .catch(() => {
          if (run === estimateRun.current) setEstimates('failed');
        });
    }
  }, []);

  const resetFile = () => {
    estimateRun.current += 1;
    setEstimates(null);
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

  const estimateOf = (id) => (estimates && estimates !== 'failed' ? estimates[id] : null);
  const savingOf = (bytes) => Math.max(0, Math.round((1 - bytes / file.size) * 100));
  const afterBytes = result ? result.compressedSize : estimateOf(level);
  const afterText = afterBytes != null
    ? `${result ? '' : '~'}${formatSize(afterBytes)}`
    : estimates === null && !isLocked ? 'Estimating…' : '—';

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
          description="Make your PDF smaller for email and uploads."
          icon="compress"
          iconColor="var(--tool-optimize)"
          ariaLabel="Compress PDF workspace"
          preview={(
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="ws-toolbar">
                <span className="ws-file-label">
                  <ToolIcon name="pdf" size={18} />
                  <strong>{file.name}</strong>
                  <span>· {formatSize(file.size)}</span>
                </span>
                <div className="ws-toolbar-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={resetFile} disabled={processing}>
                    Change file
                  </button>
                </div>
              </div>
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
                      <h2 className="ws-section-title" id="compress-level-label">How small?</h2>
                      <div className="ws-choice-grid" role="radiogroup" aria-labelledby="compress-level-label">
                        {levels.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            role="radio"
                            aria-checked={level === item.id}
                            className="ws-choice"
                            onClick={() => setLevel(item.id)}
                            disabled={processing}
                          >
                            <span className="ws-choice-head">
                              <span className="ws-choice-name">{item.label}</span>
                              <span className="ws-choice-radio" aria-hidden="true" />
                            </span>
                            {estimateOf(item.id) != null ? (
                              <span className="ws-choice-size">
                                ~{formatSize(estimateOf(item.id))}
                                <span className="ws-choice-saving">−{savingOf(estimateOf(item.id))}%</span>
                              </span>
                            ) : estimates === null ? (
                              <span className="ws-choice-size ws-choice-size-pending">Estimating…</span>
                            ) : null}
                            {item.badge && <span className="ws-choice-badge">{item.badge}</span>}
                            <span className="ws-choice-desc">{item.desc}</span>
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
                  className="btn btn-primary btn-lg btn-success-state"
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
                  className="btn btn-primary btn-lg"
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
          <div className="ws-estimate">
            <span className="ws-estimate-title">{result ? 'Result' : 'Estimate'}</span>
            <div className="ws-estimate-row">
              <span>Now</span>
              <strong>{formatSize(file.size)}</strong>
            </div>
            <div className="ws-bar"><span className="ws-bar-muted" style={{ width: '100%' }} /></div>
            <div className="ws-estimate-row">
              <span>After{result ? '' : ` · ${COMPRESSION_LEVELS[level].label}`}</span>
              <strong className="ws-estimate-after">{afterText}</strong>
            </div>
            <div className="ws-bar">
              <span style={{ width: afterBytes != null ? `${Math.max(2, 100 - savingOf(afterBytes))}%` : '0%' }} />
            </div>
          </div>

          {afterBytes != null && (
            <p className={`ws-note ${afterBytes < EMAIL_LIMIT_BYTES ? 'ws-note-good' : 'ws-note-warn'}`}>
              {result?.isAlreadyOptimized
                ? 'This file was already as small as it can get, so the original is kept.'
                : afterBytes < EMAIL_LIMIT_BYTES
                  ? `${savingOf(afterBytes)}% smaller — fits most email attachment limits (under 10 MB).`
                  : `${savingOf(afterBytes)}% smaller, but still over 10 MB. Try Smallest for strict limits.`}
            </p>
          )}
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
