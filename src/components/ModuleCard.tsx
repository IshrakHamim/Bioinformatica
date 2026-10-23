import { Link } from 'react-router-dom';
import { MODULE_BY_ID } from '../data';
import { useProgress } from '../lib/progress';
import { moduleStats } from '../lib/stats';
import { gamesFor } from '../games/registry';

export function ModuleCard({ id }: { id: string }) {
  const p = useProgress();
  const m = MODULE_BY_ID[id];
  const s = moduleStats(m, p);
  const games = gamesFor(m.id);
  return (
    <Link to={`/m/${m.id}`} className="card mod-card">
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <div className="mod-icon" style={{ background: m.color }}>{m.icon}</div>
        <div>
          <div className="tiny muted">{m.code} · ~{m.hours} h{games.length ? ` · 🎮 ${games.map((g) => g.title).join(', ')}` : ''}</div>
          <b>{m.title}</b>
        </div>
      </div>
      <div className="small muted">{m.subtitle}</div>
      <div className="progress"><div style={{ width: `${Math.round(s.mastery * 100)}%` }} /></div>
      <div className="tiny muted spread">
        <span>{s.done}/{s.total} sections · quiz {Math.round(s.quiz * 100)}%</span>
        <span>{Math.round(s.mastery * 100)}% mastery</span>
      </div>
    </Link>
  );
}
