'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import JSZip from 'jszip';

export default function OfficeToPDFClient({ toolId }) {
  const toolInfo = getToolById(toolId) || {
    name: 'Office to PDF',
    description: 'Convert Office documents to PDF format with full formatting',
    categoryColor: 'var(--tool-convert-to)',
    icon: 'word',
  };

  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [renderingPreview, setRenderingPreview] = useState(false);

  const previewContainerRef = useRef(null);

  // File extension details
  const fileExts = {
    'word-to-pdf': '.docx,.doc',
    'excel-to-pdf': '.xlsx,.xls',
    'powerpoint-to-pdf': '.pptx,.ppt',
  };

  const handleFilesSelected = useCallback((files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setProgress(0);
  }, []);

  const resetFile = () => {
    setFile(null);
    setDone(false);
    setProgress(0);
  };

  // Render live preview when file is selected
  useEffect(() => {
    if (!file || !previewContainerRef.current) return;

    let isMounted = true;
    setRenderingPreview(true);

    const renderPreview = async () => {
      try {
        const container = previewContainerRef.current;
        if (!container) return;
        container.innerHTML = '';

        if (toolId === 'word-to-pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer });

          if (isMounted) {
            const docDiv = document.createElement('div');
            docDiv.className = 'word-styled-doc';
            docDiv.innerHTML = result.value || '<p><em>Empty Document</em></p>';
            container.appendChild(docDiv);
          }
        } else if (toolId === 'excel-to-pdf') {
          const zip = new JSZip();
          const content = await zip.loadAsync(file);

          const stringsFile = content.file('xl/sharedStrings.xml');
          let sharedStrings = [];
          if (stringsFile) {
            const stringsXml = await stringsFile.async('text');
            const matches = stringsXml.match(/<t[^>]*>(.*?)<\/t>/g) || [];
            sharedStrings = matches.map((m) => m.replace(/<[^>]*>/g, ''));
          }

          if (isMounted) {
            const docDiv = document.createElement('div');
            docDiv.className = 'word-styled-doc';
            let html = `<h2>${file.name} - Spreadsheet</h2><table class="excel-preview-table">`;

            if (sharedStrings.length > 0) {
              html += '<thead><tr><th>#</th><th>Cell Content</th></tr></thead><tbody>';
              sharedStrings.forEach((str, i) => {
                html += `<tr><td style="width: 40px; color: #888;">${i + 1}</td><td>${str}</td></tr>`;
              });
              html += '</tbody>';
            } else {
              html += '<tr><td><em>Empty Spreadsheet</em></td></tr>';
            }
            html += '</table>';
            docDiv.innerHTML = html;
            container.appendChild(docDiv);
          }
        } else if (toolId === 'powerpoint-to-pdf') {
          const zip = new JSZip();
          const content = await zip.loadAsync(file);

          const slideFiles = Object.keys(content.files).filter((name) =>
            name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
          );

          if (isMounted) {
            const docDiv = document.createElement('div');
            docDiv.className = 'word-styled-doc';
            let html = `<h2>${file.name} - Presentation</h2>`;

            for (const [idx, slidePath] of slideFiles.sort().entries()) {
              const slideXml = await content.files[slidePath].async('text');
              const matches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
              const texts = matches.map((m) => m.replace(/<[^>]*>/g, ''));

              html += `<div style="border: 1px solid #dcdcdc; padding: 18px; margin-bottom: 18px; border-radius: 6px; background: #fafafa;">`;
              html += `<h3 style="margin: 0 0 10px 0; color: #1f4e78; font-size: 14pt;">Slide ${idx + 1}</h3>`;
              if (texts.length > 0) {
                html += `<ul style="margin: 0; padding-left: 20px;">`;
                texts.forEach((t) => { html += `<li style="margin-bottom: 6px;">${t}</li>`; });
                html += `</ul>`;
              } else {
                html += `<p style="color: #888; margin: 0;">[Blank Slide]</p>`;
              }
              html += `</div>`;
            }

            docDiv.innerHTML = html || '<p><em>Empty Presentation</em></p>';
            container.appendChild(docDiv);
          }
        }
      } catch (err) {
        console.error('Error rendering preview:', err);
      } finally {
        if (isMounted) setRenderingPreview(false);
      }
    };

    renderPreview();

    return () => {
      isMounted = false;
    };
  }, [file, toolId]);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(15);

    let tempExportContainer = null;

    try {
      let htmlContent = '';

      if (toolId === 'word-to-pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        htmlContent = result.value || '<p>Empty Document</p>';
      } else {
        const container = previewContainerRef.current;
        htmlContent = container?.firstElementChild?.innerHTML || `<p>${file.name}</p>`;
      }

      setProgress(40);

      // Create a fixed in-viewport container (A4 width: 794px at 96dpi)
      tempExportContainer = document.createElement('div');
      tempExportContainer.style.position = 'fixed';
      tempExportContainer.style.left = '0px';
      tempExportContainer.style.top = '0px';
      tempExportContainer.style.width = '794px';
      tempExportContainer.style.height = 'auto';
      tempExportContainer.style.overflow = 'visible';
      tempExportContainer.style.background = '#ffffff';
      tempExportContainer.style.zIndex = '-9999';
      tempExportContainer.style.boxSizing = 'border-box';

      const docDiv = document.createElement('div');
      docDiv.className = 'word-styled-doc-export';
      docDiv.innerHTML = htmlContent;
      tempExportContainer.appendChild(docDiv);
      document.body.appendChild(tempExportContainer);

      setProgress(60);

      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import('jspdf');

      // Render high-resolution canvas at scale 2
      const canvas = await html2canvas(tempExportContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
      });

      setProgress(85);

      // Export multi-page PDF using jsPDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      setProgress(95);
      const pdfBlob = pdf.output('blob');
      const pdfFilename = file.name.replace(/\.[^/.]+$/, '.pdf');
      downloadBlob(pdfBlob, pdfFilename, 'application/pdf');

      setProgress(100);
      setDone(true);
    } catch (err) {
      console.error('Error during PDF conversion:', err);
      alert('Error during PDF export: ' + err.message);
    } finally {
      if (tempExportContainer && tempExportContainer.parentNode) {
        tempExportContainer.parentNode.removeChild(tempExportContainer);
      }
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title={toolInfo.name}
      description={toolInfo.description}
      icon={toolInfo.icon}
      iconColor={toolInfo.categoryColor}
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          accept={fileExts[toolId]}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label={`Upload your Office document to convert to PDF`}
          id="office-to-pdf-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title={toolInfo.name}
          description="High-fidelity client-side document formatting and PDF conversion."
          icon={toolInfo.icon}
          iconColor={toolInfo.categoryColor}
          file={file}
          onReset={resetFile}
          preview={
            <div className="word-preview-root">
              {renderingPreview && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-subtle)' }}>
                  Rendering document preview with full formatting...
                </div>
              )}
              <div ref={previewContainerRef} />
            </div>
          }
          footer={
            <button
              className={`btn btn-lg btn-attention ${done ? 'btn-success-state' : 'btn-primary'}`}
              onClick={handleConvert}
              disabled={processing || renderingPreview}
              style={{ width: '100%' }}
              id="convert-office-button"
            >
              {processing ? 'Converting to PDF...' : done ? '✓ Downloaded — Convert Again' : 'Convert to PDF'}
              <ToolIcon name={done ? 'check' : 'download'} size={16} style={{ marginLeft: 6 }} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Formatted Document Conversion</p>
            <p className="body-xs ink-subtle" style={{ lineHeight: 1.5 }}>
              All headings, tables, borders, colors, text styles, and embedded images are parsed and formatted directly inside your browser before downloading as PDF.
            </p>

            {processing && (
              <div style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)' }}>
                  Rendering PDF pages... {progress}%
                </p>
              </div>
            )}
          </div>
        </PageToolWorkspace>
      )}

      {done && (
        <ToastNotification
          message="PDF converted & downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}

      <style jsx global>{`
        .word-preview-root {
          width: 100%;
          max-height: 540px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px;
        }
        .word-styled-doc, .word-styled-doc-export {
          background-color: #ffffff !important;
          color: #111111 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          padding: 40pt 48pt !important;
          border-radius: 4px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          margin: 0 auto;
          max-width: 750px;
          line-height: 1.6;
          box-sizing: border-box;
          text-align: left;
        }
        .word-styled-doc h1, .word-styled-doc-export h1 { font-size: 24pt !important; color: #1f4e78 !important; font-weight: 700 !important; margin: 18pt 0 8pt 0 !important; border-bottom: 2px solid #1f4e78 !important; padding-bottom: 4pt !important; }
        .word-styled-doc h2, .word-styled-doc-export h2 { font-size: 18pt !important; color: #2f5597 !important; font-weight: 700 !important; margin: 14pt 0 6pt 0 !important; }
        .word-styled-doc h3, .word-styled-doc-export h3 { font-size: 14pt !important; color: #1f4e78 !important; font-weight: 700 !important; margin: 12pt 0 4pt 0 !important; }
        .word-styled-doc h4, .word-styled-doc-export h4 { font-size: 12pt !important; color: #333333 !important; font-weight: 700 !important; margin: 10pt 0 4pt 0 !important; }
        .word-styled-doc p, .word-styled-doc-export p { margin-bottom: 8pt !important; font-size: 11pt !important; color: #222222 !important; }
        .word-styled-doc table, .word-styled-doc-export table { border-collapse: collapse !important; width: 100% !important; margin: 14pt 0 !important; font-size: 10pt !important; }
        .word-styled-doc th, .word-styled-doc-export th, .word-styled-doc td, .word-styled-doc-export td { border: 1px solid #c0c0c0 !important; padding: 6pt 10pt !important; text-align: left !important; }
        .word-styled-doc th, .word-styled-doc-export th { background-color: #f2f4f8 !important; color: #1f4e78 !important; font-weight: 700 !important; }
        .word-styled-doc tr:nth-child(even), .word-styled-doc-export tr:nth-child(even) { background-color: #fcfcfc !important; }
        .word-styled-doc img, .word-styled-doc-export img { max-width: 100% !important; height: auto !important; display: block !important; margin: 12pt 0 !important; border-radius: 4px !important; }
        .word-styled-doc ul, .word-styled-doc-export ul, .word-styled-doc ol, .word-styled-doc-export ol { padding-left: 24pt !important; margin: 8pt 0 !important; }
        .word-styled-doc li, .word-styled-doc-export li { margin-bottom: 4pt !important; }
        .word-styled-doc strong, .word-styled-doc-export strong { font-weight: 700 !important; color: #000000 !important; }
        .word-styled-doc em, .word-styled-doc-export em { font-style: italic !important; }
        .word-styled-doc u, .word-styled-doc-export u { text-decoration: underline !important; }
        .excel-preview-table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .excel-preview-table th, .excel-preview-table td { border: 1px solid #dcdcdc; padding: 8px 12px; font-size: 13px; }
        .excel-preview-table th { background: #f0f4f8; color: #1f4e78; font-weight: 600; }
      `}</style>
    </ToolPageLayout>
  );
}
