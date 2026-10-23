import type { Module } from '../types';
import content from '../content/genomic-ai.md?raw';

const m: Module = {
  id: 'genomic-ai',
  track: 'frontiers',
  code: 'X2',
  title: 'Genomic AI & Foundation Models',
  subtitle: 'Representation & contrastive learning, Enformer, AlphaGenome, Evo 2, single-cell foundation models',
  icon: '🚀',
  color: '#e64980',
  hours: 2.5,
  prereqs: ['neural', 'motifs', 'hmm'],
  content,
  concepts: ['representation-learning', 'contrastive', 'seq2function', 'dna-lm', 'evo2', 'alphagenome', 'single-cell-fm', 'variant-effect'],
  videos: [
    { id: 'V8lhUqKqzUc', title: 'AlphaGenome author roundtable', channel: 'Google DeepMind', why: 'The authors explain AlphaGenome.' },
    { id: 'o_w-E--u7GQ', title: 'Building Evo 2: A Language Model for DNA Generation', channel: 'Arc Institute', why: 'Official Evo 2 overview.' },
    { id: 'Rarn97Wpl1A', title: 'Genome modeling and design across all domains of life with Evo 2', channel: 'Valence Labs', why: 'Full research talk.' },
    { id: 'uPoFdCUqBWk', title: 'Lecture 11 - Protein Language Models - MLCB24', channel: 'Manolis Kellis (MIT)', why: 'Language models in computational biology.' },
  ],
  articles: [
    { title: 'Advancing regulatory variant effect prediction with AlphaGenome (2026)', url: 'https://www.nature.com/articles/s41586-025-10014-0', source: 'Nature', why: 'AlphaGenome paper (open access).' },
    { title: 'Genome modeling and design across all domains of life with Evo 2 (2026)', url: 'https://doi.org/10.1038/s41586-026-10176-5', source: 'Nature', why: 'Evo 2 paper.' },
    { title: 'AI can now model and design the genetic code for all domains of life with Evo 2', url: 'https://arcinstitute.org/news/evo2', source: 'Arc Institute', why: 'Accessible announcement with numbers.' },
    { title: 'Avsec et al. (2021) Effective gene expression prediction from sequence by integrating long-range interactions (Enformer)', url: 'https://www.nature.com/articles/s41592-021-01252-x', source: 'Nature Methods', why: 'Transformer sequence-to-function model.' },
    { title: 'Dalla-Torre et al. (2025) Nucleotide Transformer', url: 'https://doi.org/10.1038/s41592-024-02523-z', source: 'Nature Methods', why: 'Genomic language model benchmark.' },
    { title: 'Theodoris et al. (2023) Transfer learning enables predictions in network biology (Geneformer)', url: 'https://www.nature.com/articles/s41586-023-06139-9', source: 'Nature', why: 'Single-cell foundation model.' },
    { title: 'Cui et al. (2024) scGPT', url: 'https://www.nature.com/articles/s41592-024-02201-0', source: 'Nature Methods', why: 'Generative pretraining on single-cell data.' },
  ],
  quiz: [
    { id: 'q1', type: 'mcq', q: 'Masked language modeling trains a model to…', options: ['predict hidden tokens from context', 'cluster sequences', 'align reads', 'compute skew'], answer: 0, explain: 'BERT-style objective (DNABERT, ESM-2, Nucleotide Transformer).' },
    { id: 'q2', type: 'mcq', q: 'Contrastive learning…', options: ['maximizes reconstruction error', 'pulls paired views together and pushes unrelated pairs apart in embedding space', 'requires labels for every sample', 'is the same as PCA'], answer: 1, explain: 'Used to align modalities and integrate datasets.' },
    { id: 'q3', type: 'mcq', q: 'AlphaGenome takes how much DNA as input?', options: ['1 kb', '100 kb', '1 Mb', 'a whole chromosome'], answer: 2, explain: '1-megabase input at single-base resolution output.' },
    { id: 'q4', type: 'mcq', q: 'Evo 2 is primarily…', options: ['a protein structure predictor', 'an autoregressive DNA language model across all domains of life', 'a read mapper', 'a phylogeny tool'], answer: 1, explain: '7B/40B parameters, 1M-token context.' },
    { id: 'q5', type: 'tf', q: 'Foundation models always outperform simple baselines in zero-shot benchmarks.', answer: false, explain: 'Independent evaluations show they sometimes do not; compare against strong baselines.' },
    { id: 'q6', type: 'mcq', q: 'Early CNN layers of sequence-to-function models often learn…', options: ['codon tables', 'motif-like filters (similar to PWMs)', 'phylogenetic trees', 'quality scores'], answer: 1, explain: 'They rediscover regulatory motifs.' },
  ],
  flashcards: [
    { id: 'f1', front: 'Representation learning recipe', back: 'Self-supervised pretraining on unlabeled data → reuse embeddings (fine-tune or linear probe).' },
    { id: 'f2', front: 'Contrastive learning', back: 'Learn embeddings where positive pairs are close and negatives far (e.g., CLIP-style alignment of modalities).' },
    { id: 'f3', front: 'Enformer', back: 'Transformer predicting regulatory tracks from ~100 kb DNA (Nature Methods 2021).' },
    { id: 'f4', front: 'AlphaGenome', back: '1 Mb DNA → base-resolution multimodal regulatory predictions; non-coding variant effects (Nature 2026).' },
    { id: 'f5', front: 'Evo 2', back: '7B/40B-parameter DNA model, 9.3T nucleotides, 128k+ genomes, 1M context; zero-shot BRCA1 variant classification; DNA generation.' },
    { id: 'f6', front: 'Geneformer / scGPT', back: 'Single-cell foundation models pretrained on tens of millions of cells.' },
  ],
  mindmap: {
    label: 'Genomic AI',
    children: [
      { label: 'Representations', children: [{ label: 'one-hot / k-mers' }, { label: 'dna2vec' }, { label: 'contextual embeddings' }] },
      { label: 'Objectives', children: [{ label: 'masked LM' }, { label: 'autoregressive' }, { label: 'contrastive' }, { label: 'VAE' }] },
      { label: 'Seq → function', children: [{ label: 'DeepSEA' }, { label: 'Enformer' }, { label: 'AlphaGenome' }] },
      { label: 'Language models', children: [{ label: 'DNABERT' }, { label: 'Nucleotide Transformer' }, { label: 'Evo 2' }] },
      { label: 'Single cell', children: [{ label: 'Geneformer' }, { label: 'scGPT' }] },
      { label: 'Caution', children: [{ label: 'baselines' }, { label: 'leakage' }] },
    ],
  },
  practice: [],
};
export default m;
