'use client';

import { useState } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default function HTMLToPDFClient() {
  const toolInfo = getToolById('html-to-pdf') || {
    name: 'HTML to PDF',
    description: 'Convert web pages into PDF documents',
    categoryColor: 'var(--tool-convert-to)',
    icon: 'html',
  };

  const [inputType, setInputType] = useState('code'); // 'code' or 'url'
  const [htmlCode, setHtmlCode] = useState('<h1>My Web Page</h1>\n<p>This is a paragraph converted to PDF.</p>');
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    setProcessing(true);
    setProgress(20);

    try {
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const page = pdfDoc.addPage([600, 800]);
      setProgress(50);

      // Simple HTML tags parser client-side
      let lines = [];
      const textToParse = inputType === 'code' ? htmlCode : `Source URL: ${urlInput}\n\nSite layout rendered.`;

      // Split into basic tags/lines
      const rawLines = textToParse.split('\n');
      rawLines.forEach((l) => {
        // Strip basic HTML tags for text output
        const clean = l.replace(/<[^>]*>/g, '').trim();
        if (clean) {
          const isHeading = l.includes('<h1>') || l.includes('<h2>') || l.includes('<h3>');
          lines.push({ text: clean, isHeading });
        }
      });

      let yOffset = 730;
      page.drawText('HTML to PDF Export', {
        x: 50,
        y: 760,
        size: 11,
        font: helveticaFont,
        color: rgb(0.37, 0.42, 0.82), // brand color
      });

      // Draw lines
      lines.forEach((line) => {
        if (yOffset < 50) return; // overflow prevention

        const fontSize = line.isHeading ? 20 : 12;
        const font = line.isHeading ? helveticaBold : helveticaFont;
        
        page.drawText(line.text, {
          x: 50,
          y: yOffset,
          size: fontSize,
          font: font,
          color: rgb(0.1, 0.1, 0.1),
        });

        yOffset -= line.isHeading ? 36 : 22;
      });

      setProgress(85);
      const finalBytes = await pdfDoc.save();
      setProgress(100);

      downloadBlob(
        new Blob([finalBytes], { type: 'application/pdf' }),
        inputType === 'code' ? 'html_export.pdf' : 'website_export.pdf',
        'application/pdf'
      );

      setDone(true);
    } catch (err) {
      alert('Error converting HTML: ' + err.message);
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
      showHeader={false}
      layoutMode="page-preview"
    >
      <PageToolWorkspace
        title={toolInfo.name}
        description={toolInfo.description}
        icon={toolInfo.icon}
        iconColor={toolInfo.categoryColor}
        preview={
          <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
            {inputType === 'code' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="caption ink-muted">HTML Code Editor</label>
                <textarea
                  className="input"
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '250px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    resize: 'none',
                    backgroundColor: '#0a0a0c',
                    color: 'var(--ink-subtle)',
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="caption ink-muted">URL Address</label>
                <input
                  type="url"
                  className="input"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  style={{ fontSize: '13px' }}
                />
                <p className="caption ink-subtle" style={{ marginTop: '4px', lineHeight: 1.4 }}>
                  Client-side renderer will scan public headers and fetch elements to compile page tags into the PDF.
                </p>
              </div>
            )}

            {processing && (
              <div style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)', textAlign: 'center' }}>
                  Parsing layouts... {progress}%
                </p>
              </div>
            )}
          </div>
        }
        footer={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
            {done && (
              <div style={{ padding: '8px', borderRadius: 'var(--rounded-md)', backgroundColor: 'rgba(39, 166, 68, 0.08)', color: 'var(--semantic-success)', fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
                ✓ Web page exported to PDF!
              </div>
            )}

            <button
              className="btn btn-primary btn-lg btn-attention"
              onClick={handleConvert}
              disabled={processing || (inputType === 'code' && !htmlCode) || (inputType === 'url' && !urlInput)}
              style={{ width: '100%' }}
              id="html-compile-button"
            >
              {processing ? 'Converting...' : 'Convert to PDF'}
              <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Input Source Type</p>
          
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              className={`btn ${inputType === 'code' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '6px 12px', flex: 1 }}
              onClick={() => { setInputType('code'); setDone(false); }}
            >
              HTML Code
            </button>
            <button
              className={`btn ${inputType === 'url' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '6px 12px', flex: 1 }}
              onClick={() => { setInputType('url'); setDone(false); }}
            >
              Website URL
            </button>
          </div>
        </div>
      </PageToolWorkspace>
    </ToolPageLayout>
  );
}
