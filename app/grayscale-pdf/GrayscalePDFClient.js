'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { PDFDocument } from 'pdf-lib';
import { loadPdfForRender } from '@/lib/renderUtils';
import { checkPdfEncryption } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';

export default function GrayscalePDFClient() {
  const deliver = useResultHandoff('grayscale-pdf');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [outputFileName, setOutputFileName] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const handleFilesSelected = useCallback(async (files) => {
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setDownloadUrl(null);
      setIsLocked(false);
      
      const locked = await checkPdfEncryption(selectedFile);
      if (locked) {
        setIsLocked(true);
      }
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
      const outName = `${file.name.replace(/\.pdf$/i, '')}_pdfsection_grayscale.pdf`;
      setOutputFileName(outName);
      await deliver(blob, outName, 'application/pdf');
    } catch (err) {
      console.error('Error converting PDF to Grayscale:', err);
      alert('Failed to convert PDF to Grayscale.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="Grayscale PDF Converter"
      description="Convert full-color PDF files to Black & White / Grayscale format for ink-saving printing."
      icon="image"
      iconColor="var(--tool-optimize)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept=".pdf"
          multiple={false}
          title="Select PDF file to convert to Grayscale"
          subtitle="Convert full-color documents to Black & White for cheap printing and document submission"
        />
      ) : (
        <PageToolWorkspace
          title="Grayscale PDF Converter"
          description="Convert color documents to Black & White format."
          icon="image"
          iconColor="var(--tool-optimize)"
          file={file}
          onReset={() => {
            setFile(null);
            setDownloadUrl(null);
          }}
          preview={
            <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Grayscale Processing Hub</p>
              
              {isProcessing && (
                <div style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '4px' }}>
                    <span>Processing page frames...</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}

               {!isProcessing && !downloadUrl && !isLocked && (
                <div style={{ fontSize: '13.5px', color: 'var(--ink-muted)', lineHeight: '1.5' }}>
                  <p>Ready to process PDF pages into black and white format.</p>
                  <p style={{ marginTop: '6px', color: 'var(--ink-subtle)' }}>
                    Note: Grayscale images reduce file size and printing ink usage.
                  </p>
                </div>
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

              {downloadUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', margin: 'auto' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--semantic-success)' }}>
                    ✓ Grayscale PDF Generated Successfully
                  </div>
                  <p className="caption ink-muted" style={{ fontSize: '13.5px' }}>
                    Click the download button in the sidebar panel to save your document.
                  </p>
                </div>
              )}
            </div>
          }
          footer={
            downloadUrl ? (
              <a
                href={downloadUrl}
                download={outputFileName}
                className="btn btn-primary btn-lg btn-attention"
                style={{ width: '100%', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Download Grayscale PDF
                <ToolIcon name="download" size={16} />
              </a>
            ) : (
              <button
                onClick={handleConvertToGrayscale}
                disabled={isProcessing || isLocked}
                className="btn btn-primary btn-lg btn-attention"
                style={{ width: '100%' }}
              >
                {isProcessing ? `Converting (${progress}%)...` : 'Convert to Grayscale (B&W)'}
                <ToolIcon name="image" size={16} />
              </button>
            )
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700' }}>OPTIMIZATION CONFIG</p>
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: '1.5' }}>
              <p>✓ All pages are rasterized to grayscale JPEGs at 150 DPI.</p>
              <p style={{ marginTop: '8px' }}>✓ Compiles completely in local client memory.</p>
            </div>
          </div>
        </PageToolWorkspace>
      )}

      {downloadUrl && (
        <ToastNotification
          message="✓ PDF converted to Grayscale B&W and downloaded successfully!"
          onClose={() => {}}
        />
      )}
    </ToolPageLayout>
  );
}
