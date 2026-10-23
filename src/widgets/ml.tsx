import { useEffect, useMemo, useState } from 'react';
import { kmerFeatures, knnPredict, linRegStep, logisticStep, metrics, sigmoid } from '../lib/bio/ml';
import { mulberry32 } from '../lib/bio/rng';
import { Bars, LineChart, PALETTE, Scatter, Slider, Widget } from './ui';

export function KmerFeaturesViz() {
  const [seq, setSeq] = useState('ATGCGCGCTATATAGCGCGCAAATTTGCGC');
  const [k, setK] = useState(2);
  const s = seq.toUpperCase().replace(/[^ACGT]/g, '');
  const f = kmerFeatures(s, k);
  return (
    <Widget title="Sequence → numeric feature vector (k-mer composition)" icon="🔢">
      <div className="row">
        <input className="mono" value={seq} onChange={(e) => setSeq(e.target.value)} style={{ flex: 1, minWidth: 220 }} aria-label="sequence" />
        <Slider label="k" min={1} max={3} value={k} onChange={setK} />
        <span className="pill">vector length 4^{k} = {f.kmers.length}</span>
      </div>
      <Bars labels={f.kmers} values={f.values} height={170} fmtV={(v) => (v ? v.toFixed(2) : '')} />
      <p className="small muted">Every sequence, whatever its length, becomes a fixed-length vector that a classifier can use. The dimension grows as 4^k (20^k for proteins), so large k quickly gives a sparse, high-dimensional vector (the curse of dimensionality). That is one motivation for learned embeddings such as dna2vec.</p>
    </Widget>
  );
}

export function ConfusionWidget() {
  const [tp, setTp] = useState(90);
  const [fn, setFn] = useState(10);
  const [fp, setFp] = useState(15);
  const [tn, setTn] = useState(85);
  const m = metrics({ tp, fp, tn, fn });
  return (
    <Widget title="Evaluation metrics from a confusion matrix" icon="📊">
      <div className="grid cols-2">
        <div>
          <table className="mtable" style={{ fontSize: '0.95rem' }}>
            <thead><tr><th /><th>predicted +</th><th>predicted −</th></tr></thead>
            <tbody>
              <tr><th>actual +</th><td><input type="number" value={tp} onChange={(e) => setTp(+e.target.value)} style={{ width: 70 }} aria-label="TP" /> TP</td><td><input type="number" value={fn} onChange={(e) => setFn(+e.target.value)} style={{ width: 70 }} aria-label="FN" /> FN</td></tr>
              <tr><th>actual −</th><td><input type="number" value={fp} onChange={(e) => setFp(+e.target.value)} style={{ width: 70 }} aria-label="FP" /> FP</td><td><input type="number" value={tn} onChange={(e) => setTn(+e.target.value)} style={{ width: 70 }} aria-label="TN" /> TN</td></tr>
            </tbody>
          </table>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn small" onClick={() => { setTp(1000); setFn(0); setFp(100); setTn(0); }}>Imbalanced: “always cancer”</button>
            <button className="btn small" onClick={() => { setTp(90); setFn(10); setFp(15); setTn(85); }}>Balanced, decent model</button>
          </div>
        </div>
        <div className="grid cols-2 small">
          {Object.entries({ Accuracy: m.accuracy, Precision: m.precision, 'Recall / Sensitivity': m.recall, Specificity: m.specificity, F1: m.f1, MCC: m.mcc, 'Balanced accuracy': m.balancedAccuracy }).map(([k, v]) => (
            <div key={k} className="stat"><b>{v.toFixed(3)}</b><span>{k}</span></div>
          ))}
        </div>
      </div>
      <p className="small muted">Try the imbalanced preset (1000 cancer, 100 normal, the final-exam scenario): predicting “cancer” for everyone gives 90.9% accuracy but MCC = 0 and specificity = 0. On imbalanced data, report MCC, F1, balanced accuracy, AUROC or AUPR, not accuracy alone.</p>
    </Widget>
  );
}

function twoClass(seed: number, nPos: number, nNeg: number, sep: number) {
  const rng = mulberry32(seed);
  const g = () => Math.sqrt(-2 * Math.log(rng() + 1e-12)) * Math.cos(2 * Math.PI * rng());
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < nPos; i++) { X.push([5 + sep / 2 + g(), 5 + sep / 2 + g()]); y.push(1); }
  for (let i = 0; i < nNeg; i++) { X.push([5 - sep / 2 + g(), 5 - sep / 2 + g()]); y.push(0); }
  return { X, y };
}

export function KNNViz() {
  const [k, setK] = useState(5);
  const data = useMemo(() => twoClass(3, 30, 30, 2.2), []);
  const train = data.X.map((x, i) => ({ x, y: data.y[i] }));
  const [q, setQ] = useState<number[]>([5, 5]);
  const pred = knnPredict(train, q, k);
  const grid = useMemo(() => {
    const cells: { x: number; y: number; c: number }[] = [];
    for (let gx = 0; gx <= 10; gx += 0.5) for (let gy = 0; gy <= 10; gy += 0.5) cells.push({ x: gx, y: gy, c: knnPredict(train, [gx, gy], k).label });
    return cells;
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Widget title="k-nearest neighbors classifier" icon="📍">
      <Slider label="k" min={1} max={25} step={2} value={k} onChange={setK} />
      <Scatter
        points={data.X}
        colors={data.y.map((c) => (c ? PALETTE[1] : PALETTE[0]))}
        domain={[0, 10, 0, 10]}
        onClick={(x, y) => setQ([x, y])}
        extra={(X, Y) => (
          <g>
            {grid.map((c, i) => <rect key={i} x={X(c.x) - 6} y={Y(c.y) - 6} width={12} height={12} fill={c.c ? PALETTE[1] : PALETTE[0]} opacity={0.12} />)}
            {pred.neighbors.map((n, i) => <line key={i} x1={X(q[0])} y1={Y(q[1])} x2={X(n.x[0])} y2={Y(n.x[1])} stroke="var(--text-dim)" strokeDasharray="3 3" />)}
            <circle cx={X(q[0])} cy={Y(q[1])} r={9} fill={pred.label ? PALETTE[1] : PALETTE[0]} stroke="var(--text)" strokeWidth={2} />
          </g>
        )}
      />
      <p className="small">Click anywhere to classify a new sample. Predicted: <b style={{ color: pred.label ? PALETTE[1] : PALETTE[0] }}>{pred.label ? 'tumor' : 'normal'}</b> by majority vote of its {k} nearest training samples. Small k gives a wiggly boundary (overfitting); large k gives a smooth one (underfitting). KNN has no training phase, but it needs feature scaling, because distances mix units.</p>
    </Widget>
  );
}

export function GradientDescentViz() {
  const xs = [1, 2, 3, 4, 5, 6];
  const ys = [1.8, 3.1, 4.2, 4.8, 6.3, 7.1];
  const [lr, setLr] = useState(0.02);
  const [w, setW] = useState({ w0: 0, w1: -1 });
  const [hist, setHist] = useState<number[]>([]);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => {
      setW((cur) => {
        const r = linRegStep(xs, ys, cur.w0, cur.w1, lr);
        setHist((h) => [...h, r.loss].slice(-200));
        if (!Number.isFinite(r.w1) || Math.abs(r.w1) > 1e6) setRun(false);
        return { w0: r.w0, w1: r.w1 };
      });
    }, 80);
    return () => clearInterval(id);
  }, [run, lr]); // eslint-disable-line react-hooks/exhaustive-deps
  const loss = xs.reduce((s, x, i) => s + 0.5 * (w.w0 + w.w1 * x - ys[i]) ** 2, 0);
  return (
    <Widget title="Gradient descent for linear regression" icon="⛰️">
      <div className="row">
        <Slider label="learning rate α" min={0.001} max={0.06} step={0.001} value={lr} onChange={setLr} />
        <button className="btn small primary" onClick={() => setRun((r) => !r)}>{run ? '⏸ Pause' : '▶ Descend'}</button>
        <button className="btn small" onClick={() => { const r = linRegStep(xs, ys, w.w0, w.w1, lr); setW({ w0: r.w0, w1: r.w1 }); setHist((h) => [...h, r.loss]); }}>One step</button>
        <button className="btn small" onClick={() => { setW({ w0: 0, w1: -1 }); setHist([]); setRun(false); }}>Reset</button>
      </div>
      <div className="grid cols-2">
        <Scatter points={xs.map((x, i) => [x, ys[i]])} domain={[0, 7, -2, 9]} extra={(X, Y) => <line x1={X(0)} y1={Y(w.w0)} x2={X(7)} y2={Y(w.w0 + 7 * w.w1)} stroke="var(--danger)" strokeWidth={2.5} />} />
        <div>
          <LineChart series={[{ name: 'loss e', values: hist.length ? hist : [loss] }]} height={170} xLabel="iteration" yLabel="e = ½Σ(ŷ−y)²" />
          <p className="small">ŷ = {w.w0.toFixed(3)} + {w.w1.toFixed(3)}·x, loss = {Number.isFinite(loss) ? loss.toFixed(3) : '∞'}</p>
          <p className="small muted">Each step: w ← w − α·∂e/∂w, with ∂e/∂w₀ = Σ(ŷ−y) and ∂e/∂w₁ = Σ(ŷ−y)·x. For this data the loss curvature (largest Hessian eigenvalue ≈ 95.9) means any α above 2/95.9 ≈ 0.021 overshoots the valley and diverges. Try it.</p>
        </div>
      </div>
    </Widget>
  );
}

export function LogRegViz() {
  const [nNeg, setNNeg] = useState(10);
  const [weighted, setWeighted] = useState(false);
  const data = useMemo(() => twoClass(8, 100, nNeg, 2.0), [nNeg]);
  const [w, setW] = useState([0, 0, 0]);
  const [epochs, setEpochs] = useState(0);
  const cw: [number, number] = weighted ? [data.y.length / (2 * nNeg), data.y.length / (2 * 100)] : [1, 1];
  const train = (n: number) => {
    let cur = w;
    for (let i = 0; i < n; i++) cur = logisticStep(data.X, data.y, cur, 0.5, cw).w;
    setW(cur);
    setEpochs((e) => e + n);
  };
  const pred = data.X.map((x) => (sigmoid(w[0] + w[1] * x[0] + w[2] * x[1]) > 0.5 ? 1 : 0));
  let tp = 0, fp = 0, tn = 0, fn = 0;
  pred.forEach((p, i) => (p && data.y[i] ? tp++ : p ? fp++ : data.y[i] ? fn++ : tn++));
  const m = metrics({ tp, fp, tn, fn });
  const line = (X: (x: number) => number, Y: (y: number) => number) => {
    if (Math.abs(w[2]) < 1e-9) return null;
    const yAt = (x: number) => -(w[0] + w[1] * x) / w[2];
    return <line x1={X(0)} y1={Y(yAt(0))} x2={X(10)} y2={Y(yAt(10))} stroke="var(--text)" strokeWidth={2} />;
  };
  return (
    <Widget title="Logistic regression & class imbalance" icon="⚖️">
      <div className="row">
        <Slider label="normal samples (tumor fixed at 100)" min={5} max={100} step={5} value={nNeg} onChange={(v) => { setNNeg(v); setW([0, 0, 0]); setEpochs(0); }} />
        <label className="small"><input type="checkbox" checked={weighted} onChange={(e) => { setWeighted(e.target.checked); setW([0, 0, 0]); setEpochs(0); }} /> class-weighted loss</label>
        <button className="btn small primary" onClick={() => train(50)}>Train 50 epochs</button>
        <button className="btn small" onClick={() => { setW([0, 0, 0]); setEpochs(0); }}>Reset</button>
      </div>
      <div className="grid cols-2">
        <Scatter points={data.X} colors={data.y.map((c) => (c ? PALETTE[1] : PALETTE[0]))} domain={[0, 10, 0, 10]} extra={(X, Y) => line(X, Y)} />
        <div className="small">
          <p>Epochs: {epochs}. σ(z) = 1/(1+e<sup>−z</sup>) turns the linear score z = w₀ + w₁x₁ + w₂x₂ into a probability. Unlike the step function, it is differentiable, with σ′ = σ(1−σ), so gradient descent works.</p>
          <p>Recall (tumor) <b>{m.recall.toFixed(2)}</b> · Specificity (normal) <b>{m.specificity.toFixed(2)}</b> · Accuracy {m.accuracy.toFixed(2)} · MCC <b>{m.mcc.toFixed(2)}</b></p>
          <p className="muted">With 100 tumor vs few normal samples, the unweighted model sacrifices the minority class. Weighting each class's loss by N/(2·N<sub>class</sub>) makes errors on rare samples cost more, which is one standard fix in neural networks. Others are over/undersampling, synthetic samples (SMOTE, VAEs) and focal loss.</p>
        </div>
      </div>
    </Widget>
  );
}

export function SigmoidWidget() {
  const zs = Array.from({ length: 81 }, (_, i) => -8 + i * 0.2);
  return (
    <Widget title="Step vs sigmoid" icon="〽️">
      <LineChart xs={zs} series={[{ name: 'step(z)', values: zs.map((z) => (z > 0 ? 1 : 0)) }, { name: 'σ(z)', values: zs.map(sigmoid) }, { name: "σ'(z) = σ(1−σ)", values: zs.map((z) => sigmoid(z) * (1 - sigmoid(z))) }]} xLabel="z" height={190} />
    </Widget>
  );
}
