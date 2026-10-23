import { useEffect, useMemo, useRef, useState } from 'react';
import { pca, tsne, type Vec } from '../lib/bio/dimred';
import { mulberry32 } from '../lib/bio/rng';
import { PALETTE, Scatter, Slider, Widget } from './ui';

export function PCAViz() {
  const [corr, setCorr] = useState(0.8);
  const [angle, setAngle] = useState(10);
  const data = useMemo(() => {
    const rng = mulberry32(11);
    const g = () => Math.sqrt(-2 * Math.log(rng() + 1e-12)) * Math.cos(2 * Math.PI * rng());
    return Array.from({ length: 80 }, () => {
      const a = g() * 2;
      const b = g() * 2;
      return [5 + a, 5 + corr * a + Math.sqrt(1 - corr * corr) * b];
    });
  }, [corr]);
  const r = useMemo(() => pca(data, 2), [data]);
  const t = (angle * Math.PI) / 180;
  const u = [Math.cos(t), Math.sin(t)];
  const proj = data.map((p) => (p[0] - r.mean[0]) * u[0] + (p[1] - r.mean[1]) * u[1]);
  const varU = proj.reduce((s, x) => s + x * x, 0) / (proj.length - 1);
  const recon = data.reduce((s, p, i) => s + (p[0] - (r.mean[0] + proj[i] * u[0])) ** 2 + (p[1] - (r.mean[1] + proj[i] * u[1])) ** 2, 0) / data.length;
  const pc1 = r.components[0].vector;
  const pcAngle = ((Math.atan2(pc1[1], pc1[0]) * 180) / Math.PI + 180) % 180;
  return (
    <Widget title="PCA: maximize variance = minimize reconstruction error" icon="🧭">
      <div className="row">
        <Slider label="correlation between genes" min={0} max={0.99} step={0.01} value={corr} onChange={setCorr} />
        <Slider label="your projection direction" min={0} max={180} value={angle} onChange={setAngle} fmt={(v) => `${v}°`} />
        <button className="btn small" onClick={() => setAngle(Math.round(pcAngle))}>Snap to PC1</button>
      </div>
      <div className="grid cols-2">
        <Scatter
          points={data}
          domain={[-2, 12, -2, 12]}
          extra={(X, Y) => (
            <g>
              {data.map((p, i) => (
                <line key={i} x1={X(p[0])} y1={Y(p[1])} x2={X(r.mean[0] + proj[i] * u[0])} y2={Y(r.mean[1] + proj[i] * u[1])} stroke="var(--danger)" opacity={0.35} />
              ))}
              <line x1={X(r.mean[0] - 8 * u[0])} y1={Y(r.mean[1] - 8 * u[1])} x2={X(r.mean[0] + 8 * u[0])} y2={Y(r.mean[1] + 8 * u[1])} stroke="var(--g)" strokeWidth={2.5} />
              <line x1={X(r.mean[0] - 6 * pc1[0])} y1={Y(r.mean[1] - 6 * pc1[1])} x2={X(r.mean[0] + 6 * pc1[0])} y2={Y(r.mean[1] + 6 * pc1[1])} stroke="var(--ok)" strokeWidth={1.5} strokeDasharray="6 4" />
            </g>
          )}
        />
        <div className="small">
          <p>Orange line = your direction u. Red segments = reconstruction errors. Dashed green = PC1 (top eigenvector of the covariance matrix).</p>
          <p>Variance of the projection onto u: <b>{varU.toFixed(3)}</b><br />Mean squared reconstruction error: <b>{recon.toFixed(3)}</b><br />Total variance (constant): {(r.components[0].value + r.components[1].value).toFixed(3)}</p>
          <p>PC1 explains <b>{(r.explained[0] * 100).toFixed(1)}%</b>, PC2 <b>{(r.explained[1] * 100).toFixed(1)}%</b>.</p>
          <p className="muted">Variance captured + reconstruction error ≈ total variance, so maximizing one minimizes the other. That is why the slide gives two equivalent definitions of PCA.</p>
        </div>
      </div>
    </Widget>
  );
}

function highDimClusters(seed: number) {
  const rng = mulberry32(seed);
  const g = () => Math.sqrt(-2 * Math.log(rng() + 1e-12)) * Math.cos(2 * Math.PI * rng());
  const dim = 10;
  const centers = Array.from({ length: 4 }, () => Array.from({ length: dim }, () => g() * 4));
  const labels: number[] = [];
  const data: Vec[] = [];
  centers.forEach((c, ci) => {
    const spread = ci === 3 ? 2.2 : 0.8; // one sparser "cell type"
    for (let i = 0; i < 25; i++) {
      data.push(c.map((v) => v + g() * spread));
      labels.push(ci);
    }
  });
  return { data, labels };
}

export function TSNEViz() {
  const [perp, setPerp] = useState(15);
  const [seed, setSeed] = useState(1);
  const { data, labels } = useMemo(() => highDimClusters(seed), [seed]);
  const pc = useMemo(() => pca(data, 2).scores, [data]);
  const [Y, setY] = useState<Vec[] | null>(null);
  const [info, setInfo] = useState({ iter: 0, cost: 0 });
  const [running, setRunning] = useState(false);
  const gen = useRef<Generator<{ Y: Vec[]; iter: number; cost: number }> | null>(null);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const r = gen.current?.next();
      if (!r || r.done) {
        setRunning(false);
        return;
      }
      setY(r.value.Y);
      setInfo({ iter: r.value.iter, cost: r.value.cost });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  const start = () => {
    gen.current = tsne(data, { perplexity: perp, iters: 600, lr: 100, rng: mulberry32(seed + 5), chunk: 5 });
    setRunning(true);
  };
  const colors = labels.map((l) => PALETTE[l]);
  return (
    <Widget title="t-SNE vs PCA on 100 simulated cells (10 genes each)" icon="🌌">
      <div className="row">
        <Slider label="perplexity (≈ effective number of neighbors)" min={2} max={40} value={perp} onChange={setPerp} />
        <button className="btn small primary" onClick={start} disabled={running}>{running ? 'Running…' : '▶ Run t-SNE'}</button>
        <button className="btn small" onClick={() => { setSeed((s) => s + 1); setY(null); }}>New data</button>
        <span className="small muted">iteration {info.iter}, KL(P‖Q) = {info.cost.toFixed(3)}</span>
      </div>
      <div className="grid cols-2">
        <div>
          <b className="small">PCA (linear, preserves global variance)</b>
          <Scatter points={pc} colors={colors} radius={4} />
        </div>
        <div>
          <b className="small">t-SNE (non-linear, preserves neighborhoods)</b>
          {Y ? <Scatter points={Y} colors={colors} radius={4} /> : <div className="center muted small" style={{ padding: 60 }}>Press “Run t-SNE”. Points start at random positions and are pulled together by neighbors and pushed apart by everyone else.</div>}
        </div>
      </div>
      <p className="small muted">
        Colors are the true cell types (t-SNE never sees them). Notes: (1) the first 100 iterations use “early exaggeration” (P × 4) to form tight clusters; (2) cluster sizes and gaps in t-SNE are not meaningful, because the sparse purple type looks as compact as the others; (3) very low perplexity fragments clusters, high perplexity merges them.
      </p>
    </Widget>
  );
}
