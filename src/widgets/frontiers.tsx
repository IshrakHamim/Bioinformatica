import { useEffect, useRef, useState } from 'react';
import { Widget } from './ui';

declare global {
  interface Window {
    $3Dmol?: {
      createViewer: (el: HTMLElement, cfg: Record<string, unknown>) => {
        addModel: (data: string, fmt: string) => void;
        setStyle: (sel: Record<string, unknown>, style: Record<string, unknown>) => void;
        zoomTo: () => void;
        render: () => void;
        clear: () => void;
        spin: (on: boolean | string) => void;
      };
    };
  }
}

const THREEDMOL = 'https://cdn.jsdelivr.net/npm/3dmol@2.4.2/build/3Dmol-min.js';
let loader: Promise<void> | null = null;
function load3Dmol(): Promise<void> {
  if (window.$3Dmol) return Promise.resolve();
  loader ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = THREEDMOL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load 3Dmol.js'));
    document.head.appendChild(s);
  });
  return loader;
}

// AlphaFold DB's published pLDDT colour scheme.
const plddtColor = (b: number) => (b > 90 ? '#0053D6' : b > 70 ? '#65CBF3' : b > 50 ? '#FFDB13' : '#FF7D45');

const EXAMPLES: { id: string; name: string; note: string }[] = [
  { id: 'P69905', name: 'Hemoglobin α (human)', note: 'Compact globular fold, almost entirely very-high confidence.' },
  { id: 'P04637', name: 'p53 tumour suppressor', note: 'Folded DNA-binding core, but long disordered N- and C-terminal tails (orange). Low pLDDT often marks intrinsically disordered regions.' },
  { id: 'P42212', name: 'Green fluorescent protein', note: 'Classic β-barrel.' },
  { id: 'P01308', name: 'Insulin (preproinsulin)', note: 'Small hormone precursor; the signal peptide and C-peptide are less confident.' },
  { id: 'P38398', name: 'BRCA1', note: 'Large, mostly disordered protein with small folded domains, a reminder that AlphaFold reports its uncertainty.' },
];

export function AlphaFoldViewer() {
  const ref = useRef<HTMLDivElement>(null);
  const [acc, setAcc] = useState('P69905');
  const [input, setInput] = useState('P69905');
  const [info, setInfo] = useState<{ gene?: string; desc?: string; organism?: string; mean?: number; frac?: number[]; len?: number; version?: number } | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        await load3Dmol();
        const meta = await (await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${acc}`)).json();
        const m = Array.isArray(meta) ? meta[0] : null;
        if (!m?.pdbUrl) throw new Error(`No AlphaFold model for ${acc}`);
        const pdb = await (await fetch(m.pdbUrl)).text();
        if (cancelled || !ref.current || !window.$3Dmol) return;
        ref.current.innerHTML = '';
        const v = window.$3Dmol.createViewer(ref.current, { backgroundColor: 'white', backgroundAlpha: 0 });
        v.addModel(pdb, 'pdb');
        v.setStyle({}, { cartoon: { colorfunc: (atom: { b: number }) => plddtColor(atom.b) } });
        v.zoomTo();
        v.render();
        setInfo({
          gene: m.gene, desc: m.uniprotDescription, organism: m.organismScientificName, mean: m.globalMetricValue,
          frac: [m.fractionPlddtVeryHigh, m.fractionPlddtConfident, m.fractionPlddtLow, m.fractionPlddtVeryLow], len: m.sequenceEnd, version: m.latestVersion,
        });
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [acc]);
  const ex = EXAMPLES.find((e) => e.id === acc);
  return (
    <Widget title="AlphaFold DB structure viewer (live from EMBL-EBI)" icon="🧊">
      <div className="row">
        {EXAMPLES.map((e) => (
          <button key={e.id} className={`btn small ${acc === e.id ? 'primary' : ''}`} onClick={() => { setAcc(e.id); setInput(e.id); }}>{e.name}</button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <input className="mono" value={input} onChange={(e) => setInput(e.target.value.toUpperCase().trim())} placeholder="UniProt accession, e.g. P69905" aria-label="UniProt accession" />
        <button className="btn small" onClick={() => setAcc(input)}>Load</button>
        <a className="small" href={`https://alphafold.ebi.ac.uk/entry/${acc}`} target="_blank" rel="noopener noreferrer">Open entry on AlphaFold DB ↗</a>
      </div>
      <div className="grid cols-2" style={{ marginTop: 10 }}>
        <div ref={ref} style={{ position: 'relative', width: '100%', height: 360, background: 'var(--bg-sunk)', borderRadius: 12 }}>
          <div className="center muted small" style={{ paddingTop: 160 }}>{loading ? 'Loading structure…' : ''}</div>
        </div>
        <div className="small">
          {err && <p className="callout warn">{err}. The viewer needs internet access to alphafold.ebi.ac.uk and cdn.jsdelivr.net.</p>}
          {info && (
            <>
              <p><b>{info.desc}</b> ({info.gene}), <i>{info.organism}</i>, {info.len} residues, model v{info.version}</p>
              <p>Mean pLDDT: <b>{info.mean?.toFixed(1)}</b></p>
              <div className="col">
                {['Very high (> 90)', 'Confident (70–90)', 'Low (50–70)', 'Very low (< 50)'].map((l, i) => (
                  <div key={l} className="row">
                    <span style={{ width: 14, height: 14, borderRadius: 3, background: ['#0053D6', '#65CBF3', '#FFDB13', '#FF7D45'][i], display: 'inline-block' }} />
                    <span style={{ width: 130 }}>{l}</span>
                    <b>{((info.frac?.[i] ?? 0) * 100).toFixed(1)}%</b>
                  </div>
                ))}
              </div>
              {ex && <p className="muted">{ex.note}</p>}
            </>
          )}
          <p className="muted">pLDDT (predicted local distance difference test) is AlphaFold's per-residue confidence, 0–100. Drag to rotate, scroll to zoom.</p>
        </div>
      </div>
    </Widget>
  );
}

const EVENTS: { year: string; title: string; detail: string; kind: 'seq' | 'algo' | 'ai' }[] = [
  { year: '1953', title: 'DNA double helix', detail: 'Watson & Crick (with Franklin & Wilkins’ X-ray data) propose the structure and hint at a copying mechanism.', kind: 'seq' },
  { year: '1970', title: 'Needleman–Wunsch', detail: 'Global alignment by dynamic programming.', kind: 'algo' },
  { year: '1977', title: 'Sanger sequencing; first genome', detail: 'Bacteriophage φX174 (5,386 nt) is the first DNA genome sequenced.', kind: 'seq' },
  { year: '1981', title: 'Smith–Waterman', detail: 'Local alignment.', kind: 'algo' },
  { year: '1990', title: 'BLAST', detail: 'Altschul et al.: seed-and-extend heuristic search; HGP officially launched the same year.', kind: 'algo' },
  { year: '1995', title: 'First bacterial genome', detail: 'Haemophilus influenzae (≈1.8 Mb) by whole-genome shotgun at TIGR.', kind: 'seq' },
  { year: '2001', title: 'Human genome drafts', detail: 'Public HGP (Nature) and Celera (Science) publish drafts.', kind: 'seq' },
  { year: '2005–08', title: 'Next-generation sequencing', detail: '454, Solexa/Illumina sequencing-by-synthesis: massively parallel short reads. de Bruijn assemblers (Velvet 2008) and BWT read mappers (Bowtie, BWA 2009) follow.', kind: 'seq' },
  { year: '2009', title: 'Single-cell RNA-seq', detail: 'Tang et al. profile the transcriptome of a single cell; droplet methods (Drop-seq, inDrop, 2015) scale it to thousands.', kind: 'seq' },
  { year: '2018', title: 'AlphaFold (v1) wins CASP13', detail: 'Deep learning predicts inter-residue distances.', kind: 'ai' },
  { year: '2020', title: 'AlphaFold 2 at CASP14', detail: 'Near-experimental accuracy for many targets; paper in Nature 2021 (Jumper et al.).', kind: 'ai' },
  { year: '2022', title: 'T2T human genome; AlphaFold DB > 200 M', detail: 'Telomere-to-telomere CHM13 assembly (Science) fills the last ~8% of the genome; AlphaFold DB expands to over 200 million predicted structures.', kind: 'seq' },
  { year: '2023', title: 'Pangenome, AlphaMissense, RFdiffusion, ESMFold', detail: 'HPRC draft human pangenome (Nature); AlphaMissense scores 71 M missense variants (Science); RFdiffusion designs new proteins (Nature); ESM-2/ESMFold (Science).', kind: 'ai' },
  { year: '2024', title: 'AlphaFold 3; Nobel Prize', detail: 'AlphaFold 3 (Nature) predicts complexes with DNA, RNA, ligands and ions via diffusion. Chemistry Nobel to Baker (design) and Hassabis & Jumper (AlphaFold).', kind: 'ai' },
  { year: '2025–26', title: 'Genomic foundation models', detail: 'Evo 2 (preprint Feb 2025, Nature 2026) models DNA across all domains of life; AlphaGenome (API June 2025, Nature Jan 2026) predicts regulatory effects of variants from 1 Mb of sequence.', kind: 'ai' },
];

export function Timeline() {
  const [kind, setKind] = useState<'all' | 'seq' | 'algo' | 'ai'>('all');
  const ev = EVENTS.filter((e) => kind === 'all' || e.kind === kind);
  const color = { seq: 'var(--a)', algo: 'var(--accent-2)', ai: '#ae3ec9' };
  return (
    <Widget title="Milestones: from the double helix to genomic AI" icon="🗓️">
      <div className="row">
        {(['all', 'seq', 'algo', 'ai'] as const).map((k) => (
          <button key={k} className={`btn small ${kind === k ? 'primary' : ''}`} onClick={() => setKind(k)}>{{ all: 'All', seq: 'Sequencing & genomes', algo: 'Algorithms', ai: 'AI / structure' }[k]}</button>
        ))}
      </div>
      <div style={{ borderLeft: '3px solid var(--border)', marginLeft: 10, paddingLeft: 18, marginTop: 12 }}>
        {ev.map((e) => (
          <div key={e.year + e.title} style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: -27, top: 5, width: 14, height: 14, borderRadius: 7, background: color[e.kind] }} />
            <b>{e.year}: {e.title}</b>
            <div className="small muted">{e.detail}</div>
          </div>
        ))}
      </div>
    </Widget>
  );
}
