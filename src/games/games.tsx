import { useEffect, useMemo, useRef, useState } from 'react';
import { AA_NAMES, CODON_TABLE, reverseComplement } from '../lib/bio/strings';
import { deBruijnFromKmers, eulerianPath, spellPath } from '../lib/bio/assembly';
import { align } from '../lib/bio/alignment';
import { sampleHMM, viterbi, type HMM } from '../lib/bio/hmm';
import { minimumSkew, skewArray } from '../lib/bio/strings';
import { syntheticGenome } from '../widgets/oric';
import { GraphView } from '../widgets/GraphView';
import { LineChart, Seq } from '../widgets/ui';
import { update, useProgress } from '../lib/progress';
import { toast } from '../components/Toast';

function useHighScore(id: string) {
  const p = useProgress();
  const best = p.games[id] ?? 0;
  const submit = (score: number) => {
    if (score > best) {
      update((pp) => {
        pp.games[id] = score;
      });
      toast(`🏆 New high score: ${score}`);
    }
  };
  return { best, submit };
}

const rnd = (n: number) => Math.floor(Math.random() * n);
const randDna = (n: number) => Array.from({ length: n }, () => 'ACGT'[rnd(4)]).join('');

function useCountdown(seconds: number, running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    if (!running) return;
    setLeft(seconds);
    const t = setInterval(() => setLeft((x) => {
      if (x <= 1) {
        clearInterval(t);
        end.current();
        return 0;
      }
      return x - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [running, seconds]);
  return left;
}

// ---------------------------------------------------------------- Codon Quest
export function CodonQuest() {
  const { best, submit } = useHighScore('codon-quest');
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState('');
  const codons = Object.keys(CODON_TABLE);
  const make = () => {
    const c = codons[rnd(64)];
    const correct = CODON_TABLE[c];
    const opts = new Set([correct]);
    const aas = [...new Set(Object.values(CODON_TABLE))];
    while (opts.size < 4) opts.add(aas[rnd(aas.length)]);
    return { c, correct, opts: [...opts].sort(() => Math.random() - 0.5) };
  };
  const [round, setRound] = useState(make);
  const left = useCountdown(60, running, () => {
    setRunning(false);
    submit(scoreRef.current);
  });
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const pick = (aa: string) => {
    if (!running) return;
    if (aa === round.correct) {
      setScore((s) => s + 10 + Math.min(streak, 10));
      setStreak((s) => s + 1);
      setFeedback('✓');
    } else {
      setStreak(0);
      setFeedback(`✗ ${round.c} = ${AA_NAMES[round.correct]} (${round.correct})`);
    }
    setRound(make());
  };
  return (
    <div className="col">
      <div className="spread">
        <span className="pill">⏱ {left}s</span><span className="pill accent">Score {score}</span><span className="pill">🔥 {streak}</span><span className="pill">Best {best}</span>
      </div>
      {running ? (
        <>
          <div className="center" style={{ fontSize: '3rem', fontFamily: 'var(--mono)', letterSpacing: '0.2em' }}><Seq s={round.c} /></div>
          <div className="grid cols-2">
            {round.opts.map((aa) => (
              <button key={aa} className="btn" style={{ padding: 14 }} onClick={() => pick(aa)}>{aa === '*' ? '⛔ Stop' : `${aa} · ${AA_NAMES[aa]}`}</button>
            ))}
          </div>
          <div className="center small">{feedback}</div>
        </>
      ) : (
        <div className="center">
          <p>Translate as many mRNA codons as you can in 60 seconds. Streaks add bonus points.</p>
          <button className="btn primary" onClick={() => { setScore(0); setStreak(0); setFeedback(''); setRound(make()); setRunning(true); }}>{score ? 'Play again' : 'Start'}</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Complement Rush
export function ComplementRush() {
  const { best, submit } = useHighScore('complement-rush');
  const [running, setRunning] = useState(false);
  const [len, setLen] = useState(6);
  const [s, setS] = useState(randDna(6));
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const left = useCountdown(60, running, () => {
    setRunning(false);
    submit(scoreRef.current);
  });
  const check = (v: string) => {
    setInput(v.toUpperCase());
    if (v.toUpperCase() === reverseComplement(s)) {
      setScore((x) => x + len * 2);
      const nl = Math.min(14, len + 1);
      setLen(nl);
      setS(randDna(nl));
      setInput('');
    }
  };
  return (
    <div className="col">
      <div className="spread"><span className="pill">⏱ {left}s</span><span className="pill accent">Score {score}</span><span className="pill">Best {best}</span></div>
      {running ? (
        <>
          <div className="center small muted">Type the reverse complement (5′→3′):</div>
          <div className="center" style={{ fontSize: '2.2rem' }}><Seq s={s} /></div>
          <input autoFocus className="mono" value={input} onChange={(e) => check(e.target.value)} style={{ fontSize: '1.6rem', textAlign: 'center', letterSpacing: '0.15em' }} aria-label="reverse complement" />
          <button className="btn small" onClick={() => { setS(randDna(len)); setInput(''); }}>Skip</button>
        </>
      ) : (
        <div className="center">
          <p>Each correct answer makes the next string longer. Remember: complement, then <b>reverse</b>.</p>
          <button className="btn primary" onClick={() => { setScore(0); setLen(6); setS(randDna(6)); setInput(''); setRunning(true); }}>Start</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Euler Trail
export function EulerTrail() {
  const { best, submit } = useHighScore('euler-trail');
  const [level, setLevel] = useState(1);
  const make = (lv: number) => {
    for (;;) {
      const g = randDna(7 + lv * 2);
      const kmers: string[] = [];
      for (let i = 0; i + 3 <= g.length; i++) kmers.push(g.substr(i, 3));
      const graph = deBruijnFromKmers(kmers);
      if (eulerianPath(graph).ok && graph.nodes.length >= 4) return { g, kmers: [...kmers].sort(), graph };
    }
  };
  const [puz, setPuz] = useState(() => make(1));
  const [used, setUsed] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const current = used.length ? puz.graph.edges[used[used.length - 1]].to : null;
  const path = used.length ? [puz.graph.edges[used[0]].from, ...used.map((i) => puz.graph.edges[i].to)] : [];
  const click = (idx: number) => {
    if (used.includes(idx)) return;
    const e = puz.graph.edges[idx];
    if (current && e.from !== current) {
      setMsg(`That edge starts at ${e.from}, but you are at ${current}.`);
      return;
    }
    const nu = [...used, idx];
    setUsed(nu);
    setMsg('');
    if (nu.length === puz.graph.edges.length) {
      const spelled = spellPath([puz.graph.edges[nu[0]].from, ...nu.map((i) => puz.graph.edges[i].to)]);
      submit(level);
      setMsg(`🎉 Solved! You reconstructed ${spelled}${spelled === puz.g ? '' : ` (the original was ${puz.g}, and yours is equally valid: same 3-mer composition)`}.`);
    }
  };
  return (
    <div className="col">
      <div className="spread"><span className="pill accent">Level {level}</span><span className="pill">Best level {best}</span>
        <div className="row">
          <button className="btn small" onClick={() => { setUsed([]); setMsg(''); }}>Reset path</button>
          <button className="btn small primary" onClick={() => { const nl = used.length === puz.graph.edges.length ? level + 1 : level; setLevel(nl); setPuz(make(nl)); setUsed([]); setMsg(''); }}>{used.length === puz.graph.edges.length ? 'Next level' : 'New puzzle'}</button>
        </div>
      </div>
      <p className="small">Reads (3-mers): <span className="mono">{puz.kmers.join(' ')}</span>. Click edges (k-mers) to walk an <b>Eulerian path</b>, using every edge exactly once. Start at the node with one more outgoing than incoming edge.</p>
      <GraphView
        directed
        seedKey={puz.g}
        nodes={puz.graph.nodes.map((n) => ({ id: n, color: n === current ? 'var(--accent-soft)' : undefined }))}
        edges={puz.graph.edges.map((e, i) => ({ from: e.from, to: e.to, label: e.label, key: e.id, color: used.includes(i) ? 'var(--accent)' : 'var(--text-dim)', width: used.includes(i) ? 3 : 1.6 }))}
        onEdgeClick={(_, i) => click(i)}
        height={340}
      />
      <div>Genome so far: <Seq s={spellPath(path)} /></div>
      {msg && <div className="callout tip small">{msg}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Align Duel
export function AlignDuel() {
  const { best, submit } = useHighScore('align-duel');
  const make = () => {
    const x = randDna(4 + rnd(3));
    const y = x.split('').filter(() => Math.random() > 0.25).join('').replace(/./g, (c) => (Math.random() < 0.2 ? 'ACGT'[rnd(4)] : c)) || 'A';
    const mode: 'global' | 'local' = Math.random() < 0.5 ? 'global' : 'local';
    return { x, y, mode, r: align(x, y, { match: 2, mismatch: -1, gap: -2 }, mode) };
  };
  const [round, setRound] = useState(make);
  const [guess, setGuess] = useState('');
  const [streak, setStreak] = useState(0);
  const [msg, setMsg] = useState('');
  const check = () => {
    const ok = Number(guess) === round.r.score;
    if (ok) {
      const ns = streak + 1;
      setStreak(ns);
      submit(ns);
      setMsg(`✓ Correct: ${round.r.alignedX} / ${round.r.alignedY}`);
    } else {
      setStreak(0);
      setMsg(`✗ The optimal ${round.mode} score is ${round.r.score}: ${round.r.alignedX} / ${round.r.alignedY}`);
    }
  };
  return (
    <div className="col">
      <div className="spread"><span className="pill accent">Streak {streak}</span><span className="pill">Best streak {best}</span></div>
      <p>What is the optimal <b>{round.mode}</b> alignment score? (match +2, mismatch −1, gap −2)</p>
      <div className="seq" style={{ fontSize: '1.5rem' }}><div>x = <Seq s={round.x} /></div><div>y = <Seq s={round.y} /></div></div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (!msg) check(); }}>
        <input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="score" style={{ width: 100 }} aria-label="score" />
        <button className="btn primary" disabled={!!msg || guess === ''}>Check</button>
        <button type="button" className="btn" onClick={() => { setRound(make()); setGuess(''); setMsg(''); }}>Next pair</button>
      </form>
      {msg && <div className="callout tip small">{msg}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- CpG Detective
const CPG: HMM = {
  states: ['B', 'I'],
  symbols: ['A', 'C', 'G', 'T'],
  init: [0.8, 0.2],
  trans: [[0.97, 0.03], [0.06, 0.94]],
  emit: [[0.3, 0.2, 0.2, 0.3], [0.1, 0.4, 0.4, 0.1]],
};
export function CpgDetective() {
  const { best, submit } = useHighScore('cpg-detective');
  const block = 10;
  const [sample, setSample] = useState(() => sampleHMM(CPG, 200, Math.random));
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const nBlocks = sample.obs.length / block;
  const truthBlock = (b: number) => sample.states.slice(b * block, b * block + block).split('').filter((c) => c === 'I').length > block / 2;
  const vit = useMemo(() => viterbi(CPG, sample.obs).path, [sample]);
  const vitBlock = (b: number) => vit.slice(b * block, b * block + block).split('').filter((c) => c === 'I').length > block / 2;
  const acc = (f: (b: number) => boolean) => Array.from({ length: nBlocks }, (_, b) => f(b) === truthBlock(b)).filter(Boolean).length / nBlocks;
  const yours = acc((b) => marked.has(b));
  return (
    <div className="col">
      <div className="spread"><span className="pill">Best accuracy {best}%</span>
        <button className="btn small" onClick={() => { setSample(sampleHMM(CPG, 200, Math.random)); setMarked(new Set()); setRevealed(false); }}>New sequence</button>
      </div>
      <p className="small">Click the 10-bp blocks you think lie in a <b>CpG island</b> (C/G-rich). Then reveal the truth and compare yourself with the Viterbi decoder.</p>
      <div className="row" style={{ gap: 4 }}>
        {Array.from({ length: nBlocks }, (_, b) => (
          <button key={b} onClick={() => !revealed && setMarked((s) => { const n = new Set(s); if (n.has(b)) n.delete(b); else n.add(b); return n; })}
            className="mono" style={{ border: `2px solid ${marked.has(b) ? 'var(--accent)' : 'var(--border)'}`, background: revealed ? (truthBlock(b) ? 'rgba(209,67,91,0.18)' : 'transparent') : marked.has(b) ? 'var(--accent-soft)' : 'var(--bg-elev)', borderRadius: 6, padding: '2px 4px', cursor: 'pointer', color: 'var(--text)' }}>
            <Seq s={sample.obs.slice(b * block, b * block + block)} />
          </button>
        ))}
      </div>
      {!revealed ? (
        <button className="btn primary" onClick={() => { setRevealed(true); submit(Math.round(yours * 100)); }}>Reveal truth</button>
      ) : (
        <div className="callout tip small">
          Your block accuracy: <b>{Math.round(yours * 100)}%</b> · Viterbi: <b>{Math.round(acc(vitBlock) * 100)}%</b>. Red-shaded blocks are true islands. The HMM uses both emission bias (C/G 0.4 vs 0.2) and the “stickiness” of states (transition 0.94–0.97), which is why it rarely flips on a single C or G.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Skew Hunter
export function SkewHunter() {
  const { best, submit } = useHighScore('skew-hunter');
  const [seed, setSeed] = useState(() => rnd(100000));
  const n = 3000;
  const ori = useMemo(() => rnd(n), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const g = useMemo(() => syntheticGenome(n, ori, seed, 0.07), [ori, seed]);
  const [guess, setGuess] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const sk = skewArray(g).filter((_, i) => i % 5 === 0);
  const min = minimumSkew(g);
  const err = guess === null ? 0 : Math.min(...min.positions.map((p) => Math.abs(p - guess)));
  return (
    <div className="col">
      <div className="spread"><span className="pill accent">Total {score}</span><span className="pill">Best {best}</span></div>
      <p className="small">Here is the <b>cumulative skew</b> of a {n}-bp circular genome. Use the slider to place your guess for oriC. Closer guesses score more.</p>
      <LineChart series={[{ name: 'skew', values: sk }]} xs={sk.map((_, i) => i * 5)} height={200} markers={guess !== null ? [{ x: Math.round(guess / 5), label: 'guess' }] : []} />
      <input type="range" min={0} max={n} value={guess ?? 0} onChange={(e) => setGuess(Number(e.target.value))} aria-label="oriC guess" />
      <div className="row">
        <button className="btn primary" disabled={guess === null} onClick={() => {
          const pts = Math.max(0, 100 - Math.round((err / n) * 1000));
          const ns = score + pts;
          setScore(ns);
          submit(ns);
          toast(`${pts} points (true minimum at ${min.positions[0]})`);
          setSeed(rnd(100000));
          setGuess(null);
        }}>Lock in guess</button>
        <button className="btn" onClick={() => { setScore(0); setSeed(rnd(100000)); setGuess(null); }}>Restart</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Motif Hunter
export function MotifHunter() {
  const { best, submit } = useHighScore('motif-hunter');
  const k = 6;
  const make = () => {
    const motif = randDna(k);
    return Array.from({ length: 5 }, () => {
      const s = randDna(24);
      const m = motif.split('');
      const pos = rnd(k);
      m[pos] = Math.random() < 0.6 ? 'ACGT'[rnd(4)] : m[pos];
      const at = rnd(24 - k);
      return { s: s.slice(0, at) + m.join('') + s.slice(at + k), at, motif };
    });
  };
  const [rows, setRows] = useState(make);
  const [picks, setPicks] = useState<(number | null)[]>([null, null, null, null, null]);
  const [done, setDone] = useState(false);
  const correct = picks.filter((p, i) => p === rows[i].at).length;
  return (
    <div className="col">
      <div className="spread"><span className="pill">Best {best}/5</span>
        <button className="btn small" onClick={() => { setRows(make()); setPicks([null, null, null, null, null]); setDone(false); }}>New puzzle</button>
      </div>
      <p className="small">Each string hides the same 6-mer motif, with up to 1 mismatch. Click the <b>first letter</b> of the motif in every string.</p>
      {rows.map((r, i) => (
        <div key={i} className="seq" style={{ fontSize: '1.25rem' }}>
          {r.s.split('').map((c, j) => {
            const inPick = picks[i] !== null && j >= picks[i]! && j < picks[i]! + k;
            const inTruth = done && j >= r.at && j < r.at + k;
            return (
              <span key={j} onClick={() => !done && setPicks(picks.map((p, x) => (x === i ? j : p)))} className={`nt-${c} ${inTruth ? 'hl-good' : inPick ? 'hl' : ''}`} style={{ cursor: done ? 'default' : 'pointer', padding: '0 1px' }}>{c}</span>
            );
          })}
        </div>
      ))}
      {!done ? (
        <button className="btn primary" disabled={picks.some((p) => p === null)} onClick={() => { setDone(true); submit(correct); }}>Check</button>
      ) : (
        <div className="callout tip small">You found {correct}/5. The implanted motif was <b className="mono">{rows[0].motif}</b> (green). That's the search Greedy/Gibbs automate across thousands of sequences.</div>
      )}
    </div>
  );
}
