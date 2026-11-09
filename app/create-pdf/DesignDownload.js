'use client';

import { useEffect, useRef, useState } from 'react';
import { useResultHandoff } from '@/lib/useResultHandoff';
import { downloadBlob } from '@/lib/pdfUtils';
import { designForFile } from '@/lib/designAssets';
import { saveDesign } from '@/lib/designStore';
import { toUnit } from '@/lib/designModel';
import { parseRange } from '@/lib/pageRange';
import DesignIcon from './DesignIcons';

const FORMATS = [
  { id: 'pdf', label: 'PDF', hint: 'Print quality, sharp text', mime: 'application/pdf' },
  { id: 'png', label: 'PNG', hint: 'Image, for sharing', mime: 'image/png' },
  { id: 'jpg', label: 'JPG', hint: 'Smaller image', mime: 'image/jpeg' },
];

const safeName = (name) => name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').toLowerCase().slice(0, 80) || 'design';

export default function DesignDownload({ design, pageIdx, onClose }) {
  const deliver = useResultHandoff('create-pdf');
  const dialogRef = useRef(null);
  const [format, setFormat] = useState('pdf');
  const [pages, setPages] = useState('all');
  const [range, setRange] = useState('');
  const [dpi, setDpi] = useState(300);
  const [bleed, setBleed] = useState(false);
  const [keepSelectable, setKeepSelectable] = useState(true);
  const [fileName, setFileName] = useState(() => safeName(design.name));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null); // finished result held back while warning about replaced characters

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const total = design.pages.length;
  const isPx = design.unit === 'px';
  const current = FORMATS.find((f) => f.id === format);
  const outputW = Math.round(isPx ? toUnit(design.width, 'px') * (dpi >= 300 ? 2 : 1) : (design.width / 72) * dpi);
  const outputH = Math.round(isPx ? toUnit(design.height, 'px') * (dpi >= 300 ? 2 : 1) : (design.height / 72) * dpi);

  const pageIndexes = () => {
    if (pages === 'all') return design.pages.map((_, i) => i);
    if (pages === 'current') return [pageIdx];
    return parseRange(range, total);
  };

  const finish = async ({ data, name, mime }) => {
    await saveDesign(design).catch(() => {});
    await deliver(data, name, mime);
  };

  const run = async () => {
    const indexes = pageIndexes();
    if (!indexes) {
      setError(`Enter pages between 1 and ${total}, like 1-3, 5.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { exportDesignPdf, exportDesignImages } = await import('@/lib/designExport');
      const base = safeName(fileName);
      let result;
      let replacedChars;
      if (format === 'pdf') {
        const out = await exportDesignPdf(design, { pageIndexes: indexes, dpi, bleed, keepSelectable });
        replacedChars = out.replacedChars;
        result = { data: out.bytes, name: `${base}.pdf`, mime: current.mime };
      } else {
        const out = await exportDesignImages(design, { pageIndexes: indexes, dpi, format });
        replacedChars = out.replacedChars;
        if (out.blobs.length === 1) {
          result = { data: out.blobs[0], name: `${base}.${format}`, mime: current.mime };
        } else {
          const { default: JSZip } = await import('jszip');
          const zip = new JSZip();
          out.blobs.forEach((blob, i) => zip.file(`${base}-${indexes[i] + 1}.${format}`, blob));
          result = { data: await zip.generateAsync({ type: 'blob' }), name: `${base}.zip`, mime: 'application/zip' };
        }
      }
      if (replacedChars.length) {
        setPending({ result, chars: replacedChars });
        setBusy(false);
        return;
      }
      await finish(result);
    } catch (err) {
      console.error(err);
      setError(err?.message?.includes('font') ? err.message : 'Something went wrong while making your file. Please try again.');
      setBusy(false);
    }
  };

  const saveCopy = () => {
    downloadBlob(new Blob([JSON.stringify(designForFile(design))], { type: 'application/json' }), `${safeName(fileName)}.pdfsection.json`, 'application/json');
  };

  return (
    <dialog ref={dialogRef} className="ds-dialog" aria-labelledby="ds-dl-title" onClose={onClose}>
      <div className="ds-dialog-head">
        <h2 id="ds-dl-title">Download</h2>
        <button type="button" className="ds-icon-btn" aria-label="Close" onClick={onClose}><DesignIcon name="close" /></button>
      </div>

      <div className="ds-dialog-body">
        <div className="ds-group ds-group-tight">
          <span className="ds-dialog-label">File type</span>
          <div className="ds-format-grid">
            {FORMATS.map((f) => (
              <button key={f.id} type="button" className={`ds-format ${format === f.id ? 'active' : ''}`} aria-pressed={format === f.id} onClick={() => setFormat(f.id)}>
                <strong>{f.label}</strong>
                <span>{f.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ds-grid-2">
          <label className="ds-dialog-field">
            <span className="ds-dialog-label">Pages</span>
            <select value={pages} onChange={(e) => setPages(e.target.value)}>
              <option value="all">All pages ({total})</option>
              <option value="current">Current page</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          <label className="ds-dialog-field">
            <span className="ds-dialog-label">{format === 'pdf' ? 'Image quality' : 'Image size'}</span>
            <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
              {format === 'pdf' || !isPx ? (
                <>
                  <option value={300}>Print (300 DPI)</option>
                  <option value={150}>Standard (150 DPI)</option>
                  <option value={96}>Small file (96 DPI)</option>
                </>
              ) : (
                <>
                  <option value={150}>Exact size</option>
                  <option value={300}>Double size</option>
                </>
              )}
            </select>
          </label>
        </div>

        {pages === 'custom' && (
          <label className="ds-dialog-field">
            <span className="ds-dialog-label">Page range</span>
            <input value={range} placeholder={`e.g. 1-${Math.max(1, total)}`} onChange={(e) => setRange(e.target.value)} />
          </label>
        )}

        {format === 'pdf' && (
          <div className="ds-checks">
            <label><input type="checkbox" checked={bleed} onChange={(e) => setBleed(e.target.checked)} /> Add 3 mm bleed and crop marks (for print shops)</label>
            <label><input type="checkbox" checked={keepSelectable} onChange={(e) => setKeepSelectable(e.target.checked)} /> Keep text selectable and searchable</label>
          </div>
        )}

        <label className="ds-dialog-field">
          <span className="ds-dialog-label">File name</span>
          <span className="ds-filename">
            <input value={fileName} onChange={(e) => setFileName(e.target.value)} />
            <span>.{format}</span>
          </span>
        </label>

        <div className="ds-privacy">
          <DesignIcon name="lock" size={18} />
          <span>Your {format === 'pdf' ? 'PDF' : 'image'} is made in your browser. Your design and images never leave this device.</span>
        </div>

        {error && <p className="ds-error" role="alert">{error}</p>}

        {pending && (
          <p className="ds-warning" role="alert">
            These characters aren&apos;t in any available font and will show as &quot;?&quot;: {pending.chars.join(' ')}
          </p>
        )}
      </div>

      <div className="ds-dialog-foot">
        <button type="button" className="ds-text-btn" onClick={saveCopy}>Save editable copy</button>
        <div className="ds-dialog-actions">
          <button type="button" className="ds-secondary-btn" onClick={onClose}>Cancel</button>
          {pending ? (
            <button type="button" className="ds-primary-btn" disabled={busy} onClick={() => { setBusy(true); finish(pending.result); }}>Download anyway</button>
          ) : (
            <button type="button" className="ds-primary-btn" disabled={busy} onClick={run}>
              <DesignIcon name="download" size={18} /> {busy ? 'Making your file…' : `Download ${current.label}`}
            </button>
          )}
        </div>
      </div>
      {format !== 'pdf' && <p className="ds-dialog-output">{pages === 'current' || total === 1 ? '' : 'Several pages download as a ZIP. '}Each page: {outputW} × {outputH} px</p>}
    </dialog>
  );
}
