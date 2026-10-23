import { useMemo, useState } from 'react';
import { mulberry32 } from '../lib/bio/rng';
import { phred33Char, phred33ToQ, phredToProb, probToPhred } from '../lib/bio/strings';
import { Bars, Seq, Slider, Widget } from './ui';

const COLORS: Record<string, string> = { A: 'var(--a)', C: 'var(--c)', G: 'var(--g)', T: 'var(--t)' };

/**
 * Each cluster holds many copies of one template. Every cycle each copy adds one terminated,
 * fluorescent base; a copy that fails to incorporate (phasing) or skips ahead (pre-phasing)
 * drifts out of sync, so the cluster's light gets mixed and the call gets uncertain.
 */
export function SBSSimulator() {
  const [cycle, setCycle] = useState(1);
  const [phase, setPhase] = useState(1.5);
  const templates = ['GATACCATGA', 'CCGTAAGCTT', 'TTGACGGATC'];
  const copies = 60;
  const sim = useMemo(() => {
    const rng = mulberry32(42);
    return templates.map((tpl) => {
      const pos = new Array(copies).fill(0);
      const perCycle: { counts: Record<string, number>; call: string; q: number }[] = [];
      for (let c = 0; c < tpl.length; c++) {
        for (let i = 0; i < copies; i++) {
          const r = rng() * 100;
          if (r < phase) continue; // lagging copy: no incorporation this cycle
          pos[i] += r < phase * 1.4 ? 2 : 1; // small chance of skipping ahead
        }
        const counts: Record<string, number> = { A: 0, C: 0, G: 0, T: 0 };
        for (const p of pos) if (p >= 1 && p <= tpl.length) counts[tpl[p - 1]]++;
        const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
        const call = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        const pErr = Math.max(1 - counts[call] / total, 1e-4);
        perCycle.push({ counts, call, q: Math.min(41, Math.round(probToPhred(pErr))) });
      }
      return { tpl, perCycle };
    });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Widget title="Sequencing by synthesis (Illumina-style) with phasing errors" icon="📸">
      <div className="row">
        <Slider label="cycle" min={1} max={10} value={cycle} onChange={setCycle} />
        <Slider label="% copies falling out of sync per cycle" min={0} max={12} step={0.5} value={phase} onChange={setPhase} />
      </div>
      <div className="grid cols-3" style={{ marginTop: 8 }}>
        {sim.map(({ tpl, perCycle }, ci) => {
          const pc = perCycle[cycle - 1];
          const total = Object.values(pc.counts).reduce((a, b) => a + b, 0) || 1;
          return (
            <div key={ci} className="card" style={{ padding: 12 }}>
              <div className="small muted">Cluster {ci + 1} (true template <span className="mono">{tpl}</span>)</div>
              <div style={{ display: 'flex', gap: 2, height: 26, margin: '8px 0', borderRadius: 6, overflow: 'hidden' }}>
                {Object.entries(pc.counts).map(([b, n]) => (
                  <div key={b} title={`${b}: ${n}`} style={{ width: `${(n / total) * 100}%`, background: COLORS[b] }} />
                ))}
              </div>
              <div className="small">Snapshot light → call <b className={`nt-${pc.call}`}>{pc.call}</b>, Q = <b>{pc.q}</b> ({(phredToProb(pc.q) * 100).toFixed(2)}% error)</div>
              <div className="seq small">Read so far: {perCycle.slice(0, cycle).map((x, i) => <span key={i} className={`nt-${x.call} ${x.call !== tpl[i] ? 'hl-bad' : ''}`}>{x.call}</span>)}</div>
              <div className="mono tiny muted">Qual: {perCycle.slice(0, cycle).map((x) => phred33Char(x.q)).join('')}</div>
            </div>
          );
        })}
      </div>
      <p className="small muted">
        Each cycle: add all four reversibly-terminated fluorescent nucleotides → each strand extends by exactly one base → photograph the slide → cleave the terminator and dye → repeat. Copies that miss a cycle (or jump ahead) emit the wrong color. The mix grows with every cycle, so base quality drops along the read. Watch the quality string decline at high error settings.
      </p>
    </Widget>
  );
}

export function PhredWidget() {
  const [q, setQ] = useState(30);
  const [rec, setRec] = useState('@ERR194146.1 HSQ1008:141:D0CC8ACXX:3:1308:20201:36071/1\nACATCTGGTTCCTACTTCAGGGCCATAAAGCCTAAATAGCCCACACGTTCCCCTTAAAT\n+\n?@@FFBFFDDHHBCEAFGEGIIDHGH@GDHHHGEHID@C?GGDG@FHIGGH@FHBEG:G');
  const lines = rec.trim().split('\n');
  const seq = lines[1] ?? '';
  const qual = lines[3] ?? '';
  const qs = qual.split('').map(phred33ToQ);
  return (
    <Widget title="Phred quality & FASTQ decoder" icon="🔢">
      <div className="row">
        <Slider label="Q" min={0} max={41} value={q} onChange={setQ} />
        <span className="pill accent">P(error) = 10^(−Q/10) = {phredToProb(q).toPrecision(3)}</span>
        <span className="pill">1 error in {Math.round(1 / phredToProb(q)).toLocaleString()}</span>
        <span className="pill">Phred+33 character: <b className="mono">{phred33Char(q)}</b> (ASCII {q + 33})</span>
      </div>
      <label className="field" style={{ marginTop: 10 }}><span>FASTQ record (4 lines: @name, sequence, +, qualities)</span>
        <textarea rows={4} value={rec} onChange={(e) => setRec(e.target.value)} />
      </label>
      {seq.length === qual.length && seq.length > 0 ? (
        <>
          <div className="scroll-x" style={{ marginTop: 8 }}>
            <table className="mtable">
              <tbody>
                <tr><th>base</th>{seq.split('').map((c, i) => <td key={i}><Seq s={c} /></td>)}</tr>
                <tr><th>char</th>{qual.split('').map((c, i) => <td key={i}>{c}</td>)}</tr>
                <tr><th>Q</th>{qs.map((x, i) => <td key={i} style={{ background: x < 20 ? 'rgba(209,67,91,0.25)' : undefined }}>{x}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <Bars labels={qs.map((_, i) => String(i + 1))} values={qs} height={140} fmtV={() => ''} />
          <p className="small muted">Mean Q = {(qs.reduce((a, b) => a + b, 0) / qs.length).toFixed(1)}. Bases with Q &lt; 20 (shaded) have more than a 1% chance of being wrong. Quality trimming tools cut such tails before mapping.</p>
        </>
      ) : (
        <p className="callout warn small">Sequence and quality lines must have equal length.</p>
      )}
    </Widget>
  );
}
