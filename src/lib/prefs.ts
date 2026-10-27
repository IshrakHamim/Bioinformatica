import { useState, useSyncExternalStore } from 'react';

// Display preferences, kept per browser and applied as attributes on <html> (see styles.css).

export interface Prefs {
  theme: 'system' | 'light' | 'dark';
  accent: 'teal' | 'blue' | 'violet' | 'rose' | 'amber';
  font: 'inter' | 'atkinson' | 'serif' | 'system';
  size: 'small' | 'medium' | 'large' | 'xlarge';
  motion: 'full' | 'reduced';
  /** Lesson language. Translated lessons switch to Bangla; others stay in English. */
  lang: 'en' | 'bn';
}

export const DEFAULT_PREFS: Prefs = { theme: 'system', accent: 'teal', font: 'inter', size: 'medium', motion: 'full', lang: 'en' };
const KEY = 'bioinformatica.prefs';

export function loadPrefs(): Prefs {
  try {
    const legacyTheme = localStorage.getItem('bioinformatica.theme') as Prefs['theme'] | null;
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs>;
    return { ...DEFAULT_PREFS, ...(legacyTheme ? { theme: legacyTheme } : {}), ...saved };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function applyPrefs(p: Prefs) {
  const el = document.documentElement;
  if (p.theme === 'system') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', p.theme);
  el.dataset.accent = p.accent;
  el.dataset.font = p.font;
  el.dataset.size = p.size;
  el.dataset.motion = p.motion;
}

export function usePrefs() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const set = (patch: Partial<Prefs>) => {
    // merge into the latest saved prefs, so a change made elsewhere (e.g. the language switch) isn't overwritten
    const next = { ...prefs, ...loadPrefs(), ...patch };
    setPrefs(next);
    savePrefs(next);
  };
  return [prefs, set] as const;
}

function savePrefs(next: Prefs) {
  currentLang = next.lang;
  applyPrefs(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: applies for this visit only */
  }
  listeners.forEach((l) => l());
}

// The lesson language is read by several components at once, so it lives in a tiny shared store.
const listeners = new Set<() => void>();
let currentLang: Prefs['lang'] = loadPrefs().lang;

export function useLang() {
  const lang = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => currentLang,
    () => currentLang,
  );
  const setLang = (l: Prefs['lang']) => {
    currentLang = l;
    savePrefs({ ...loadPrefs(), lang: l });
  };
  return [lang, setLang] as const;
}
