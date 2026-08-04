'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ToolIcon } from './Icons';
import { checkPdfEncryption } from '@/lib/pdfUtils';

export default function FileDropzone({
  accept = '.pdf',
  multiple = false,
  maxFiles = 20,
  maxSizeMB = 100,
  onFilesSelected,
  label = 'Drop your files here',
  sublabel,
  id = 'file-dropzone',
  allowLocked = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const inputRef = useRef(null);

  const acceptTypes = accept.split(',').map((t) => t.trim());
  const acceptLabel = acceptTypes.map((t) => t.replace('.', '').replace('image/', '').toUpperCase()).join(', ');
  const acceptsImages = accept.includes('image');
  const acceptsOnlyPdf = acceptTypes.length === 1 && acceptTypes[0] === '.pdf';
  const uploadLabel = isChecking
    ? 'Checking file...'
    : acceptsImages
      ? 'Select images'
      : acceptsOnlyPdf
        ? multiple ? 'Select PDF files' : 'Select PDF file'
        : multiple ? 'Select files' : 'Select file';
  const dropHint = isChecking
    ? 'Please wait while we verify your document...'
    : acceptsImages
      ? `or drag and drop ${acceptLabel} images here`
      : acceptsOnlyPdf
        ? `or drag and drop PDF ${multiple ? 'files' : 'file'} here`
        : `or drag and drop ${acceptLabel} files here`;

  const validateFile = useCallback(
    (file) => {
      // Check extension
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!acceptTypes.some((t) => t === ext || t === file.type || t === '*')) {
        return `${file.name}: Unsupported file type. Accepted: ${acceptLabel}`;
      }
      // Check size
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `${file.name}: File too large (max ${maxSizeMB}MB)`;
      }
      return null;
    },
    [acceptTypes, acceptLabel, maxSizeMB]
  );

  const handleFiles = useCallback(
    async (newFiles) => {
      setError('');
      const fileArray = Array.from(newFiles);

      // Validate each file
      for (const file of fileArray) {
        const err = validateFile(file);
        if (err) {
          setError(err);
          return;
        }
      }

      // Check encryption if not allowed
      if (!allowLocked) {
        setIsChecking(true);
        try {
          for (const file of fileArray) {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (ext === '.pdf') {
              const locked = await checkPdfEncryption(file);
              if (locked) {
                setError(
                  <span>
                    🔒 <strong>{file.name}</strong> is password-protected. Please unlock it using our free{' '}
                    <Link href="/unlock-pdf" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: '600' }}>
                      Unlock PDF tool
                    </Link>{' '}
                    first.
                  </span>
                );
                setIsChecking(false);
                return;
              }
            }
          }
        } catch (err) {
          // ignore or handle file reading errors
        }
        setIsChecking(false);
      }

      let updated;
      if (multiple) {
        updated = [...files, ...fileArray].slice(0, maxFiles);
      } else {
        updated = [fileArray[0]];
      }

      setFiles(updated);
      onFilesSelected?.(updated);
    },
    [files, multiple, maxFiles, validateFile, onFilesSelected, allowLocked]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesSelected?.(updated);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      {/* Dropzone area */}
      {(files.length === 0 || multiple) && (
        <div
          className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label={label}
          id={id}
        >
          <div className="dropzone-upload-content">
            <div className="btn-upload-gradient btn-attention">
              <ToolIcon name="upload" size={24} />
              <span>{uploadLabel}</span>
            </div>
            <div className="dropzone-subtitle">
              {dropHint}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'var(--space-md)', color: 'var(--ink-muted)', fontSize: '11px', fontWeight: '500', backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)' }}>
              <ToolIcon name="lock" size={12} style={{ color: 'var(--brand-blue)', flexShrink: 0 }} />
              <span>100% Secure</span>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: 'rgba(229, 72, 77, 0.1)',
            borderRadius: 'var(--rounded-md)',
            color: 'var(--semantic-error)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="file-list" style={{ marginTop: 'var(--space-md)' }}>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-item">
              <ToolIcon name="pdf" size={18} className="ink-subtle" />
              <span className="file-item-name">{file.name}</span>
              <span className="file-item-size">{formatSize(file.size)}</span>
              <button
                className="file-item-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                aria-label={`Remove ${file.name}`}
              >
                <ToolIcon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
