import type { Prefs } from '../lib/prefs';

type Lang = Prefs['lang'];

/** English | বাংলা pill switch. `small` is the per-section variant. */
export function LangToggle({ value, onChange, small = false, label = 'Lesson language' }: { value: Lang; onChange: (l: Lang) => void; small?: boolean; label?: string }) {
  return (
    <div className={`lang-switch ${small ? 'small' : ''}`} role="group" aria-label={label}>
      {(['en', 'bn'] as const).map((l) => (
        <button key={l} className={value === l ? 'on' : ''} aria-pressed={value === l} onClick={() => onChange(l)} lang={l}>
          {l === 'en' ? (small ? 'EN' : 'English') : 'বাংলা'}
        </button>
      ))}
    </div>
  );
}
