import { Link } from 'react-router-dom';
import { MODULES, MODULE_BY_ID, TRACKS } from '../data';
import { dueCards } from '../components/Flashcards';
import { levelInfo, levelTitle, streak, totalXp, useProgress } from '../lib/progress';
import { badges, examReadiness, moduleStats } from '../lib/stats';
import { useAuth } from '../auth/auth';

export function ModuleCard({ id }: { id: string }) {
  const p = useProgress();
  const m = MODULE_BY_ID[id];
  const s = moduleStats(m, p);
  return (
    <Link to={`/m/${m.id}`} className="card mod-card">
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <div className="mod-icon" style={{ background: m.color }}>{m.icon}</div>
        <div>
          <div className="tiny muted">{m.code}{m.exam ? ` · ${m.exam === 'mid' ? 'Mid-term' : 'Final'} syllabus` : ''} · ~{m.hours} h</div>
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

export default function Dashboard() {
  const p = useProgress();
  const { session } = useAuth();
  const xp = totalXp(p);
  const lv = levelInfo(xp);
  const allCards = MODULES.flatMap((m) => m.flashcards.map((c) => ({ ...c, key: `${m.id}/${c.id}`, module: m.code })));
  const due = dueCards(allCards, p.cards).length;
  const next = p.lastModule ? MODULE_BY_ID[p.lastModule] : MODULES.find((m) => m.track === 'cse443' && moduleStats(m, p).secFrac < 1) ?? MODULES[3];
  const b = badges(p);
  const mid = examReadiness('mid', p);
  const fin = examReadiness('final', p);
  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="hero">
        <div className="spread">
          <div>
            <div className="small muted">Welcome back, {session?.user}</div>
            <h1 style={{ margin: '4px 0' }}>Level {lv.level}: {levelTitle(lv.level)}</h1>
            <div className="muted small">{xp} XP · {lv.need - lv.into} XP to level {lv.level + 1}</div>
          </div>
          <div className="row">
            <div className="stat card" style={{ padding: '10px 16px' }}><b>🔥 {streak(p)}</b><span>day streak</span></div>
            <div className="stat card" style={{ padding: '10px 16px' }}><b>🃏 {due}</b><span>cards due</span></div>
            <div className="stat card" style={{ padding: '10px 16px' }}><b>🏅 {b.filter((x) => x.earned).length}</b><span>badges</span></div>
          </div>
        </div>
        <div className="progress" style={{ marginTop: 12, height: 10 }}><div style={{ width: `${(lv.into / lv.need) * 100}%` }} /></div>
        <div className="row" style={{ marginTop: 14 }}>
          {next && <Link to={`/m/${next.id}`} className="btn primary">▶ Continue: {next.code} {next.title}</Link>}
          {due > 0 && <Link to="/flashcards" className="btn">Review {due} flashcards</Link>}
          <Link to="/games" className="btn">Play a mini-game</Link>
        </div>
      </div>

      <div className="grid cols-2">
        {([['mid', mid, 'Mid-term syllabus (L01–L08)'], ['final', fin, 'Final syllabus (L10–L15)']] as const).map(([k, v, label]) => (
          <Link to={`/exam?tab=${k}`} key={k} className="card mod-card">
            <div className="spread"><b>🎯 {label}</b><span className="pill accent">{Math.round(v * 100)}% ready</span></div>
            <div className="progress"><div style={{ width: `${v * 100}%` }} /></div>
            <div className="small muted">Readiness = average mastery (lessons 50%, quiz 35%, flashcards 15%) of the modules in this exam.</div>
          </Link>
        ))}
      </div>

      {TRACKS.filter((t) => t.modules.length).map((t) => (
        <section key={t.id}>
          <div className="spread"><h2 style={{ margin: '8px 0' }}>{t.title}</h2><Link to="/learn" className="small">All paths →</Link></div>
          <div className="grid cols-3">{t.modules.map((id) => <ModuleCard key={id} id={id} />)}</div>
        </section>
      ))}

      <section>
        <h2>Badges</h2>
        <div className="badge-grid">
          {b.map((x) => (
            <div key={x.id} className={`badge card ${x.earned ? '' : 'locked'}`} title={x.desc}>
              <div className="b-icon">{x.icon}</div>
              <b>{x.title}</b>
              <div className="tiny muted">{x.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
