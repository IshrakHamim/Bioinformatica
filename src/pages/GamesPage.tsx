import type { ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlignDuel, CodonQuest, ComplementRush, CpgDetective, EulerTrail, MotifHunter, SkewHunter } from '../games/games';
import { useProgress } from '../lib/progress';

export const GAMES: { id: string; title: string; icon: string; blurb: string; module: string; C: ComponentType }[] = [
  { id: 'codon-quest', title: 'Codon Quest', icon: '🧩', blurb: 'Translate mRNA codons to amino acids against the clock.', module: 'intro', C: CodonQuest },
  { id: 'complement-rush', title: 'Complement Rush', icon: '⚡', blurb: 'Type reverse complements of ever-longer DNA strings.', module: 'oric', C: ComplementRush },
  { id: 'skew-hunter', title: 'Skew Hunter', icon: '📉', blurb: 'Locate oriC from a skew diagram.', module: 'oric', C: SkewHunter },
  { id: 'motif-hunter', title: 'Motif Hunter', icon: '🔍', blurb: 'Spot an implanted motif by eye, the way Gibbs sampling would.', module: 'motifs', C: MotifHunter },
  { id: 'euler-trail', title: 'Euler Trail', icon: '🕸️', blurb: 'Assemble a genome by walking a de Bruijn graph edge by edge.', module: 'assembly', C: EulerTrail },
  { id: 'align-duel', title: 'Align Duel', icon: '🧮', blurb: 'Compute optimal global/local alignment scores in your head.', module: 'alignment', C: AlignDuel },
  { id: 'cpg-detective', title: 'CpG Detective', icon: '🕵️', blurb: 'Find CpG islands and race the Viterbi algorithm.', module: 'hmm', C: CpgDetective },
];

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
        <p className="small muted">High scores add XP (capped per game). Related lesson: <Link to={`/m/${game.module}`}>{game.module}</Link>.</p>
      </div>
    );
  }
  return (
    <div>
      <h1>Mini-games</h1>
      <p className="muted">Short games that drill the skills exams test: fast mental translation, reverse complements, Euler paths, alignment scoring and HMM intuition.</p>
      <div className="grid cols-3">
        {GAMES.map((g) => (
          <Link key={g.id} to={`/games/${g.id}`} className="card mod-card">
            <div style={{ fontSize: '2rem' }}>{g.icon}</div>
            <b>{g.title}</b>
            <div className="small muted">{g.blurb}</div>
            <span className="pill">High score: {p.games[g.id] ?? '—'}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
