import { useMemo, useState } from 'react';
import { deBruijnFromKmers, degrees, eulerianPath, overlapGraph, spellPath } from '../lib/bio/assembly';
import { cleanDna, composition } from '../lib/bio/strings';
import { GraphView, type GEdge, type GNode } from './GraphView';
import { Seq, Slider, Stepper, Widget } from './ui';

const PRESETS: Record<string, string> = {
  mid: 'AGC ATG CAG CTG GCA GCT TGA TGC',
  slide: 'CTTA ACCA TACC GGCT GCTT TTAC',
  repeat: 'TAA AAT ATG TGC GCC CCA CAT ATG TGG GGA GAT ATG TGT GTT',
};

export function DeBruijnExplorer({ preset = 'mid' }: { preset?: string }) {
  const [input, setInput] = useState(PRESETS[preset] ?? PRESETS.mid);
  const [mode, setMode] = useState<'debruijn' | 'overlap'>('debruijn');
  const [step, setStep] = useState(0);
  const kmers = input.split(/[\s,]+/).map(cleanDna).filter(Boolean);
  const k = kmers[0]?.length ?? 0;
  const valid = kmers.length > 1 && kmers.every((x) => x.length === k) && k >= 2;
  const g = useMemo(() => (valid ? deBruijnFromKmers(kmers) : null), [input, valid]); // eslint-disable-line react-hooks/exhaustive-deps
  const euler = useMemo(() => (g ? eulerianPath(g) : null), [g]);
  const deg = g ? degrees(g) : null;
  const ov = useMemo(() => (valid ? overlapGraph(kmers) : null), [input, valid]); // eslint-disable-line react-hooks/exhaustive-deps
  const used = new Set(euler?.ok ? euler.edgeOrder.slice(0, step).map((e) => e.id) : []);
  const current = euler?.ok && step > 0 ? euler.edgeOrder[step - 1] : null;
  const spelled = euler?.ok ? spellPath(euler.nodePath.slice(0, step + 1)) : '';

  let nodes: GNode[] = [];
  let edges: GEdge[] = [];
  if (mode === 'debruijn' && g && deg) {
    nodes = g.nodes.map((n) => {
      const diff = deg.outdeg[n] - deg.indeg[n];
      return {
        id: n,
        r: 20,
        ring: diff === 1 ? 'var(--ok)' : diff === -1 ? 'var(--danger)' : 'var(--accent-2)',
        color: current && (current.from === n || current.to === n) ? 'var(--accent-soft)' : undefined,
      };
    });
    edges = g.edges.map((e) => ({
      from: e.from,
      to: e.to,
      label: e.label,
      key: e.id,
      color: current?.id === e.id ? 'var(--danger)' : used.has(e.id) ? 'var(--accent)' : 'var(--text-dim)',
      width: used.has(e.id) ? 3 : 1.6,
    }));
  } else if (ov) {
    nodes = ov.nodes.map((n) => ({ id: n, label: n.split('#')[0], r: 22 }));
    edges = ov.edges.map((e) => ({ from: e.from, to: e.to, key: e.id }));
  }

  return (
    <Widget title="Genome assembly graphs" icon="🕸️">
      <div className="row">
        <input className="mono" value={input} onChange={(e) => { setInput(e.target.value); setStep(0); }} style={{ flex: 1, minWidth: 260 }} aria-label="k-mers" />
        <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="debruijn">de Bruijn graph (k-mers = edges)</option>
          <option value="overlap">Overlap graph (k-mers = nodes)</option>
        </select>
      </div>
      <div className="row small" style={{ marginTop: 6 }}>
        Presets:
        <button className="btn small" onClick={() => { setInput(PRESETS.mid); setStep(0); }}>Mid exam</button>
        <button className="btn small" onClick={() => { setInput(PRESETS.slide); setStep(0); }}>Textbook 4-mers</button>
        <button className="btn small" onClick={() => { setInput(PRESETS.repeat); setStep(0); }}>With a repeat (ATG ×3)</button>
        <TextToKmers onKmers={(s) => { setInput(s); setStep(0); }} />
      </div>
      {!valid ? (
        <p className="callout warn">Enter at least two k-mers of equal length (k ≥ 2).</p>
      ) : (
        <>
          <GraphView nodes={nodes} edges={edges} directed seedKey={`${mode}|${input}`} height={360} />
          {mode === 'debruijn' && (
            <>
              <div className="legend" style={{ marginTop: 6 }}>
                <span style={{ ['--c' as string]: 'var(--ok)' }}>start: out = in + 1</span>
                <span style={{ ['--c' as string]: 'var(--danger)' }}>end: in = out + 1</span>
                <span style={{ ['--c' as string]: 'var(--accent-2)' }}>balanced</span>
              </div>
              {euler?.ok ? (
                <>
                  <Stepper step={step} max={euler.edgeOrder.length} setStep={setStep} label="edges walked (Hierholzer)" />
                  <div>Genome spelled so far: <Seq s={spelled} /></div>
                  {step === euler.edgeOrder.length && (
                    <p className="small">
                      ✓ Eulerian path uses all {euler.edgeOrder.length} edges, so the reconstructed string has length k + n − 1 = {k} + {kmers.length} − 1 = {spelled.length}. Check: its {k}-mer composition equals the input ({composition(spelled, k).join(' ') === [...kmers].sort().join(' ') ? 'yes' : 'no'}).
                    </p>
                  )}
                </>
              ) : (
                <p className="callout warn small">No Eulerian path: {euler?.reason}</p>
              )}
            </>
          )}
          {mode === 'overlap' && (
            <p className="small muted">Here each read is a node and we need a <b>Hamiltonian</b> path (visit every node once), which is NP-complete in general. The de Bruijn view turns the same problem into an <b>Eulerian</b> path (use every edge once), solvable in linear time.</p>
          )}
        </>
      )}
    </Widget>
  );
}

function TextToKmers({ onKmers }: { onKmers: (s: string) => void }) {
  const [t, setT] = useState('TAATGCCATGGGATGTT');
  const [k, setK] = useState(3);
  return (
    <span className="row">
      <input className="mono" value={t} onChange={(e) => setT(e.target.value)} style={{ width: 170 }} aria-label="genome to shred" />
      <input type="number" min={2} max={8} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ width: 54 }} aria-label="k" />
      <button className="btn small" onClick={() => onKmers(composition(cleanDna(t), k).join(' '))}>Shred into k-mers</button>
    </span>
  );
}

export function ReadBreaking() {
  const genome = 'TAATGCCATGGGATGTT';
  const reads = ['TAATGCCATG', 'ATGCCATGGG', 'CCATGGGATG', 'ATGGGATGTT'];
  const [k, setK] = useState(5);
  const all = new Set(composition(genome, k));
  const covered = new Set(reads.flatMap((r) => composition(r, k)));
  const missing = [...all].filter((x) => !covered.has(x));
  const g = deBruijnFromKmers([...covered]);
  return (
    <Widget title="Read breaking: trading coverage for tangles" icon="✂️">
      <Slider label="k used to break the 10-nt reads" min={3} max={10} value={k} onChange={setK} />
      <p className="small">Genome: <Seq s={genome} /> · Reads (10-mers): {reads.map((r) => <span key={r} className="mono" style={{ marginRight: 8 }}>{r}</span>)}</p>
      <div className="row">
        <span className={`pill ${missing.length ? 'warn' : 'ok'}`}>{all.size - missing.length}/{all.size} genome {k}-mers covered</span>
        <span className="pill">{g.nodes.length} nodes, {g.edges.length} edges</span>
        {missing.length > 0 && <span className="small">missing: <span className="mono">{missing.join(', ')}</span></span>}
      </div>
      <p className="small muted">The reads miss 10-mers of the genome (imperfect coverage), but once broken into 5-mers every 5-mer is covered. Smaller k gives better coverage but more repeated (k−1)-mers, so the graph gets more tangled.</p>
    </Widget>
  );
}
