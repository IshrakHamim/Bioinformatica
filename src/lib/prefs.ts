import { useState } from 'react';

// Display preferences, kept per browser and applied as attributes on <html> (see styles.css).

export interface Prefs {
  theme: 'system' | 'light' | 'dark';
  accent: 'teal' | 'blue' | 'violet' | 'rose' | 'amber';
  font: 'inter' | 'atkinson' | 'serif' | 'system';
  size: 'small' | 'medium' | 'large' | 'xlarge';
  motion: 'full' | 'reduced';
}

export const DEFAULT_PREFS: Prefs = { theme: 'system', accent: 'teal', font: 'inter', size: 'medium', motion: 'full' };
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
    const next = { ...prefs, ...patch };
    setPrefs(next);
    applyPrefs(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: applies for this visit only */
    }
  };
  return [prefs, set] as const;
}
