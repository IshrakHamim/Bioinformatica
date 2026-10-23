The lectures teach algorithms. Research also needs the practical layer: where biological data live, what the files look like, and which tools people actually run. This module covers that layer, at the level you need to follow the course and start your own analyses.

:::tip You do not have to read this first
Lessons link here (🧱 *Stuck? Quick refresher*) when they mention a database, a file format or a pipeline. Come back when you start working with real data.
:::

## Databases you will use

Public databases are where almost every analysis starts. Learn the main ones by what they store:

| Data | Database | Notes |
|---|---|---|
| Nucleotide sequences | **GenBank** (NCBI), **ENA** (EMBL-EBI), **DDBJ** | the three mirror each other (the INSDC) |
| Raw sequencing reads | **SRA** (NCBI), ENA | download FASTQ with the SRA Toolkit (`fasterq-dump`) |
| Reference genomes and gene annotation | **NCBI RefSeq**, **Ensembl**, **UCSC Genome Browser** | human assemblies GRCh38 and T2T-CHM13 |
| Proteins | **UniProt** | Swiss-Prot = manually reviewed; TrEMBL = automatic |
| 3D structures | **PDB** (experimental), **AlphaFold DB** (predicted) | atomic coordinates |
| Expression | **GEO** (NCBI), **ArrayExpress/BioStudies** (EBI), recount3, ARCHS4 | microarray and RNA-seq studies |
| Single cell | CELLxGENE, Human Cell Atlas | annotated cell atlases |
| Variants | dbSNP, **ClinVar**, **gnomAD** | population frequencies and clinical significance |
| Protein domains and families | **Pfam** (in InterPro), PROSITE | profile HMMs |
| Interactions and pathways | STRING, BioGRID, KEGG, Reactome | networks |
| Gene function terms | **Gene Ontology (GO)** | used for enrichment analysis |

**Identifiers** are how databases link to each other. A human gene may be `BRCA1` (symbol), `ENSG00000012048` (Ensembl gene), `672` (NCBI Gene) and `P38398` (UniProt protein). Converting between them (e.g., with BioMart or `mygene`) is a routine step in every project.

## File formats

You will spend a lot of time reading and writing these. Each one is plain text (or a compressed binary version of plain text).

**FASTA:** sequences. A header line starting with `>`, then the sequence on one or more lines.

```text
>NC_001422.1 Escherichia phage phiX174, complete genome
GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTA...
```

**FASTQ:** sequencing reads with per-base qualities, four lines per read: `@name`, sequence, `+`, quality string. Each quality character encodes a Phred score Q as the character with ASCII code Q + 33 (Sequencing lesson).

**SAM / BAM / CRAM:** reads aligned to a reference. Each line has the read name, chromosome, 1-based position, **MAPQ** (mapping quality: Phred-scaled confidence that the position is right) and a **CIGAR** string describing the alignment. `50M2I48M` means 50 aligned bases, a 2-base insertion in the read, then 48 aligned bases. BAM is compressed binary SAM; CRAM compresses further against the reference.

**VCF:** variant calls.

```text
#CHROM  POS      ID         REF  ALT  QUAL  FILTER  INFO   FORMAT  SAMPLE1
chr1    1234567  .          G    A    812   PASS    DP=41  GT      0/1
```

`0/1` is the genotype: one reference allele and one alternative allele (heterozygous).

**BED, GFF3 and GTF:** genomic intervals and gene annotations (genes, exons, transcripts).

:::warn Coordinate systems
**BED is 0-based and half-open** (a feature covering the first 10 bases is `0 10`). **GFF, GTF, SAM and VCF are 1-based and inclusive** (the same feature is `1 10`). Mixing them up causes off-by-one errors that are very hard to spot.
:::

**PDB / mmCIF:** 3D structures, one line per atom with x, y, z coordinates. AlphaFold files store the per-residue confidence (pLDDT) in the B-factor column.

**Newick:** trees as nested parentheses with branch lengths, e.g. `((A:2,B:2):1,(C:2,D:2):1);`.

**h5ad, loom, MTX:** single-cell count matrices (genes × cells), stored sparsely because most entries are 0.

## Reading FASTA and FASTQ in Python

You should be able to parse both formats by hand at least once; it makes the formats stick.

```python
def read_fasta(path):
    """Return {header: sequence} for a FASTA file."""
    seqs, name = {}, None
    for line in open(path):
        line = line.strip()
        if line.startswith(">"):
            name = line[1:]
            seqs[name] = []
        elif name:
            seqs[name].append(line)
    return {k: "".join(v) for k, v in seqs.items()}

def read_fastq(path):
    """Yield (name, sequence, qualities as integers)."""
    with open(path) as f:
        while True:
            name = f.readline().strip()
            if not name:
                break
            seq = f.readline().strip()
            f.readline()                      # the '+' line
            qual = f.readline().strip()
            yield name[1:], seq, [ord(c) - 33 for c in qual]
```

In real work use a tested library: Biopython's `SeqIO.parse(path, "fasta")` or `"fastq"`, or `pysam` for BAM and VCF. The course notebook *Sequence_reads.ipynb* does exactly this with the φX174 genome and a real FASTQ file.

## Typical analysis workflows

Real analyses chain many tools. Each arrow below is a separate program, and each one connects to a course lesson.

**Variant calling (DNA):**
FASTQ → quality control (FastQC, fastp) → **map reads** to the reference (BWA-MEM, Bowtie2; *Read Mapping*) → sort and mark PCR duplicates (samtools, Picard) → **call variants** (GATK HaplotypeCaller, DeepVariant) → annotate (VEP; gnomAD frequencies) → interpret.

**Bulk RNA-seq:**
FASTQ → QC → splice-aware alignment (STAR, HISAT2) or pseudo-alignment (Salmon, kallisto) → **count matrix** (genes × samples) → normalization and differential expression (DESeq2, edgeR) → **clustering and PCA** (*Gene Expression* lessons) → GO / pathway enrichment.

The video explains where the counts in an RNA-seq matrix come from, which is the input to the clustering and PCA lessons.

{{video:tlf6wYJrwKY}}

**Single-cell RNA-seq:**
Cell Ranger or STARsolo → count matrix (genes × cells) → QC (remove cells with high mitochondrial %, doublets) → normalize → select highly variable genes → **PCA** → nearest-neighbour graph → Leiden clustering → **UMAP / t-SNE** → annotate cell types (Scanpy in Python, Seurat in R).

**Workflow managers** (Snakemake, Nextflow and the nf-core pipelines) run these chains reproducibly, restart failed steps and record versions.

## Gene Ontology and enrichment analysis

After clustering genes or finding differentially expressed genes, you have a list of gene names. **Enrichment analysis** turns that list into biology: "cluster 3 is about immune response".

**Gene Ontology (GO)** is a controlled vocabulary of function terms in three branches:
- **Biological Process** (e.g., *DNA replication*, *immune response*),
- **Molecular Function** (e.g., *DNA binding*, *kinase activity*),
- **Cellular Component** (e.g., *nucleus*, *mitochondrion*).

Terms form a **directed acyclic graph**: a specific term (*DNA replication initiation*) has more general parents (*DNA replication*, then *DNA metabolic process*). A gene annotated to a term is implicitly annotated to all its ancestors.

**Over-representation test.** Suppose the genome has N = 20,000 genes, K = 400 of them annotated *immune response*, and your cluster has n = 100 genes of which k = 15 are immune genes. By chance you'd expect $100 \times 400/20{,}000 = 2$. Is 15 surprising? The **hypergeometric test** (Fisher's exact test) gives the probability of seeing 15 or more by random sampling: here it is tiny, so the term is **enriched**.

Because thousands of GO terms are tested at once, the p-values must be corrected for **multiple testing**, usually with Benjamini–Hochberg FDR (Math foundation, *Statistical significance*). Two practical cautions: always use the right **background** (the genes you could have detected, not the whole genome), and remember that well-studied genes have more annotations.

**Beyond GO:** pathway databases (KEGG, Reactome) work the same way; **GSEA** (gene set enrichment analysis) uses a *ranked* list of all genes instead of a cut-off list. Tools: g:Profiler, clusterProfiler (R), Enrichr.

## The Python and R toolkit

**Python:**
- **Biopython** (FASTA/FASTQ parsing, pairwise alignment, NCBI Entrez access), **pysam** (BAM, VCF), scikit-bio.
- **NumPy, pandas, SciPy, scikit-learn** for matrices, tables, statistics, clustering, PCA, t-SNE and classifiers; matplotlib and seaborn for plots.
- **Scanpy** for single cell; **PyTorch** for deep learning; **fair-esm** and Hugging Face for protein and DNA language models.

**R / Bioconductor:** DESeq2 and edgeR (differential expression), Seurat (single cell), clusterProfiler (enrichment). Much of genomics statistics lives here.

**Command line:** samtools, bcftools, bedtools, BLAST+, and basic Unix (`grep`, `awk`, `sort`, `zcat`). Most tools run on Linux servers.

**Environments:** install tools with **conda/mamba** (the Bioconda channel has almost everything) or containers (Docker, Apptainer), and record versions so analyses can be reproduced.

## Practice and keep learning

- **Rosalind** is the problem platform the course uses. Its *Bioinformatics Textbook Track* follows Compeau & Pevzner chapter by chapter, and every algorithm in this site links its Rosalind problem under **Further reading**. Implementing an algorithm and getting it graded is the fastest way to really understand it.
- Reproduce one figure from a published paper using its GEO/SRA data, end to end. You'll hit every practical problem in this module.
- Read **benchmark papers** before trusting a new tool, and follow bioRxiv preprints in your area.

{{video:6oHl7hNWn2o}}
