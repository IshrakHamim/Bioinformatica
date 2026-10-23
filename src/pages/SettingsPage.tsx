import { useEffect, useState } from 'react';
import { emptyProgress, getProgress, mergeProgress, replaceProgress, type Progress } from '../lib/progress';
import { getGistConfig, getSyncStatus, onSyncStatus, setGistConfig, startSync, syncNow } from '../lib/sync';

function useTheme() {
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('bioinformatica.theme') ?? 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('bioinformatica.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

export default function SettingsPage() {
  const [status, setStatus] = useState(getSyncStatus());
  useEffect(() => onSyncStatus(setStatus), []);
  const [token, setToken] = useState(getGistConfig()?.token ?? '');
  const [theme, setTheme] = useTheme();
  const [msg, setMsg] = useState('');

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(getProgress(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bioinformatica-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importProgress = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as Progress;
      if (data?.v !== 1) throw new Error('Not a Bioinformatica progress file');
      replaceProgress(mergeProgress(getProgress(), data));
      setMsg('Imported and merged ✓');
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <h1>Settings & sync</h1>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Progress sync across devices</h3>
        <p className="small">
          Status: <b>{status.mode === 'server' ? 'Server sync (Vercel)' : status.mode === 'gist' ? 'GitHub Gist sync' : 'This browser only'}</b> · {status.message}
          {status.at && <span className="muted"> (last sync {new Date(status.at).toLocaleTimeString()})</span>}
        </p>
        <ul className="small">
          <li><b>This browser:</b> progress is saved automatically, with nothing to set up. (Accounts with server sync will come back once a Redis store is connected.)</li>
          <li><b>GitHub Gist:</b> paste a GitHub token with the <code>gist</code> scope below, once per device. Progress is saved to a private Gist in your GitHub account, and other devices with a token find the same Gist automatically.</li>
          <li>Or use <b>Export/Import</b> to move a progress file between devices by hand.</li>
        </ul>
        <div className="row">
          <input type="password" placeholder="GitHub token (gist scope)" value={token} onChange={(e) => setToken(e.target.value)} style={{ minWidth: 280 }} aria-label="GitHub token" />
          <button className="btn small primary" onClick={() => { setGistConfig(token ? { token } : null); startSync(); }}>Save & connect</button>
          <button className="btn small" onClick={() => syncNow()} disabled={status.mode === 'local'}>Sync now</button>
          {getGistConfig() && <button className="btn small danger" onClick={() => { setGistConfig(null); setToken(''); startSync(); }}>Disconnect Gist</button>}
        </div>
        <p className="tiny muted">Create a token at github.com → Settings → Developer settings → Personal access tokens (classic) with only the “gist” scope. It is stored only in this browser.</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Backup</h3>
        <div className="row">
          <button className="btn small" onClick={exportProgress}>⬇ Export progress</button>
          <label className="btn small">⬆ Import & merge<input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importProgress(e.target.files[0])} /></label>
          {msg && <span className="small">{msg}</span>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Appearance</h3>
        <div className="row">
          {['system', 'light', 'dark'].map((t) => <button key={t} className={`btn small ${theme === t ? 'primary' : ''}`} onClick={() => setTheme(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Danger zone</h3>
        <button className="btn small danger" onClick={() => { if (confirm('Reset ALL progress on this device? Synced copies are merged back on next sync unless you also clear them.')) replaceProgress({ ...emptyProgress(), updatedAt: Date.now() }); }}>Reset progress</button>
      </div>

      <div className="card small muted">
        <b>About.</b> Bioinformatica turns the CSE443 (BRAC University) bioinformatics course into interactive lessons. Lesson text is original and paraphrased; it follows the course's textbooks (Compeau &amp; Pevzner; Gusfield) and the instructor's lecture topics. Algorithms in the widgets are implemented from scratch and unit-tested against textbook, handout and exam values.
      </div>
    </div>
  );
}
