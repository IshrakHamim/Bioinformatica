import { useMemo, useState } from 'react';
import { approximatePatternMatching, cleanDna, findClumps, frequentWordsWithMismatches, hamming, kmerCounts, minimumSkew, reverseComplement, skewArray } from '../lib/bio/strings';
import { mulberry32 } from '../lib/bio/rng';
import { LineChart, Seq, Slider, Widget, rangesToMarks } from './ui';

export const VC_ORI =
  'ATCAATGATCAACGTAAGCTTCTAAGCATGATCAAGGTGCTCACACAGTTTATCCACAACCTGAGTGGATGACATCAAGATAGGTCGTTGTATCTCCTTCCTCTCGTACTCTCATGACCACGGAAAGATGATCAAGAGAGGATGATTTCTTGGCCATATCGCAATGAATACTTGTGACTTGTGCTTCCAATTGACATCTTCAGCGCCATATTGCGCTGGCCAAGGTGACGGAGCGGGATTACGAAAGCATGATCATGGCTGTTGTTCTGTTTATCTTGTTTTGACTGAGACTTGTTAGGATAGACGGTTTTTCATCACTGACTAGCCAAAGCCTTACTCTGCCTGACATCGACCGTAAATTGATAATGAATTTACATGCTTCCGCGACGATTTACCTCTTGATCATCGATCCGATTGAAGATCTTCAATTGTTAATTCTCTTGCCTCGACTCATAGCCATGATGAGCTCTTGATCATGTTTCCTTAACCCTCTATTTTTTACGGAAGAATGATCAAGCTGCTGCTCTTGATCATCGTTTC';

export function KmerCounter() {
  const [text, setText] = useState(VC_ORI);
  const [k, setK] = useState(9);
  const [rc, setRc] = useState(true);
  const dna = cleanDna(text);
  const top = useMemo(() => {
    const c = kmerCounts(dna, k);
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  }, [dna, k]);
  const [sel, setSel] = useState<string | null>('ATGATCAAG');
  const selected = sel && sel.length === k ? sel : top[0]?.[0];
  const ranges: { start: number; len: number; cls: string }[] = [];
  if (selected) {
    for (let i = 0; i + k <= dna.length; i++) {
      const w = dna.substr(i, k);
      if (w === selected) ranges.push({ start: i, len: k, cls: 'hl' });
      else if (rc && w === reverseComplement(selected)) ranges.push({ start: i, len: k, cls: 'hl2' });
    }
  }
  return (
    <Widget title="Frequent words in the Vibrio cholerae oriC" icon="🔎">
      <div className="row">
        <Slider label="k" min={3} max={12} value={k} onChange={setK} />
        <label className="small"><input type="checkbox" checked={rc} onChange={(e) => setRc(e.target.checked)} /> highlight reverse complement</label>
        <button className="btn small" onClick={() => setText(VC_ORI)}>Reset to V. cholerae oriC</button>
      </div>
      <div className="grid cols-2" style={{ marginTop: 8 }}>
        <div>
          <table className="mtable">
            <thead><tr><th>{k}-mer</th><th>count</th><th>reverse complement</th><th>its count</th></tr></thead>
            <tbody>
              {top.map(([w, c]) => (
                <tr key={w} onClick={() => setSel(w)} style={{ cursor: 'pointer' }}>
                  <td className={w === selected ? 'best' : ''}>{w}</td>
                  <td>{c}</td>
                  <td>{reverseComplement(w)}</td>
                  <td>{kmerCounts(dna, k).get(reverseComplement(w)) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted">Click a row to highlight it. In a random 500-nt string, a given 9-mer appearing 3+ times is very unlikely, so these repeats are suspicious.</p>
        </div>
        <div className="seq small" style={{ maxHeight: 240, overflowY: 'auto', fontSize: '0.78rem' }}>
          <Seq s={dna} marks={rangesToMarks(ranges)} />
        </div>
      </div>
      <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} aria-label="Sequence" style={{ marginTop: 8 }} />
      <p className="small">
        <span className="hl">yellow</span> = the k-mer, <span className="hl2">blue</span> = its reverse complement. ATGATCAAG and CTTGATCAT are reverse complements: together they appear 6 times. That is the DnaA box, which DnaA can bind on either strand.
      </p>
    </Widget>
  );
}

/** Synthetic circular genome whose G/C asymmetry mimics replication (minimum skew at ori). */
export function syntheticGenome(n: number, ori: number, seed: number, bias = 0.06) {
  const rng = mulberry32(seed);
  const ter = (ori + n / 2) % n;
  let s = '';
  for (let i = 0; i < n; i++) {
    // positions in [ter, ori) (going forward around the circle) are G-poor -> skew decreases
    const inDecreasing = ter < ori ? i >= ter && i < ori : i >= ter || i < ori;
    const pG = 0.25 + (inDecreasing ? -bias : bias);
    const pC = 0.5 - pG;
    const r = rng();
    s += r < pG ? 'G' : r < pG + pC ? 'C' : r < pG + pC + 0.25 ? 'A' : 'T';
  }
  return s;
}

export function SkewPlot({ length = '4000' }: { length?: string }) {
  const n = Number(length);
  const [seed, setSeed] = useState(7);
  const [custom, setCustom] = useState('');
  const [guess, setGuess] = useState<number | null>(null);
  const truth = useMemo(() => Math.floor(mulberry32(seed + 1)() * n), [seed, n]);
  const genome = custom ? cleanDna(custom) : syntheticGenome(n, truth, seed);
  const skew = useMemo(() => skewArray(genome), [genome]);
  const { positions, value } = useMemo(() => minimumSkew(genome), [genome]);
  const step = Math.max(1, Math.floor(skew.length / 600));
  const sampled = skew.filter((_, i) => i % step === 0);
  const xs = sampled.map((_, i) => i * step);
  return (
    <Widget
      title="Skew diagram: find oriC"
      icon="📉"
      actions={<button className="btn small" onClick={() => { setSeed((s) => s + 1); setCustom(''); setGuess(null); }}>New genome</button>}
    >
      <LineChart
        series={[{ name: 'Skew = #G − #C', values: sampled }]}
        xs={xs}
        xLabel="position i in genome"
        yLabel="Skew_i"
        markers={guess !== null ? [{ x: Math.round(guess / step), label: `your guess ${guess}` }] : []}
      />
      <div className="row">
        <Slider label="Guess where oriC is" min={0} max={genome.length} value={guess ?? 0} onChange={setGuess} />
        {guess !== null && (
          <span className={`pill ${Math.min(...positions.map((p) => Math.abs(p - guess))) < genome.length * 0.03 ? 'ok' : 'warn'}`}>
            Minimum skew {value} at position{positions.length > 1 ? 's' : ''} {positions.slice(0, 4).join(', ')}
            {positions.length > 4 ? '…' : ''}
          </span>
        )}
      </div>
      <details>
        <summary className="small">Paste your own genome (e.g. a FASTA sequence without the header)</summary>
        <textarea rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="ACGT..." />
      </details>
      <p className="small muted">
        The genome here is simulated: its G/C bias flips at a hidden origin and terminus, just like real bacterial genomes where cytosine deamination depletes C on one half-strand. Skew <b>decreases</b> along the reverse half-strand and <b>increases</b> along the forward half-strand, so oriC sits at the minimum and terC near the maximum.
      </p>
    </Widget>
  );
}

export function ApproxMatch() {
  const [text, setText] = useState('AACAAGCTGATAAACATTTAAAGAG');
  const [pat, setPat] = useState('AAAAA');
  const [d, setD] = useState(1);
  const t = cleanDna(text);
  const p = cleanDna(pat);
  const hits = p.length && p.length <= t.length ? approximatePatternMatching(t, p, d) : [];
  const fw = useMemo(() => (t.length <= 60 && p.length <= 7 ? frequentWordsWithMismatches(t, p.length, d) : null), [t, p.length, d]);
  return (
    <Widget title="Approximate pattern matching (Hamming distance ≤ d)" icon="≈">
      <div className="row">
        <label className="field"><span>Text</span><input className="mono" value={text} onChange={(e) => setText(e.target.value)} style={{ width: 320 }} /></label>
        <label className="field"><span>Pattern</span><input className="mono" value={pat} onChange={(e) => setPat(e.target.value)} style={{ width: 110 }} /></label>
        <Slider label="d (mismatches)" min={0} max={3} value={d} onChange={setD} />
      </div>
      <p>
        Count<sub>{d}</sub>(Text, {p}) = <b>{hits.length}</b>
      </p>
      <div className="col">
        {hits.map((h) => {
          const w = t.substr(h, p.length);
          return (
            <div key={h} className="seq small">
              <span className="muted">pos {String(h).padStart(2, ' ')}: </span>
              {w.split('').map((c, i) => (
                <span key={i} className={c === p[i] ? 'hl-good' : 'hl-bad'}>{c}</span>
              ))}
              <span className="muted"> (Hamming {hamming(w, p)})</span>
            </div>
          );
        })}
      </div>
      {fw && (
        <p className="small">
          Most frequent {p.length}-mer(s) with ≤ {d} mismatches: <b className="mono">{fw.words.slice(0, 6).join(', ')}</b> (count {fw.count}). This pattern does not have to occur exactly in the text.
        </p>
      )}
    </Widget>
  );
}

export function ClumpFinder() {
  const [k, setK] = useState(5);
  const [L, setL] = useState(50);
  const [t, setT] = useState(4);
  const text = 'CGGACTCGACAGATGTGAAGAACGACAATGTGAAGACTCGACACGACAGAGTGAAGAGAAGAGGAAACATTGTAA';
  const clumps = findClumps(text, k, L, t);
  return (
    <Widget title="Clump finding: (L, t)-clumps" icon="🧲">
      <div className="row">
        <Slider label="k" min={3} max={8} value={k} onChange={setK} />
        <Slider label="window L" min={10} max={75} value={L} onChange={setL} />
        <Slider label="t (min. occurrences)" min={2} max={6} value={t} onChange={setT} />
      </div>
      <div className="seq small"><Seq s={text} marks={rangesToMarks(clumps.flatMap((c) => { const out = []; for (let i = 0; i + k <= text.length; i++) if (text.substr(i, k) === c) out.push({ start: i, len: k, cls: 'hl' }); return out; }))} /></div>
      <p>k-mers forming ({L}, {t})-clumps: <b className="mono">{clumps.join(', ') || 'none'}</b></p>
      <p className="small muted">This is the Rosalind BA1E sample (k=5, L=50, t=4 gives CGACA and GAAGA). In E. coli, hundreds of 9-mers form (500, 3)-clumps, so clumps alone cannot pinpoint the DnaA box. That is why the skew diagram is needed to narrow the search.</p>
    </Widget>
  );
}

export function ReplicationFork() {
  const [t, setT] = useState(40);
  const W = 640;
  const ori = W / 2;
  const open = (t / 100) * 280;
  const frag = 46;
  const nFrag = Math.floor(open / frag);
  return (
    <Widget title="Replication: leading vs lagging strand" icon="🍴">
      <Slider label="time" min={0} max={100} value={t} onChange={setT} fmt={(v) => `${v}%`} />
      <svg viewBox={`0 0 ${W} 170`} style={{ width: '100%', height: 'auto' }}>
        <text x={ori} y={14} textAnchor="middle" fontSize="12" fontWeight="700">oriC</text>
        <line x1={ori} x2={ori} y1={18} y2={160} stroke="var(--danger)" strokeDasharray="3 3" />
        {/* parent strands */}
        <line x1={20} x2={ori - open} y1={70} y2={70} stroke="var(--text-dim)" strokeWidth={4} />
        <line x1={20} x2={ori - open} y1={100} y2={100} stroke="var(--text-dim)" strokeWidth={4} />
        <line x1={ori + open} x2={W - 20} y1={70} y2={70} stroke="var(--text-dim)" strokeWidth={4} />
        <line x1={ori + open} x2={W - 20} y1={100} y2={100} stroke="var(--text-dim)" strokeWidth={4} />
        <line x1={ori - open} x2={ori + open} y1={50} y2={50} stroke="var(--text-dim)" strokeWidth={4} />
        <line x1={ori - open} x2={ori + open} y1={120} y2={120} stroke="var(--text-dim)" strokeWidth={4} />
        <text x={24} y={64} fontSize="11">5′</text><text x={W - 34} y={64} fontSize="11">3′</text>
        <text x={24} y={115} fontSize="11">3′</text><text x={W - 34} y={115} fontSize="11">5′</text>
        {/* right fork: top template 5'->3' is read 3'->5'? leading on bottom, lagging on top */}
        <line x1={ori} x2={ori + open} y1={128} y2={128} stroke="var(--a)" strokeWidth={4} />
        <text x={ori + 6} y={145} fontSize="11" style={{ fill: 'var(--a)' }}>leading → (continuous)</text>
        {Array.from({ length: nFrag }, (_, i) => (
          <line key={i} x1={ori + i * frag + 4} x2={ori + (i + 1) * frag - 4} y1={42} y2={42} stroke="var(--c)" strokeWidth={4} />
        ))}
        <text x={ori + 6} y={34} fontSize="11" style={{ fill: 'var(--c)' }}>← Okazaki fragments (lagging)</text>
        {/* left fork mirrors */}
        <line x1={ori - open} x2={ori} y1={42} y2={42} stroke="var(--a)" strokeWidth={4} />
        {Array.from({ length: nFrag }, (_, i) => (
          <line key={i} x1={ori - (i + 1) * frag + 4} x2={ori - i * frag - 4} y1={128} y2={128} stroke="var(--c)" strokeWidth={4} />
        ))}
        <circle cx={ori + open} cy={85} r={7} fill="var(--g)" />
        <circle cx={ori - open} cy={85} r={7} fill="var(--g)" />
        <text x={ori + open + 10} y={89} fontSize="11">fork</text>
      </svg>
      <p className="small muted">
        DNA polymerase only builds new DNA 5′→3′ (reading the template 3′→5′). At each fork one new strand grows continuously toward the fork (leading). The other must be built backwards in ~2,000-nt Okazaki fragments (lagging) that DNA ligase later joins. The lagging-strand template stays single-stranded for longer, and single-stranded DNA mutates faster (C→T deamination). That is the origin of the G/C skew.
      </p>
    </Widget>
  );
}
