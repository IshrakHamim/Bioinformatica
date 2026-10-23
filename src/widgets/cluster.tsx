import { useMemo, useState } from 'react';
import { distanceMatrix, hierarchical, kmeansPP, kmeansPPProbabilities, lloyd, softAssign, softCenters, type Linkage, type Vec } from '../lib/bio/cluster';
import { mulberry32 } from '../lib/bio/rng';
import { LineChart, Matrix, PALETTE, Scatter, Slider, Stepper, Widget, fmt } from './ui';

function blobs(seed: number, spec: { c: Vec; n: number; s: number }[]) {
  const rng = mulberry32(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(rng() + 1e-12)) * Math.cos(2 * Math.PI * rng());
  return spec.flatMap(({ c, n, s }) => Array.from({ length: n }, () => [c[0] + gauss() * s, c[1] + gauss() * s]));
}

const DATASETS: Record<string, () => Vec[]> = {
  blobs: () => blobs(1, [{ c: [2, 2], n: 25, s: 0.7 }, { c: [7, 3], n: 25, s: 0.8 }, { c: [4.5, 7.5], n: 25, s: 0.7 }]),
  uneven: () => blobs(2, [{ c: [2, 5], n: 60, s: 1.4 }, { c: [8, 5], n: 8, s: 0.3 }]),
  outlier: () => [...blobs(3, [{ c: [2, 2], n: 20, s: 0.6 }, { c: [5, 5], n: 20, s: 0.6 }]), [19, 19], [18.5, 19.5]],
  moons: () => {
    const rng = mulberry32(9);
    return Array.from({ length: 70 }, (_, i) => {
      const t = (i % 35) / 34;
      const ang = Math.PI * t;
      const up = i < 35;
      return up ? [3 + 3 * Math.cos(ang) + rng() * 0.4, 4 + 3 * Math.sin(ang) + rng() * 0.4] : [6 - 3 * Math.cos(ang) + rng() * 0.4, 5 - 3 * Math.sin(ang) + rng() * 0.4];
    });
  },
};

export function KMeansPlayground() {
  const [ds, setDs] = useState('blobs');
  const [k, setK] = useState(3);
  const [init, setInit] = useState<'random' | 'kpp' | 'bad'>('random');
  const [seed, setSeed] = useState(4);
  const [extra, setExtra] = useState<Vec[]>([]);
  const data = useMemo(() => [...DATASETS[ds](), ...extra], [ds, extra]);
  const history = useMemo(() => {
    const rng = mulberry32(seed);
    let c: Vec[];
    if (init === 'kpp') c = kmeansPP(data, k, rng);
    else if (init === 'bad') c = Array.from({ length: k }, (_, i) => [data[i][0] + 0.01 * i, data[i][1]]);
    else c = Array.from({ length: k }, () => data[Math.floor(rng() * data.length)]);
    return lloyd(data, c);
  }, [data, k, init, seed]);
  const [step, setStep] = useState(0);
  const h = history[Math.min(step, history.length - 1)];
  return (
    <Widget title="k-means (Lloyd's algorithm) playground" icon="🎯">
      <div className="row">
        <select value={ds} onChange={(e) => { setDs(e.target.value); setExtra([]); setStep(0); }}>
          <option value="blobs">3 round blobs</option>
          <option value="uneven">Uneven sizes / spreads</option>
          <option value="outlier">With outliers</option>
          <option value="moons">Non-spherical (two moons)</option>
        </select>
        <Slider label="k" min={1} max={6} value={k} onChange={(v) => { setK(v); setStep(0); }} />
        <select value={init} onChange={(e) => { setInit(e.target.value as typeof init); setStep(0); }}>
          <option value="random">Random data points as centers</option>
          <option value="kpp">k-means++ initialization</option>
          <option value="bad">Bad init: first k points</option>
        </select>
        <button className="btn small" onClick={() => { setSeed((s) => s + 1); setStep(0); }}>Re-initialize</button>
      </div>
      <Stepper step={step} max={history.length - 1} setStep={setStep} label="(each step = assign points → recompute centers)" />
      <div className="grid cols-2">
        <Scatter points={data} colors={h.labels.map((l) => PALETTE[l % PALETTE.length])} centers={h.centers.map((c, i) => ({ p: c, color: PALETTE[i % PALETTE.length] }))} onClick={(x, y) => { setExtra((e) => [...e, [x, y]]); setStep(0); }} />
        <div>
          <LineChart series={[{ name: 'distortion', values: history.slice(0, step + 1).map((x) => x.distortion) }]} height={170} xLabel="iteration" yLabel="distortion" />
          <p className="small">Squared-error distortion = <b>{h.distortion.toFixed(3)}</b>. It never increases between iterations, so Lloyd always converges, but often to a <b>local</b> minimum that depends on the initialization.</p>
          <p className="small muted">Click the plot to add points (try making an outlier). Try “two moons”: k-means assumes round clusters of similar size and cuts the moons wrongly.</p>
        </div>
      </div>
    </Widget>
  );
}

export function SoftKMeans({ preset }: { preset?: string }) {
  const [beta, setBeta] = useState(1);
  const [squared, setSquared] = useState(true);
  const [mode, setMode] = useState<'play' | 'calc'>(preset === 'mid' ? 'calc' : 'play');
  const [ptsTxt, setPtsTxt] = useState(preset === 'q2' ? '4 5\n2 3' : '10 8 10\n10 0 9\n4 8 3\n7 8 3\n10 2 3');
  const [ctrTxt, setCtrTxt] = useState(preset === 'q2' ? '2 3\n6 7' : '10 8 10\n4 8 3');
  const [calcBeta, setCalcBeta] = useState(0.5);
  const data = useMemo(() => blobs(5, [{ c: [3, 3], n: 18, s: 1 }, { c: [6.5, 6], n: 18, s: 1.1 }]), []);
  const [centers, setCenters] = useState<Vec[]>([[1, 8], [8, 1]]);
  const resp = softAssign(data, centers, beta, squared);
  const colorOf = (r: number[]) => {
    const a = r[0];
    return `rgb(${Math.round(28 + (232 - 28) * (1 - a))}, ${Math.round(126 + (89 - 126) * (1 - a))}, ${Math.round(214 + (12 - 214) * (1 - a))})`;
  };
  const parse = (s: string) => s.trim().split('\n').map((l) => l.trim().split(/[\s,]+/).map(Number)).filter((r) => r.every(Number.isFinite) && r.length);
  const cp = parse(ptsTxt);
  const cc = parse(ctrTxt);
  const calcOk = cp.length && cc.length && cp.every((r) => r.length === cc[0].length) && cc.every((r) => r.length === cc[0].length);
  const cr = calcOk ? softAssign(cp, cc, calcBeta, squared) : [];
  const newC = calcOk ? softCenters(cp, cr) : [];
  return (
    <Widget title="Soft k-means (EM clustering) and the stiffness β" icon="☁️">
      <div className="row">
        <button className={`btn small ${mode === 'play' ? 'primary' : ''}`} onClick={() => setMode('play')}>Playground</button>
        <button className={`btn small ${mode === 'calc' ? 'primary' : ''}`} onClick={() => setMode('calc')}>Exam calculator</button>
        <label className="small"><input type="checkbox" checked={squared} onChange={(e) => setSquared(e.target.checked)} /> use squared distance e<sup>−β‖x−μ‖²</sup> (course exams); off = e<sup>−β·d</sup> (textbook)</label>
      </div>
      {mode === 'play' ? (
        <>
          <div className="row">
            <Slider label="β (stiffness)" min={0} max={5} step={0.05} value={beta} onChange={setBeta} />
            <button className="btn small primary" onClick={() => setCenters(softCenters(data, resp))}>One EM iteration (E + M)</button>
            <button className="btn small" onClick={() => setCenters([[1, 8], [8, 1]])}>Reset centers</button>
          </div>
          <Scatter points={data} colors={resp.map(colorOf)} centers={centers.map((c, i) => ({ p: c, color: PALETTE[i === 0 ? 0 : 1] }))} domain={[-1, 11, -1, 11]} />
          <p className="small">Color = responsibility of the blue center (pure blue = 1, pure orange = 0). As <b>β → 0</b> every point belongs 50/50 to all clusters and all centers collapse to the global mean. As <b>β → ∞</b> responsibilities become 0/1, which is exactly hard k-means. Moderate β suits <b>overlapping</b> gene-expression clusters, because a gene can partly belong to two co-regulated programs.</p>
        </>
      ) : (
        <>
          <div className="grid cols-3">
            <label className="field"><span>Data points (one per line)</span><textarea rows={6} value={ptsTxt} onChange={(e) => setPtsTxt(e.target.value)} /></label>
            <label className="field"><span>Current centers</span><textarea rows={4} value={ctrTxt} onChange={(e) => setCtrTxt(e.target.value)} /></label>
            <div className="col">
              <Slider label="β" min={0} max={3} step={0.05} value={calcBeta} onChange={setCalcBeta} />
              <button className="btn small" onClick={() => { setPtsTxt('10 8 10\n10 0 9\n4 8 3\n7 8 3\n10 2 3'); setCtrTxt('10 8 10\n4 8 3'); setCalcBeta(0.5); }}>Mid exam data</button>
              <button className="btn small" onClick={() => { setPtsTxt('4 5\n2 3'); setCtrTxt('2 3\n6 7'); setCalcBeta(0.5); }}>Quiz 2 data</button>
            </div>
          </div>
          {calcOk ? (
            <>
              <b className="small">E-step: responsibilities w<sub>ik</sub> = e<sup>−β‖x<sub>i</sub>−μ<sub>k</sub>‖{squared ? '²' : ''}</sup> / Σ<sub>j</sub> e<sup>−β‖x<sub>i</sub>−μ<sub>j</sub>‖{squared ? '²' : ''}</sup></b>
              <Matrix
                rows={cp.map((p, i) => `x${i + 1} (${p.join(',')})`)}
                cols={[...cc.map((_, k) => `‖x−μ${k + 1}‖${squared ? '²' : ''}`), ...cc.map((_, k) => `w(μ${k + 1})`)]}
                data={cp.map((p, i) => [...cc.map((c) => { const d2 = p.reduce((s, v, d) => s + (v - c[d]) ** 2, 0); return squared ? d2 : Math.sqrt(d2); }), ...cr[i]])}
                format={(v) => (typeof v === 'number' ? (Math.abs(v) < 1e-4 && v !== 0 ? v.toExponential(2) : fmt(v, 4)) : v)}
              />
              <b className="small" style={{ display: 'block', marginTop: 8 }}>M-step: μ<sub>k</sub> = Σ<sub>i</sub> w<sub>ik</sub> x<sub>i</sub> / Σ<sub>i</sub> w<sub>ik</sub></b>
              <Matrix rows={newC.map((_, k) => `new μ${k + 1}`)} cols={newC[0].map((_, d) => `dim ${d + 1}`)} data={newC} format={(v) => fmt(v as number, 3)} />
            </>
          ) : (
            <p className="callout warn small">Points and centers must all have the same dimension.</p>
          )}
        </>
      )}
    </Widget>
  );
}

export function KMeansPPCalc() {
  const [ptsTxt, setPtsTxt] = useState('2, 4, 10, 12, 20');
  const [chosenTxt, setChosenTxt] = useState('2');
  const pts = ptsTxt.split(/[\s,]+/).map(Number).filter(Number.isFinite);
  const chosen = chosenTxt.split(/[\s,]+/).map(Number).filter(Number.isFinite);
  const pr = chosen.length ? kmeansPPProbabilities(pts.map((x) => [x]), chosen.map((x) => [x])) : [];
  return (
    <Widget title="k-means++ seeding probabilities (1-D)" icon="🎲">
      <div className="row">
        <label className="field"><span>Points</span><input className="mono" value={ptsTxt} onChange={(e) => setPtsTxt(e.target.value)} /></label>
        <label className="field"><span>Centers chosen so far</span><input className="mono" value={chosenTxt} onChange={(e) => setChosenTxt(e.target.value)} /></label>
      </div>
      <Matrix rows={['D(x)²', 'P(next = x)']} cols={pts.map(String)} data={[pts.map((x) => Math.min(...chosen.map((c) => (x - c) ** 2))), pr]} format={(v) => fmt(v as number, 4)} />
      <p className="small muted">Each point is picked with probability D(x)² / Σ D(x)². Far points are likely but not guaranteed; the randomness avoids always grabbing an outlier.</p>
    </Widget>
  );
}

const PEVZNER_GENES = [
  [10.0, 8.0, 10.0], [10.0, 0.0, 9.0], [4.0, 8.5, 3.0], [9.5, 0.5, 8.5], [4.5, 8.5, 2.5],
  [10.5, 9.0, 12.0], [5.0, 8.5, 11.0], [3.7, 8.7, 2.0], [9.7, 2.0, 9.0], [10.2, 1.0, 9.2],
];

export function HClustViz() {
  const [linkage, setLinkage] = useState<Linkage>('average');
  const [cut, setCut] = useState(4);
  const labels = PEVZNER_GENES.map((_, i) => `g${i + 1}`);
  const D = useMemo(() => distanceMatrix(PEVZNER_GENES), []);
  const merges = useMemo(() => hierarchical(D, linkage), [D, linkage]);
  const [step, setStep] = useState(merges.length);
  // leaf order via DFS of final tree
  const children: Record<number, [number, number]> = {};
  merges.forEach((m) => (children[m.id] = [m.a, m.b]));
  const order: number[] = [];
  const dfs = (id: number): void => {
    if (id < labels.length) order.push(id);
    else {
      dfs(children[id][0]);
      dfs(children[id][1]);
    }
  };
  dfs(merges[merges.length - 1].id);
  const W = 600;
  const H = 260;
  const maxH = merges[merges.length - 1].height;
  const X: Record<number, number> = {};
  const Yh: Record<number, number> = {};
  order.forEach((leaf, i) => {
    X[leaf] = 30 + (i * (W - 60)) / (order.length - 1);
    Yh[leaf] = 0;
  });
  merges.forEach((m) => {
    X[m.id] = (X[m.a] + X[m.b]) / 2;
    Yh[m.id] = m.height;
  });
  const y = (h: number) => H - 30 - (h / maxH) * (H - 50);
  const clusters = (() => {
    const parent: Record<number, number> = {};
    merges.forEach((m) => {
      if (m.height <= cut) {
        parent[m.a] = m.id;
        parent[m.b] = m.id;
      }
    });
    const root = (x: number): number => (parent[x] !== undefined ? root(parent[x]) : x);
    const ids = [...new Set(order.map(root))];
    return order.map((l) => ids.indexOf(root(l)));
  })();
  return (
    <Widget title="Hierarchical clustering → dendrogram" icon="🌳">
      <div className="row">
        <select value={linkage} onChange={(e) => setLinkage(e.target.value as Linkage)}>
          <option value="single">D_min (single linkage)</option>
          <option value="complete">D_max (complete linkage)</option>
          <option value="average">D_avg (average linkage)</option>
        </select>
        <Slider label="cut height" min={0} max={Math.ceil(maxH)} step={0.1} value={cut} onChange={setCut} />
        <span className="pill accent">{new Set(clusters).size} clusters</span>
      </div>
      <Stepper step={step} max={merges.length} setStep={setStep} label="merges" />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {merges.slice(0, step).map((m) => (
          <g key={m.id} stroke="var(--accent-2)" strokeWidth={2} fill="none">
            <path d={`M ${X[m.a]} ${y(Yh[m.a])} V ${y(m.height)} H ${X[m.b]} V ${y(Yh[m.b])}`} />
          </g>
        ))}
        <line x1={20} x2={W - 10} y1={y(cut)} y2={y(cut)} stroke="var(--danger)" strokeDasharray="5 4" />
        {order.map((leaf, i) => (
          <g key={leaf}>
            <circle cx={X[leaf]} cy={y(0)} r={6} fill={PALETTE[clusters[i] % PALETTE.length]} />
            <text x={X[leaf]} y={H - 10} textAnchor="middle" fontSize="12">{labels[leaf]}</text>
          </g>
        ))}
      </svg>
      {step > 0 && step <= merges.length && (
        <p className="small">Merge {step}: {[merges[step - 1].a, merges[step - 1].b].map((id) => (id < labels.length ? labels[id] : `C${id}`)).join(' + ')} at distance {merges[step - 1].height.toFixed(2)}</p>
      )}
      <p className="small muted">Data: the 10-gene × 3-time-point expression matrix from the lecture slides (Compeau &amp; Pevzner, Ch. 8), with Euclidean distances. Moving the cut line gives a different number of clusters without re-running anything.</p>
    </Widget>
  );
}
