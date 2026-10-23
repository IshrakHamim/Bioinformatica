import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { levelInfo, levelTitle, streak, totalXp, useProgress } from '../lib/progress';
import { getSyncStatus, onSyncStatus } from '../lib/sync';

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M10 5 C 22 11, 10 21, 22 27" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M22 5 C 10 11, 22 21, 10 27" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M12.5 9.5 H19.5 M13 16 H19 M12.5 22.5 H19.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const NAV: { to: string; label: string; icon: string; section?: string }[] = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/learn', label: 'Learning paths', icon: '🗺️' },
  { to: '/flashcards', label: 'Flashcards', icon: '🃏', section: 'Practice' },
  { to: '/games', label: 'Mini-games', icon: '🎮' },
  { to: '/graph', label: 'Knowledge graph', icon: '🕸️', section: 'Explore' },
  { to: '/mindmaps', label: 'Mind maps', icon: '🧠' },
  { to: '/glossary', label: 'Glossary & search', icon: '🔎' },
  { to: '/settings', label: 'Settings & sync', icon: '⚙️', section: 'Settings' },
];

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const p = useProgress();
  const xp = totalXp(p);
  const lv = levelInfo(xp);
  const [sync, setSync] = useState(getSyncStatus());
  useEffect(() => onSyncStatus(setSync), []);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <div className="app">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <NavLink to="/" className="brand"><Logo /> Bioinformatica</NavLink>
        {NAV.map((n) => (
          <div key={n.to}>
            {n.section && <div className="nav-section">{n.section}</div>}
            <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          </div>
        ))}
        <div className="spacer" />
        <div className="xp-mini">
          <div className="spread"><b>Lv {lv.level} · {levelTitle(lv.level)}</b><span>🔥 {streak(p)}</span></div>
          <div className="progress" style={{ margin: '6px 0' }}><div style={{ width: `${(lv.into / lv.need) * 100}%` }} /></div>
          <div className="tiny muted">{xp} XP · {lv.need - lv.into} to next level</div>
          <div className="tiny muted" title={sync.message} style={{ marginTop: 4 }}>
            {sync.mode === 'local' ? '💾 Local only' : sync.state === 'error' ? '⚠️ Sync error' : sync.state === 'syncing' ? '🔄 Syncing…' : '☁️ Synced'}
          </div>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="btn small" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <span className="row" style={{ fontWeight: 800 }}><Logo size={24} /> Bioinformatica</span>
          <span className="pill accent">Lv {lv.level}</span>
        </div>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
