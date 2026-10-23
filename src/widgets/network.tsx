import { useMemo, useState } from 'react';
import { averagePathLength, barabasiAlbert, betweenness, closeness, clustering, components, diameter, edgesOf, erdosRenyi, fromEdges, girvanNewman, removeNode, type Graph } from '../lib/bio/network';
import { mulberry32 } from '../lib/bio/rng';
import { GraphView } from './GraphView';
import { LineChart, PALETTE, Stepper, Widget, fmt } from './ui';

export const QUIZ_GRAPHS: Record<string, [string, string][]> = {
  'Quiz graph G': [['A', 'B'], ['A', 'C'], ['B', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']],
  'Quiz graph J': [['P', 'Q'], ['Q', 'R'], ['R', 'S'], ['R', 'U'], ['S', 'T']],
  'Quiz graph K': [['V', 'W'], ['W', 'X'], ['W', 'Y'], ['X', 'Z']],
  'Two modules + bridge': [['a', 'b'], ['a', 'c'], ['b', 'c'], ['c', 'd'], ['b', 'd'], ['d', 'e'], ['e', 'f'], ['f', 'g'], ['f', 'h'], ['g', 'h'], ['g', 'i'], ['h', 'i']],
};

export function CentralityViz({ preset = 'Quiz graph G' }: { preset?: string }) {
  const [name, setName] = useState(preset);
  const [metric, setMetric] = useState<'degree' | 'closeness' | 'betweenness' | 'clustering'>('betweenness');
  const [sel, setSel] = useState<string | null>(null);
  const g = useMemo(() => fromEdges(QUIZ_GRAPHS[name]), [name]);
  const deg = Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.length]));
  const clo = closeness(g);
  const bet = betweenness(g);
  const cl = clustering(g);
  const vals: Record<string, number> = metric === 'degree' ? deg : metric === 'closeness' ? clo : metric === 'betweenness' ? bet : cl.local;
  const max = Math.max(...Object.values(vals), 1e-9);
  const nodes = Object.keys(g).sort();
  return (
    <Widget title="Network topology & centrality" icon="🕸️">
      <div className="row">
        <select value={name} onChange={(e) => setName(e.target.value)}>
          {Object.keys(QUIZ_GRAPHS).map((k) => <option key={k}>{k}</option>)}
        </select>
        <select value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)}>
          <option value="degree">Degree</option>
          <option value="closeness">Closeness</option>
          <option value="betweenness">Betweenness</option>
          <option value="clustering">Local clustering coefficient</option>
        </select>
        <span className="pill">diameter {diameter(g)}</span>
        <span className="pill">avg. path length {averagePathLength(g).toFixed(2)}</span>
        <span className="pill">transitivity {cl.transitivity.toFixed(2)}</span>
      </div>
      <div className="grid cols-2">
        <GraphView
          nodes={nodes.map((n) => ({ id: n, r: 14 + 12 * (vals[n] / max), color: `color-mix(in srgb, var(--accent) ${Math.round((vals[n] / max) * 80)}%, var(--bg-elev))`, ring: sel === n ? 'var(--danger)' : undefined }))}
          edges={edgesOf(g).map(([a, b]) => ({ from: a, to: b, color: sel && (a === sel || b === sel) ? 'var(--danger)' : undefined }))}
          seedKey={name}
          height={320}
          onNodeClick={setSel}
        />
        <div className="scroll-x">
          <table className="mtable">
            <thead><tr><th>node</th><th>degree</th><th>closeness</th><th>betweenness</th><th>clustering</th></tr></thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n} onClick={() => setSel(n)} style={{ cursor: 'pointer' }}>
                  <td className={sel === n ? 'best' : ''}>{n}</td>
                  <td>{deg[n]}</td>
                  <td>{fmt(clo[n], 3)}</td>
                  <td>{fmt(bet[n], 2)}</td>
                  <td>{fmt(cl.local[n], 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sel && (
            <p className="small">
              Closeness of {sel} = (n − 1) / Σ d({sel}, j) = {nodes.length - 1} / {Math.round((nodes.length - 1) / clo[sel])} = <b>{fmt(clo[sel], 3)}</b>
            </p>
          )}
          <p className="small muted">Betweenness = Σ over pairs (s, t) of (shortest s–t paths through v) / (all shortest s–t paths), counting each unordered pair once. A node on the only route between two parts (a bridge or bottleneck) scores high even with low degree.</p>
        </div>
      </div>
    </Widget>
  );
}

export function RobustnessViz() {
  const [n] = useState(120);
  const [seed, setSeed] = useState(1);
  const sf = useMemo(() => barabasiAlbert(n, 2, mulberry32(seed)), [n, seed]);
  const er = useMemo(() => erdosRenyi(n, 4 / n, mulberry32(seed + 7)), [n, seed]);
  const curve = (g0: Graph, targeted: boolean) => {
    const rng = mulberry32(seed + (targeted ? 3 : 5));
    let g = g0;
    const out: number[] = [];
    for (let removed = 0; removed <= n * 0.5; removed += 3) {
      const comps = components(g);
      out.push(comps.length ? Math.max(...comps.map((c) => c.length)) / n : 0);
      for (let r = 0; r < 3; r++) {
        const vs = Object.keys(g);
        if (!vs.length) break;
        const v = targeted ? vs.sort((a, b) => g[b].length - g[a].length)[0] : vs[Math.floor(rng() * vs.length)];
        g = removeNode(g, v);
      }
    }
    return out;
  };
  const xs = Array.from({ length: Math.floor((n * 0.5) / 3) + 1 }, (_, i) => (i * 3) / n);
  const degs = Object.values(sf).map((v) => v.length).sort((a, b) => b - a);
  return (
    <Widget title="Scale-free robustness: random failure vs targeted attack" icon="🛡️" actions={<button className="btn small" onClick={() => setSeed((s) => s + 1)}>New networks</button>}>
      <LineChart
        xs={xs}
        series={[
          { name: 'scale-free, random', values: curve(sf, false), color: PALETTE[0] },
          { name: 'scale-free, hubs first', values: curve(sf, true), color: PALETTE[1] },
          { name: 'random graph, hubs first', values: curve(er, true), color: PALETTE[2] },
        ]}
        xLabel="fraction of nodes removed"
        yLabel="largest component / n"
        height={230}
      />
      <p className="small">Barabási–Albert graph ({n} nodes, preferential attachment): the top hubs have degree {degs.slice(0, 3).join(', ')}, while the median node has degree {degs[Math.floor(degs.length / 2)]}. Random failures mostly hit low-degree nodes, so the network stays connected. Removing hubs first shatters it quickly. This is why hub proteins (e.g. p53) are often essential and are drug-target candidates.</p>
    </Widget>
  );
}

export function GirvanNewmanViz() {
  const g = useMemo(() => fromEdges(QUIZ_GRAPHS['Two modules + bridge']), []);
  const steps = useMemo(() => girvanNewman(g, 12), [g]);
  const [step, setStep] = useState(0);
  const removed = new Set(steps.slice(0, step).map((s) => s.removed.join('|')));
  const comps = step ? steps[step - 1].components : components(g);
  const colorOf = (v: string) => PALETTE[comps.findIndex((c) => c.includes(v)) % PALETTE.length];
  return (
    <Widget title="Girvan–Newman community detection" icon="✂️">
      <Stepper step={step} max={steps.length} setStep={setStep} label="edges removed" />
      <GraphView
        nodes={Object.keys(g).map((v) => ({ id: v, color: colorOf(v), r: 16 }))}
        edges={edgesOf(g).map(([a, b]) => ({ from: a, to: b, dashed: removed.has(`${a}|${b}`), color: removed.has(`${a}|${b}`) ? 'var(--border)' : undefined }))}
        seedKey="gn"
        height={300}
      />
      {step > 0 && <p className="small">Removed edge <b>{steps[step - 1].removed.join('–')}</b> (edge betweenness {fmt(steps[step - 1].score, 2)}) → {comps.length} component(s).</p>}
      <p className="small muted">Edges that bridge communities carry many shortest paths, so they have high edge betweenness. Remove the top edge, recompute, repeat. Here the bridge edges d–e and e–f each carry 20 shortest paths (4 × 5 node pairs), more than any edge inside a module, so they go first and split the modules.</p>
    </Widget>
  );
}
