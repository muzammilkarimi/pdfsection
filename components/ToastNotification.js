'use client';

import { useEffect, useState } from 'react';
import { ToolIcon } from './Icons';

export default function ToastNotification({ message, type = 'success', onClose, autoHideDuration = 4000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [message, autoHideDuration, onClose]);

  if (!message || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`app-toast-notification ${type === 'error' ? 'toast-error' : 'toast-success'}`}
    >
      <div className="toast-icon-wrapper">
        <ToolIcon name={type === 'success' ? 'check' : 'alert'} size={14} />
      </div>
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close-btn"
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        aria-label="Close notification"
      >
        <ToolIcon name="x" size={14} />
      </button>
    </div>
  );
}
