// Applies the editor's elements, page rotations and page deletions to the original PDF.
// Pure pdf-lib work (plus font fetches for the Unicode fallback); no React.

import { rgb, degrees, StandardFonts, setCharacterSpacing, setTextRenderingMode, setLineWidth, setStrokingColor, TextRenderingMode } from 'pdf-lib';
import { loadPdf, savePdf } from '@/lib/pdfUtils';
import { createUnicodeFallback, isRtlDominant } from '@/lib/unicodeFonts';
import { wrapLine, wrapLineBy, isEncodable, toDrawable, ASCENT } from '@/lib/pdfTextBlocks';

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


/**
 * @returns {Promise<{ bytes: Uint8Array, replacedChars: string[] }>} characters that no bundled font could draw
 */
export async function exportEditedPdf({ file, elements, pageRotations, deletedPages }) {
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
  const helveticaItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const helveticaBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const courierItalic = await pdfDoc.embedFont(StandardFonts.CourierOblique);
  const courierBoldItalic = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
  const replacedChars = new Set();
  let fallback = null;

  const fontMap = {
    Helvetica: { regular: helvetica, bold: helveticaBold, italic: helveticaItalic, boldItalic: helveticaBoldItalic },
    Times: { regular: times, bold: timesBold, italic: timesItalic, boldItalic: timesBoldItalic },
    Courier: { regular: courier, bold: courierBold, italic: courierItalic, boldItalic: courierBoldItalic },
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
      // A. Text element: wraps to its box, keeps unedited lines exactly as wide as the original
      if (el.type === 'text' && el.text) {
        const fontSize = el.size || 16;
        const group = fontMap[el.fontFamily || 'Helvetica'] || fontMap.Helvetica;
        const chosenFont = el.isBold
          ? (el.isItalic ? group.boldItalic : group.bold)
          : (el.isItalic ? group.italic : group.regular);
        const leading = fontSize * (el.lineHeight || 1.25);
        const boxW = (el.width || 0.3) * width;
        const color = hexToRgb(el.color || '#141320');
        const orig = new Map((el.origLines || []).map((l) => [l.text, l.width]));

        // Characters outside WinAnsi (Cyrillic, Greek, ...) use the bundled Unicode font
        let useUnicode = false;
        if (!isEncodable(el.text, chosenFont)) {
          fallback = fallback || createUnicodeFallback(pdfDoc);
          await fallback.prepare(el.text, !!el.isBold, !!el.isItalic);
          const probe = fallback.split(el.text, !!el.isBold, !!el.isItalic);
          useUnicode = probe.runs.length > 0 && probe.runs.every((r) => r.font);
          if (useUnicode) probe.missing.forEach((c) => replacedChars.add(c));
        }
        const runsOf = (t) => fallback.split(t, !!el.isBold, !!el.isItalic).runs;
        const widthOf = useUnicode
          ? (t) => runsOf(t).reduce((sum, r) => sum + r.font.widthOfTextAtSize(r.text, fontSize), 0)
          : (t) => chosenFont.widthOfTextAtSize(t, fontSize);

        const outLines = [];
        for (const hard of el.text.split('\n')) {
          if (useUnicode) {
            wrapLineBy(hard, widthOf, boxW).forEach((piece) => outLines.push(piece));
          } else {
            const safe = toDrawable(hard, chosenFont);
            safe.replaced.forEach((c) => replacedChars.add(c));
            wrapLine(safe.text, chosenFont, fontSize, boxW).forEach((piece) => outLines.push(piece));
          }
        }

        // optional outline thickens strokes so substitute fonts match a heavier original
        const drawWith = (text, font, x, y) => {
          if (font.isOutline) {
            // shaped Devanagari: glyph outlines drawn as one vector path
            page.drawSvgPath(font.path(text, fontSize), {
              x,
              y,
              color,
              ...(el.boost > 0 || font.synthBold
                ? { borderColor: color, borderWidth: el.boost > 0 ? el.boost : fontSize * 0.03 }
                : {}),
            });
            return;
          }
          if (el.boost > 0) {
            page.pushOperators(setTextRenderingMode(TextRenderingMode.FillAndOutline), setLineWidth(el.boost), setStrokingColor(color));
            page.drawText(text, { x, y, size: fontSize, font, color });
            page.pushOperators(setTextRenderingMode(TextRenderingMode.Fill));
          } else {
            page.drawText(text, { x, y, size: fontSize, font, color });
          }
        };
        const drawLine = (text, x, y) => {
          if (!useUnicode) return drawWith(text, chosenFont, x, y);
          let cx = x;
          for (const r of runsOf(text)) {
            drawWith(r.text, r.font, cx, y);
            cx += r.font.widthOfTextAtSize(r.text, fontSize);
          }
        };

        outLines.forEach((lineText, lIdx) => {
          if (!lineText) return;
          // right-to-left lines (Arabic, Hebrew) hug the right edge of the box
          const x = Math.max(0, el.x * width + (useUnicode && isRtlDominant(lineText) ? Math.max(0, boxW - widthOf(lineText)) : 0));
          const y = (1 - el.y) * height - fontSize * ASCENT - lIdx * leading;
          // unedited line: stretch/squeeze letter spacing so it ends where the original did
          const target = orig.get(lineText);
          if (target && lineText.length > 1 && !(useUnicode && runsOf(lineText).some((r) => r.font.isOutline))) {
            const natural = widthOf(lineText);
            const spacing = Math.max(-fontSize * 0.1, Math.min(fontSize * 0.2, (target - natural) / (lineText.length - 1)));
            page.pushOperators(setCharacterSpacing(spacing));
            drawLine(lineText, x, y);
            page.pushOperators(setCharacterSpacing(0));
          } else {
            drawLine(lineText, x, y);
          }
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

        const textSize = Math.min(stampH * 0.5, (stampW - 16) / helveticaBold.widthOfTextAtSize(el.text, 1));
        const textWidth = helveticaBold.widthOfTextAtSize(el.text, textSize);
        page.drawText(el.text, {
          x: stampX + (stampW - textWidth) / 2,
          y: stampY + (stampH - helveticaBold.heightAtSize(textSize, { descender: false })) / 2,
          size: textSize,
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

  const bytes = await savePdf(pdfDoc);
  return { bytes, replacedChars: [...replacedChars] };
}
