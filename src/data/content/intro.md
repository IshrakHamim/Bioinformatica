You are a computer scientist. Your new "programming language" has 4 letters, its programs are about 3 billion characters long, and they run on hardware (cells) that copies, edits and executes them. This module gives you enough molecular biology to read every later algorithm in the right biological context.

:::tip How to use this module
Each section has a **Mark complete** button (+20 XP). The widgets are live: change the inputs. Finish with the Quiz and Flashcards tabs.
:::

## Bioinformatics vs computational biology

- **Bioinformatics**: collecting, storing, classifying and analyzing biological data with computers, especially genomic and molecular data. Think *tools, databases, pipelines*.
- **Computational biology**: using mathematical models, algorithms and simulation to *understand biological systems*. Think *questions and models*.

In practice the two overlap. The course you are revising (CSE443) follows the algorithmic tradition of **Compeau & Pevzner, *Bioinformatics Algorithms: An Active Learning Approach***: every topic starts with a biological question, turns it into a precise computational problem (Input → Output), then designs algorithms for it.

:::cs The recurring recipe
1. **Biology:** “Where does replication start?”
2. **Problem:** *Input:* a DNA string *Genome*. *Output:* the position of *oriC*.
3. **Algorithm:** count k-mers, compute skew, …
4. **Reality check:** what assumptions did we make, and how do real data break them?
:::

The course outline (from the first lecture): introduction → sequence alignment & DP → HMMs → genome assembly, read mapping, variant calling, de Bruijn graphs → gene expression analysis (clustering, visualization, dimensionality reduction) → single-cell RNA-seq & spatial transcriptomics → phylogenetic trees → biological networks → gene ontology & pathways → evolutionary & comparative genomics → representation/contrastive learning → protein structure, proteomics and generative AI.

## Genome, genes and why we differ

- A **genome** is all the DNA of an organism. A human cell holds two copies (one from each biological parent) of ~3.1 billion base pairs, about **6 billion letters**, roughly 2 m of DNA if stretched out.
- The DNA is split into **chromosomes** (humans: 23 pairs). When a cell divides, they condense into tightly packed bundles.
- A **gene** is a DNA segment carrying instructions for a product, usually a protein. Humans have roughly 20,000 protein-coding genes, and protein-coding sequence is only ~1–2% of the genome. The rest includes regulatory elements, non-coding RNA genes, repeats and much we still do not understand.
- Any two humans are **≈99.9% identical** in DNA sequence. The ~0.1% (millions of positions) are **genetic variants**. A single changed letter can alter a protein's shape, how much is made, or when and where it is made. That affects traits (eye colour) and disease risk or drug response.

:::bio Genotype → phenotype
**Genotype** = the DNA you carry. **Phenotype** = observable traits. The genome is not destiny: epigenetic marks (e.g., DNA methylation), environment and plain randomness all shape the phenotype. Every cell in your body has (almost) the same genome, yet a neuron and a skin cell are very different. Same program, different execution: *gene regulation* decides which genes run.
:::

**Genetic disease.** A change in DNA can be *inherited* (present from birth, runs in families) or *acquired* during life (e.g., mutations in a tissue leading to cancer: cells dividing without control). Most variants are harmless; some destroy or alter a protein.

**Model organisms.** Budding yeast *Saccharomyces cerevisiae* (~12 Mb, ~6,000 genes, 16 chromosomes) was the first eukaryote fully sequenced (1996). Its small genome makes it ideal for learning how genes work.

## DNA: the four-letter molecule

DNA is a polymer of **nucleotides**. Each nucleotide = phosphate + deoxyribose sugar + one of four **bases**:

| Base | Type | Rings | Pairs with | H-bonds |
|---|---|---|---|---|
| **A** adenine | purine | 2 | T | 2 |
| **G** guanine | purine | 2 | C | 3 |
| **C** cytosine | pyrimidine | 1 | G | 3 |
| **T** thymine | pyrimidine | 1 | A | 2 |

- The two strands of the **double helix** are **complementary**: A↔T, C↔G. If you know one strand, you know the other.
- G–C pairs (3 H-bonds) hold more strongly than A–T pairs (2). AT-rich regions are easier to pull apart, which matters for where replication starts.
- Strands are **directional**: one end is 5′ (five-prime), the other 3′, named after carbon atoms of the sugar. The two strands run **antiparallel**. By convention we always write a strand 5′→3′.

So to read the *other* strand 5′→3′, you **reverse** the string and **complement** each base. This is the **reverse complement**, the most-used one-liner in bioinformatics:

$$\text{revcomp}(\texttt{ATGATCAAG}) = \texttt{CTTGATCAT}$$

{{widget:dna-builder}}

**Upstream vs downstream.** Relative to a gene, sequence on the 5′ side is *upstream* (where promoters usually sit); sequence on the 3′ side is *downstream*. Genes can sit on either strand.

## Replication: copying the genome

Watson & Crick (1953) ended their paper with: *“It has not escaped our notice that the specific pairing we have postulated immediately suggests a possible copying mechanism for the genetic material.”*

1. The two strands separate (the weak H-bonds make this possible) starting at the **origin of replication** (*oriC*).
2. Each old strand is a **template**. **DNA polymerase** reads the template 3′→5′ and builds the new strand **5′→3′** only.
3. Because of that one-way rule, one new strand (the **leading** strand) is built continuously. The other (**lagging**) strand is built backwards in short **Okazaki fragments**, later joined by **DNA ligase**.
4. Result: two double helices, each with one old and one new strand (*semi-conservative* replication).

{{yt:TNKWgcFPHqw|DNA replication - 3D (yourgenome)}}

The next module turns this biology into an algorithm: the asymmetry between leading and lagging strands leaves a statistical fingerprint (the **GC skew**) that reveals where oriC is.

## Transcription: DNA → RNA

**Transcription** copies a gene into RNA.

- **RNA polymerase** is recruited to the **transcription start site (TSS)** by regulatory proteins binding the **promoter**. It reads the template strand 3′→5′ and builds RNA 5′→3′.
- RNA uses **U (uracil)** instead of T, contains **ribose** (DNA's deoxyribose lacks the 2′ oxygen) and is usually **single-stranded**.
- In eukaryotes the pre-mRNA is processed *after transcription* (post-transcriptional processing; the lecture slide says “post-translational”, a slip):
  - **Splicing** removes **introns** and joins **exons** (the parts that remain in the mRNA). Alternative splicing lets one gene make several *isoforms*.
  - A **5′ cap** (modified guanine) is added, and a **poly(A) tail** (many adenines) at the 3′ end.

Types of RNA you should know:

| RNA | Job |
|---|---|
| **mRNA** | messenger: carries the protein recipe |
| **tRNA** | transfer: its 3-base *anticodon* pairs with a codon, and it carries the matching amino acid |
| **rRNA** | ribosomal: core (and catalytic heart) of the ribosome |
| **snRNA** | small nuclear: splicing machinery |
| miRNA, lncRNA … | regulation (beyond the slides, but everywhere in modern papers) |

## Translation: RNA → protein and the genetic code

The **ribosome** reads mRNA in non-overlapping triplets called **codons**. There are $4^3 = 64$ codons for 20 amino acids, so the code is *redundant* (degenerate): most amino acids have several codons.

- **AUG** = start codon (also codes methionine, M).
- **UAA, UAG, UGA** = stop codons.
- 61 sense codons + 3 stops = 64.

A **reading frame** is where you start counting triplets. Each strand has 3 frames, so DNA has **6 possible reading frames**. Shift by one base and you get a completely different protein. An *open reading frame (ORF)* runs from a start codon to a stop codon.

{{widget:central-dogma}}

{{game:codon-quest}}

{{yt:gG7uCskUOrA|From DNA to protein - 3D (yourgenome)}}

## Proteins: sequence → structure → function

Proteins do most of the cell's work: enzymes (catalysis), structure, transport (hemoglobin), immune defense (antibodies), signals and receptors, muscle contraction.

A protein is a chain of amino acids, each with different size, charge, polarity and acidity. The chain folds:

1. **Primary** structure: the amino-acid sequence.
2. **Secondary**: local patterns, **α-helices** and **β-sheets**, held by backbone hydrogen bonds.
3. **Tertiary**: the full 3D fold of one chain.
4. **Quaternary**: several chains assembled (hemoglobin = 2α + 2β).

**Anfinsen's principle:** the sequence determines the structure, and structure determines function. Predicting structure from sequence was a 50-year grand challenge, essentially solved for single chains by **AlphaFold 2** (2020) and recognised by the 2024 Nobel Prize in Chemistry. See the *Frontiers* track.

:::cs Why this matters to you
- *Similar sequence → similar structure → similar function.* This is the justification for **sequence alignment**: if a new gene aligns well to a known one, it probably does something similar.
- Proteins are just strings over a 20-letter alphabet, so string algorithms and language models apply directly.
:::

## Gene regulation: when and how much

Not all genes are on all the time. **Gene regulation** controls timing, place and amount of expression.

- **Promoters** (just upstream of genes) and **enhancers** (can be far away) contain short **regulatory motifs**: binding sites for **transcription factors (TFs)**.
- A TF typically controls many genes that share its motif. Co-regulated genes often share function. This links Module 3 (finding motifs) with Modules 7–8 (genes with similar expression profiles).
- Regulation forms **networks** with feedback loops (e.g., the plant circadian clock: TOC1 activates LHY/CCA1, which repress TOC1). Module 15 studies such networks.

:::sota The central dogma, as a data pipeline
DNA (genome sequencing, variant calling) → RNA (RNA-seq: expression, splicing) → protein (mass-spec proteomics, AlphaFold structures) → interactions (networks). Each arrow is a research field, and each has its own “-omics”.
:::

## Where to practice

- **Rosalind** (the problem-solving platform used by the course): every major algorithm in this site has a Rosalind problem. Start with the *Bioinformatics Textbook Track*: BA1A (pattern count), BA1C (reverse complement)…
- The lecture notebook *Sequence_reads.ipynb* walks through Python strings, reverse complement, reading a genome from FASTA, parsing FASTQ and Phred qualities, and naive exact matching of real reads to the φX174 genome. It is mirrored in the Read Mapping module.
