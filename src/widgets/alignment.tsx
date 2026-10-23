import { useMemo, useState } from 'react';
import { BLOSUM62, affineGapCost, align, allOptimalAlignments, gotohScore } from '../lib/bio/alignment';
import { LineChart, NumField, Slider, Stepper, Widget } from './ui';

export function AlignmentDP({ preset = 'final' }: { preset?: string }) {
  const PRE: Record<string, { x: string; y: string; m: number; mm: number; g: number; mode: 'global' | 'local' }> = {
    final: { x: 'ACCGTGC', y: 'ACGTC', m: 2, mm: -1, g: -2, mode: 'global' },
    finalLocal: { x: 'ACCGTGC', y: 'ACGTC', m: 2, mm: -1, g: -2, mode: 'local' },
    slide: { x: 'AGC', y: 'AAG', m: 2, mm: -5, g: -5, mode: 'local' },
    protein: { x: 'HEAGAWGHEE', y: 'PAWHEAE', m: 0, mm: 0, g: -8, mode: 'local' },
  };
  const init = PRE[preset] ?? PRE.final;
  const [x, setX] = useState(init.x);
  const [y, setY] = useState(init.y);
  const [match, setMatch] = useState(init.m);
  const [mismatch, setMismatch] = useState(init.mm);
  const [gap, setGap] = useState(init.g);
  const [mode, setMode] = useState<'global' | 'local'>(init.mode);
  const [blosum, setBlosum] = useState(preset === 'protein');
  const X = x.toUpperCase().slice(0, 14);
  const Y = y.toUpperCase().slice(0, 14);
  const sc = useMemo(
    () => ({ match, mismatch, gap, sub: blosum ? (a: string, b: string) => BLOSUM62[a]?.[b] ?? -4 : undefined }),
    [match, mismatch, gap, blosum],
  );
  const r = useMemo(() => align(X, Y, sc, mode), [X, Y, sc, mode]);
  const all = useMemo(() => allOptimalAlignments(r, X, Y, 8), [r, X, Y]);
  const total = X.length * Y.length;
  const [step, setStep] = useState(total + 1);
  const filled = (i: number, j: number) => i === 0 || j === 0 || (i - 1) * Y.length + j <= step;
  const showPath = step > total;
  const onPath = new Set(showPath ? r.path.map(([i, j]) => `${i},${j}`) : []);
  const cur = step >= 1 && step <= total ? [Math.floor((step - 1) / Y.length) + 1, ((step - 1) % Y.length) + 1] : null;
  const s = (a: string, b: string) => (sc.sub ? sc.sub(a, b) : a === b ? match : mismatch);
  return (
    <Widget title="Needleman-Wunsch / Smith-Waterman DP table" icon="🧮">
      <div className="row">
        <label className="field"><span>Sequence x (rows)</span><input className="mono" value={x} onChange={(e) => { setX(e.target.value); setStep(999); }} style={{ width: 150 }} /></label>
        <label className="field"><span>Sequence y (columns)</span><input className="mono" value={y} onChange={(e) => { setY(e.target.value); setStep(999); }} style={{ width: 150 }} /></label>
        <label className="field"><span>Mode</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as 'global' | 'local')}>
            <option value="global">Global (Needleman-Wunsch)</option>
            <option value="local">Local (Smith-Waterman)</option>
          </select>
        </label>
        {!blosum && <NumField label="match" value={match} onChange={setMatch} width={60} />}
        {!blosum && <NumField label="mismatch" value={mismatch} onChange={setMismatch} width={60} />}
        <NumField label="gap d" value={gap} onChange={setGap} width={60} />
        <label className="small"><input type="checkbox" checked={blosum} onChange={(e) => setBlosum(e.target.checked)} /> BLOSUM62 (proteins)</label>
      </div>
      <div className="row small">
        Presets:
        <button className="btn small" onClick={() => { const p = PRE.final; setX(p.x); setY(p.y); setMatch(p.m); setMismatch(p.mm); setGap(p.g); setMode('global'); setBlosum(false); setStep(999); }}>Final Q1(a) global</button>
        <button className="btn small" onClick={() => { const p = PRE.final; setX(p.x); setY(p.y); setMatch(p.m); setMismatch(p.mm); setGap(p.g); setMode('local'); setBlosum(false); setStep(999); }}>Final Q1(b) local</button>
        <button className="btn small" onClick={() => { const p = PRE.protein; setX(p.x); setY(p.y); setGap(-8); setMode('local'); setBlosum(true); setStep(999); }}>Protein example (BLOSUM62)</button>
      </div>
      <Stepper step={Math.min(step, total + 1)} max={total + 1} setStep={(v) => setStep(typeof v === 'function' ? v(Math.min(step, total + 1)) : v)} speed={350} label={step > total ? '(traceback shown)' : '(filling cells row by row)'} />
      <div className="grid cols-2">
        <div className="scroll-x">
          <table className="mtable">
            <thead>
              <tr><th /><th>ε</th>{Y.split('').map((c, j) => <th key={j}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {r.F.map((row, i) => (
                <tr key={i}>
                  <th>{i === 0 ? 'ε' : X[i - 1]}</th>
                  {row.map((v, j) => {
                    const isCur = cur && cur[0] === i && cur[1] === j;
                    const isBest = mode === 'local' && showPath && r.end[0] === i && r.end[1] === j;
                    const arrows = r.ptr[i][j].map((d) => (d === 'diag' ? '↖' : d === 'up' ? '↑' : '←')).join('');
                    return (
                      <td key={j} className={`${isCur ? 'cur' : ''} ${onPath.has(`${i},${j}`) ? 'path' : ''} ${isBest ? 'best' : ''}`} title={arrows}>
                        {filled(i, j) ? (
                          <>
                            <span className="tiny muted" style={{ display: 'block', lineHeight: 1 }}>{arrows || ' '}</span>
                            {v}
                          </>
                        ) : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="small">
          {cur ? (
            <div className="callout cs">
              <b>F({cur[0]}, {cur[1]})</b>: x<sub>{cur[0]}</sub> = {X[cur[0] - 1]}, y<sub>{cur[1]}</sub> = {Y[cur[1] - 1]}<br />
              ↖ diagonal: F({cur[0] - 1},{cur[1] - 1}) + s({X[cur[0] - 1]},{Y[cur[1] - 1]}) = {r.F[cur[0] - 1][cur[1] - 1]} + ({s(X[cur[0] - 1], Y[cur[1] - 1])}) = {r.F[cur[0] - 1][cur[1] - 1] + s(X[cur[0] - 1], Y[cur[1] - 1])}<br />
              ↑ up (gap in y): F({cur[0] - 1},{cur[1]}) + d = {r.F[cur[0] - 1][cur[1]]} + ({gap}) = {r.F[cur[0] - 1][cur[1]] + gap}<br />
              ← left (gap in x): F({cur[0]},{cur[1] - 1}) + d = {r.F[cur[0]][cur[1] - 1]} + ({gap}) = {r.F[cur[0]][cur[1] - 1] + gap}<br />
              {mode === 'local' && <>0 (start fresh)<br /></>}
              max → <b>{r.F[cur[0]][cur[1]]}</b>
            </div>
          ) : (
            <>
              <p>
                <b>{mode === 'global' ? 'Global' : 'Local'} score = {r.score}</b>{' '}
                {mode === 'global' ? `(bottom-right cell F(${X.length},${Y.length}))` : `(maximum cell, at (${r.end[0]},${r.end[1]}); traceback stops at a 0)`}
              </p>
              <p>Co-optimal alignments ({all.length}{all.length === 8 ? '+' : ''}):</p>
              {all.map(([a, b], i) => (
                <pre key={i} style={{ margin: '4px 0' }}>{a}{'\n'}{a.split('').map((c, k) => (c === b[k] ? '|' : c === '-' || b[k] === '-' ? ' ' : '.')).join('')}{'\n'}{b}</pre>
              ))}
            </>
          )}
        </div>
      </div>
      <p className="small muted">Arrows above each value record which neighbor(s) gave the maximum, and ties produce several arrows (hence several optimal alignments). Time and space are O(mn). Global: first row and column are multiples of d. Local: they are 0, negative cells are reset to 0, and traceback starts from the highest cell.</p>
    </Widget>
  );
}

export function AffineGap() {
  const [open, setOpen] = useState(-5);
  const [ext, setExt] = useState(-1);
  const [lin, setLin] = useState(-2);
  const Ls = Array.from({ length: 13 }, (_, i) => i);
  const [x, setX] = useState('ACGTTTTTACGT');
  const [y, setY] = useState('ACGTACGT');
  return (
    <Widget title="Linear vs affine gap penalties" icon="〰️">
      <div className="row">
        <Slider label="gap open (affine)" min={-12} max={0} value={open} onChange={setOpen} />
        <Slider label="gap extend (affine)" min={-5} max={0} value={ext} onChange={setExt} />
        <Slider label="linear gap d" min={-6} max={0} value={lin} onChange={setLin} />
      </div>
      <LineChart xs={Ls} series={[{ name: 'linear: L·d', values: Ls.map((L) => L * lin) }, { name: 'affine: open + (L−1)·extend', values: Ls.map((L) => affineGapCost(L, open, ext)) }]} xLabel="gap length L" yLabel="penalty" height={190} />
      <p className="small">A gap of length 4 costs {4 * lin} (linear) vs <b>{affineGapCost(4, open, ext)}</b> (affine). One long gap (a single indel event, such as an intron or domain insertion) is biologically more likely than many scattered gaps, and affine penalties reflect that.</p>
      <div className="row">
        <input className="mono" value={x} onChange={(e) => setX(e.target.value.toUpperCase())} aria-label="x" />
        <input className="mono" value={y} onChange={(e) => setY(e.target.value.toUpperCase())} aria-label="y" />
        <span className="pill accent">Gotoh global score (match +2, mismatch −1, affine gaps) = {gotohScore(x, y, 2, -1, open, ext)}</span>
      </div>
      <p className="small muted">Affine alignment needs three DP matrices (Gotoh 1982): M (last column is a match/mismatch), X (gap in y) and Y (gap in x). Opening a gap moves M→X/Y and costs “open”; staying in X or Y costs “extend”. This is exactly the 3-state diagram on the slides, and it is also a pair HMM.</p>
    </Widget>
  );
}

export function BlastSeed() {
  const [query, setQuery] = useState('GCTAGCTTACG');
  const [db, setDb] = useState('TTGACCTAGCTTACGGATCCATGCTAGCATTACGAT');
  const [w, setW] = useState(4);
  const Q = query.toUpperCase();
  const D = db.toUpperCase();
  const seeds: { q: number; d: number; word: string }[] = [];
  const index = new Map<string, number[]>();
  for (let i = 0; i + w <= D.length; i++) {
    const k = D.substr(i, w);
    if (!index.has(k)) index.set(k, []);
    index.get(k)!.push(i);
  }
  for (let i = 0; i + w <= Q.length; i++) for (const d of index.get(Q.substr(i, w)) ?? []) seeds.push({ q: i, d, word: Q.substr(i, w) });
  const extend = (sd: { q: number; d: number }) => {
    // ungapped X-drop extension, +1/-2 scoring
    let best = w;
    let score = w;
    let l = 0;
    let r = 0;
    let bl = 0;
    let br = 0;
    while (sd.q - l - 1 >= 0 && sd.d - l - 1 >= 0) {
      l++;
      score += Q[sd.q - l] === D[sd.d - l] ? 1 : -2;
      if (score > best) { best = score; bl = l; }
      if (best - score > 3) break;
    }
    score = best;
    while (sd.q + w + r < Q.length && sd.d + w + r < D.length) {
      r++;
      score += Q[sd.q + w - 1 + r] === D[sd.d + w - 1 + r] ? 1 : -2;
      if (score > best) { best = score; br = r; }
      if (best - score > 3) break;
    }
    return { best, qs: sd.q - bl, ds: sd.d - bl, len: w + bl + br };
  };
  const hsps = seeds.map((s) => ({ ...s, ...extend(s) })).sort((a, b) => b.best - a.best);
  return (
    <Widget title="BLAST idea: seed → extend → score" icon="⚡">
      <div className="row">
        <label className="field"><span>Query</span><input className="mono" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <label className="field"><span>Database</span><input className="mono" value={db} onChange={(e) => setDb(e.target.value)} style={{ width: 340 }} /></label>
        <Slider label="word size w" min={3} max={8} value={w} onChange={setW} />
      </div>
      <p className="small">{seeds.length} exact seed hit(s) of length {w}. Each is extended left and right without gaps until the score drops too far (X-drop). Only the best high-scoring segment pairs (HSPs) are reported.</p>
      <table className="mtable">
        <thead><tr><th>seed</th><th>query pos</th><th>db pos</th><th>HSP</th><th>score</th></tr></thead>
        <tbody>
          {hsps.slice(0, 6).map((h, i) => (
            <tr key={i}><td>{h.word}</td><td>{h.q}</td><td>{h.d}</td><td>{Q.substr(h.qs, h.len)} / {D.substr(h.ds, h.len)}</td><td>{h.best}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="small muted">Real BLAST also uses neighborhood words (similar words scoring above a threshold T, for proteins), the two-hit method, gapped extension and E-values. It is a <b>heuristic</b>: very fast, but it can miss optimal alignments that Smith-Waterman would find.</p>
    </Widget>
  );
}
