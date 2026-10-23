import { Link, useParams } from 'react-router-dom';
import { MODULE_BY_ID } from '../data';
import { GAMES } from '../games/registry';
import { useProgress } from '../lib/progress';

export default function GamesPage() {
  const { id } = useParams();
  const p = useProgress();
  const game = GAMES.find((g) => g.id === id);
  if (game) {
    return (
      <div>
        <div className="small muted"><Link to="/games">Mini-games</Link> › {game.title}</div>
        <h1>{game.icon} {game.title}</h1>
        <div className="card"><game.C /></div>
        <p className="small muted">High scores add XP (capped per game). This game is part of the lesson <Link to={`/m/${game.module}`}>{MODULE_BY_ID[game.module].code} {MODULE_BY_ID[game.module].title}</Link>.</p>
      </div>
    );
  }
  return (
    <div>
      <h1>Mini-games</h1>
      <p className="muted">Every game belongs to a lesson and also appears inside it, next to the section it practises. Play them here for a quick drill.</p>
      <div className="grid cols-3">
        {GAMES.map((g) => (
          <Link key={g.id} to={`/games/${g.id}`} className="card mod-card">
            <div style={{ fontSize: '2rem' }}>{g.icon}</div>
            <b>{g.title}</b>
            <div className="small muted">{g.blurb}</div>
            <div className="tiny muted">{MODULE_BY_ID[g.module].code} · {MODULE_BY_ID[g.module].title}</div>
            <span className="pill">High score: {p.games[g.id] ?? '—'}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
