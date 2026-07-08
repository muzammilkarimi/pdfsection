'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, addPageNumbers, downloadPdf } from '@/lib/pdfUtils';

export default function AddPageNumbersClient() {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState('number');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
  }, []);

  const resetFile = () => {
    setFile(null);
    setDone(false);
  };

  const handleAdd = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const srcDoc = await loadPdf(file);
      const result = await addPageNumbers(srcDoc, { position, startNumber, fontSize, format });
      await downloadPdf(result, file.name.replace('.pdf', '-numbered.pdf'));
      setDone(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const positions = [
    ['top-left', 'top-center', 'top-right'],
    ['bottom-left', 'bottom-center', 'bottom-right'],
  ];

  const formats = [
    { id: 'number', label: '1, 2, 3...' },
    { id: 'pageOfTotal', label: '1 of N' },
    { id: 'roman', label: 'I, II, III...' },
  ];

  return (
    <ToolPageLayout
      title="Add Page Numbers"
      description="Insert page numbers at any position"
      icon="hash"
      iconColor="var(--tool-edit)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Select PDF file" id="pagenumbers-dropzone" />
      ) : (
        <PageToolWorkspace
          title="Add Page Numbers"
          description="Choose numbering style and position, then stamp the PDF."
          icon="hash"
          iconColor="var(--tool-edit)"
          file={file}
          onReset={resetFile}
          ariaLabel="Page number settings"
          preview={<PageThumbnails file={file} selectable={false} maxWidth={150} className="page-preview-grid" />}
          footer={(
            <button className="btn btn-primary btn-lg btn-attention" onClick={handleAdd} disabled={processing} id="pagenumbers-button">
              {processing ? 'Adding...' : 'Add Page Numbers'}
              <ToolIcon name="hash" size={16} />
            </button>
          )}
        >
          <div className="page-field-group">
            <label className="body-sm ink-muted">Stamp position</label>
            <div className="page-position-grid">
              {positions.flat().map((pos) => (
                <button key={pos} className={`btn ${position === pos ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPosition(pos)}>
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">Number style</label>
            <div className="page-option-list">
              {formats.map((item) => (
                <button key={item.id} className={`btn ${format === item.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFormat(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="page-two-column-fields">
            <div className="page-field-group">
              <label className="body-sm ink-muted">Start at</label>
              <input type="number" className="input" value={startNumber} onChange={(event) => setStartNumber(parseInt(event.target.value) || 1)} min="1" />
            </div>
            <div className="page-field-group">
              <label className="body-sm ink-muted">Font size</label>
              <input type="number" className="input" value={fontSize} onChange={(event) => setFontSize(parseInt(event.target.value) || 12)} min="6" max="48" />
            </div>
          </div>

          {done && <div className="merge-success">Page numbers added. Your PDF has been downloaded.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}


