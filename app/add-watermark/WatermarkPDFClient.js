'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, addTextWatermark, downloadPdf } from '@/lib/pdfUtils';

export default function WatermarkPDFClient() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.2);
  const [rotation, setRotation] = useState(-45);
  const [color, setColor] = useState('#888888');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
  }, []);

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
      r: ((bigint >> 16) & 255) / 255,
      g: ((bigint >> 8) & 255) / 255,
      b: (bigint & 255) / 255,
    };
  };

  const handleWatermark = async () => {
    if (!file || !text) return;
    setProcessing(true);

    try {
      const srcDoc = await loadPdf(file);
      const rgbColor = hexToRgb(color);
      const watermarkedDoc = await addTextWatermark(srcDoc, {
        text,
        fontSize,
        opacity,
        rotation,
        color: rgbColor,
      });

      await downloadPdf(watermarkedDoc, file.name.replace('.pdf', '-watermarked.pdf'));
      setDone(true);
    } catch (err) {
      alert('Error adding watermark: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="Add Watermark"
      description="Stamp a text watermark over the pages of your PDF document."
      icon="watermark"
      iconColor="var(--tool-edit)"
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF here"
          id="watermark-dropzone"
        />
      ) : (
        <div className="tool-workspace">
          {/* Left panel: File details and page previews */}
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
              Document Pages:
            </p>
            <PageThumbnails file={file} selectable={false} maxWidth={120} />
          </div>

          {/* Right panel: Watermark details and configurations sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Watermark Settings</p>
              
              {/* Text Input */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                  Watermark Text
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. CONFIDENTIAL, DRAFT"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={40}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Position / parameters styling grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {/* Font Size & Rotation */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <div style={{ flex: 1 }}>
                    <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                      Font Size
                    </label>
                    <input
                      type="number"
                      className="input"
                      min="12"
                      max="120"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value) || 48)}
                      style={{ width: '100%', padding: '6px' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                      Rotation (°)
                    </label>
                    <input
                      type="number"
                      className="input"
                      min="-360"
                      max="360"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px' }}
                    />
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                    Opacity ({Math.round(opacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                    Watermark Color
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      height: 38,
                    }}
                  />
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
                  ✓ Watermark added!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleWatermark}
                disabled={processing || !text}
                style={{ width: '100%' }}
                id="watermark-pdf-button"
              >
                {processing ? 'Processing...' : 'Add Watermark'}
                <ToolIcon name="watermark" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
