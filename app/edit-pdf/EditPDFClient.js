'use client';

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import EditElementOverlay from '@/components/EditElementOverlay';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';
import EditToolbar from '@/components/EditToolbar';
import SignatureDialog, { SAVED_KEYS } from '@/components/SignatureDialog';
import { exportEditedPdf, DEFAULT_STROKE } from '@/lib/editPdfExport';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { loadPdfForRender, getPdfjs, generateAllThumbnails } from '@/lib/renderUtils';
import { extractPageLayout } from '@/lib/pdfLayout';
import { layoutToBlocks, lineBlock, blockToElements, fitCharSpacing, sampleBackground, sampleSolidInk, estimateWeightBoost } from '@/lib/pdfTextBlocks';
import { elementSpans, resolveStyle, textEditPatch, wholeStylePatch, everySpan } from '@/lib/richText';
import { EDIT_FONTS, loadEditFont } from '@/lib/editFonts';
import { placeCaretAtPoint, measureLineWidths } from '@/components/EditRichText';
import {
  emptyDoc, createHistory, commit, replace, undo, redo,
  updatePageElements, patchElement, removeElement, rotatePage, deletePage, countEdits,
  visiblePageIndices, stepPage, pageAfterDelete, toBaseFraction,
  applyDrag, offsetCopy, boxFromPoints, snapLineEnd, addStrokePoint, strokePath, arrowHead,
  markPristine, isPristine,
} from '@/lib/editModel';

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const clampZoom = (z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));


// Tools that create something by dragging on the page; while one is active, existing elements
// let the pointer through so you can draw over them.
const DRAG_TOOLS = new Set(['erase', 'highlight', 'shape-rect', 'shape-ellipse', 'shape-line', 'shape-arrow', 'draw']);
// Tools that drop something where you click (and stay on, so you can tick several boxes).
const PLACE_TOOLS = new Set(['place-check', 'place-cross', 'place-date']);
const STROKE_TYPES = new Set(['draw', 'shape-line', 'shape-rect', 'shape-ellipse']);
const STROKE_TOOLS = new Set(['draw', 'shape-line', 'shape-arrow', 'shape-rect', 'shape-ellipse']);
const TOOL_KEYS = { v: 'edit-text', e: 'edit-text', t: 'text', d: 'draw', h: 'highlight', w: 'erase', r: 'shape-rect', o: 'shape-ellipse', l: 'shape-line', a: 'shape-arrow' };
const PDF_FONT = '__pdf-font';
const ALIGN_OPTIONS = [
  { id: 'left', label: 'Align left', path: 'M4 6h16M4 10h10M4 14h16M4 18h10' },
  { id: 'center', label: 'Align centre', path: 'M4 6h16M7 10h10M4 14h16M7 18h10' },
  { id: 'right', label: 'Align right', path: 'M4 6h16M10 10h10M4 14h16M10 18h10' },
  { id: 'justify', label: 'Justify', path: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
];

const COLOR_PRESETS = [
  { label: 'Dark ink', value: '#141320' },
  { label: 'Brand purple', value: '#5e6ad2' },
  { label: 'White', value: '#ffffff' },
  { label: 'Red', value: '#ff4d4f' },
  { label: 'Highlight yellow', value: '#ffc107' },
  { label: 'Ocean blue', value: '#2196f3' },
  { label: 'Emerald green', value: '#00b473' },
];

const STAMP_PRESETS = [
  { label: 'APPROVED', color: '#00b473' },
  { label: 'CONFIDENTIAL', color: '#ff4d4f' },
  { label: 'DRAFT', color: '#ff9f43' },
  { label: 'FINAL', color: '#5e6ad2' },
  { label: 'COMPLETED', color: '#2196f3' },
  { label: 'REJECTED', color: '#d63384' },
];

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const newId = (prefix) =>
  `${prefix}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;

// Reads an image file into what pdf-lib can embed (PNG or JPEG bytes) plus a preview URL.
async function prepareImageForPdf(imageFile) {
  const isPng = imageFile.type.includes('png');
  const isJpg = imageFile.type.includes('jpeg') || imageFile.type.includes('jpg');
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Could not read the image.'));
    r.readAsDataURL(imageFile);
  });
  if (isPng || isJpg) {
    return { dataUrl, bytes: await imageFile.arrayBuffer(), format: isPng ? 'png' : 'jpg' };
  }
  // other formats (WebP, GIF, SVG) are redrawn as PNG
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cvs = document.createElement('canvas');
      cvs.width = img.naturalWidth || 400;
      cvs.height = img.naturalHeight || 400;
      cvs.getContext('2d').drawImage(img, 0, 0, cvs.width, cvs.height);
      cvs.toBlob(async (blob) => {
        if (!blob) return reject(new Error('Could not convert the image.'));
        resolve({ dataUrl: cvs.toDataURL('image/png'), bytes: await blob.arrayBuffer(), format: 'png' });
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('This image format is not supported.'));
    img.src = dataUrl;
  });
}

export default function EditPDFClient() {
  const deliver = useResultHandoff('edit-pdf');
  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [activeTool, setActiveTool] = useState('edit-text');
  const [activeColor, setActiveColor] = useState('#141320');
  const [textSize, setTextSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState('left');
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Everything the user changed (elements, rotations, deleted pages) with undo/redo.
  const [history, setHistory] = useState(() => createHistory(emptyDoc()));
  const doc = history.present;
  const [savedDoc, setSavedDoc] = useState(history.present);
  const dirty = doc !== savedDoc;
  const [selectedId, setSelectedId] = useState(null);

  // Native PDF paragraphs per page, and the current page's size in points (base view).
  const [extractedTextBlocks, setExtractedTextBlocks] = useState({});
  const [pagePt, setPagePt] = useState({ width: 612, height: 792 });
  const [notice, setNotice] = useState(null); // { text, tone: 'info' | 'error' }

  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [renderingPage, setRenderingPage] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [draft, setDraft] = useState(null); // shape/stroke being drawn right now
  const [signOpen, setSignOpen] = useState(false);
  const [signInk, setSignInk] = useState('blue');

  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const stageRef = useRef(null);
  const pageRef = useRef(null);
  const zoomAnchorRef = useRef(null);
  const pinchRef = useRef({ pointers: new Map(), start: null });
  const renderedPageRef = useRef(-1);
  const currentPageRef = useRef(0);
  const extractedRef = useRef({});
  const imageInputRef = useRef(null);
  const renderTaskRef = useRef(null);
  const gestureRef = useRef(null);
  const gestureSeqRef = useRef(0);
  const lastEditKeyRef = useRef(null);
  const typingKeyRef = useRef(null);
  const pendingFocusRef = useRef(null);

  const pageRotation = doc.rotations[currentPageIndex] || 0;
  const pageEls = doc.elements[currentPageIndex] || [];
  const selectedEl = pageEls.find((el) => el.id === selectedId) || null;
  // opened PDF lines not changed yet: the original page still shows through them
  const pristineIds = new Set(pageEls.filter(isPristine).map((el) => el.id));
  const visiblePages = visiblePageIndices(totalPages, doc.deleted);

  /**
   * Applies `fn` to the document. Edits that share `key` with the previous edit (the rest of a
   * drag, more typing in the same box) merge into one undo step.
   */
  const editDoc = useCallback((fn, key = null) => {
    const merge = key !== null && key === lastEditKeyRef.current;
    lastEditKeyRef.current = key;
    setHistory((h) => {
      const next = fn(h.present);
      if (next === h.present) return h;
      return merge ? replace(h, next) : commit(h, next);
    });
  }, []);

  const editPage = useCallback(
    (fn, key = null) => editDoc((d) => updatePageElements(d, currentPageIndex, fn), key),
    [editDoc, currentPageIndex]
  );

  // After undo/redo: leave a page that no longer exists and drop a selection that is gone.
  const travel = (step) => {
    const next = step(history);
    if (next === history) return;
    lastEditKeyRef.current = null;
    setHistory(next);
    const page = next.present.deleted.includes(currentPageIndex)
      ? pageAfterDelete(currentPageIndex, totalPages, next.present.deleted)
      : currentPageIndex;
    if (page !== currentPageIndex) setCurrentPageIndex(page);
    if (!(next.present.elements[page] || []).some((el) => el.id === selectedId)) setSelectedId(null);
  };
  const handleUndo = () => travel(undo);
  const handleRedo = () => travel(redo);

  // Zoom keeps the point under the pointer (or the middle of the view) where it is. The page is
  // scaled straight away with CSS; a sharp render follows once zooming pauses.
  const zoomTo = useCallback((next, clientX, clientY) => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (frame && stage) {
      const r = frame.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const cx = clientX ?? s.left + s.width / 2;
      const cy = clientY ?? s.top + s.height / 2;
      zoomAnchorRef.current = { fx: (cx - r.left) / r.width, fy: (cy - r.top) / r.height, cx, cy };
    }
    setZoom((z) => clampZoom(typeof next === 'function' ? next(z) : next));
  }, []);
  const zoomIn = useCallback(() => zoomTo((z) => ZOOM_LEVELS.find((l) => l > z + 0.001) ?? ZOOM_MAX), [zoomTo]);
  const zoomOut = useCallback(() => zoomTo((z) => [...ZOOM_LEVELS].reverse().find((l) => l < z - 0.001) ?? ZOOM_MIN), [zoomTo]);

  useLayoutEffect(() => {
    const a = zoomAnchorRef.current;
    const stage = stageRef.current;
    const frame = frameRef.current;
    zoomAnchorRef.current = null;
    if (!a || !stage || !frame) return;
    const r = frame.getBoundingClientRect();
    stage.scrollLeft += r.left + a.fx * r.width - a.cx;
    stage.scrollTop += r.top + a.fy * r.height - a.cy;
  }, [zoom]);

  // Ctrl/Cmd + wheel (and trackpad pinch, which arrives the same way) zooms smoothly around the pointer.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      zoomTo((z) => z * Math.exp(-delta * 0.0022), e.clientX, e.clientY);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [file, zoomTo]);

  // Two-finger pinch on touch screens.
  const pinchDistance = (pts) => Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
  const handleStagePointerDown = (e) => {
    if (e.pointerType !== 'touch') return;
    const pinch = pinchRef.current;
    pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.pointers.size === 2) {
      // a second finger turns whatever the first one started into a pinch
      gestureRef.current = null;
      setDraft(null);
      pinch.start = { dist: pinchDistance([...pinch.pointers.values()]), zoom };
    }
  };
  const handleStagePointerMove = (e) => {
    const pinch = pinchRef.current;
    if (!pinch.pointers.has(e.pointerId)) return;
    pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.pointers.size !== 2 || !pinch.start) return;
    const pts = [...pinch.pointers.values()];
    const start = pinch.start;
    zoomTo(start.zoom * (pinchDistance(pts) / start.dist), (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
  };
  const handleStagePointerUp = (e) => {
    const pinch = pinchRef.current;
    pinch.pointers.delete(e.pointerId);
    if (pinch.pointers.size < 2) pinch.start = null;
  };

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

  // Warn before the tab closes with unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // A new text box left empty, or a PDF line opened but not changed, disappears once it is no longer
  // selected (with its cover). If nothing else happened since it was added, its undo step goes too.
  const prevSelectedRef = useRef(null);
  useEffect(() => {
    const prev = prevSelectedRef.current;
    prevSelectedRef.current = selectedId;
    if (!prev || prev === selectedId) return;
    const page = Object.keys(doc.elements).find((k) => doc.elements[k].some((el) => el.id === prev));
    const el = page !== undefined && doc.elements[page].find((item) => item.id === prev);
    if (!el || el.type !== 'text') return;
    const untouched = isPristine(el);
    if (!untouched && (el.sourceBlock || el.text.trim())) return;
    Promise.resolve().then(() => {
      if (lastEditKeyRef.current === `add-${prev}`) {
        lastEditKeyRef.current = null;
        setHistory((h) => (h.past.length ? { ...h, past: h.past.slice(0, -1), present: h.past[h.past.length - 1] } : h));
      } else {
        editDoc((d) => updatePageElements(d, Number(page), (els) => els.filter((item) => item.id !== prev && !(untouched && item.linkedTo === prev))));
      }
    });
  }, [selectedId, doc, editDoc]);

  // Focus a text box that was just created (Add text, or a paragraph opened for editing).
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    const box = document.getElementById(`edit-ta-${pending.id}`);
    if (!box) return;
    pendingFocusRef.current = null;
    box.focus({ preventScroll: true });
    // caret where the user clicked, or at the end
    placeCaretAtPoint(box, pending.x, pending.y);
  });

  const resetDocument = () => {
    const fresh = emptyDoc();
    setHistory(createHistory(fresh));
    setSavedDoc(fresh);
    lastEditKeyRef.current = null;
    setExtractedTextBlocks({});
    extractedRef.current = {};
    renderedPageRef.current = -1;
    setSelectedId(null);
    setCurrentPageIndex(0);
    setNotice(null);
    setDone(false);
    setDraft(null);
  };

  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    resetDocument();
    try {
      const pdf = await loadPdfForRender(f);
      setPdfRenderDoc(pdf);
      setTotalPages(pdf.numPages);
    } catch (err) {
      setFile(null);
      setNotice({ tone: 'error', text: `This PDF could not be opened: ${err.message}` });
    }
  }, []);

  useEffect(() => {
    currentPageRef.current = currentPageIndex;
  }, [currentPageIndex]);

  // Render the current page in its own orientation (the user's rotation is a CSS turn) at the
  // resolution it is shown at. It draws into a spare canvas and swaps in when done, so zooming never
  // blanks the page: until then the previous picture is simply scaled. The page's text is read once,
  // after its first render (font names are known by then).
  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!pdfRenderDoc || !canvas) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch { /* already finished */ }
      renderTaskRef.current = null;
    }
    const pageIndex = currentPageIndex;
    const firstForPage = renderedPageRef.current !== pageIndex;
    if (firstForPage) setRenderingPage(true);
    try {
      const page = await pdfRenderDoc.getPage(pageIndex + 1);
      const rot = page.rotate || 0;
      const base = page.getViewport({ scale: 1, rotation: rot });
      if (firstForPage) setPagePt({ width: base.width, height: base.height });
      const shownWidth = pageRef.current?.offsetWidth || 740;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      // sharp at the shown size, but never a canvas so big that the browser struggles
      const scale = Math.max(0.5, Math.min((shownWidth * dpr) / base.width, 6000 / Math.max(base.width, base.height)));
      const viewport = page.getViewport({ scale, rotation: rot });
      const spare = document.createElement('canvas');
      spare.width = Math.ceil(viewport.width);
      spare.height = Math.ceil(viewport.height);
      const task = page.render({ canvasContext: spare.getContext('2d'), viewport });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;
      if (currentPageRef.current !== pageIndex) return;
      canvas.width = spare.width;
      canvas.height = spare.height;
      canvas.getContext('2d').drawImage(spare, 0, 0);
      renderedPageRef.current = pageIndex;

      if (!extractedRef.current[pageIndex]) {
        const pdfjs = await getPdfjs();
        const layout = await extractPageLayout(page, pdfjs, { colors: false, images: false, rotation: rot, splitMarkers: true });
        const blocks = layoutToBlocks(layout, `extracted-${pageIndex}`);
        extractedRef.current = { ...extractedRef.current, [pageIndex]: blocks };
        setExtractedTextBlocks(extractedRef.current);
      }
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') console.error('Error rendering page:', err);
    } finally {
      if (firstForPage) setRenderingPage(false);
    }
  }, [pdfRenderDoc, currentPageIndex]);

  // New page: render now. Zoom: wait until it settles, then sharpen.
  useEffect(() => {
    if (!pdfRenderDoc) return undefined;
    const delay = renderedPageRef.current === currentPageIndex ? 180 : 0;
    const timer = setTimeout(renderPage, delay);
    return () => clearTimeout(timer);
  }, [pdfRenderDoc, currentPageIndex, zoom, renderPage]);

  // Pixels of the rendered page under a box given in page fractions.
  const readCanvasBox = (box) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width) return null;
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const x = Math.max(0, Math.floor(box.x * canvas.width));
      const y = Math.max(0, Math.floor(box.y * canvas.height));
      const w = Math.max(1, Math.min(canvas.width - x, Math.ceil(box.width * canvas.width)));
      const h = Math.max(1, Math.min(canvas.height - y, Math.ceil(box.height * canvas.height)));
      return { img: ctx.getImageData(x, y, w, h), w, h };
    } catch {
      return null;
    }
  };

  // Paper and ink colours of a block, read from the rendered page, plus a weight correction when the
  // text has to be redrawn in a substitute font (the PDF's own font already has the right weight).
  const sampleBlockLook = async (block) => {
    let bg = '#ffffff';
    let ink = block.color;
    let boost = 0;
    const canvas = canvasRef.current;
    if (!canvas?.width) return { bg, ink, boost };
    try {
      if (!block.fontId) await loadEditFont(block.family, block.bold, block.italic);
      const img = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
      const box = { x: block.x * canvas.width, y: block.y * canvas.height, w: block.width * canvas.width, h: block.height * canvas.height };
      bg = sampleBackground(img, box);
      ink = sampleSolidInk(img, box, bg) || block.color;
      if (!block.fontId) boost = estimateWeightBoost(img, canvas.width / pagePt.width, block, bg, ink);
    } catch {
      // keep the defaults
    }
    return { bg, ink, boost };
  };

  // Measures the opened text in the editor's fonts and adds the letter spacing that makes it exactly
  // as long as the original line, so opening a line for editing doesn't change its size.
  const withOriginalSpacing = async (textEl, lines) => {
    try {
      const naturals = await measureLineWidths(textEl);
      const charSpacing = fitCharSpacing(lines, naturals, textEl.hScale || 1, textEl.size);
      return charSpacing === undefined ? textEl : { ...textEl, charSpacing };
    } catch {
      return textEl;
    }
  };

  // Click on a line of the PDF: that line becomes editable in place, in its own font, size and
  // colour, with each bold or italic run kept. The rest of the paragraph is left untouched.
  const openLine = async (block, lineIndex, point) => {
    const line = lineBlock(block, lineIndex);
    const existing = pageEls.find((el) => el.sourceBlock === line.id || el.sourceBlock === block.id);
    if (existing) {
      setSelectedId(existing.id);
      pendingFocusRef.current = { id: existing.id, ...point };
      return;
    }
    const look = await sampleBlockLook(line);
    const [cover, opened] = blockToElements(line, { coverId: newId('el-cover'), textId: newId('el-text'), ...look, oneLine: true });
    // until something changes, the page keeps showing the original line (only the caret appears)
    const text = markPristine(await withOriginalSpacing(opened, line.lines));
    editPage((els) => [...els, cover, text], `add-${text.id}`);
    setSelectedId(text.id);
    pendingFocusRef.current = { id: text.id, ...point };
  };

  // "Edit the whole paragraph": the paragraph's lines (with anything already typed in them) become
  // one box that wraps, for edits that need the text to reflow.
  const openParagraph = async (textId) => {
    const from = pageEls.find((el) => el.id === textId);
    const block = (extractedTextBlocks[currentPageIndex] || []).find((b) => b.id === from?.paragraphId);
    if (!block || block.lines.length < 2) return;
    const lineEls = pageEls.filter((el) => el.type === 'text' && el.oneLine && el.paragraphId === block.id);
    const lines = block.lines.map((l, i) => {
      const edited = lineEls.find((el) => el.sourceBlock === `${block.id}-l${i}`);
      if (!edited) return l;
      const runs = elementSpans(edited).map((s) => {
        const st = resolveStyle(edited, s);
        return { text: s.text, family: st.family, bold: st.bold, italic: st.italic, fontId: st.fontId, size: st.size };
      });
      // no original width: an edited line must not be stretched to the old length
      return { ...l, text: edited.text, width: null, runs };
    });
    const merged = { ...block, lines, str: lines.map((l) => l.text).join('\n') };
    const look = await sampleBlockLook(block);
    const ids = { coverId: newId('el-cover'), textId: newId('el-text') };
    const [cover, opened] = blockToElements(merged, { ...ids, ...look });
    // letter spacing is fitted line by line, so measure the lines as the PDF broke them
    const [, asLines] = blockToElements(merged, { ...ids, ...look, oneLine: true });
    const fitted = await withOriginalSpacing(asLines, lines);
    const text = fitted.charSpacing === undefined ? opened : { ...opened, charSpacing: fitted.charSpacing };
    const gone = new Set(lineEls.flatMap((el) => [el.id, ...pageEls.filter((c) => c.linkedTo === el.id).map((c) => c.id)]));
    editPage((els) => [...els.filter((el) => !gone.has(el.id)), cover, text]);
    setSelectedId(text.id);
    pendingFocusRef.current = { id: text.id };
  };

  const addElement = (el, { focus = false } = {}) => {
    editPage((els) => [...els, el], `add-${el.id}`);
    setSelectedId(el.id);
    if (focus) pendingFocusRef.current = { id: el.id };
  };

  const handleImageFileChange = async (e) => {
    const imgFile = e.target.files?.[0];
    e.target.value = '';
    if (!imgFile) return;
    try {
      const prepared = await prepareImageForPdf(imgFile);
      const natural = await new Promise((resolve) => {
        const probe = new Image();
        probe.onload = () => resolve({ width: probe.naturalWidth || 1, height: probe.naturalHeight || 1 });
        probe.onerror = () => resolve({ width: 4, height: 3 });
        probe.src = prepared.dataUrl;
      });
      // start at the image's own proportions: 35% of the page wide, or shorter if that is too tall
      const aspect = natural.width / natural.height;
      let width = 0.35;
      let height = (width * pagePt.width) / aspect / pagePt.height;
      if (height > 0.5) {
        height = 0.5;
        width = (height * pagePt.height * aspect) / pagePt.width;
      }
      addElement({
        id: newId('el-img'), type: 'image',
        x: (1 - width) / 2, y: Math.max(0, (1 - height) / 2 - 0.1), width, height, aspect,
        dataUrl: prepared.dataUrl, bytes: prepared.bytes, format: prepared.format,
      });
      setActiveTool('edit-text');
    } catch (err) {
      setNotice({ tone: 'error', text: `This image could not be added: ${err.message}` });
    }
  };

  const insertStamp = (stamp) => {
    addElement({ id: newId('el-stamp'), type: 'stamp', text: stamp.label, color: stamp.color, x: 0.35, y: 0.3, width: 0.3, height: 0.08 });
    setActiveTool('edit-text');
  };

  // A signature from the dialog (drawn, typed or uploaded) goes on the page as an image you can
  // move and resize. It can be remembered in this browser for next time.
  // Middle of the part of the page you can see (page fraction), so a new item lands in view; on a
  // phone the page is often taller than the screen.
  const visibleMiddleY = () => {
    const node = pageRef.current;
    if (!node || pageRotation !== 0) return 0.5;
    const r = node.getBoundingClientRect();
    const top = Math.max(r.top, 0);
    const bottom = Math.min(r.bottom, window.innerHeight);
    if (bottom - top < 40 || !r.height) return 0.5;
    return Math.max(0.05, Math.min(0.95, ((top + bottom) / 2 - r.top) / r.height));
  };

  const insertSignature = async (dataUrl, remember) => {
    setSignOpen(false);
    try {
      if (remember) localStorage.setItem(SAVED_KEYS.signature, dataUrl);
      else localStorage.removeItem(SAVED_KEYS.signature);
    } catch {
      // private browsing: just don't remember it
    }
    try {
      const bytes = await (await fetch(dataUrl)).arrayBuffer();
      const natural = await new Promise((resolve) => {
        const probe = new Image();
        probe.onload = () => resolve({ width: probe.naturalWidth || 3, height: probe.naturalHeight || 1 });
        probe.onerror = () => resolve({ width: 3, height: 1 });
        probe.src = dataUrl;
      });
      const aspect = natural.width / natural.height;
      const width = Math.min(0.3, (160 / pagePt.width));
      const height = (width * pagePt.width) / aspect / pagePt.height;
      addElement({
        id: newId('el-sign'), type: 'image', signature: true,
        x: (1 - width) / 2, y: Math.max(0, Math.min(1 - height, visibleMiddleY() - height / 2)), width, height, aspect,
        dataUrl, bytes, format: 'png',
      });
      setActiveTool('edit-text');
    } catch (err) {
      setNotice({ tone: 'error', text: `The signature could not be added: ${err.message}` });
    }
  };

  const deleteElement = useCallback((id) => {
    editDoc((d) => removeElement(d, currentPageIndex, id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, [editDoc, currentPageIndex]);

  const duplicateElement = useCallback((id) => {
    const el = (doc.elements[currentPageIndex] || []).find((item) => item.id === id);
    if (!el) return;
    const copy = { ...offsetCopy(el, newId('el-dup')), linkedTo: undefined, sourceBlock: undefined, paragraphId: undefined };
    editPage((els) => [...els, copy]);
    setSelectedId(copy.id);
  }, [doc, currentPageIndex, editPage]);

  // ── Pointer handling ─────────────────────────────────────────────────────
  // Positions come from the frame (the page as displayed) and are turned back into the page's own
  // orientation, so everything works the same on a rotated page.
  const pointerToPage = (e, clamp = true) => {
    const r = frameRef.current.getBoundingClientRect();
    let u = (e.clientX - r.left) / r.width;
    let v = (e.clientY - r.top) / r.height;
    if (clamp) {
      u = clamp01(u);
      v = clamp01(v);
    }
    return toBaseFraction(u, v, pageRotation);
  };

  const capture = (e) => {
    try { frameRef.current?.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
  };

  // Called by an element (or one of its handles) when the pointer goes down on it.
  const startDrag = (e, el, mode) => {
    e.stopPropagation();
    if (e.button !== undefined && e.button !== 0) return;
    // no focus change or text selection while dragging; a click without moving focuses text below
    e.preventDefault();
    if (document.activeElement && document.activeElement !== document.body && document.activeElement.id !== `edit-ta-${el.id}`) {
      document.activeElement.blur();
    }
    setSelectedId(el.id);
    capture(e);
    // a text box's shown size (its height comes from the text), for scaling it by a corner
    let box = null;
    const node = el.type === 'text' && document.getElementById(`edit-ta-${el.id}`)?.closest('.edit-el-text');
    const pageNode = pageRef.current;
    if (node && pageNode?.offsetWidth) {
      box = { x: el.x, y: el.y, width: node.offsetWidth / pageNode.offsetWidth, height: node.offsetHeight / pageNode.offsetHeight };
    }
    gestureRef.current = {
      kind: 'drag',
      id: el.id,
      mode,
      orig: el,
      box,
      page: currentPageIndex,
      start: pointerToPage(e, false),
      clientX: e.clientX,
      clientY: e.clientY,
      moved: false,
      key: `drag-${++gestureSeqRef.current}`,
    };
  };

  const handleFramePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    setSelectedId(null);
    const p = pointerToPage(e);

    if (activeTool === 'text') {
      e.preventDefault();
      addElement({
        id: newId('el-text'), type: 'text', x: Math.min(p.x, 0.97), y: Math.min(p.y, 0.97), width: Math.min(0.35, 1 - p.x), height: 0.05,
        text: '', color: activeColor, size: textSize, fontFamily, isBold, isItalic,
        ...(textAlign !== 'left' ? { align: textAlign } : {}),
      }, { focus: true });
      setActiveTool('edit-text');
      return;
    }
    if (activeTool === 'place-check' || activeTool === 'place-cross') {
      e.preventDefault();
      // a square mark about the size of a form checkbox, centred where you click
      const w = 14 / pagePt.width;
      const h = 14 / pagePt.height;
      addElement({
        id: newId('el-mark'), type: 'mark', symbol: activeTool === 'place-check' ? 'check' : 'cross',
        color: activeColor, aspect: 1,
        x: Math.max(0, Math.min(1 - w, p.x - w / 2)), y: Math.max(0, Math.min(1 - h, p.y - h / 2)), width: w, height: h,
      });
      return;
    }
    if (activeTool === 'place-date') {
      e.preventDefault();
      const text = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      addElement({
        id: newId('el-date'), type: 'text', x: Math.min(p.x, 0.9), y: Math.max(0, Math.min(0.97, p.y - (textSize * 0.6) / pagePt.height)),
        width: 0.2, height: 0.03, oneLine: true, text, color: activeColor, size: Math.min(textSize, 14), fontFamily, isBold: false, isItalic: false,
      });
      setActiveTool('edit-text');
      return;
    }
    if (!DRAG_TOOLS.has(activeTool)) return;
    e.preventDefault();
    capture(e);
    const isLine = activeTool === 'shape-line' || activeTool === 'shape-arrow';
    const first = activeTool === 'draw' ? { kind: 'draw', points: [[p.x, p.y]] }
      : isLine ? { kind: 'line', arrow: activeTool === 'shape-arrow', x1: p.x, y1: p.y, x2: p.x, y2: p.y }
        : { kind: 'box', tool: activeTool, ...boxFromPoints(p, p) };
    // the gesture keeps its own copy of the shape: state may be a frame behind on pointer up
    gestureRef.current = { kind: activeTool, start: p, points: [[p.x, p.y]], draft: first };
    setDraft(first);
  };

  const handleFramePointerMove = (e) => {
    const g = gestureRef.current;
    if (!g) return;
    if (g.kind === 'drag') {
      if (!g.moved && Math.hypot(e.clientX - g.clientX, e.clientY - g.clientY) < 3) return;
      g.moved = true;
      const p = pointerToPage(e, false);
      const next = applyDrag(g.orig, g.mode, p.x - g.start.x, p.y - g.start.y, pagePt.width / pagePt.height, g.box);
      editDoc((d) => updatePageElements(d, g.page, (els) => els.map((el) => (el.id === g.id ? next : el))), g.key);
      return;
    }
    const p = pointerToPage(e);
    if (g.kind === 'draw') {
      g.points = addStrokePoint(g.points, [p.x, p.y]);
      g.draft = { kind: 'draw', points: g.points };
    } else if (g.kind === 'shape-line' || g.kind === 'shape-arrow') {
      const end = e.shiftKey ? snapLineEnd(g.start, p, pagePt.width / pagePt.height) : p;
      g.draft = { kind: 'line', arrow: g.kind === 'shape-arrow', x1: g.start.x, y1: g.start.y, x2: end.x, y2: end.y };
    } else {
      g.draft = { kind: 'box', tool: g.kind, ...boxFromPoints(g.start, p) };
    }
    setDraft(g.draft);
  };

  const handleFramePointerUp = (e) => {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g) return;
    if (g.kind === 'drag') {
      // a click (no drag) on a text box starts typing where it was clicked
      if (!g.moved && g.orig.type === 'text' && g.mode === 'move') {
        const box = document.getElementById(`edit-ta-${g.id}`);
        if (box) {
          box.focus({ preventScroll: true });
          placeCaretAtPoint(box, e?.clientX, e?.clientY);
        }
      }
      return;
    }
    const d = g.draft;
    setDraft(null);
    if (!d) return;
    if (g.kind === 'draw') {
      if (g.points.length) {
        addElement({ id: newId('el-draw'), type: 'draw', color: activeColor, strokeWidth, points: g.points });
      }
      return;
    }
    if (g.kind === 'shape-line' || g.kind === 'shape-arrow') {
      if (Math.hypot(d.x2 - d.x1, d.y2 - d.y1) < 0.005) return; // a click, not a line
      addElement({
        id: newId('el-line'), type: 'shape-line', arrow: g.kind === 'shape-arrow' || undefined,
        color: activeColor, strokeWidth, x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2,
      });
      setActiveTool('edit-text');
      return;
    }
    if (d.width < 0.004 || d.height < 0.004) return; // a click, not a box
    const box = { x: d.x, y: d.y, width: d.width, height: d.height };
    if (g.kind === 'erase') {
      // cover with the paper colour around the box, not always white
      const px = readCanvasBox(box);
      const color = px ? sampleBackground(px.img, { x: 0, y: 0, w: px.w, h: px.h }) : '#ffffff';
      addElement({ id: newId('el-erase'), type: 'erase', color, ...box });
    } else if (g.kind === 'highlight') {
      addElement({ id: newId('el-hl'), type: 'highlight', color: activeColor, opacity: 0.35, ...box });
    } else {
      addElement({ id: newId('el-shape'), type: g.kind === 'shape-ellipse' ? 'shape-ellipse' : 'shape-rect', color: activeColor, strokeWidth, ...box });
    }
    // drawn: back to Edit with it selected, so it can be resized or moved straight away
    setActiveTool('edit-text');
  };

  const handleTextChange = (id, text) => {
    // styled runs follow the edit: typed text takes the style of the text around it
    editDoc((d) => patchElement(d, currentPageIndex, id, (el) => textEditPatch(el, text)), typingKeyRef.current || `type-${id}`);
  };
  const handleTextFocus = (id) => {
    setSelectedId(id);
    typingKeyRef.current = `type-${id}-${++gestureSeqRef.current}`;
  };

  // Keyboard shortcuts. Typing in a text box on the page uses the editor's undo, so one Ctrl+Z
  // reverts the whole edit; other inputs (font size, colour) keep their own behaviour.
  useEffect(() => {
    if (!file) return undefined;
    const onKey = (e) => {
      const active = document.activeElement;
      const inPageText = active?.id?.startsWith('edit-ta-');
      const inField = !inPageText && (['INPUT', 'TEXTAREA', 'SELECT'].includes(active?.tagName) || active?.isContentEditable);
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (inField) return;
      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (inPageText) active.blur();
        setSelectedId(null);
        setActiveTool((t) => (DRAG_TOOLS.has(t) || PLACE_TOOLS.has(t) || t === 'text' ? 'edit-text' : t));
      } else if (inPageText) {
        // let the text box have every other key
      } else if (!mod && !e.altKey && TOOL_KEYS[key]) {
        setActiveTool(TOOL_KEYS[key]);
      } else if (mod && key === 'd' && selectedId) {
        e.preventDefault();
        duplicateElement(selectedId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Styling: panel controls show the selected element's values and change it ──
  const selectedText = selectedEl?.type === 'text' ? selectedEl : null;
  const shownColor = selectedEl && selectedEl.color && selectedEl.type !== 'erase' ? selectedEl.color : activeColor;
  // text drawn in the PDF's own font shows that as its font until another one is picked
  const usesPdfFont = !!selectedText && elementSpans(selectedText).some((s) => resolveStyle(selectedText, s).fontId);
  const shownFont = selectedText ? (usesPdfFont ? PDF_FONT : selectedText.fontFamily) : fontFamily;
  const shownSize = Math.round(selectedText?.size ?? textSize);
  const shownBold = selectedText ? everySpan(selectedText, 'bold', true) : isBold;
  const shownItalic = selectedText ? everySpan(selectedText, 'italic', true) : isItalic;
  const shownAlign = selectedText ? selectedText.align || 'left' : textAlign;
  const changeAlign = (value) => {
    setTextAlign(value);
    if (selectedText) editDoc((d) => patchElement(d, currentPageIndex, selectedText.id, { align: value === 'left' ? undefined : value }));
  };
  const strokeTarget = selectedEl && STROKE_TYPES.has(selectedEl.type) ? selectedEl : null;
  const shownStroke = strokeTarget ? (strokeTarget.strokeWidth ?? DEFAULT_STROKE[strokeTarget.type]) : strokeWidth;

  const restyle = (patch, key) => {
    if (selectedEl) editDoc((d) => patchElement(d, currentPageIndex, selectedEl.id, patch), key ? `${key}-${selectedEl.id}` : null);
  };
  const changeColor = (value, fromPicker = false) => {
    setActiveColor(value);
    if (selectedText) {
      editDoc((d) => patchElement(d, currentPageIndex, selectedText.id, (el) => wholeStylePatch(el, 'color', value)), fromPicker ? `color-${selectedText.id}` : null);
    } else if (selectedEl && selectedEl.type !== 'image' && selectedEl.type !== 'erase' && 'color' in selectedEl) {
      restyle({ color: value }, fromPicker ? 'color' : null);
    }
  };
  // Font, size, bold and italic apply to the whole selected text box (all its runs).
  const changeText = (key, value, setDefault) => {
    setDefault();
    if (selectedText) editDoc((d) => patchElement(d, currentPageIndex, selectedText.id, (el) => wholeStylePatch(el, key, value)));
  };
  const changeStroke = (value) => {
    setStrokeWidth(value);
    if (strokeTarget) restyle({ strokeWidth: value }, 'stroke');
  };

  // ── Pages ────────────────────────────────────────────────────────────────
  const rotateCurrentPage = () => editDoc((d) => rotatePage(d, currentPageIndex, 90));

  const deleteCurrentPage = () => {
    if (visiblePages.length <= 1) {
      setNotice({ tone: 'info', text: 'A PDF needs at least one page, so the last page cannot be deleted.' });
      return;
    }
    if (!confirm(`Delete page ${visiblePages.indexOf(currentPageIndex) + 1}? You can undo this.`)) return;
    const nextDeleted = [...doc.deleted, currentPageIndex];
    editDoc((d) => deletePage(d, currentPageIndex));
    setSelectedId(null);
    setCurrentPageIndex(pageAfterDelete(currentPageIndex, totalPages, nextDeleted));
  };

  const clearCurrentPageMarkups = () => {
    if (!pageEls.length) return;
    if (!confirm('Remove every edit on this page? You can undo this.')) return;
    editPage(() => []);
    setSelectedId(null);
  };

  const goToPage = (index) => {
    if (index === currentPageIndex) return;
    setSelectedId(null);
    setDraft(null);
    gestureRef.current = null;
    setCurrentPageIndex(index);
  };

  const closeFile = () => {
    if (dirty && !confirm('Close this file? Your edits have not been saved.')) return;
    setFile(null);
    setPdfRenderDoc(null);
    setTotalPages(0);
    resetDocument();
  };

  // Bytes of the PDF's own fonts that edited text uses (pdf.js keeps them per document).
  const collectEmbeddedFonts = async () => {
    const ids = new Set();
    for (const els of Object.values(doc.elements)) {
      for (const el of els) {
        if (el.type !== 'text') continue;
        for (const s of elementSpans(el)) {
          const id = resolveStyle(el, s).fontId;
          if (id) ids.add(id);
        }
      }
    }
    const out = {};
    if (!ids.size || !pdfRenderDoc) return out;
    const page = await pdfRenderDoc.getPage(1);
    for (const id of ids) {
      try {
        if (page.commonObjs.has(id)) {
          const font = page.commonObjs.get(id);
          if (font?.data) out[id] = font.data;
        }
      } catch {
        // that text falls back to the matching editor font
      }
    }
    return out;
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    setNotice(null);
    try {
      const { bytes, replacedChars } = await exportEditedPdf({ file, doc, embeddedFonts: await collectEmbeddedFonts() });
      if (replacedChars.length) {
        const shown = replacedChars.map((c) => (/[\p{C}\s]/u.test(c) ? `U+${c.codePointAt(0).toString(16).toUpperCase()}` : c)).join(' ');
        setNotice({ tone: 'info', text: `Some characters aren't covered by the editor's fonts and were saved as "?": ${shown}` });
      }
      await deliver(bytes, file.name.replace(/\.pdf$/i, '') + '-edited.pdf', 'application/pdf');
      setSavedDoc(doc);
      setDone(true);
    } catch (err) {
      setNotice({ tone: 'error', text: `The PDF could not be saved: ${err.message}` });
    } finally {
      setProcessing(false);
    }
  };

  const totalEditsCount = countEdits(doc);
  const multiLineParagraphs = new Set((extractedTextBlocks[currentPageIndex] || []).filter((b) => b.lines.length > 1).map((b) => b.id));
  // paragraphs opened as a whole have no clickable lines left
  const currentExtractedBlocks = (extractedTextBlocks[currentPageIndex] || [])
    .filter((block) => !pageEls.some((el) => el.sourceBlock === block.id));
  const pagePosition = visiblePages.indexOf(currentPageIndex) + 1;
  const sideways = pageRotation % 180 !== 0;
  // a line (with its arrowhead) in page points, for the shape being drawn
  const linePath = (l) => {
    const p1 = [l.x1 * pagePt.width, l.y1 * pagePt.height];
    const p2 = [l.x2 * pagePt.width, l.y2 * pagePt.height];
    let d = `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}`;
    if (l.arrow && Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) > 1) {
      const [a, b] = arrowHead(p1[0], p1[1], p2[0], p2[1], strokeWidth);
      d += ` M${a[0]} ${a[1]} L${p2[0]} ${p2[1]} L${b[0]} ${b[1]}`;
    }
    return d;
  };
  const showTextOptions = activeTool === 'text' || activeTool === 'edit-text' || !!selectedText;
  const showStrokeOptions = STROKE_TOOLS.has(activeTool) || !!strokeTarget;
  const frameCursor = activeTool === 'text' ? 'text' : DRAG_TOOLS.has(activeTool) || PLACE_TOOLS.has(activeTool) ? 'crosshair' : 'default';

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
        <>
          {notice?.tone === 'error' && <p className="ws-note ws-note-warn" role="alert">{notice.text}</p>}
          <FileDropzone
            accept=".pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            label="Drop your PDF to start editing"
            id="edit-dropzone"
          />
        </>
      ) : (
        <div className="editor">
          <header className="editor-bar">
            <button type="button" className="editor-icon-btn" onClick={closeFile} aria-label="Back: close this file" title="Close this file">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div className="editor-file">
              <strong title={file.name}>{file.name}</strong>
              <span title="Your file is edited in your browser and never uploaded">{dirty ? 'Unsaved edits · ' : ''}Edited in your browser · not uploaded</span>
            </div>
            <div className="editor-bar-spacer" />
            <button type="button" className="editor-icon-btn editor-undo" disabled={!history.past.length} onClick={handleUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
            </button>
            <button type="button" className="editor-icon-btn editor-undo" disabled={!history.future.length} onClick={handleRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></svg>
            </button>
            <button type="button" className="btn btn-primary editor-save" onClick={handleSave} disabled={processing} aria-busy={processing} id="save-pdf-button">
              {processing ? 'Saving…' : 'Save PDF'}
            </button>
          </header>
          {/* messages sit right under the bar, so they are seen on a phone too (not scrolled away) */}
          {notice && (
            <p className={`editor-notice${notice.tone === 'error' ? ' is-error' : ''}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
              {notice.text}
              <button type="button" className="editor-notice-close" onClick={() => setNotice(null)} aria-label="Dismiss">×</button>
            </p>
          )}

          <div className="editor-body">
            <nav className="editor-pages" aria-label="Pages">
              {pageThumbs === null ? (
                <span className="editor-pages-loading">Loading pages…</span>
              ) : (
                pageThumbs
                  .filter((thumb) => !doc.deleted.includes(thumb.pageNumber - 1))
                  .map((thumb, position) => {
                    const index = thumb.pageNumber - 1;
                    return (
                      <button
                        key={thumb.pageNumber}
                        type="button"
                        className="editor-page-thumb"
                        aria-current={index === currentPageIndex ? 'page' : undefined}
                        onClick={() => goToPage(index)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- thumbnails are generated in the browser */}
                        <img
                          src={thumb.dataUrl}
                          alt={`Page ${position + 1}`}
                          style={{ transform: `rotate(${doc.rotations[index] || 0}deg)` }}
                        />
                        <span>{position + 1}</span>
                      </button>
                    );
                  })
              )}
            </nav>

            <div className="editor-stage-wrap">
            <div
              className="editor-stage"
              ref={stageRef}
              onPointerDownCapture={handleStagePointerDown}
              onPointerMoveCapture={handleStagePointerMove}
              onPointerUpCapture={handleStagePointerUp}
              onPointerCancelCapture={handleStagePointerUp}
            >
              <div className="editor-stage-bar">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={pagePosition <= 1}
                  onClick={() => goToPage(stepPage(currentPageIndex, -1, totalPages, doc.deleted))}
                  aria-label="Previous page"
                >
                  ←
                </button>
                <span>Page {pagePosition} of {visiblePages.length}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={pagePosition >= visiblePages.length}
                  onClick={() => goToPage(stepPage(currentPageIndex, 1, totalPages, doc.deleted))}
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


              {/* The frame is the page as displayed; the page inside turns with the user's rotation. */}
              <div
                ref={frameRef}
                className={`editor-page-frame${DRAG_TOOLS.has(activeTool) || PLACE_TOOLS.has(activeTool) || activeTool === 'text' ? ' is-creating' : ''}`}
                style={{
                  width: `calc(min(100%, 740px) * ${zoom})`,
                  aspectRatio: sideways ? `${pagePt.height} / ${pagePt.width}` : `${pagePt.width} / ${pagePt.height}`,
                  // tools that draw need the finger; the others leave it free to scroll (pinch is ours)
                  touchAction: DRAG_TOOLS.has(activeTool) ? 'none' : 'pan-x pan-y',
                  cursor: frameCursor,
                }}
                onPointerDown={handleFramePointerDown}
                onPointerMove={handleFramePointerMove}
                onPointerUp={handleFramePointerUp}
                onPointerCancel={handleFramePointerUp}
              >
                <div
                  ref={pageRef}
                  className="editor-page"
                  style={{
                    width: sideways ? `${(pagePt.width / pagePt.height) * 100}%` : '100%',
                    aspectRatio: `${pagePt.width} / ${pagePt.height}`,
                    transform: `translate(-50%, -50%) rotate(${pageRotation}deg)`,
                  }}
                >
                  {/* sized by the page, not its pixels: zooming just scales it until the sharp render lands */}
                  <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

                  {/* Paragraphs of the original PDF: click one to edit it */}
                  <div className="editor-layer">
                    {activeTool === 'edit-text' && currentExtractedBlocks.flatMap((block) =>
                      block.lines.map((_, i) => {
                        const line = lineBlock(block, i);
                        if (pageEls.some((el) => el.sourceBlock === line.id)) return null;
                        return (
                          <div
                            key={line.id}
                            className="editor-block"
                            title="Click to edit this line"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              openLine(block, i, { x: e.clientX, y: e.clientY });
                            }}
                            style={{
                              left: `${line.x * 100}%`,
                              top: `${line.y * 100}%`,
                              width: `${line.width * 100}%`,
                              height: `${line.height * 100}%`,
                            }}
                          />
                        );
                      })
                    )}
                  </div>

                  {/* Added and edited elements */}
                  <div className="editor-layer">
                    {pageEls.map((el) => (
                      <EditElementOverlay
                        key={el.id}
                        el={el}
                        ghost={pristineIds.has(el.id) || pristineIds.has(el.linkedTo)}
                        selected={selectedId === el.id}
                        pagePt={pagePt}
                        onStartDrag={startDrag}
                        onTextChange={handleTextChange}
                        onTextFocus={handleTextFocus}
                        onDuplicate={duplicateElement}
                        onDelete={deleteElement}
                        onParagraph={el.type === 'text' && el.oneLine && multiLineParagraphs.has(el.paragraphId) ? openParagraph : undefined}
                      />
                    ))}
                  </div>

                  {/* What is being drawn right now */}
                  {draft?.kind === 'box' && (
                    <div
                      className={`editor-draft${draft.tool === 'highlight' ? ' edit-el-highlight' : ''}`}
                      style={{
                        left: `${draft.x * 100}%`,
                        top: `${draft.y * 100}%`,
                        width: `${draft.width * 100}%`,
                        height: `${draft.height * 100}%`,
                        backgroundColor: draft.tool === 'erase' ? '#ffffff' : draft.tool === 'highlight' ? activeColor : 'transparent',
                        opacity: draft.tool === 'highlight' ? 0.35 : 1,
                        border: draft.tool === 'shape-rect' || draft.tool === 'shape-ellipse'
                          ? `${(strokeWidth / pagePt.width) * 100}cqw solid ${activeColor}`
                          : '1px dashed var(--primary)',
                        borderRadius: draft.tool === 'shape-ellipse' ? '50%' : undefined,
                      }}
                    />
                  )}
                  {(draft?.kind === 'line' || draft?.kind === 'draw') && (
                    <svg className="edit-el-svg" viewBox={`0 0 ${pagePt.width} ${pagePt.height}`} preserveAspectRatio="none" aria-hidden="true">
                      <path
                        d={draft.kind === 'draw' ? strokePath(draft.points, pagePt.width, pagePt.height) : linePath(draft)}
                        fill="none"
                        stroke={activeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {renderingPage && (
                  <div className="editor-rendering" aria-live="polite">
                    <span>Rendering page…</span>
                  </div>
                )}
              </div>
            </div>

            <EditToolbar
              activeTool={activeTool}
              onTool={setActiveTool}
              onImage={() => imageInputRef.current?.click()}
              onSign={() => setSignOpen(true)}
              stamps={STAMP_PRESETS}
              onStamp={insertStamp}
            />
            </div>

            <aside className="editor-panel" aria-label="Edit options">
              {/* style options; on a phone they slide up above the tool bar while something is selected */}
              <div className={`editor-style-sheet${selectedEl ? ' is-open' : ''}`}>
              <div className="editor-sheet-head">
                <strong>{selectedText ? 'Text' : selectedEl ? 'Style' : ''}</strong>
                <button type="button" className="editor-sheet-done" onClick={() => setSelectedId(null)}>Done</button>
              </div>
              <section>
                <h2>Colour</h2>
                <div className="editor-swatches">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="editor-swatch"
                      aria-label={preset.label}
                      aria-pressed={shownColor === preset.value}
                      onClick={() => changeColor(preset.value)}
                      style={{ backgroundColor: preset.value, '--swatch': preset.value }}
                    />
                  ))}
                  <input
                    type="color"
                    className="editor-swatch-custom"
                    value={shownColor}
                    onChange={(e) => changeColor(e.target.value, true)}
                    aria-label="Custom colour"
                    title="Custom colour"
                  />
                </div>
              </section>

              {showTextOptions && (
                <section>
                  <h2>Text</h2>
                  <label className="ws-field">
                    <span>Font</span>
                    <select
                      className="input"
                      value={shownFont}
                      onChange={(e) => { const v = e.target.value; if (v !== PDF_FONT) changeText('family', v, () => setFontFamily(v)); }}
                    >
                      {usesPdfFont && <option value={PDF_FONT}>Font from this PDF</option>}
                      {EDIT_FONTS.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="editor-text-row">
                    <label className="ws-field">
                      <span>Size</span>
                      <select
                        className="input"
                        value={shownSize}
                        onChange={(e) => { const v = parseInt(e.target.value, 10); changeText('size', v, () => setTextSize(v)); }}
                      >
                        {[...new Set([8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 72, shownSize])].sort((a, b) => a - b).map((s) => (
                          <option key={s} value={s}>{s} pt</option>
                        ))}
                      </select>
                    </label>
                    <div className="editor-style-toggles">
                      <button
                        type="button"
                        aria-pressed={shownBold}
                        aria-label="Bold"
                        style={{ fontWeight: 800 }}
                        onClick={() => changeText('bold', !shownBold, () => setIsBold(!shownBold))}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        aria-pressed={shownItalic}
                        aria-label="Italic"
                        style={{ fontStyle: 'italic' }}
                        onClick={() => changeText('italic', !shownItalic, () => setIsItalic(!shownItalic))}
                      >
                        I
                      </button>
                    </div>
                    <div className="editor-style-toggles editor-align" role="group" aria-label="Alignment">
                      {ALIGN_OPTIONS.map((a) => (
                        <button key={a.id} type="button" aria-pressed={shownAlign === a.id} aria-label={a.label} title={a.label} onClick={() => changeAlign(a.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d={a.path} /></svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {showStrokeOptions && (
                <section>
                  <h2>Line width</h2>
                  <label className="editor-stroke">
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="0.5"
                      value={shownStroke}
                      onChange={(e) => changeStroke(parseFloat(e.target.value))}
                      aria-label="Line width in points"
                    />
                    <output>{shownStroke} pt</output>
                  </label>
                </section>
              )}


              </div>

              <section>
                <h2>This page</h2>
                <div className="editor-page-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={rotateCurrentPage}>
                    <ToolIcon name="rotate" size={14} /> Rotate
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearCurrentPageMarkups} disabled={!pageEls.length}>
                    Clear edits
                  </button>
                  <button type="button" className="btn btn-danger-soft btn-sm" onClick={deleteCurrentPage}>
                    <ToolIcon name="trash" size={14} /> Delete page
                  </button>
                </div>
              </section>

              <p className="editor-help">
                <strong>Edit</strong> lets you click any line of the page to change it, or an item to move it. {totalEditsCount} edit{totalEditsCount === 1 ? '' : 's'} so far.
              </p>
              {done && !dirty && <p className="ws-note ws-note-good">✓ PDF saved.</p>}
            </aside>
          </div>
        </div>
      )}

      {signOpen && (
        <SignatureDialog
          kind="signature"
          ink={signInk}
          onInkChange={setSignInk}
          onClose={() => setSignOpen(false)}
          onCreate={insertSignature}
        />
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
