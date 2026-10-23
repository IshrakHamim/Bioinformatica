You are about to start research. This module is the practical layer the lectures skip: where biological data live, what the files look like, and which tools you'll actually run.

## Databases you will use

| Data | Database | Notes |
|---|---|---|
| Nucleotide sequences | **GenBank / ENA / DDBJ** (INSDC) | mirrored worldwide |
| Raw reads | **SRA** (NCBI), ENA | FASTQ via SRA Toolkit |
| Reference genomes & annotation | **NCBI RefSeq**, **Ensembl**, **UCSC Genome Browser** | GRCh38, T2T-CHM13 |
| Proteins | **UniProt** (Swiss-Prot curated, TrEMBL automatic) | function, domains, GO |
| Structures | **PDB** (experimental), **AlphaFold DB** (predicted) | 3D coordinates |
| Expression | **GEO**, **ArrayExpress/BioStudies**, recount3, ARCHS4 | microarray + RNA-seq |
| Single cell | CELLxGENE, Human Cell Atlas | annotated cell atlases |
| Variants | dbSNP, ClinVar, gnomAD | population & clinical variants |
| Domains/families | Pfam (InterPro), PROSITE | profile HMMs |
| Interactions & pathways | STRING, BioGRID, KEGG, Reactome | networks |
| Ontology | **Gene Ontology (GO)** | function terms for enrichment |

## File formats

- **FASTA:** `>header` line, then sequence lines. Genomes, proteins.
- **FASTQ:** 4 lines per read with **Phred+33** qualities (see Sequencing).
- **SAM/BAM/CRAM:** read alignments (position, **CIGAR** like `50M2I48M`, MAPQ).
- **VCF:** variant calls (chromosome, position, REF, ALT, genotype, quality).
- **BED / GFF3 / GTF:** genomic intervals and gene annotations.
- **PDB / mmCIF:** 3D structures (AlphaFold stores pLDDT in the B-factor column).
- **Newick:** trees, e.g. `((A:2,B:2):1,(C:2,D:2):1);`.
- **h5ad / loom / MTX:** single-cell count matrices.

## A typical analysis workflow

**Variant calling (DNA):** FASTQ → QC (FastQC, fastp) → map (BWA-MEM/Bowtie2) → sort & mark duplicates (samtools, Picard) → call variants (GATK HaplotypeCaller or DeepVariant) → annotate (VEP) → interpret.

**RNA-seq:** FASTQ → QC → align (STAR/HISAT2) or pseudo-align (Salmon/kallisto) → count matrix → normalization & differential expression (DESeq2/edgeR) → clustering, PCA → GO/pathway enrichment.

**scRNA-seq:** Cell Ranger/STARsolo → count matrix → QC (mito %, doublets) → normalize → highly variable genes → PCA → neighbor graph → Leiden clustering → UMAP/t-SNE → annotate cell types (Scanpy/Seurat).

## Gene Ontology & enrichment (syllabus topic 9)

**GO** describes gene products with three ontologies: **Biological Process**, **Molecular Function**, **Cellular Component**, arranged as a directed acyclic graph (terms have more general parents). **Enrichment analysis** asks whether a gene list (a cluster, or differentially expressed genes) contains more genes annotated to a term than expected by chance, using a hypergeometric/Fisher test with multiple-testing correction (Benjamini–Hochberg FDR). **Pathway** databases (KEGG, Reactome) and **GSEA** extend this to ranked lists. This is how you turn “cluster 3” into “cluster 3 = immune response”.

## Python stack for bioinformatics

- **Biopython** (SeqIO for FASTA/FASTQ, pairwise alignment, Entrez access), **pysam** (BAM/VCF), **scikit-bio**.
- **NumPy / pandas / SciPy / scikit-learn** (clustering, PCA, t-SNE, classifiers), **matplotlib/seaborn**.
- **Scanpy** (single cell), **PyTorch** (deep learning), **fair-esm** / Hugging Face (protein & DNA language models).
- Workflow managers: **Snakemake**, **Nextflow** (nf-core pipelines). Environments: **conda/mamba**, containers.

## Practice and keep learning

- **Rosalind** textbook track: implement every course algorithm (graded).
- Read papers with code; reproduce a figure from a GEO dataset.
- Follow bioRxiv preprints and benchmark papers before trusting a new tool.
