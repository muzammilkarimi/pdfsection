'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
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
    <ToolPageLayout title="Add Page Numbers" description="Insert page numbers at any position" icon="hash" iconColor="var(--tool-edit)">
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Drop your PDF file here" id="pagenumbers-dropzone" />
      ) : (
        <div className="tool-workspace">
          {/* Left panel: File details and live pages preview */}
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <button className="file-item-remove" onClick={() => { setFile(null); setDone(false); }}>
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <p className="body-sm ink-subtle" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
              Document Pages:
            </p>
            <PageThumbnails file={file} selectable={false} maxWidth={120} />
          </div>

          {/* Right panel: Numbers positioning and format configuration sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Page Number Settings</p>
              
              {/* Position selector */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 6 }}>Stamp Position</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxs)' }}>
                  {positions.map((row, ri) => (
                    <div key={ri} style={{ display: 'flex', gap: 'var(--space-xxs)' }}>
                      {row.map((pos) => (
                        <button
                          key={pos}
                          className={`btn ${position === pos ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setPosition(pos)}
                          style={{ flex: 1, fontSize: 11, padding: '6px 2px', minWidth: 0, textTransform: 'capitalize' }}
                        >
                          {pos.split('-')[1]}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Format options */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 6 }}>Number Style</label>
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      className={`btn ${format === f.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFormat(f.id)}
                      style={{ flex: 1, fontSize: 11, padding: '6px 4px' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced numbers options */}
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <div style={{ flex: 1 }}>
                  <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Start At</label>
                  <input type="number" className="input" value={startNumber} onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)} min="1" style={{ width: '100%', padding: '6px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Font Size</label>
                  <input type="number" className="input" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 12)} min="6" max="48" style={{ width: '100%', padding: '6px' }} />
                </div>
              </div>

              {done && (
                <div
                  style={{
                    padding: 'var(--space-sm)',
                    backgroundColor: 'rgba(39, 166, 68, 0.08)',
                    borderRadius: 'var(--rounded-md)',
                    border: '1px solid rgba(39, 166, 68, 0.2)',
                    textAlign: 'center',
                    color: 'var(--semantic-success)',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  ✓ Stamped successfully!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleAdd}
                disabled={processing}
                style={{ width: '100%' }}
                id="pagenumbers-button"
              >
                {processing ? 'Adding...' : 'Add Page Numbers'}
                <ToolIcon name="hash" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
