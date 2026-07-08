'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
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

    try {
      const buffer = await f.arrayBuffer();
      await PDFDocument.load(buffer);
      setNeedsPassword(false);
    } catch (err) {
      if (err.message.includes('password') || err.message.includes('encrypt') || err.message.includes('decrypt')) {
        setNeedsPassword(true);
      } else {
        setErrorMsg('Could not read PDF metadata: ' + err.message);
      }
    }
  }, []);

  const resetFile = () => {
    setFile(null);
    setDone(false);
    setNeedsPassword(false);
    setPassword('');
    setErrorMsg('');
  };

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

      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, file.name.replace('.pdf', '-unlocked.pdf'), 'application/pdf');
      setDone(true);
    } catch (err) {
      setErrorMsg('Incorrect password or decryption error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const preview = needsPassword ? (
    <div className="page-locked-preview">
      <ToolIcon name="lock" size={44} />
      <strong>Password protected document</strong>
      <span>Enter the password in the right panel before previews can be read.</span>
    </div>
  ) : (
    <PageThumbnails file={file} selectable={false} maxWidth={150} className="page-preview-grid" />
  );

  return (
    <ToolPageLayout
      title="Unlock PDF"
      description="Remove passwords and restriction security from your PDFs."
      icon="unlock"
      iconColor="var(--tool-security)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Select PDF file" id="unlock-dropzone" />
      ) : (
        <PageToolWorkspace
          title="Unlock PDF"
          description="Enter the password if required, then create an unlocked copy."
          icon="unlock"
          iconColor="var(--tool-security)"
          file={file}
          onReset={resetFile}
          ariaLabel="Unlock PDF settings"
          preview={preview}
          footer={(
            <button className="btn btn-primary btn-lg btn-attention" onClick={handleUnlock} disabled={processing || (needsPassword && !password)} id="unlock-pdf-button">
              {processing ? 'Unlocking...' : 'Unlock PDF'}
              <ToolIcon name="unlock" size={16} />
            </button>
          )}
        >
          {needsPassword ? (
            <div className="page-field-group">
              <label className="body-sm ink-muted">PDF password</label>
              <input type="password" className="input" placeholder="Enter password to unlock" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
          ) : (
            <div className="page-help-note">
              <ToolIcon name="check" size={16} />
              <span>No open password detected. You can proceed to strip other restrictions.</span>
            </div>
          )}

          {errorMsg && <div className="merge-warning">{errorMsg}</div>}
          {done && <div className="merge-success">PDF unlocked successfully. Your PDF has been downloaded.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}


