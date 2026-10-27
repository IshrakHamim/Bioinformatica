import { useMemo, useState } from 'react';
import { binarySearchTrace, fibCalls, graphSearchTrace, greedyChange, hierholzerTrace, minCoinsDP, toyHash, type Adj } from '../lib/bio/algo';
import { mulberry32 } from '../lib/bio/rng';
import { cleanDna } from '../lib/bio/strings';
import { GraphView, type GEdge, type GNode } from './GraphView';
import { Seq, Slider, Stepper, TextField, Widget, rangesToMarks } from './ui';

const OPS_PER_SEC = 1e9;
const sup = (e: number) => String(e).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)] ?? (c === '-' ? '⁻' : c)).join('');
const sci = (log10: number) => (log10 < 4 ? String(Math.round(10 ** log10)) : `${(10 ** (log10 % 1)).toFixed(1)}×10${sup(Math.floor(log10))}`);

/** Human-readable duration for 10^log10 operations at 10⁹ operations per second. */
function duration(log10ops: number) {
  const s = log10ops - Math.log10(OPS_PER_SEC);
  const secs = 10 ** s;
  if (s > 17.64) return 'longer than the age of the universe';
  const units: [number, string][] = [[3.15e7, 'years'], [86400, 'days'], [3600, 'hours'], [60, 'minutes'], [1, 'seconds'], [1e-3, 'ms'], [1e-6, 'µs'], [1e-9, 'ns']];
  for (const [u, name] of units) if (secs >= u) return `${secs / u >= 100 ? Math.round(secs / u).toLocaleString() : (secs / u).toFixed(1)} ${name}`;
  return '< 1 ns';
}

export function BigORace() {
  const [step, setStep] = useState(4);
  const e = 1 + step / 2; // n = 10^e
  const n = 10 ** e;
  const rows = [
    { name: 'O(log n)', log: Math.log10(Math.log2(n)), eg: 'binary search' },
    { name: 'O(n)', log: e, eg: 'one pass: skew, k-mer counting' },
    { name: 'O(n log n)', log: e + Math.log10(Math.log2(n)), eg: 'sorting, building an index' },
    { name: 'O(n²)', log: 2 * e, eg: 'all pairs; naive FrequentWords' },
    { name: 'O(n³)', log: 3 * e, eg: 'neighbour joining on n species' },
    { name: 'O(2ⁿ)', log: n * Math.log10(2), eg: 'try every subset / path' },
  ];
  const CAP = 30;
  return (
    <Widget title="Growth race: how long would it take?" icon="🏁">
      <Stepper step={step} max={18} setStep={setStep} speed={900} label={<>· n = <b>{sci(e)}</b></>} />
      <p className="small muted">Each bar is the number of operations (log scale), at 10⁹ simple operations per second. Press Play and watch n grow to the size of a human genome (3 × 10⁹ ≈ 10<sup>9.5</sup>).</p>
      <div style={{ display: 'grid', gap: 6 }}>
        {rows.map((r) => {
          const w = Math.max(1, Math.min(100, (Math.min(r.log, CAP) / CAP) * 100));
          const secsLog = r.log - Math.log10(OPS_PER_SEC);
          const bad = secsLog > Math.log10(3.15e7); // more than a year
          return (
            <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 8, alignItems: 'center' }}>
              <b className="mono small">{r.name}</b>
              <div>
                <div style={{ height: 16, width: `${w}%`, background: bad ? 'var(--danger)' : secsLog > 0 ? 'var(--warn)' : 'var(--ok)', borderRadius: 4, transition: 'width 0.6s ease, background 0.6s' }} />
                <div className="tiny muted">
                  {r.log > CAP ? `more than 10${sup(CAP)}` : sci(r.log)} ops · <b style={{ color: 'var(--text)' }}>{duration(r.log)}</b> · {r.eg}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="small">Green: under a second. Amber: noticeable. Red: more than a year. At genome scale only O(n) and O(n log n) survive, which is why every whole-genome algorithm in the course is (close to) linear.</p>
    </Widget>
  );
}

export function HashCount({ text: text0 = 'ACGTTGCATGTCGCATGATGCATGAGAGCT' }: { text?: string }) {
  const [text, setText] = useState(text0);
  const [k, setK] = useState(4);
  const B = 8;
  const dna = cleanDna(text).slice(0, 60);
  const windows = Math.max(0, dna.length - k + 1);
  const [step, setStep] = useState(0);
  const s = Math.min(step, windows);
  const table = useMemo(() => {
    const buckets: { kmer: string; count: number }[][] = Array.from({ length: B }, () => []);
    for (let i = 0; i < s; i++) {
      const w = dna.slice(i, i + k);
      const b = buckets[toyHash(w, B)];
      const e = b.find((x) => x.kmer === w);
      if (e) e.count++;
      else b.push({ kmer: w, count: 1 });
    }
    return buckets;
  }, [dna, k, s]);
  const cur = s > 0 ? dna.slice(s - 1, s - 1 + k) : null;
  const curB = cur ? toyHash(cur, B) : -1;
  const max = Math.max(0, ...table.flat().map((x) => x.count));
  const finished = s === windows && windows > 0;
  return (
    <Widget title="A hash map counting k-mers, one window at a time" icon="#️⃣">
      <div className="row">
        <TextField label="Text" value={text} onChange={(v) => { setText(v); setStep(0); }} width={300} />
        <Slider label="k" min={2} max={6} value={k} onChange={(v) => { setK(v); setStep(0); }} />
      </div>
      <Stepper step={s} max={windows} setStep={setStep} speed={650} label="windows read" />
      <div className="seq">
        <Seq s={dna} marks={cur ? rangesToMarks([{ start: s - 1, len: k, cls: 'hl' }]) : undefined} />
      </div>
      <p className="small" style={{ minHeight: '2.6em' }}>
        {cur ? (
          <>Window {s}: <b className="mono">{cur}</b>. The hash function sends it straight to <b>bucket {curB}</b>, so we never search the other buckets. Its count is now <b>{table[curB].find((x) => x.kmer === cur)?.count}</b>.</>
        ) : (
          'Press Play. Each step reads the next window, hashes it to a bucket, and adds 1 to its count there (inserting it if new).'
        )}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
        {table.map((b, i) => (
          <div key={i} style={{ border: `2px solid ${i === curB ? 'var(--accent-2)' : 'var(--border)'}`, borderRadius: 10, padding: 6, minHeight: 60, transition: 'border-color 0.3s', background: i === curB ? 'var(--accent-soft)' : 'transparent' }}>
            <div className="tiny muted">bucket {i}</div>
            {b.map((x) => (
              <div key={x.kmer} className="mono small" style={{ fontWeight: x.kmer === cur ? 700 : 400, color: finished && x.count === max ? 'var(--ok)' : undefined }}>
                {x.kmer} ×{x.count}
              </div>
            ))}
          </div>
        ))}
      </div>
      {finished && (
        <p className="small">
          Done in one pass: {windows} windows, one O(1) hash lookup each. Most frequent: <b className="mono">{table.flat().filter((x) => x.count === max).map((x) => x.kmer).join(', ')}</b> ({max} times). Several k-mers sharing a bucket is a <b>collision</b>; the map simply keeps a short list there.
        </p>
      )}
    </Widget>
  );
}

export function BinarySearchViz() {
  const [text, setText] = useState('GATTACAGATTACACATGATCAAGGT');
  const [q, setQ] = useState('GAT');
  const k = 3;
  const dna = cleanDna(text).slice(0, 40);
  const index = useMemo(() => {
    const pairs: [string, number][] = [];
    for (let i = 0; i + k <= dna.length; i++) pairs.push([dna.slice(i, i + k), i]);
    return pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]));
  }, [dna]);
  const query = cleanDna(q).slice(0, k);
  const tr = useMemo(() => binarySearchTrace(index.map((p) => p[0]), query), [index, query]);
  const [step, setStep] = useState(0);
  const s = Math.min(step, tr.steps.length + 1);
  const cur = s >= 1 && s <= tr.steps.length ? tr.steps[s - 1] : null;
  const done = s === tr.steps.length + 1;
  const hits = done && tr.found ? index.slice(tr.index).filter((p) => p[0] === query) : [];
  return (
    <Widget title="Binary search in a sorted k-mer index" icon="🔍">
      <div className="row">
        <TextField label="Genome" value={text} onChange={(v) => { setText(v); setStep(0); }} width={260} />
        <TextField label="Query 3-mer" value={q} onChange={(v) => { setQ(v); setStep(0); }} width={70} />
      </div>
      <Stepper step={s} max={tr.steps.length + 1} setStep={setStep} speed={900} />
      <p className="small" style={{ minHeight: '2.6em' }}>
        {s === 0 && `The index holds all ${index.length} (3-mer, position) pairs, sorted. Search range: the whole list.`}
        {cur && (
          <>Look at the middle entry #{cur.mid}: <b className="mono">{index[cur.mid][0]}</b> {cur.cmp < 0 ? <>comes before <b className="mono">{query}</b>, so throw away the left half.</> : <>is not before <b className="mono">{query}</b>, so keep the left half (including it).</>} Entries left to search: {cur.cmp < 0 ? cur.hi - cur.mid - 1 : cur.mid - cur.lo}.</>
        )}
        {done && (tr.found ? <>Found after <b>{tr.steps.length}</b> comparisons (a linear scan would need {tr.index + 1}). Reading forward gives every occurrence: positions <b>{hits.map((h) => h[1]).join(', ')}</b>.</> : <>Not in the index: after {tr.steps.length} comparisons the range is empty.</>)}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {index.map(([w, pos], i) => {
          const inRange = cur ? i >= cur.lo && i < cur.hi : s === 0;
          const isMid = cur?.mid === i;
          const isHit = hits.some((h) => h[1] === pos && h[0] === w);
          return (
            <div key={i} className="mono tiny" style={{ padding: '3px 5px', borderRadius: 6, border: `2px solid ${isMid ? 'var(--danger)' : isHit ? 'var(--ok)' : 'var(--border)'}`, opacity: inRange || isHit || done ? 1 : 0.25, transition: 'opacity 0.4s, border-color 0.3s', textAlign: 'center' }}>
              <div style={{ fontWeight: 700 }}>{w}</div>
              <div className="muted">@{pos}</div>
            </div>
          );
        })}
      </div>
      <p className="small muted">Each comparison halves the range, so n entries need about log₂ n comparisons: 32 for the 3 × 10⁹ positions of a human genome.</p>
    </Widget>
  );
}

export function CoinDP() {
  const [coinsText, setCoinsText] = useState('1, 4, 5');
  const [amount, setAmount] = useState(8);
  const coins = [...new Set(coinsText.split(/[\s,]+/).map(Number).filter((c) => Number.isInteger(c) && c > 0))].sort((a, b) => a - b);
  const dp = useMemo(() => minCoinsDP(coins, amount), [coins.join(), amount]); // eslint-disable-line react-hooks/exhaustive-deps
  const greedy = greedyChange(coins, amount);
  const [step, setStep] = useState(0);
  const max = amount + 1; // fill cells 1..amount, then one traceback step
  const s = Math.min(step, max);
  const m = s >= 1 && s <= amount ? s : null;
  const tracing = s === max;
  const tracePath: number[] = [];
  if (tracing) for (let x = amount; x >= 0; x -= dp.choice[x] ?? amount + 1) { tracePath.push(x); if (x === 0 || dp.choice[x] === null) break; }
  const cand = m ? coins.filter((c) => c <= m).map((c) => ({ c, from: m - c, val: dp.best[m - c] + 1 })) : [];
  const show = (v: number) => (Number.isFinite(v) ? String(v) : '∞');
  return (
    <Widget title="Dynamic programming fills the table: MinCoins" icon="🪙">
      <div className="row">
        <TextField label="Coins" value={coinsText} onChange={(v) => { setCoinsText(v); setStep(0); }} width={110} />
        <Slider label="Amount" min={1} max={24} value={amount} onChange={(v) => { setAmount(v); setStep(0); }} />
      </div>
      <Stepper step={s} max={max} setStep={setStep} speed={800} />
      <div className="scroll-x">
        <table className="mtable">
          <thead><tr><th>m</th>{Array.from({ length: amount + 1 }, (_, i) => <th key={i}>{i}</th>)}</tr></thead>
          <tbody>
            <tr>
              <th>MinCoins</th>
              {Array.from({ length: amount + 1 }, (_, i) => {
                const filled = i === 0 || i <= s;
                const cls = tracing && tracePath.includes(i) ? 'best' : i === m ? 'cur' : cand.some((x) => x.from === i) ? 'path' : !filled ? 'dim' : '';
                return <td key={i} className={cls} style={{ transition: 'background 0.3s' }}>{filled ? show(dp.best[i]) : '?'}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="small" style={{ minHeight: '4.2em', marginTop: 8 }}>
        {s === 0 && <>MinCoins(0) = 0: no coins make 0. Press Play to fill the table left to right; each cell only looks at cells already filled.</>}
        {m && (
          <>
            <b>m = {m}:</b> the last coin could be {cand.map((x, i) => <span key={x.c}>{i ? ', ' : ''}<b>{x.c}</b> → MinCoins({x.from}) + 1 = {show(x.val)}</span>)}. Take the smallest: <b>{show(dp.best[m])}</b>.
          </>
        )}
        {tracing && (Number.isFinite(dp.best[amount]) ? <>Traceback (green): {tracePath.join(' → ')}, using coins <b>{dp.coinsUsed.join(' + ')}</b>, so <b>{dp.best[amount]}</b> coins.</> : <>Amount {amount} can't be made with these coins.</>)}
      </div>
      <p className="small">
        Greedy (largest coin first): {greedy ? <><b>{greedy.join(' + ')}</b> = {greedy.length} coins</> : 'gets stuck'}. DP: <b>{show(dp.best[amount])}</b> coins.{' '}
        {greedy && Number.isFinite(dp.best[amount]) && greedy.length > dp.best[amount] ? <span className="pill warn">greedy is not optimal here</span> : <span className="pill ok">greedy happens to be optimal here</span>}
      </p>
    </Widget>
  );
}

export function FibTree() {
  const [n, setN] = useState(5);
  const [memo, setMemo] = useState(false);
  const calls = useMemo(() => fibCalls(n, memo), [n, memo]);
  const naiveCount = useMemo(() => fibCalls(n, false).length, [n]);
  const memoCount = useMemo(() => fibCalls(n, true).length, [n]);
  const [step, setStep] = useState(calls.length);
  const s = Math.min(step, calls.length);
  // layout: leaves get consecutive x slots, parents sit above the middle of their children
  const pos = useMemo(() => {
    const kids: number[][] = calls.map(() => []);
    calls.forEach((c, i) => c.parent >= 0 && kids[c.parent].push(i));
    const x: number[] = [];
    let slot = 0;
    const place = (i: number): number => {
      if (!kids[i].length) return (x[i] = slot++);
      const xs = kids[i].map(place);
      return (x[i] = (xs[0] + xs[xs.length - 1]) / 2);
    };
    place(0);
    return { x, slots: slot, depth: Math.max(...calls.map((c) => c.depth)) };
  }, [calls]);
  const W = Math.max(320, pos.slots * 44);
  const H = (pos.depth + 1) * 52 + 20;
  const X = (i: number) => 22 + (pos.x[i] / Math.max(1, pos.slots - 1)) * (W - 44);
  const Y = (i: number) => 24 + calls[i].depth * 52;
  const seenN = new Map<number, number>();
  return (
    <Widget title="The recursion tree of fib(n): why memoization is dynamic programming" icon="🌳">
      <div className="row">
        <Slider label="n" min={2} max={7} value={n} onChange={(v) => { setN(v); setStep(0); }} />
        <label className="small"><input type="checkbox" checked={memo} onChange={(e) => { setMemo(e.target.checked); setStep(0); }} /> memoize (store each answer the first time)</label>
      </div>
      <Stepper step={s} max={calls.length} setStep={setStep} speed={400} label="calls" />
      <div className="scroll-x">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: Math.min(W, 700), height: 'auto', background: 'var(--bg-sunk)', borderRadius: 10 }}>
          {calls.slice(0, s).map((c, i) => c.parent >= 0 && <line key={`e${i}`} x1={X(c.parent)} y1={Y(c.parent)} x2={X(i)} y2={Y(i)} stroke="var(--border)" strokeWidth={1.5} />)}
          {calls.slice(0, s).map((c, i) => {
            const repeat = (seenN.get(c.n) ?? 0) > 0 && !c.memoHit && c.n >= 2;
            seenN.set(c.n, (seenN.get(c.n) ?? 0) + 1);
            const fill = i === s - 1 ? 'var(--accent-soft)' : c.memoHit ? 'var(--bg-elev)' : repeat ? 'rgba(209, 67, 91, 0.18)' : 'var(--bg-elev)';
            return (
              <g key={i} transform={`translate(${X(i)},${Y(i)})`}>
                <circle r={16} fill={fill} stroke={c.memoHit ? 'var(--ok)' : repeat ? 'var(--danger)' : 'var(--accent-2)'} strokeWidth={2} strokeDasharray={c.memoHit ? '3 2' : undefined} />
                <text textAnchor="middle" dy="4" fontSize="11" fontFamily="var(--mono)">f({c.n})</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="small">
        <span style={{ color: 'var(--danger)' }}>Red</span> = a subproblem being solved <b>again</b>; <span style={{ color: 'var(--ok)' }}>green dashed</span> = answered instantly from the memo. fib({n}) takes <b>{naiveCount}</b> calls without memoization (it grows like 1.6ⁿ) but only <b>{memoCount}</b> with it (2n − 1). Storing answers to overlapping subproblems is the whole idea of dynamic programming.
      </p>
    </Widget>
  );
}

const SEARCH_EDGES: [string, string][] = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['D', 'G'], ['E', 'G'], ['F', 'H'], ['G', 'H'], ['C', 'E']];
const SEARCH_ADJ: Adj = (() => {
  const g: Adj = {};
  for (const [a, b] of SEARCH_EDGES) {
    (g[a] ??= []).push(b);
    (g[b] ??= []).push(a);
  }
  for (const k in g) g[k].sort();
  return g;
})();

export function GraphSearchViz() {
  const [mode, setMode] = useState<'bfs' | 'dfs'>('bfs');
  const [start, setStart] = useState('A');
  const steps = useMemo(() => graphSearchTrace(SEARCH_ADJ, start, mode), [start, mode]);
  const [step, setStep] = useState(0);
  const s = Math.min(step, steps.length - 1);
  const st = steps[s];
  const treeKey = new Set(st.tree.map(([a, b]) => [a, b].sort().join('')));
  const nodes: GNode[] = Object.keys(SEARCH_ADJ).sort().map((id) => ({
    id,
    label: mode === 'bfs' && st.dist[id] !== undefined ? `${id}·${st.dist[id]}` : id,
    r: 19,
    color: id === st.current ? 'var(--accent-soft)' : undefined,
    ring: id === st.current ? 'var(--danger)' : st.visited.includes(id) ? 'var(--ok)' : st.frontier.includes(id) ? 'var(--warn)' : 'var(--border)',
  }));
  const edges: GEdge[] = SEARCH_EDGES.map(([a, b]) => ({ from: a, to: b, color: treeKey.has([a, b].sort().join('')) ? 'var(--accent)' : undefined, width: treeKey.has([a, b].sort().join('')) ? 3 : 1.5 }));
  return (
    <Widget title="Breadth-first vs depth-first search" icon="🧭">
      <div className="row">
        <div className="row" role="group">
          {(['bfs', 'dfs'] as const).map((x) => <button key={x} className={`btn small ${mode === x ? 'primary' : ''}`} onClick={() => { setMode(x); setStep(0); }}>{x === 'bfs' ? 'BFS (queue)' : 'DFS (stack)'}</button>)}
        </div>
        <label className="field"><span>Start</span>
          <select value={start} onChange={(e) => { setStart(e.target.value); setStep(0); }}>{Object.keys(SEARCH_ADJ).sort().map((k) => <option key={k}>{k}</option>)}</select>
        </label>
      </div>
      <Stepper step={s} max={steps.length - 1} setStep={setStep} speed={1000} />
      <GraphView nodes={nodes} edges={edges} seedKey="algo-search" height={300} />
      <p className="small" style={{ minHeight: '2.6em' }}>{st.note}</p>
      <div className="row small">
        <span><b>{mode === 'bfs' ? 'Queue (front → back)' : 'Stack (top → bottom)'}:</b></span>
        {st.frontier.length ? st.frontier.map((x, i) => <span key={i} className="pill mono" style={{ borderColor: 'var(--warn)' }}>{x}</span>) : <span className="muted">empty</span>}
      </div>
      <div className="row small" style={{ marginTop: 4 }}>
        <span><b>Visit order:</b></span> <span className="mono">{st.visited.join(' → ') || '—'}</span>
      </div>
      <p className="small muted">
        Rings: <span style={{ color: 'var(--danger)' }}>red</span> = being processed, <span style={{ color: 'var(--warn)' }}>amber</span> = waiting in the {mode === 'bfs' ? 'queue' : 'stack'}, <span style={{ color: 'var(--ok)' }}>green</span> = done. Thick edges form the search tree. {mode === 'bfs' ? 'BFS spreads out in rings, so the number after each node is its shortest-path distance from the start.' : 'DFS dives down one branch as far as it can, then backtracks; the same idea drives Hierholzer\'s algorithm.'}
      </p>
    </Widget>
  );
}

export function HierholzerViz() {
  const [input, setInput] = useState('AGC ATG CAG CTG GCA GCT TGA TGC');
  const kmers = input.split(/[\s,]+/).map(cleanDna).filter(Boolean);
  const k = kmers[0]?.length ?? 0;
  const valid = kmers.length > 1 && k >= 2 && kmers.every((x) => x.length === k);
  const edges: [string, string][] = valid ? kmers.map((x) => [x.slice(0, -1), x.slice(1)]) : [];
  const nodesList = [...new Set(edges.flat())];
  const bal: Record<string, number> = {};
  for (const [a, b] of edges) {
    bal[a] = (bal[a] ?? 0) + 1;
    bal[b] = (bal[b] ?? 0) - 1;
  }
  const start = nodesList.find((x) => bal[x] === 1) ?? nodesList[0];
  const tr = useMemo(() => (valid ? hierholzerTrace(edges, start) : null), [input]); // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState(0);
  if (!tr) return <Widget title="Hierholzer's algorithm" icon="🔁"><TextField label="k-mers" value={input} onChange={setInput} width="100%" /><p className="small">Enter at least two k-mers of the same length.</p></Widget>;
  const s = Math.min(step, tr.steps.length - 1);
  const st = tr.steps[s];
  const complete = s === tr.steps.length - 1;
  const ok = tr.path.length === edges.length + 1;
  const top = st.stack[st.stack.length - 1];
  const nodes: GNode[] = nodesList.map((id) => ({ id, r: 20, ring: bal[id] === 1 ? 'var(--ok)' : bal[id] === -1 ? 'var(--danger)' : 'var(--accent-2)', color: id === top ? 'var(--accent-soft)' : undefined }));
  const order = new Map(st.used.map((e, i) => [e, i + 1]));
  const gEdges: GEdge[] = edges.map(([a, b], i) => ({ from: a, to: b, key: i, label: order.has(i) ? `${kmers[i]}·${order.get(i)}` : kmers[i], color: i === st.edge ? 'var(--danger)' : order.has(i) ? 'var(--accent)' : undefined, width: order.has(i) ? 2.6 : 1.4 }));
  const spelled = ok && complete ? tr.path[0] + tr.path.slice(1).map((x) => x.slice(-1)).join('') : '';
  return (
    <Widget title="Hierholzer's algorithm: walk until stuck, back up, splice" icon="🔁">
      <TextField label="Reads (k-mers): each becomes an edge prefix → suffix" value={input} onChange={(v) => { setInput(v); setStep(0); }} width="100%" />
      <Stepper step={s} max={tr.steps.length - 1} setStep={setStep} speed={800} />
      <GraphView nodes={nodes} edges={gEdges} directed seedKey={`hh-${input}`} height={320} />
      <p className="small" style={{ minHeight: '2.6em' }}>{st.note}</p>
      <div className="row small"><b>Stack (current walk):</b> <span className="mono">{st.stack.join(' → ') || '—'}</span></div>
      <div className="row small" style={{ marginTop: 4 }}><b>Finished path (read right to left as it grows):</b> <span className="mono">{[...st.circuit].reverse().join(' → ') || '—'}</span></div>
      {complete && (
        <p className="small">
          {ok ? <>Eulerian path: <b className="mono">{tr.path.join(' → ')}</b>, which spells <b className="mono">{spelled}</b>. Every edge used once, in O(|E|) steps.</> : <span className="pill warn">Not every edge was used: this graph has no Eulerian path from {start} (check the in/out-degrees).</span>}
        </p>
      )}
      <p className="small muted">Green ring = start (out − in = 1), red ring = end (in − out = 1). Edge labels show the read and the order in which it was walked. Notice what happens at TG: walking to GA first gets stuck early, and the algorithm recovers by splicing in the cycle it skipped.</p>
    </Widget>
  );
}

/** A fixed 1-D landscape with several valleys (lower is better). */
function landscape(x: number) {
  const g = (c: number, w: number, d: number) => -d * Math.exp(-((x - c) ** 2) / (2 * w * w));
  return 10 + g(14, 5, 4) + g(38, 4, 6) + g(62, 3, 9) + g(84, 6, 5) + 0.6 * Math.sin(x / 2.3);
}

export function LocalSearchViz() {
  const N = 100;
  const T = 40;
  const [hikers, setHikers] = useState(3);
  const [random, setRandom] = useState(false);
  const [seed, setSeed] = useState(3);
  const ys = useMemo(() => Array.from({ length: N }, (_, x) => landscape(x)), []);
  const globalMin = ys.indexOf(Math.min(...ys));
  const paths = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: hikers }, () => {
      let x = Math.floor(rng() * N);
      const path = [x];
      for (let t = 0; t < T; t++) {
        if (random) {
          // Metropolis-style move: propose a small random step, always accept downhill, sometimes uphill
          const nx = Math.min(N - 1, Math.max(0, x + Math.round((rng() - 0.5) * 8)));
          const d = ys[nx] - ys[x];
          if (d <= 0 || rng() < Math.exp(-d / 0.8)) x = nx;
        } else {
          const best = [x - 1, x, x + 1].filter((v) => v >= 0 && v < N).reduce((a, b) => (ys[b] < ys[a] ? b : a));
          x = best;
        }
        path.push(x);
      }
      return path;
    });
  }, [hikers, random, seed, ys]);
  const [step, setStep] = useState(0);
  const s = Math.min(step, T);
  const W = 640;
  const H = 220;
  const lo = Math.min(...ys) - 0.5;
  const hi = Math.max(...ys) + 0.5;
  const X = (x: number) => 10 + (x / (N - 1)) * (W - 20);
  const Y = (y: number) => 10 + ((y - lo) / (hi - lo)) * (H - 20);
  const COLORS = ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#f59f00', '#0ca678', '#d6336c', '#495057'];
  const bestAll = Math.min(...paths.flatMap((p) => p.slice(0, s + 1).map((x) => ys[x])));
  const foundGlobal = paths.some((p) => p.slice(0, s + 1).some((x) => Math.abs(x - globalMin) <= 2));
  return (
    <Widget title="Local search, restarts and random moves" icon="⛰️" actions={<button className="btn small" onClick={() => { setSeed((x) => x + 1); setStep(0); }}>New random starts</button>}>
      <div className="row">
        <Slider label="Restarts (hikers)" min={1} max={8} value={hikers} onChange={(v) => { setHikers(v); setStep(0); }} />
        <label className="small"><input type="checkbox" checked={random} onChange={(e) => { setRandom(e.target.checked); setStep(0); }} /> allow random uphill moves (like Gibbs sampling)</label>
      </div>
      <Stepper step={s} max={T} setStep={setStep} speed={250} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', background: 'var(--bg-sunk)', borderRadius: 10 }}>
        <polyline fill="none" stroke="var(--text-dim)" strokeWidth={2} points={ys.map((y, x) => `${X(x)},${H - Y(y) + 10}`).join(' ')} />
        <line x1={X(globalMin)} x2={X(globalMin)} y1={10} y2={H - 10} stroke="var(--ok)" strokeDasharray="4 3" />
        <text x={X(globalMin) + 4} y={22} fontSize="11" style={{ fill: 'var(--ok)' }}>global optimum</text>
        {paths.map((p, i) => (
          <circle key={i} cx={X(p[s])} cy={H - Y(ys[p[s]]) + 10 - 7} r={7} fill={COLORS[i % COLORS.length]} stroke="var(--bg-elev)" strokeWidth={2} style={{ transition: 'cx 0.22s linear, cy 0.22s linear' }} />
        ))}
      </svg>
      <p className="small">
        Lower is better (think: motif score, k-means distortion). {random ? 'Each hiker proposes a random nearby step and takes it if it goes down, and sometimes even if it goes up, so it can escape a shallow valley.' : 'Each hiker always steps downhill and stops at the bottom of whatever valley it started in: a local optimum.'}{' '}
        Best score found so far: <b>{bestAll.toFixed(2)}</b>. {foundGlobal ? <span className="pill ok">a hiker reached the global optimum</span> : <span className="pill warn">no hiker has found the deepest valley yet</span>}
      </p>
      <p className="small muted">Try 1 hiker vs 8, and the random-moves box. More restarts and occasional uphill moves are exactly why RandomizedMotifSearch is run thousands of times and why Gibbs sampling samples instead of always picking the best.</p>
    </Widget>
  );
}
