'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, downloadBlob } from '@/lib/pdfUtils';
import { renderPageToImage } from '@/lib/renderUtils';

export default function PDFToJPGClient() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('image/jpeg');
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(0.92);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [exportedData, setExportedData] = useState(null);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
    setExportedData(null);
  }, []);

  const resetFile = () => {
    setFile(null);
    setDone(false);
    setExportedData(null);
    setProgress(0);
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(5);

    try {
      const pdfDoc = await loadPdf(file);
      const pageCount = pdfDoc.getPageCount();
      const ext = format === 'image/jpeg' ? 'jpg' : 'png';
      let outBlob;
      let outFilename;
      let mime;

      if (pageCount === 1) {
        setProgress(50);
        outBlob = await renderPageToImage(file, 1, dpi, format, quality);
        outFilename = `${file.name.replace('.pdf', '')}.${ext}`;
        mime = format;
        setProgress(100);
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 1; i <= pageCount; i++) {
          const imageBlob = await renderPageToImage(file, i, dpi, format, quality);
          zip.file(`page-${i}.${ext}`, imageBlob);
          setProgress(Math.round((i / pageCount) * 100));
        }

        outBlob = await zip.generateAsync({ type: 'blob' });
        outFilename = `${file.name.replace('.pdf', '')}-images.zip`;
        mime = 'application/zip';
      }

      setExportedData({ blob: outBlob, filename: outFilename, mime });
      downloadBlob(outBlob, outFilename, mime);
      setDone(true);
    } catch (err) {
      alert('Error converting PDF to images: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRedownload = () => {
    if (exportedData) {
      downloadBlob(exportedData.blob, exportedData.filename, exportedData.mime);
    }
  };

  const formats = [
    { id: 'image/jpeg', label: 'JPG' },
    { id: 'image/png', label: 'PNG' },
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
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Select PDF file" id="pdf-to-jpg-dropzone" />
      ) : (
        <PageToolWorkspace
          title="PDF to JPG"
          description="Choose image format, resolution, and quality."
          icon="image"
          iconColor="var(--tool-convert-from)"
          file={file}
          onReset={resetFile}
          ariaLabel="PDF to image settings"
          preview={<PageThumbnails file={file} selectable={false} maxWidth={150} className="page-preview-grid" />}
          footer={(
            done ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  className="btn btn-primary btn-lg btn-attention btn-success-state"
                  onClick={handleRedownload}
                  style={{ width: '100%' }}
                  id="redownload-pdf-to-jpg-button"
                >
                  <ToolIcon name="download" size={16} style={{ marginRight: 6 }} />
                  Download Images Again
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetFile} disabled={processing} style={{ width: '100%' }}>
                  Convert Another PDF
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-lg btn-attention" onClick={handleConvert} disabled={processing} id="convert-pdf-to-jpg-button" style={{ width: '100%' }}>
                {processing ? 'Converting...' : 'Convert to Image'}
                <ToolIcon name="image" size={16} style={{ marginLeft: 6 }} />
              </button>
            )
          )}
        >
          <div className="page-field-group">
            <label className="body-sm ink-muted">Format</label>
            <div className="page-option-list">
              {formats.map((item) => (
                <button key={item.id} className={`btn ${format === item.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFormat(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">DPI resolution</label>
            <div className="page-option-list">
              {dpis.map((item) => (
                <button key={item.value} className={`btn ${dpi === item.value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDpi(item.value)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {format === 'image/jpeg' && (
            <div className="page-field-group">
              <label className="body-sm ink-muted">Quality: {Math.round(quality * 100)}%</label>
              <input type="range" min="0.5" max="1.0" step="0.05" value={quality} onChange={(event) => setQuality(parseFloat(event.target.value))} className="page-range" />
            </div>
          )}

          {processing && (
            <div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="body-sm ink-subtle" style={{ textAlign: 'center', marginTop: 4 }}>Processing... {progress}%</p>
            </div>
          )}
        </PageToolWorkspace>
      )}

      {done && (
        <ToastNotification
          message="Export successful! Your images have been downloaded."
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
