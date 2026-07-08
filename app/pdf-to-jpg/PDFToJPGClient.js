'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, downloadBlob } from '@/lib/pdfUtils';
import { renderPageToImage } from '@/lib/renderUtils';

export default function PDFToJPGClient() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('image/jpeg');
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(0.9);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
    setProgress(0);
  }, []);

  const resetFile = () => {
    setFile(null);
    setDone(false);
    setProgress(0);
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      const pdfDoc = await loadPdf(file);
      const pageCount = pdfDoc.getPageCount();
      const ext = format === 'image/jpeg' ? 'jpg' : 'png';

      if (pageCount === 1) {
        setProgress(50);
        const imageBlob = await renderPageToImage(file, 1, dpi, format, quality);
        setProgress(100);
        downloadBlob(imageBlob, `${file.name.replace('.pdf', '')}.${ext}`, format);
      } else {
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
            <button className="btn btn-primary btn-lg btn-attention" onClick={handleConvert} disabled={processing} id="convert-pdf-to-jpg-button">
              {processing ? 'Converting...' : 'Convert to Image'}
              <ToolIcon name="image" size={16} />
            </button>
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

          {done && <div className="merge-success">Export successful. Your images have been downloaded.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}


