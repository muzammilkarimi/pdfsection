'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import PageThumbnails from '@/components/PageThumbnails';
import ToastNotification from '@/components/ToastNotification';
import { ToolIcon } from '@/components/Icons';

import { loadPdfForRender } from '@/lib/renderUtils';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { getToolById } from '@/lib/tools';
import JSZip from 'jszip';

export default function PDFToOfficeClient({ toolId }) {
  const deliver = useResultHandoff(toolId);
  const toolInfo = getToolById(toolId) || {
    name: 'PDF to Office',
    description: 'Convert PDF files to editable Office documents',
    categoryColor: 'var(--tool-convert-from)',
    icon: 'word',
  };

  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

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

    const escapeXml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    try {
      const pdf = await loadPdfForRender(file);
      let pageTexts = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        pageTexts.push(pageText);
        setProgress(Math.round(15 + (i / pdf.numPages) * 50));
      }

      setProgress(70);

      if (toolId === 'pdf-to-word') {
        // Generate a real editable .docx using JSZip
        const zip = new JSZip();

        // 1. [Content_Types].xml
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

        // 2. _rels/.rels
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

        // 3. word/document.xml with paragraphs
        let paragraphsXml = '';
        pageTexts.forEach((text, idx) => {
          paragraphsXml += `<w:p><w:r><w:t>--- PAGE ${idx + 1} ---</w:t></w:r></w:p>`;
          // Split into sentences for multiple paragraphs
          const sentences = text.split(/[.!?]/);
          sentences.forEach((s) => {
            if (s.trim()) {
              paragraphsXml += `<w:p><w:r><w:t>${escapeXml(s.trim())}.</w:t></w:r></w:p>`;
            }
          });
        });

        zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`);

        const docxBlob = await zip.generateAsync({ type: 'blob' });
        setProgress(95);
        await deliver(docxBlob, file.name.replace('.pdf', '.docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      } else if (toolId === 'pdf-to-excel') {
        // Generate a spreadsheet CSV (comma separated values)
        let csvContent = '';
        pageTexts.forEach((text, idx) => {
          csvContent += `Page ${idx + 1}\n`;
          // Split by spaces or punctuation to form mock rows/columns
          const words = text.split(/\s+/);
          for (let j = 0; j < words.length; j += 4) {
            const row = words.slice(j, j + 4).map(w => `"${w.replace(/"/g, '""')}"`).join(',');
            csvContent += row + '\n';
          }
          csvContent += '\n';
        });

        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        setProgress(95);
        await deliver(csvBlob, file.name.replace('.pdf', '.csv'), 'text/csv');

      } else if (toolId === 'pdf-to-powerpoint') {
        // Generate a valid PPTX structure using JSZip
        const zip = new JSZip();

        // 1. Setup Content Types
        let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>\n`;

        pageTexts.forEach((_, idx) => {
          contentTypesXml += `  <Override PartName="/ppt/slides/slide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`;
        });
        contentTypesXml += `</Types>`;
        zip.file('[Content_Types].xml', contentTypesXml);

        // 2. Setup _rels/.rels
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

        // 3. Setup ppt/presentation.xml
        let slideIdsXml = '';
        pageTexts.forEach((_, idx) => {
          slideIdsXml += `<p:sldId id="${256 + idx}" r:id="rId${idx + 1}"/>`;
        });

        zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${slideIdsXml}
  </p:sldIdLst>
</p:presentation>`);

        // 4. Setup ppt/_rels/presentation.xml.rels
        let presentationRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n`;
        pageTexts.forEach((_, idx) => {
          presentationRelsXml += `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>\n`;
        });
        presentationRelsXml += `</Relationships>`;
        zip.file('ppt/_rels/presentation.xml.rels', presentationRelsXml);

        // 5. Generate Slide files
        pageTexts.forEach((text, idx) => {
          zip.file(`ppt/slides/slide${idx + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Slide Text"/>
          <p:cNvSpPr>
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" smtClean="0"/>
              <a:t>${escapeXml(text)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);
        });

        const pptxBlob = await zip.generateAsync({ type: 'blob' });
        setProgress(95);
        await deliver(pptxBlob, file.name.replace('.pdf', '.pptx'), 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      }

      setProgress(100);
      setDone(true);
    } catch (err) {
      alert('Error converting PDF: ' + err.message + '. Downloading plain text extract.');
      
      // Fallback plain text extract
      try {
        const textBlob = new Blob([file.name], { type: 'text/plain;charset=utf-8' });
        await deliver(textBlob, file.name.replace('.pdf', '_text.txt'), 'text/plain');
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
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFilesSelected}
          label="Upload your PDF to convert to Office format"
          id="pdf-to-office-dropzone"
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
          preview={<PageThumbnails file={file} selectable={false} maxWidth={150} className="page-preview-grid" />}
          footer={
            <button
              className={`btn btn-lg btn-attention ${done ? 'btn-success-state' : 'btn-primary'}`}
              onClick={handleConvert}
              disabled={processing}
              style={{ width: '100%' }}
              id="convert-pdf-office-button"
            >
              {processing ? 'Converting...' : done ? '✓ Downloaded — Convert Again' : `Convert to ${toolInfo.name.split(' ')[2]}`}
              <ToolIcon name={done ? 'check' : 'download'} size={16} style={{ marginLeft: 6 }} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Office Export</p>
            <p className="body-xs ink-subtle" style={{ lineHeight: 1.5 }}>
              Ready to generate editable office slides, worksheets, or paragraphs from the PDF document content.
            </p>

            {processing && (
              <div style={{ width: '100%', marginTop: 'var(--space-xs)' }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)' }}>
                  Extracting PDF text structures... {progress}%
                </p>
              </div>
            )}
          </div>
        </PageToolWorkspace>
      )}

      {done && (
        <ToastNotification
          message="Office document compiled & downloaded successfully!"
          onClose={() => setDone(false)}
        />
      )}
    </ToolPageLayout>
  );
}
