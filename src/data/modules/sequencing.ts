import type { Module } from '../types';
import content from '../content/sequencing.md?raw';

const m: Module = {
  id: 'sequencing',
  track: 'cse443',
  code: 'L05',
  title: 'DNA Sequencing & Beyond',
  subtitle: 'Human Genome Project, sequencing by synthesis, errors, Phred & FASTQ, long reads',
  icon: '📸',
  color: '#0ca678',
  exam: 'mid',
  hours: 2.5,
  prereqs: ['intro'],
  content,
  concepts: ['hgp', 'sbs', 'phred', 'fastq', 'long-reads', 'seq-assays'],
  videos: [
    { id: 'fCd6B5HRaZ8', title: 'Overview of Illumina Sequencing by Synthesis Workflow', channel: 'Illumina', why: 'Official SBS animation.' },
    { id: 'bS3NiFLwPqE', title: 'Oxford Nanopore ONT Sequencing', channel: 'RobEdwards', why: 'How nanopore long reads work.' },
    { id: 'hpb-mH-yjLc', title: 'ADS1: Why study DNA sequencing and computational genomics?', channel: 'Ben Langmead', why: 'Context for the lecture deck (adapted from his slides).' },
  ],
  articles: [
    { title: 'Goodwin, McPherson & McCombie (2016) Coming of age: ten years of next-generation sequencing technologies', url: 'https://www.nature.com/articles/nrg.2016.49', source: 'Nature Reviews Genetics', why: 'Survey of short- and long-read platforms.' },
    { title: 'Ewing & Green (1998) Base-calling of automated sequencer traces using Phred. II. Error probabilities', url: 'https://doi.org/10.1101/gr.8.3.186', source: 'Genome Research', why: 'Where the Phred quality score comes from.' },
    { title: 'The Human Genome Project', url: 'https://www.genome.gov/human-genome-project', source: 'NHGRI', why: 'Timeline and facts.' },
    { title: 'Illumina sequencing technology', url: 'https://www.illumina.com/science/technology/next-generation-sequencing/sequencing-technology.html', source: 'Illumina', why: 'SBS chemistry explained by the vendor.' },
  ],
  quiz: [
    { id: 'q1', type: 'num', q: 'Phred Q for an error probability of 1/1000?', answer: 30, explain: 'Q = −10·log₁₀(0.001) = 30.' },
    { id: 'q2', type: 'num', q: 'Error probability for Q = 20 (as a decimal)?', answer: 0.01, tol: 0.0001, explain: '10^(−20/10) = 0.01.' },
    { id: 'q3', type: 'mcq', q: 'In Phred+33, the character "I" encodes Q = ?', options: ['33', '40', '73', '41'], answer: 1, explain: "ord('I') = 73; 73 − 33 = 40." },
    { id: 'q4', type: 'mcq', q: 'Why does Illumina base quality drop along the read?', options: ['Dyes fade from the slide', 'Copies in a cluster fall out of sync (phasing), mixing colors', 'DNA polymerase gets tired', 'Reads are sorted by quality'], answer: 1, explain: 'Phasing/pre-phasing accumulate each cycle.' },
    { id: 'q5', type: 'tf', q: 'Reversible terminators ensure each strand extends by exactly one base per cycle.', answer: true, explain: 'They are the “speed bumps” that keep reactions synchronized.' },
    { id: 'q6', type: 'mcq', q: 'Which agency first proposed the Human Genome Project (1987)?', options: ['NIH', 'U.S. Department of Energy', 'Wellcome Trust', 'Celera'], answer: 1, explain: 'As the slides emphasize: DOE, not NIH.' },
    { id: 'q7', type: 'mcq', q: 'First complete bacterial genome (1995)?', options: ['E. coli', 'Haemophilus influenzae', 'Vibrio cholerae', 'Mycoplasma genitalium'], answer: 1, explain: 'TIGR, ~1.8 Mb, by whole-genome shotgun.' },
    { id: 'q8', type: 'mcq', q: 'How many lines describe one read in FASTQ?', options: ['2', '3', '4', '6'], answer: 2, explain: '@name, sequence, +, quality string.' },
    { id: 'q9', type: 'mcq', q: 'Which technology produces the longest reads?', options: ['Sanger', 'Illumina', 'Oxford Nanopore', '454'], answer: 2, explain: 'Nanopore reads can exceed a megabase.' },
    { id: 'q10', type: 'num', q: 'p = 1/3 (3 of 9 light units are the wrong color). Q ≈ ? (2 decimals)', answer: 4.77, tol: 0.01, explain: '−10·log₁₀(1/3) = 4.77.' },
  ],
  flashcards: [
    { id: 'f1', front: 'Sequencing by synthesis (one cycle)', back: 'Add 4 dye-labelled reversible-terminator nucleotides → one base added → image → cleave dye & terminator.' },
    { id: 'f2', front: 'Cluster', back: 'Spot of identical copies of one template on the flow cell, made by bridge amplification.' },
    { id: 'f3', front: 'Phasing', back: 'Copies falling behind/ahead within a cluster; mixed signal lowers quality later in the read.' },
    { id: 'f4', front: 'Phred quality', back: 'Q = −10 log₁₀ p. Q20 = 1% error, Q30 = 0.1%.' },
    { id: 'f5', front: 'Phred+33', back: 'Store Q as chr(Q + 33); decode with ord(c) − 33.' },
    { id: 'f6', front: 'FASTQ', back: '@name / sequence / + / qualities (same length as sequence).' },
    { id: 'f7', front: 'Long-read platforms', back: 'PacBio HiFi (~15–25 kb, >99.9%) and Oxford Nanopore (up to Mb+).' },
    { id: 'f8', front: 'Whole-genome shotgun', back: 'Randomly fragment the whole genome, sequence, and assemble computationally (TIGR 1995, Celera).' },
  ],
  mindmap: {
    label: 'Sequencing',
    children: [
      { label: 'History', children: [{ label: 'HGP (1987/1990–2003)' }, { label: 'Celera shotgun' }, { label: 'T2T 2022' }] },
      { label: 'Illumina SBS', children: [{ label: 'clusters' }, { label: 'reversible terminators' }, { label: 'image each cycle' }] },
      { label: 'Errors', children: [{ label: 'phasing' }, { label: 'Phred Q = −10 log p' }, { label: 'quality drops along read' }] },
      { label: 'Files', children: [{ label: 'FASTA' }, { label: 'FASTQ + Phred+33' }] },
      { label: 'Long reads', children: [{ label: 'PacBio HiFi' }, { label: 'Nanopore' }] },
      { label: 'Assays', children: [{ label: 'WGS' }, { label: 'RNA-seq' }, { label: 'ChIP/ATAC' }] },
    ],
  },
  practice: [
    {
      id: 'p1',
      title: 'Decode a quality string',
      exam: 'mid',
      prompt: 'A read has quality string `II#5`. Give Q and the error probability of each base, and the expected number of errors in the read.',
      solution: "`I` → 73 − 33 = **40** (p = 10⁻⁴); `#` → 35 − 33 = **2** (p = 10^−0.2 ≈ 0.631); `5` → 53 − 33 = **20** (p = 0.01).\n\nExpected errors = 0.0001 + 0.0001 + 0.631 + 0.01 ≈ **0.64**. The third base is unreliable and would be trimmed or masked as N.",
    },
  ],
};
export default m;
