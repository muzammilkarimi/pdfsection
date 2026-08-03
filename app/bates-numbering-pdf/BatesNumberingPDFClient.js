'use client';

import { useState, useCallback } from 'react';
import FileDropzone from '@/components/FileDropzone';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
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
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: 'var(--space-md) 0' }}>
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept=".pdf"
          multiple={false}
          title="Select PDF file for Bates Numbering"
          subtitle="Stamp sequential legal discovery numbers (e.g. CONFIDENTIAL-000001) onto PDF pages"
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', margin: 'var(--space-lg) 0' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: 'var(--ink)', marginBottom: '4px' }}>Bates Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. EXHIBIT-A-"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: 'var(--ink)', marginBottom: '4px' }}>Start Number</label>
              <input
                type="number"
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: 'var(--ink)', marginBottom: '4px' }}>Number Digits</label>
              <input
                type="number"
                value={digits}
                onChange={(e) => setDigits(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: 'var(--ink)', marginBottom: '4px' }}>Page Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px' }}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
          </div>

          {!downloadUrl ? (
            <button
              onClick={handleApplyBates}
              disabled={isProcessing}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px 20px', fontWeight: '600', fontSize: '15px' }}
            >
              {isProcessing ? 'Stamping Bates Numbers...' : 'Apply Bates Numbering'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
              <a
                href={downloadUrl}
                download={outputFileName}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', display: 'block' }}
              >
                ⬇️ Download Stamped PDF ({outputFileName})
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
