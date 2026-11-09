// Text with style runs for the Edit PDF editor. A text element may carry `spans`: pieces of its
// text that each keep their own font (bold words inside a sentence, a different typeface...).
// Pure functions, no DOM; shared by the on-page editor and the PDF export.
//
// Span: { text, family?, bold?, italic?, color?, size?, fontId? }
//   Missing fields inherit from the element (fontFamily, isBold, isItalic, color, size).
//   fontId is pdf.js's id of the PDF's own embedded font; it is only valid while family, bold and
//   italic are unchanged from the original, so restyling those drops it.

const STYLE_KEYS = ['family', 'bold', 'italic', 'color', 'size', 'fontId'];
const ELEMENT_KEY = { family: 'fontFamily', bold: 'isBold', italic: 'isItalic', color: 'color', size: 'size', fontId: 'fontId' };

export const elementSpans = (el) => (el.spans?.length ? el.spans : [{ text: el.text || '' }]);
export const spansText = (spans) => spans.map((s) => s.text).join('');

/** The full style a span is drawn with. */
export function resolveStyle(el, span = {}) {
  return {
    family: span.family ?? el.fontFamily ?? 'Helvetica',
    bold: span.bold ?? !!el.isBold,
    italic: span.italic ?? !!el.isItalic,
    color: span.color ?? el.color ?? '#141320',
    size: span.size ?? el.size ?? 16,
    fontId: span.fontId !== undefined ? span.fontId : el.fontId ?? null,
  };
}

const styleOf = (span) => {
  const out = {};
  for (const k of STYLE_KEYS) if (span[k] !== undefined) out[k] = span[k];
  return out;
};
const sameStyle = (a, b) => STYLE_KEYS.every((k) => a[k] === b[k]);

/** Merges neighbours with the same style and drops empty spans. */
export function normalizeSpans(spans) {
  const out = [];
  for (const s of spans) {
    if (!s.text) continue;
    const prev = out[out.length - 1];
    if (prev && sameStyle(prev, s)) prev.text += s.text;
    else out.push({ ...s });
  }
  return out;
}

const isLowSurrogate = (code) => code >= 0xdc00 && code <= 0xdfff;

/**
 * Applies a plain-text edit to styled spans: the unchanged start and end keep their styles and the
 * typed text takes the style of the character before it (or after it, at the very start).
 */
export function applyTextEdit(spans, newText) {
  const old = spansText(spans);
  if (old === newText) return spans;
  let p = 0;
  while (p < old.length && p < newText.length && old[p] === newText[p]) p++;
  let s = 0;
  while (s < old.length - p && s < newText.length - p && old[old.length - 1 - s] === newText[newText.length - 1 - s]) s++;
  // never split a surrogate pair
  while (p > 0 && isLowSurrogate(old.charCodeAt(p))) p--;
  while (s > 0 && isLowSurrogate(old.charCodeAt(old.length - s))) s--;
  const inserted = newText.slice(p, newText.length - s);
  const cutEnd = old.length - s;

  const out = [];
  let pos = 0;
  let insertStyle = null;
  for (const span of spans) {
    const start = pos;
    const end = pos + span.text.length;
    pos = end;
    if (start < p) out.push({ ...span, text: span.text.slice(0, Math.min(end, p) - start) });
    if (insertStyle === null && ((p > 0 && p > start && p <= end) || (p === 0 && start === 0))) insertStyle = styleOf(span);
    if (end > cutEnd) out.push({ ...span, text: span.text.slice(Math.max(start, cutEnd) - start) });
  }
  if (inserted) {
    const style = insertStyle ?? (spans[0] ? styleOf(spans[0]) : {});
    // keep the order: the inserted piece goes between the prefix and suffix pieces
    let prefixLen = 0;
    let i = 0;
    while (i < out.length && prefixLen < p) prefixLen += out[i++].text.length;
    out.splice(i, 0, { ...style, text: inserted });
  }
  return normalizeSpans(out);
}

/** Text and spans after typing; keeps `spans` only while the element really has mixed styles. */
export function textEditPatch(el, newText) {
  if (!el.spans?.length) return { text: newText };
  const spans = applyTextEdit(el.spans, newText);
  return { text: newText, spans };
}

/**
 * Sets a style on the whole element: the element-level value changes and the spans stop
 * overriding it. Changing family, bold or italic leaves the PDF's own font behind.
 */
export function wholeStylePatch(el, key, value) {
  const patch = { [ELEMENT_KEY[key]]: value };
  const dropsFont = key === 'family' || key === 'bold' || key === 'italic';
  if (dropsFont) patch.fontId = null;
  if (el.spans?.length) {
    patch.spans = normalizeSpans(el.spans.map((s) => {
      const next = { ...s };
      delete next[key];
      if (dropsFont) delete next.fontId;
      return next;
    }));
  }
  return patch;
}

/** True when every span resolves to `value` for `key` (e.g. the whole element is bold). */
export function everySpan(el, key, value) {
  return elementSpans(el).every((s) => resolveStyle(el, s)[key] === value);
}

/** Moves a single-style span list into element fields. */
export function simplifySpans(el) {
  const spans = normalizeSpans(el.spans || []);
  if (spans.length > 1) return { ...el, spans };
  const only = spans[0] || { text: el.text || '' };
  const next = { ...el, text: only.text };
  delete next.spans;
  for (const k of STYLE_KEYS) if (only[k] !== undefined) next[ELEMENT_KEY[k]] = only[k];
  return next;
}

/**
 * Lays styled text out in lines. `items` are { text, style }; `measure(text, style)` gives the
 * width in points. Breaks at spaces (and inside a word only when it can't fit alone), and at "\n".
 * Returns [{ runs: [{ text, style, width }], width }].
 */
export function layoutRuns(items, measure, maxWidth = Infinity) {
  // tokens: words (possibly spanning styles), spaces and hard breaks
  const tokens = [];
  let word = null;
  const flushWord = () => {
    if (word) tokens.push(word);
    word = null;
  };
  for (const { text, style } of items) {
    for (const part of text.split(/(\n| +)/)) {
      if (!part) continue;
      if (part === '\n') {
        flushWord();
        tokens.push({ kind: 'break' });
      } else if (part.startsWith(' ')) {
        flushWord();
        tokens.push({ kind: 'space', pieces: [{ text: part, style }] });
      } else {
        if (!word) word = { kind: 'word', pieces: [] };
        word.pieces.push({ text: part, style });
      }
    }
  }
  flushWord();

  const widthOf = (pieces) => pieces.reduce((w, p) => w + measure(p.text, p.style), 0);
  const lines = [];
  let line = [];
  let lineWidth = 0;
  let pendingSpace = null;
  const wrapped = []; // per line: true when the line was wrapped, not ended by a break or the end
  const pushLine = (wrap = false) => {
    lines.push(line);
    wrapped.push(wrap);
    line = [];
    lineWidth = 0;
    pendingSpace = null;
  };
  const place = (pieces, width) => {
    if (pendingSpace && line.length) {
      line.push(...pendingSpace.pieces);
      lineWidth += pendingSpace.width;
    }
    pendingSpace = null;
    line.push(...pieces);
    lineWidth += width;
  };

  for (const t of tokens) {
    if (t.kind === 'break') {
      pushLine();
      continue;
    }
    if (t.kind === 'space') {
      // spaces at the start of a line are kept (indentation); between words they wait for the next word
      if (!line.length) place(t.pieces, widthOf(t.pieces));
      else pendingSpace = { pieces: t.pieces, width: widthOf(t.pieces) };
      continue;
    }
    const w = widthOf(t.pieces);
    const spaceW = pendingSpace && line.length ? pendingSpace.width : 0;
    if (line.length && lineWidth + spaceW + w > maxWidth) pushLine(true);
    if (!line.length && w > maxWidth) {
      // a word longer than the line: break it between characters
      let chunk = [];
      let chunkW = 0;
      for (const piece of t.pieces) {
        for (const ch of piece.text) {
          const cw = measure(ch, piece.style);
          if (chunk.length && chunkW + cw > maxWidth) {
            place(chunk, chunkW);
            pushLine(true);
            chunk = [];
            chunkW = 0;
          }
          const last = chunk[chunk.length - 1];
          if (last && last.style === piece.style) last.text += ch;
          else chunk.push({ text: ch, style: piece.style });
          chunkW += cw;
        }
      }
      if (chunk.length) place(chunk, chunkW);
      continue;
    }
    place(t.pieces, w);
  }
  if (line.length || !lines.length || tokens[tokens.length - 1]?.kind === 'break') {
    lines.push(line);
    wrapped.push(false);
  }

  return lines.map((pieces, i) => {
    const runs = [];
    for (const p of pieces) {
      const last = runs[runs.length - 1];
      if (last && last.style === p.style) last.text += p.text;
      else runs.push({ text: p.text, style: p.style });
    }
    for (const r of runs) r.width = measure(r.text, r.style);
    return { runs, width: runs.reduce((w, r) => w + r.width, 0), wrapped: wrapped[i] };
  });
}
