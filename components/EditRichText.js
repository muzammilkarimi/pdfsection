'use client';

// The editable text of a text element: a contentEditable box whose spans keep each run's own
// font, weight and colour. Typing goes through applyTextEdit (lib/richText.js), so the styles
// around the caret are kept. The box lines its first baseline up with where the PDF puts it, so
// opening a line for editing doesn't move it.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { elementSpans, resolveStyle } from '@/lib/richText';
import { cssRunFamily, registerEditFonts, loadEditFont } from '@/lib/editFonts';
import { ASCENT } from '@/lib/pdfTextBlocks';

const supportsPlaintextOnly = () => {
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('div');
  try {
    probe.contentEditable = 'plaintext-only';
    return probe.contentEditable === 'plaintext-only';
  } catch {
    return false;
  }
};

/** Text of an editable box: text nodes, <br> and block elements as line breaks. */
export function readEditableText(root) {
  let out = '';
  const walk = (node, isFirst) => {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 3) out += child.data;
      else if (child.nodeName === 'BR') {
        if (!child.dataset?.end) out += '\n';
      } else if (child.nodeType === 1) {
        const block = child.nodeName === 'DIV' || child.nodeName === 'P';
        if (block && !(isFirst && i === 0) && out && !out.endsWith('\n')) out += '\n';
        walk(child, false);
      }
    }
  };
  walk(root, true);
  return out.replace(/ /g, ' ');
}

// caret position as a character offset, so the DOM can be rebuilt without losing it
function caretOffset(root) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !root.contains(sel.anchorNode)) return null;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(root);
  range.setEnd(sel.anchorNode, sel.anchorOffset);
  const holder = document.createElement('div');
  holder.appendChild(range.cloneContents());
  return readEditableText(holder).length;
}

function placeCaret(root, offset) {
  const sel = window.getSelection();
  if (!sel) return;
  let left = offset;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  let last = null;
  while (node) {
    last = node;
    if (left <= node.data.length) {
      sel.collapse(node, left);
      return;
    }
    left -= node.data.length;
    node = walker.nextNode();
  }
  if (last) sel.collapse(last, last.data.length);
  else sel.collapse(root, 0);
}

/** Puts the caret at a screen point inside `root` (or at the end). */
export function placeCaretAtPoint(root, clientX, clientY) {
  const sel = window.getSelection();
  if (!sel) return;
  let range = null;
  if (clientX !== undefined) {
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(clientX, clientY);
      if (pos && root.contains(pos.offsetNode)) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
      }
    } else if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(clientX, clientY);
      if (r && root.contains(r.startContainer)) range = r;
    }
  }
  if (range) {
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    placeCaret(root, readEditableText(root).length);
  }
}

// ── measuring ──
let measureCtx = null;

/**
 * Natural width (points, no extra letter spacing or squeeze) of each hard line of a text element,
 * measured with the same fonts the editor shows. Waits for the fonts first.
 */
export async function measureLineWidths(el) {
  if (typeof document === 'undefined') return [];
  registerEditFonts();
  const spans = elementSpans(el);
  await Promise.all(spans.map((s) => {
    const st = resolveStyle(el, s);
    return loadEditFont(st.family, st.bold, st.italic);
  }));
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  const ctx = measureCtx;
  if ('fontKerning' in ctx) ctx.fontKerning = 'none';
  const K = 4; // measure at 4 px per point for precision
  const widths = [0];
  for (const span of spans) {
    const st = resolveStyle(el, span);
    ctx.font = `${st.italic ? 'italic ' : ''}${st.bold ? 700 : 400} ${st.size * K}px ${cssRunFamily(st.family, st.fontId)}`;
    span.text.split(/\n/).forEach((piece, i) => {
      if (i > 0) widths.push(0);
      if (piece) widths[widths.length - 1] += ctx.measureText(piece).width / K;
    });
  }
  return widths;
}

// ── baseline alignment ──
// Where a font puts its baseline inside a CSS line box depends on the font's own metrics (and the
// platform). Measure it, then shift the box so the first baseline sits ASCENT font sizes below the
// top, exactly where the PDF export draws it.
const baselineCache = new Map();
function measureBaseline(fontFamily, weight, style, lineHeight) {
  const key = `${fontFamily}|${weight}|${style}|${lineHeight}`;
  if (baselineCache.has(key)) return baselineCache.get(key);
  const box = document.createElement('div');
  box.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-size:100px;line-height:${lineHeight};font-family:${fontFamily};font-weight:${weight};font-style:${style};font-synthesis:none`;
  box.textContent = 'Hxg';
  const marker = document.createElement('span');
  marker.style.cssText = 'display:inline-block;width:1px;height:0;vertical-align:baseline';
  box.appendChild(marker);
  document.body.appendChild(box);
  const ratio = (marker.getBoundingClientRect().top - box.getBoundingClientRect().top) / 100;
  box.remove();
  baselineCache.set(key, ratio);
  return ratio;
}

function useBaselineShift(fontFamily, weight, style, lineHeight) {
  const [shift, setShift] = useState({ key: '', value: 0 });
  const key = `${fontFamily}|${weight}|${style}|${lineHeight}`;
  useEffect(() => {
    let alive = true;
    const run = () => {
      if (alive) setShift({ key, value: ASCENT - measureBaseline(fontFamily, weight, style, lineHeight) });
    };
    // measure once the fonts this text uses have loaded (pdf.js fonts already are)
    const first = fontFamily.split(',')[0].trim();
    Promise.resolve(document.fonts?.load?.(`${style} ${weight} 16px ${first}`))
      .catch(() => {})
      .then(() => document.fonts?.ready)
      .then(run, run);
    return () => { alive = false; };
  }, [key, fontFamily, weight, style, lineHeight]);
  return shift.key === key ? shift.value : 0;
}

const spanCss = (el, span, pagePt) => {
  const st = resolveStyle(el, span);
  return {
    fontFamily: cssRunFamily(st.family, st.fontId),
    fontWeight: st.bold ? 700 : 400,
    fontStyle: st.italic ? 'italic' : 'normal',
    color: st.color,
    fontSize: span.size !== undefined ? `${(st.size / pagePt.width) * 100}cqw` : null,
  };
};

const signature = (el) =>
  JSON.stringify(elementSpans(el).map((s) => ({ ...resolveStyle(el, s), text: s.text })));

/**
 * True when the DOM already shows `el` (the browser applied the typing itself): the same span
 * styles as last built, and each span node holds its span's text.
 */
function domMatches(root, el, builtSig) {
  const strip = (sig) => sig.map(({ text, ...style }) => JSON.stringify(style));
  const now = elementSpans(el).filter((s) => s.text).map((s) => ({ ...resolveStyle(el, s), text: s.text }));
  const before = JSON.parse(builtSig).filter((s) => s.text);
  if (strip(now).join('|') !== strip(before).join('|')) return false;
  const nodes = [...root.childNodes].filter((n) => !(n.nodeName === 'BR' && n.dataset?.end));
  if (nodes.length !== now.length) return false;
  if (!nodes.every((n, i) => n.nodeName === 'SPAN' && n.childNodes.length <= 1 && n.textContent === now[i].text)) return false;
  // a trailing line break must still have its end marker
  const hasEnd = root.lastChild?.nodeName === 'BR' && root.lastChild.dataset?.end;
  return (el.text || '').endsWith('\n') === !!hasEnd;
}

function buildDom(root, el, pagePt) {
  root.textContent = '';
  const spans = elementSpans(el);
  for (const span of spans) {
    if (!span.text) continue;
    const node = document.createElement('span');
    const css = spanCss(el, span, pagePt);
    node.style.fontFamily = css.fontFamily;
    node.style.fontWeight = String(css.fontWeight);
    node.style.fontStyle = css.fontStyle;
    node.style.color = css.color;
    if (css.fontSize) node.style.fontSize = css.fontSize;
    node.textContent = span.text;
    root.appendChild(node);
  }
  // a trailing line break needs something after it to show the empty last line
  if ((el.text || '').endsWith('\n')) {
    const br = document.createElement('br');
    br.dataset.end = '1';
    root.appendChild(br);
  }
}

export default function EditRichText({ el, selected, pagePt, onChange, onFocus }) {
  const ref = useRef(null);
  const builtRef = useRef(null);
  const composingRef = useRef(false);
  const [plaintextOnly] = useState(supportsPlaintextOnly);

  useEffect(() => { registerEditFonts(); }, []);

  // Rebuild the DOM only when the content or styles differ from what is shown (undo, restyle,
  // a style boundary). Plain typing leaves the DOM alone, so the caret never jumps.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const sig = signature(el);
    if (builtRef.current === sig) return;
    if (builtRef.current && domMatches(root, el, builtRef.current)) {
      builtRef.current = sig;
      return;
    }
    const focused = document.activeElement === root;
    const caret = focused ? caretOffset(root) : null;
    buildDom(root, el, pagePt);
    builtRef.current = sig;
    if (focused && caret !== null) placeCaret(root, Math.min(caret, (el.text || '').length));
  });

  const base = resolveStyle(el);
  const baseFamily = cssRunFamily(base.family, base.fontId);
  const lineHeight = el.lineHeight || 1.25;
  const shift = useBaselineShift(baseFamily, base.bold ? 700 : 400, base.italic ? 'italic' : 'normal', lineHeight);

  const handleInput = () => {
    if (composingRef.current) return;
    const text = readEditableText(ref.current);
    // what the DOM now shows counts as built unless the model changes styles around it
    onChange(el.id, text);
  };

  return (
    <div
      ref={ref}
      id={`edit-ta-${el.id}`}
      className="edit-el-rich"
      role="textbox"
      aria-label="Text"
      aria-multiline="true"
      data-placeholder="Type here"
      dir="auto"
      contentEditable={plaintextOnly ? 'plaintext-only' : 'true'}
      suppressContentEditableWarning
      spellCheck={selected}
      onFocus={() => onFocus(el.id)}
      onInput={handleInput}
      onCompositionStart={() => { composingRef.current = true; }}
      onCompositionEnd={() => {
        composingRef.current = false;
        handleInput();
      }}
      onPaste={(e) => {
        if (plaintextOnly) return;
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      }}
      style={{
        fontFamily: baseFamily,
        fontWeight: base.bold ? 700 : 400,
        fontStyle: base.italic ? 'italic' : 'normal',
        lineHeight,
        top: `${shift}em`,
        whiteSpace: el.oneLine ? 'pre' : 'pre-wrap',
        textAlign: el.align || undefined,
        // the original line's letter spacing and squeeze (PDF Tc / Tz), same as the saved file
        letterSpacing: el.charSpacing ? `${(el.charSpacing / pagePt.width) * 100}cqw` : undefined,
        transform: el.hScale && el.hScale !== 1 ? `scaleX(${el.hScale})` : undefined,
        transformOrigin: '0 0',
        // a paragraph box keeps its wrapping width when squeezed
        width: !el.oneLine && el.hScale && el.hScale !== 1 ? `${100 / el.hScale}%` : undefined,
      }}
    />
  );
}
