import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AA_NAMES, CODON_TABLE, phred33Char, reverseComplement } from '../lib/bio/strings';
import { deBruijnFromKmers, eulerianPath, spellPath } from '../lib/bio/assembly';
import { align } from '../lib/bio/alignment';
import { sampleHMM, viterbi, type HMM } from '../lib/bio/hmm';
import { minimumSkew, skewArray } from '../lib/bio/strings';
import { BoyerMoorePreprocessing } from '../lib/bio/matching';
import { toNewick, upgma } from '../lib/bio/phylo';
import { assign, centroids, dist } from '../lib/bio/cluster';
import { metrics, type Confusion } from '../lib/bio/ml';
import { barabasiAlbert, betweenness, closeness, edgesOf, type Graph } from '../lib/bio/network';
import { syntheticGenome } from '../widgets/oric';
import { GraphView } from '../widgets/GraphView';
import { LineChart, PALETTE, Scatter, Seq, fmt } from '../widgets/ui';
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

// ---------------------------------------------------------------- shared: timed multiple-choice rush
interface McqRound {
  prompt: ReactNode;
  correct: string;
  opts: string[];
  why: string;
}
const shuffled = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/** Pick `n` distinct options: the correct one plus distractors from `pool`. */
function optionsFrom(correct: string, pool: string[], n = 4) {
  const opts = new Set([correct]);
  for (const o of shuffled(pool)) if (opts.size < n) opts.add(o);
  return shuffled([...opts]);
}

function McqRush({ id, seconds, intro, make }: { id: string; seconds: number; intro: ReactNode; make: () => McqRound }) {
  const { best, submit } = useHighScore(id);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; why: string } | null>(null);
  const [round, setRound] = useState(make);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const left = useCountdown(seconds, running, () => {
    setRunning(false);
    submit(scoreRef.current);
  });
  const pick = (o: string) => {
    if (!running) return;
    const ok = o === round.correct;
    if (ok) {
      setScore((s) => s + 10 + Math.min(streak, 10));
      setStreak((s) => s + 1);
    } else setStreak(0);
    setFeedback({ ok, why: round.why });
    setRound(make());
  };
  return (
    <div className="col">
      <div className="spread">
        <span className="pill">⏱ {left}s</span><span className="pill accent">Score {score}</span><span className="pill">🔥 {streak}</span><span className="pill">Best {best}</span>
      </div>
      {running ? (
        <>
          <div>{round.prompt}</div>
          <div className="grid cols-2">
            {round.opts.map((o) => <button key={o} className="btn" style={{ padding: 12 }} onClick={() => pick(o)}>{o}</button>)}
          </div>
          {feedback && <div className="small"><b style={{ color: feedback.ok ? 'var(--ok)' : 'var(--danger)' }}>{feedback.ok ? '✓' : '✗'}</b> Last one: {feedback.why}</div>}
        </>
      ) : (
        <div className="center">
          <div>{intro}</div>
          <button className="btn primary" style={{ marginTop: 10 }} onClick={() => { setScore(0); setStreak(0); setFeedback(null); setRound(make()); setRunning(true); }}>{score ? 'Play again' : 'Start'}</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Phred Flash
const oneIn = (q: number) => `1 in ${(10 ** (q / 10)).toLocaleString('en-US')}`;
function phredRound(): McqRound {
  const kind = rnd(4);
  if (kind === 0) {
    const q = 2 + rnd(40);
    const pool = Array.from({ length: 11 }, (_, i) => String(Math.max(0, q - 5 + i)));
    const c = phred33Char(q);
    return {
      prompt: <p>FASTQ (Phred+33) quality character <b className="mono" style={{ fontSize: '1.6rem' }}>{c}</b>. What is its quality score Q?</p>,
      correct: String(q),
      opts: optionsFrom(String(q), pool),
      why: `'${c}' has ASCII code ${q + 33}; subtract 33 to get Q = ${q}.`,
    };
  }
  const q = [10, 20, 30, 40, 50][rnd(5)];
  if (kind === 1) {
    return {
      prompt: <p>A base call has quality <b>Q = {q}</b>. What is the chance that it is wrong?</p>,
      correct: oneIn(q),
      opts: optionsFrom(oneIn(q), [10, 20, 30, 40, 50].map(oneIn)),
      why: `P(error) = 10^(−Q/10) = 10^(−${q / 10}), i.e. ${oneIn(q)}.`,
    };
  }
  if (kind === 2) {
    const p = 10 ** (-q / 10);
    return {
      prompt: <p>A base call has error probability <b>{p}</b>. What is its Phred quality Q?</p>,
      correct: String(q),
      opts: optionsFrom(String(q), ['10', '20', '30', '40', '50']),
      why: `Q = −10·log₁₀(${p}) = ${q}.`,
    };
  }
  const c = phred33Char(q);
  return {
    prompt: <p>Quality character <b className="mono" style={{ fontSize: '1.6rem' }}>{c}</b> (Phred+33). How likely is this base call to be wrong?</p>,
    correct: oneIn(q),
    opts: optionsFrom(oneIn(q), [10, 20, 30, 40, 50].map(oneIn)),
    why: `'${c}' = ASCII ${q + 33} → Q = ${q} → P(error) = 10^(−${q / 10}) = ${oneIn(q)}.`,
  };
}
export function PhredFlash() {
  return (
    <McqRush
      id="phred-flash"
      seconds={60}
      make={phredRound}
      intro={<p>Decode FASTQ quality characters and Phred scores for 60 seconds. Remember: Q = ASCII − 33, and P(error) = 10<sup>−Q/10</sup>.</p>}
    />
  );
}

// ---------------------------------------------------------------- Shift Sprint (Boyer-Moore bad character rule)
function shiftRound(): McqRound {
  const m = 5 + rnd(3);
  const P = randDna(m);
  const j = m - 1 - rnd(m - 1); // mismatch position; P[j+1..] matched
  let c = 'ACGT'[rnd(4)];
  while (c === P[j]) c = 'ACGT'[rnd(4)];
  const T = randDna(j) + c + P.slice(j + 1);
  const shift = new BoyerMoorePreprocessing(P).badCharacterShift(j, c);
  const k = P.lastIndexOf(c, j - 1);
  const marks: Record<number, string> = { [j]: 'hl-bad' };
  for (let i = j + 1; i < m; i++) marks[i] = 'hl-good';
  return {
    prompt: (
      <div>
        <p className="small">Compare right to left. The green suffix matches; the red position mismatches. By the <b>bad character rule</b> alone, how far does P shift?</p>
        <div className="seq" style={{ fontSize: '1.6rem' }}>
          <div>T: <Seq s={T} marks={marks} /></div>
          <div>P: <Seq s={P} marks={marks} /></div>
        </div>
      </div>
    ),
    correct: String(shift),
    opts: optionsFrom(String(shift), Array.from({ length: m }, (_, i) => String(i + 1))),
    why: k >= 0
      ? `T has ${c} at the mismatch; the rightmost ${c} in P left of it is at offset ${k}, so shift ${j} − ${k} = ${shift} to line them up.`
      : `T has ${c} at the mismatch and P has no ${c} to its left, so P slides past it: shift ${j} + 1 = ${shift}.`,
  };
}
export function ShiftSprint() {
  return (
    <McqRush
      id="shift-sprint"
      seconds={90}
      make={shiftRound}
      intro={<p>Boyer-Moore skips alignments by learning from mismatches. For 90 seconds, work out how far the <b>bad character rule</b> shifts the pattern.</p>}
    />
  );
}

// ---------------------------------------------------------------- Metric Match
const METRIC_INFO: Record<string, { name: string; formula: (c: Confusion) => string }> = {
  accuracy: { name: 'accuracy', formula: (c) => `(TP + TN) / total = (${c.tp} + ${c.tn}) / ${c.tp + c.fp + c.tn + c.fn}` },
  precision: { name: 'precision', formula: (c) => `TP / (TP + FP) = ${c.tp} / (${c.tp} + ${c.fp})` },
  recall: { name: 'recall (sensitivity)', formula: (c) => `TP / (TP + FN) = ${c.tp} / (${c.tp} + ${c.fn})` },
  specificity: { name: 'specificity', formula: (c) => `TN / (TN + FP) = ${c.tn} / (${c.tn} + ${c.fp})` },
  f1: { name: 'F1 score', formula: () => '2 · precision · recall / (precision + recall)' },
  mcc: { name: 'MCC', formula: () => '(TP·TN − FP·FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))' },
};
function metricRound(): McqRound {
  const c: Confusion = { tp: 5 + rnd(90), fp: rnd(50), tn: 5 + rnd(90), fn: rnd(50) };
  const mt = metrics(c);
  const keys = Object.keys(METRIC_INFO) as (keyof typeof mt & keyof typeof METRIC_INFO)[];
  const key = keys[rnd(keys.length)];
  const v = (x: number) => x.toFixed(2);
  // distractors are the other metrics' values: the classic mix-ups
  const pool = [...keys.filter((k) => k !== key).map((k) => v(mt[k])), v(mt.balancedAccuracy), v(Math.random())];
  return {
    prompt: (
      <div>
        <p>What is the <b>{METRIC_INFO[key].name}</b> of this classifier?</p>
        <table className="mtable" style={{ margin: '0 auto' }}>
          <thead><tr><th></th><th>Predicted +</th><th>Predicted −</th></tr></thead>
          <tbody>
            <tr><th>Actual +</th><td>TP = {c.tp}</td><td>FN = {c.fn}</td></tr>
            <tr><th>Actual −</th><td>FP = {c.fp}</td><td>TN = {c.tn}</td></tr>
          </tbody>
        </table>
      </div>
    ),
    correct: v(mt[key]),
    opts: optionsFrom(v(mt[key]), pool.filter((o) => o !== v(mt[key]))),
    why: `${METRIC_INFO[key].name} = ${METRIC_INFO[key].formula(c)} = ${v(mt[key])}.`,
  };
}
export function MetricMatch() {
  return (
    <McqRush
      id="metric-match"
      seconds={120}
      make={metricRound}
      intro={<p>Read a confusion matrix and pick the right metric for 2 minutes. The wrong options are the <i>other</i> metrics, so mixing up precision and recall costs you.</p>}
    />
  );
}

// ---------------------------------------------------------------- Tree Builder (UPGMA)
function uniqueMin(D: number[][]) {
  const vals = D.flatMap((r, i) => r.filter((_, j) => j > i));
  const m = Math.min(...vals);
  return vals.filter((x) => Math.abs(x - m) < 1e-9).length === 1;
}
function makeTree() {
  for (;;) {
    const n = 4 + rnd(2);
    const labels = 'ABCDE'.slice(0, n).split('');
    const D = labels.map(() => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) D[i][j] = D[j][i] = 2 * (1 + rnd(10));
    const r = upgma(labels, D);
    const mats = [{ labels, D }, ...r.steps.slice(0, -1).map((s) => s.matrixAfter)];
    if (mats.every((x) => uniqueMin(x.D))) return { mats, steps: r.steps, newick: toNewick(r.root) };
  }
}
export function TreeBuilder() {
  const { best, submit } = useHighScore('tree-builder');
  const [puz, setPuz] = useState(makeTree);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [msg, setMsg] = useState('');
  const done = step === puz.steps.length;
  const cur = puz.mats[Math.min(step, puz.mats.length - 1)];
  const score = Math.max(0, 100 - 25 * mistakes);
  const click = (i: number, j: number) => {
    if (done || i === j) return;
    const [a, b] = [cur.labels[i], cur.labels[j]];
    const s = puz.steps[step];
    if (new Set([a, b, ...s.merged]).size === 2) {
      setStep(step + 1);
      setMsg(`✓ Merge ${a} and ${b} at height ${fmt(s.distance, 2)} / 2 = ${fmt(s.height, 2)}. New distances to (${a},${b}) are size-weighted averages.`);
      if (step + 1 === puz.steps.length) submit(score);
    } else {
      setMistakes(mistakes + 1);
      setMsg(`✗ D(${a}, ${b}) = ${fmt(cur.D[i][j], 2)} is not the smallest distance in the matrix.`);
    }
  };
  return (
    <div className="col">
      <div className="spread"><span className="pill accent">Score {score}</span><span className="pill">Best {best}</span>
        <button className="btn small" onClick={() => { setPuz(makeTree()); setStep(0); setMistakes(0); setMsg(''); }}>New matrix</button>
      </div>
      <p className="small">Build the tree with <b>UPGMA</b>: click the cell holding the smallest distance to merge that pair of clusters. Each wrong click costs 25 points.</p>
      {!done && (
        <div className="scroll-x">
          <table className="mtable">
            <thead><tr><th></th>{cur.labels.map((l) => <th key={l}>{l}</th>)}</tr></thead>
            <tbody>
              {cur.D.map((row, i) => (
                <tr key={cur.labels[i]}>
                  <th>{cur.labels[i]}</th>
                  {row.map((v, j) => (
                    <td key={j} onClick={() => click(i, j)} style={{ cursor: i === j ? 'default' : 'pointer' }} className={i === j ? 'dim' : ''}>{i === j ? '·' : fmt(v, 2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ol className="small" style={{ margin: 0 }}>
        {puz.steps.slice(0, step).map((s) => <li key={s.newCluster}>merge {s.merged[0]} + {s.merged[1]} at height {fmt(s.height, 2)}</li>)}
      </ol>
      {msg && <div className="callout tip small">{msg}</div>}
      {done && <div className="callout tip small">🌳 Tree complete with {mistakes} mistake{mistakes === 1 ? '' : 's'}. Newick: <span className="mono">{puz.newick}</span></div>}
    </div>
  );
}

// ---------------------------------------------------------------- Lloyd Step (k-means)
const COLOR_NAMES = ['blue', 'orange', 'green'];
function makeLloyd() {
  const clamp = (x: number) => Math.min(9.8, Math.max(0.2, x));
  const jitter = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.6;
  for (;;) {
    const k = 2 + rnd(2);
    const blobs = Array.from({ length: k }, () => [1.5 + Math.random() * 7, 1.5 + Math.random() * 7]);
    const pts = Array.from({ length: 6 * k }, (_, i) => [clamp(blobs[i % k][0] + jitter()), clamp(blobs[i % k][1] + jitter())]);
    const old = Array.from({ length: k }, () => [1 + Math.random() * 8, 1 + Math.random() * 8]);
    const labels = assign(pts, old);
    const sizes = old.map((_, c) => labels.filter((l) => l === c).length);
    if (sizes.every((s) => s >= 2)) return { pts, old, labels, next: centroids(pts, labels, k, old), target: rnd(k) };
  }
}
export function LloydStep() {
  const { best, submit } = useHighScore('lloyd-step');
  const ROUNDS = 5;
  const [puz, setPuz] = useState(makeLloyd);
  const [guess, setGuess] = useState<number[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(1);
  const [total, setTotal] = useState(0);
  const err = guess ? dist(guess, puz.next[puz.target]) : 0;
  const pts = Math.max(0, Math.round(100 - 40 * err));
  const lock = () => {
    setRevealed(true);
    const nt = total + pts;
    setTotal(nt);
    if (round === ROUNDS) submit(nt);
  };
  const next = () => {
    if (round === ROUNDS) {
      setRound(1);
      setTotal(0);
    } else setRound(round + 1);
    setPuz(makeLloyd());
    setGuess(null);
    setRevealed(false);
  };
  const color = PALETTE[puz.target];
  return (
    <div className="col">
      <div className="spread"><span className="pill">Round {round}/{ROUNDS}</span><span className="pill accent">Total {total}</span><span className="pill">Best {best}</span></div>
      <p className="small">One iteration of <b>Lloyd's algorithm</b>: every point joins its nearest center, then each center moves to the mean of its points. Click where the <b style={{ color }}>{COLOR_NAMES[puz.target]}</b> center will move.</p>
      <Scatter
        points={puz.pts}
        colors={revealed ? puz.labels.map((l) => PALETTE[l]) : puz.pts.map(() => 'var(--text-dim)')}
        centers={[...puz.old.map((p, i) => ({ p, color: PALETTE[i] })), ...(revealed ? [{ p: puz.next[puz.target], color }] : [])]}
        domain={[0, 10, 0, 10]}
        onClick={revealed ? undefined : (x, y) => setGuess([x, y])}
        extra={(X, Y) => (
          <>
            {revealed && <line x1={X(puz.old[puz.target][0])} y1={Y(puz.old[puz.target][1])} x2={X(puz.next[puz.target][0])} y2={Y(puz.next[puz.target][1])} stroke={color} strokeWidth={2} strokeDasharray="4 3" />}
            {guess && <circle cx={X(guess[0])} cy={Y(guess[1])} r={8} fill="none" stroke="var(--text)" strokeWidth={2} />}
          </>
        )}
      />
      <div className="row">
        {!revealed ? (
          <button className="btn primary" disabled={!guess} onClick={lock}>Lock in guess</button>
        ) : (
          <>
            <span className="small">Off by {fmt(err, 2)} units → <b>{pts} points</b>. Points are now colored by their nearest center; the dashed line shows the move.</span>
            <button className="btn primary" onClick={next}>{round === ROUNDS ? 'Play again' : 'Next round'}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Hub Hunter (network centrality)
type Measure = 'degree' | 'closeness' | 'betweenness';
const MEASURE_HINT: Record<Measure, string> = {
  degree: 'Degree = number of direct interaction partners. High-degree proteins are hubs.',
  closeness: 'Closeness = (n − 1) / sum of shortest-path distances to every other node: the node that reaches everyone fastest.',
  betweenness: 'Betweenness = how many shortest paths between other pairs pass through the node: the bottleneck between modules.',
};
function makeHub() {
  for (;;) {
    const raw = barabasiAlbert(10 + rnd(4), 1 + rnd(2), Math.random);
    const g: Graph = Object.fromEntries(Object.entries(raw).map(([k, v]) => [`P${+k.slice(1) + 1}`, v.map((x) => `P${+x.slice(1) + 1}`)]));
    const measure = (['degree', 'closeness', 'betweenness'] as const)[rnd(3)];
    const vals: Record<string, number> = measure === 'degree' ? Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.length])) : measure === 'closeness' ? closeness(g) : betweenness(g);
    const ranked = Object.entries(vals).sort((a, b) => b[1] - a[1]);
    if (ranked[0][1] - ranked[1][1] > 1e-9) return { g, measure, ranked, seed: String(Math.random()) };
  }
}
export function HubHunter() {
  const { best, submit } = useHighScore('hub-hunter');
  const [puz, setPuz] = useState(makeHub);
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const top = puz.ranked[0][0];
  const click = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === top) {
      const ns = streak + 1;
      setStreak(ns);
      submit(ns);
    } else setStreak(0);
  };
  const shade = (id: string) => (!picked ? undefined : id === top ? 'rgba(26,156,91,0.45)' : id === picked ? 'rgba(209,67,91,0.45)' : undefined);
  return (
    <div className="col">
      <div className="spread"><span className="pill accent">Streak {streak}</span><span className="pill">Best streak {best}</span>
        <button className="btn small primary" onClick={() => { setPuz(makeHub()); setPicked(null); }}>{picked ? 'Next network' : 'Skip'}</button>
      </div>
      <p>Click the protein with the highest <b>{puz.measure} centrality</b>.</p>
      <GraphView
        seedKey={puz.seed}
        nodes={Object.keys(puz.g).map((id) => ({ id, color: shade(id) }))}
        edges={edgesOf(puz.g).map(([from, to]) => ({ from, to }))}
        onNodeClick={click}
        height={340}
      />
      {picked && (
        <div className="callout tip small">
          {picked === top ? '✓ Correct!' : `✗ The answer was ${top}.`} {MEASURE_HINT[puz.measure]}
          <div className="mono" style={{ marginTop: 4 }}>Top 4: {puz.ranked.slice(0, 4).map(([k, v]) => `${k} = ${fmt(v, 2)}`).join(' · ')}</div>
        </div>
      )}
    </div>
  );
}
