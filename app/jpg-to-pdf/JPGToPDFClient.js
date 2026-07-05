'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { downloadBlob } from '@/lib/pdfUtils';

export default function JPGToPDFClient() {
  const [images, setImages] = useState([]);
  const [pageSize, setPageSize] = useState('fit'); // 'fit', 'a4', 'letter'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait', 'landscape'
  const [margin, setMargin] = useState('none'); // 'none', 'small' (20px), 'big' (50px)
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    setImages((prev) => [...prev, ...files]);
    setDone(false);
  }, []);

  const moveImage = (fromIndex, toIndex) => {
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setImages(updated);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Helper to read file as Image object
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

  // Helper to draw image to canvas and export as JPEG bytes
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

        // Calculate dimensions
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
          // Swap dimensions
          const temp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = temp;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate image placement with margin
        const innerWidth = pageWidth - marginVal * 2;
        const innerHeight = pageHeight - marginVal * 2;

        const imgRatio = embeddedImg.width / embeddedImg.height;
        const pageRatio = innerWidth / innerHeight;

        let drawWidth = innerWidth;
        let drawHeight = innerHeight;

        if (imgRatio > pageRatio) {
          // Constrained by width
          drawHeight = innerWidth / imgRatio;
        } else {
          // Constrained by height
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
      downloadBlob(pdfBytes, 'images_converted.pdf', 'application/pdf');
      setDone(true);
    } catch (err) {
      alert('Error converting images to PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="JPG to PDF"
      description="Convert images to PDF format in seconds. Customize page sizes and margins."
      icon="image"
      iconColor="var(--tool-convert-to)"
    >
      <FileDropzone
        accept="image/jpeg,image/png,image/webp"
        multiple={true}
        onFilesSelected={handleFilesSelected}
        label="Drop your images here"
        sublabel="or click to browse · JPG, PNG, WEBP"
        id="jpg-to-pdf-dropzone"
      />

      {images.length > 0 && (
        <div className="tool-workspace" style={{ marginTop: 'var(--space-lg)' }}>
          {/* Left panel: Image listing and reorder */}
          <div className="tool-main-panel">
            <p className="eyebrow" style={{ marginBottom: 'var(--space-xs)', color: 'var(--ink-subtle)' }}>
              Arrange Images ({images.length} uploaded)
            </p>
            <div className="file-list">
              {images.map((img, index) => (
                <div key={`${img.name}-${index}`} className="file-item">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      className="file-item-remove"
                      onClick={() => index > 0 && moveImage(index, index - 1)}
                      disabled={index === 0}
                      style={{ opacity: index === 0 ? 0.3 : 1, width: 20, height: 16 }}
                    >
                      ▲
                    </button>
                    <button
                      className="file-item-remove"
                      onClick={() => index < images.length - 1 && moveImage(index, index + 1)}
                      disabled={index === images.length - 1}
                      style={{ opacity: index === images.length - 1 ? 0.3 : 1, width: 20, height: 16 }}
                    >
                      ▼
                    </button>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--ink-tertiary)', width: 24, textAlign: 'center' }}>
                    {index + 1}
                  </span>
                  <span className="file-item-name">{img.name}</span>
                  <button className="file-item-remove" onClick={() => removeImage(index)}>
                    <ToolIcon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Extra file slot */}
            <div style={{ marginTop: 'var(--space-md)' }}>
              <FileDropzone
                accept="image/jpeg,image/png,image/webp"
                multiple={true}
                onFilesSelected={(newFiles) => setImages((prev) => [...prev, ...newFiles])}
                label="Add more images"
                sublabel="Drag and drop or click to append"
                id="jpg-to-pdf-append-dropzone"
              />
            </div>
          </div>

          {/* Right panel: Page settings sidebar */}
          <div className="tool-action-sidebar">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Page Settings</p>
              
              {/* Page size selection */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Page Size</label>
                <select className="input" value={pageSize} onChange={(e) => setPageSize(e.target.value)} style={{ width: '100%' }}>
                  <option value="fit">Fit to Image Size</option>
                  <option value="a4">A4</option>
                  <option value="letter">US Letter</option>
                </select>
              </div>

              {/* Page orientation */}
              {pageSize !== 'fit' && (
                <div>
                  <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Orientation</label>
                  <select className="input" value={orientation} onChange={(e) => setOrientation(e.target.value)} style={{ width: '100%' }}>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              )}

              {/* Margins */}
              <div>
                <label className="body-sm ink-muted" style={{ display: 'block', marginBottom: 4 }}>Margins</label>
                <select className="input" value={margin} onChange={(e) => setMargin(e.target.value)} style={{ width: '100%' }}>
                  <option value="none">No Margin</option>
                  <option value="small">Small Margin</option>
                  <option value="big">Big Margin</option>
                </select>
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
                  ✓ Convert successful!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleConvert}
                disabled={processing}
                style={{ width: '100%' }}
                id="convert-jpg-to-pdf-button"
              >
                {processing ? 'Converting...' : 'Convert to PDF'}
                <ToolIcon name="arrowRight" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
