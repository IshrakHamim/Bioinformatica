import { useMemo, useState } from 'react';
import { NUC, cleanDna } from '../lib/bio/strings';
import { consensus, countMatrix, gibbsSampler, greedyMotifSearch, motifScore, profileEntropy, profileMatrix, profileMostProbable, randomizedMotifSearch, type Profile } from '../lib/bio/motifs';
import { mulberry32 } from '../lib/bio/rng';
import { LineChart, Matrix, Seq, Slider, Stepper, Widget, fmt, rangesToMarks } from './ui';

const NT_COLOR: Record<string, string> = { A: 'var(--a)', C: 'var(--c)', G: 'var(--g)', T: 'var(--t)' };

export function Logo({ profile }: { profile: Profile }) {
  const k = profile.A.length;
  const ent = profileEntropy(profile);
  const W = Math.max(300, k * 46);
  const H = 130;
  const cw = (W - 30) / k;
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', maxWidth: W, height: 'auto' }}>
      <line x1={26} x2={26} y1={4} y2={H} stroke="var(--border)" />
      <text x={4} y={12} fontSize="10" className="dim">2 bits</text>
      {Array.from({ length: k }, (_, j) => {
        const ic = 2 - ent[j];
        const letters = NUC.map((n) => ({ n, p: profile[n][j] })).filter((x) => x.p > 0).sort((a, b) => a.p - b.p);
        let y = H;
        return (
          <g key={j}>
            {letters.map(({ n, p }) => {
              const h = (p * ic * (H - 8)) / 2;
              y -= h;
              if (h < 1) return null;
              return (
                <text key={n} x={30 + j * cw + cw / 2} y={y + h} textAnchor="middle" fontWeight="900" fontFamily="var(--mono)" fontSize={100}
                  style={{ fill: NT_COLOR[n] }} transform={`translate(${30 + j * cw + cw / 2},${y + h}) scale(${(cw * 0.9) / 60},${h / 72}) translate(${-(30 + j * cw + cw / 2)},${-(y + h)})`}>
                  {n}
                </text>
              );
            })}
            <text x={30 + j * cw + cw / 2} y={H + 16} textAnchor="middle" fontSize="10" className="dim">{j + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

const MID_MOTIFS = 'ATCGT\nGTCCA\nCTAGT\nCTCCT\nCTCTG';

export function ProfileBuilder({ preset }: { preset?: string }) {
  const [txt, setTxt] = useState(preset === 'mid' ? MID_MOTIFS : 'TCGGGGGTTTTT\nCCGGTGACTTAC\nACGGGGATTTTC\nTTGGGGACTTTT\nAAGGGGACTTCC\nTTGGGGACTTCC\nTCGGGGATTCAT\nTCGGGGATTCCT\nTAGGGGAACTAC\nTCGGGTATAACC');
  const [pc, setPc] = useState(0);
  const [query, setQuery] = useState(preset === 'mid' ? 'ACCTGTTTAT' : 'ACGGGGATTACC');
  const motifs = txt.split(/\s+/).map(cleanDna).filter(Boolean);
  const k = motifs[0]?.length ?? 0;
  const valid = motifs.length > 0 && motifs.every((m) => m.length === k);
  const count = valid ? countMatrix(motifs, pc) : null;
  const prof = valid ? profileMatrix(motifs, pc) : null;
  const cons = valid ? consensus(motifs) : '';
  const ent = prof ? profileEntropy(prof) : [];
  const q = cleanDna(query);
  const mp = prof && q.length >= k ? profileMostProbable(q, k, prof) : null;
  return (
    <Widget title="Motif matrix → count, profile, consensus, score, logo" icon="🧱">
      <div className="grid cols-2">
        <div>
          <label className="field"><span>Motifs (one per line, equal length)</span>
            <textarea rows={Math.min(10, motifs.length + 1)} value={txt} onChange={(e) => setTxt(e.target.value)} />
          </label>
          <div className="row" style={{ marginTop: 6 }}>
            <Slider label="pseudocount added to every cell" min={0} max={2} step={1} value={pc} onChange={setPc} />
            <button className="btn small" onClick={() => setTxt(MID_MOTIFS)}>Load mid-exam matrix</button>
          </div>
        </div>
        <div>
          {valid ? (
            <>
              <div className="small"><b>Consensus:</b> <Seq s={cons} /> &nbsp; <b>Score(Motifs)</b> = {motifScore(motifs)} &nbsp; <b>Entropy</b> = {ent.reduce((a, b) => a + b, 0).toFixed(3)} bits</div>
              <Logo profile={prof!} />
            </>
          ) : (
            <p className="callout warn">All motifs must have the same length.</p>
          )}
        </div>
      </div>
      {valid && (
        <div className="grid cols-2" style={{ marginTop: 10 }}>
          <div>
            <b className="small">Count{pc ? ` (+${pc} pseudocount)` : ''}</b>
            <Matrix rows={[...NUC]} cols={Array.from({ length: k }, (_, j) => String(j + 1))} data={NUC.map((n) => count![n])} />
          </div>
          <div>
            <b className="small">Profile (column ÷ {motifs.length + 4 * pc})</b>
            <Matrix rows={[...NUC]} cols={Array.from({ length: k }, (_, j) => String(j + 1))} data={NUC.map((n) => prof![n])} format={(v) => fmt(v as number, 2)} cellClass={(i, j) => (prof![NUC[i]][j] === 0 ? 'dim' : '')} />
          </div>
        </div>
      )}
      {valid && (
        <div style={{ marginTop: 12 }}>
          <label className="field"><span>Find the profile-most-probable {k}-mer in:</span>
            <input className="mono" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 320 }} />
          </label>
          {mp && (
            <>
              <table className="mtable" style={{ marginTop: 6 }}>
                <thead><tr><th>pos</th><th>{k}-mer</th><th>Pr(k-mer | Profile)</th></tr></thead>
                <tbody>
                  {mp.all.map((r) => (
                    <tr key={r.pos}>
                      <td>{r.pos}</td>
                      <td className={r.pos === mp.best.pos && r.prob > 0 ? 'best' : ''}>{r.kmer}</td>
                      <td>{r.prob === 0 ? '0' : r.prob.toExponential(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mp.best.prob === 0 && (
                <p className="callout warn small">Every k-mer has probability 0, because each one contains at least one nucleotide that never appears in that column. This is exactly why we add <b>pseudocounts</b> (Laplace&apos;s rule of succession). Set the pseudocount slider to 1.</p>
              )}
            </>
          )}
        </div>
      )}
    </Widget>
  );
}

const SLIDE_DNA = ['ttACCTtaac', 'gATGTctgtc', 'acgGCGTtag', 'ccctaACGAg', 'cgtcagAGGT'];

function implant(t: number, n: number, motif: string, d: number, seed: number) {
  const rng = mulberry32(seed);
  const dna: string[] = [];
  const truth: number[] = [];
  for (let i = 0; i < t; i++) {
    let s = Array.from({ length: n }, () => 'ACGT'[Math.floor(rng() * 4)]).join('');
    const m = motif.split('');
    const pos = new Set<number>();
    while (pos.size < d) pos.add(Math.floor(rng() * m.length));
    pos.forEach((p) => (m[p] = 'ACGT'.replace(m[p], '')[Math.floor(rng() * 3)]));
    const at = Math.floor(rng() * (n - m.length));
    s = s.slice(0, at) + m.join('') + s.slice(at + m.length);
    dna.push(s);
    truth.push(at);
  }
  return { dna, truth };
}

export function MotifSearch() {
  const [algo, setAlgo] = useState<'greedy' | 'greedy+pc' | 'random' | 'gibbs'>('gibbs');
  const [dataset, setDataset] = useState<'slide' | 'implanted'>('implanted');
  const [seed, setSeed] = useState(3);
  const [step, setStep] = useState(0);
  const { dna, truth } = useMemo(
    () => (dataset === 'slide' ? { dna: SLIDE_DNA.map((s) => s.toUpperCase()), truth: [2, 1, 3, 5, 6] } : implant(8, 60, 'ACGTTAGCAT', 2, seed)),
    [dataset, seed],
  );
  const k = dataset === 'slide' ? 4 : 10;
  const frames = useMemo(() => {
    const rng = mulberry32(seed * 97 + 1);
    if (algo === 'greedy' || algo === 'greedy+pc') {
      const r = greedyMotifSearch(dna, k, algo === 'greedy' ? 0 : 1);
      let best = Infinity;
      return r.trace.map((t) => {
        best = Math.min(best, t.score);
        return { motifs: t.motifs, score: t.score, best, note: `Seed k-mer ${t.first} from string 1` };
      });
    }
    if (algo === 'random') {
      const out: { motifs: string[]; score: number; best: number; note: string }[] = [];
      let best = Infinity;
      for (let run = 0; run < 30; run++) {
        const r = randomizedMotifSearch(dna, k, rng);
        r.history.forEach((h, i) => {
          best = Math.min(best, h.score);
          out.push({ motifs: h.motifs, score: h.score, best, note: `Run ${run + 1}, iteration ${i}` });
        });
      }
      return out;
    }
    const r = gibbsSampler(dna, k, 400, rng);
    let best = Infinity;
    return r.steps.map((s, i) => {
      best = Math.min(best, s.score);
      return { motifs: s.motifs, score: s.score, best, note: `Iteration ${i + 1}: resampled string ${s.removed + 1} → ${s.chosen}` };
    });
  }, [algo, dna, k, seed]);
  const f = frames[Math.min(step, frames.length - 1)];
  return (
    <Widget title="Motif finding race: greedy vs randomized vs Gibbs" icon="🏁">
      <div className="row">
        <select value={algo} onChange={(e) => { setAlgo(e.target.value as typeof algo); setStep(0); }}>
          <option value="greedy">GreedyMotifSearch (no pseudocounts)</option>
          <option value="greedy+pc">GreedyMotifSearch + pseudocounts</option>
          <option value="random">RandomizedMotifSearch × 30 runs</option>
          <option value="gibbs">GibbsSampler (400 iterations)</option>
        </select>
        <select value={dataset} onChange={(e) => { setDataset(e.target.value as typeof dataset); setStep(0); }}>
          <option value="implanted">8 × 60-nt strings, implanted (10, 2)-motif ACGTTAGCAT</option>
          <option value="slide">Slide example: (4,1)-motif ACGT</option>
        </select>
        <button className="btn small" onClick={() => { setSeed((s) => s + 1); setStep(0); }}>New random seed</button>
      </div>
      <Stepper step={step} max={frames.length - 1} setStep={setStep} speed={algo === 'gibbs' ? 60 : 300} />
      <div className="small muted">{f.note}</div>
      <div className="col" style={{ marginTop: 6 }}>
        {dna.map((s, i) => {
          const at = s.indexOf(f.motifs[i]);
          return (
            <div key={i} className="seq small">
              <Seq s={s} marks={rangesToMarks([{ start: truth[i], len: k, cls: 'hl2' }, ...(at >= 0 ? [{ start: at, len: k, cls: 'hl' }] : [])])} />
            </div>
          );
        })}
      </div>
      <div className="row small" style={{ marginTop: 6 }}>
        <span className="pill">current Score = {f.score}</span>
        <span className="pill accent">best so far = {f.best}</span>
        <span className="pill">consensus = <b className="mono">{consensus(f.motifs)}</b></span>
        <span><span className="hl">yellow</span> = chosen motifs, <span className="hl2">blue</span> = truly implanted</span>
      </div>
      <LineChart series={[{ name: 'current score', values: frames.slice(0, step + 1).map((x) => x.score) }, { name: 'best', values: frames.slice(0, step + 1).map((x) => x.best) }]} height={160} xLabel="step" yLabel="Score" />
    </Widget>
  );
}
