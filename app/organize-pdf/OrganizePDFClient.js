'use client';

import { useState, useCallback, useRef } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, savePdf, downloadBlob } from '@/lib/pdfUtils';
import { generateAllThumbnails } from '@/lib/renderUtils';
import { PDFDocument, degrees } from 'pdf-lib';

export default function OrganizePDFClient() {
  const [files, setFiles] = useState([]); // Array of File objects
  const [pages, setPages] = useState([]); // Array of page objects: { id, fileIndex, pageIndexInFile, rotation, dataUrl, fileName }
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  
  // Drag and drop states
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  const addFileInputRef = useRef(null);

  // Generate page structures from file list
  const processNewFile = async (file, currentFileIndex) => {
    const thumbnails = await generateAllThumbnails(file, 150);
    return thumbnails.map((t) => ({
      id: `${currentFileIndex}-${t.pageNumber - 1}`,
      fileIndex: currentFileIndex,
      pageIndexInFile: t.pageNumber - 1,
      rotation: 0,
      dataUrl: t.dataUrl,
      fileName: file.name,
    }));
  };

  // Initial file upload selection
  const handleFilesSelected = useCallback(async (selectedFiles) => {
    const fileList = Array.from(selectedFiles);
    if (fileList.length === 0) return;

    setLoading(true);
    setDone(false);

    try {
      const processedPages = [];
      const updatedFiles = [...files];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const nextIndex = updatedFiles.length;
        updatedFiles.push(file);
        const filePages = await processNewFile(file, nextIndex);
        processedPages.push(...filePages);
      }

      setFiles(updatedFiles);
      setPages((prev) => [...prev, ...processedPages]);
    } catch (err) {
      alert('Error reading PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [files]);

  // Appending additional files to the workspace
  const handleAddMoreFiles = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setDone(false);

    try {
      const processedPages = [];
      const updatedFiles = [...files];

      for (const file of selectedFiles) {
        const nextIndex = updatedFiles.length;
        updatedFiles.push(file);
        const filePages = await processNewFile(file, nextIndex);
        processedPages.push(...filePages);
      }

      setFiles(updatedFiles);
      setPages((prev) => [...prev, ...processedPages]);
    } catch (err) {
      alert('Error loading additional PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Page interaction handlers
  const rotatePage = (index, direction = 90) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        rotation: (updated[index].rotation + direction) % 360,
      };
      return updated;
    });
  };

  const removePage = (index) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const rotateAllPages = (direction = 90) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + direction) % 360,
      }))
    );
  };

  const clearWorkspace = () => {
    if (confirm('Clear workspace? This will remove all files.')) {
      setFiles([]);
      setPages([]);
      setDone(false);
    }
  };

  // Drag and drop sorting mechanics
  const handleDragStart = (index) => setDragIndex(index);
  const handleDragOver = (e, index) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === toIndex) return;
    const updated = [...pages];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPages(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Build the compiled PDF taking all source files + custom page configurations into account
  const handleSave = async () => {
    if (pages.length === 0) return;
    setProcessing(true);

    try {
      const compiledDoc = await PDFDocument.create();
      
      // Load all source PDF documents
      const loadedPdfs = [];
      for (const file of files) {
        const doc = await loadPdf(file);
        loadedPdfs.push(doc);
      }

      // Reconstruct PDF page-by-page in order
      for (const pageCfg of pages) {
        const srcDoc = loadedPdfs[pageCfg.fileIndex];
        const [copiedPage] = await compiledDoc.copyPages(srcDoc, [pageCfg.pageIndexInFile]);
        
        // Apply individual page rotations
        if (pageCfg.rotation > 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pageCfg.rotation));
        }

        compiledDoc.addPage(copiedPage);
      }

      const compiledBytes = await savePdf(compiledDoc);
      downloadBlob(compiledBytes, 'organized.pdf', 'application/pdf');
      setDone(true);
    } catch (err) {
      alert('Error building organized PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="Organize PDF"
      description="Visual editor to sort, rotate, delete, or merge multiple PDFs client-side."
      icon="reorder"
      iconColor="var(--tool-organize)"
    >
      {pages.length === 0 && !loading ? (
        <FileDropzone
          accept=".pdf"
          multiple={true}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF files here to begin"
          id="organize-dropzone"
        />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <div className="progress-track" style={{ maxWidth: 300, margin: '0 auto var(--space-md)' }}>
            <div className="progress-fill indeterminate" />
          </div>
          <p className="body-sm ink-subtle">Generating page workspace...</p>
        </div>
      ) : (
        <>
          {/* Dashboard Toolkit Bar */}
          <div
            className="card"
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-md)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-lg)',
            }}
          >
            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <span className="badge badge-success">
                {files.length} File{files.length !== 1 ? 's' : ''}
              </span>
              <span className="badge">
                {pages.length} Page{pages.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '6px 12px' }}
                onClick={() => rotateAllPages(90)}
              >
                Rotate All Right
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '6px 12px', color: 'var(--semantic-error)', borderColor: 'var(--hairline)' }}
                onClick={clearWorkspace}
              >
                Reset All
              </button>
              <button
                className="btn btn-primary"
                style={{ fontSize: '13px', padding: '6px 12px' }}
                onClick={() => addFileInputRef.current?.click()}
              >
                Add PDF Files
              </button>
              <input
                ref={addFileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleAddMoreFiles}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Split Workspace */}
          <div className="tool-workspace">
            {/* Left Workspace Panel: Interactive Grid */}
            <div className="tool-main-panel">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-sm) 0',
                }}
              >
                {pages.map((page, index) => {
                  const isDraggingOver = dragOverIndex === index;
                  return (
                    <div
                      key={`${page.id}-${index}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{
                        borderRadius: 'var(--rounded-lg)',
                        border: `1.5px solid ${isDraggingOver ? 'var(--primary)' : 'var(--hairline)'}`,
                        backgroundColor: dragIndex === index ? 'var(--canvas)' : 'var(--surface-1)',
                        padding: 'var(--space-sm)',
                        cursor: 'grab',
                        opacity: dragIndex === index ? 0.3 : 1,
                        position: 'relative',
                        transition: 'border var(--duration-fast) var(--ease-default), transform var(--duration-fast) var(--ease-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 'var(--space-xs)',
                      }}
                      className="organize-card"
                    >
                      {/* Floating Action Overlay on Thumbnail */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          right: 10,
                          display: 'flex',
                          justifyContent: 'space-between',
                          opacity: 0,
                          transition: 'opacity var(--duration-fast) var(--ease-default)',
                          zIndex: 5,
                        }}
                        className="organize-hover-actions"
                      >
                        <button
                          className="btn btn-secondary btn-icon"
                          style={{ width: 24, height: 24, padding: 0, backgroundColor: 'rgba(15,16,17,0.9)', borderRadius: '50%' }}
                          onClick={(e) => { e.stopPropagation(); rotatePage(index, 90); }}
                          title="Rotate Page"
                        >
                          ↻
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          style={{ width: 24, height: 24, padding: 0, backgroundColor: 'rgba(229,72,77,0.9)', borderRadius: '50%', color: '#fff', border: 'none' }}
                          onClick={(e) => { e.stopPropagation(); removePage(index); }}
                          title="Remove Page"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Thumbnail Image Wrapper */}
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          borderRadius: 'var(--rounded-sm)',
                          aspectRatio: '3/4',
                          backgroundColor: 'var(--canvas)',
                        }}
                      >
                        <img
                          src={page.dataUrl}
                          alt={`Page ${page.pageIndexInFile + 1}`}
                          style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            transform: `rotate(${page.rotation}deg)`,
                            transition: 'transform var(--duration-normal) var(--ease-out)',
                            objectFit: 'contain',
                            pointerEvents: 'none',
                          }}
                          draggable={false}
                        />
                      </div>

                      {/* Page Description */}
                      <div style={{ marginTop: 'var(--space-xxs)' }}>
                        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                          Page {index + 1}
                        </div>
                        <div
                          style={{
                            textAlign: 'center',
                            fontSize: 9,
                            color: 'var(--ink-tertiary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: 1,
                          }}
                          title={page.fileName}
                        >
                          {page.fileName}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Add files grid card */}
                <div
                  onClick={() => addFileInputRef.current?.click()}
                  style={{
                    borderRadius: 'var(--rounded-lg)',
                    border: '2px dashed var(--hairline-strong)',
                    backgroundColor: 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    aspectRatio: '3/4',
                    padding: 'var(--space-md)',
                    color: 'var(--ink-subtle)',
                    transition: 'all var(--duration-fast) var(--ease-default)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--ink)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--hairline-strong)'; e.currentTarget.style.color = 'var(--ink-subtle)'; }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>+</div>
                  <div style={{ fontSize: '11px', textAlign: 'center', fontWeight: 500 }}>Add PDF files</div>
                </div>
              </div>
            </div>

            {/* Right Action Sidebar Panel */}
            <div className="tool-action-sidebar">
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Save Workspace</p>
                
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="ink-muted">Total Files:</span>
                    <span style={{ fontWeight: 600 }}>{files.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="ink-muted">Total Pages:</span>
                    <span style={{ fontWeight: 600 }}>{pages.length}</span>
                  </div>
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
                    ✓ Save successful!
                  </div>
                )}

                <button
                  className="btn btn-primary btn-lg btn-attention"
                  onClick={handleSave}
                  disabled={processing || pages.length === 0}
                  style={{ width: '100%' }}
                  id="organize-save-button"
                >
                  {processing ? 'Compiling...' : 'Save New PDF'}
                  <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            .organize-card:hover .organize-hover-actions {
              opacity: 1 !important;
            }
          `}} />
        </>
      )}
    </ToolPageLayout>
  );
}
