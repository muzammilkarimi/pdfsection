'use client';

// Create a signature, initials or a line of text as an image: draw it, type it in a handwriting
// font, or upload a photo. Shared by Sign PDF and Edit PDF. Everything happens in the browser.

import { useState, useRef, useEffect } from 'react';
import { Caveat, Dancing_Script, Great_Vibes } from 'next/font/google';
import { ToolIcon } from '@/components/Icons';

// Bundled with the site, so typing a signature never requests a font from another server.
const caveat = Caveat({ subsets: ['latin'], display: 'swap' });
const dancingScript = Dancing_Script({ subsets: ['latin'], display: 'swap' });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', display: 'swap' });

const HANDWRITING = [
  { id: 'caveat', family: caveat.style.fontFamily, size: 34 },
  { id: 'dancing', family: dancingScript.style.fontFamily, size: 30 },
  { id: 'vibes', family: greatVibes.style.fontFamily, size: 32 },
];

export const INKS = [
  { id: 'blue', label: 'Blue ink', color: '#1d2a8a' },
  { id: 'black', label: 'Black ink', color: '#141320' },
];

export const SAVED_KEYS = { signature: 'pdfsection.savedSignature', initials: 'pdfsection.savedInitials' };

export function readSaved(kind) {
  if (typeof window === 'undefined' || !SAVED_KEYS[kind]) return null;
  try {
    return localStorage.getItem(SAVED_KEYS[kind]);
  } catch {
    return null;
  }
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Crops a canvas to its drawn pixels, with a little padding, so stamps aren't mostly empty space.
export function trimCanvas(canvas, padding = 8) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  const out = document.createElement('canvas');
  out.width = right - left + 1 + padding * 2;
  out.height = bottom - top + 1 + padding * 2;
  out.getContext('2d').drawImage(canvas, left, top, right - left + 1, bottom - top + 1, padding, padding, right - left + 1, bottom - top + 1);
  return out;
}

export async function textToImage(text, fontFamily, color, fontSize = 96) {
  // wait for the handwriting font, but never forever: a font that fails to load must not block
  try {
    await Promise.race([document.fonts.load(`${fontSize}px ${fontFamily}`), new Promise((r) => setTimeout(r, 2500))]);
  } catch {
    // draw with the fallback font
  }
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `${fontSize}px ${fontFamily}`;
  const width = Math.ceil(measure.measureText(text).width) + 40;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.ceil(fontSize * 1.6);
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 20, canvas.height / 2);
  return (trimCanvas(canvas) || canvas).toDataURL('image/png');
}

// Phones and tablets: drawing with a finger is the natural way to sign, and opening the keyboard
// straight away makes the dialog jump when it closes.
const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

export default function SignatureDialog({ kind, ink, onInkChange, onClose, onCreate }) {
  const isText = kind === 'text';
  const [method, setMethod] = useState(() => (!isText && isTouch() ? 'draw' : 'type'));
  const [busy, setBusy] = useState(false);
  const backdropDownRef = useRef(false);
  const [value, setValue] = useState('');
  const [styleId, setStyleId] = useState(HANDWRITING[0].id);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const padRef = useRef(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const uploadRef = useRef(null);
  const [uploaded, setUploaded] = useState(null);

  const inkColor = INKS.find((i) => i.id === ink).color;
  const title = kind === 'initials' ? 'Create your initials' : isText ? 'Add text' : 'Create your signature';
  const methods = isText ? [] : ['draw', 'type', 'upload'];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const padPoint = (e) => {
    const canvas = padRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e) => {
    const ctx = padRef.current.getContext('2d');
    const { x, y } = padPoint(e);
    padRef.current.setPointerCapture(e.pointerId);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
  };

  const moveDraw = (e) => {
    if (!drawingRef.current) return;
    const ctx = padRef.current.getContext('2d');
    const { x, y } = padPoint(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    hasInkRef.current = true;
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearPad = () => {
    const canvas = padRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
  };

  const handleUpload = async (fileList) => {
    const imageFile = fileList?.[0];
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    try {
      const img = await loadImage(url);
      const scale = Math.min(1, 900 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      setUploaded(canvas.toDataURL('image/png'));
      setError('');
    } catch {
      setError('That image could not be opened. Try a PNG or JPG.');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const create = async () => {
    if (busy) return;
    // close the phone keyboard first, so the page has settled when the stamp is placed
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setBusy(true);
    try {
      await makeImage();
    } catch (err) {
      console.error(err);
      setError('Something went wrong making the image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const makeImage = async () => {
    let image = null;
    if (method === 'draw') {
      if (!hasInkRef.current) {
        setError('Draw your signature in the box first.');
        return;
      }
      image = (trimCanvas(padRef.current) || padRef.current).toDataURL('image/png');
    } else if (method === 'upload') {
      if (!uploaded) {
        setError('Choose an image of your signature first.');
        return;
      }
      image = uploaded;
    } else {
      if (!value.trim()) {
        setError(isText ? 'Type the text to add.' : 'Type your name first.');
        return;
      }
      const family = isText ? 'Inter, system-ui, sans-serif' : HANDWRITING.find((s) => s.id === styleId).family;
      image = await textToImage(value.trim(), family, inkColor, isText ? 64 : 96);
    }
    onCreate(image, !isText && remember);
  };

  return (
    <div
      className="sign-dialog-backdrop"
      // close only on a tap that starts and ends outside the box: when the phone keyboard closes the
      // box moves, and a tap meant for a button must not land here and close it
      onPointerDown={(e) => { backdropDownRef.current = e.target === e.currentTarget; }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropDownRef.current) onClose();
        backdropDownRef.current = false;
      }}
    >
      <div
        className="sign-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sign-dialog-head">
          <h2 id="sign-dialog-title">{title}</h2>
          <button type="button" className="sign-dialog-close" onClick={onClose} aria-label="Close">
            <ToolIcon name="x" size={18} />
          </button>
        </div>

        {methods.length > 0 && (
          <div className="ws-tabs sign-dialog-tabs" role="tablist" aria-label="How to create it">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={method === m}
                onClick={() => {
                  setMethod(m);
                  setError('');
                }}
              >
                {m === 'draw' ? 'Draw' : m === 'type' ? 'Type' : 'Upload image'}
              </button>
            ))}
          </div>
        )}

        {method === 'draw' && (
          <div className="sign-pad-wrap">
            <canvas
              ref={padRef}
              width={1120}
              height={360}
              className="sign-pad"
              aria-label="Draw your signature here"
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerCancel={endDraw}
            />
            <button type="button" className="ws-link-button" onClick={clearPad}>Clear</button>
          </div>
        )}

        {method === 'type' && (
          <>
            <label className="ws-field">
              <span>{isText ? 'Text' : kind === 'initials' ? 'Your initials' : 'Your name'}</span>
              <input
                type="text"
                className="input"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                autoFocus={!isTouch()}
              />
            </label>
            {!isText && (
              <div className="sign-styles" role="radiogroup" aria-label="Signature style">
                {HANDWRITING.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    role="radio"
                    aria-checked={styleId === style.id}
                    className="sign-style"
                    style={{ fontFamily: style.family, fontSize: style.size, color: inkColor }}
                    onClick={() => setStyleId(style.id)}
                  >
                    {value.trim() || (kind === 'initials' ? 'J.D.' : 'Your name')}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {method === 'upload' && (
          <div className="sign-upload">
            {uploaded ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen image
              <img src={uploaded} alt="Your signature image" />
            ) : (
              <span>A photo or scan of your signature. A white or clear background works best.</span>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => uploadRef.current?.click()}>
              {uploaded ? 'Choose another image' : 'Choose image'}
            </button>
            <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => handleUpload(e.target.files)} />
          </div>
        )}

        {method !== 'upload' && (
          <div className="sign-ink" role="radiogroup" aria-label="Ink colour">
            <span>Ink</span>
            {INKS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={ink === option.id}
                aria-label={option.label}
                className="sign-ink-dot"
                style={{ background: option.color, '--ink': option.color }}
                onClick={() => onInkChange(option.id)}
              />
            ))}
          </div>
        )}

        {!isText && (
          <label className="sign-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember this {kind === 'initials' ? 'set of initials' : 'signature'} in this browser
          </label>
        )}

        {error && <p className="sign-error" role="alert">{error}</p>}

        <div className="sign-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={create} disabled={busy} aria-busy={busy}>
            {busy ? 'Adding…' : isText ? 'Add text' : `Use ${kind === 'initials' ? 'initials' : 'signature'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
