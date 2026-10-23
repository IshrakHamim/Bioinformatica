The course outline lists topics the slide decks only touch on: **variant calling**, **single-cell RNA-seq and spatial transcriptomics**, **gene ontology and pathways**, **evolutionary and comparative genomics**. This module gives you a researcher's map of each, built on the algorithms you've learned.

## Variant calling

**Goal:** find where an individual's genome differs from the reference: **SNVs** (single-nucleotide variants), small **indels**, and **structural variants** (SVs: large deletions, duplications, inversions, translocations).

1. Map reads (BWA-MEM; Module 6) and sort them.
2. **Mark PCR duplicates**, then recalibrate base qualities.
3. At each position, look at the **pileup** of reads: a heterozygous SNV shows ~50% reads with the alternative base. Statistical callers (GATK HaplotypeCaller) locally re-assemble candidate haplotypes (a small de Bruijn graph, Module 4!) and compute genotype likelihoods from base qualities (Phred, Module 5).
4. **DeepVariant** (Google) turns pileups into images and classifies genotypes with a CNN.
5. Filter, annotate (gene, consequence, population frequency in gnomAD, AlphaMissense scores) and interpret.

Long reads (PacBio HiFi, Nanopore) are far better for SVs and repetitive regions; T2T-CHM13 and **pangenome graph** references reduce reference bias (reads from variants absent in the linear reference map poorly).

## Single-cell & spatial transcriptomics

**scRNA-seq** (Module 7) measures expression per cell: droplets + barcoded beads → cell barcodes + UMIs → a sparse genes × cells matrix → QC → normalization → highly variable genes → PCA → kNN graph → Leiden clustering → UMAP → cell-type annotation → differential expression, **trajectory inference** (pseudotime for differentiation) and **RNA velocity**.

**Spatial transcriptomics** keeps the **location** of each measurement in the tissue (Nature Methods' Method of the Year 2020):
- **Sequencing-based:** capture spots with spatial barcodes on a slide (10x Visium; higher-resolution successors), then sequence. Each spot may contain several cells, so **deconvolution** with scRNA-seq references is needed.
- **Imaging-based:** in-situ hybridization or sequencing of hundreds to thousands of genes at subcellular resolution (MERFISH, Xenium, CosMx).
- Analyses: spatial domains (clustering with neighborhood smoothing), cell–cell communication (ligand–receptor networks, Module 15), spatially variable genes.

{{yt:q74euInZqm4|Spatial Transcriptomics (Journal of Investigative Dermatology)}}

## Comparative & evolutionary genomics

Compare whole genomes across species to find what is conserved (likely functional) and what changed (adaptation):
- **Orthologs** (split by speciation) vs **paralogs** (split by gene duplication); ortholog inference via reciprocal BLAST or phylogenies (Modules 10–11).
- **Synteny:** conserved gene order; **genome rearrangements** (inversions, translocations) measured by reversal/breakpoint distances (Compeau & Pevzner Ch. 6).
- **Conservation scores** (phyloP, phastCons) from multi-species alignments highlight functional non-coding elements.
- **dN/dS** (non-synonymous vs synonymous substitution rates) detects selection: > 1 positive selection, < 1 purifying.
- **Horizontal gene transfer** in bacteria (antibiotic resistance), and phylogenomics of pathogens (Nextstrain).

## CRISPR and functional genomics

**CRISPR–Cas9** (2020 Nobel Prize in Chemistry: Charpentier & Doudna) cuts DNA at sites matched by a ~20-nt guide RNA next to a PAM (NGG for SpCas9). Bioinformatics problems: **guide design** (string matching across the genome to avoid **off-target** sites with few mismatches, which is approximate matching from Module 6!), analysis of pooled **CRISPR screens** (count guides per gene, rank essential genes), and **Perturb-seq** (CRISPR perturbations + scRNA-seq readout) that trains causal models of gene regulation.

{{yt:6tw_JVz_IEc|How CRISPR lets you edit DNA (TED-Ed)}}

## Pangenomes and the T2T era

- **T2T-CHM13** (2022): the first complete, gapless human genome, adding ~200 Mb (centromeres, rDNA arrays, segmental duplications).
- **Human Pangenome Reference Consortium** draft (2023, 47 individuals): a **graph** representing many haplotypes, reducing reference bias. Read mapping to graphs (vg, minigraph) generalizes the string algorithms you learned to paths in graphs.

## Research skills checklist

- Reproduce a published analysis from GEO/SRA data end to end.
- Write pipelines (Snakemake/Nextflow), version your environment, and make figures reproducible.
- Read methods critically: data leakage, batch effects, multiple testing (FDR), baselines.
- Know your biology question first; the algorithm is a tool to answer it.
