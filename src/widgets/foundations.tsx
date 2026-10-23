import { useMemo, useState } from 'react';
import { AA_NAMES, CODON_TABLE, cleanDna, complement, gcContent, reverseComplement, transcribe, translate } from '../lib/bio/strings';
import { columnEntropy } from '../lib/bio/motifs';
import { kl } from '../lib/bio/dimred';
import { Bars, Seq, Slider, Widget, fmt } from './ui';

export function DnaBuilder() {
  const [s, setS] = useState('ATGCGTACCGGATTA');
  const dna = cleanDna(s).slice(0, 60);
  const comp = complement(dna);
  const hb = dna.split('').reduce((t, c) => t + (c === 'G' || c === 'C' ? 3 : 2), 0);
  return (
    <Widget title="Double-helix builder" icon="🧬">
      <div className="row">
        <input className="mono" value={s} onChange={(e) => setS(e.target.value)} style={{ flex: 1, minWidth: 220 }} aria-label="DNA sequence" />
        {['A', 'C', 'G', 'T'].map((b) => (
          <button key={b} className={`btn small nt-${b}`} onClick={() => setS((x) => x + b)}>+{b}</button>
        ))}
        <button className="btn small" onClick={() => setS(Array.from({ length: 15 }, () => 'ACGT'[Math.floor(Math.random() * 4)]).join(''))}>Random</button>
      </div>
      <div className="scroll-x" style={{ marginTop: 12 }}>
        <div className="seq" style={{ whiteSpace: 'nowrap' }}>
          <div><span className="muted">5′ </span><Seq s={dna} /><span className="muted"> 3′</span>  <span className="tiny muted">(top strand)</span></div>
          <div><span className="muted">   </span>{dna.split('').map((c, i) => <span key={i} className="muted">{c === 'G' || c === 'C' ? '┇' : '│'}</span>)}</div>
          <div><span className="muted">3′ </span><Seq s={comp} /><span className="muted"> 5′</span>  <span className="tiny muted">(bottom strand)</span></div>
        </div>
      </div>
      <div className="grid cols-4" style={{ marginTop: 12 }}>
        <div className="stat"><b>{dna.length}</b><span>base pairs</span></div>
        <div className="stat"><b>{(gcContent(dna) * 100).toFixed(1)}%</b><span>GC content</span></div>
        <div className="stat"><b>{hb}</b><span>hydrogen bonds (A–T: 2, G–C: 3)</span></div>
        <div className="stat"><b className="seq" style={{ fontSize: '0.95rem' }}>{reverseComplement(dna)}</b><span>reverse complement (read bottom strand 5′→3′)</span></div>
      </div>
      <p className="small muted">
        ┇ marks a G–C pair (three hydrogen bonds), │ an A–T pair (two). GC-rich DNA is harder to melt apart, which is one reason replication origins tend to be AT-rich: they are easier to unwind.
      </p>
    </Widget>
  );
}

export function CentralDogma() {
  const [s, setS] = useState('ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG');
  const [frame, setFrame] = useState(0);
  const dna = cleanDna(s);
  const rna = transcribe(dna.slice(frame));
  const protein = translate(rna);
  const codons = rna.match(/.{1,3}/g) ?? [];
  const [hover, setHover] = useState<number | null>(null);
  return (
    <Widget title="Central dogma: DNA → mRNA → protein" icon="🏭">
      <div className="row">
        <input className="mono" value={s} onChange={(e) => setS(e.target.value)} style={{ flex: 1, minWidth: 220 }} aria-label="Coding strand DNA" />
        <label className="small">Reading frame{' '}
          <select value={frame} onChange={(e) => setFrame(Number(e.target.value))}>
            <option value={0}>+1</option>
            <option value={1}>+2</option>
            <option value={2}>+3</option>
          </select>
        </label>
      </div>
      <div className="col" style={{ marginTop: 12 }}>
        <div><span className="pill">DNA (coding strand)</span> <Seq s={dna} /></div>
        <div><span className="pill">mRNA (T→U)</span>{' '}
          <span className="seq">
            {codons.map((c, i) => (
              <span key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ marginRight: 6, padding: '1px 2px', borderRadius: 4, background: hover === i ? 'var(--accent-soft)' : undefined, cursor: 'default' }}>
                <Seq s={c} />
              </span>
            ))}
          </span>
        </div>
        <div><span className="pill">Protein</span>{' '}
          <span className="seq">
            {protein.split('').map((a, i) => (
              <span key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} title={AA_NAMES[a]} style={{ display: 'inline-block', width: '2.6em', textAlign: 'center', marginRight: 6, borderRadius: 4, fontWeight: 700, color: a === '*' ? 'var(--danger)' : a === 'M' ? 'var(--ok)' : undefined, background: hover === i ? 'var(--accent-soft)' : undefined }}>
                {a}
              </span>
            ))}
          </span>
        </div>
        {hover !== null && codons[hover]?.length === 3 && (
          <div className="small">
            Codon <b className="mono">{codons[hover]}</b> → <b>{AA_NAMES[CODON_TABLE[codons[hover]]]}</b> ({CODON_TABLE[codons[hover]]})
          </div>
        )}
      </div>
      <details style={{ marginTop: 10 }}>
        <summary className="small">Show the full genetic code (64 codons)</summary>
        <CodonGrid />
      </details>
      <p className="small muted">
        Try reading frames +2 and +3: the same DNA gives a completely different protein. <b>AUG</b> (Met, green) starts translation; <b>UAA, UAG, UGA</b> (red *) stop it.
      </p>
    </Widget>
  );
}

function CodonGrid() {
  const b = 'UCAG';
  return (
    <div className="scroll-x">
      <table className="mtable" style={{ marginTop: 8 }}>
        <thead>
          <tr><th>1st ↓ / 2nd →</th>{b.split('').map((x) => <th key={x}>{x}</th>)}</tr>
        </thead>
        <tbody>
          {b.split('').map((f) => (
            <tr key={f}>
              <th>{f}</th>
              {b.split('').map((s2) => (
                <td key={s2} style={{ textAlign: 'left' }}>
                  {b.split('').map((t) => {
                    const c = f + s2 + t;
                    const aa = CODON_TABLE[c];
                    return (
                      <div key={t} style={{ color: aa === '*' ? 'var(--danger)' : aa === 'M' ? 'var(--ok)' : undefined }}>
                        {c} {aa} <span className="tiny muted">{AA_NAMES[aa]}</span>
                      </div>
                    );
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EntropyWidget() {
  const [w, setW] = useState([0.2, 0.6, 0, 0.2]);
  const total = w.reduce((a, b) => a + b, 0) || 1;
  const p = w.map((x) => x / total);
  const H = columnEntropy(p);
  return (
    <Widget title="Entropy of a motif column" icon="🎲">
      <div className="grid cols-4">
        {['A', 'C', 'G', 'T'].map((n, i) => (
          <Slider key={n} label={`weight ${n}`} min={0} max={1} step={0.05} value={w[i]} onChange={(v) => setW(w.map((x, j) => (j === i ? v : x)))} />
        ))}
      </div>
      <Bars labels={['A', 'C', 'G', 'T']} values={p} height={150} />
      <div className="row">
        <span className="pill accent">H = {H.toFixed(3)} bits</span>
        <span className="pill">Information content = 2 − H = {(2 - H).toFixed(3)} bits</span>
        <button className="btn small" onClick={() => setW([0.25, 0.25, 0.25, 0.25])}>Uniform (H = 2)</button>
        <button className="btn small" onClick={() => setW([0, 0, 1, 0])}>Fully conserved (H = 0)</button>
        <button className="btn small" onClick={() => setW([0, 0, 0.9, 0.1])}>Slide column 5</button>
      </div>
      <p className="small muted">
        Low entropy = conserved column = strong motif signal. Probabilities are normalized for you, so they always sum to 1 (as every profile column must).
      </p>
    </Widget>
  );
}

export function KLWidget() {
  const [p, setP] = useState([0.7, 0.2, 0.1]);
  const [q, setQ] = useState([0.34, 0.33, 0.33]);
  const norm = (v: number[]) => {
    const s = v.reduce((a, b) => a + b, 0) || 1;
    return v.map((x) => Math.max(x / s, 1e-6));
  };
  const P = norm(p);
  const Q = norm(q);
  return (
    <Widget title="KL divergence is not symmetric" icon="↔️">
      <div className="grid cols-2">
        <div>
          <b>P</b> (e.g. high-dim neighbor probabilities p<sub>j|i</sub>)
          {P.map((_, i) => <Slider key={i} label={`p${i + 1}`} min={0} max={1} step={0.01} value={p[i]} onChange={(v) => setP(p.map((x, j) => (j === i ? v : x)))} />)}
          <Bars labels={['1', '2', '3']} values={P} height={120} />
        </div>
        <div>
          <b>Q</b> (e.g. low-dim neighbor probabilities q<sub>j|i</sub>)
          {Q.map((_, i) => <Slider key={i} label={`q${i + 1}`} min={0} max={1} step={0.01} value={q[i]} onChange={(v) => setQ(q.map((x, j) => (j === i ? v : x)))} />)}
          <Bars labels={['1', '2', '3']} values={Q} height={120} color="var(--g)" />
        </div>
      </div>
      <div className="row">
        <span className="pill accent">KL(P‖Q) = {kl(P, Q).toFixed(4)} nats</span>
        <span className="pill">KL(Q‖P) = {kl(Q, P).toFixed(4)} nats</span>
        <button className="btn small" onClick={() => { setP([0.98, 0.01, 0.01]); setQ([0.2, 0.4, 0.4]); }}>Near neighbor placed far</button>
        <button className="btn small" onClick={() => { setP([0.01, 0.495, 0.495]); setQ([0.5, 0.25, 0.25]); }}>Far point placed near</button>
      </div>
      <p className="small muted">
        KL(P‖Q) = Σ p·log(p/q). A large p with a tiny q is punished heavily, but a tiny p with a large q costs little. SNE minimizes KL(P‖Q), so it works hard to keep true neighbors close and cares less about the spacing of points that were far apart.
      </p>
    </Widget>
  );
}

export function EigenWidget() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(1.5);
  const [d, setD] = useState(2);
  const [theta, setTheta] = useState(30);
  const M = [[a, b], [b, d]];
  const tr = a + d;
  const det = a * d - b * b;
  const disc = Math.sqrt(Math.max(tr * tr / 4 - det, 0));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  const ev = (l: number) => {
    const v = Math.abs(b) > 1e-9 ? [l - d, b] : l === a ? [1, 0] : [0, 1];
    const n = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / n, v[1] / n];
  };
  const v1 = ev(l1);
  const v2 = ev(l2);
  const t = (theta * Math.PI) / 180;
  const u = [Math.cos(t), Math.sin(t)];
  const Mu = [M[0][0] * u[0] + M[0][1] * u[1], M[1][0] * u[0] + M[1][1] * u[1]];
  const S = 40;
  const C = 160;
  const pts = useMemo(() => Array.from({ length: 72 }, (_, i) => {
    const ang = (i / 72) * 2 * Math.PI;
    const x = [Math.cos(ang), Math.sin(ang)];
    return [M[0][0] * x[0] + M[0][1] * x[1], M[1][0] * x[0] + M[1][1] * x[1]];
  }), [a, b, d]); // eslint-disable-line react-hooks/exhaustive-deps
  const isEigen = Math.abs(u[0] * Mu[1] - u[1] * Mu[0]) < 0.05 * Math.hypot(...Mu);
  return (
    <Widget title="Eigenvectors of a covariance matrix" icon="📐">
      <div className="grid cols-2">
        <div>
          <div className="row">
            <Slider label="var(x) = a" min={0.2} max={5} step={0.1} value={a} onChange={setA} />
            <Slider label="cov(x,y) = b" min={-3} max={3} step={0.1} value={b} onChange={setB} />
            <Slider label="var(y) = d" min={0.2} max={5} step={0.1} value={d} onChange={setD} />
          </div>
          <Slider label="test vector angle" min={0} max={180} value={theta} onChange={setTheta} fmt={(v) => `${v}°`} />
          <p className="small">
            Σ = [[{fmt(a, 1)}, {fmt(b, 1)}], [{fmt(b, 1)}, {fmt(d, 1)}]]<br />
            λ₁ = <b>{l1.toFixed(3)}</b>, v₁ = ({v1[0].toFixed(2)}, {v1[1].toFixed(2)})<br />
            λ₂ = <b>{l2.toFixed(3)}</b>, v₂ = ({v2[0].toFixed(2)}, {v2[1].toFixed(2)})<br />
            PC1 explains {((l1 / (l1 + l2)) * 100).toFixed(1)}% of the variance.
          </p>
          <p className="small" style={{ color: isEigen ? 'var(--ok)' : 'var(--text-dim)' }}>
            {isEigen ? '✓ Σu points the same way as u: you found an eigenvector!' : 'Rotate the test vector u (blue) until Σu (orange) lines up with it.'}
          </p>
        </div>
        <svg viewBox="0 0 320 320" style={{ width: '100%', maxWidth: 360, background: 'var(--bg-sunk)', borderRadius: 10 }}>
          <line x1={0} x2={320} y1={C} y2={C} stroke="var(--border)" />
          <line y1={0} y2={320} x1={C} x2={C} stroke="var(--border)" />
          <polygon points={pts.map((p) => `${C + p[0] * S * 0.55},${C - p[1] * S * 0.55}`).join(' ')} fill="var(--accent-soft)" stroke="var(--accent)" opacity={0.7} />
          <line x1={C} y1={C} x2={C + v1[0] * l1 * S * 0.55} y2={C - v1[1] * l1 * S * 0.55} stroke="var(--danger)" strokeWidth={3} />
          <line x1={C} y1={C} x2={C + v2[0] * l2 * S * 0.55} y2={C - v2[1] * l2 * S * 0.55} stroke="#ae3ec9" strokeWidth={3} />
          <line x1={C} y1={C} x2={C + u[0] * S * 2} y2={C - u[1] * S * 2} stroke="var(--c)" strokeWidth={2.5} />
          <line x1={C} y1={C} x2={C + Mu[0] * S * 0.55} y2={C - Mu[1] * S * 0.55} stroke="var(--g)" strokeWidth={2.5} strokeDasharray="5 3" />
          <text x={8} y={16} fontSize="11">ellipse = Σ applied to the unit circle</text>
          <text x={8} y={30} fontSize="11" style={{ fill: 'var(--danger)' }}>red = λ₁v₁ (PC1)</text>
          <text x={8} y={44} fontSize="11" style={{ fill: '#ae3ec9' }}>purple = λ₂v₂ (PC2)</text>
        </svg>
      </div>
    </Widget>
  );
}
