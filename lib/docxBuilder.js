// Builds a .docx from the page model produced by lib/pdfLayout.js.
//
// "Exact layout" strategy: every PDF page becomes one Word section of the same
// size with zero margins. Each line/segment of text is a page-anchored frame
// (w:framePr) at its original coordinates, so it stays real, editable text.
// Images are anchored behind the text at their original position.

import JSZip from 'jszip';

const PT = 20; // twips per point
const EMU = 12700; // EMUs per point
// Word's "exact" line height puts the baseline this far below the frame top (in font sizes).
const LINE_HEIGHT = 1.2;
const BASELINE_FROM_TOP = 0.99;

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// XML 1.0 forbids most control characters
const clean = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '');

const tw = (pt) => Math.round(pt * PT);

const KNOWN = [
  'Arial', 'Calibri', 'Cambria', 'Candara', 'Consolas', 'Constantia', 'Corbel', 'Courier New',
  'Georgia', 'Garamond', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Segoe UI',
  'Palatino Linotype', 'Book Antiqua', 'Century Gothic', 'Comic Sans MS', 'Impact',
];

/** Map a PDF font family to a font Word will have. */
export function mapFont(family = '', cssFamily = '') {
  const norm = family.replace(/[\s_-]/g, '').toLowerCase();
  const exact = KNOWN.find((k) => k.replace(/\s/g, '').toLowerCase() === norm);
  if (exact) return exact;
  if (/helvetica|arial|liberationsans|nimbussans/.test(norm)) return 'Arial';
  if (/times|liberationserif|nimbusroman/.test(norm)) return 'Times New Roman';
  if (/courier|mono|consolas|liberationmono/.test(norm)) return 'Courier New';
  if (/calibri|carlito/.test(norm)) return 'Calibri';
  if (/cambria|caladea/.test(norm)) return 'Cambria';
  if (/symbol/.test(norm)) return 'Symbol';
  if (/serif/.test(cssFamily) && !/sans/.test(cssFamily)) return 'Times New Roman';
  if (/mono/.test(cssFamily)) return 'Courier New';
  if (/garamond|georgia|palatino|bookman|minion|serif/.test(norm) && !/sans/.test(norm)) return 'Times New Roman';
  return 'Arial';
}

function runXml(run, measure) {
  const font = mapFont(run.family, run.cssFamily);
  const text = clean(run.text);
  if (!text) return '';

  // Stretch/squeeze letter spacing so the substituted font ends at the PDF's width.
  let spacing = 0;
  if (measure && text.length > 1) {
    const w = measure(text, font, run.size, run.bold, run.italic);
    if (w > 0) {
      const perChar = (run.width - w) / text.length;
      const limit = Math.max(0.5, run.size * 0.15);
      spacing = tw(Math.max(-limit, Math.min(limit, perChar)));
    }
  }

  const rPr =
    `<w:rFonts w:ascii="${esc(font)}" w:hAnsi="${esc(font)}" w:cs="${esc(font)}" w:eastAsia="${esc(font)}"/>` +
    (run.bold ? '<w:b/><w:bCs/>' : '') +
    (run.italic ? '<w:i/><w:iCs/>' : '') +
    (run.color && run.color !== '000000' ? `<w:color w:val="${run.color}"/>` : '') +
    (spacing ? `<w:spacing w:val="${spacing}"/>` : '') +
    `<w:sz w:val="${Math.max(2, Math.round(run.size * 2))}"/><w:szCs w:val="${Math.max(2, Math.round(run.size * 2))}"/>`;

  return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function segmentXml(seg, measure) {
  const height = seg.size * LINE_HEIGHT;
  const top = seg.baseline - seg.size * BASELINE_FROM_TOP;
  // slack keeps Word from wrapping when its glyphs run slightly wider than the PDF's
  const width = seg.width + seg.size * 1.5;
  const x = Math.max(0, seg.x);
  const y = Math.max(0, top);
  const runs = seg.runs.map((r) => runXml(r, measure)).join('');
  if (!runs) return '';
  return (
    `<w:p><w:pPr>` +
    `<w:framePr w:w="${tw(width)}" w:h="${tw(height)}" w:hRule="exact" w:wrap="around" ` +
    `w:vAnchor="page" w:hAnchor="page" w:x="${tw(x)}" w:y="${tw(y)}"/>` +
    `<w:spacing w:before="0" w:after="0" w:line="${tw(height)}" w:lineRule="exact"/>` +
    `<w:ind w:left="0" w:right="0" w:firstLine="0"/>` +
    `</w:pPr>${runs}</w:p>`
  );
}

function imageXml(img, rId, docPrId) {
  const cx = Math.round(img.width * EMU);
  const cy = Math.round(img.height * EMU);
  return (
    `<w:r><w:drawing>` +
    `<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${docPrId}" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">` +
    `<wp:simplePos x="0" y="0"/>` +
    `<wp:positionH relativeFrom="page"><wp:posOffset>${Math.round(img.x * EMU)}</wp:posOffset></wp:positionH>` +
    `<wp:positionV relativeFrom="page"><wp:posOffset>${Math.round(img.y * EMU)}</wp:posOffset></wp:positionV>` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/>` +
    `<wp:docPr id="${docPrId}" name="Picture ${docPrId}"/><wp:cNvGraphicFramePr/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${docPrId}" name="image${docPrId}.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`
  );
}


function shapeXml(sh, id) {
  const cx = Math.max(1, Math.round(sh.w * EMU));
  const cy = Math.max(1, Math.round(sh.h * EMU));
  const fill = sh.fill ? `<a:solidFill><a:srgbClr val="${sh.fill}"/></a:solidFill>` : '<a:noFill/>';
  const ln = sh.stroke
    ? `<a:ln w="${Math.round(Math.max(0.25, sh.strokeW) * EMU)}"><a:solidFill><a:srgbClr val="${sh.stroke}"/></a:solidFill></a:ln>`
    : '<a:ln><a:noFill/></a:ln>';
  return (
    `<w:r><w:drawing>` +
    `<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${id}" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">` +
    `<wp:simplePos x="0" y="0"/>` +
    `<wp:positionH relativeFrom="page"><wp:posOffset>${Math.round(sh.x * EMU)}</wp:posOffset></wp:positionH>` +
    `<wp:positionV relativeFrom="page"><wp:posOffset>${Math.round(sh.y * EMU)}</wp:posOffset></wp:positionV>` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/>` +
    `<wp:docPr id="${id}" name="Shape ${id}"/><wp:cNvGraphicFramePr/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">` +
    `<wps:wsp><wps:cNvSpPr/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill}${ln}</wps:spPr><wps:bodyPr/></wps:wsp>` +
    `</a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`
  );
}


// ---- tables -----------------------------------------------------------------------------

const borderXml = (name, b) =>
  b ? `<w:${name} w:val="single" w:sz="${Math.max(2, Math.round(b.w * 8))}" w:space="0" w:color="${b.color}"/>` : `<w:${name} w:val="nil"/>`;

function cellParasXml(cell, measure) {
  if (!cell.paras || !cell.paras.length) {
    return '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>';
  }
  return cell.paras
    .map((p, i) => {
      const next = cell.paras[i + 1];
      const line = next ? Math.max(p.size * 1.05, next.baseline - p.baseline) : p.size * LINE_HEIGHT;
      const runs = p.runs.map((r) => runXml(r, measure)).join('');
      return (
        `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${tw(line)}" w:lineRule="exact"/>` +
        `<w:ind w:left="0" w:right="0" w:firstLine="0"/><w:jc w:val="${p.align === 'center' ? 'center' : p.align === 'right' ? 'right' : 'left'}"/></w:pPr>${runs}</w:p>`
      );
    })
    .join('');
}

/** A detected table (see lib/pdfTables.js) as a page-anchored floating Word table. */
function tableXml(tbl, measure) {
  const cols = tbl.cols;
  let xml =
    `<w:tbl><w:tblPr>` +
    `<w:tblpPr w:leftFromText="0" w:rightFromText="0" w:topFromText="0" w:bottomFromText="0" w:vertAnchor="page" w:horzAnchor="page" w:tblpX="${tw(tbl.x)}" w:tblpY="${tw(tbl.y)}"/>` +
    `<w:tblW w:w="${tw(tbl.width)}" w:type="dxa"/><w:tblLayout w:type="fixed"/>` +
    `<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar>` +
    `</w:tblPr><w:tblGrid>${cols.map((w) => `<w:gridCol w:w="${tw(w)}"/>`).join('')}</w:tblGrid>`;

  tbl.grid.forEach((row, r) => {
    xml += `<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="${tw(tbl.rows[r])}" w:hRule="atLeast"/></w:trPr>`;
    row.forEach((entry, c) => {
      const master = entry.cover ? entry.cover : entry;
      if (entry.cover && (entry.cover.r === r || !entry.first)) return; // covered by a column span
      const cont = !!entry.cover; // continuation of a vertical merge
      let width = 0;
      for (let k = master.c; k < master.c + master.cs; k++) width += cols[k];
      const b = master.borders || {};
      let tcPr = `<w:tcW w:w="${tw(width)}" w:type="dxa"/>`;
      if (master.cs > 1) tcPr += `<w:gridSpan w:val="${master.cs}"/>`;
      if (master.rs > 1) tcPr += cont ? '<w:vMerge/>' : '<w:vMerge w:val="restart"/>';
      tcPr += `<w:tcBorders>${borderXml('top', b.top)}${borderXml('left', b.left)}${borderXml('bottom', b.bottom)}${borderXml('right', b.right)}</w:tcBorders>`;
      if (master.fill) tcPr += `<w:shd w:val="clear" w:color="auto" w:fill="${master.fill}"/>`;
      if (!cont) tcPr += `<w:tcMar><w:top w:w="${tw(master.padTop || 0)}" w:type="dxa"/><w:left w:w="${master.paras?.length ? tw(master.padLeft) : 60}" w:type="dxa"/><w:right w:w="${master.paras?.length ? tw(master.padRight) : 60}" w:type="dxa"/></w:tcMar>`;
      if (!cont && master.valign && master.valign !== 'top') tcPr += `<w:vAlign w:val="${master.valign === 'center' ? 'center' : 'bottom'}"/>`;
      xml += `<w:tc><w:tcPr>${tcPr}</w:tcPr>${cont ? cellParasXml({}, measure) : cellParasXml(master, measure)}</w:tc>`;
    });
    xml += '</w:tr>';
  });
  return xml + '</w:tbl>';
}

const SPACER_P = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>';

const sectPr = (page) =>
  `<w:sectPr><w:pgSz w:w="${tw(page.width)}" w:h="${tw(page.height)}"/>` +
  `<w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;

/**
 * @param {Array} pages   output of extractDocumentLayout
 * @param {{ measureText?: (text, font, sizePt, bold, italic) => number, title?: string }} opts
 * @returns {Promise<Blob|Uint8Array>}
 */
export async function buildDocx(pages, opts = {}) {
  const { measureText, title = 'Converted from PDF' } = opts;
  const zip = new JSZip();
  const mediaRels = [];
  let mediaCount = 0;
  let shapeCount = 0;
  let body = '';

  pages.forEach((page, idx) => {
    const isLast = idx === pages.length - 1;
    let anchors = '';
    // shapes first (lowest z-order), then pictures
    for (const sh of page.shapes || []) anchors += shapeXml(sh, 10000 + (shapeCount += 1));
    for (const img of page.images) {
      mediaCount += 1;
      const rId = `rIdImg${mediaCount}`;
      zip.file(`word/media/image${mediaCount}.png`, img.png);
      mediaRels.push(
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${mediaCount}.png"/>`
      );
      anchors += imageXml(img, rId, mediaCount);
    }

    body += page.segments.map((s) => segmentXml(s, measureText)).join('');
    // detected tables are floating, page-anchored Word tables; a paragraph must separate neighbours
    for (const tbl of page.tables || []) body += tableXml(tbl, measureText) + SPACER_P;

    // Anchor paragraph: hosts the images, ends the page's section. 1pt tall so it never spills.
    const tail =
      `<w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/>` +
      `<w:rPr><w:sz w:val="2"/></w:rPr>${isLast ? '' : sectPr(page)}</w:pPr>`;
    body += `<w:p>${tail}${anchors}</w:p>`;
    if (isLast) body += sectPr(page);
  });

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`
  );

  zip.file(
    'docProps/core.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(title)}</dc:title></cp:coreProperties>`
  );

  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  ${mediaRels.join('\n  ')}
</Relationships>`
  );

  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`
  );

  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
<w:body>${body}</w:body>
</w:document>`
  );

  return zip.generateAsync({ type: typeof Blob !== 'undefined' ? 'blob' : 'uint8array', compression: 'DEFLATE' });
}

/** Browser helper: measure text with canvas using the mapped font. */
export function canvasMeasure() {
  if (typeof document === 'undefined') return undefined;
  const ctx = document.createElement('canvas').getContext('2d');
  return (text, font, sizePt, bold, italic) => {
    ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${sizePt}px "${font}"`;
    return ctx.measureText(text).width;
  };
}
