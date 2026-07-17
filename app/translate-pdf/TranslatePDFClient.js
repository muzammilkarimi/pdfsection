'use client';

import { useState, useCallback } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdfForRender } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';

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
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [done, setDone] = useState(false);

  const handleFilesSelected = useCallback((files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setTranslatedText('');
    setDone(false);
    setProgress(0);
  }, []);

  // Simple client-side translation mapping for common words/mock layout
  const mockTranslateText = (text, targetLanguage) => {
    const dictionaries = {
      es: { // Spanish
        the: 'el', and: 'y', pdf: 'PDF', document: 'documento', page: 'página', report: 'informe',
        file: 'archivo', section: 'sección', user: 'usuario', original: 'original', page: 'página',
        interactive: 'interactivo', forms: 'formularios', security: 'seguridad', tools: 'herramientas',
        merge: 'combinar', split: 'dividir', compress: 'comprimir', edit: 'editar', sign: 'firmar'
      },
      fr: { // French
        the: 'le', and: 'et', pdf: 'PDF', document: 'document', page: 'page', report: 'rapport',
        file: 'fichier', section: 'section', user: 'utilisateur', original: 'original', page: 'page',
        interactive: 'interactif', forms: 'formulaires', security: 'sécurité', tools: 'outils',
        merge: 'fusionner', split: 'diviser', compress: 'compresser', edit: 'modifier', sign: 'signer'
      },
      de: { // German
        the: 'das', and: 'und', pdf: 'PDF', document: 'Dokument', page: 'Seite', report: 'Bericht',
        file: 'Datei', section: 'Bereich', user: 'Benutzer', original: 'original', page: 'Seite',
        interactive: 'interaktiv', forms: 'Formulare', security: 'Sicherheit', tools: 'Werkzeuge',
        merge: 'zusammenführen', split: 'teilen', compress: 'komprimieren', edit: 'bearbeiten', sign: 'unterschreiben'
      }
    };

    const dict = dictionaries[targetLanguage] || dictionaries.es;
    
    // Simple word replacement
    return text.split(/\b/).map(word => {
      const lower = word.toLowerCase();
      if (dict[lower]) {
        // Match original case
        const isTitle = word[0] === word[0].toUpperCase();
        const trans = dict[lower];
        return isTitle ? trans[0].toUpperCase() + trans.slice(1) : trans;
      }
      return word;
    }).join('');
  };

  const handleTranslate = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(10);
    setTranslatedText('');

    try {
      const pdf = await loadPdfForRender(file);
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += pageText + ' ';
        setProgress(Math.round(10 + (i / pdf.numPages) * 70));
      }

      setProgress(85);
      const translated = mockTranslateText(fullText, targetLang);
      setTranslatedText(translated);

      setProgress(95);
      downloadBlob(
        new Blob([translated], { type: 'text/plain;charset=utf-8' }),
        file.name.replace('.pdf', `_translated_${targetLang}.txt`),
        'text/plain'
      );
      
      setProgress(100);
      setDone(true);
    } catch (err) {
      alert('Error translating document: ' + err.message);
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
          label="Upload your PDF to translate client-side"
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
            setDone(false);
          }}
          preview={
            <div
              className="card"
              style={{
                padding: 'var(--space-lg)',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                backgroundColor: 'rgba(255,255,255,0.01)',
                width: '100%',
              }}
            >
              <h3 className="body-md" style={{ fontWeight: 600, borderBottom: '1px solid var(--hairline)', paddingBottom: '8px' }}>
                Translation Viewport
              </h3>

              {processing && (
                <div style={{ margin: 'auto', width: '100%', maxWidth: '300px', textAlign: 'center' }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="caption ink-muted" style={{ marginTop: 'var(--space-xs)' }}>
                    Translating segments... {progress}%
                  </p>
                </div>
              )}

              {!processing && !translatedText && (
                <p className="body-sm ink-muted" style={{ fontStyle: 'italic', margin: 'auto', textAlign: 'center' }}>
                  Click "Translate Document" in the sidebar to begin processing.
                </p>
              )}

              {!processing && translatedText && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <p className="body-sm ink-subtle" style={{ lineHeight: 1.6, textAlign: 'justify', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                    {translatedText}
                  </p>
                  
                  <div style={{ alignSelf: 'flex-end', color: 'var(--semantic-success)', fontSize: '13px', fontWeight: 500 }}>
                    ✓ Translated document downloaded (.txt)
                  </div>
                </div>
              )}
            </div>
          }
          footer={
            <button
              className="btn btn-primary btn-lg btn-attention"
              onClick={handleTranslate}
              disabled={processing}
              style={{ width: '100%' }}
              id="translate-pdf-button"
            >
              {processing ? 'Translating...' : 'Translate Document'}
              <ToolIcon name="translate" size={16} style={{ marginLeft: 6 }} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Language Config</p>
            
            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px' }}>Translate from:</label>
              <select
                className="input"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="auto">Detect Language (Auto)</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="caption ink-muted" style={{ display: 'block', marginBottom: '4px' }}>Translate to:</label>
              <select
                className="input"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
              </select>
            </div>
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
