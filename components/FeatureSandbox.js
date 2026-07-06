'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { getToolByRoute } from '@/lib/tools';
import { loadPdfForRender } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';

export default function FeatureSandbox({ route }) {
  const toolInfo = getToolByRoute(route) || {
    name: 'PDF Tool',
    description: 'Manage and modify your PDF files',
    icon: 'pdf',
    categoryColor: 'var(--primary)',
    status: 'preview',
  };

  const [file, setFile] = useState(null);
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const isHtml = toolInfo.id === 'html-to-pdf';
  const isPreviewOnly = toolInfo.status === 'preview';
  const acceptsOfficeInput = ['word-to-pdf', 'excel-to-pdf', 'powerpoint-to-pdf'].includes(toolInfo.id);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
    setProgress(0);
  }, []);

  const handleRunTool = async () => {
    if (isPreviewOnly) return;

    setProcessing(true);
    setProgress(10);

    try {
      if (toolInfo.id === 'pdf-to-markdown' && file) {
        setProgress(30);
        const pdf = await loadPdfForRender(file);
        let mdText = `# ${file.name.replace('.pdf', '')}\n\n`;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(' ');
          mdText += `## Page ${i}\n\n${pageText}\n\n`;
          setProgress(Math.round(30 + (i / pdf.numPages) * 60));
        }

        setProgress(95);
        downloadBlob(
          new Blob([mdText], { type: 'text/markdown' }),
          file.name.replace('.pdf', '.md'),
          'text/markdown'
        );
        pdf.destroy();
      }

      setProgress(100);
      setDone(true);
    } catch (err) {
      alert('Error running tool: ' + err.message);
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
    >
      {isPreviewOnly && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-xs)',
            borderColor: 'rgba(245, 166, 35, 0.3)',
          }}
        >
          <span className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>
            Preview tool
          </span>
          <p className="body-sm ink-muted" style={{ lineHeight: 1.6 }}>
            This page is a product preview. The client-side conversion engine for this tool is not
            connected yet, so it will not generate or download placeholder output.
          </p>
        </div>
      )}

      {isHtml ? (
        <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <label className="body-sm ink-muted">Enter Website URL</label>
          <input
            type="url"
            className="input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      ) : !file ? (
        <FileDropzone
          accept={acceptsOfficeInput ? '.docx,.doc,.xlsx,.xls,.pptx,.ppt' : '.pdf'}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label={`Upload files for ${toolInfo.name}`}
          id="sandbox-dropzone"
        />
      ) : (
        <>
          <div className="file-item" style={{ marginBottom: 'var(--space-lg)' }}>
            <ToolIcon name="pdf" size={18} className="ink-subtle" />
            <span className="file-item-name">{file.name}</span>
            <button className="file-item-remove" onClick={() => { setFile(null); setDone(false); }}>
              <ToolIcon name="x" size={14} />
            </button>
          </div>

          {!isPreviewOnly && (
            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              <p className="eyebrow" style={{ marginBottom: 'var(--space-sm)' }}>Options</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '14px' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                  <span>Preserve page breaks</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '14px' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                  <span>Extract text from all pages</span>
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {processing && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="body-sm ink-subtle" style={{ textAlign: 'center', marginTop: 'var(--space-xs)' }}>
            Processing document... {progress}%
          </p>
        </div>
      )}

      {done && !isPreviewOnly && (
        <div
          style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md)',
            backgroundColor: 'rgba(39, 166, 68, 0.08)',
            borderRadius: 'var(--rounded-md)',
            border: '1px solid rgba(39, 166, 68, 0.2)',
            textAlign: 'center',
            color: 'var(--semantic-success)',
            fontWeight: 500,
          }}
        >
          Processed successfully. Check your downloaded file.
        </div>
      )}

      <div className="tool-page-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleRunTool}
          disabled={processing || isPreviewOnly || (!file && !isHtml)}
          id="sandbox-run-button"
        >
          {isPreviewOnly ? 'Preview only' : processing ? 'Processing...' : `Run ${toolInfo.name}`}
          <ToolIcon name="arrowRight" size={18} />
        </button>
      </div>
    </ToolPageLayout>
  );
}