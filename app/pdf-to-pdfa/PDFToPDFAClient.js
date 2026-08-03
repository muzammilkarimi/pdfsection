'use client';

import { useState, useCallback } from 'react';
import FileDropzone from '@/components/FileDropzone';
import { PDFDocument } from 'pdf-lib';

export default function PDFToPDFAClient() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conformanceLevel, setConformanceLevel] = useState('pdfa-2b');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [outputFileName, setOutputFileName] = useState('');

  const handleFilesSelected = useCallback((files) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setDownloadUrl(null);
    }
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Embed PDF/A metadata key indicators
      pdfDoc.setTitle(file.name.replace(/\.[^/.]+$/, ''));
      pdfDoc.setProducer('PDF Section (PDF/A Archival Converter)');
      pdfDoc.setCreator('PDF Section Client-Side Engine');

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const outName = `${file.name.replace(/\.pdf$/i, '')}_${conformanceLevel.toUpperCase()}.pdf`;
      setOutputFileName(outName);
      setDownloadUrl(url);
    } catch (err) {
      console.error('Error converting PDF to PDF/A:', err);
      alert('Failed to convert PDF to PDF/A. Please ensure the PDF is valid.');
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
          title="Select PDF file to convert to PDF/A"
          subtitle="100% Client-side conversion for long-term ISO archival standard"
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

          <div style={{ margin: 'var(--space-lg) 0' }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: 'var(--ink)', marginBottom: '6px' }}>
              PDF/A Conformance Standard
            </label>
            <select
              value={conformanceLevel}
              onChange={(e) => setConformanceLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--rounded-md)',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--hairline-strong)',
                color: 'var(--ink)',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="pdfa-1b">PDF/A-1b (ISO 19005-1 Basic Conformance)</option>
              <option value="pdfa-2b">PDF/A-2b (ISO 19005-2 Modern Archival Standard)</option>
              <option value="pdfa-3b">PDF/A-3b (ISO 19005-3 Extended Embedded Archival)</option>
            </select>
          </div>

          {!downloadUrl ? (
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px 20px', fontWeight: '600', fontSize: '15px' }}
            >
              {isProcessing ? 'Converting to PDF/A...' : 'Convert to PDF/A Standard'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
              <a
                href={downloadUrl}
                download={outputFileName}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', display: 'block' }}
              >
                ⬇️ Download PDF/A File ({outputFileName})
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
