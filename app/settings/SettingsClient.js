'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { applyTheme, setPref, usePref } from '@/lib/preferences';
import { clearLibrary, listLibrary } from '@/lib/fileLibrary';
import { formatBytes } from '@/lib/fileInsights';

const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'Match my system' },
];

const KEEP_OPTIONS = [1, 7, 30];

const COMPRESS_LEVELS = [
  { id: 'low', label: 'Light' },
  { id: 'medium', label: 'Balanced' },
  { id: 'high', label: 'Smallest' },
];

export default function SettingsClient() {
  const theme = usePref('theme');
  const rememberFiles = usePref('rememberFiles');
  const keepDays = usePref('keepDays');
  const compressLevel = usePref('compressLevel');
  const [usage, setUsage] = useState(null);
  const [signatureForgotten, setSignatureForgotten] = useState(false);

  // Listing also removes files past the keep period, so usage reflects the current setting.
  const refreshUsage = useCallback(() => {
    listLibrary()
      .then((entries) => setUsage({ count: entries.length, bytes: entries.reduce((sum, e) => sum + e.size, 0) }))
      .catch(() => setUsage(null));
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const toggleRemember = async () => {
    if (rememberFiles) {
      if (usage?.count && !window.confirm('Stop saving files? The files already saved in this browser will be deleted.')) {
        return;
      }
      await clearLibrary().catch(() => {});
    }
    setPref('rememberFiles', !rememberFiles);
    refreshUsage();
  };

  const changeKeepDays = (event) => {
    setPref('keepDays', Number(event.target.value));
    refreshUsage();
  };

  // Keys written by Sign PDF when "Remember this signature" is ticked.
  const forgetSignature = () => {
    try {
      localStorage.removeItem('pdfsection.savedSignature');
      localStorage.removeItem('pdfsection.savedInitials');
    } catch {
      // Storage blocked: nothing was saved either.
    }
    setSignatureForgotten(true);
  };

  const deleteAll = async () => {
    if (!window.confirm('Delete all saved files from this browser?')) return;
    await clearLibrary().catch(() => {});
    refreshUsage();
  };

  return (
    <main className="main">
      <div className="account-page account-page-narrow container">
        <div className="account-page-head">
          <div>
            <h1>Settings</h1>
            <p>Saved in this browser only. There&apos;s no account, so nothing syncs.</p>
          </div>
        </div>

        <section className="settings-card" aria-labelledby="settings-look">
          <h2 id="settings-look">Appearance</h2>
          <div className="settings-row">
            <span id="theme-label">Theme</span>
            <div className="settings-segmented" role="radiogroup" aria-labelledby="theme-label">
              {THEMES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={theme === option.id}
                  onClick={() => applyTheme(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="settings-card" aria-labelledby="settings-defaults">
          <h2 id="settings-defaults">Defaults</h2>
          <label className="settings-row">
            <span>Compress PDF level</span>
            <select
              className="input settings-select"
              value={compressLevel}
              onChange={(event) => setPref('compressLevel', event.target.value)}
            >
              {COMPRESS_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>{level.label}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="settings-card" aria-labelledby="settings-storage">
          <h2 id="settings-storage">Storage in this browser</h2>
          <div className="settings-row">
            <span id="remember-label">
              Remember files I make
              <small>Shown on the <Link href="/files">Your files</Link> page. Turning this off deletes them.</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={rememberFiles}
              aria-labelledby="remember-label"
              className="settings-switch"
              onClick={toggleRemember}
            />
          </div>
          <label className="settings-row">
            <span>Remove them after</span>
            <select
              className="input settings-select"
              value={keepDays}
              onChange={changeKeepDays}
              disabled={!rememberFiles}
            >
              {KEEP_OPTIONS.map((days) => (
                <option key={days} value={days}>{days} day{days === 1 ? '' : 's'}</option>
              ))}
            </select>
          </label>
          <div className="settings-row">
            <span>Used</span>
            <strong>
              {usage
                ? `${usage.count} file${usage.count === 1 ? '' : 's'} · ${formatBytes(usage.bytes)}`
                : 'Not available'}
            </strong>
          </div>
          <div className="settings-actions">
            <button type="button" className="btn btn-danger-soft" onClick={deleteAll} disabled={!usage?.count}>
              Delete all saved files
            </button>
            <button type="button" className="btn btn-secondary" onClick={forgetSignature}>
              Forget saved signature
            </button>
            {signatureForgotten && <span className="settings-done" role="status">Saved signature and initials removed.</span>}
          </div>
        </section>
      </div>
    </main>
  );
}
