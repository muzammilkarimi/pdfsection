'use client';

import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, downloadBlob } from '@/lib/pdfUtils';
import { loadPdfForRender } from '@/lib/renderUtils';

const COMPRESSION_LEVELS = {
  low: {
    label: 'Low Compression',
    desc: 'Lossless PDF cleanup. Keeps text selectable and preserves vectors.',
    icon: 'Low',
    mode: 'lossless',
  },
  medium: {
    label: 'Recommended',
    desc: 'Smaller file for scanned PDFs. Pages are flattened to images.',
    icon: 'Med',
    mode: 'raster',
    dpi: 115,
    quality: 0.72,
    maxDimension: 1800,
  },
  high: {
    label: 'Maximum Compression',
    desc: 'Smallest output. Best for scanned/image PDFs, lower visual quality.',
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
      const selectedLevel = COMPRESSION_LEVELS[level];
      const originalSize = file.size;
      const candidateBytes = selectedLevel.mode === 'lossless'
        ? await compressLossless(file)
        : await compressRaster(file, selectedLevel, setProgress);

      const originalBytes = new Uint8Array(await file.arrayBuffer());
      const outputBytes = candidateBytes.length < originalSize ? candidateBytes : originalBytes;
      const compressedSize = outputBytes.length;
      const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

      setResult({
        originalSize,
        compressedSize,
        candidateSize: candidateBytes.length,
        savings,
        bytes: outputBytes,
        level,
        mode: selectedLevel.mode,
        usedOriginal: candidateBytes.length >= originalSize,
      });
      setProgress(100);
    } catch (err) {
      alert('Error compressing PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const name = file.name.replace(/\.pdf$/i, '-compressed.pdf');
    downloadBlob(result.bytes, name, 'application/pdf');
  };

  const levels = Object.entries(COMPRESSION_LEVELS).map(([id, config]) => ({ id, ...config }));

  return (
    <ToolPageLayout
      title="Compress PDF"
      description="Reduce PDF size in your browser. Medium and high compression are best for scanned or image-heavy PDFs."
      icon="compress"
      iconColor="var(--tool-optimize)"
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Select PDF file"
          id="compress-dropzone"
        />
      ) : !result ? (
        <div className="tool-workspace">
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <span className="file-item-size">{formatSize(file.size)}</span>
              <button className="file-item-remove" onClick={resetFile} aria-label={`Remove ${file.name}`}>
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <p className="eyebrow" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', color: 'var(--ink-subtle)' }}>
              Compression Level
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {levels.map((item) => (
                <button
                  key={item.id}
                  className="card"
                  onClick={() => setLevel(item.id)}
                  disabled={processing}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    textAlign: 'left',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    border: level === item.id ? '1px solid var(--primary)' : '1px solid var(--hairline)',
                    backgroundColor: level === item.id ? 'var(--surface-2)' : 'var(--surface-1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span style={{ minWidth: 34, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-subtle)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Compression Actions</p>
              <div
                style={{
                  padding: 'var(--space-sm)',
                  backgroundColor: 'rgba(245, 166, 35, 0.08)',
                  borderRadius: 'var(--rounded-md)',
                  border: '1px solid rgba(245, 166, 35, 0.2)',
                  color: 'var(--semantic-warning)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                }}
              >
                Medium and high compression flatten pages into images. This gives stronger size reduction for scanned PDFs, but selectable text may be lost.
              </div>

              <div style={{ fontSize: 13 }}>
                <span className="ink-muted">Selected Level: </span>
                <span style={{ fontWeight: 600 }}>{COMPRESSION_LEVELS[level].label}</span>
              </div>

              {processing && (
                <div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="body-sm ink-subtle" style={{ textAlign: 'center', marginTop: 4 }}>
                    Compressing... {progress}%
                  </p>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleCompress}
                disabled={processing}
                style={{ width: '100%' }}
                id="compress-button"
              >
                {processing ? 'Compressing...' : 'Compress PDF'}
                <ToolIcon name="compress" size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="tool-workspace">
          <div className="tool-main-panel">
            <div
              className="card"
              style={{
                padding: 'var(--space-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-md)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, color: result.savings > 0 ? 'var(--semantic-success)' : 'var(--ink-subtle)' }}>
                {result.savings > 0 ? 'OK' : '0%'}
              </div>
              <p className="headline" style={{ color: result.savings > 0 ? 'var(--semantic-success)' : 'var(--ink)', fontSize: 32 }}>
                {result.savings > 0 ? `${result.savings}% smaller` : 'Already optimized'}
              </p>
              {result.usedOriginal && (
                <p className="body-sm ink-subtle" style={{ maxWidth: 520 }}>
                  The compressed version was not smaller than the original, so the download keeps the original bytes instead of making the file larger.
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-xl)',
                  width: '100%',
                  borderTop: '1px solid var(--hairline)',
                  paddingTop: 'var(--space-md)',
                }}
              >
                <div>
                  <p className="caption ink-subtle">Original Size</p>
                  <p className="body" style={{ fontWeight: 500 }}>{formatSize(result.originalSize)}</p>
                </div>
                <ToolIcon name="arrowRight" size={20} className="ink-tertiary" />
                <div>
                  <p className="caption ink-subtle">Output Size</p>
                  <p className="body" style={{ fontWeight: 500, color: result.savings > 0 ? 'var(--semantic-success)' : 'var(--ink)' }}>
                    {formatSize(result.compressedSize)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Compressed File</p>

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleDownload}
                style={{ width: '100%' }}
              >
                Download PDF
                <ToolIcon name="download" size={16} />
              </button>

              <button
                className="btn btn-tertiary"
                onClick={resetFile}
                style={{ width: '100%', fontSize: 13 }}
              >
                Compress another file
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
