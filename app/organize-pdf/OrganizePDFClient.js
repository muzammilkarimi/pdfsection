'use client';

import { useState, useRef } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, savePdf, downloadBlob } from '@/lib/pdfUtils';
import { generateAllThumbnails } from '@/lib/renderUtils';
import { PDFDocument, degrees } from 'pdf-lib';

export default function OrganizePDFClient() {
  const [files, setFiles] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const addFileInputRef = useRef(null);

  const processNewFile = async (file, currentFileIndex) => {
    const thumbnails = await generateAllThumbnails(file, 150);
    return thumbnails.map((thumbnail) => ({
      id: `${currentFileIndex}-${thumbnail.pageNumber - 1}`,
      fileIndex: currentFileIndex,
      pageIndexInFile: thumbnail.pageNumber - 1,
      rotation: 0,
      dataUrl: thumbnail.dataUrl,
      fileName: file.name,
    }));
  };

  const addFilesToWorkspace = async (selectedFiles) => {
    const fileList = Array.from(selectedFiles || []).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    if (fileList.length === 0) return;

    setLoading(true);
    setDone(false);

    try {
      const processedPages = [];
      const updatedFiles = [...files];

      for (const file of fileList) {
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
  };

  const handleFilesSelected = async (selectedFiles) => {
    await addFilesToWorkspace(selectedFiles);
  };

  const handleAddMoreFiles = async (event) => {
    await addFilesToWorkspace(event.target.files);
    event.target.value = '';
  };

  const rotatePage = (index, direction = 90) => {
    setDone(false);
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
    setDone(false);
    setPages((prev) => prev.filter((_, pageIndex) => pageIndex !== index));
  };

  const rotateAllPages = (direction = 90) => {
    setDone(false);
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        rotation: (page.rotation + direction) % 360,
      }))
    );
  };

  const clearWorkspace = () => {
    setFiles([]);
    setPages([]);
    setDone(false);
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
    setDragOverIndex(index);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (event, toIndex) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === toIndex) return;

    const updated = [...pages];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPages(updated);
    setDone(false);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    if (pages.length === 0) return;
    setProcessing(true);

    try {
      const compiledDoc = await PDFDocument.create();
      const loadedPdfs = [];

      for (const file of files) {
        const doc = await loadPdf(file);
        loadedPdfs.push(doc);
      }

      for (const pageConfig of pages) {
        const srcDoc = loadedPdfs[pageConfig.fileIndex];
        const [copiedPage] = await compiledDoc.copyPages(srcDoc, [pageConfig.pageIndexInFile]);

        if (pageConfig.rotation > 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pageConfig.rotation));
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

  const preview = (
    <div className="organize-page-grid">
      {pages.map((page, index) => {
        const isDragging = dragIndex === index;
        const isDropTarget = dragOverIndex === index && dragIndex !== null;

        return (
          <article
            key={`${page.id}-${index}`}
            className={`organize-page-card ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(event) => handleDragOver(event, index)}
            onDragEnd={handleDragEnd}
            onDrop={(event) => handleDrop(event, index)}
          >
            <div className="organize-page-order">{index + 1}</div>
            <div className="organize-page-actions">
              <button type="button" className="merge-icon-button" onClick={() => rotatePage(index, 90)} aria-label={`Rotate page ${index + 1}`}>
                Rotate
              </button>
              <button type="button" className="merge-remove-button" onClick={() => removePage(index)} aria-label={`Remove page ${index + 1}`}>
                <ToolIcon name="x" size={14} />
              </button>
            </div>

            <div className="organize-page-paper">
              {/* eslint-disable-next-line @next/next/no-img-element -- Page previews are generated as client-side data URLs. */}
              <img
                src={page.dataUrl}
                alt={`Page ${index + 1}`}
                style={{ transform: `rotate(${page.rotation}deg)` }}
                draggable={false}
              />
            </div>

            <div className="organize-page-meta">
              <strong>Page {index + 1}</strong>
              <span title={page.fileName}>{page.fileName}</span>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <ToolPageLayout
      title="Organize PDF"
      description="Visual editor to sort, rotate, delete, or merge multiple PDFs client-side."
      icon="reorder"
      iconColor="var(--tool-organize)"
      showHeader={pages.length === 0}
      layoutMode={pages.length > 0 ? 'page-preview' : 'page-scroll'}
    >
      {pages.length === 0 && !loading ? (
        <FileDropzone
          accept=".pdf"
          multiple={true}
          onFilesSelected={handleFilesSelected}
          label="Select PDF files"
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
        <PageToolWorkspace
          title="Organize PDF"
          description="Drag pages to reorder, rotate pages, or remove unwanted pages."
          icon="reorder"
          iconColor="var(--tool-organize)"
          ariaLabel="Organize PDF settings"
          preview={preview}
          footer={(
            <>
              <button className="btn btn-primary btn-lg btn-attention" onClick={handleSave} disabled={processing || pages.length === 0} id="organize-save-button">
                {processing ? 'Compiling...' : 'Save New PDF'}
                <ToolIcon name="download" size={16} />
              </button>
              <button type="button" className="btn btn-secondary" onClick={clearWorkspace} disabled={processing}>
                Start over
              </button>
            </>
          )}
        >
          <div className="page-control-stat">
            <span>Total pages</span>
            <strong>{pages.length}</strong>
          </div>

          <div className="merge-summary-list">
            <div>
              <span className="ink-muted">Files</span>
              <strong>{files.length}</strong>
            </div>
            <div>
              <span className="ink-muted">Output</span>
              <strong>organized.pdf</strong>
            </div>
          </div>

          <button type="button" className="merge-add-card" onClick={() => addFileInputRef.current?.click()} disabled={loading || processing}>
            <ToolIcon name="upload" size={18} />
            <span>Add PDF files</span>
          </button>
          <input
            ref={addFileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleAddMoreFiles}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <button type="button" className="btn btn-secondary" onClick={() => rotateAllPages(90)} disabled={processing || pages.length === 0}>
            Rotate All Right
          </button>

          <div className="page-help-note">
            <ToolIcon name="reorder" size={16} />
            <span>Drag page cards on the left to reorder. Use Rotate or Remove on each card for page-level edits.</span>
          </div>

          {done && <div className="merge-success">Save successful. Your organized PDF has been downloaded.</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}

