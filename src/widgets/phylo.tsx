import { useMemo, useState, type ReactElement } from 'react';
import { fitch, isAdditive, limbLength, neighborJoining, upgma, type FitchNode, type TreeNode } from '../lib/bio/phylo';
import { Matrix, Stepper, Widget, fmt } from './ui';

function parseMatrix(txt: string): { labels: string[]; D: number[][] } | null {
  const lines = txt.trim().split('\n').map((l) => l.trim().split(/[\s,]+/));
  if (lines.length < 2) return null;
  const labels = lines.map((l) => l[0]);
  const D = lines.map((l) => l.slice(1).map(Number));
  if (D.some((r) => r.length !== labels.length || r.some((v) => !Number.isFinite(v)))) return null;
  return { labels, D };
}

const FINAL_MATRIX = 'A 0 4 6 6\nB 4 0 6 6\nC 6 6 0 4\nD 6 6 4 0';
const ADDITIVE = 'i 0 13 21 22\nj 13 0 12 13\nk 21 12 0 13\nl 22 13 13 0';
const PRIMATES = 'Human 0 3 4 9\nChimp 3 0 4 9\nGorilla 4 4 0 9\nOrangutan 9 9 9 0';

function TreeSVG({ root }: { root: TreeNode }) {
  const leaves: string[] = [];
  const walk = (n: TreeNode) => (n.children.length ? n.children.forEach((c) => walk(c.node)) : leaves.push(n.id));
  walk(root);
  const W = 520;
  const H = Math.max(140, leaves.length * 40);
  const maxAge = root.age ?? 1;
  const X = (age: number) => 30 + (1 - age / maxAge) * (W - 140);
  const Ypos: Record<string, number> = {};
  leaves.forEach((l, i) => (Ypos[l] = 20 + (i * (H - 40)) / Math.max(leaves.length - 1, 1)));
  const elems: ReactElement[] = [];
  const place = (n: TreeNode): number => {
    if (!n.children.length) return Ypos[n.id];
    const ys = n.children.map((c) => place(c.node));
    const y = (Math.min(...ys) + Math.max(...ys)) / 2;
    const x = X(n.age ?? 0);
    elems.push(<line key={`v${n.id}`} x1={x} x2={x} y1={Math.min(...ys)} y2={Math.max(...ys)} stroke="var(--accent-2)" strokeWidth={2} />);
    n.children.forEach((c, i) => {
      const cx = X(c.node.age ?? 0);
      elems.push(<line key={`h${n.id}${i}`} x1={x} x2={cx} y1={ys[i]} y2={ys[i]} stroke="var(--accent-2)" strokeWidth={2} />);
      elems.push(<text key={`t${n.id}${i}`} x={(x + cx) / 2} y={ys[i] - 5} fontSize="11" textAnchor="middle" style={{ fill: 'var(--danger)' }}>{fmt(c.length, 2)}</text>);
    });
    elems.push(<circle key={`c${n.id}`} cx={x} cy={y} r={3.5} fill="var(--accent-2)" />);
    elems.push(<text key={`a${n.id}`} x={x - 4} y={y + 15} fontSize="10" textAnchor="end" className="dim">age {fmt(n.age ?? 0, 2)}</text>);
    return y;
  };
  place(root);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto' }}>
      {elems}
      {leaves.map((l) => (
        <text key={l} x={X(0) + 8} y={Ypos[l] + 4} fontSize="13" fontWeight="600">{l}</text>
      ))}
    </svg>
  );
}

export function UPGMAViz({ preset = 'final' }: { preset?: string }) {
  const [txt, setTxt] = useState(preset === 'primates' ? PRIMATES : FINAL_MATRIX);
  const parsed = parseMatrix(txt);
  const res = useMemo(() => (parsed ? upgma(parsed.labels, parsed.D) : null), [txt]); // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState(0);
  return (
    <Widget title="UPGMA: build an ultrametric tree step by step" icon="🌲">
      <div className="grid cols-2">
        <div>
          <label className="field"><span>Distance matrix (label then row)</span><textarea rows={6} value={txt} onChange={(e) => { setTxt(e.target.value); setStep(0); }} /></label>
          <div className="row small" style={{ marginTop: 6 }}>
            <button className="btn small" onClick={() => { setTxt(FINAL_MATRIX); setStep(0); }}>Final exam matrix</button>
            <button className="btn small" onClick={() => { setTxt(PRIMATES); setStep(0); }}>Toy primates</button>
            <button className="btn small" onClick={() => { setTxt(ADDITIVE); setStep(0); }}>Additive (non-ultrametric)</button>
          </div>
        </div>
        <div>
          {parsed && res ? (
            <>
              <Stepper step={step} max={res.steps.length} setStep={setStep} label="merges" />
              {step === 0 ? (
                <Matrix rows={parsed.labels} cols={parsed.labels} data={parsed.D} />
              ) : (
                <>
                  <div className="callout cs small">
                    Step {step}: closest clusters <b>{res.steps[step - 1].merged.join(' and ')}</b> at D = {fmt(res.steps[step - 1].distance, 3)} → merge at height (age) D/2 = <b>{fmt(res.steps[step - 1].height, 3)}</b>.<br />
                    New distances are size-weighted averages: D(C<sub>new</sub>, C) = (|C₁|·D(C₁,C) + |C₂|·D(C₂,C)) / (|C₁| + |C₂|).
                  </div>
                  <Matrix rows={res.steps[step - 1].matrixAfter.labels} cols={res.steps[step - 1].matrixAfter.labels} data={res.steps[step - 1].matrixAfter.D} />
                </>
              )}
            </>
          ) : (
            <p className="callout warn small">Matrix must be square: each line = label followed by n numbers.</p>
          )}
        </div>
      </div>
      {res && step === res.steps.length && (
        <>
          <TreeSVG root={res.root} />
          <p className="small muted">Every leaf is at age 0 and every root-to-leaf path has the same length ({fmt(res.root.age ?? 0, 3)}), so the tree is <b>ultrametric</b>, which is what a constant molecular clock predicts. If the real rates differ between lineages, UPGMA can produce the wrong topology even on an additive matrix (try the additive preset).</p>
        </>
      )}
    </Widget>
  );
}

export function NJViz() {
  const [txt, setTxt] = useState(ADDITIVE);
  const parsed = parseMatrix(txt);
  const res = useMemo(() => (parsed ? neighborJoining(parsed.labels, parsed.D) : null), [txt]); // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState(0);
  const st = res?.steps[step - 1];
  return (
    <Widget title="Neighbor joining (Saitou & Nei, 1987)" icon="🤝">
      <label className="field"><span>Distance matrix</span><textarea rows={5} value={txt} onChange={(e) => { setTxt(e.target.value); setStep(0); }} /></label>
      {parsed && <p className="small">Four-point condition: this matrix is <b>{isAdditive(parsed.D) ? 'additive' : 'not additive'}</b>. Limb lengths (limb length theorem): {parsed.labels.map((l, j) => `${l}: ${fmt(limbLength(parsed.D, j).length, 2)}`).join(' · ')}</p>}
      {res && (
        <>
          <Stepper step={step} max={res.steps.length} setStep={setStep} label="joins" />
          {st && (
            <div className="grid cols-2">
              <div>
                <b className="small">D*ᵢⱼ = (n − 2)·Dᵢⱼ − TotalDistance(i) − TotalDistance(j)</b>
                <Matrix rows={st.labels} cols={st.labels} data={st.Dstar} cellClass={(i, j) => (st.labels[i] === st.pair[0] && st.labels[j] === st.pair[1] ? 'best' : '')} />
              </div>
              <div className="callout cs small">
                Minimum D* → join <b>{st.pair[0]}</b> and <b>{st.pair[1]}</b> at new node {st.newNode}.<br />
                Δ = (Total({st.pair[0]}) − Total({st.pair[1]}))/(n − 2)<br />
                limb({st.pair[0]}) = (D + Δ)/2 = <b>{fmt(st.limbs[0], 3)}</b>, limb({st.pair[1]}) = (D − Δ)/2 = <b>{fmt(st.limbs[1], 3)}</b><br />
                Then D(m, k) = (D(i,k) + D(j,k) − D(i,j))/2.
              </div>
            </div>
          )}
          {step === res.steps.length && (
            <p className="small">Final unrooted tree edges: {res.edges.map((e) => `${e.a}–${e.b} (${fmt(e.length, 2)})`).join(', ')}</p>
          )}
          <p className="small muted">Unlike UPGMA, neighbor joining does not assume a molecular clock. For an additive matrix it reconstructs the exact tree. Its D* matrix corrects for leaves that are far from everything (fast-evolving outliers).</p>
        </>
      )}
    </Widget>
  );
}

export function FitchViz() {
  const [leaves, setLeaves] = useState(['A', 'C', 'C', 'G']);
  const names = ['Human', 'Chimp', 'Mouse', 'Rat'];
  const tree: FitchNode = {
    id: 'root',
    left: { id: 'anc1', left: { id: names[0], state: leaves[0] }, right: { id: names[1], state: leaves[1] } },
    right: { id: 'anc2', left: { id: names[2], state: leaves[2] }, right: { id: names[3], state: leaves[3] } },
  };
  const r = fitch(tree);
  const box = (id: string, x: number, y: number) => (
    <g key={id} transform={`translate(${x},${y})`}>
      <rect x={-34} y={-16} width={68} height={32} rx={8} fill="var(--bg-elev)" stroke="var(--accent-2)" />
      <text textAnchor="middle" y={-2} fontSize="11">{id}</text>
      <text textAnchor="middle" y={12} fontSize="11" fontFamily="var(--mono)">{'{'}{[...r.sets.get(id)!].sort().join(',')}{'}'}→<tspan fontWeight="800" style={{ fill: 'var(--accent)' }}>{r.assigned.get(id)}</tspan></text>
    </g>
  );
  return (
    <Widget title="Small parsimony (Fitch) for one alignment column" icon="🧬">
      <div className="row">
        {names.map((n, i) => (
          <label key={n} className="field"><span>{n}</span>
            <select value={leaves[i]} onChange={(e) => setLeaves(leaves.map((x, j) => (j === i ? e.target.value : x)))}>
              {'ACGT'.split('').map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        ))}
        <span className="pill accent">parsimony score = {r.changes} mutation{r.changes === 1 ? '' : 's'}</span>
      </div>
      <svg viewBox="0 0 520 220" style={{ width: '100%', maxWidth: 520, height: 'auto' }}>
        {[[260, 30, 140, 100], [260, 30, 380, 100], [140, 100, 70, 185], [140, 100, 210, 185], [380, 100, 310, 185], [380, 100, 450, 185]].map(([a, b, c, d], i) => (
          <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="var(--border)" strokeWidth={2} />
        ))}
        {box('root', 260, 30)}
        {box('anc1', 140, 100)}
        {box('anc2', 380, 100)}
        {box(names[0], 70, 185)}
        {box(names[1], 210, 185)}
        {box(names[2], 310, 185)}
        {box(names[3], 450, 185)}
      </svg>
      <p className="small muted">Bottom-up: a node's set is the intersection of its children's sets if non-empty; otherwise their union, at a cost of +1 mutation. Top-down: pick a state for the root, then let each child keep its parent's state when possible. Character-based methods like this use the full alignment, whereas distance methods compress it into one number per pair.</p>
    </Widget>
  );
}
