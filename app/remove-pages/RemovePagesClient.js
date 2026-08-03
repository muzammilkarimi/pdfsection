'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, removePages, downloadPdf } from '@/lib/pdfUtils';

export default function RemovePagesClient() {
  const [file, setFile] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setSelectedPages([]);
    setDone(false);
  }, []);

  const resetFile = () => {
    setFile(null);
    setSelectedPages([]);
    setDone(false);
  };

  const handlePageToggle = (pageIndex) => {
    setDone(false);
    setSelectedPages((prev) =>
      prev.includes(pageIndex) ? prev.filter((i) => i !== pageIndex) : [...prev, pageIndex]
    );
  };

  const handleRemove = async () => {
    if (!file || selectedPages.length === 0) return;
    setProcessing(true);
    try {
      const srcDoc = await loadPdf(file);
      const result = await removePages(srcDoc, selectedPages);
      await downloadPdf(result, file.name.replace('.pdf', '-removed.pdf'));
      setDone(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
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
            <>
              <button
                type="button"
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleRemove}
                disabled={selectedPages.length === 0 || processing}
                id="remove-button"
              >
                {processing ? 'Removing...' : 'Remove Pages'}
                <ToolIcon name="trash" size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetFile}
                disabled={processing}
              >
                Start over
              </button>
            </>
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

          {done && <div className="merge-success">✓ Removal successful. Your PDF has been downloaded.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
