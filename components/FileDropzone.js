'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolIcon } from './Icons';

export default function FileDropzone({
  accept = '.pdf',
  multiple = false,
  maxFiles = 20,
  maxSizeMB = 100,
  onFilesSelected,
  label = 'Drop your files here',
  sublabel,
  id = 'file-dropzone',
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const acceptTypes = accept.split(',').map((t) => t.trim());
  const acceptLabel = acceptTypes.map((t) => t.replace('.', '').toUpperCase()).join(', ');

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
    (newFiles) => {
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

      let updated;
      if (multiple) {
        updated = [...files, ...fileArray].slice(0, maxFiles);
      } else {
        updated = [fileArray[0]];
      }

      setFiles(updated);
      onFilesSelected?.(updated);
    },
    [files, multiple, maxFiles, validateFile, onFilesSelected]
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: 'var(--space-sm)' }}>
            <div className="btn-upload-gradient btn-attention" style={{ fontSize: '18px', padding: '16px 44px' }}>
              <span>{accept.includes('image') ? 'Select Images' : 'Select PDF files'}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
              <button 
                type="button" 
                className="btn-circle-storage" 
                title="Google Drive"
                onClick={(e) => { e.stopPropagation(); alert('Google Drive client-side picker placeholder'); }}
              >
                <ToolIcon name="drive" size={14} style={{ color: '#fff' }} />
              </button>
              <button 
                type="button" 
                className="btn-circle-storage" 
                title="Dropbox"
                onClick={(e) => { e.stopPropagation(); alert('Dropbox client-side picker placeholder'); }}
              >
                <ToolIcon name="dropbox" size={14} style={{ color: '#fff' }} />
              </button>
            </div>
          </div>
          <div className="dropzone-subtitle" style={{ opacity: 0.8, fontSize: '14px', fontWeight: 400 }}>
            {accept.includes('image') ? 'or drop images here' : 'or drop PDFs here'}
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
