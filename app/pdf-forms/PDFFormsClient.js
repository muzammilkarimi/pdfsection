'use client';

import { useState, useCallback, useEffect } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import FileDropzone from '@/components/FileDropzone';
import PageToolWorkspace from '@/components/PageToolWorkspace';
import { ToolIcon } from '@/components/Icons';
import { loadPdfForRender, renderPageToCanvas } from '@/lib/renderUtils';
import { downloadBlob } from '@/lib/pdfUtils';
import { getToolById } from '@/lib/tools';
import { PDFDocument } from 'pdf-lib';

export default function PDFFormsClient() {
  const toolInfo = getToolById('pdf-forms') || {
    name: 'PDF Forms',
    description: 'Fill out and create interactive PDF forms',
    categoryColor: 'var(--tool-edit)',
    icon: 'forms',
  };

  const [file, setFile] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // File loading
  const handleFilesSelected = useCallback(async (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setFieldValues({});
    setCurrentPageIndex(0);

    try {
      // 1. Load for visual rendering
      const renderDoc = await loadPdfForRender(f);
      setPdfRenderDoc(renderDoc);
      setTotalPages(renderDoc.numPages);

      // 2. Parse form fields using pdf-lib
      const fileBuffer = await f.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const form = pdfDoc.getForm();
      const rawFields = form.getFields();

      const parsedFields = rawFields.map((field) => {
        const name = field.getName();
        let type = 'text';
        let options = [];
        let value = '';

        const constructorName = field.constructor.name;
        if (constructorName === 'PDFTextField' || typeof field.getText === 'function') {
          type = 'text';
          try { value = field.getText() || ''; } catch (e) {}
        } else if (constructorName === 'PDFCheckBox' || typeof field.isChecked === 'function') {
          type = 'checkbox';
          try { value = field.isChecked() ? 'true' : 'false'; } catch (e) {}
        } else if (constructorName === 'PDFDropdown' || typeof field.getSelected === 'function') {
          type = 'dropdown';
          try {
            value = field.getSelected()?.[0] || '';
            options = field.getOptions() || [];
          } catch (e) {}
        } else if (constructorName === 'PDFRadioGroup' || typeof field.getSelected === 'function') {
          type = 'radio';
          try {
            value = field.getSelected() || '';
            options = field.getOptions() || [];
          } catch (e) {}
        }

        return { name, type, value, options };
      });

      setFields(parsedFields);
      
      // Initialize state values
      const initialValues = {};
      parsedFields.forEach((fd) => {
        initialValues[fd.name] = fd.value;
      });
      setFieldValues(initialValues);

    } catch (err) {
      alert('Error parsing PDF forms: ' + err.message);
    }
  }, []);

  const handleSaveForm = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const form = pdfDoc.getForm();

      // Write values back
      fields.forEach((fd) => {
        const val = fieldValues[fd.name];
        try {
          if (fd.type === 'text') {
            const field = form.getTextField(fd.name);
            field.setText(val || '');
          } else if (fd.type === 'checkbox') {
            const field = form.getCheckBox(fd.name);
            if (val === 'true') {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (fd.type === 'dropdown') {
            const field = form.getDropdown(fd.name);
            if (val) {
              field.select(val);
            }
          } else if (fd.type === 'radio') {
            const field = form.getRadioGroup(fd.name);
            if (val) {
              field.select(val);
            }
          }
        } catch (e) {
          console.warn(`Error setting field ${fd.name}:`, e);
        }
      });

      // Compile and download
      const finalBytes = await pdfDoc.save();
      downloadBlob(
        new Blob([finalBytes], { type: 'application/pdf' }),
        file.name.replace('.pdf', '_filled.pdf'),
        'application/pdf'
      );

      setDone(true);
    } catch (err) {
      alert('Error compiling filled form PDF: ' + err.message);
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
          label="Upload your interactive PDF Form"
          id="forms-dropzone"
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
            setPdfRenderDoc(null);
            setFields([]);
            setDone(false);
          }}
          preview={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-md)',
                backgroundColor: 'rgba(255,255,255,0.01)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--rounded-lg)',
                border: '1px solid var(--hairline-strong)',
                width: '100%',
              }}
            >
              <h3 className="body-sm ink-muted">Form Preview</h3>
              <div
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  height: '340px',
                  borderRadius: 'var(--rounded-md)',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-subtle)',
                  fontStyle: 'italic',
                  fontSize: '13px',
                }}
              >
                Interactive form preview loaded ({totalPages} pages)
              </div>
            </div>
          }
          footer={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
              {done && (
                <div style={{ padding: '8px', borderRadius: 'var(--rounded-md)', backgroundColor: 'rgba(39, 166, 68, 0.08)', color: 'var(--semantic-success)', fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
                  ✓ PDF form filled and downloaded!
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-attention"
                onClick={handleSaveForm}
                disabled={processing}
                style={{ width: '100%' }}
                id="fill-forms-button"
              >
                {processing ? 'Compiling...' : 'Download Filled PDF'}
                <ToolIcon name="download" size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p className="eyebrow" style={{ color: 'var(--ink-subtle)' }}>Fill Form Fields</p>

            {fields.length === 0 ? (
              <p className="body-xs ink-subtle" style={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                No interactive form fields detected in this PDF. You can still export to download a copy.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                {fields.map((fd) => (
                  <div key={fd.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className="caption ink-muted" style={{ fontWeight: 600 }}>{fd.name}</label>
                    {fd.type === 'text' && (
                      <input
                        type="text"
                        className="input"
                        value={fieldValues[fd.name] || ''}
                        onChange={(e) => setFieldValues({ ...fieldValues, [fd.name]: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                      />
                    )}
                    {fd.type === 'checkbox' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={fieldValues[fd.name] === 'true'}
                          onChange={(e) => setFieldValues({ ...fieldValues, [fd.name]: e.target.checked ? 'true' : 'false' })}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span>Checked</span>
                      </label>
                    )}
                    {fd.type === 'dropdown' && (
                      <select
                        className="input"
                        value={fieldValues[fd.name] || ''}
                        onChange={(e) => setFieldValues({ ...fieldValues, [fd.name]: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                      >
                        <option value="">Select option...</option>
                        {fd.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {fd.type === 'radio' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {fd.options.map((opt) => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name={fd.name}
                              value={opt}
                              checked={fieldValues[fd.name] === opt}
                              onChange={() => setFieldValues({ ...fieldValues, [fd.name]: opt })}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </PageToolWorkspace>
      )}
    </ToolPageLayout>
  );
}
