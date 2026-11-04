'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { getToolById } from '@/lib/tools';
import { renderDocx, wordToPdf } from '@/lib/wordToPdf';
import { renderXlsxSections, xlsxToPdf } from '@/lib/xlsxToPdf';
import { renderPptxSlides, pptxToPdf } from '@/lib/pptxToPdf';

export default function OfficeToPDFClient({ toolId }) {
  const deliver = useResultHandoff(toolId);
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
  const [warnings, setWarnings] = useState([]);

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
        setWarnings([]);

        if (toolId === 'word-to-pdf') {
          const arrayBuffer = await file.arrayBuffer();
          if (isMounted) await renderDocx(arrayBuffer, container);
        } else if (toolId === 'excel-to-pdf') {
          const arrayBuffer = await file.arrayBuffer();
          if (isMounted) {
            const { warnings: w } = await renderXlsxSections(arrayBuffer, container);
            if (isMounted) setWarnings(w);
          }
        } else if (toolId === 'powerpoint-to-pdf') {
          const arrayBuffer = await file.arrayBuffer();
          if (isMounted) {
            const { warnings: w } = await renderPptxSlides(arrayBuffer, container);
            if (isMounted) setWarnings(w);
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

    try {
      if (toolId === 'word-to-pdf') {
        const bytes = await wordToPdf(file, { onProgress: setProgress });
        await deliver(new Blob([bytes], { type: 'application/pdf' }), file.name.replace(/\.[^/.]+$/, '.pdf'), 'application/pdf');
        setProgress(100);
        setDone(true);
        return;
      }

      if (toolId === 'excel-to-pdf') {
        const { bytes, warnings: w } = await xlsxToPdf(file, { onProgress: setProgress });
        setWarnings(w);
        await deliver(new Blob([bytes], { type: 'application/pdf' }), file.name.replace(/\.[^/.]+$/, '.pdf'), 'application/pdf');
        setProgress(100);
        setDone(true);
        return;
      }

      const { bytes, warnings: w } = await pptxToPdf(file, { onProgress: setProgress });
      setWarnings(w);
      await deliver(new Blob([bytes], { type: 'application/pdf' }), file.name.replace(/\.[^/.]+$/, '.pdf'), 'application/pdf');
      setProgress(100);
      setDone(true);
    } catch (err) {
      console.error('Error during PDF conversion:', err);
      alert('Error during PDF export: ' + err.message);
    } finally {
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

            {warnings.length > 0 && (
              <ul className="caption" style={{ margin: 0, paddingLeft: '18px', color: 'var(--ink-subtle)' }}>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}

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
          overflow: auto;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px;
        }
      `}</style>
    </ToolPageLayout>
  );
}
