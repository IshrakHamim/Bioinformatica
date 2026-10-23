The course outline lists topics that the slide decks only touch on: **variant calling**, **single-cell RNA-seq and spatial transcriptomics**, **gene ontology and pathways**, and **evolutionary and comparative genomics**. This lesson gives you a researcher's map of each, built on the algorithms you've already learned. Each section names the earlier lessons it relies on, so you can jump back when something is unfamiliar.

## Variant calling

**Goal:** find where an individual's genome differs from the reference. Variants come in three sizes:
- **SNVs** (single-nucleotide variants): one base changed;
- small **indels**: a few bases inserted or deleted;
- **structural variants (SVs):** large deletions, duplications, inversions and translocations, from about 50 bases to millions.

**The standard short-read pipeline:**
1. **Map reads** to the reference (BWA-MEM; Read Mapping lesson) and sort them by position.
2. **Mark PCR duplicates** (identical copies of the same original fragment, which would otherwise count as independent evidence), then recalibrate base qualities.
3. At each position, look at the **pileup**: all the reads covering it. A **heterozygous** SNV (one copy of each allele) shows about 50% of reads with the alternative base; a homozygous one, about 100%. A single read with a different base at low quality is probably a sequencing error. Statistical callers such as GATK HaplotypeCaller locally re-assemble candidate haplotypes (with a small **de Bruijn graph**, as in the Assembly lesson) and compute **genotype likelihoods** from base qualities (**Phred** scores, Sequencing lesson).
4. **DeepVariant** (Google) turns pileups into images and classifies the genotype with a convolutional neural network.
5. **Filter and annotate** each variant: which gene, what consequence (missense, stop-gain, splice site…), population frequency (gnomAD), and predicted effect (AlphaMissense), then interpret.

{{ref:tools#typical-analysis-workflows|tools#file-formats}}

**Long reads** (PacBio HiFi, Nanopore) are far better for SVs and repetitive regions. **T2T-CHM13** and **pangenome graph** references reduce **reference bias**: reads carrying sequence that's absent from a single linear reference map poorly, so variants there are missed.

## Single-cell & spatial transcriptomics

**scRNA-seq** (Gene Expression lesson) measures expression per cell. Watch the droplet method again if the barcodes and UMIs aren't fresh:

{{video:4NAS1qTJmYA}}

**The standard analysis**, and where each step comes from in the course:
1. Droplets + barcoded beads → reads tagged with **cell barcodes** and **UMIs** → a sparse genes × cells count matrix.
2. **QC:** remove empty droplets, dying cells (high mitochondrial RNA fraction) and doublets (two cells in one droplet).
3. **Normalize** for sequencing depth and log-transform.
4. Select **highly variable genes**.
5. **PCA** to ~50 dimensions (Dimensionality Reduction lesson).
6. Build a **k-nearest-neighbour graph** of cells and cluster it with **Leiden** (a modularity-based community detection method, Biological Networks lesson).
7. **UMAP** or t-SNE for visualization.
8. **Annotate** clusters as cell types using marker genes, then do differential expression, **trajectory inference** (ordering cells along "pseudotime" through a differentiation process) and **RNA velocity** (predicting each cell's future state from the ratio of unspliced to spliced RNA).

{{ref:tools#gene-ontology-and-enrichment-analysis}}

**Spatial transcriptomics** keeps the **location** of each measurement in the tissue, so you can see which cell types sit next to each other (*Nature Methods* named it Method of the Year 2020). This short overview shows the main methods:

{{video:q74euInZqm4}}

- **Sequencing-based:** tissue is placed on a slide covered with capture spots, each carrying a **spatial barcode**, then sequenced (10x Visium and higher-resolution successors). A spot may contain several cells, so **deconvolution** with an scRNA-seq reference is needed to estimate the cell-type mix in each spot.
- **Imaging-based:** in-situ hybridization or in-situ sequencing reads hundreds to thousands of genes at subcellular resolution directly under a microscope (MERFISH, Xenium, CosMx).
- **Analyses:** spatial domains (clustering with neighbourhood smoothing), cell–cell communication (ligand–receptor networks), and spatially variable genes.

For a deeper technical introduction to spatial data analysis:

{{video:_qsHqB67O70}}

## Comparative & evolutionary genomics

Compare whole genomes across species to find what is **conserved** (likely functional, because selection kept it) and what **changed** (adaptation).

- **Orthologs** are genes in different species that descend from one gene in their common ancestor (they split by **speciation**). **Paralogs** split by **gene duplication** within a genome. Orthologs usually keep the same function, so they are the right pairs for transferring annotation. Ortholog inference uses reciprocal best BLAST hits or phylogenies (Sequence Alignment and Phylogeny lessons).
- **Synteny:** conserved gene order between species. **Genome rearrangements** (inversions, translocations) are measured by reversal or breakpoint distances (Compeau & Pevzner, Ch. 6).
- **Conservation scores** (phyloP, phastCons) from multi-species alignments highlight functional elements, including non-coding ones.
- **dN/dS**: the ratio of non-synonymous substitutions (which change the amino acid) to synonymous ones (which don't), per site. Above 1 suggests **positive selection** (change is favoured); below 1, **purifying selection** (change is removed); near 1, neutral evolution.
- **Horizontal gene transfer** moves genes between bacteria (spreading antibiotic resistance), and **phylogenomics of pathogens** tracks outbreaks (Nextstrain).

{{ref:alignment#speed-blast|phylogeny#neighbor-joining}}

## CRISPR and functional genomics

Watch this explanation of how CRISPR edits DNA first; the bioinformatics problems below all build on it.

{{video:6tw_JVz_IEc}}

**CRISPR–Cas9** (2020 Nobel Prize in Chemistry: Emmanuelle Charpentier and Jennifer Doudna) cuts DNA at a site chosen by a ~20-nucleotide **guide RNA**, next to a short **PAM** sequence (NGG for the common SpCas9). Computational problems:
- **Guide design:** choose guides that cut the target but nowhere else. That means searching the whole genome for **off-target** sites matching the guide with a few mismatches: approximate string matching from the Read Mapping lesson.
- **Pooled CRISPR screens:** knock out thousands of genes in a population of cells at once, sequence the guides that remain, count them per gene, and rank which genes are essential.
- **Perturb-seq:** combine CRISPR perturbations with an scRNA-seq readout, measuring the effect of each knockout on the expression of every gene, to train causal models of gene regulation.

{{ref:readmap#approximate-matching-hamming-edit-distance-pigeonhole}}

## Pangenomes and the T2T era

- **T2T-CHM13** (2022): the first complete, gapless human genome, adding about 200 Mb (centromeres, rDNA arrays, segmental duplications), made possible by long reads (Sequencing and Assembly lessons).
- The **Human Pangenome Reference Consortium** draft (2023, 47 individuals) represents many human haplotypes together as a **graph**, reducing reference bias. Mapping reads to graphs (vg, minigraph) generalizes the string algorithms you learned to paths in graphs.

{{ref:algo#graphs-the-basics}}

## Research skills checklist

- Reproduce a published analysis from GEO/SRA data end to end.
- Write pipelines (Snakemake/Nextflow), version your software environment, and make figures reproducible.
- Read methods critically: data leakage, batch effects, multiple testing (FDR), and baselines.
- Know your biological question first; the algorithm is a tool to answer it.

{{ref:tools#practice-and-keep-learning|math#statistical-significance-and-multiple-testing}}
