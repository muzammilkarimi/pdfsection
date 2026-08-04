'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { downloadBlob } from '@/lib/pdfUtils';

export default function BatesNumberingPDFClient() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prefix, setPrefix] = useState('CONFIDENTIAL-');
  const [startNumber, setStartNumber] = useState(1);
  const [digits, setDigits] = useState(6);
  const [position, setPosition] = useState('bottom-right');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [outputFileName, setOutputFileName] = useState('');

  const handleFilesSelected = useCallback((files) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setDownloadUrl(null);
    }
  }, []);

  const handleApplyBates = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      let currentNum = parseInt(startNumber, 10) || 1;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        const numStr = String(currentNum).padStart(digits, '0');
        const batesText = `${prefix}${numStr}`;
        const textSize = 10;
        const textWidth = font.widthOfTextAtSize(batesText, textSize);

        let x = width - textWidth - 20;
        let y = 20;

        if (position === 'bottom-left') {
          x = 20;
          y = 20;
        } else if (position === 'top-right') {
          x = width - textWidth - 20;
          y = height - 30;
        } else if (position === 'top-left') {
          x = 20;
          y = height - 30;
        }

        page.drawText(batesText, {
          x,
          y,
          size: textSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });

        currentNum++;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const outName = `${file.name.replace(/\.pdf$/i, '')}_Bates.pdf`;
      setOutputFileName(outName);
      setDownloadUrl(url);
    } catch (err) {
      console.error('Error applying Bates numbering:', err);
      alert('Failed to stamp Bates numbers onto PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="Bates Numbering PDF"
      description="Stamp custom sequential Bates numbers onto PDF pages for legal discovery, law firms, and court submissions."
      icon="hash"
      iconColor="var(--tool-edit)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept=".pdf"
          multiple={false}
          title="Select PDF file for Bates Numbering"
          subtitle="Stamp sequential legal discovery numbers (e.g. CONFIDENTIAL-000001) onto PDF pages"
        />
      ) : (
        <PageToolWorkspace
          title="Bates Numbering PDF"
          description="Apply sequential discovery identifiers to pages."
          icon="hash"
          iconColor="var(--tool-edit)"
          file={file}
          onReset={() => {
            setFile(null);
            setDownloadUrl(null);
          }}
          preview={
            <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Bates Stamp Preview</p>
              
              {!isProcessing && !downloadUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: 'var(--ink-muted)' }}>
                  <p>Stamping pages with sequential identifiers:</p>
                  <div style={{ padding: '12px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)', fontFamily: 'monospace', fontSize: '14px', color: 'var(--primary)', fontWeight: '600' }}>
                    {prefix}{String(startNumber).padStart(digits, '0')}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ink-subtle)', marginTop: '4px' }}>
                    Position: {position.replace('-', ' ')}
                  </p>
                </div>
              )}

              {isProcessing && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <p className="caption ink-muted">Applying Bates stamping sequence to PDF pages...</p>
                </div>
              )}

              {downloadUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', margin: 'auto' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--semantic-success)' }}>
                    ✓ Bates Numbering Stamped Successfully
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
                Download Stamped PDF
                <ToolIcon name="download" size={16} />
              </a>
            ) : (
              <button
                onClick={handleApplyBates}
                disabled={isProcessing}
                className="btn btn-primary btn-lg btn-attention"
                style={{ width: '100%' }}
              >
                {isProcessing ? 'Stamping Bates Numbers...' : 'Apply Bates Numbering'}
                <ToolIcon name="hash" size={16} />
              </button>
            )
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700' }}>BATES STAMP OPTIONS</p>
            
            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Prefix Label:</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. CONFIDENTIAL-"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px', outline: 'none' }}
              />
            </div>

            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Starting Number:</label>
              <input
                type="number"
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px', outline: 'none' }}
              />
            </div>

            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Number of Digits:</label>
              <input
                type="number"
                value={digits}
                onChange={(e) => setDigits(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px', outline: 'none' }}
              />
            </div>

            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Page Location:</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px', outline: 'none' }}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
