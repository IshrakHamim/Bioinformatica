You are a computer scientist. Your new "programming language" has 4 letters, its programs are about 3 billion characters long, and they run on hardware (cells) that copies, edits and executes them. This module teaches you enough molecular biology to understand every later algorithm in its biological context. No biology background is assumed.

:::tip How to use the lessons
Read each section, try the widgets (they are live: change the inputs), and press **Mark complete** when you're done. Videos sit where they help most: some are best watched *before* a section, some *after* as a recap, and the text tells you which. When a step uses math or an algorithm you're unsure of, the **🧱 Stuck? Quick refresher** chips open the right foundation section inline.
:::

Before diving into the biology, this short talk by a computational genomics professor explains why sequencing and string algorithms became so central to biology. It is a good frame for the whole course.

{{video:hpb-mH-yjLc}}

## Bioinformatics vs computational biology

- **Bioinformatics** is collecting, storing, organizing and analyzing biological data with computers, especially DNA, RNA and protein sequences. Think *tools, databases, pipelines*.
- **Computational biology** uses mathematical models, algorithms and simulation to *understand how biological systems work*. Think *questions and models*.

In practice the two overlap, and most researchers do some of both. The course you are studying (CSE443) follows the algorithmic tradition of **Compeau & Pevzner, *Bioinformatics Algorithms: An Active Learning Approach***. Every topic starts with a biological question, turns it into a precise computational problem, and then designs algorithms for it.

:::cs The recurring recipe
1. **Biology:** "Where does DNA replication start in a bacterium?"
2. **Problem:** *Input:* a DNA string *Genome*. *Output:* the position of the replication origin.
3. **Algorithm:** count short words, compute the GC skew, …
4. **Reality check:** what did we assume, and how do real data break it?
:::

{{ref:algo#reading-a-problem-input-output}}

**What the course covers** (from the first lecture): finding hidden messages in DNA → genome assembly → sequencing technology and read mapping → gene expression analysis (clustering, dimensionality reduction) → sequence alignment → phylogenetic trees → hidden Markov models → machine learning and neural networks → biological networks. The *Frontiers* track then covers what the field does today: AlphaFold, protein design and genomic language models.

## Genome, genes and why we differ

**Cells.** Every living thing is made of cells. **Bacteria** (prokaryotes) are single cells without a nucleus; their DNA is usually one circular chromosome floating in the cell. **Eukaryotes** (yeast, plants, animals) keep their DNA inside a **nucleus**, as several linear chromosomes.

**Genome.** A **genome** is all the DNA of an organism. A human cell holds two copies of a ~3.1 billion base-pair genome, one inherited from each biological parent, so about **6 billion letters** per cell. Stretched out, the DNA of one cell would be roughly 2 m long; it is packed by wrapping around proteins (histones) into **chromatin**.

**Chromosomes.** The genome is split into **chromosomes**: humans have 23 pairs. Before a cell divides, each chromosome condenses into the compact X-shaped form seen in textbook pictures.

**Genes.** A **gene** is a stretch of DNA carrying the instructions for a product, usually a protein. Humans have about **20,000 protein-coding genes**, and protein-coding sequence makes up only about **1–2%** of the genome. The rest includes regulatory switches, genes for non-coding RNAs, repeated sequences, and much whose function is still unknown.

:::story The genome as a cookbook
- The **genome** is a cookbook, and every cell in your body carries a complete copy.
- A **gene** is one recipe. **Chromosomes** are the volumes the book is bound in.
- The master copy never leaves the library (the nucleus). To cook, the cell makes a disposable **photocopy** of one recipe, the **mRNA** (transcription).
- The **ribosome** is the kitchen: it reads the photocopy three letters at a time and assembles the dish, a **protein** (translation).
- A liver cell and a neuron have the same cookbook but cook different recipes. Deciding which recipes, when and how much, is **gene regulation**, done by **transcription factors**, the switches you'll hunt for in the Motifs lesson.
- A variant is a misprint in one copy of the book. Many are harmless; some ruin a recipe.
:::

**Variation.** Any two humans are about **99.9% identical** in DNA sequence. The remaining ~0.1% is still millions of positions, called **genetic variants**. A single changed letter can alter a protein's shape, or how much of it is made, or when and where. Variants contribute to traits (eye colour, height), disease risk and drug response. Finding them is one of bioinformatics' main jobs (variant calling).

:::bio Genotype → phenotype
**Genotype** is the DNA you carry. **Phenotype** is what you observe: traits, disease, behaviour. The genome is not destiny: chemical marks on DNA (epigenetics, e.g., DNA methylation), environment and chance all shape the phenotype. Almost every cell in your body has the same genome, yet a neuron and a skin cell look and behave completely differently. Same program, different execution. **Gene regulation** decides which genes are switched on in which cell.
:::

**Genetic disease.** A DNA change can be **inherited** (present from birth, runs in families, e.g., cystic fibrosis) or **acquired** during life. Cancer is the classic acquired case: mutations accumulate in a tissue until cells divide without control. Most variants are harmless; a few break or change a protein.

**Model organisms.** Biologists learn general rules from simpler organisms. Budding yeast *Saccharomyces cerevisiae* (~12 million bp, ~6,000 genes, 16 chromosomes) was the first eukaryote whose genome was fully sequenced (1996). Bacteria like *E. coli*, the fruit fly and the mouse are other workhorses.

## DNA: the four-letter molecule

DNA (deoxyribonucleic acid) is a long chain, a **polymer**, of building blocks called **nucleotides**. Each nucleotide has three parts: a **phosphate**, a sugar called **deoxyribose**, and one of four **bases**. The sugar and phosphate form the backbone; the bases are the "letters".

| Base | Type | Rings | Pairs with | Hydrogen bonds |
|---|---|---|---|---|
| **A** adenine | purine | 2 | T | 2 |
| **G** guanine | purine | 2 | C | 3 |
| **C** cytosine | pyrimidine | 1 | G | 3 |
| **T** thymine | pyrimidine | 1 | A | 2 |

**The double helix.** DNA usually exists as two strands wound around each other. The bases of one strand pair with the bases of the other by **hydrogen bonds**: A always with T, C always with G. The two strands are therefore **complementary**: knowing one strand tells you the other exactly. This is why DNA can be copied, and why sequencing one strand is enough.

G–C pairs have three hydrogen bonds, A–T pairs only two, so **GC-rich DNA holds together more tightly** and AT-rich regions are easier to pull apart. Replication origins and promoters tend to be AT-rich for that reason.

**Direction.** Each strand has a direction. One end is called **5′** ("five prime") and the other **3′**, after the numbering of carbon atoms in the sugar. The two strands of a helix run in **opposite** directions (they are **antiparallel**). By convention we always write a strand from 5′ to 3′.

```text
5′-ATGATCAAG-3′     top strand, read left to right
3′-TACTAGTTC-5′     bottom strand: complementary, running the other way
```

**Reverse complement.** To write the bottom strand in the standard 5′→3′ direction, read it right to left: `CTTGATCAT`. In code, that is: **reverse** the string and **complement** each letter. It is the single most-used operation in bioinformatics, because a read, a binding site or a gene can be on either strand.

$$\text{revcomp}(\texttt{ATGATCAAG}) = \texttt{CTTGATCAT}$$

```python
def reverse_complement(s):
    comp = {"A": "T", "T": "A", "C": "G", "G": "C"}
    return "".join(comp[b] for b in reversed(s))
```

Build a strand below and watch its complement and reverse complement update.

{{widget:dna-builder}}

**Upstream and downstream.** Relative to a gene, sequence on its 5′ side is **upstream** (where the switches that turn it on usually sit) and sequence on the 3′ side is **downstream**. Genes can be on either strand, so "upstream" always means relative to the gene's own direction.

## Replication: copying the genome

Watson and Crick ended their 1953 paper on the double helix with a famous understatement: *"It has not escaped our notice that the specific pairing we have postulated immediately suggests a possible copying mechanism for the genetic material."* Because each strand determines the other, each strand can serve as a template for a new partner.

Watch this short animation first; the steps below then name what you saw.

{{video:TNKWgcFPHqw}}

1. **Unwinding.** The two strands separate, starting at a specific place called the **origin of replication** (in bacteria, **oriC**). Separation creates a Y-shaped **replication fork** that moves along the DNA.
2. **Templates.** Each old strand is a template. The enzyme **DNA polymerase** walks along a template and adds the complementary nucleotide at each position.
3. **The one-way rule.** DNA polymerase can only build a new strand in the **5′→3′** direction (reading the template 3′→5′). One new strand, the **leading strand**, points the same way the fork moves, so it is built continuously.
4. **The lagging strand.** The other new strand points the opposite way. It is built **backwards in short pieces** called **Okazaki fragments** (about 1,000–2,000 bases in bacteria), each started as the fork opens more DNA. The enzyme **DNA ligase** then joins the fragments.
5. **Result.** Two double helices, each with one old and one new strand. This is called **semi-conservative** replication.

**Why this matters for the course.** The lagging strand spends more time single-stranded, and single-stranded DNA mutates differently. Over evolutionary time that leaves a measurable imbalance between G and C on the two halves of a bacterial chromosome, called the **GC skew**. The next lesson turns that into an algorithm that finds oriC.

:::think Why can't DNA polymerase just copy both strands continuously, in the same direction as the fork?
Because it can only add a nucleotide to the **3′ end** of a growing strand, so new DNA always grows 5′→3′. The two template strands run in opposite directions, so the new strand on one of them must grow *away* from the fork. The cell solves this by building that strand backwards in short Okazaki fragments and stitching them together, which is the asymmetry the oriC lesson exploits.
:::

## Transcription: DNA → RNA

DNA stays in the nucleus as the master copy. To use a gene, the cell makes a working copy in **RNA** (ribonucleic acid). This is **transcription**.

**How it works.**
- Proteins called **transcription factors** bind short signals in the **promoter**, the region just upstream of a gene, and recruit **RNA polymerase** to the **transcription start site (TSS)**.
- RNA polymerase reads one DNA strand, the **template strand**, and builds a complementary RNA, 5′→3′.
- The RNA therefore has the same sequence as the *other* DNA strand, the **coding strand**, except that **T is replaced by U**. That's why gene sequences are written as the coding strand.

**RNA vs DNA.** RNA uses the base **U (uracil)** instead of T, its sugar is **ribose** (deoxyribose is ribose missing one oxygen atom, hence "deoxy"), and it is usually **single-stranded**, so it can fold back on itself into shapes.

**Processing in eukaryotes.** The first RNA copy (pre-mRNA) is edited before it leaves the nucleus. This happens after transcription. (The lecture slide calls it "post-translational", which is a slip: the correct term is post-transcriptional.)
- **Splicing** cuts out **introns** and joins the **exons** (the parts that remain). Human genes are mostly intron: exons can be a small fraction of a gene's length.
- **Alternative splicing** includes different subsets of exons, so one gene can produce several versions of a protein (**isoforms**).
- A **5′ cap** (a modified G) is added at the front, and a **poly(A) tail** (a run of A's) at the end. Both protect the RNA and help it get translated.

**Kinds of RNA you should know:**

| RNA | Job |
|---|---|
| **mRNA** (messenger) | carries a protein's recipe to the ribosome |
| **tRNA** (transfer) | adapter: its 3-base **anticodon** pairs with a codon, and it carries the matching amino acid |
| **rRNA** (ribosomal) | the structural and catalytic core of the ribosome |
| **snRNA** (small nuclear) | part of the splicing machinery |
| miRNA, lncRNA, … | regulate other genes (common in modern research) |

## Translation: RNA → protein and the genetic code

The **ribosome** reads an mRNA and builds a protein. It reads the mRNA in non-overlapping groups of three bases called **codons**, and each codon specifies one **amino acid** (or "stop").

**Counting codons.** With 4 bases and 3 positions there are $4^3 = 64$ codons, but only 20 amino acids. So the code is **redundant** (also called *degenerate*): most amino acids have several codons. For example, GCU, GCC, GCA and GCG all mean alanine.

- **AUG** is the **start codon**; it also codes methionine (M), so most proteins begin with M.
- **UAA, UAG, UGA** are **stop codons**: they end the protein.
- 61 sense codons + 3 stops = 64.

**Worked example.** The mRNA `AUG GCC UUU UAA` translates to **M A F** then stop (methionine, alanine, phenylalanine).

**Reading frames.** The same string gives a different protein depending on where you start counting triplets. Take the DNA `ATGGCCTTTTAA`:

| Frame | Codons | Protein |
|---|---|---|
| start at base 1 | ATG GCC TTT TAA | M A F (stop) |
| start at base 2 | TGG CCT TTT | W P F |
| start at base 3 | GGC CTT TTA | G L L |

Each strand has 3 frames, and there are 2 strands, so a DNA sequence has **6 possible reading frames**. An **open reading frame (ORF)** runs from a start codon to the next in-frame stop codon. Long ORFs are a first clue that a region codes for a protein. That idea is the start of gene finding.

:::think One letter in a gene's coding sequence changes. Why is that sometimes harmless and sometimes catastrophic, while deleting a single letter is almost always catastrophic?
A **substitution** changes one codon. Because the code is redundant, it may still code the same amino acid (a *synonymous* change, often harmless); it may swap in a similar amino acid; or it may create a stop codon and cut the protein short. A **single-base insertion or deletion** shifts the reading frame: every codon after it is read in the wrong groups of three (a **frameshift**), so the rest of the protein is garbage and usually hits a premature stop. That's also why indels of a multiple of 3 bases are often tolerated better.
:::

{{widget:central-dogma}}

{{game:codon-quest}}

This animation shows transcription and translation together. Watch it now as a recap of the last two sections.

{{video:gG7uCskUOrA}}

## Proteins: sequence → structure → function

Proteins do most of the work in a cell. They are **enzymes** that catalyse chemical reactions, **structural** fibres, **transporters** (hemoglobin carries oxygen), **antibodies**, **signals and receptors**, and **motors** for muscle contraction.

A protein is a chain of amino acids. The 20 amino acids differ in their side chains: some are large, some small, some charged, some water-repelling (**hydrophobic**). The chain folds into a specific 3D shape, driven largely by hydrophobic side chains hiding inside away from water. Biologists describe the structure in four levels:

1. **Primary:** the amino-acid sequence itself, written as a string over 20 letters (e.g., `MKTAYIAK…`).
2. **Secondary:** local repeating shapes held by hydrogen bonds along the backbone, mainly **α-helices** (spirals) and **β-sheets** (side-by-side strands).
3. **Tertiary:** the complete 3D fold of one chain.
4. **Quaternary:** several chains assembled together. Hemoglobin is four chains (2 α + 2 β).

{{video:hok2hyED9go}}

**Anfinsen's principle:** for many proteins the amino-acid sequence alone determines the folded structure, and the structure determines the function. Predicting structure from sequence was a 50-year grand challenge. **AlphaFold 2** (2020) essentially solved it for single protein chains, which earned the **2024 Nobel Prize in Chemistry** (see the *Frontiers* track).

:::cs Why this matters to you
- *Similar sequence → similar structure → similar function.* This is why **sequence alignment** is so useful: if a new gene aligns well to a well-studied one, it probably does something similar.
- Proteins are just strings over a 20-letter alphabet, and DNA is a string over 4. String algorithms, probabilistic models and language models all apply directly.
:::

## Gene regulation: when and how much

Not every gene is active all the time. A liver cell needs different proteins from a neuron, and a bacterium needs different enzymes depending on its food. **Gene regulation** controls **when**, **where** and **how much** each gene is expressed.

- **Promoters** (just upstream of a gene) and **enhancers** (sometimes thousands of bases away) contain short **regulatory motifs**, typically 6–20 bases long. These are binding sites for **transcription factors (TFs)**.
- When a TF binds, it helps (an *activator*) or blocks (a *repressor*) RNA polymerase.
- One TF usually controls **many genes** that share its motif. Genes switched on together tend to work together, so finding a shared motif in a set of genes tells you something about their function. That connects the *Regulatory Motifs* lesson (find the motif) with the *Gene Expression* lessons (find genes that behave alike).
- Regulation forms **networks** with feedback. The plant circadian clock is a classic example: the protein TOC1 activates the genes LHY and CCA1, whose proteins in turn repress TOC1, which creates a daily oscillation. The *Biological Networks* lesson studies such systems.

:::sota The central dogma as a data pipeline
DNA (genome sequencing, variant calling) → RNA (RNA-seq: which genes are on, and how they are spliced) → protein (mass-spectrometry proteomics, AlphaFold structures) → interactions (networks). Each arrow is a research field with its own "-omics" and its own data.
:::

## Where to practice

- **Rosalind** is the problem-solving platform the course uses. Every major algorithm on this site links its Rosalind problem under **Further reading**. Start with the *Bioinformatics Textbook Track*: BA1A (count a pattern), BA1C (reverse complement), and so on.
- The lecture notebook *Sequence_reads.ipynb* walks through Python strings, reverse complement, reading a genome from a FASTA file, parsing FASTQ and Phred qualities, and exact matching of real reads against the φX174 virus genome. The Sequencing and Read Mapping lessons follow it.

{{ref:tools#file-formats|tools#reading-fasta-and-fastq-in-python|tools#databases-you-will-use}}
