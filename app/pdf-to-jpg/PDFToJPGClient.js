'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import { ToolIcon } from '@/components/Icons';
import { loadPdf } from '@/lib/pdfUtils';
import { renderPageToImage } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';

export default function PDFToJPGClient() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('image/jpeg'); // 'image/jpeg', 'image/png'
  const [dpi, setDpi] = useState(150); // 72, 150, 300
  const [quality, setQuality] = useState(0.9);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
    setProgress(0);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      // Find total pages
      const pdfDoc = await loadPdf(file);
      const pageCount = pdfDoc.getPageCount();
      const ext = format === 'image/jpeg' ? 'jpg' : 'png';

      if (pageCount === 1) {
        // Single page, download directly
        setProgress(50);
        const imageBlob = await renderPageToImage(file, 1, dpi, format, quality);
        setProgress(100);
        downloadBlob(imageBlob, `${file.name.replace('.pdf', '')}.${ext}`, format);
      } else {
        // Multiple pages, ZIP them
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 1; i <= pageCount; i++) {
          const imageBlob = await renderPageToImage(file, i, dpi, format, quality);
          zip.file(`page-${i}.${ext}`, imageBlob);
          setProgress(Math.round((i / pageCount) * 100));
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `${file.name.replace('.pdf', '')}-images.zip`, 'application/zip');
      }

      setDone(true);
    } catch (err) {
      alert('Error converting PDF to images: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formats = [
    { id: 'image/jpeg', label: 'JPG', desc: 'Standard compressed images' },
    { id: 'image/png', label: 'PNG', desc: 'Lossless quality, transparent bg' },
  ];

  const dpis = [
    { value: 72, label: 'Standard (72 DPI)' },
    { value: 150, label: 'Medium (150 DPI)' },
    { value: 300, label: 'High (300 DPI)' },
  ];

  return (
    <ToolPageLayout
      title="PDF to JPG"
      description="Convert PDF pages into high-quality JPG or PNG images."
      icon="image"
      iconColor="var(--tool-convert-from)"
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF file here"
          id="pdf-to-jpg-dropzone"
        />
      ) : (
        <div className="tool-workspace">
          {/* Left panel: File details and thumbnail previews */}
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <button
                className="file-item-remove"
                onClick={() => {
                  setFile(null);
                  setDone(false);
                }}
              >
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <p className="body-sm ink-subtle" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
              PDF Pages:
            </p>
            <PageThumbnails file={file} selectable={false} maxWidth={120} />
          </div>

          {/* Right panel: Format, resolution and compress configurations sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Export Settings</p>
              
              {/* Format selection */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 6 }}>Format</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxs)' }}>
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      className={`btn ${format === f.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFormat(f.id)}
                      style={{ fontSize: 12, padding: '8px', width: '100%', justifyContent: 'flex-start' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DPI selection */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 6 }}>DPI Resolution</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxs)' }}>
                  {dpis.map((d) => (
                    <button
                      key={d.value}
                      className={`btn ${dpi === d.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setDpi(d.value)}
                      style={{ fontSize: 12, padding: '8px', width: '100%', justifyContent: 'flex-start' }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compression quality (Only for JPG) */}
              {format === 'image/jpeg' && (
                <div>
                  <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                    Quality: {Math.round(quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>
              )}

              {processing && (
                <div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="body-sm ink-subtle" style={{ textAlign: 'center', marginTop: 4 }}>
                    Processing... {progress}%
                  </p>
                </div>
              )}

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
                  ✓ Export successful!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleConvert}
                disabled={processing}
                style={{ width: '100%' }}
                id="convert-pdf-to-jpg-button"
              >
                {processing ? 'Converting...' : 'Convert to Image'}
                <ToolIcon name="image" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
