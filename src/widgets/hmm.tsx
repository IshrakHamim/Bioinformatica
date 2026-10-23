import { useMemo, useState } from 'react';
import { CASINO_HMM, GC_HMM, forward, posterior, sampleHMM, viterbi, type HMM } from '../lib/bio/hmm';
import { mulberry32 } from '../lib/bio/rng';
import { LineChart, Slider, Stepper, Widget, fmt } from './ui';

function HMMDiagram({ h }: { h: HMM }) {
  const [a, b] = h.states;
  return (
    <svg viewBox="0 0 420 150" style={{ width: '100%', maxWidth: 420, height: 'auto' }}>
      <defs>
        <marker id="hmmArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--text-dim)" /></marker>
      </defs>
      <circle cx={110} cy={85} r={32} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
      <circle cx={310} cy={85} r={32} fill="var(--bg-sunk)" stroke="var(--accent-2)" strokeWidth={2} />
      <text x={110} y={90} textAnchor="middle" fontWeight="800">{a}</text>
      <text x={310} y={90} textAnchor="middle" fontWeight="800">{b}</text>
      <path d="M 142 75 Q 210 40 278 75" fill="none" stroke="var(--text-dim)" markerEnd="url(#hmmArrow)" />
      <path d="M 278 97 Q 210 130 142 97" fill="none" stroke="var(--text-dim)" markerEnd="url(#hmmArrow)" />
      <text x={210} y={50} textAnchor="middle" fontSize="12">{fmt(h.trans[0][1], 2)}</text>
      <text x={210} y={130} textAnchor="middle" fontSize="12">{fmt(h.trans[1][0], 2)}</text>
      <path d="M 92 58 C 70 10, 150 10, 128 58" fill="none" stroke="var(--text-dim)" markerEnd="url(#hmmArrow)" />
      <path d="M 292 58 C 270 10, 350 10, 328 58" fill="none" stroke="var(--text-dim)" markerEnd="url(#hmmArrow)" />
      <text x={110} y={14} textAnchor="middle" fontSize="12">{fmt(h.trans[0][0], 2)}</text>
      <text x={310} y={14} textAnchor="middle" fontSize="12">{fmt(h.trans[1][1], 2)}</text>
      <text x={10} y={145} fontSize="11" className="dim">{a}: {h.symbols.map((s, i) => `${s}=${h.emit[0][i]}`).join(' ')}</text>
      <text x={230} y={145} fontSize="11" className="dim">{b}: {h.symbols.map((s, i) => `${s}=${h.emit[1][i]}`).join(' ')}</text>
    </svg>
  );
}

export function ViterbiTable() {
  const [seq, setSeq] = useState('GGCACTGAA');
  const [useLog, setUseLog] = useState(true);
  const [algo, setAlgo] = useState<'viterbi' | 'forward'>('viterbi');
  const x = seq.toUpperCase().replace(/[^ACGT]/g, '').slice(0, 16);
  const v = useMemo(() => (x ? viterbi(GC_HMM, x, useLog) : null), [x, useLog]);
  const f = useMemo(() => (x ? forward(GC_HMM, x) : null), [x]);
  const [step, setStep] = useState(99);
  const shown = Math.min(step, x.length);
  if (!v || !f) return null;
  const onPath = (k: number, t: number) => step > x.length && algo === 'viterbi' && v.pathIdx[t] === k;
  return (
    <Widget title="Viterbi & Forward on the GC-content HMM (course handout)" icon="🎰">
      <div className="grid cols-2">
        <HMMDiagram h={GC_HMM} />
        <div className="col">
          <label className="field"><span>Observed DNA x</span><input className="mono" value={seq} onChange={(e) => { setSeq(e.target.value); setStep(99); }} /></label>
          <div className="row">
            <select value={algo} onChange={(e) => setAlgo(e.target.value as typeof algo)}>
              <option value="viterbi">Viterbi (max → best path)</option>
              <option value="forward">Forward (sum → P(x))</option>
            </select>
            {algo === 'viterbi' && <label className="small"><input type="checkbox" checked={useLog} onChange={(e) => setUseLog(e.target.checked)} /> log₂ space</label>}
          </div>
          <div className="row small">
            <button className="btn small" onClick={() => setSeq('GGCACTGAA')}>Handout: GGCACTGAA</button>
            <button className="btn small" onClick={() => setSeq('GGCA')}>Forward example: GGCA</button>
          </div>
        </div>
      </div>
      <Stepper step={Math.min(step, x.length + 1)} max={x.length + 1} setStep={(s) => setStep(typeof s === 'function' ? s(Math.min(step, x.length + 1)) : s)} label="columns filled (last step = traceback)" />
      <div className="scroll-x">
        <table className="mtable">
          <thead>
            <tr><th>state \ t</th>{x.split('').map((c, t) => <th key={t}>{t + 1}: {c}</th>)}</tr>
          </thead>
          <tbody>
            {GC_HMM.states.map((s, k) => (
              <tr key={s}>
                <th>{s}</th>
                {x.split('').map((_, t) => (
                  <td key={t} className={onPath(k, t) ? 'path' : ''}>
                    {t < shown ? (
                      algo === 'viterbi' ? (
                        <>
                          {useLog ? v.V[k][t].toFixed(3) : v.V[k][t].toExponential(2)}
                          {t > 0 && <span className="tiny muted" style={{ display: 'block' }}>from {GC_HMM.states[v.back[k][t]]}</span>}
                        </>
                      ) : (
                        f.F[k][t].toExponential(3)
                      )
                    ) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {algo === 'viterbi' ? (
        <p className="small">
          {step > x.length ? (
            <>Traceback → most probable path <b className="mono">{v.path}</b>, {useLog ? <>log₂ P = {v.best.toFixed(2)} → P = 2^{v.best.toFixed(2)} = {Math.pow(2, v.best).toExponential(3)}</> : <>P = {v.best.toExponential(3)}</>}</>
          ) : (
            <>Recurrence: V<sub>l</sub>(t) = e<sub>l</sub>(x<sub>t</sub>) · max<sub>k</sub> V<sub>k</sub>(t−1)·a<sub>kl</sub>{useLog && ' (in log space: sums instead of products)'}. Each cell remembers which previous state won (backpointer).</>
          )}
        </p>
      ) : (
        <p className="small">Forward: f<sub>l</sub>(t) = e<sub>l</sub>(x<sub>t</sub>) · Σ<sub>k</sub> f<sub>k</sub>(t−1)·a<sub>kl</sub>. Summing the last column gives P(x) = <b>{f.total.toPrecision(5)}</b>. A random (uniform 0.25) model gives 0.25^{x.length} = {Math.pow(0.25, x.length).toPrecision(5)}.</p>
      )}
      <p className="small muted">Complexity for n symbols and K states: time O(nK²) (each of the nK cells looks at K predecessors), space O(nK) for the table and backpointers. In log space, products become sums, which avoids numerical underflow on long sequences.</p>
    </Widget>
  );
}

export function CasinoDecoder() {
  const [n, setN] = useState(80);
  const [stay, setStay] = useState(0.9);
  const [pHead, setPHead] = useState(0.75);
  const [seed, setSeed] = useState(2);
  const h: HMM = useMemo(() => ({ ...CASINO_HMM, trans: [[stay, 1 - stay], [1 - stay, stay]], emit: [[0.5, 0.5], [pHead, 1 - pHead]] }), [stay, pHead]);
  const sample = useMemo(() => sampleHMM(h, n, mulberry32(seed)), [h, n, seed]);
  const vit = useMemo(() => viterbi(h, sample.obs), [h, sample.obs]);
  const post = useMemo(() => posterior(h, sample.obs), [h, sample.obs]);
  const acc = vit.path.split('').filter((c, i) => c === sample.states[i]).length / n;
  return (
    <Widget title="The dishonest casino: decode hidden coins" icon="🪙">
      <div className="row">
        <Slider label="P(stay with same coin)" min={0.5} max={0.99} step={0.01} value={stay} onChange={setStay} />
        <Slider label="P(heads | biased)" min={0.5} max={0.95} step={0.01} value={pHead} onChange={setPHead} />
        <Slider label="flips" min={20} max={200} step={10} value={n} onChange={setN} />
        <button className="btn small" onClick={() => setSeed((s) => s + 1)}>Flip again</button>
      </div>
      <div className="scroll-x" style={{ marginTop: 8 }}>
        <div className="mono small" style={{ whiteSpace: 'nowrap', lineHeight: 1.8 }}>
          <div><span className="pill">flips   </span> {sample.obs.split('').map((c, i) => <span key={i} style={{ color: c === 'H' ? 'var(--g)' : 'var(--c)' }}>{c}</span>)}</div>
          <div><span className="pill">truth   </span> {sample.states.split('').map((c, i) => <span key={i} style={{ background: c === 'B' ? 'rgba(209,67,91,0.3)' : undefined }}>{c}</span>)}</div>
          <div><span className="pill">Viterbi </span> {vit.path.split('').map((c, i) => <span key={i} style={{ background: c === 'B' ? 'rgba(209,67,91,0.3)' : undefined, textDecoration: c !== sample.states[i] ? 'underline wavy var(--danger)' : undefined }}>{c}</span>)}</div>
        </div>
      </div>
      <LineChart series={[{ name: 'P(biased at t | all flips)', values: post[1] }, { name: 'truth (1 = biased)', values: sample.states.split('').map((c) => (c === 'B' ? 1 : 0)), color: 'var(--danger)' }]} height={170} xLabel="flip t" yLabel="probability" />
      <p className="small">Viterbi accuracy: <b>{(acc * 100).toFixed(0)}%</b>. Viterbi gives one best <i>path</i>. Forward-backward gives the <i>posterior</i> probability of each state at each position (the curve). As P(stay) → 0.5, switching is cheap, so the decoder trusts emissions alone and gets noisy. With flat emissions (P(H|B) = 0.5) the coins become indistinguishable and the path depends only on the transitions.</p>
    </Widget>
  );
}
