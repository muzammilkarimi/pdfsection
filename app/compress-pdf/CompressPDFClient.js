'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, compressPdf, downloadPdf } from '@/lib/pdfUtils';

export default function CompressPDFClient() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const srcDoc = await loadPdf(file);
      const compressedDoc = await compressPdf(srcDoc);
      const originalSize = file.size;

      // Save and measure
      const bytes = await compressedDoc.save();
      const compressedSize = bytes.length;
      const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

      setResult({
        originalSize,
        compressedSize,
        savings,
        bytes,
      });
    } catch (err) {
      alert('Error compressing PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const name = file.name.replace('.pdf', '-compressed.pdf');
    const blob = new Blob([result.bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const levels = [
    { id: 'low', label: 'Low Compression', desc: 'Highest quality, minimal size reduction', icon: '🟢' },
    { id: 'medium', label: 'Recommended', desc: 'Good balance of quality and size', icon: '🟡' },
    { id: 'high', label: 'Maximum Compression', desc: 'Smallest file, some quality loss', icon: '🔴' },
  ];

  return (
    <ToolPageLayout
      title="Compress PDF"
      description="Optimize PDF structure in your browser. Image-heavy files may need server-side recompression for larger savings."
      icon="compress"
      iconColor="var(--tool-optimize)"
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF file here"
          id="compress-dropzone"
        />
      ) : !result ? (
        <div className="tool-workspace">
          {/* Left panel: File details and compression level choices */}
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <span className="file-item-size">{formatSize(file.size)}</span>
              <button className="file-item-remove" onClick={() => setFile(null)}>
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <p className="eyebrow" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', color: 'var(--ink-subtle)' }}>
              Compression Level
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {levels.map((l) => (
                <button
                  key={l.id}
                  className="card"
                  onClick={() => setLevel(l.id)}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: level === l.id ? '1px solid var(--primary)' : '1px solid var(--hairline)',
                    backgroundColor: level === l.id ? 'var(--surface-2)' : 'var(--surface-1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span style={{ fontSize: 16 }}>{l.icon}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{l.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-subtle)', marginTop: 2 }}>{l.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Actions sidebar */}
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
                This browser tool rewrites PDF structure and removes unused objects. It does not
                recompress embedded images, so savings vary by file.
              </div>
              
              <div style={{ fontSize: 13 }}>
                <span className="ink-muted">Selected Level: </span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{level}</span>
              </div>

              {processing && (
                <p className="body-sm ink-subtle" style={{ textAlign: 'center' }}>
                  Compressing document...
                </p>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleCompress}
                disabled={processing}
                style={{ width: '100%' }}
                id="compress-button"
              >
                {processing ? 'Compressing...' : 'Compress PDF'}
                <ToolIcon name="compress" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Results split workspace */
        <div className="tool-workspace">
          {/* Left panel: comparison indicators */}
          <div className="tool-main-panel">
            <div
              className="card"
              style={{
                padding: 'var(--space-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-md)',
              }}
            >
              <div style={{ fontSize: 40, color: 'var(--semantic-success)' }}>✓</div>
              <p className="headline" style={{ color: 'var(--semantic-success)', fontSize: 32 }}>
                {result.savings}% smaller
              </p>
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
                  <p className="caption ink-subtle">Compressed Size</p>
                  <p className="body" style={{ fontWeight: 500, color: 'var(--semantic-success)' }}>
                    {formatSize(result.compressedSize)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Download */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Compressed File</p>
              
              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleDownload}
                style={{ width: '100%' }}
              >
                Download PDF
                <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
              </button>
              
              <button
                className="btn btn-tertiary"
                onClick={() => { setFile(null); setResult(null); }}
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
