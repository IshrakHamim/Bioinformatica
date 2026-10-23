import type { Module } from '../types';
import content from '../content/tools.md?raw';

const m: Module = {
  id: 'tools',
  track: 'foundations',
  code: 'F3',
  title: 'Data, Formats & Tools',
  subtitle: 'Databases, FASTA/FASTQ/SAM/VCF, pipelines, Gene Ontology, Python stack',
  icon: '🗄️',
  color: '#868e96',
  hours: 2,
  prereqs: ['intro'],
  content,
  concepts: ['databases', 'file-formats', 'pipelines', 'gene-ontology', 'enrichment'],
  videos: [
    { id: 'tlf6wYJrwKY', title: 'StatQuest: A gentle introduction to RNA-seq', channel: 'StatQuest with Josh Starmer', why: 'Pipeline intuition.' },
    { id: '6oHl7hNWn2o', title: 'Learn Bioinformatics through Coding on ROSALIND Platform', channel: 'Data Professor', why: 'Getting started with Rosalind.' },
  ],
  articles: [
    { title: 'Gene Ontology Resource', url: 'https://geneontology.org/', source: 'GO Consortium', why: 'Ontology and enrichment tools.' },
    { title: 'UniProt', url: 'https://www.uniprot.org/', source: 'UniProt', why: 'Protein knowledgebase.' },
    { title: 'Ensembl genome browser', url: 'https://www.ensembl.org/', source: 'EMBL-EBI', why: 'Genomes, genes, variants.' },
    { title: 'Biopython tutorial', url: 'https://biopython.org/DIST/docs/tutorial/Tutorial.html', source: 'Biopython', why: 'Parsing and analysing sequences in Python.' },
    { title: 'nf-core pipelines', url: 'https://nf-co.re/', source: 'nf-core', why: 'Community-curated, reproducible Nextflow pipelines.' },
  ],
  quiz: [
    { id: 'q1', type: 'mcq', q: 'Which format stores read alignments with CIGAR strings?', options: ['FASTA', 'FASTQ', 'SAM/BAM', 'VCF'], answer: 2, explain: 'SAM/BAM records alignment position, CIGAR, MAPQ.' },
    { id: 'q2', type: 'mcq', q: 'Which database holds experimentally determined 3D structures?', options: ['PDB', 'SRA', 'GEO', 'dbSNP'], answer: 0, explain: 'AlphaFold DB holds predicted ones.' },
    { id: 'q3', type: 'mcq', q: 'The three GO ontologies are…', options: ['DNA, RNA, protein', 'Biological Process, Molecular Function, Cellular Component', 'Gene, Pathway, Disease', 'Exon, Intron, UTR'], answer: 1, explain: 'BP, MF, CC.' },
    { id: 'q4', type: 'mcq', q: 'Variant calls are stored in…', options: ['BED', 'VCF', 'GTF', 'Newick'], answer: 1, explain: 'Variant Call Format.' },
  ],
  flashcards: [
    { id: 'f1', front: 'FASTA vs FASTQ', back: 'FASTA: >header + sequence. FASTQ: @name, sequence, +, qualities.' },
    { id: 'f2', front: 'CIGAR', back: 'Run-length alignment string in SAM, e.g. 50M2I48M (match, insertion…).' },
    { id: 'f3', front: 'GO enrichment', back: 'Is a GO term over-represented in my gene list? Hypergeometric/Fisher test + FDR correction.' },
    { id: 'f4', front: 'RNA-seq pipeline', back: 'QC → align/pseudo-align → counts → normalize → DE (DESeq2) → enrichment.' },
  ],
  mindmap: {
    label: 'Data & tools',
    children: [
      { label: 'Databases', children: [{ label: 'GenBank/SRA' }, { label: 'UniProt/PDB/AFDB' }, { label: 'GEO' }, { label: 'STRING/KEGG' }] },
      { label: 'Formats', children: [{ label: 'FASTA/FASTQ' }, { label: 'SAM/BAM' }, { label: 'VCF/BED/GTF' }, { label: 'PDB/mmCIF' }] },
      { label: 'Pipelines', children: [{ label: 'variant calling' }, { label: 'RNA-seq' }, { label: 'scRNA-seq' }] },
      { label: 'Interpretation', children: [{ label: 'Gene Ontology' }, { label: 'pathways, GSEA' }] },
    ],
  },
  practice: [],
};
export default m;
