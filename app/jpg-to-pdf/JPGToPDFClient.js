'use client';

import { useState, useCallback, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { downloadBlob } from '@/lib/pdfUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { getToolById } from '@/lib/tools';

function ImagePreviewCard({
  file,
  index,
  pageSize,
  orientation,
  margin,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  formatSize,
}) {
  const [thumbnail, setThumbnail] = useState('');

  useEffect(() => {
    let url = '';
    try {
      url = URL.createObjectURL(file);
      setThumbnail(url);
    } catch (e) {
      setThumbnail('');
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  const isLandscape = pageSize !== 'fit' && orientation === 'landscape';
  const paperAspectRatio = pageSize === 'fit' ? 'auto' : isLandscape ? '1.414 / 1' : '1 / 1.414';
  const marginPadding = margin === 'small' ? '12px' : margin === 'big' ? '24px' : '0px';

  return (
    <article
      className={`merge-preview-card ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      aria-label={`${file.name}, position ${index + 1}`}
    >
      <div className="merge-preview-order">{index + 1}</div>
      <div className="merge-preview-drag" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div
        className="merge-preview-paper"
        style={{
          aspectRatio: paperAspectRatio,
          height: pageSize !== 'fit' ? 'auto' : '170px',
          minHeight: '140px',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--hairline-strong)',
          borderRadius: '4px',
          overflow: 'hidden',
          padding: marginPadding,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={`Preview of ${file.name}`}
            draggable={false}
            style={{
              objectFit: 'contain',
              width: '100%',
              height: '100%',
              maxHeight: '100%',
              maxWidth: '100%',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        ) : (
          <div className="merge-preview-fallback">
            <ToolIcon name="image" size={34} />
            <span>Image preview</span>
          </div>
        )}
      </div>

      <div className="merge-preview-meta">
        <strong>{file.name}</strong>
        <span>{formatSize(file.size)}</span>
      </div>

      <div className="merge-preview-actions">
        <button type="button" className="merge-icon-button" onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move ${file.name} up`}>
          Up
        </button>
        <button type="button" className="merge-icon-button" onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Move ${file.name} down`}>
          Down
        </button>
        <button type="button" className="merge-remove-button" onClick={onRemove} aria-label={`Remove ${file.name}`}>
          Remove
        </button>
      </div>
    </article>
  );
}

export default function JPGToPDFClient() {
  const deliver = useResultHandoff('jpg-to-pdf');
  const toolInfo = getToolById('jpg-to-pdf') || {
    name: 'JPG to PDF',
    description: 'Convert images to PDF format in seconds. Customize page sizes and margins.',
    categoryColor: 'var(--tool-convert-to)',
    icon: 'image',
  };

  const [images, setImages] = useState([]);
  const [pageSize, setPageSize] = useState('fit'); // 'fit', 'a4', 'letter'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait', 'landscape'
  const [margin, setMargin] = useState('none'); // 'none', 'small' (20px), 'big' (50px)
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const [convertedPdfBytes, setConvertedPdfBytes] = useState(null);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);

  const handleFilesSelected = useCallback((files) => {
    setImages((prev) => [...prev, ...files]);
    setDone(false);
    setConvertedPdfBytes(null);
  }, []);

  const moveImage = (fromIndex, toIndex) => {
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setImages(updated);
    setDone(false);
    setConvertedPdfBytes(null);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setDone(false);
    setConvertedPdfBytes(null);
  };

  const resetImages = () => {
    setImages([]);
    setDone(false);
    setConvertedPdfBytes(null);
  };

  const handleRedownload = () => {
    if (convertedPdfBytes) {
      downloadBlob(convertedPdfBytes, 'images_converted.pdf', 'application/pdf');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);

  const fileToImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const getJpgBytes = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(new Uint8Array(reader.result));
        reader.readAsArrayBuffer(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of images) {
        const img = await fileToImage(file);
        const jpgBytes = await getJpgBytes(img);
        const embeddedImg = await pdfDoc.embedJpg(jpgBytes);

        let pageWidth = img.width;
        let pageHeight = img.height;

        const marginVal = margin === 'small' ? 20 : margin === 'big' ? 50 : 0;

        if (pageSize === 'a4') {
          pageWidth = PageSizes.A4[0];
          pageHeight = PageSizes.A4[1];
        } else if (pageSize === 'letter') {
          pageWidth = PageSizes.Letter[0];
          pageHeight = PageSizes.Letter[1];
        }

        if (pageSize !== 'fit' && orientation === 'landscape') {
          const temp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = temp;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        const innerWidth = pageWidth - marginVal * 2;
        const innerHeight = pageHeight - marginVal * 2;

        const imgRatio = embeddedImg.width / embeddedImg.height;
        const pageRatio = innerWidth / innerHeight;

        let drawWidth = innerWidth;
        let drawHeight = innerHeight;

        if (imgRatio > pageRatio) {
          drawHeight = innerWidth / imgRatio;
        } else {
          drawWidth = innerHeight * imgRatio;
        }

        const x = marginVal + (innerWidth - drawWidth) / 2;
        const y = marginVal + (innerHeight - drawHeight) / 2;

        page.drawImage(embeddedImg, {
          x,
          y,
          width: drawWidth,
          height: drawHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      setConvertedPdfBytes(pdfBytes);
      await deliver(pdfBytes, 'images_converted.pdf', 'application/pdf');
      setDone(true);
    } catch (err) {
      alert('Error converting images to PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title={toolInfo.name}
      description={toolInfo.description}
      icon={toolInfo.icon}
      iconColor={toolInfo.categoryColor}
      showHeader={images.length === 0}
      layoutMode={images.length > 0 ? 'page-preview' : 'page-scroll'}
    >
      {images.length === 0 ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp"
          multiple={true}
          onFilesSelected={handleFilesSelected}
          label="Select image files"
          sublabel="or drop images here · JPG, PNG, WEBP"
          id="jpg-to-pdf-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title={toolInfo.name}
          description="Drag to reorder images and adjust page settings."
          icon={toolInfo.icon}
          iconColor={toolInfo.categoryColor}
          onReset={resetImages}
          preview={
            <div className="merge-preview-grid">
              {images.map((file, index) => (
                <ImagePreviewCard
                  key={`${file.name}-${index}`}
                  file={file}
                  index={index}
                  pageSize={pageSize}
                  orientation={orientation}
                  margin={margin}
                  isDragging={draggedIndex === index}
                  isDropTarget={dropTargetIndex === index}
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTargetIndex(index);
                  }}
                  onDrop={() => {
                    if (draggedIndex !== null && draggedIndex !== index) {
                      moveImage(draggedIndex, index);
                    }
                    setDraggedIndex(null);
                    setDropTargetIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDropTargetIndex(null);
                  }}
                  onMoveUp={() => moveImage(index, index - 1)}
                  onMoveDown={() => moveImage(index, index + 1)}
                  onRemove={() => removeImage(index)}
                  canMoveUp={index > 0}
                  canMoveDown={index < images.length - 1}
                  formatSize={formatSize}
                />
              ))}

              <label
                className="merge-preview-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '220px',
                  cursor: 'pointer',
                  borderStyle: 'dashed',
                  borderWidth: '2px',
                  textAlign: 'center',
                  gap: 'var(--space-xs)',
                  padding: 'var(--space-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesSelected(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(94, 106, 210, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <ToolIcon name="plus" size={22} />
                </div>
                <strong style={{ fontSize: '13px', marginTop: 4 }}>Add more images</strong>
                <span style={{ fontSize: '11px', color: 'var(--ink-subtle)' }}>JPG, PNG, WEBP</span>
              </label>
            </div>
          }
          footer={
            done ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', width: '100%' }}>
                <button
                  className="btn btn-primary btn-lg btn-attention btn-success-state"
                  onClick={handleRedownload}
                  style={{ width: '100%' }}
                  id="redownload-jpg-to-pdf-button"
                >
                  <ToolIcon name="download" size={16} style={{ marginRight: 6 }} />
                  Download PDF Again
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetImages}
                  style={{ width: '100%' }}
                  id="reset-jpg-to-pdf-button"
                >
                  Convert New Images
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleConvert}
                disabled={processing || images.length === 0}
                id="convert-jpg-to-pdf-button"
                style={{ width: '100%' }}
              >
                {processing ? 'Converting to PDF...' : 'Convert to PDF'}
                <ToolIcon name="arrowRight" size={16} style={{ marginLeft: 6 }} />
              </button>
            )
          }
        >
          <div className="page-control-stat">
            <span>Images selected</span>
            <strong>{images.length}</strong>
          </div>

          <div className="merge-summary-list" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div>
              <span className="ink-muted">Total size</span>
              <strong>{formatSize(totalSize)}</strong>
            </div>
            <div>
              <span className="ink-muted">Output</span>
              <strong>images_converted.pdf</strong>
            </div>
          </div>

          <div className="page-field-group">
            <label className="body-sm ink-muted">Page Size</label>
            <select className="input" value={pageSize} onChange={(e) => setPageSize(e.target.value)} style={{ width: '100%' }}>
              <option value="fit">Fit to Image Size</option>
              <option value="a4">A4 Standard</option>
              <option value="letter">US Letter</option>
            </select>
          </div>

          {pageSize !== 'fit' && (
            <div className="page-field-group">
              <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Orientation</label>
              <select className="input" value={orientation} onChange={(e) => setOrientation(e.target.value)} style={{ width: '100%' }}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          )}

          <div className="page-field-group">
            <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Margins</label>
            <select className="input" value={margin} onChange={(e) => setMargin(e.target.value)} style={{ width: '100%' }}>
              <option value="none">No Margin</option>
              <option value="small">Small Margin</option>
              <option value="big">Big Margin</option>
            </select>
          </div>
        </PageToolWorkspace>
      )}

      {done && (
        <ToastNotification
          message="Images converted & PDF downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
