'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import EditElementOverlay from '@/components/EditElementOverlay';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import { exportEditedPdf } from '@/lib/editPdfExport';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { loadPdfForRender, getPdfjs, generateAllThumbnails } from '@/lib/renderUtils';
import { extractPageLayout } from '@/lib/pdfLayout';
import { layoutToBlocks, sampleBackground, sampleSolidInk, estimateWeightBoost } from '@/lib/pdfTextBlocks';

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

const EDITOR_TOOLS = [
  { id: 'edit-text', label: 'Edit text', icon: 'edit' },
  { id: 'select', label: 'Select', icon: 'check' },
  { id: 'text', label: 'Add text', icon: 'forms' },
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'erase', label: 'Erase', icon: 'redact' },
  { id: 'highlight', label: 'Highlight', icon: 'watermark' },
  { id: 'draw', label: 'Draw', icon: 'sign' },
  { id: 'shape-rect', label: 'Box', icon: 'crop' },
  { id: 'shape-line', label: 'Line', icon: 'hash' },
];

export default function EditPDFClient() {
  const deliver = useResultHandoff('edit-pdf');
  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Active Tool: 'edit-text', 'select', 'text', 'image', 'erase', 'highlight', 'draw', 'shape-rect', 'shape-line'
  const [activeTool, setActiveTool] = useState('edit-text');
  const [activeColor, setActiveColor] = useState('#141320');
  const [textSize, setTextSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [isBold, setIsBold] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  // Store user added/edited elements per page: { [pageIdx]: [ { id, type, x, y, width, height, ... } ] }
  const [elements, setElements] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  // Extracted native PDF text blocks / paragraphs: { [pageIdx]: [ { id, str, x, y, width, height, fontSize }, ... ] }
  const [extractedTextBlocks, setExtractedTextBlocks] = useState({});
  const [pagePt, setPagePt] = useState({ width: 612, height: 792 }); // current page size in PDF points
  const [isItalic, setIsItalic] = useState(false);
  const [notice, setNotice] = useState('');
  
  // Undo history stack
  const [history, setHistory] = useState([]);

  // Page Rotations & Deleted Pages
  const [pageRotations, setPageRotations] = useState({});
  const [deletedPages, setDeletedPages] = useState(new Set());

  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [renderingPage, setRenderingPage] = useState(false);

  const canvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const workspaceRef = useRef(null);
  const imageInputRef = useRef(null);
  const renderTaskRef = useRef(null);
  const stageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const zoomIn = useCallback(() => setZoom((z) => ZOOM_LEVELS.find((l) => l > z) ?? z), []);
  const zoomOut = useCallback(() => setZoom((z) => [...ZOOM_LEVELS].reverse().find((l) => l < z) ?? z), []);

  // Ctrl (or Cmd) + scroll over the page zooms instead of scrolling. Needs a non-passive listener.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [file, zoomIn, zoomOut]);

  // Page strip thumbnails, tied to the file they were made from.
  const [thumbState, setThumbState] = useState({ file: null, list: [] });
  useEffect(() => {
    if (!file) return undefined;
    let cancelled = false;
    generateAllThumbnails(file, 110)
      .then((list) => { if (!cancelled) setThumbState({ file, list }); })
      .catch(() => { if (!cancelled) setThumbState({ file, list: [] }); });
    return () => { cancelled = true; };
  }, [file]);
  const pageThumbs = thumbState.file === file ? thumbState.list : null;
  
  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  // Shape / Box creation state
  const [isCreatingBox, setIsCreatingBox] = useState(false);
  const [boxStart, setBoxStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);

  // Dragging & Resizing element state
  const [dragState, setDragState] = useState(null);

  // Preset color options
  const COLOR_PRESETS = [
    { label: 'Dark Ink', value: '#141320' },
    { label: 'Brand Purple', value: '#5e6ad2' },
    { label: 'White / Erase', value: '#ffffff' },
    { label: 'Red / Alert', value: '#ff4d4f' },
    { label: 'Highlight Yellow', value: '#ffc107' },
    { label: 'Ocean Blue', value: '#2196f3' },
    { label: 'Emerald Green', value: '#00b473' },
  ];

  // Stamp Presets
  const STAMP_PRESETS = [
    { label: 'APPROVED', color: '#00b473' },
    { label: 'CONFIDENTIAL', color: '#ff4d4f' },
    { label: 'DRAFT', color: '#ff9f43' },
    { label: 'FINAL', color: '#5e6ad2' },
    { label: 'COMPLETED', color: '#2196f3' },
    { label: 'REJECTED', color: '#d63384' },
  ];

  // Save state snapshot for Undo
  const saveSnapshot = useCallback(() => {
    setHistory((prev) => [...prev.slice(-20), JSON.stringify(elements)]);
  }, [elements]);

  // Undo last action
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setElements(JSON.parse(lastState));
    setSelectedId(null);
  };

  // Helper: Prepare uploaded image for PDF-lib
  const prepareImageForPdf = async (imageFile) => {
    const isPng = imageFile.type.includes('png');
    const isJpg = imageFile.type.includes('jpeg') || imageFile.type.includes('jpg');
    
    const dataUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(imageFile);
    });

    if (isPng || isJpg) {
      const bytes = await imageFile.arrayBuffer();
      return { dataUrl, bytes, format: isPng ? 'png' : 'jpg' };
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement('canvas');
        cvs.width = img.width || 400;
        cvs.height = img.height || 400;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);
        cvs.toBlob(async (blob) => {
          const bytes = await blob.arrayBuffer();
          resolve({ dataUrl: cvs.toDataURL('image/png'), bytes, format: 'png' });
        }, 'image/png');
      };
      img.src = dataUrl;
    });
  };

  // Load PDF for background rendering
  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setElements({});
    setExtractedTextBlocks({});
    setHistory([]);
    setPageRotations({});
    setDeletedPages(new Set());
    setSelectedId(null);
    setCurrentPageIndex(0);

    try {
      const doc = await loadPdfForRender(f);
      setPdfRenderDoc(doc);
      setTotalPages(doc.numPages);
    } catch (err) {
      alert('Error loading PDF: ' + err.message);
    }
  }, []);

  // Redraw freehand strokes on overlay canvas
  const redrawCurrentPageDrawings = useCallback(() => {
    const dCanvas = drawingCanvasRef.current;
    if (!dCanvas) return;
    const ctx = dCanvas.getContext('2d');
    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);

    const pageEls = elements[currentPageIndex] || [];
    pageEls.forEach((el) => {
      if (el.type === 'draw' && el.points && el.points.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.strokeWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(el.points[0][0] * dCanvas.width, el.points[0][1] * dCanvas.height);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i][0] * dCanvas.width, el.points[i][1] * dCanvas.height);
        }
        ctx.stroke();
      }
    });
  }, [elements, currentPageIndex]);

  // Render current page to canvas & extract native text layer grouped into paragraphs
  const renderCurrentPage = useCallback(async () => {
    if (!pdfRenderDoc || !canvasRef.current) return;
    
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore
      }
      renderTaskRef.current = null;
    }

    setRenderingPage(true);
    try {
      const pageNum = currentPageIndex + 1;
      const canvas = canvasRef.current;
      const page = await pdfRenderDoc.getPage(pageNum);
      
      const rot = ((page.rotate || 0) + (pageRotations[currentPageIndex] || 0)) % 360;
      const viewport = page.getViewport({ scale: 1.5 * Math.max(1, zoom), rotation: rot });
      const drawingViewport = page.getViewport({ scale: 1.5, rotation: rot });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
      });

      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;

      // Extract the native text layer as paragraph blocks (real fonts, sizes, positions)
      const pdfjs = await getPdfjs();
      const layout = await extractPageLayout(page, pdfjs, { colors: false, images: false, rotation: rot });
      const paragraphBlocks = layoutToBlocks(layout, `extracted-${currentPageIndex}`);
      setPagePt({ width: layout.width, height: layout.height });

      setExtractedTextBlocks((prev) => ({
        ...prev,
        [currentPageIndex]: paragraphBlocks,
      }));

        if (drawingCanvasRef.current) {
          drawingCanvasRef.current.width = drawingViewport.width;
          drawingCanvasRef.current.height = drawingViewport.height;
          redrawCurrentPageDrawings();
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      } finally {
        setRenderingPage(false);
      }
    }, [pdfRenderDoc, currentPageIndex, pageRotations, redrawCurrentPageDrawings, zoom]);

  useEffect(() => {
    let active = true;
    if (pdfRenderDoc) {
      Promise.resolve().then(() => {
        if (active) renderCurrentPage();
      });
    }
    return () => {
      active = false;
    };
  }, [pdfRenderDoc, renderCurrentPage]);

  useEffect(() => {
    redrawCurrentPageDrawings();
  }, [redrawCurrentPageDrawings]);

  // Convert a native PDF paragraph into a live editable element. The original text is covered
  // with the page's own background colour and re-drawn in the same font, size and colour.
  const handleSelectExtractedText = (block) => {
    const existing = (elements[currentPageIndex] || []).find((el) => el.sourceBlock === block.id);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    saveSnapshot();

    let bg = '#ffffff';
    let ink = block.color;
    let boost = 0;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const box = {
          x: block.x * canvas.width,
          y: block.y * canvas.height,
          w: block.width * canvas.width,
          h: block.height * canvas.height,
        };
        bg = sampleBackground(img, box);
        ink = sampleSolidInk(img, box, bg) || block.color;
        boost = estimateWeightBoost(img, canvas.width / pagePt.width, block, bg, ink);
      } catch {
        // keep defaults
      }
    }

    const uid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : block.id;
    const whiteoutEl = {
      id: `el-whiteout-${uid}`,
      type: 'erase',
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      color: bg,
      linkedTo: `el-text-${uid}`,
    };
    const editableTextEl = {
      id: `el-text-${uid}`,
      type: 'text',
      x: block.textX,
      y: block.textY,
      width: Math.min(1 - block.textX, block.textWidth * 1.04 + 0.004),
      height: block.height,
      text: block.str,
      origLines: block.lines,
      sourceBlock: block.id,
      color: ink,
      size: block.fontSize,
      lineHeight: block.lineHeight,
      fontFamily: block.family,
      isBold: block.bold,
      isItalic: block.italic,
      boost,
    };

    setElements((prev) => ({
      ...prev,
      [currentPageIndex]: [...(prev[currentPageIndex] || []), whiteoutEl, editableTextEl],
    }));
    setSelectedId(editableTextEl.id);
    setFontFamily(block.family);
    setIsBold(block.bold);
    setIsItalic(block.italic);
    setTextSize(Math.round(block.fontSize));
    setNotice(
      block.mixed
        ? 'This paragraph mixes several styles (e.g. bold and regular). It is edited with a single style.'
        : ''
    );
  };

  // Add Element Helper
  const addElementToPage = (newEl) => {
    saveSnapshot();
    setElements((prev) => ({
      ...prev,
      [currentPageIndex]: [...(prev[currentPageIndex] || []), newEl],
    }));
    setSelectedId(newEl.id);
  };

  // Image Upload Choice
  const handleImageFileChange = async (e) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;
    try {
      const prepared = await prepareImageForPdf(imgFile);
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'img-new';
      // Start at the image's own proportions: 35% of the page wide, or shorter if that would be too tall.
      const natural = await new Promise((resolve) => {
        const probe = new Image();
        probe.onload = () => resolve({ width: probe.naturalWidth || 1, height: probe.naturalHeight || 1 });
        probe.onerror = () => resolve({ width: 4, height: 3 });
        probe.src = prepared.dataUrl;
      });
      const aspect = natural.width / natural.height;
      let width = 0.35;
      let height = (width * pagePt.width) / aspect / pagePt.height;
      if (height > 0.5) {
        height = 0.5;
        width = (height * pagePt.height * aspect) / pagePt.width;
      }
      const newEl = {
        id: `el-img-${id}`,
        type: 'image',
        x: (1 - width) / 2,
        y: Math.max(0, (1 - height) / 2 - 0.1),
        width,
        height,
        aspect,
        dataUrl: prepared.dataUrl,
        bytes: prepared.bytes,
        format: prepared.format,
      };
      addElementToPage(newEl);
      setActiveTool('select');
    } catch (err) {
      alert('Error loading image: ' + err.message);
    }
    e.target.value = '';
  };

  // Insert Preset Stamp
  const insertStamp = (stampObj) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'stamp-new';
    const newEl = {
      id: `el-stamp-${id}`,
      type: 'stamp',
      text: stampObj.label,
      color: stampObj.color,
      x: 0.35,
      y: 0.3,
      width: 0.3,
      height: 0.08,
    };
    addElementToPage(newEl);
    setActiveTool('select');
  };

  const deleteElement = useCallback((id) => {
    saveSnapshot();
    setElements((prev) => ({
      ...prev,
      [currentPageIndex]: (prev[currentPageIndex] || []).filter((el) => el.id !== id),
    }));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, [currentPageIndex, saveSnapshot]);

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e) => {
    setSelectedId(null);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (activeTool === 'text') {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'txt-1';
      const newEl = {
        id: `el-${id}`,
        type: 'text',
        x,
        y,
        width: 0.3,
        height: 0.08,
        text: 'Type text here',
        color: activeColor,
        size: textSize,
        fontFamily,
        isBold,
        isItalic,
      };
      addElementToPage(newEl);
      setActiveTool('select');
      return;
    }

    if (
      activeTool === 'erase' ||
      activeTool === 'highlight' ||
      activeTool === 'shape-rect' ||
      activeTool === 'shape-line'
    ) {
      setIsCreatingBox(true);
      setBoxStart({ x, y });
      setCurrentBox({ x, y, width: 0.01, height: 0.01 });
      return;
    }

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentStroke([[x, y]]);
    }
  };

  // Canvas Mouse Move
  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (isDrawing && activeTool === 'draw') {
      setCurrentStroke((prev) => {
        const updated = [...prev, [x, y]];
        const dCanvas = drawingCanvasRef.current;
        if (dCanvas) {
          const ctx = dCanvas.getContext('2d');
          ctx.beginPath();
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(prev[prev.length - 1][0] * dCanvas.width, prev[prev.length - 1][1] * dCanvas.height);
          ctx.lineTo(x * dCanvas.width, y * dCanvas.height);
          ctx.stroke();
        }
        return updated;
      });
      return;
    }

    if (isCreatingBox && boxStart) {
      const left = Math.min(boxStart.x, x);
      const top = Math.min(boxStart.y, y);
      const width = Math.max(0.02, Math.abs(x - boxStart.x));
      const height = Math.max(0.02, Math.abs(y - boxStart.y));
      setCurrentBox({ x: left, y: top, width, height });
      return;
    }

    if (dragState && canvasRef.current) {
      const dx = (e.clientX - dragState.startX) / rect.width;
      const dy = (e.clientY - dragState.startY) / rect.height;

      setElements((prev) => {
        const pageEls = prev[currentPageIndex] || [];
        const updated = pageEls.map((el) => {
          if (el.id !== dragState.id) return el;
          if (dragState.mode === 'move') {
            return {
              ...el,
              x: Math.max(0, Math.min(1 - el.width, dragState.initX + dx)),
              y: Math.max(0, Math.min(1 - el.height, dragState.initY + dy)),
            };
          } else if (dragState.mode === 'resize' && el.type === 'image' && el.aspect) {
            // Images keep their proportions: height follows width, and both stay on the page.
            const toHeight = (w) => (w * rect.width) / el.aspect / rect.height;
            const maxWidth = Math.min(1 - el.x, ((1 - el.y) * rect.height * el.aspect) / rect.width);
            const newWidth = Math.max(0.04, Math.min(maxWidth, dragState.initW + dx));
            return { ...el, width: newWidth, height: toHeight(newWidth) };
          } else if (dragState.mode === 'resize') {
            const newWidth = Math.max(0.04, dragState.initW + dx);
            const newHeight = Math.max(0.02, dragState.initH + dy);
            const sizeDelta = Math.round(dx * 45);
            const newSize = dragState.initSize ? Math.max(10, Math.min(82, dragState.initSize + sizeDelta)) : el.size;
            return {
              ...el,
              width: newWidth,
              height: newHeight,
              size: newSize,
            };
          }
          return el;
        });
        return { ...prev, [currentPageIndex]: updated };
      });
    }
  };

  // Canvas Mouse Up
  const handleCanvasMouseUp = () => {
    if (isDrawing && activeTool === 'draw') {
      setIsDrawing(false);
      if (currentStroke.length >= 2) {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'draw-1';
        const newEl = {
          id: `el-${id}`,
          type: 'draw',
          color: activeColor,
          strokeWidth,
          points: currentStroke,
        };
        addElementToPage(newEl);
      }
      setCurrentStroke([]);
      return;
    }

    if (isCreatingBox && currentBox) {
      setIsCreatingBox(false);
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'box-1';
      const newEl = {
        id: `el-${id}`,
        type: activeTool,
        x: currentBox.x,
        y: currentBox.y,
        width: currentBox.width,
        height: currentBox.height,
        color: activeTool === 'erase' ? '#ffffff' : activeColor,
        opacity: activeTool === 'highlight' ? 0.35 : 1.0,
        strokeWidth: 2,
      };
      addElementToPage(newEl);
      setBoxStart(null);
      setCurrentBox(null);
      setActiveTool('select');
      return;
    }

    if (dragState) {
      setDragState(null);
    }
  };

  const generateUniqueId = (prefix) => {
    const uid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id-1';
    return `${prefix}-${uid}`;
  };

  // Duplicate Element
  const duplicateElement = (id) => {
    const pageEls = elements[currentPageIndex] || [];
    const el = pageEls.find((item) => item.id === id);
    if (!el) return;
    const copy = {
      ...el,
      id: generateUniqueId('el-dup'),
      x: Math.min(0.85, el.x + 0.03),
      y: Math.min(0.85, el.y + 0.03),
    };
    addElementToPage(copy);
  };

  // Keydown handler for Delete/Backspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        deleteElement(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, currentPageIndex, deleteElement]);

  // Toolbar changes also restyle the selected text box
  const applyToSelectedText = (props) => {
    const sel = (elements[currentPageIndex] || []).find((el) => el.id === selectedId);
    if (sel && sel.type === 'text') updateElementProps(sel.id, props);
  };

  const updateElementProps = (id, newProps) => {
    setElements((prev) => ({
      ...prev,
      [currentPageIndex]: (prev[currentPageIndex] || []).map((el) =>
        el.id === id ? { ...el, ...newProps } : el
      ),
    }));
  };

  // Rotate Page 90 deg
  const rotateCurrentPage = () => {
    setPageRotations((prev) => ({
      ...prev,
      [currentPageIndex]: ((prev[currentPageIndex] || 0) + 90) % 360,
    }));
  };

  // Delete active page
  const deleteCurrentPage = () => {
    if (totalPages <= 1) {
      alert('Cannot delete the only page in the PDF.');
      return;
    }
    if (confirm(`Delete Page ${currentPageIndex + 1} from PDF?`)) {
      saveSnapshot();
      const updatedDeleted = new Set(deletedPages);
      updatedDeleted.add(currentPageIndex);
      setDeletedPages(updatedDeleted);
      if (currentPageIndex > 0) {
        setCurrentPageIndex((prev) => prev - 1);
      }
    }
  };

  const clearCurrentPageMarkups = () => {
    if (confirm('Clear all added annotations, text edits, images, and drawings on this page?')) {
      saveSnapshot();
      setElements((prev) => ({ ...prev, [currentPageIndex]: [] }));
      setSelectedId(null);
    }
  };

  const clearAllFiles = () => {
    setFile(null);
    setPdfRenderDoc(null);
    setDone(false);
    setElements({});
    setExtractedTextBlocks({});
    setHistory([]);
    setPageRotations({});
    setDeletedPages(new Set());
    setSelectedId(null);
  };

  // Compile and Export final PDF
  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const { bytes: updatedBytes, replacedChars } = await exportEditedPdf({ file, elements, pageRotations, deletedPages });
      if (replacedChars.length) {
        // The built-in PDF fonts only cover Western European characters.
        alert(`These characters aren't supported by the editor's fonts (Latin, Cyrillic, Greek, Vietnamese, Hindi, Arabic, Hebrew, Chinese, Japanese, Korean) and were replaced with "?": ${replacedChars.map((c) => (/[\p{C}\s]/u.test(c) ? 'U+' + c.codePointAt(0).toString(16).toUpperCase() : c)).join(' ')}`);
      }
      await deliver(updatedBytes, file.name.replace('.pdf', '-edited.pdf'), 'application/pdf');
      setDone(true);
    } catch (err) {
      alert('Error exporting PDF: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const totalEditsCount = Object.values(elements).reduce((acc, pageEls) => acc + pageEls.length, 0);
  const currentExtractedBlocks = extractedTextBlocks[currentPageIndex] || [];

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Edit existing PDF text directly by paragraph, insert text boxes, images, shapes, stamps, erase text, and rotate pages."
      icon="edit"
      iconColor="var(--tool-edit)"
      showHeader={!file}
      layoutMode={file ? 'app-fixed' : 'page-scroll'}
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      {!file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Drop your PDF to start editing"
          id="edit-dropzone"
        />
      ) : (
        <div className="editor">
          <header className="editor-bar">
            <button type="button" className="editor-icon-btn" onClick={clearAllFiles} aria-label="Back: close this file" title="Close this file">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div className="editor-file">
              <strong title={file.name}>{file.name}</strong>
              <span>Edited in your browser · not uploaded</span>
            </div>
            <div className="editor-tools" role="toolbar" aria-label="Edit tools">
              {EDITOR_TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="editor-tool"
                  aria-pressed={activeTool === t.id}
                  onClick={() => {
                    if (t.id === 'image') {
                      imageInputRef.current?.click();
                    } else {
                      setActiveTool(t.id);
                    }
                  }}
                >
                  <ToolIcon name={t.icon} size={16} />
                  {t.label}
                </button>
              ))}
            </div>
            <button type="button" className="editor-icon-btn editor-undo" disabled={history.length === 0} onClick={handleUndo} aria-label="Undo" title="Undo last action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
            </button>
            <button type="button" className="btn btn-primary editor-save" onClick={handleSave} disabled={processing || renderingPage} id="save-pdf-button">
              {processing ? 'Saving…' : 'Save PDF'}
            </button>
          </header>

          <div className="editor-body">
            <nav className="editor-pages" aria-label="Pages">
              {pageThumbs === null ? (
                <span className="editor-pages-loading">Loading pages…</span>
              ) : (
                pageThumbs
                  .filter((thumb) => !deletedPages.has(thumb.pageNumber - 1))
                  .map((thumb) => {
                    const index = thumb.pageNumber - 1;
                    return (
                      <button
                        key={thumb.pageNumber}
                        type="button"
                        className="editor-page-thumb"
                        aria-current={index === currentPageIndex ? 'page' : undefined}
                        onClick={() => setCurrentPageIndex(index)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- thumbnails are generated in the browser */}
                        <img
                          src={thumb.dataUrl}
                          alt={`Page ${thumb.pageNumber}`}
                          style={{ transform: `rotate(${pageRotations[index] || 0}deg)` }}
                        />
                        <span>{thumb.pageNumber}</span>
                      </button>
                    );
                  })
              )}
            </nav>

            <div className="editor-stage" ref={stageRef}>
              <div className="editor-stage-bar">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPageIndex === 0}
                  onClick={() => setCurrentPageIndex((prev) => prev - 1)}
                  aria-label="Previous page"
                >
                  ←
                </button>
                <span>Page {currentPageIndex + 1} of {totalPages}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPageIndex === totalPages - 1}
                  onClick={() => setCurrentPageIndex((prev) => prev + 1)}
                  aria-label="Next page"
                >
                  →
                </button>
                <div className="editor-zoom" role="group" aria-label="Zoom">
                  <button type="button" onClick={zoomOut} disabled={zoom <= ZOOM_LEVELS[0]} aria-label="Zoom out">−</button>
                  <button type="button" className="editor-zoom-value" onClick={() => setZoom(1)} title="Fit to width">
                    {Math.round(zoom * 100)}%
                  </button>
                  <button type="button" onClick={zoomIn} disabled={zoom >= ZOOM_LEVELS.at(-1)} aria-label="Zoom in">+</button>
                </div>
              </div>

              {notice && <p className="editor-notice">ℹ {notice}</p>}

              <div
                ref={workspaceRef}
                className="editor-page"
                style={{
                  // Tools that draw on the page need the finger; the others leave it free to scroll.
                  touchAction: activeTool === 'draw' || activeTool.startsWith('shape') || activeTool === 'erase' || activeTool === 'highlight' ? 'none' : 'manipulation',
                  width: `calc(min(100%, 740px) * ${zoom})`,
                  maxWidth: 'none',
                  cursor: activeTool === 'edit-text' ? 'pointer' : activeTool === 'text' ? 'text' : activeTool === 'draw' || activeTool.startsWith('shape') || activeTool === 'erase' || activeTool === 'highlight' ? 'crosshair' : 'default',
                }}
                onPointerDown={handleCanvasMouseDown}
                onPointerMove={handleCanvasMouseMove}
                onPointerUp={handleCanvasMouseUp}
              >
                {/* Underlying Rendered PDF Page */}
                <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />

                {/* Overlay Canvas for Freehand Drawing */}
                <canvas
                  ref={drawingCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    pointerEvents: activeTool === 'draw' ? 'auto' : 'none',
                  }}
                />

                {/* Box creation preview overlay */}
                {isCreatingBox && currentBox && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${currentBox.x * 100}%`,
                      top: `${currentBox.y * 100}%`,
                      width: `${currentBox.width * 100}%`,
                      height: `${currentBox.height * 100}%`,
                      backgroundColor: activeTool === 'erase' ? '#ffffff' : activeTool === 'highlight' ? activeColor : 'transparent',
                      opacity: activeTool === 'highlight' ? 0.35 : 1,
                      border: activeTool === 'shape-rect' ? `2px solid ${activeColor}` : '1px dashed var(--primary)',
                      zIndex: 4,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* DOM Overlay Layer for Interactive Added/Edited Elements */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 5,
                    pointerEvents: 'none',
                  }}
                >
                  {(elements[currentPageIndex] || []).map((el) => (
                    <EditElementOverlay
                      key={el.id}
                      el={el}
                      selectedId={selectedId}
                      pagePt={pagePt}
                      setSelectedId={setSelectedId}
                      setDragState={setDragState}
                      updateElementProps={updateElementProps}
                      duplicateElement={duplicateElement}
                      deleteElement={deleteElement}
                    />
                  ))}
                </div>

                {/* Extracted Native PDF Text Layer (zIndex 6: Click to Edit original PDF paragraph text) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 6,
                    pointerEvents: 'none',
                  }}
                >
                  {currentExtractedBlocks
                    .filter((block) => !(elements[currentPageIndex] || []).some((el) => el.sourceBlock === block.id))
                    .map((block) => (
                    <div
                      key={block.id}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handleSelectExtractedText(block);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title="Click to edit or replace this paragraph text"
                      style={{
                        position: 'absolute',
                        left: `${block.x * 100}%`,
                        top: `${block.y * 100}%`,
                        width: `${block.width * 100}%`,
                        height: `${block.height * 100}%`,
                        border: activeTool === 'edit-text' ? '1px dashed rgba(94, 106, 210, 0.5)' : 'none',
                        backgroundColor: activeTool === 'edit-text' ? 'rgba(94, 106, 210, 0.05)' : 'transparent',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        pointerEvents: activeTool === 'edit-text' || activeTool === 'select' ? 'auto' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(94, 106, 210, 0.2)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = activeTool === 'edit-text' ? 'rgba(94, 106, 210, 0.05)' : 'transparent';
                        e.currentTarget.style.borderColor = activeTool === 'edit-text' ? 'rgba(94, 106, 210, 0.5)' : 'transparent';
                      }}
                    />
                  ))}
                </div>

                {/* Rendering indicator */}
                {renderingPage && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                  >
                    <p className="caption" style={{ color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: '20px' }}>
                      Rendering page...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className="editor-panel" aria-label="Edit options">
              <section>
                <h2>Colour</h2>
                <div className="editor-swatches">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="editor-swatch"
                      aria-label={preset.label}
                      aria-pressed={activeColor === preset.value}
                      onClick={() => setActiveColor(preset.value)}
                      style={{ backgroundColor: preset.value, '--swatch': preset.value }}
                    />
                  ))}
                  <input
                    type="color"
                    className="editor-swatch-custom"
                    value={activeColor}
                    onChange={(e) => { setActiveColor(e.target.value); applyToSelectedText({ color: e.target.value }); }}
                    aria-label="Custom colour"
                    title="Custom colour"
                  />
                </div>
              </section>

              {(activeTool === 'text' || activeTool === 'edit-text') && (
                <section>
                  <h2>Text</h2>
                  <label className="ws-field">
                    <span>Font</span>
                    <select
                      className="input"
                      value={fontFamily}
                      onChange={(e) => { setFontFamily(e.target.value); applyToSelectedText({ fontFamily: e.target.value }); }}
                    >
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times">Times Roman</option>
                      <option value="Courier">Courier</option>
                    </select>
                  </label>
                  <div className="editor-text-row">
                    <label className="ws-field">
                      <span>Size</span>
                      <select
                        className="input"
                        value={textSize}
                        onChange={(e) => { const v = parseInt(e.target.value); setTextSize(v); applyToSelectedText({ size: v }); }}
                      >
                        {[...new Set([8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 32, 40, 48, textSize])].sort((a, b) => a - b).map((s) => (
                          <option key={s} value={s}>{s} pt</option>
                        ))}
                      </select>
                    </label>
                    <div className="editor-style-toggles">
                      <button
                        type="button"
                        aria-pressed={isBold}
                        aria-label="Bold"
                        style={{ fontWeight: 800 }}
                        onClick={() => { setIsBold(!isBold); applyToSelectedText({ isBold: !isBold }); }}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        aria-pressed={isItalic}
                        aria-label="Italic"
                        style={{ fontStyle: 'italic' }}
                        onClick={() => { setIsItalic(!isItalic); applyToSelectedText({ isItalic: !isItalic }); }}
                      >
                        I
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h2>Stamps</h2>
                <div className="editor-stamps">
                  {STAMP_PRESETS.map((stamp) => (
                    <button
                      key={stamp.label}
                      type="button"
                      onClick={() => insertStamp(stamp)}
                      style={{ color: stamp.color, borderColor: stamp.color }}
                    >
                      + {stamp.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2>This page</h2>
                <div className="editor-page-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={rotateCurrentPage}>
                    <ToolIcon name="rotate" size={14} /> Rotate
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearCurrentPageMarkups}>
                    Clear edits
                  </button>
                  <button type="button" className="btn btn-danger-soft btn-sm" onClick={deleteCurrentPage}>
                    <ToolIcon name="trash" size={14} /> Delete page
                  </button>
                </div>
              </section>

              <p className="editor-help">
                <strong>Edit text</strong> lets you click any paragraph on the page to change it. {totalEditsCount} edit{totalEditsCount === 1 ? '' : 's'} so far.
              </p>
              {done && <p className="ws-note ws-note-good">✓ PDF saved.</p>}
            </aside>
          </div>
        </div>
      )}

      {done && (
        <ToastNotification
          message="✓ Edited PDF exported and downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
