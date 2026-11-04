// Settings kept in this browser's Local Storage. There is no account, so nothing syncs.
import { useSyncExternalStore } from 'react';

export const DEFAULT_PREFS = {
  theme: 'light', // light | dark | system
  rememberFiles: true,
  keepDays: 7,
  compressLevel: 'medium', // low | medium | high
};

// The theme keeps its original key and plain-string value: the inline script in
// app/layout.js reads it before the page paints.
const STORAGE_KEYS = {
  theme: 'theme',
  rememberFiles: 'pdfsection.rememberFiles',
  keepDays: 'pdfsection.keepDays',
  compressLevel: 'pdfsection.compressLevel',
};

const CHANGE_EVENT = 'pdfsection:prefs';

export function getPref(name) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[name]);
    if (raw === null) return DEFAULT_PREFS[name];
    return name === 'theme' ? raw : JSON.parse(raw);
  } catch {
    return DEFAULT_PREFS[name];
  }
}

export function setPref(name, value) {
  try {
    localStorage.setItem(STORAGE_KEYS[name], name === 'theme' ? value : JSON.stringify(value));
  } catch {
    // Storage blocked: the choice applies to this page only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function usePref(name) {
  return useSyncExternalStore(subscribe, () => getPref(name), () => DEFAULT_PREFS[name]);
}

export function resolveTheme(choice) {
  if (choice !== 'system') return choice === 'dark' ? 'dark' : 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(choice) {
  setPref('theme', choice);
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolveTheme(choice));
}
