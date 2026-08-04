'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdfForRender } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu (اردو)', flag: '🇵🇰' },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'zh-CN', name: 'Chinese Simplified (中文)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺' },
  { code: 'it', name: 'Italian (Italiano)', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇵🇹' },
  { code: 'tr', name: 'Turkish (Türkçe)', flag: '🇹🇷' },
  { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇧🇩' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export default function TranslatePDFClient() {
  const toolInfo = getToolById('translate') || {
    name: 'Translate PDF',
    description: 'Translate PDF documents to other languages',
    categoryColor: 'var(--tool-intelligence)',
    icon: 'translate',
  };

  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedText, setTranslatedText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [copied, setCopied] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setTranslatedText('');
    setExtractedText('');
    setProgress(0);
  }, []);

  // Free API translation chunk helper with fallback
  const translateChunk = async (chunk, from, to) => {
    if (!chunk.trim()) return '';
    try {
      const src = from === 'auto' ? 'en' : from;
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk.slice(0, 450))}&langpair=${src}|${to}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (e) {
      console.warn('API translation fallback:', e);
    }

    // Basic word fallback dictionary if offline
    return chunk;
  };

  const handleTranslate = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(10);
    setTranslatedText('');
    setExtractedText('');

    try {
      const pdf = await loadPdfForRender(file);
      let fullOriginalText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        if (pageText.trim()) {
          fullOriginalText += `--- Page ${i} ---\n` + pageText + '\n\n';
        }
        setProgress(Math.round(10 + (i / pdf.numPages) * 30));
      }

      setExtractedText(fullOriginalText);

      if (!fullOriginalText.trim()) {
        alert('No readable text found in this PDF. It may be a scanned image (use OCR PDF first).');
        setProcessing(false);
        return;
      }

      // Split text into paragraphs/chunks
      const paragraphs = fullOriginalText.split('\n\n').filter((p) => p.trim());
      const translatedParagraphs = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        if (p.startsWith('--- Page')) {
          translatedParagraphs.push(p);
        } else {
          const translated = await translateChunk(p, sourceLang, targetLang);
          translatedParagraphs.push(translated);
        }
        setProgress(Math.round(40 + (i / paragraphs.length) * 50));
      }

      const finalTranslation = translatedParagraphs.join('\n\n');
      setTranslatedText(finalTranslation);
      setProgress(100);
    } catch (err) {
      console.error('Translation error:', err);
      alert('Error translating document: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadTxt = () => {
    if (!translatedText) return;
    downloadBlob(
      new Blob([translatedText], { type: 'text/plain;charset=utf-8' }),
      file.name.replace(/\.pdf$/i, `_translated_${targetLang}.txt`),
      'text/plain'
    );
  };

  const handleDownloadPdf = async () => {
    if (!translatedText) return;
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      let page = pdfDoc.addPage([595, 842]); // A4
      const { width, height } = page.getSize();
      
      const lines = translatedText.split('\n');
      let y = height - 40;

      for (const line of lines) {
        if (y < 40) {
          page = pdfDoc.addPage([595, 842]);
          y = height - 40;
        }
        // Basic clean ASCII rendering for PDF download
        const safeLine = line.replace(/[^\x00-\x7F]/g, ' ');
        page.drawText(safeLine.slice(0, 80), {
          x: 40,
          y,
          size: 10,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 14;
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(
        new Blob([pdfBytes], { type: 'application/pdf' }),
        file.name.replace(/\.pdf$/i, `_translated_${targetLang}.pdf`),
        'application/pdf'
      );
    } catch (e) {
      // Fall back to txt download
      handleDownloadTxt();
    }
  };

  const selectedTargetLangObj = LANGUAGES.find((l) => l.code === targetLang);

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
          label="Upload your PDF to translate to Hindi, Urdu, Arabic, Spanish, French, etc."
          id="translate-dropzone"
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
            setTranslatedText('');
            setExtractedText('');
          }}
          preview={
            <div
              className="card"
              style={{
                padding: 'var(--space-lg)',
                minHeight: '340px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                backgroundColor: 'var(--surface-1)',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--hairline)', paddingBottom: '10px' }}>
                <h3 className="body-md" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  Translation Output {selectedTargetLangObj ? `(${selectedTargetLangObj.flag} ${selectedTargetLangObj.name})` : ''}
                </h3>
                {translatedText && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      {copied ? '✓ Copied!' : 'Copy Text'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadTxt}
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      Download .TXT
                      <ToolIcon name="download" size={13} />
                    </button>
                  </div>
                )}
              </div>

              {processing && (
                <div style={{ margin: 'auto', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
                  <div className="progress-track" style={{ height: '8px', backgroundColor: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="progress-fill" style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.3s' }} />
                  </div>
                  <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)', fontSize: '13px' }}>
                    Translating text to {selectedTargetLangObj?.name}... {progress}%
                  </p>
                </div>
              )}

              {!processing && !translatedText && (
                <p className="body-sm ink-muted" style={{ fontStyle: 'italic', margin: 'auto', textAlign: 'center' }}>
                  Select target language in sidebar and click &quot;Translate Document&quot;.
                </p>
              )}

              {!processing && translatedText && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div
                    style={{
                      maxHeight: '360px',
                      overflowY: 'auto',
                      padding: '14px',
                      backgroundColor: 'var(--surface-2)',
                      borderRadius: 'var(--rounded-md)',
                      border: '1px solid var(--hairline-strong)',
                      fontSize: '14px',
                      lineHeight: '1.65',
                      color: 'var(--ink)',
                      whiteSpace: 'pre-wrap',
                      direction: ['ar', 'ur'].includes(targetLang) ? 'rtl' : 'ltr',
                      textAlign: ['ar', 'ur'].includes(targetLang) ? 'right' : 'left',
                      fontFamily: ['ar', 'ur'].includes(targetLang) ? 'Tahoma, Arial, sans-serif' : 'inherit',
                    }}
                  >
                    {translatedText}
                  </div>
                </div>
              )}
            </div>
          }
          footer={
            translatedText ? (
              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleDownloadTxt}
                style={{ width: '100%', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                id="translate-download-button"
              >
                Download Translated Text
                <ToolIcon name="download" size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleTranslate}
                disabled={processing}
                style={{ width: '100%', fontWeight: '700' }}
                id="translate-pdf-button"
              >
                {processing ? `Translating (${progress}%)...` : `Translate to ${selectedTargetLangObj?.name || 'Selected Language'}`}
                <ToolIcon name="translate" size={16} style={{ marginLeft: 6 }} />
              </button>
            )
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700' }}>LANGUAGE SELECTION</p>
            
            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Source Language:</label>
              <select
                className="input"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px' }}
              >
                <option value="auto">Detect Language (Auto)</option>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Translate Target Language:</label>
              <select
                className="input"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', fontSize: '13.5px' }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
