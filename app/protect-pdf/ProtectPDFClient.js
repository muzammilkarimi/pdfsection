'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageThumbnails from '@/components/PageThumbnails';
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
        }
      };

      // Try setting protection
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

  return (
    <ToolPageLayout
      title="Protect PDF"
      description="Add password protection when the active browser PDF engine supports encryption."
      icon="lock"
      iconColor="var(--tool-security)"
    >
      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF here"
          id="protect-dropzone"
        />
      ) : (
        <div className="tool-workspace">
          {/* Left panel: File details, previews and permission configuration checkboxes */}
          <div className="tool-main-panel">
            <div className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <button
                className="file-item-remove"
                onClick={() => {
                  setFile(null);
                  setDone(false);
                }}
              >
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <p className="body-sm ink-subtle" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
              Document Pages:
            </p>
            <PageThumbnails file={file} selectable={false} maxWidth={120} />

            <div className="card" style={{ marginTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Permissions (Optional)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {[
                  { state: allowPrint, setter: setAllowPrint, label: 'Allow Printing' },
                  { state: allowCopy, setter: setAllowCopy, label: 'Allow Text/Graphics Copying' },
                  { state: allowModify, setter: setAllowModify, label: 'Allow Modification' },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={(e) => item.setter(e.target.checked)}
                      style={{
                        accentColor: 'var(--primary)',
                        width: 16,
                        height: 16,
                      }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: password cards and action sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Security Credentials</p>
              <div
                style={{
                  padding: 'var(--space-sm)',
                  backgroundColor: 'rgba(245, 166, 35, 0.08)',
                  borderRadius: 'var(--rounded-md)',
                  border: '1px solid rgba(245, 166, 35, 0.2)',
                  color: 'var(--semantic-warning)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                }}
              >
                Browser-only password encryption depends on PDF engine support. If unavailable,
                this tool will stop before downloading instead of creating an unprotected file.
              </div>
              
              {/* User password */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                  User Password (Required to open)
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Password to open PDF"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {/* Owner password */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>
                  Owner Password (Optional)
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Master admin password"
                  value={ownerPassword}
                  style={{ width: '100%' }}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                />
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
                  ✓ Encrypted successfully!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleProtect}
                disabled={processing || !userPassword}
                style={{ width: '100%' }}
                id="protect-pdf-button"
              >
                {processing ? 'Encrypting...' : 'Protect PDF'}
                <ToolIcon name="lock" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
