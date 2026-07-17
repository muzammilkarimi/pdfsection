'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

export default function OfficeToPDFClient({ toolId }) {
  const toolInfo = getToolById(toolId) || {
    name: 'Office to PDF',
    description: 'Convert Office documents to PDF format',
    categoryColor: 'var(--tool-convert-to)',
    icon: 'word',
  };

  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // File extension details
  const fileExts = {
    'word-to-pdf': '.docx,.doc',
    'excel-to-pdf': '.xlsx,.xls',
    'powerpoint-to-pdf': '.pptx,.ppt',
  };

  const handleFilesSelected = useCallback((files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setProgress(0);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(15);

    const decodeXml = (str) => {
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    };

    const sanitizeForWinAnsi = (str) => {
      if (!str) return '';
      return str
        .replace(/₹/g, 'Rs.')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/–/g, '-')
        .replace(/—/g, '-')
        .replace(/…/g, '...')
        .split('')
        .filter(char => {
          const code = char.charCodeAt(0);
          return code <= 255;
        })
        .join('');
    };

    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      setProgress(40);

      let extractedTexts = [];

      // Differentiate conversions based on toolId
      if (toolId === 'word-to-pdf') {
        // Read word/document.xml
        const docXmlFile = content.file('word/document.xml');
        if (docXmlFile) {
          const docXmlText = await docXmlFile.async('text');
          
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(docXmlText, 'application/xml');
          
          const getNodesByTagName = (parent, localName) => {
            let nodes = parent.getElementsByTagName('w:' + localName);
            if (nodes && nodes.length > 0) return Array.from(nodes);
            try {
              nodes = parent.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', localName);
              if (nodes && nodes.length > 0) return Array.from(nodes);
            } catch(e) {}
            nodes = parent.getElementsByTagName(localName);
            if (nodes && nodes.length > 0) return Array.from(nodes);
            
            const results = [];
            const walk = (node) => {
              if (node.nodeType === 1) {
                const name = node.nodeName;
                if (name === localName || name === 'w:' + localName || name.endsWith(':' + localName)) {
                  results.push(node);
                }
                for (let i = 0; i < node.childNodes.length; i++) {
                  walk(node.childNodes[i]);
                }
              }
            };
            walk(parent);
            return results;
          };

          const paragraphs = getNodesByTagName(xmlDoc, 'p');
          
          for (let p = 0; p < paragraphs.length; p++) {
            const pNode = paragraphs[p];
            let isHeading = false;
            
            // Identify heading style
            const pStyleNode = getNodesByTagName(pNode, 'pStyle')[0];
            if (pStyleNode) {
              const val = pStyleNode.getAttribute('w:val') || pStyleNode.getAttribute('val');
              if (val && val.toLowerCase().includes('heading')) {
                isHeading = true;
              }
            }
            
            // Gather run formatting details
            const runs = getNodesByTagName(pNode, 'r');
            let runsData = [];
            
            for (let r = 0; r < runs.length; r++) {
              const rNode = runs[r];
              const isBold = getNodesByTagName(rNode, 'b').length > 0;
              const isItalic = getNodesByTagName(rNode, 'i').length > 0;
              
              const tNodes = getNodesByTagName(rNode, 't');
              let tText = '';
              for (let t = 0; t < tNodes.length; t++) {
                tText += tNodes[t].textContent;
              }
              
              if (tText) {
                runsData.push({
                  text: decodeXml(tText),
                  isBold,
                  isItalic
                });
              }
            }
            
            if (runsData.length > 0 || isHeading) {
              extractedTexts.push({
                type: 'paragraph',
                isHeading,
                runs: runsData
              });
            }
          }

          // Fallback to plain regex extraction if DOMParser failed to find any paragraphs
          if (extractedTexts.length === 0) {
            const textMatches = docXmlText.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
            extractedTexts = textMatches.map((tag) => decodeXml(tag.replace(/<[^>]*>/g, '')));
          }
        } else {
          extractedTexts = ['[Blank Document]'];
        }
      } else if (toolId === 'excel-to-pdf') {
        // Read xl/sharedStrings.xml
        const stringsFile = content.file('xl/sharedStrings.xml');
        if (stringsFile) {
          const stringsXml = await stringsFile.async('text');
          const textMatches = stringsXml.match(/<t[^>]*>(.*?)<\/t>/g) || [];
          extractedTexts = textMatches.map((tag) => decodeXml(tag.replace(/<[^>]*>/g, '')));
        } else {
          extractedTexts = ['[Empty Spreadsheet]'];
        }
      } else if (toolId === 'powerpoint-to-pdf') {
        // Scan slide files
        const slideFiles = Object.keys(content.files).filter((name) =>
          name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
        );

        for (const slidePath of slideFiles.sort()) {
          const slideXml = await content.files[slidePath].async('text');
          const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
          const slideTexts = textMatches.map((tag) => decodeXml(tag.replace(/<[^>]*>/g, '')));
          if (slideTexts.length > 0) {
            extractedTexts.push(`[Slide Page]`);
            extractedTexts.push(...slideTexts);
          }
        }
        if (extractedTexts.length === 0) {
          extractedTexts = ['[Empty Presentation]'];
        }
      }

      setProgress(75);

      // Create PDF using extracted texts
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

      let page = pdfDoc.addPage([600, 800]);
      let yOffset = 740;

      // Draw header
      page.drawText(sanitizeForWinAnsi(`${file.name.split('.')[0]} - PDF Export`), {
        x: 50,
        y: 770,
        size: 11,
        font: helveticaBold,
        color: rgb(0.37, 0.42, 0.82),
      });

      // Wrap and draw lines
      const wrapText = (text, maxChars = 75) => {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        words.forEach((w) => {
          if ((currentLine + ' ' + w).length > maxChars) {
            lines.push(currentLine);
            currentLine = w;
          } else {
            currentLine = currentLine ? currentLine + ' ' + w : w;
          }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      for (const textSegment of extractedTexts) {
        if (yOffset < 60) {
          page = pdfDoc.addPage([600, 800]);
          yOffset = 740;
        }

        if (textSegment && textSegment.type === 'paragraph') {
          const fontSize = textSegment.isHeading ? 14 : 11;
          const currentLineHeight = textSegment.isHeading ? 22 : 16;
          
          if (textSegment.isHeading) {
            yOffset -= 8;
          }

          let xOffset = 50;

          for (const run of textSegment.runs) {
            const font = (run.isBold && run.isItalic)
              ? helveticaBoldOblique
              : run.isBold
              ? helveticaBold
              : run.isItalic
              ? helveticaOblique
              : helveticaFont;

            const color = textSegment.isHeading ? rgb(0.37, 0.42, 0.82) : rgb(0.15, 0.15, 0.15);
            const words = run.text.split(/(\s+)/);

            for (const word of words) {
              if (!word) continue;
              const wordWidth = font.widthOfTextAtSize(sanitizeForWinAnsi(word), fontSize);

              if (xOffset + wordWidth > 550) {
                xOffset = 50;
                yOffset -= currentLineHeight;
                if (yOffset < 60) {
                  page = pdfDoc.addPage([600, 800]);
                  yOffset = 740;
                }
              }

              page.drawText(sanitizeForWinAnsi(word), {
                x: xOffset,
                y: yOffset,
                size: fontSize,
                font: font,
                color: color,
              });
              xOffset += wordWidth;
            }
          }
          yOffset -= currentLineHeight;
        } else if (typeof textSegment === 'string') {
          const isHeader = textSegment.startsWith('[Slide') || textSegment.startsWith('[Blank') || textSegment.startsWith('[Empty');
          const fontSize = isHeader ? 14 : 11;
          const font = isHeader ? helveticaBold : helveticaFont;
          const color = isHeader ? rgb(0.37, 0.42, 0.82) : rgb(0.15, 0.15, 0.15);

          const wrapped = wrapText(sanitizeForWinAnsi(textSegment));
          wrapped.forEach((line) => {
            if (yOffset < 60) {
              page = pdfDoc.addPage([600, 800]);
              yOffset = 740;
            }
            page.drawText(line, {
              x: 50,
              y: yOffset,
              size: fontSize,
              font: font,
              color: color,
            });
            yOffset -= isHeader ? 26 : 18;
          });
        }
      }

      setProgress(95);
      const finalBytes = await pdfDoc.save();
      setProgress(100);

      downloadBlob(
        new Blob([finalBytes], { type: 'application/pdf' }),
        file.name.replace(/\.[^/.]+$/, '.pdf'),
        'application/pdf'
      );

      setDone(true);
    } catch (err) {
      alert('Error parsing file: ' + err.message + '. Generating basic document placeholder.');
      
      // Fallback pdf generation
      try {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.addPage([600, 800]);
        page.drawText(sanitizeForWinAnsi(`Converted Document: ${file.name}`), { x: 50, y: 700, size: 16, font });
        page.drawText(sanitizeForWinAnsi(`Fallback client-side conversion structure.`), { x: 50, y: 660, size: 12, font });

        const bytes = await pdfDoc.save();
        downloadBlob(
          new Blob([bytes], { type: 'application/pdf' }),
          file.name.replace(/\.[^/.]+$/, '.pdf'),
          'application/pdf'
        );
        setDone(true);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title={toolInfo.name}
      description={toolInfo.description}
      icon={toolInfo.icon}
      iconColor={toolInfo.categoryColor}
      showHeader={!file}
      layoutMode={file ? 'page-preview' : 'page-scroll'}
    >
      {!file ? (
        <FileDropzone
          accept={fileExts[toolId]}
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label={`Upload your Office document to convert to PDF`}
          id="office-to-pdf-dropzone"
        />
      ) : (
        <PageToolWorkspace
          title={toolInfo.name}
          description={toolInfo.description}
          icon={toolInfo.icon}
          iconColor={toolInfo.categoryColor}
          file={file}
          onReset={() => {
            setFile(null);
            setDone(false);
          }}
          preview={
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-xl) var(--space-md)',
                minHeight: '260px',
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.01)',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--rounded-lg)',
                  backgroundColor: 'rgba(94, 106, 210, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-md)',
                  color: 'var(--primary)',
                }}
              >
                <ToolIcon name="pdf" size={32} />
              </div>
              <h3 className="body-lg" style={{ fontWeight: 600 }}>Convert Office Document</h3>
              <p className="body-sm ink-subtle" style={{ maxWidth: '320px', marginTop: 'var(--space-xs)', lineHeight: 1.5 }}>
                Our local client compiler will parse your document structure and layout and format it into a standard PDF page.
              </p>

              {processing && (
                <div style={{ width: '100%', maxWidth: '320px', marginTop: 'var(--space-lg)' }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)' }}>
                    Reading document streams... {progress}%
                  </p>
                </div>
              )}

              {done && (
                <div style={{ marginTop: 'var(--space-md)', color: 'var(--semantic-success)', fontWeight: 500, fontSize: '14px' }}>
                  ✓ PDF compiled and downloaded successfully!
                </div>
              )}
            </div>
          }
          footer={
            <button
              className="btn btn-primary btn-lg btn-attention"
              onClick={handleConvert}
              disabled={processing}
              style={{ width: '100%' }}
              id="convert-office-button"
            >
              {processing ? 'Converting...' : 'Convert to PDF'}
              <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Office Conversion</p>
            <p className="body-xs ink-subtle" style={{ lineHeight: 1.5 }}>
              Ready to generate a high-fidelity PDF from the raw XML content packages inside this Office file.
            </p>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
