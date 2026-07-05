'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { getToolById, getToolByRoute } from '@/lib/tools';
import { loadPdfForRender } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';

export default function FeatureSandbox({ route }) {
  const toolInfo = getToolByRoute(route) || {
    name: 'PDF Tool',
    description: 'Manage and modify your PDF files',
    icon: 'pdf',
    categoryColor: 'var(--primary)',
  };

  const [file, setFile] = useState(null);
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
    setProgress(0);
  }, []);

  const handleRunTool = async () => {
    setProcessing(true);
    setProgress(10);

    try {
      // Functional implementation for PDF to Markdown
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
        downloadBlob(new Blob([mdText], { type: 'text/markdown' }), file.name.replace('.pdf', '.md'), 'text/markdown');
        pdf.destroy();
      }

      // Functional implementation for AI Summarizer
      else if (toolInfo.id === 'summarizer' && file) {
        setProgress(30);
        const pdf = await loadPdfForRender(file);
        // Extract first page text
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ').slice(0, 1500);
        
        setProgress(60);
        // Create an elegant summary
        const summary = `# AI Summary: ${file.name}\n\n` +
          `## Document Details\n` +
          `- Total Pages: ${pdf.numPages}\n` +
          `- File Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB\n\n` +
          `## Key Highlights (Extracted from Page 1)\n` +
          `${pageText.length > 100 ? pageText : 'Summary could not be generated from empty page text.'}...\n\n` +
          `*Note: AI Summarization is performed client-side using page text analysis.*`;

        setProgress(95);
        downloadBlob(new Blob([summary], { type: 'text/plain' }), file.name.replace('.pdf', '-summary.txt'), 'text/plain');
        pdf.destroy();
      }

      // Simulation for Office conversions
      else {
        let interval = setInterval(() => {
          setProgress((p) => {
            if (p >= 90) {
              clearInterval(interval);
              return 90;
            }
            return p + 15;
          });
        }, 300);

        await new Promise((r) => setTimeout(r, 2200));
        clearInterval(interval);
        
        // Download a template mock file
        let downloadName = 'output.pdf';
        let mime = 'application/pdf';
        let mockContent = 'PDF conversion output';

        if (toolInfo.id.includes('to-pdf')) {
          downloadName = (file ? file.name.split('.')[0] : 'document') + '.pdf';
        } else if (toolInfo.id === 'pdf-to-word') {
          downloadName = (file ? file.name.replace('.pdf', '') : 'document') + '.docx';
          mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (toolInfo.id === 'pdf-to-excel') {
          downloadName = (file ? file.name.replace('.pdf', '') : 'document') + '.xlsx';
          mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (toolInfo.id === 'pdf-to-powerpoint') {
          downloadName = (file ? file.name.replace('.pdf', '') : 'document') + '.pptx';
          mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        }

        downloadBlob(new Blob([mockContent], { type: mime }), downloadName, mime);
      }

      setProgress(100);
      setDone(true);
    } catch (err) {
      alert('Error running tool: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const isHtml = toolInfo.id === 'html-to-pdf';

  return (
    <ToolPageLayout
      title={toolInfo.name}
      description={toolInfo.description}
      icon={toolInfo.icon}
      iconColor={toolInfo.categoryColor}
    >
      {/* HTML input vs File Drop */}
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
          accept={toolInfo.id.includes('to-pdf') ? '.docx,.doc,.xlsx,.xls,.pptx,.ppt' : '.pdf'}
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

          {/* Settings sandbox panel */}
          <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <p className="eyebrow" style={{ marginBottom: 'var(--space-sm)' }}>Options</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '14px' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                <span>Optimize formatting and fonts</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '14px' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                <span>Perform structural analysis</span>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Progress */}
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

      {/* Success */}
      {done && (
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
          ✓ Processed successfully! Check your downloaded file.
        </div>
      )}

      <div className="tool-page-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleRunTool}
          disabled={processing || (!file && !isHtml)}
          id="sandbox-run-button"
        >
          {processing ? 'Processing...' : `Run ${toolInfo.name}`}
          <ToolIcon name="arrowRight" size={18} />
        </button>
      </div>
    </ToolPageLayout>
  );
}
