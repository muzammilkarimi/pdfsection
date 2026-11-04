// Works out exactly where the browser puts each line of a text element, so the PDF can draw the
// same lines at the same positions. Measures an off-screen copy at 1:1 scale. Browser only.

import { textCss } from '@/lib/designModel';

function applyCss(node, css) {
  for (const [key, value] of Object.entries(css)) {
    node.style[key] = key === 'fontSize' || key === 'letterSpacing' ? `${value}px` : String(value);
  }
}

const graphemes = (text) => {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
  }
  return Array.from(text);
};

/** Splits one paragraph into the visual lines the browser wraps it into. */
function wrapParagraph(block, text, threshold) {
  block.textContent = text;
  const node = block.firstChild;
  if (!node) return [''];
  const range = document.createRange();
  const lines = [];
  let current = '';
  let top = null;
  let offset = 0;
  for (const g of graphemes(text)) {
    range.setStart(node, offset);
    range.setEnd(node, offset + g.length);
    offset += g.length;
    const rect = range.getClientRects()[0];
    if (rect && rect.width > 0) {
      if (top !== null && rect.top > top + threshold) {
        lines.push(current);
        current = '';
        top = rect.top;
      } else if (top === null) {
        top = rect.top;
      }
    }
    current += g;
  }
  lines.push(current);
  return lines;
}

/**
 * @returns {{ text: string, x: number, baseline: number }[]} every non-empty line, with x and
 *   baseline in points from the top-left of the element's box
 */
export function measureTextLines(el) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';
  document.body.appendChild(host);
  try {
    const box = document.createElement('div');
    box.style.width = `${el.w}px`;
    applyCss(box, textCss(el));
    host.appendChild(box);

    const leading = el.size * el.lineHeight;
    const wrapped = [];
    for (const paragraph of el.text.normalize('NFC').split('\n')) {
      const block = document.createElement('div');
      box.appendChild(block);
      wrapped.push(...wrapParagraph(block, paragraph, leading * 0.6));
      block.remove();
    }

    // Second pass, one line per block: gives each line's real position, including the small shifts
    // a fallback script font can cause. A zero-height inline-block sits exactly on the baseline.
    const result = [];
    let y = 0;
    for (const raw of wrapped) {
      const text = raw.replace(/\s+$/, '');
      const line = document.createElement('div');
      line.style.whiteSpace = 'pre';
      const marker = document.createElement('span');
      marker.style.cssText = 'display:inline-block;width:0;height:0';
      const span = document.createElement('span');
      span.textContent = text || '​';
      line.append(marker, span);
      box.appendChild(line);
      const lineRect = line.getBoundingClientRect();
      if (text) {
        result.push({
          text,
          x: span.getBoundingClientRect().left - lineRect.left,
          baseline: y + marker.getBoundingClientRect().bottom - lineRect.top,
        });
      }
      y += lineRect.height;
      line.remove();
    }
    return result;
  } finally {
    host.remove();
  }
}
