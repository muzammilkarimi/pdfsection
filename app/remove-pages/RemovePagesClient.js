'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, removePages, downloadPdf } from '@/lib/pdfUtils';

export default function RemovePagesClient() {
  const [file, setFile] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [outputPdfDoc, setOutputPdfDoc] = useState(null);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setSelectedPages([]);
    setDone(false);
    setOutputPdfDoc(null);
  }, []);

  const handlePageToggle = (pageNumber) => {
    setSelectedPages((prev) =>
      prev.includes(pageNumber)
        ? prev.filter((p) => p !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
    setDone(false);
    setOutputPdfDoc(null);
  };

  const resetFile = () => {
    setFile(null);
    setSelectedPages([]);
    setDone(false);
    setOutputPdfDoc(null);
  };

  const handleRemove = async () => {
    if (!file || selectedPages.length === 0) return;
    setProcessing(true);

    try {
      const srcDoc = await loadPdf(file);
      const res = await removePages(srcDoc, selectedPages);
      setOutputPdfDoc(res);
      await downloadPdf(res, file.name.replace('.pdf', '-removed.pdf'));
      setDone(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRedownload = async () => {
    if (outputPdfDoc && file) {
      await downloadPdf(outputPdfDoc, file.name.replace('.pdf', '-removed.pdf'));
    }
  };

  return (
    <ToolPageLayout
      title="Remove Pages"
      description="Select and delete unwanted pages from your PDF"
      icon="trash"
      iconColor="var(--tool-organize)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Select PDF file"
          id="remove-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title="Remove Pages"
          description="Select pages on the left to remove, then export your updated PDF."
          icon="trash"
          iconColor="var(--tool-organize)"
          file={file}
          onReset={resetFile}
          ariaLabel="Remove pages workspace"
          preview={(
            <PageThumbnails
              file={file}
              selectedPages={selectedPages}
              onPageToggle={handlePageToggle}
              maxWidth={150}
              className="page-preview-grid"
            />
          )}
          footer={(
            done ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  className="btn btn-primary btn-lg btn-attention btn-success-state"
                  onClick={handleRedownload}
                  style={{ width: '100%' }}
                  id="redownload-remove-button"
                >
                  <ToolIcon name="download" size={16} style={{ marginRight: 6 }} />
                  Download Modified PDF Again
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetFile} disabled={processing} style={{ width: '100%' }}>
                  Process Another PDF
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-attention"
                  onClick={handleRemove}
                  disabled={selectedPages.length === 0 || processing}
                  id="remove-button"
                  style={{ width: '100%' }}
                >
                  {processing ? 'Removing...' : 'Remove Pages'}
                  <ToolIcon name="trash" size={16} style={{ marginLeft: 6 }} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetFile}
                  disabled={processing}
                  style={{ width: '100%' }}
                >
                  Start over
                </button>
              </div>
            )
          )}
        >
          <div className="page-control-stat">
            <span>Pages selected for removal</span>
            <strong>{selectedPages.length}</strong>
          </div>

          <div className="page-help-note">
            <ToolIcon name="check" size={16} />
            <span>Click any page thumbnail to mark it for removal. Unselected pages will be kept.</span>
          </div>
        </PageToolWorkspace>
      )}

      {done && (
        <ToastNotification
          message="✓ Removal successful. Your PDF has been downloaded."
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
