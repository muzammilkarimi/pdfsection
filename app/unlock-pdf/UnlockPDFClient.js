'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { PDFDocument } from 'pdf-lib';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { loadPdfForRender } from '@/lib/renderUtils';

export default function UnlockPDFClient() {
  const deliver = useResultHandoff('unlock-pdf');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
    setProgress(0);

    try {
      const buffer = await file.arrayBuffer();
      let pdfBytes;

      if (needsPassword) {
        if (!password) {
          setErrorMsg('Password is required for this file.');
          setProcessing(false);
          return;
        }

        try {
          // Attempt native pdf-lib load (supports RC4 and AES-128)
          const pdfDoc = await PDFDocument.load(buffer, { password });
          pdfBytes = await pdfDoc.save();
        } catch (err) {
          // Check if error is due to V5 AES-256 encryption being unsupported by pdf-lib
          const msg = err.message || '';
          if (
            msg.includes('encrypted') ||
            msg.includes('ignoreEncryption') ||
            err.name === 'PasswordResponseRequiredError' ||
            msg.includes('password')
          ) {
            // Trigger PDF.js High-Compatibility Decryption mode (reconstructs pages safely via rasterization)
            const renderDoc = await loadPdfForRender(buffer, password);
            const outPdf = await PDFDocument.create();
            const numPages = renderDoc.numPages;

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
              setProgress(Math.round((pageNum / numPages) * 100));
              const page = await renderDoc.getPage(pageNum);
              
              // Render scale 2.0 keeps high visual layout clarity
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              await page.render({ canvasContext: ctx, viewport }).promise;

              const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
              const imageBytes = await imageBlob.arrayBuffer();
              const image = await outPdf.embedJpg(imageBytes);

              const newPage = outPdf.addPage([viewport.width, viewport.height]);
              newPage.drawImage(image, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height,
              });
            }
            pdfBytes = await outPdf.save();
          } else {
            throw err;
          }
        }
      } else {
        const pdfDoc = await PDFDocument.load(buffer);
        pdfBytes = await pdfDoc.save();
      }

      await deliver(pdfBytes, file.name.replace('.pdf', '-unlocked.pdf'), 'application/pdf');
      setDone(true);
    } catch (err) {
      setErrorMsg('Incorrect password or decryption error. Please check your credentials and try again.');
    } finally {
      setProcessing(false);
      setProgress(0);
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
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Select PDF file" id="unlock-dropzone" allowLocked={true} />
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
            <button className="btn btn-primary btn-lg btn-attention" onClick={handleUnlock} disabled={processing || (needsPassword && !password)} id="unlock-pdf-button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
              {processing ? (progress > 0 ? `Unlocking (${progress}%)...` : 'Unlocking...') : 'Unlock PDF'}
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

      {done && (
        <ToastNotification
          message="✓ PDF unlocked and downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}


