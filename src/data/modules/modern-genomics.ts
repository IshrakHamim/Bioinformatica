import type { Module } from '../types';
import content from '../content/modern-genomics.md?raw';

const m: Module = {
  id: 'modern-genomics',
  track: 'frontiers',
  code: 'X3',
  title: 'Modern Genomics Beyond the Slides',
  subtitle: 'Variant calling, single-cell & spatial, comparative genomics, CRISPR, pangenomes',
  icon: '🗺️',
  color: '#f76707',
  hours: 2.5,
  prereqs: ['readmap', 'expression1', 'phylogeny'],
  content,
  concepts: ['variant-calling', 'spatial', 'trajectory', 'comparative-genomics', 'dnds', 'crispr', 'pangenome'],
  videos: [
    { id: 'q74euInZqm4', title: 'Spatial Transcriptomics', channel: 'Journal of Investigative Dermatology', why: 'Short methods overview.' },
    { id: '_qsHqB67O70', title: 'Spatial Transcriptomics Intro - Part 1', channel: 'Alex Soupir', why: 'Deeper technical intro.' },
    { id: '6tw_JVz_IEc', title: 'How CRISPR lets you edit DNA', channel: 'TED-Ed', why: 'Guide RNA, Cas9, PAM.' },
    { id: '4NAS1qTJmYA', title: 'How it Works | Chromium Single Cell Gene Expression Solution', channel: '10x Genomics', why: 'Droplet scRNA-seq.' },
  ],
  articles: [
    { title: 'Nurk et al. (2022) The complete sequence of a human genome', url: 'https://www.science.org/doi/10.1126/science.abj6987', source: 'Science', why: 'T2T-CHM13.' },
    { title: 'Liao et al. (2023) A draft human pangenome reference', url: 'https://www.nature.com/articles/s41586-023-05896-x', source: 'Nature', why: 'HPRC graph reference.' },
    { title: 'GATK Best Practices', url: 'https://gatk.broadinstitute.org/hc/en-us/sections/360007226651-Best-Practices-Workflows', source: 'Broad Institute', why: 'Standard variant-calling workflows.' },
    { title: 'Scanpy documentation & tutorials', url: 'https://scanpy.readthedocs.io/', source: 'scverse', why: 'Single-cell analysis in Python.' },
  ],
  quiz: [
    { id: 'q1', type: 'mcq', q: 'A heterozygous SNV typically appears in a read pileup as…', options: ['all reads with the alternate base', '~50% reads with the alternate base', 'no reads covering it', 'a drop in GC skew'], answer: 1, explain: 'One of the two chromosomes carries it.' },
    { id: 'q2', type: 'mcq', q: 'dN/dS < 1 suggests…', options: ['positive selection', 'purifying selection', 'no mutations', 'horizontal gene transfer'], answer: 1, explain: 'Non-synonymous changes are removed by selection.' },
    { id: 'q3', type: 'mcq', q: 'Why do sequencing-based spatial methods need deconvolution?', options: ['spots can contain several cells', 'reads are too long', 'genes are not barcoded', 'images are missing'], answer: 0, explain: 'Each capture spot mixes multiple cells.' },
    { id: 'q4', type: 'mcq', q: 'Designing CRISPR guides with few off-targets is mainly a problem of…', options: ['phylogeny', 'approximate string matching across the genome', 'clustering', 'HMM decoding'], answer: 1, explain: 'Find genomic sites within few mismatches of the guide (+PAM).' },
    { id: 'q5', type: 'tf', q: 'Orthologs arise by speciation; paralogs by gene duplication.', answer: true, explain: 'Standard definitions.' },
  ],
  flashcards: [
    { id: 'f1', front: 'SNV / indel / SV', back: 'Single-base change / small insertion-deletion / large structural rearrangement.' },
    { id: 'f2', front: 'DeepVariant', back: 'CNN that calls variants from pileup images.' },
    { id: 'f3', front: 'Spatial transcriptomics', back: 'Expression with tissue coordinates: sequencing-based (spots) or imaging-based (single-molecule FISH).' },
    { id: 'f4', front: 'Ortholog vs paralog', back: 'Ortholog: speciation. Paralog: duplication.' },
    { id: 'f5', front: 'dN/dS', back: '>1 positive selection, ≈1 neutral, <1 purifying.' },
    { id: 'f6', front: 'Pangenome graph', back: 'Reference representing many haplotypes as a sequence graph; reduces reference bias.' },
  ],
  mindmap: {
    label: 'Modern genomics',
    children: [
      { label: 'Variants', children: [{ label: 'SNV / indel / SV' }, { label: 'pileups, GATK, DeepVariant' }] },
      { label: 'Single cell', children: [{ label: 'clustering, UMAP' }, { label: 'trajectories' }] },
      { label: 'Spatial', children: [{ label: 'spots vs imaging' }, { label: 'deconvolution' }] },
      { label: 'Comparative', children: [{ label: 'orthologs/paralogs' }, { label: 'synteny' }, { label: 'dN/dS' }] },
      { label: 'CRISPR', children: [{ label: 'guide design' }, { label: 'screens, Perturb-seq' }] },
      { label: 'References', children: [{ label: 'T2T' }, { label: 'pangenome graphs' }] },
    ],
  },
  practice: [],
};
export default m;
