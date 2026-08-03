'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdf, savePdf, downloadBlob } from '@/lib/pdfUtils';
import { loadPdfForRender } from '@/lib/renderUtils';
import { rgb, degrees, StandardFonts } from 'pdf-lib';

// Helper to group adjacent line items into full paragraph blocks
const groupTextItemsIntoParagraphs = (items) => {
  if (!items || items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 0.012) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  const paragraphs = [];
  let currentPara = null;

  for (const item of sorted) {
    if (!currentPara) {
      currentPara = {
        id: item.id,
        items: [item],
        str: item.str,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        fontSize: item.fontSize,
      };
    } else {
      const lastItem = currentPara.items[currentPara.items.length - 1];
      const verticalGap = item.y - (lastItem.y + lastItem.height);
      const isNextLine = Math.abs(item.y - lastItem.y) > 0.008;
      const fontMatch = Math.abs(item.fontSize - currentPara.fontSize) <= 4;
      const sameLineOrNextLine = verticalGap >= -0.015 && verticalGap <= 0.035 && fontMatch;

      if (sameLineOrNextLine) {
        currentPara.items.push(item);
        const separator = isNextLine ? '\n' : (currentPara.str.endsWith(' ') || item.str.startsWith(' ') ? '' : ' ');
        currentPara.str += separator + item.str;
        currentPara.x = Math.min(currentPara.x, item.x);
        currentPara.width = Math.max(currentPara.width, item.x + item.width - currentPara.x);
        currentPara.height = (item.y + item.height) - currentPara.y;
      } else {
        paragraphs.push(currentPara);
        currentPara = {
          id: item.id,
          items: [item],
          str: item.str,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          fontSize: item.fontSize,
        };
      }
    }
  }

  if (currentPara) {
    paragraphs.push(currentPara);
  }

  return paragraphs;
};

export default function EditPDFClient() {
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
      
      const rot = pageRotations[currentPageIndex] || 0;
      const viewport = page.getViewport({ scale: 1.5, rotation: rot });

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

      // Extract native PDF text layer
      const textContent = await page.getTextContent();
      const pageViewport = page.getViewport({ scale: 1.0, rotation: rot });

      const rawItems = textContent.items
        .filter((item) => item.str && item.str.trim().length > 0)
        .map((item, idx) => {
          const tx = item.transform[4];
          const ty = item.transform[5];
          const fontSize = Math.hypot(item.transform[0], item.transform[1]);

          const [ptX, ptY] = pageViewport.convertToViewportPoint(tx, ty);

          const xRatio = ptX / pageViewport.width;
          const yRatio = (ptY - fontSize * 0.85) / pageViewport.height;

          return {
            id: `extracted-${currentPageIndex}-${idx}`,
            str: item.str,
            x: Math.max(0, Math.min(0.96, xRatio)),
            y: Math.max(0, Math.min(0.96, yRatio)),
            width: Math.max(0.03, Math.min(0.95, (item.width || item.str.length * fontSize * 0.55) / pageViewport.width)),
            height: Math.max(0.018, Math.min(0.2, (item.height || fontSize * 1.3) / pageViewport.height)),
            fontSize: Math.max(10, Math.min(72, Math.round(fontSize))),
          };
        });

      // Group into full paragraphs
      const paragraphBlocks = groupTextItemsIntoParagraphs(rawItems);

      setExtractedTextBlocks((prev) => ({
        ...prev,
        [currentPageIndex]: paragraphBlocks,
      }));

        if (drawingCanvasRef.current) {
          drawingCanvasRef.current.width = viewport.width;
          drawingCanvasRef.current.height = viewport.height;
          redrawCurrentPageDrawings();
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      } finally {
        setRenderingPage(false);
      }
    }, [pdfRenderDoc, currentPageIndex, pageRotations, redrawCurrentPageDrawings]);

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

  // Convert native PDF paragraph block into live editable element (with whiteout background to delete original text)
  const handleSelectExtractedText = (block) => {
    saveSnapshot();

    const id1 = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'wo-' + block.id;
    const id2 = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tx-' + block.id;

    // 1. Whiteout box to cover original PDF paragraph text underneath
    const whiteoutEl = {
      id: `el-whiteout-${id1}`,
      type: 'erase',
      x: Math.max(0, block.x - 0.005),
      y: Math.max(0, block.y - 0.005),
      width: Math.min(1, block.width * 1.06),
      height: Math.min(1, block.height * 1.08),
      color: '#ffffff',
    };

    // 2. Live editable paragraph text element
    const editableTextEl = {
      id: `el-text-${id2}`,
      type: 'text',
      x: block.x,
      y: block.y,
      width: Math.max(0.2, block.width * 1.08),
      height: Math.max(0.06, block.height * 1.08),
      text: block.str,
      color: activeColor === '#ffffff' ? '#141320' : activeColor,
      size: block.fontSize || 16,
      fontFamily,
      isBold,
    };

    addElementToPage(whiteoutEl);
    addElementToPage(editableTextEl);
    setSelectedId(editableTextEl.id);
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
      const newEl = {
        id: `el-img-${id}`,
        type: 'image',
        x: 0.25,
        y: 0.25,
        width: 0.35,
        height: 0.25,
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

  // Add standard elements (text, image, shape, erase box)
  const handleAddText = () => {
    saveSnapshot();
    const newEl = {
      id: generateUniqueId('el-text'),
      type: 'text',
      x: 0.35,
      y: 0.4,
      width: 0.3,
      height: 0.08,
      text: 'Double click to edit text',
      color: activeColor === '#ffffff' ? '#141320' : activeColor,
      fontSize: activeFontSize,
      fontFamily: activeFont,
      fontWeight: 'normal',
      fontStyle: 'normal',
    };
    addElementToPage(newEl);
    setSelectedId(newEl.id);
  };

  const handleAddImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      saveSnapshot();
      const newEl = {
        id: generateUniqueId('el-img'),
        type: 'image',
        x: 0.3,
        y: 0.3,
        width: 0.35,
        height: 0.25,
        dataUrl: e.target.result,
      };
      addElementToPage(newEl);
      setSelectedId(newEl.id);
    };
    reader.readAsDataURL(file);
  };

  const handleAddShape = (shapeType) => {
    saveSnapshot();
    const newEl = {
      id: generateUniqueId(`el-${shapeType}`),
      type: 'shape',
      shapeType, // 'rect', 'circle', 'line'
      x: 0.4,
      y: 0.4,
      width: 0.2,
      height: 0.15,
      color: activeColor,
      strokeWidth: 2,
    };
    addElementToPage(newEl);
    setSelectedId(newEl.id);
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

  const hexToRgb = (hex) => {
    try {
      const bigint = parseInt(hex.replace('#', ''), 16);
      const r = ((bigint >> 16) & 255) / 255;
      const g = ((bigint >> 8) & 255) / 255;
      const b = (bigint & 255) / 255;
      return rgb(r, g, b);
    } catch {
      return rgb(0.36, 0.41, 0.82);
    }
  };

  // Compile and Export final PDF
  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const pdfDoc = await loadPdf(file);

      // 1. Remove deleted pages in reverse order
      const sortedDeleted = Array.from(deletedPages).sort((a, b) => b - a);
      for (const delIdx of sortedDeleted) {
        pdfDoc.removePage(delIdx);
      }

      // 2. Embed Standard Fonts
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const courier = await pdfDoc.embedFont(StandardFonts.Courier);
      const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

      const fontMap = {
        Helvetica: { regular: helvetica, bold: helveticaBold },
        Times: { regular: times, bold: timesBold },
        Courier: { regular: courier, bold: courierBold },
      };

      const pagesInDoc = pdfDoc.getPages();

      for (let pageIdx = 0; pageIdx < pagesInDoc.length; pageIdx++) {
        const page = pagesInDoc[pageIdx];
        const { width, height } = page.getSize();

        if (pageRotations[pageIdx]) {
          const currentRot = page.getRotation().angle || 0;
          page.setRotation(degrees((currentRot + pageRotations[pageIdx]) % 360));
        }

        const pageEls = elements[pageIdx] || [];

        for (const el of pageEls) {
          // A. Text Element (Handles multiline text strings)
          if (el.type === 'text' && el.text) {
            const lines = el.text.split('\n');
            const fontSize = el.size || 16;
            const selectedFontGroup = fontMap[el.fontFamily || 'Helvetica'] || fontMap.Helvetica;
            const chosenFont = el.isBold ? selectedFontGroup.bold : selectedFontGroup.regular;

            lines.forEach((lineText, lIdx) => {
              const targetX = el.x * width;
              const targetY = (1 - el.y) * height - fontSize - (lIdx * fontSize * 1.25);

              page.drawText(lineText, {
                x: Math.max(0, targetX),
                y: Math.max(0, targetY),
                size: fontSize,
                font: chosenFont,
                color: hexToRgb(el.color || '#141320'),
              });
            });
          }

          // B. Stamp Element
          else if (el.type === 'stamp' && el.text) {
            const stampW = (el.width || 0.3) * width;
            const stampH = (el.height || 0.08) * height;
            const stampX = el.x * width;
            const stampY = (1 - el.y - (el.height || 0.08)) * height;

            page.drawRectangle({
              x: stampX,
              y: stampY,
              width: stampW,
              height: stampH,
              borderColor: hexToRgb(el.color),
              borderWidth: 2.5,
              color: hexToRgb('#ffffff'),
            });

            page.drawText(el.text, {
              x: stampX + 12,
              y: stampY + stampH / 3,
              size: Math.min(18, stampH * 0.45),
              font: helveticaBold,
              color: hexToRgb(el.color),
            });
          }

          // C. Image Element
          else if (el.type === 'image' && el.bytes) {
            let embeddedImg;
            if (el.format === 'png') {
              embeddedImg = await pdfDoc.embedPng(el.bytes);
            } else {
              embeddedImg = await pdfDoc.embedJpg(el.bytes);
            }
            const imgW = (el.width || 0.35) * width;
            const imgH = (el.height || 0.25) * height;
            const imgX = el.x * width;
            const imgY = (1 - el.y - (el.height || 0.25)) * height;

            page.drawImage(embeddedImg, {
              x: imgX,
              y: imgY,
              width: imgW,
              height: imgH,
            });
          }

          // D. Erase / Whiteout Rectangle
          else if (el.type === 'erase') {
            const boxX = el.x * width;
            const boxH = (el.height || 0.05) * height;
            const boxY = (1 - el.y - (el.height || 0.05)) * height;
            const boxW = (el.width || 0.2) * width;

            page.drawRectangle({
              x: boxX,
              y: boxY,
              width: boxW,
              height: boxH,
              color: hexToRgb(el.color || '#ffffff'),
            });
          }

          // E. Highlight Rectangle
          else if (el.type === 'highlight') {
            const boxX = el.x * width;
            const boxH = (el.height || 0.05) * height;
            const boxY = (1 - el.y - (el.height || 0.05)) * height;
            const boxW = (el.width || 0.2) * width;

            page.drawRectangle({
              x: boxX,
              y: boxY,
              width: boxW,
              height: boxH,
              color: hexToRgb(el.color || '#ffc107'),
              opacity: el.opacity || 0.35,
            });
          }

          // F. Shape: Rectangle
          else if (el.type === 'shape-rect') {
            const boxX = el.x * width;
            const boxH = (el.height || 0.1) * height;
            const boxY = (1 - el.y - (el.height || 0.1)) * height;
            const boxW = (el.width || 0.2) * width;

            page.drawRectangle({
              x: boxX,
              y: boxY,
              width: boxW,
              height: boxH,
              borderColor: hexToRgb(el.color || '#5e6ad2'),
              borderWidth: el.strokeWidth || 2,
            });
          }

          // G. Shape: Line
          else if (el.type === 'shape-line') {
            const startX = el.x * width;
            const startY = (1 - el.y) * height;
            const endX = (el.x + (el.width || 0.2)) * width;
            const endY = (1 - el.y - (el.height || 0.1)) * height;

            page.drawLine({
              start: { x: startX, y: startY },
              end: { x: endX, y: endY },
              thickness: el.strokeWidth || 3,
              color: hexToRgb(el.color || '#5e6ad2'),
            });
          }

          // H. Freehand Vector Drawing
          else if (el.type === 'draw' && el.points && el.points.length >= 2) {
            for (let i = 0; i < el.points.length - 1; i++) {
              const p1 = el.points[i];
              const p2 = el.points[i + 1];

              page.drawLine({
                start: { x: p1[0] * width, y: (1 - p1[1]) * height },
                end: { x: p2[0] * width, y: (1 - p2[1]) * height },
                thickness: (el.strokeWidth || 3) * (width / 600),
                color: hexToRgb(el.color || '#5e6ad2'),
              });
            }
          }
        }
      }

      const updatedBytes = await savePdf(pdfDoc);
      downloadBlob(updatedBytes, file.name.replace('.pdf', '-edited.pdf'), 'application/pdf');
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
      layoutMode={file ? 'page-preview' : 'page-scroll'}
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
        <PageToolWorkspace
          title="Edit PDF"
          description="Click any paragraph or text on the document to edit or replace it. Insert text boxes, images, erase content, or add shapes."
          icon="edit"
          iconColor="var(--tool-edit)"
          file={file}
          onReset={clearAllFiles}
          ariaLabel="Edit PDF Workspace"
          preview={(
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              
              {/* Floating Top Editor Toolbar */}
              <div
                style={{
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--rounded-lg)',
                  padding: 'var(--space-xs) var(--space-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                }}
              >
                {/* Main Tool Categories */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                    {[
                      { id: 'edit-text', label: 'Edit PDF Text', icon: 'edit' },
                      { id: 'select', label: 'Select / Move', icon: 'check' },
                      { id: 'text', label: 'Add Text', icon: 'forms' },
                      { id: 'image', label: 'Add Image', icon: 'image' },
                      { id: 'erase', label: 'Erase / Whiteout', icon: 'redact' },
                      { id: 'highlight', label: 'Highlight', icon: 'watermark' },
                      { id: 'draw', label: 'Draw', icon: 'sign' },
                      { id: 'shape-rect', label: 'Rectangle', icon: 'crop' },
                      { id: 'shape-line', label: 'Line', icon: 'hash' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`btn ${activeTool === t.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                        onClick={() => {
                          if (t.id === 'image') {
                            imageInputRef.current?.click();
                          } else {
                            setActiveTool(t.id);
                          }
                        }}
                      >
                        <ToolIcon name={t.icon} size={13} style={{ marginRight: 4 }} />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Actions (Undo, Clear) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={history.length === 0}
                      onClick={handleUndo}
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      title="Undo last action"
                    >
                      ↩ Undo
                    </button>
                    <button
                      type="button"
                      className="btn btn-tertiary"
                      style={{ fontSize: '11px', color: 'var(--semantic-error)', padding: '4px 8px' }}
                      onClick={clearCurrentPageMarkups}
                    >
                      Clear Page
                    </button>
                  </div>
                </div>

                {/* Sub-formatting Toolbar (Fonts / Colors / Stamp Chips) */}
                <div style={{ borderTop: '1px solid var(--hairline-soft)', paddingTop: 'var(--space-xs)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                  
                  {/* Color Swatches */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="caption ink-subtle" style={{ fontSize: '11px' }}>Color:</span>
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        title={preset.label}
                        onClick={() => setActiveColor(preset.value)}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: preset.value,
                          border: activeColor === preset.value ? '2px solid var(--ink)' : '1px solid var(--hairline-strong)',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={activeColor}
                      onChange={(e) => setActiveColor(e.target.value)}
                      style={{ width: '20px', height: '20px', border: 'none', background: 'none', cursor: 'pointer' }}
                      title="Custom color"
                    />
                  </div>

                  {/* Text Controls */}
                  {(activeTool === 'text' || activeTool === 'edit-text') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        className="input"
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        style={{ fontSize: '11px', padding: '2px 6px', width: 'auto' }}
                      >
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times">Times Roman</option>
                        <option value="Courier">Courier</option>
                      </select>

                      <button
                        type="button"
                        className={`btn ${isBold ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 'bold' }}
                        onClick={() => setIsBold(!isBold)}
                      >
                        B
                      </button>

                      <select
                        className="input"
                        value={textSize}
                        onChange={(e) => setTextSize(parseInt(e.target.value))}
                        style={{ fontSize: '11px', padding: '2px 6px', width: 'auto' }}
                      >
                        {[12, 14, 16, 18, 20, 24, 32, 40, 48].map((s) => (
                          <option key={s} value={s}>{s}px</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Stamp Badges Picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="caption ink-subtle" style={{ fontSize: '11px' }}>Stamps:</span>
                    {STAMP_PRESETS.map((stamp) => (
                      <button
                        key={stamp.label}
                        type="button"
                        onClick={() => insertStamp(stamp)}
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: stamp.color,
                          backgroundColor: 'var(--surface-1)',
                          border: `1px solid ${stamp.color}`,
                          borderRadius: '4px',
                          padding: '2px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        + {stamp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Page Navigator Stepper & Page Action Tools */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={currentPageIndex === 0}
                    onClick={() => setCurrentPageIndex((prev) => prev - 1)}
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    ◀ Prev
                  </button>
                  <span className="body-sm ink-muted" style={{ fontWeight: 600 }}>
                    Page {currentPageIndex + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={currentPageIndex === totalPages - 1}
                    onClick={() => setCurrentPageIndex((prev) => prev + 1)}
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    Next ▶
                  </button>
                </div>

                {/* Page Transform Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={rotateCurrentPage}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                    title="Rotate active page 90 degrees"
                  >
                    <ToolIcon name="rotate" size={13} style={{ marginRight: 4 }} />
                    Rotate Page
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={deleteCurrentPage}
                    style={{ fontSize: '11px', padding: '4px 8px', color: '#ff4d4f' }}
                    title="Delete active page from document"
                  >
                    <ToolIcon name="trash" size={13} style={{ marginRight: 4 }} />
                    Delete Page
                  </button>
                </div>
              </div>

              {/* PDF Document Viewport Canvas Container */}
              <div
                ref={workspaceRef}
                style={{
                  position: 'relative',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-lg)',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  cursor: activeTool === 'edit-text' ? 'pointer' : activeTool === 'text' ? 'text' : activeTool === 'draw' || activeTool.startsWith('shape') || activeTool === 'erase' || activeTool === 'highlight' ? 'crosshair' : 'default',
                  width: '100%',
                  maxWidth: '740px',
                  margin: '0 auto',
                  userSelect: 'none',
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
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
                  {(elements[currentPageIndex] || []).map((el) => {
                    const isSelected = selectedId === el.id;

                    // 1. Text Element
                    if (el.type === 'text') {
                      return (
                        <div
                          key={el.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                            setDragState({
                              id: el.id,
                              mode: 'move',
                              startX: e.clientX,
                              startY: e.clientY,
                              initX: el.x,
                              initY: el.y,
                              initW: el.width,
                              initH: el.height,
                            });
                          }}
                          style={{
                            position: 'absolute',
                            left: `${el.x * 100}%`,
                            top: `${el.y * 100}%`,
                            width: `${(el.width || 0.2) * 100}%`,
                            color: el.color,
                            fontSize: `${el.size * 1.2}px`,
                            fontFamily: el.fontFamily || 'Helvetica',
                            fontWeight: el.isBold ? 'bold' : 'normal',
                            padding: '1px 3px',
                            border: isSelected ? '1.5px solid var(--primary)' : '1.5px transparent solid',
                            borderRadius: '3px',
                            backgroundColor: isSelected ? 'rgba(94, 106, 210, 0.08)' : 'transparent',
                            cursor: 'move',
                            userSelect: 'none',
                            display: 'inline-flex',
                            flexDirection: 'column',
                            boxSizing: 'border-box',
                            pointerEvents: 'auto',
                          }}
                        >
                          <textarea
                            value={el.text}
                            onChange={(e) => updateElementProps(el.id, { text: e.target.value })}
                            onFocus={() => setSelectedId(el.id)}
                            onClick={(e) => e.stopPropagation()}
                            rows={Math.max(1, el.text.split('\n').length)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              color: 'inherit',
                              font: 'inherit',
                              width: '100%',
                              minHeight: '100%',
                              resize: 'none',
                              overflow: 'visible',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              padding: 0,
                              margin: 0,
                              lineHeight: 1.2,
                            }}
                          />
                          {isSelected && (
                            <div style={{ position: 'absolute', top: '-14px', right: '-10px', display: 'flex', gap: '4px', zIndex: 12 }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateElement(el.id);
                                }}
                                style={{
                                  backgroundColor: 'var(--primary)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                }}
                                title="Duplicate"
                              >
                                📋
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteElement(el.id);
                                }}
                                style={{
                                  backgroundColor: '#ff4d4f',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                }}
                                title="Delete text"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {/* Text area resize handle */}
                          {isSelected && (
                            <div
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDragState({
                                  id: el.id,
                                  mode: 'resize',
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  initX: el.x,
                                  initY: el.y,
                                  initW: el.width,
                                  initH: el.height,
                                  initSize: el.size || 16,
                                });
                              }}
                              style={{
                                position: 'absolute',
                                bottom: '-4px',
                                right: '-4px',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'var(--primary)',
                                borderRadius: '2px',
                                cursor: 'nwse-resize',
                              }}
                            />
                          )}
                        </div>
                      );
                    }

                    // 2. Stamp Overlay
                    if (el.type === 'stamp') {
                      return (
                        <div
                          key={el.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                            setDragState({
                              id: el.id,
                              mode: 'move',
                              startX: e.clientX,
                              startY: e.clientY,
                              initX: el.x,
                              initY: el.y,
                              initW: el.width,
                              initH: el.height,
                            });
                          }}
                          style={{
                            position: 'absolute',
                            left: `${el.x * 100}%`,
                            top: `${el.y * 100}%`,
                            width: `${el.width * 100}%`,
                            height: `${el.height * 100}%`,
                            border: `2.5px solid ${el.color}`,
                            borderRadius: '4px',
                            color: el.color,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '14px',
                            letterSpacing: '1px',
                            cursor: 'move',
                            boxShadow: isSelected ? '0 0 0 2px var(--primary)' : '0 2px 8px rgba(0,0,0,0.1)',
                            pointerEvents: 'auto',
                          }}
                        >
                          {el.text}
                          {isSelected && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(el.id);
                              }}
                              style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                backgroundColor: '#ff4d4f',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    }

                    // 3. Image Overlay
                    if (el.type === 'image') {
                      return (
                        <div
                          key={el.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                            setDragState({
                              id: el.id,
                              mode: 'move',
                              startX: e.clientX,
                              startY: e.clientY,
                              initX: el.x,
                              initY: el.y,
                              initW: el.width,
                              initH: el.height,
                            });
                          }}
                          style={{
                            position: 'absolute',
                            left: `${el.x * 100}%`,
                            top: `${el.y * 100}%`,
                            width: `${el.width * 100}%`,
                            height: `${el.height * 100}%`,
                            border: isSelected ? '2px solid var(--primary)' : '1px dashed transparent',
                            cursor: 'move',
                            boxSizing: 'border-box',
                            pointerEvents: 'auto',
                          }}
                        >
                          <img
                            src={el.dataUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                          />
                          {isSelected && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteElement(el.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '-10px',
                                  right: '-10px',
                                  backgroundColor: '#ff4d4f',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                ✕
                              </button>
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setDragState({
                                    id: el.id,
                                    mode: 'resize',
                                    startX: e.clientX,
                                    startY: e.clientY,
                                    initX: el.x,
                                    initY: el.y,
                                    initW: el.width,
                                    initH: el.height,
                                  });
                                }}
                                style={{
                                  position: 'absolute',
                                  bottom: '-6px',
                                  right: '-6px',
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: 'var(--primary)',
                                  borderRadius: '2px',
                                  cursor: 'nwse-resize',
                                }}
                              />
                            </>
                          )}
                        </div>
                      );
                    }

                    // 4. Erase / Highlight / Shapes Overlay
                    if (el.type === 'erase' || el.type === 'highlight' || el.type === 'shape-rect' || el.type === 'shape-line') {
                      return (
                        <div
                          key={el.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedId(el.id);
                            setDragState({
                              id: el.id,
                              mode: 'move',
                              startX: e.clientX,
                              startY: e.clientY,
                              initX: el.x,
                              initY: el.y,
                              initW: el.width,
                              initH: el.height,
                            });
                          }}
                          style={{
                            position: 'absolute',
                            left: `${el.x * 100}%`,
                            top: `${el.y * 100}%`,
                            width: `${el.width * 100}%`,
                            height: `${el.height * 100}%`,
                            backgroundColor: el.type === 'erase' ? '#ffffff' : el.type === 'highlight' ? el.color : 'transparent',
                            opacity: el.type === 'highlight' ? el.opacity : 1,
                            border: el.type === 'shape-rect' ? `2px solid ${el.color}` : el.type === 'shape-line' ? `none` : isSelected ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.1)',
                            borderTop: el.type === 'shape-line' ? `3px solid ${el.color}` : undefined,
                            cursor: 'move',
                            boxSizing: 'border-box',
                            pointerEvents: 'auto',
                          }}
                        >
                          {isSelected && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteElement(el.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '-10px',
                                  right: '-10px',
                                  backgroundColor: '#ff4d4f',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                ✕
                              </button>
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setDragState({
                                    id: el.id,
                                    mode: 'resize',
                                    startX: e.clientX,
                                    startY: e.clientY,
                                    initX: el.x,
                                    initY: el.y,
                                    initW: el.width,
                                    initH: el.height,
                                  });
                                }}
                                style={{
                                  position: 'absolute',
                                  bottom: '-6px',
                                  right: '-6px',
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: 'var(--primary)',
                                  borderRadius: '2px',
                                  cursor: 'nwse-resize',
                                }}
                              />
                            </>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
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
                  {currentExtractedBlocks.map((block) => (
                    <div
                      key={block.id}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleSelectExtractedText(block);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectExtractedText(block);
                      }}
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
          )}
          footer={(
            <>
              <button
                type="button"
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleSave}
                disabled={processing || renderingPage}
                id="save-pdf-button"
              >
                {processing ? 'Processing PDF...' : 'Download PDF'}
                <ToolIcon name="download" size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearAllFiles}
                disabled={processing}
              >
                Start over
              </button>
            </>
          )}
        >
          <div className="page-control-stat">
            <span>Active Page</span>
            <strong>{currentPageIndex + 1} / {totalPages}</strong>
          </div>

          <div className="merge-summary-list">
            <div>
              <span className="ink-muted">Active Tool</span>
              <strong style={{ textTransform: 'capitalize' }}>{activeTool}</strong>
            </div>
            <div>
              <span className="ink-muted">Detectable Paragraphs</span>
              <strong style={{ color: 'var(--primary)' }}>{currentExtractedBlocks.length}</strong>
            </div>
            <div>
              <span className="ink-muted">Total Edits</span>
              <strong style={{ color: 'var(--primary)' }}>{totalEditsCount}</strong>
            </div>
            <div>
              <span className="ink-muted">Page Rotation</span>
              <strong>{pageRotations[currentPageIndex] || 0}°</strong>
            </div>
            <div>
              <span className="ink-muted">Output</span>
              <strong>edited.pdf</strong>
            </div>
          </div>

          <div className="page-help-note">
            <ToolIcon name="edit" size={16} />
            <span>Click <strong>Edit PDF Text</strong> to select and replace entire paragraphs or text blocks directly on the canvas.</span>
          </div>

          {done && <div className="merge-success">✓ PDF exported successfully!</div>}
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
