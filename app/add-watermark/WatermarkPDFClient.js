'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
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

  const resetFile = () => {
    setFile(null);
    setDone(false);
  };

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
      const watermarkedDoc = await addTextWatermark(srcDoc, {
        text,
        fontSize,
        opacity,
        rotation,
        color: hexToRgb(color),
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
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Select PDF file" id="watermark-dropzone" />
      ) : (
        <PageToolWorkspace
          title="Add Watermark"
          description="Set watermark text, color, opacity, and rotation."
          icon="watermark"
          iconColor="var(--tool-edit)"
          file={file}
          onReset={resetFile}
          ariaLabel="Watermark settings"
          preview={<PageThumbnails file={file} selectable={false} maxWidth={150} className="page-preview-grid" />}
          footer={(
            <button className="btn btn-primary btn-lg btn-attention" onClick={handleWatermark} disabled={processing || !text} id="watermark-pdf-button">
              {processing ? 'Processing...' : 'Add Watermark'}
              <ToolIcon name="watermark" size={16} />
            </button>
          )}
        >
          <div className="page-field-group">
            <label className="body-sm ink-muted">Watermark text</label>
            <input type="text" className="input" placeholder="e.g. CONFIDENTIAL, DRAFT" value={text} onChange={(event) => setText(event.target.value)} maxLength={40} />
          </div>

          <div className="page-two-column-fields">
            <div className="page-field-group">
              <label className="body-sm ink-muted">Font size</label>
              <input type="number" className="input" min="12" max="120" value={fontSize} onChange={(event) => setFontSize(parseInt(event.target.value) || 48)} />
            </div>
            <div className="page-field-group">
              <label className="body-sm ink-muted">Rotation</label>
              <input type="number" className="input" min="-360" max="360" value={rotation} onChange={(event) => setRotation(parseInt(event.target.value) || 0)} />
            </div>
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">Opacity ({Math.round(opacity * 100)}%)</label>
            <input type="range" min="0.05" max="0.9" step="0.05" value={opacity} onChange={(event) => setOpacity(parseFloat(event.target.value))} className="page-range" />
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">Watermark color</label>
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="page-color-input" />
          </div>

          {done && <div className="merge-success">Watermark added. Your PDF has been downloaded.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}


