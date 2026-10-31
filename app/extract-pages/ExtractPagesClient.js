'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, extractPages } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';

export default function ExtractPagesClient() {
  const deliver = useResultHandoff('extract-pages');
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
      prev.includes(pageIndex)
        ? prev.filter((i) => i !== pageIndex)
        : [...prev, pageIndex].sort((a, b) => a - b)
    );
  };

  const handleExtract = async () => {
    if (!file || selectedPages.length === 0) return;
    setProcessing(true);
    try {
      const srcDoc = await loadPdf(file);
      const result = await extractPages(srcDoc, selectedPages);
      await deliver(result, file.name.replace('.pdf', '-extracted.pdf'));
      setDone(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="Extract Pages"
      description="Select and extract specific pages into a new PDF"
      icon="extract"
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
          id="extract-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title="Extract Pages"
          description="Select pages on the left to export into a new PDF document."
          icon="extract"
          iconColor="var(--tool-organize)"
          file={file}
          onReset={resetFile}
          ariaLabel="Extract pages workspace"
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
                onClick={handleExtract}
                disabled={selectedPages.length === 0 || processing}
                id="extract-button"
              >
                {processing ? 'Extracting...' : 'Extract Pages'}
                <ToolIcon name="download" size={16} />
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
            <span>Pages selected to extract</span>
            <strong>{selectedPages.length}</strong>
          </div>

          <div className="page-help-note">
            <ToolIcon name="check" size={16} />
            <span>Click page thumbnails on the left to select which pages will be extracted into your new PDF.</span>
          </div>

          {done && <div className="merge-success">✓ Extraction successful. Your PDF has been downloaded.</div>}
        </PageToolWorkspace>
      )}

      {done && (
        <ToastNotification
          message="✓ Extracted pages exported and downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
