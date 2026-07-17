'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdfForRender } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';

export default function PDFToMarkdownClient() {
  const toolInfo = getToolById('pdf-to-markdown') || {
    name: 'PDF to Markdown',
    description: 'Convert PDFs to Markdown for docs and LLMs',
    categoryColor: 'var(--tool-intelligence)',
    icon: 'markdown',
  };

  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // User Configs
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [rawLayout, setRawLayout] = useState(true);

  const handleFilesSelected = useCallback((files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setProgress(0);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(15);

    try {
      const pdf = await loadPdfForRender(file);
      let markdown = '';

      if (includeHeaders) {
        markdown += `# Document: ${file.name.replace('.pdf', '')}\n`;
        markdown += `*Generated automatically using PDF Section*\n\n`;
      }

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        if (rawLayout) {
          // Attempt simple line-by-line reading
          let lastY = -1;
          for (const item of textContent.items) {
            if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 8) {
              pageText += '\n';
            }
            pageText += item.str + ' ';
            lastY = item.transform[5];
          }
        } else {
          pageText = textContent.items.map((item) => item.str).join(' ');
        }

        markdown += `## Page ${i}\n\n${pageText}\n\n`;
        setProgress(Math.round(15 + (i / pdf.numPages) * 75));
      }

      setProgress(95);
      downloadBlob(
        new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
        file.name.replace('.pdf', '.md'),
        'text/markdown'
      );
      
      try {
        pdf.destroy();
      } catch (e) {
        console.error(e);
      }
      
      setProgress(100);
      setDone(true);
    } catch (err) {
      alert('Error extracting text: ' + err.message);
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
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Upload your PDF to convert to Markdown"
          id="markdown-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title={toolInfo.name}
          description={toolInfo.description}
          icon={toolInfo.icon}
          iconColor={toolInfo.categoryColor}
          file={file}
          onReset={() => {
            setFile(null);
            setDone(false);
            setProgress(0);
          }}
          preview={
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-xl) var(--space-md)',
                minHeight: '260px',
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.01)',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--rounded-lg)',
                  backgroundColor: 'rgba(94, 106, 210, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-md)',
                  color: 'var(--primary)',
                }}
              >
                <ToolIcon name="markdown" size={32} />
              </div>
              <h3 className="body-lg" style={{ fontWeight: 600 }}>Ready for Extraction</h3>
              <p className="body-sm ink-subtle" style={{ maxWidth: '320px', marginTop: 'var(--space-xs)', lineHeight: 1.5 }}>
                Local OCR text layers will be scanned and converted directly to standard GitHub Flavored Markdown.
              </p>

              {processing && (
                <div style={{ width: '100%', maxWidth: '320px', marginTop: 'var(--space-lg)' }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)' }}>
                    Parsing pages... {progress}%
                  </p>
                </div>
              )}

              {done && (
                <div style={{ marginTop: 'var(--space-md)', color: 'var(--semantic-success)', fontWeight: 500, fontSize: '14px' }}>
                  ✓ Markdown file generated and downloaded!
                </div>
              )}
            </div>
          }
          footer={
            <button
              className="btn btn-primary btn-lg btn-attention"
              onClick={handleConvert}
              disabled={processing}
              style={{ width: '100%' }}
              id="convert-markdown-button"
            >
              {processing ? 'Converting...' : 'Convert to Markdown'}
              <ToolIcon name="arrowRight" size={16} style={{ marginLeft: 6 }} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Markdown Options</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Include document title headers</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rawLayout}
                  onChange={(e) => setRawLayout(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Preserve horizontal line layout</span>
              </label>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
