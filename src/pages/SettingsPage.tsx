import type { ReactNode } from 'react';
import { DEFAULT_PREFS, usePrefs, type Prefs } from '../lib/prefs';

function Choice<T extends string>({ value, options, onPick }: { value: T; options: { v: T; label: ReactNode }[]; onPick: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={o.v} role="radio" aria-checked={value === o.v} className={`seg-btn ${value === o.v ? 'on' : ''}`} onClick={() => onPick(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="pref-row">
      <div>
        <b>{title}</b>
        <div className="small muted">{hint}</div>
      </div>
      {children}
    </div>
  );
}

const ACCENTS: { v: Prefs['accent']; color: string; name: string }[] = [
  { v: 'teal', color: '#0f9d7a', name: 'Teal' },
  { v: 'blue', color: '#2f6fdf', name: 'Blue' },
  { v: 'violet', color: '#7c4ddb', name: 'Violet' },
  { v: 'rose', color: '#d1366b', name: 'Rose' },
  { v: 'amber', color: '#b86e00', name: 'Amber' },
];

export default function SettingsPage() {
  const [prefs, set] = usePrefs();
  return (
    <div className="col" style={{ gap: 16 }}>
      <h1>Settings</h1>

      <div className="card col" style={{ gap: 0 }}>
        <h3 style={{ marginTop: 0 }}>Appearance</h3>
        <Row title="Theme" hint="System follows your device's light or dark mode.">
          <Choice value={prefs.theme} onPick={(theme) => set({ theme })} options={[{ v: 'system', label: '🖥️ System' }, { v: 'light', label: '☀️ Light' }, { v: 'dark', label: '🌙 Dark' }]} />
        </Row>
        <Row title="Accent color" hint="Used for buttons, progress bars and highlights.">
          <div className="row" role="radiogroup">
            {ACCENTS.map((a) => (
              <button key={a.v} role="radio" aria-checked={prefs.accent === a.v} aria-label={a.name} title={a.name} className={`swatch ${prefs.accent === a.v ? 'on' : ''}`} style={{ background: a.color }} onClick={() => set({ accent: a.v })} />
            ))}
          </div>
        </Row>
        <Row title="Motion" hint="Reduced turns off animations and transitions.">
          <Choice value={prefs.motion} onPick={(motion) => set({ motion })} options={[{ v: 'full', label: 'Full' }, { v: 'reduced', label: 'Reduced' }]} />
        </Row>
      </div>

      <div className="card col" style={{ gap: 0 }}>
        <h3 style={{ marginTop: 0 }}>Reading</h3>
        <Row title="Font" hint="Atkinson Hyperlegible is designed for easy letter recognition.">
          <Choice value={prefs.font} onPick={(font) => set({ font })} options={[
            { v: 'inter', label: <span style={{ fontFamily: 'Inter' }}>Inter</span> },
            { v: 'atkinson', label: <span style={{ fontFamily: 'Atkinson Hyperlegible' }}>Atkinson</span> },
            { v: 'serif', label: <span style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Serif</span> },
            { v: 'system', label: <span style={{ fontFamily: 'system-ui' }}>System</span> },
          ]} />
        </Row>
        <Row title="Text size" hint="Scales lesson text and the whole interface.">
          <Choice value={prefs.size} onPick={(size) => set({ size })} options={[
            { v: 'small', label: <span style={{ fontSize: 13 }}>A</span> },
            { v: 'medium', label: <span style={{ fontSize: 16 }}>A</span> },
            { v: 'large', label: <span style={{ fontSize: 19 }}>A</span> },
            { v: 'xlarge', label: <span style={{ fontSize: 22 }}>A</span> },
          ]} />
        </Row>
        <div className="pref-preview">
          <div className="tiny muted">Preview</div>
          <p style={{ margin: '4px 0 0' }}>The reverse complement of <span className="mono">ATGGCC</span> is <span className="mono">GGCCAT</span>: complement each base, then read the strand backwards, 5′ → 3′.</p>
        </div>
      </div>

      <div className="row">
        <button className="btn small" onClick={() => set(DEFAULT_PREFS)}>Restore defaults</button>
      </div>

      <div className="card small muted">
        <b>About.</b> Bioinformatica turns the CSE443 (BRAC University) bioinformatics course into interactive lessons. Lesson text is original and paraphrased; it follows the course's textbooks (Compeau &amp; Pevzner; Gusfield) and the instructor's lecture topics. Algorithms in the widgets are implemented from scratch and unit-tested against textbook, handout and exam values. Your progress is saved in this browser.
      </div>
    </div>
  );
}
