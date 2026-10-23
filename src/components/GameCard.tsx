import { useState } from 'react';
import type { Game } from '../games/registry';
import { useProgress } from '../lib/progress';

/** A mini-game inside a lesson: collapsed to a teaser until the learner chooses to play. */
export function GameCard({ game, open: startOpen = false }: { game: Game; open?: boolean }) {
  const p = useProgress();
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="card game-card">
      <div className="spread">
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <span style={{ fontSize: '1.6rem' }}>{game.icon}</span>
          <div>
            <div className="tiny muted">🎮 Mini-game</div>
            <b>{game.title}</b>
            <div className="small muted">{game.blurb}</div>
          </div>
        </div>
        <div className="row">
          <span className="pill">Best: {p.games[game.id] ?? '—'}</span>
          <button className={`btn small ${open ? '' : 'primary'}`} onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : '▶ Play'}</button>
        </div>
      </div>
      {open && <div style={{ marginTop: 12 }}><game.C /></div>}
    </div>
  );
}
