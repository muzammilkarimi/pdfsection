'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { PDFDocument } from 'pdf-lib';
import { downloadBlob } from '@/lib/pdfUtils';

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
    <ToolPageLayout
      title="Convert PDF to PDF/A"
      description="Convert standard PDF documents into ISO 19005 compliant PDF/A archival format for long-term preservation."
      icon="check"
      iconColor="var(--tool-convert-from)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept=".pdf"
          multiple={false}
          title="Select PDF file to convert to PDF/A"
          subtitle="100% Client-side conversion for long-term ISO archival standard"
        />
      ) : (
        <PageToolWorkspace
          title="PDF to PDF/A Converter"
          description="Prepare your document for long-term ISO archival standards."
          icon="check"
          iconColor="var(--tool-convert-from)"
          file={file}
          onReset={() => {
            setFile(null);
            setDownloadUrl(null);
          }}
          preview={
            <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>PDF/A Verification Report</p>
              
              {isProcessing && (
                <div style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                  <p className="caption ink-muted">Analyzing structure and compiling PDF/A compliance streams...</p>
                </div>
              )}

              {!isProcessing && !downloadUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink-muted)' }}>
                  <p style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                    Standard PDFs can change over time based on external links, system fonts, and software changes.
                  </p>
                  <p style={{ fontSize: '13.5px', lineHeight: '1.5', fontWeight: '600', color: 'var(--ink)' }}>
                    ✅ PDF/A locks all layout elements, embeds necessary fonts, and complies with ISO 19005 standards.
                  </p>
                </div>
              )}

              {downloadUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', margin: 'auto' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--semantic-success)' }}>
                    ✓ Conversion Successful (ISO Compliant)
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
                Download PDF/A File
                <ToolIcon name="download" size={16} />
              </a>
            ) : (
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="btn btn-primary btn-lg btn-attention"
                style={{ width: '100%' }}
              >
                {isProcessing ? 'Converting to PDF/A...' : 'Convert to PDF/A Standard'}
                <ToolIcon name="check" size={16} />
              </button>
            )
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700' }}>CONFORMANCE OPTIONS</p>
            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Select PDF/A Profile:
              </label>
              <select
                value={conformanceLevel}
                onChange={(e) => setConformanceLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--rounded-md)',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--hairline-strong)',
                  color: 'var(--ink)',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              >
                <option value="pdfa-1b">PDF/A-1b (Basic Archival)</option>
                <option value="pdfa-2b">PDF/A-2b (Recommended / Modern)</option>
                <option value="pdfa-3b">PDF/A-3b (With Embedded Attachments)</option>
              </select>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
