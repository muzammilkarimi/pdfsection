'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { PDFDocument } from 'pdf-lib';
import { downloadBlob } from '@/lib/pdfUtils';

export default function UnlockPDFClient() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setNeedsPassword(false);
    setErrorMsg('');
    setPassword('');

    // Pre-test if password is required
    try {
      const buffer = await f.arrayBuffer();
      // Try loading without password
      await PDFDocument.load(buffer);
      // If success, it doesn't need to be unlocked (or has no open password)
      setNeedsPassword(false);
    } catch (err) {
      if (err.message.includes('password') || err.message.includes('encrypt') || err.message.includes('decrypt')) {
        setNeedsPassword(true);
      } else {
        setErrorMsg('Could not read PDF metadata: ' + err.message);
      }
    }
  }, []);

  const handleUnlock = async () => {
    if (!file) return;
    setProcessing(true);
    setErrorMsg('');

    try {
      const buffer = await file.arrayBuffer();
      let pdfDoc;

      if (needsPassword) {
        if (!password) {
          setErrorMsg('Password is required for this file.');
          setProcessing(false);
          return;
        }
        pdfDoc = await PDFDocument.load(buffer, { password });
      } else {
        pdfDoc = await PDFDocument.load(buffer);
      }

      // Saving it automatically removes the encryption if saved normally in pdf-lib
      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, file.name.replace('.pdf', '-unlocked.pdf'), 'application/pdf');
      setDone(true);
    } catch (err) {
      setErrorMsg('Incorrect password or decryption error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="Unlock PDF"
      description="Remove passwords and restriction security from your PDFs."
      icon="unlock"
      iconColor="var(--tool-security)"
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your password protected PDF here"
          id="unlock-dropzone"
        />
      ) : (
        <div className="tool-workspace">
          {/* Left panel: File details and thumbnail previews or locked graphic */}
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <button
                className="file-item-remove"
                onClick={() => {
                  setFile(null);
                  setDone(false);
                  setNeedsPassword(false);
                  setPassword('');
                  setErrorMsg('');
                }}
              >
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            {needsPassword ? (
              <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div style={{ fontSize: 48, color: 'var(--ink-subtle)' }}>🔒</div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 500 }}>Password Protected Document</p>
                  <p className="body-sm ink-subtle" style={{ marginTop: 4 }}>This file needs a password before we can load previews or modify it.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="body-sm ink-subtle" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
                  Document Pages:
                </p>
                <PageThumbnails file={file} selectable={false} maxWidth={120} />
              </>
            )}
          </div>

          {/* Right panel: Unlock options sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Unlock PDF Settings</p>

              {needsPassword ? (
                <div>
                  <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                    PDF Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter password to unlock"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              ) : (
                <p className="body-sm ink-subtle">
                  No open password detected. You can proceed to strip other restrictions.
                </p>
              )}

              {errorMsg && (
                <div
                  style={{
                    padding: 'var(--space-sm)',
                    backgroundColor: 'rgba(229, 72, 77, 0.08)',
                    borderRadius: 'var(--rounded-md)',
                    border: '1px solid rgba(229, 72, 77, 0.2)',
                    color: 'var(--semantic-error)',
                    fontSize: '12px',
                  }}
                >
                  {errorMsg}
                </div>
              )}

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
                  ✓ PDF unlocked successfully!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleUnlock}
                disabled={processing || (needsPassword && !password)}
                style={{ width: '100%' }}
                id="unlock-pdf-button"
              >
                {processing ? 'Unlocking...' : 'Unlock PDF'}
                <ToolIcon name="unlock" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
