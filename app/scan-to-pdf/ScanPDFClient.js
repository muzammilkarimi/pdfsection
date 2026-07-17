'use client';

import { useState, useCallback, useRef } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { PDFDocument } from 'pdf-lib';

export default function ScanPDFClient() {
  const toolInfo = getToolById('scan-to-pdf') || {
    name: 'Scan to PDF',
    description: 'Convert camera scans or images to PDF',
    categoryColor: 'var(--tool-organize)',
    icon: 'camera',
  };

  const [stream, setStream] = useState(null);
  const [scannedPages, setScannedPages] = useState([]);
  const [filterMode, setFilterMode] = useState('bw'); // 'color', 'grayscale', 'bw'
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setDone(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Error accessing webcam: ' + err.message + '. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply Filter processing
    if (filterMode === 'grayscale') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (filterMode === 'bw') {
      // Document scanner threshold filter
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = avg > 120 ? 255 : 0;
        data[i] = threshold;
        data[i + 1] = threshold;
        data[i + 2] = threshold;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setScannedPages((prev) => [...prev, dataUrl]);
  };

  const removePage = (index) => {
    setScannedPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompile = async () => {
    if (scannedPages.length === 0) return;
    setProcessing(true);
    stopCamera();

    try {
      const pdfDoc = await PDFDocument.create();

      for (const dataUrl of scannedPages) {
        const imageBytes = await fetch(dataUrl).then((res) => res.arrayBuffer());
        const img = await pdfDoc.embedPng(imageBytes);
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }

      const finalBytes = await pdfDoc.save();
      downloadBlob(
        new Blob([finalBytes], { type: 'application/pdf' }),
        'scanned_document.pdf',
        'application/pdf'
      );

      setScannedPages([]);
      setDone(true);
    } catch (err) {
      alert('Error compiling scanned PDF: ' + err.message);
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
      showHeader={false}
      layoutMode="page-preview"
    >
      <PageToolWorkspace
        title={toolInfo.name}
        description={toolInfo.description}
        icon={toolInfo.icon}
        iconColor={toolInfo.categoryColor}
        onReset={scannedPages.length > 0 ? () => {
          setScannedPages([]);
          stopCamera();
          setDone(false);
        } : null}
        preview={
          <div style={{ width: '100%' }}>
            {stream ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    borderRadius: 'var(--rounded-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--hairline-strong)',
                    backgroundColor: '#000000',
                    aspectRatio: '4/3',
                    position: 'relative',
                  }}
                >
                  <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button className="btn btn-primary" onClick={captureFrame}>
                    Snap Snapshot
                  </button>
                  <button className="btn btn-secondary" onClick={stopCamera}>
                    Turn Off Camera
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--space-xl) var(--space-md)',
                  minHeight: '260px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--rounded-lg)',
                    backgroundColor: 'rgba(94, 106, 210, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-md)',
                    color: 'var(--primary)',
                  }}
                >
                  <ToolIcon name="camera" size={32} />
                </div>
                <h3 className="body-lg" style={{ fontWeight: 600 }}>Webcam Capture</h3>
                <p className="body-sm ink-subtle" style={{ maxWidth: '320px', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
                  Use your desktop camera or mobile device webcam to scan page snapshots and compile them directly to a PDF.
                </p>

                <button className="btn btn-primary" onClick={startCamera}>
                  Activate Web Camera
                </button>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        }
        footer={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
            {done && (
              <div style={{ padding: '8px', borderRadius: 'var(--rounded-md)', backgroundColor: 'rgba(39, 166, 68, 0.08)', color: 'var(--semantic-success)', fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
                ✓ PDF compiled and downloaded!
              </div>
            )}

            <button
              className="btn btn-primary btn-lg btn-attention"
              onClick={handleCompile}
              disabled={processing || scannedPages.length === 0}
              style={{ width: '100%' }}
              id="compile-scans-button"
            >
              {processing ? 'Compiling...' : 'Download Scanned PDF'}
              <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)', marginBottom: '6px' }}>Scanner Settings</p>
            <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px' }}>Scan Filters:</label>
            <select
              className="input"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="bw">B&W High-Contrast (Scanned Doc)</option>
              <option value="grayscale">Grayscale Photo</option>
              <option value="color">Original Photo Color</option>
            </select>
          </div>

          <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)', marginBottom: '8px' }}>Scanned Pages ({scannedPages.length})</p>
            {scannedPages.length === 0 ? (
              <p className="body-xs ink-subtle" style={{ fontStyle: 'italic' }}>
                No snapshots captured yet. Turn on camera to snap pages.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {scannedPages.map((page, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      border: '1px solid var(--hairline-strong)',
                      borderRadius: 'var(--rounded-md)',
                      aspectRatio: '4/3',
                      overflow: 'hidden',
                      backgroundColor: '#000',
                    }}
                  >
                    <img src={page} alt={`page-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => removePage(index)}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(229, 72, 77, 0.9)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                      }}
                    >
                      ✕
                    </button>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        left: 2,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: '9px',
                        padding: '1px 4px',
                        borderRadius: '2px',
                      }}
                    >
                      P.{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageToolWorkspace>
    </ToolPageLayout>
  );
}
