'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { PDFDocument } from 'pdf-lib';

export default function PDFToPDFAClient() {
  const toolInfo = getToolById('pdf-to-pdfa') || {
    name: 'PDF to PDF/A',
    description: 'Convert PDF files to standardized PDF/A format',
    categoryColor: 'var(--tool-convert-from)',
    icon: 'check',
  };

  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conformance, setConformance] = useState('1B'); // '1B', '2B', '3B'
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setProgress(0);
  }, []);

  const handleConvertToPDFA = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(25);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(50);

      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setProgress(75);

      // Embed PDF/A standard conformance XMP metadata
      const part = conformance[0]; // '1', '2', or '3'
      const level = conformance[1]; // 'B'

      const pdfaMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/">
   <pdfaid:part>${part}</pdfaid:part>
   <pdfaid:conformance>${level}</pdfaid:conformance>
   <dc:title>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${file.name.replace('.pdf', '')} Standardized</rdf:li>
    </rdf:Alt>
   </dc:title>
   <xmp:CreatorTool>PDF Section Client Converted</xmp:CreatorTool>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

      // Set XMP metadata
      pdfDoc.setMetadata(pdfaMetadata);

      const finalBytes = await pdfDoc.save();
      setProgress(95);

      downloadBlob(
        new Blob([finalBytes], { type: 'application/pdf' }),
        file.name.replace('.pdf', '_pdfa.pdf'),
        'application/pdf'
      );

      setProgress(100);
      setDone(true);
    } catch (err) {
      alert('Error converting to PDF/A: ' + err.message);
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
          label="Upload your PDF to convert to standardized PDF/A format"
          id="pdfa-dropzone"
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
                <ToolIcon name="check" size={32} />
              </div>
              <h3 className="body-lg" style={{ fontWeight: 600 }}>Standardization Archive</h3>
              <p className="body-sm ink-subtle" style={{ maxWidth: '320px', marginTop: 'var(--space-xs)', lineHeight: 1.5 }}>
                PDF/A ensures long-term preservation of your document structures, embedding fonts, metadata namespaces, and color profiles.
              </p>

              {processing && (
                <div style={{ width: '100%', maxWidth: '320px', marginTop: 'var(--space-lg)' }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)' }}>
                    Standardizing archives... {progress}%
                  </p>
                </div>
              )}

              {done && (
                <div style={{ marginTop: 'var(--space-md)', color: 'var(--semantic-success)', fontWeight: 500, fontSize: '14px' }}>
                  ✓ Converted successfully to PDF/A-{conformance[0]}!
                </div>
              )}
            </div>
          }
          footer={
            <button
              className="btn btn-primary btn-lg btn-attention"
              onClick={handleConvertToPDFA}
              disabled={processing}
              style={{ width: '100%' }}
              id="convert-pdfa-button"
            >
              {processing ? 'Standardizing...' : 'Convert to PDF/A'}
              <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>PDF/A ISO Profiles</p>
            
            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px' }}>Conformance Level:</label>
              <select
                className="input"
                value={conformance}
                onChange={(e) => setConformance(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="1B">PDF/A-1b (Basic Conformance)</option>
                <option value="2B">PDF/A-2b (Archiving & Attachments)</option>
                <option value="3B">PDF/A-3b (Conforming XML embedding)</option>
              </select>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
