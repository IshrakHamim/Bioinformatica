import { useMemo, useState } from 'react';
import { BoyerMoorePreprocessing, boyerMoore, kmerIndex, naiveMatch, pigeonholeHamming, queryIndex } from '../lib/bio/matching';
import { editDistance } from '../lib/bio/alignment';
import { Matrix, Slider, Stepper, Widget } from './ui';

export function BoyerMooreViz({ preset = 'mid' }: { preset?: string }) {
  const P: Record<string, [string, string]> = {
    mid: ['TACGACGTACGTAGACGTACG', 'ACGTAC'],
    slide: ['GTTATAGCTGATCGCGGCGTAGCGGCGAA', 'GTAGCGGCG'],
    word: ['THERE WOULD HAVE BEEN A TIME FOR SUCH A WORD', 'WORD'],
  };
  const [t, setT] = useState(P[preset]?.[0] ?? P.mid[0]);
  const [p, setP] = useState(P[preset]?.[1] ?? P.mid[1]);
  const [bc, setBc] = useState(true);
  const [gs, setGs] = useState(true);
  const [step, setStep] = useState(0);
  const T = t.toUpperCase();
  const Pp = p.toUpperCase();
  const ok = Pp.length > 0 && Pp.length <= T.length;
  const res = useMemo(() => (ok ? boyerMoore(Pp, T, bc, gs) : null), [Pp, T, bc, gs, ok]);
  const naive = useMemo(() => (ok ? naiveMatch(Pp, T) : null), [Pp, T, ok]);
  const pre = useMemo(() => (ok ? new BoyerMoorePreprocessing(Pp, [...new Set(T.split(''))].join('')) : null), [Pp, T, ok]);
  if (!res || !naive || !pre) return <Widget title="Boyer-Moore" icon="⏩"><input value={p} onChange={(e) => setP(e.target.value)} /></Widget>;
  const s = res.steps[Math.min(step, res.steps.length - 1)];
  const cmpBefore = res.steps.slice(0, step).reduce((a, x) => a + x.compared.length, 0);
  const cell = 26;
  return (
    <Widget title="Boyer-Moore: bad character + good suffix rules" icon="⏩">
      <div className="row">
        <label className="field"><span>Text T</span><input className="mono" value={t} onChange={(e) => { setT(e.target.value); setStep(0); }} style={{ width: 340 }} /></label>
        <label className="field"><span>Pattern P</span><input className="mono" value={p} onChange={(e) => { setP(e.target.value); setStep(0); }} style={{ width: 140 }} /></label>
        <label className="small"><input type="checkbox" checked={bc} onChange={(e) => { setBc(e.target.checked); setStep(0); }} /> bad character</label>
        <label className="small"><input type="checkbox" checked={gs} onChange={(e) => { setGs(e.target.checked); setStep(0); }} /> good suffix</label>
      </div>
      <div className="row small">
        Presets:
        {Object.entries(P).map(([k, v]) => <button key={k} className="btn small" onClick={() => { setT(v[0]); setP(v[1]); setStep(0); }}>{k === 'mid' ? 'Mid exam' : k === 'slide' ? 'Slide example' : 'word'}</button>)}
      </div>
      <Stepper step={step} max={res.steps.length - 1} setStep={setStep} label={`(alignment ${step + 1} of ${res.steps.length}, at offset ${s.pos})`} />
      <div className="scroll-x">
        <svg viewBox={`0 0 ${Math.max(T.length * cell + 60, 300)} 96`} style={{ width: Math.max(T.length * cell + 60, 300), maxWidth: '100%', height: 'auto' }}>
          <text x={0} y={30} fontSize="13" fontWeight="700">T:</text>
          <text x={0} y={70} fontSize="13" fontWeight="700">P:</text>
          {T.split('').map((c, i) => (
            <g key={i} transform={`translate(${30 + i * cell},0)`}>
              <text x={cell / 2} y={12} fontSize="9" textAnchor="middle" className="dim">{i}</text>
              <rect x={1} y={16} width={cell - 2} height={22} rx={4} fill={i >= s.pos && i < s.pos + Pp.length ? 'var(--accent-soft)' : 'transparent'} />
              <text x={cell / 2} y={32} fontSize="14" textAnchor="middle" fontFamily="var(--mono)">{c}</text>
            </g>
          ))}
          {Pp.split('').map((c, j) => {
            const compared = s.compared.includes(j);
            const mism = s.mismatchAt === j;
            return (
              <g key={j} transform={`translate(${30 + (s.pos + j) * cell},0)`}>
                <rect x={1} y={56} width={cell - 2} height={22} rx={4} fill={mism ? 'rgba(209,67,91,0.35)' : compared ? 'rgba(26,156,91,0.3)' : 'var(--bg-sunk)'} />
                <text x={cell / 2} y={72} fontSize="14" textAnchor="middle" fontFamily="var(--mono)">{c}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="callout cs small">
        {s.mismatchAt === null ? (
          <>✅ <b>Full match at offset {s.pos}.</b> Shift by the match rule: |P| − l′(2) = <b>{s.gs || 1}</b>.</>
        ) : (
          <>
            Compared right→left: {s.compared.length} character{s.compared.length > 1 ? 's' : ''}; mismatch at P[{s.mismatchAt}] = <b>{Pp[s.mismatchAt]}</b> vs T[{s.pos + s.mismatchAt}] = <b>{T[s.pos + s.mismatchAt]}</b>.<br />
            Bad character rule → shift <b>{s.bc}</b> {bc && (s.bc > 1 ? `(skip ${s.bc - 1} alignment${s.bc > 2 ? 's' : ''}: slide P until a ${T[s.pos + s.mismatchAt]} in P lines up, or past it)` : '(no skip)')}<br />
            Good suffix rule → shift <b>{s.gs}</b> {gs && s.mismatchAt === Pp.length - 1 ? '(no suffix matched yet)' : gs ? `(matched suffix "${Pp.slice(s.mismatchAt + 1)}")` : ''}<br />
            Take the max: <b>shift {s.shift}</b>.
          </>
        )}
      </div>
      <div className="grid cols-4">
        <div className="stat"><b>{res.alignments}</b><span>alignments tried (BM)</span></div>
        <div className="stat"><b>{naive.alignments}</b><span>alignments tried (naive)</span></div>
        <div className="stat"><b>{res.comparisons}</b><span>character comparisons (BM)</span></div>
        <div className="stat"><b>{naive.comparisons}</b><span>character comparisons (naive, with early exit)</span></div>
      </div>
      <p className="small">Comparisons up to this step: {cmpBefore + s.compared.length}. Occurrences: <b>{res.occurrences.join(', ') || 'none'}</b>. Boyer-Moore skipped {naive.alignments - res.alignments} of {naive.alignments} alignments ({(((naive.alignments - res.alignments) / naive.alignments) * 100).toFixed(0)}%).</p>
      <details>
        <summary className="small">Preprocessing tables for P = {Pp}</summary>
        <div className="small">Bad-character table (shift if the mismatch is at offset i against character c):</div>
        <Matrix rows={pre.alphabet} cols={Pp.split('').map((c, i) => `${i}:${c}`)} data={pre.alphabet.map((c) => Pp.split('').map((_, i) => pre.badCharacterShift(i, c)))} />
        <div className="small" style={{ marginTop: 6 }}>Good-suffix shift if the mismatch is at offset i: {Pp.split('').map((_, i) => `i=${i}: ${pre.goodSuffixShift(i)}`).join(' · ')}; after a full match: {pre.matchShift()}</div>
      </details>
    </Widget>
  );
}

export function KmerIndexViz() {
  const [t, setT] = useState('CGTGCGTGCTTCGTGCGTGCTT');
  const [p, setP] = useState('GCGTGCTT');
  const [k, setK] = useState(5);
  const [every, setEvery] = useState(1);
  const T = t.toUpperCase();
  const Pp = p.toUpperCase();
  const idx = useMemo(() => kmerIndex(T, k, every), [T, k, every]);
  const q = Pp.length >= k ? queryIndex(Pp, T, k, idx, every) : null;
  const entries = [...idx.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return (
    <Widget title="k-mer index: build, query, subsample" icon="🗂️">
      <div className="row">
        <label className="field"><span>Genome T</span><input className="mono" value={t} onChange={(e) => setT(e.target.value)} style={{ width: 260 }} /></label>
        <label className="field"><span>Read P</span><input className="mono" value={p} onChange={(e) => setP(e.target.value)} style={{ width: 140 }} /></label>
        <Slider label="k" min={2} max={8} value={k} onChange={setK} />
        <Slider label="index every n-th offset" min={1} max={4} value={every} onChange={setEvery} />
      </div>
      <div className="grid cols-2" style={{ marginTop: 8 }}>
        <div>
          <b className="small">Index ({entries.length} keys, {entries.reduce((a, [, v]) => a + v.length, 0)} entries)</b>
          <div className="scroll-x" style={{ maxHeight: 240, overflowY: 'auto' }}>
            <table className="mtable">
              <thead><tr><th>k-mer</th><th>offsets</th></tr></thead>
              <tbody>{entries.map(([km, offs]) => <tr key={km}><td>{km}</td><td>{offs.join(', ')}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="small">
          {q ? (
            <>
              <p>Query {every > 1 ? `the first ${Math.min(every, Pp.length - k + 1)} k-mers of P (one per phase, ${every === 2 ? 'even and odd' : `0..${every - 1} mod ${every}`})` : 'the first k-mer of P'} → <b>{q.indexHits}</b> index hit(s), <b>{q.verifications}</b> verification(s) against T.</p>
              <p>Matches of P in T: <b className="mono">{q.occurrences.join(', ') || 'none'}</b></p>
              <p className="muted">
                Indexing every {every === 1 ? 'offset' : `${every}${every === 2 ? 'nd' : every === 3 ? 'rd' : 'th'} offset`} stores ~1/{every} of the entries. The price is that queries must try {every} different k-mers of P so that at least one lands on an indexed offset. The index is smaller, but each query does more lookups and more verification work.
              </p>
            </>
          ) : (
            <p>P must be at least k long.</p>
          )}
        </div>
      </div>
    </Widget>
  );
}

export function PigeonholeViz() {
  const [t, setT] = useState('GGAAAAAGAGGTAGCGGCGTTTAACAGTAGGCGTAGCGGCGTTTAA');
  const [p, setP] = useState('GTAACGGCG');
  const [n, setN] = useState(1);
  const P = p.toUpperCase();
  const T = t.toUpperCase();
  const r = useMemo(() => pigeonholeHamming(P, T, n), [P, T, n]);
  return (
    <Widget title="Pigeonhole principle for approximate matching" icon="🕊️">
      <div className="row">
        <label className="field"><span>Text</span><input className="mono" value={t} onChange={(e) => setT(e.target.value)} style={{ width: 340 }} /></label>
        <label className="field"><span>Pattern</span><input className="mono" value={p} onChange={(e) => setP(e.target.value)} style={{ width: 130 }} /></label>
        <Slider label="max mismatches (k)" min={0} max={3} value={n} onChange={setN} />
      </div>
      <p className="small">Split P into k + 1 = {n + 1} pieces. If P matches with ≤ {n} mismatch{n === 1 ? '' : 'es'}, at least one piece must match <b>exactly</b>. Find the pieces exactly (fast, with an index or Boyer-Moore), then verify the rest of P around each hit.</p>
      <div className="col">
        {r.partitions.map((pt, i) => (
          <div key={i} className="small">
            piece {i + 1}: <span className="mono hl2">{P.slice(pt.start, pt.end)}</span> → exact hits at {pt.hits.join(', ') || 'none'}
          </div>
        ))}
      </div>
      <p>Verified approximate matches (Hamming ≤ {n}): <b className="mono">{r.occurrences.join(', ') || 'none'}</b></p>
    </Widget>
  );
}

export function EditDistanceViz() {
  const [a, setA] = useState('GCGTATGCGGCTAACGC');
  const [b, setB] = useState('GCTATGCGGCTATACGC');
  const A = a.toUpperCase().slice(0, 20);
  const B = b.toUpperCase().slice(0, 20);
  const { distance, D } = editDistance(A, B);
  return (
    <Widget title="Edit (Levenshtein) distance by dynamic programming" icon="✏️">
      <div className="row">
        <input className="mono" value={a} onChange={(e) => setA(e.target.value)} aria-label="X" />
        <input className="mono" value={b} onChange={(e) => setB(e.target.value)} aria-label="Y" />
        <span className="pill accent">edit distance = {distance}</span>
      </div>
      <p className="small muted">D[i][j] = min(D[i−1][j] + 1, D[i][j−1] + 1, D[i−1][j−1] + [x<sub>i</sub> ≠ y<sub>j</sub>]). Hamming distance only allows substitutions. Edit distance also allows insertions and deletions, which sequencing errors and indels produce.</p>
      <Matrix rows={['ε', ...A.split('')]} cols={['ε', ...B.split('')]} data={D} cellClass={(i, j) => (i === A.length && j === B.length ? 'best' : '')} />
    </Widget>
  );
}
