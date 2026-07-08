'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, downloadBlob } from '@/lib/pdfUtils';

export default function ProtectPDFClient() {
  const [file, setFile] = useState(null);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [allowModify, setAllowModify] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setFile(files[0] || null);
    setDone(false);
  }, []);

  const resetFile = () => {
    setFile(null);
    setDone(false);
    setUserPassword('');
    setOwnerPassword('');
  };

  const handleProtect = async () => {
    if (!file || !userPassword) {
      alert('Please enter at least a User Password to protect the file.');
      return;
    }
    setProcessing(true);

    try {
      const pdfDoc = await loadPdf(file);
      const encryptOptions = {
        userPassword,
        ownerPassword: ownerPassword || userPassword + '_owner',
        permissions: {
          printing: allowPrint ? 'highResolution' : 'lowResolution',
          copying: allowCopy,
          modifying: allowModify,
        },
      };

      if (typeof pdfDoc.encrypt === 'function') {
        pdfDoc.encrypt(encryptOptions);
      } else if (typeof pdfDoc.setProtection === 'function') {
        pdfDoc.setProtection(encryptOptions);
      } else {
        throw new Error('Password encryption is not supported by the current browser PDF engine.');
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, file.name.replace('.pdf', '-protected.pdf'), 'application/pdf');
      setDone(true);
    } catch (err) {
      alert('Error protecting PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const permissions = [
    { state: allowPrint, setter: setAllowPrint, label: 'Allow printing' },
    { state: allowCopy, setter: setAllowCopy, label: 'Allow text and image copying' },
    { state: allowModify, setter: setAllowModify, label: 'Allow modification' },
  ];

  return (
    <ToolPageLayout
      title="Protect PDF"
      description="Add password protection when the active browser PDF engine supports encryption."
      icon="lock"
      iconColor="var(--tool-security)"
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone accept=".pdf" multiple={false} onFilesSelected={handleFilesSelected} label="Select PDF file" id="protect-dropzone" />
      ) : (
        <PageToolWorkspace
          title="Protect PDF"
          description="Set passwords and permissions before protecting the file."
          icon="lock"
          iconColor="var(--tool-security)"
          file={file}
          onReset={resetFile}
          ariaLabel="Protect PDF settings"
          preview={<PageThumbnails file={file} selectable={false} maxWidth={150} className="page-preview-grid" />}
          footer={(
            <button className="btn btn-primary btn-lg btn-attention" onClick={handleProtect} disabled={processing || !userPassword} id="protect-pdf-button">
              {processing ? 'Encrypting...' : 'Protect PDF'}
              <ToolIcon name="lock" size={16} />
            </button>
          )}
        >
          <div className="merge-warning">
            Browser-only password encryption depends on PDF engine support. If unavailable, this tool stops before downloading.
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">User password</label>
            <input type="password" className="input" placeholder="Password to open PDF" value={userPassword} onChange={(event) => setUserPassword(event.target.value)} required />
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">Owner password</label>
            <input type="password" className="input" placeholder="Optional admin password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} />
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">Permissions</label>
            <div className="page-check-list">
              {permissions.map((item) => (
                <label key={item.label} className="page-check-row">
                  <input type="checkbox" checked={item.state} onChange={(event) => item.setter(event.target.checked)} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {done && <div className="merge-success">Encrypted successfully. Your PDF has been downloaded.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}


