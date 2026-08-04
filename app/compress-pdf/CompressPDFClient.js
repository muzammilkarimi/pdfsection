'use client';

import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, downloadBlob } from '@/lib/pdfUtils';
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
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setResult(null);
    setProgress(0);
  }, []);

  const resetFile = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
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
        setProgress(100);
      } else {
        bytes = await compressRaster(file, settings, (p) => setProgress(p));
      }

      const compressedSize = bytes.byteLength;
      const originalSize = file.size;
      const reduction = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

      setResult({
        bytes,
        filename: file.name.replace('.pdf', '-compressed.pdf'),
        originalSize,
        compressedSize,
        reduction,
      });
      downloadBlob(bytes, file.name.replace('.pdf', '-compressed.pdf'), 'application/pdf');
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
            </div>
          )}
          footer={(
            <>
              <button
                type="button"
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleCompress}
                disabled={processing}
                id="compress-button"
              >
                {processing ? `Compressing (${progress}%)...` : 'Compress PDF'}
                <ToolIcon name="compress" size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetFile}
                disabled={processing}
              >
                Start over
              </button>
            </>
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
                  <strong style={{ color: 'var(--primary)' }}>{formatSize(result.compressedSize)}</strong>
                </div>
                <div>
                  <span className="ink-muted">Size Reduction</span>
                  <strong style={{ color: 'var(--semantic-success)' }}>-{result.reduction}%</strong>
                </div>
              </>
            )}
          </div>

          <div className="page-help-note">
            <ToolIcon name="check" size={16} />
            <span>Files are processed 100% locally in your browser. Your documents never touch external servers.</span>
          </div>

          {result && (
            <div className="merge-success">
              ✓ PDF compressed! Saved {result.reduction}% ({formatSize(result.originalSize)} ➔ {formatSize(result.compressedSize)})
            </div>
          )}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
