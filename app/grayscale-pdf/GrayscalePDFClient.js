'use client';

import { useState, useCallback } from 'react';
import FileDropzone from '@/components/FileDropzone';
import { PDFDocument } from 'pdf-lib';
import { loadPdfForRender } from '@/lib/renderUtils';

export default function GrayscalePDFClient() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [outputFileName, setOutputFileName] = useState('');

  const handleFilesSelected = useCallback((files) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setDownloadUrl(null);
    }
  }, []);

  const handleConvertToGrayscale = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const pdfDoc = await loadPdfForRender(file);
      const numPages = pdfDoc.numPages;

      const outPdf = await PDFDocument.create();

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setProgress(Math.round((pageNum / numPages) * 100));
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert canvas image data to grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = avg;     // Red
          data[i + 1] = avg; // Green
          data[i + 2] = avg; // Blue
        }
        ctx.putImageData(imageData, 0, 0);

        const grayscaleDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const grayscaleImageBytes = await fetch(grayscaleDataUrl).then((res) => res.arrayBuffer());

        const embeddedImage = await outPdf.embedJpg(grayscaleImageBytes);
        const newPage = outPdf.addPage([viewport.width / 2.0, viewport.height / 2.0]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: viewport.width / 2.0,
          height: viewport.height / 2.0,
        });
      }

      const pdfBytes = await outPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const outName = `${file.name.replace(/\.pdf$/i, '')}_Grayscale.pdf`;
      setOutputFileName(outName);
      setDownloadUrl(url);
    } catch (err) {
      console.error('Error converting PDF to Grayscale:', err);
      alert('Failed to convert PDF to Grayscale.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: 'var(--space-md) 0' }}>
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept=".pdf"
          multiple={false}
          title="Select PDF file to convert to Grayscale"
          subtitle="Convert full-color documents to Black & White for cheap printing and document submission"
        />
      ) : (
        <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 style={{ fontWeight: '700', fontSize: '16px', color: 'var(--ink)' }}>{file.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-subtle)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => { setFile(null); setDownloadUrl(null); }}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              Change file
            </button>
          </div>

          {!downloadUrl ? (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              {isProcessing && (
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '4px' }}>
                    <span>Processing Grayscale conversion...</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}
              <button
                onClick={handleConvertToGrayscale}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontWeight: '600', fontSize: '15px' }}
              >
                {isProcessing ? `Converting (${progress}%)...` : 'Convert to Grayscale (B&W)'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
              <a
                href={downloadUrl}
                download={outputFileName}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', display: 'block' }}
              >
                ⬇️ Download Grayscale PDF ({outputFileName})
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
