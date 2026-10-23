import { Link } from 'react-router-dom';
import { MODULES, MODULE_BY_ID } from '../data';
import { dueCards } from '../components/Flashcards';
import { levelInfo, levelTitle, streak, totalXp, useProgress } from '../lib/progress';
import { badges, moduleStats } from '../lib/stats';
import { GAMES, gamesFor } from '../games/registry';

const WEEKS = 16;

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** Decorative double helix behind the hero text. */
function Helix() {
  const W = 260;
  const H = 220;
  const pts = (phase: number) => Array.from({ length: 41 }, (_, i) => `${(i / 40) * W},${H / 2 + Math.sin((i / 40) * Math.PI * 3 + phase) * 70}`).join(' ');
  return (
    <svg className="helix" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {Array.from({ length: 13 }, (_, i) => {
        const x = (i / 12) * W;
        const t = (i / 12) * Math.PI * 3;
        return <line key={i} x1={x} x2={x} y1={H / 2 + Math.sin(t) * 70} y2={H / 2 + Math.sin(t + Math.PI) * 70} stroke="currentColor" strokeWidth={3} opacity={0.35} strokeLinecap="round" />;
      })}
      <polyline points={pts(0)} fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
      <polyline points={pts(Math.PI)} fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
    </svg>
  );
}

function LevelRing({ level, frac }: { level: number; frac: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 100 100" role="img" aria-label={`Level ${level}, ${Math.round(frac * 100)}% to the next level`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="47" textAnchor="middle" fontSize="11" className="dim">LEVEL</text>
      <text x="50" y="66" textAnchor="middle" fontSize="24" fontWeight="800">{level}</text>
    </svg>
  );
}

function Heatmap({ days }: { days: string[] }) {
  const set = new Set(days);
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - end.getDay() - (WEEKS - 1) * 7); // Sunday, WEEKS weeks ago
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { key, on: set.has(key), future: d > end };
  });
  return (
    <div className="heat" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
      {cells.map((c) => <div key={c.key} title={c.key} className={`heat-cell ${c.on ? 'on' : ''} ${c.future ? 'future' : ''}`} />)}
    </div>
  );
}

function Action({ to, icon, title, sub }: { to: string; icon: string; title: string; sub: string }) {
  return (
    <Link to={to} className="action">
      <span className="action-icon">{icon}</span>
      <span className="action-text"><b>{title}</b><span className="small muted">{sub}</span></span>
      <span className="action-go">→</span>
    </Link>
  );
}

export default function Dashboard() {
  const p = useProgress();
  const xp = totalXp(p);
  const lv = levelInfo(xp);
  const allCards = MODULES.flatMap((m) => m.flashcards.map((c) => ({ ...c, key: `${m.id}/${c.id}`, module: m.code })));
  const due = dueCards(allCards, p.cards).length;
  const next = p.lastModule ? MODULE_BY_ID[p.lastModule] : MODULES.find((m) => m.track === 'cse443' && moduleStats(m, p).secFrac < 1) ?? MODULES[3];
  const s = moduleStats(next, p);
  const fresh = !p.lastModule && Object.keys(p.sections).length === 0;
  const game = gamesFor(next.id)[0] ?? GAMES[Math.floor(Date.now() / 864e5) % GAMES.length];
  const b = badges(p);
  const earned = b.filter((x) => x.earned);
  const upcoming = b.filter((x) => !x.earned).slice(0, 4);
  const st = streak(p);
  return (
    <div className="col dash" style={{ gap: 18 }}>
      <section className="dash-hero">
        <Helix />
        <div className="dash-hero-main">
          <div className="small muted">{greeting()} 👋</div>
          <h1>{fresh ? 'Start your bioinformatics journey' : 'Pick up where you left off'}</h1>
          <div className="now-card">
            <div className="mod-icon" style={{ background: next.color, width: 50, height: 50, fontSize: '1.5rem' }}>{next.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="tiny muted">{next.code} · ~{next.hours} h</div>
              <b>{next.title}</b>
              <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${s.secFrac * 100}%` }} /></div>
              <div className="tiny muted">{s.done} of {s.total} sections read</div>
            </div>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <Link to={`/m/${next.id}`} className="btn primary">▶ {fresh ? 'Start lesson' : 'Continue lesson'}</Link>
            <Link to="/learn" className="btn">Browse all lessons</Link>
          </div>
        </div>
        <div className="dash-level">
          <LevelRing level={lv.level} frac={lv.into / lv.need} />
          <b>{levelTitle(lv.level)}</b>
          <span className="tiny muted">{lv.need - lv.into} XP to level {lv.level + 1}</span>
        </div>
      </section>

      <section className="tiles">
        <div className="tile"><span className="tile-icon">🔥</span><b>{st}</b><span>day streak</span></div>
        <div className="tile"><span className="tile-icon">⚡</span><b>{xp.toLocaleString()}</b><span>total XP</span></div>
        <div className="tile"><span className="tile-icon">🃏</span><b>{due}</b><span>cards due</span></div>
        <div className="tile"><span className="tile-icon">🏅</span><b>{earned.length}/{b.length}</b><span>badges</span></div>
      </section>

      <div className="grid cols-2">
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Up next</h3>
          <div className="col" style={{ gap: 8 }}>
            {due > 0
              ? <Action to="/flashcards" icon="🃏" title={`Review ${due} flashcard${due === 1 ? '' : 's'}`} sub="A few minutes of spaced repetition keeps ideas fresh" />
              : <Action to="/flashcards" icon="✨" title="Flashcards are all caught up" sub="Browse a deck anyway, or learn something new" />}
            <Action to={`/m/${next.id}?tab=quiz`} icon="❓" title={`Quiz: ${next.title}`} sub={s.quiz ? `Your best so far: ${Math.round(s.quiz * 100)}%` : 'Check what stuck from this lesson'} />
            <Action to={`/games/${game.id}`} icon={game.icon} title={`Play ${game.title}`} sub={game.blurb} />
          </div>
        </section>
        <section className="card">
          <div className="spread">
            <h3 style={{ margin: 0 }}>Activity</h3>
            <span className="small muted">{p.days.length} active day{p.days.length === 1 ? '' : 's'}</span>
          </div>
          <p className="small muted" style={{ margin: '4px 0 12px' }}>{st > 0 ? `You're on a ${st}-day streak. Keep it going today.` : 'Study a little today to start a streak.'}</p>
          <Heatmap days={p.days} />
        </section>
      </div>

      <section className="card">
        <div className="spread">
          <h3 style={{ margin: 0 }}>Achievements</h3>
          <span className="small muted">{earned.length} of {b.length} earned</span>
        </div>
        <div className="badge-grid" style={{ marginTop: 12 }}>
          {[...earned.slice(-4), ...upcoming].map((x) => (
            <div key={x.id} className={`badge ${x.earned ? 'earned' : 'locked'}`} title={x.desc}>
              <div className="b-icon">{x.icon}</div>
              <b>{x.title}</b>
              <div className="tiny muted">{x.earned ? 'Earned' : x.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
