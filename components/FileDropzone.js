'use client';

import { useState, useCallback, useRef, useEffect, useEffectEvent } from 'react';
import Link from 'next/link';
import { ToolIcon } from './Icons';
import { checkPdfEncryption } from '@/lib/pdfUtils';
import { takeIncomingFiles } from '@/lib/incomingFiles';

let pageDropOwner = null;

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
  const hasFiles = files.length > 0;
  const uploadLabel = isChecking
    ? 'Checking file...'
    : hasFiles
      ? 'Add more files'
      : acceptsImages
        ? 'Select images'
        : acceptsOnlyPdf
          ? multiple ? 'Select PDF files' : 'Select PDF file'
          : multiple ? 'Select files' : 'Select file';
  const dropHint = isChecking
    ? 'Please wait while we verify your document...'
    : acceptsImages
      ? `or drop ${acceptLabel} images anywhere on this page`
      : acceptsOnlyPdf
        ? `or drop PDF ${multiple ? 'files' : 'file'} anywhere on this page`
        : `or drop ${acceptLabel} files anywhere on this page`;

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

  // Files handed over from the home page drop zone load as if the user had picked them here.
  const loadIncoming = useEffectEvent((incoming) => handleFiles(incoming));
  useEffect(() => {
    const incoming = takeIncomingFiles();
    if (incoming.length) queueMicrotask(() => loadIncoming(incoming));
  }, []);

  // Files dropped anywhere on the page land here too. Only the first drop zone on a page
  // takes them, and only while it can accept more files.
  const canAcceptMore = files.length === 0 || multiple;
  const onPageDrag = useEffectEvent((active) => setIsDragOver(active && canAcceptMore));
  const onPageDrop = useEffectEvent((dropped) => {
    if (canAcceptMore) handleFiles(dropped);
  });
  useEffect(() => {
    if (pageDropOwner) return undefined;
    const owner = {};
    pageDropOwner = owner;
    let depth = 0;
    const carriesFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
    const onEnter = (e) => {
      if (!carriesFiles(e)) return;
      depth += 1;
      onPageDrag(true);
    };
    const onLeave = (e) => {
      if (!carriesFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) onPageDrag(false);
    };
    // Prevent the browser from opening the file in place of the page.
    const onOver = (e) => {
      if (carriesFiles(e)) e.preventDefault();
    };
    const onDrop = (e) => {
      if (!carriesFiles(e)) return;
      depth = 0;
      onPageDrag(false);
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) onPageDrop(e.dataTransfer.files);
    };
    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('dragover', onOver);
    window.addEventListener('drop', onDrop);
    return () => {
      if (pageDropOwner === owner) pageDropOwner = null;
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

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

  // No stopPropagation: the page-level listener needs the drop to reset its drag count,
  // and it skips events that are already handled.
  const handleDrop = (e) => {
    e.preventDefault();
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
          className={`dropzone ${hasFiles ? 'dropzone-compact' : 'dropzone-empty'} ${isDragOver ? 'drag-over' : ''}`}
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
            <div className="btn-upload-gradient">
              <ToolIcon name={hasFiles ? 'plus' : 'upload'} size={20} />
              <span>{uploadLabel}</span>
            </div>
            <div className="dropzone-subtitle">
              {dropHint}
            </div>
            {!hasFiles && (
              <ul className="dropzone-trust">
                {['Never uploaded', 'Free, no sign-up', 'No watermark'].map((point) => (
                  <li key={point}>
                    <ToolIcon name="check" size={14} />
                    {point}
                  </li>
                ))}
              </ul>
            )}
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
