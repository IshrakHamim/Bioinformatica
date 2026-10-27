Every algorithm in this course eats data produced by a **sequencer**. To trust your analyses, and to debug them when they look wrong, you need to know how reads are made, what errors look like, and how a sequencer tells you how confident it is in each letter. This lesson tells the story from the Human Genome Project to today's long-read machines.

The lecture deck is adapted from Ben Langmead's course on DNA sequencing. His short introduction is good context before you start:

{{video:hpb-mH-yjLc}}

## The Human Genome Project and the race

- **Proposed in 1987** by the U.S. Department of Energy (not the NIH!) as biology's "Manhattan Project". NIH opened its genome office in 1989, and the project formally launched in **1990** as a joint NIH–DOE effort with international partners. The Sanger Centre in the UK was the largest centre outside the US.
- **Goal:** sequence about 3 billion base pairs at roughly **$1 per base, by 2005**.
- **The strategy debate.** The public project first mapped the genome into large ordered pieces and sequenced each piece. Others argued for **whole-genome shotgun** sequencing: break the *entire* genome into random fragments, sequence them all, and let a computer assemble them (the Assembly lesson). Critics thought shotgun assembly would fail on repeats.
- **1995:** TIGR (Craig Venter, Hamilton Smith) sequenced the first complete bacterial genome, *Haemophilus influenzae* (about 1.8 Mb, ~1,740 genes), by whole-genome shotgun.
- **1998:** Venter founded **Celera Genomics**, a company using new Applied Biosystems capillary sequencers. **2000:** Celera and academic partners published the fruit fly genome, showing shotgun assembly works on a large animal genome.
- **2001:** two draft human genomes were published back to back: the public consortium's in *Nature* and Celera's in *Science*. The "essentially finished" sequence followed in 2003. The last ~8% (centromeres, telomeres, large duplicated regions) had to wait for the **T2T** genome in 2022.
- Gene count estimates kept falling during the project, from about 100,000 to today's ~20,000 protein-coding genes.

:::think Why did the Department of Energy, not the NIH, first propose the Human Genome Project?
The DOE grew out of the atomic-energy programme and had studied the effects of **radiation on DNA** for decades, including inherited mutations in survivors of Hiroshima and Nagasaki. Detecting such mutations needed better ways to map and sequence DNA. The DOE also ran national laboratories with the large-scale engineering and computing experience that a genome project required.
:::

{{widget:timeline}}

## From Sanger to massively parallel sequencing

**Sanger sequencing (first generation, 1977).** DNA polymerase copies a template in the presence of normal nucleotides plus a small amount of **dideoxynucleotides**, modified nucleotides that stop the chain when they are added. This produces copies that end at every possible position, each tagged by the identity of its last base. Sorting the fragments by length (capillary electrophoresis) reads the sequence one position at a time. Sanger reads are long (about 800–1,000 bases) and accurate, but each capillary reads **one fragment** per run, so it is slow and expensive at genome scale. It is still the gold standard for checking a single PCR product.

**Second generation ("next-generation sequencing", about 2005 onwards).** The key idea is **massive parallelism**: sequence **hundreds of millions to billions of fragments at once** on a glass slide called a **flow cell**. The cost of a human genome fell from about $100 million (2001) to under $1,000, much faster than Moore's law. The dominant chemistry is Illumina's **sequencing by synthesis (SBS)**, which the lecture explains with a Lego animation.

Watch Illumina's own animation first; the steps below name each stage you'll see.

{{video:fCd6B5HRaZ8}}

1. **Library preparation.** Fragment the DNA (for example into ~300–500-base pieces) and attach short known **adapter** sequences to both ends.
2. **Cluster generation.** Fragments bind to complementary adapters fixed on the flow cell. Each is copied in place over and over (**bridge amplification**), forming a **cluster** of about a thousand identical copies. A single molecule's signal is too faint to see; a cluster's is bright enough.
3. **Sequencing cycle.** Add all four nucleotides at once. Each kind carries a different **fluorescent dye** and a **reversible terminator**, a chemical "speed bump" that stops the polymerase after adding **exactly one base**.
4. **Imaging.** A laser excites the dyes and a camera photographs the whole flow cell. Each cluster glows in the colour of the base it just added.
5. **Cleave and repeat.** Chemically remove the dye and the terminator, and repeat for 100–300 cycles. The series of colours a cluster shows over time is its **read**.

The base pairing you learned in the Introduction is what makes this work: the base added in each cycle is the complement of the template base.

:::story Reading a strand by photographing its copy
We never read the original strand directly. Instead we **build its complementary copy one letter at a time and take a photograph after every letter**. Each new letter glows in its own colour, so the sequence of colours in one spot *is* the sequence of the copy, and by base pairing, of the original.

Why the **reversible terminator** is the heart of the method: it guarantees exactly one letter is added per cycle in *every* cluster at once. Without it, the polymerase would race ahead several letters between photographs and we could not tell how many were added. With it, a billion clusters march in lockstep, one letter per photograph. That lockstep is what "massively parallel" means.
:::

{{ref:intro#dna-the-four-letter-molecule}}

{{widget:sbs}}

## Where errors come from

Within one cluster, all the copies should stay perfectly in step: after cycle 50, every copy should have just added base 50. But chemistry is imperfect:

- Sometimes a strand **fails to add a base** in a cycle, so it falls one step behind (**phasing**).
- Sometimes a terminator fails and a strand adds **two bases**, so it jumps ahead (**pre-phasing**).

Out-of-step copies glow with the *wrong* colour for the current position. The fraction of out-of-step copies grows with every cycle, so:

- the cluster's light becomes a **mixture** of colours,
- the base call becomes **less certain**, and
- quality **declines toward the end of reads**. That is why reads are often **trimmed** at their 3′ end before analysis.

**Base quality.** For every base it calls, the sequencer estimates p, the **probability that the call is wrong**. (In the slides' Lego example, 3 of 9 light units are the wrong colour, so p = 1/3.) It reports this as a **Phred quality score**:

$$Q = -10 \log_{10} p, \qquad p = 10^{-Q/10}$$

Each +10 in Q means **10 times fewer errors**:

| Q | error probability | accuracy |
|---|---|---|
| 10 | 1 in 10 | 90% |
| 20 | 1 in 100 | 99% |
| 30 | 1 in 1,000 | 99.9% |
| 40 | 1 in 10,000 | 99.99% |

**Worked examples.**
- p = 1/3: Q = −10 log₁₀(1/3) ≈ **4.77**, a very unreliable call.
- Q = 25: p = 10⁻²·⁵ ≈ 0.0032, about 1 error in 316.
- **Expected errors in a read:** add the error probabilities. A 100-base read with every base at Q30 has 100 × 0.001 = **0.1** expected errors; the same read at Q20 has 1.

:::think A 100-base read has Q > 30 for its first 70 bases and Q < 15 for its last 30. Map the whole read or a trimmed one?
Map the **trimmed** read (the first 70 bases). Q < 15 means more than a 3% chance of error per base (Q15 → p ≈ 0.032), so the tail probably contains one or more errors. Those mismatches can make the aligner fail to place the read, lower its score until it is discarded, or worst of all pull it to the **wrong** location. Seventy accurate bases are still long enough to map uniquely in most of the genome. Accuracy beats length.
:::

{{ref:math#logarithms-likelihood-and-log-odds}}

## FASTQ files and Phred+33

Reads and their qualities are stored in **FASTQ** files, four lines per read:

```text
@ERR194146.1 HSQ1008:141:D0CC8ACXX:3:1308:20201:36071/1     ← read name
ACATCTGGTTCCTACTTCAGGGCCATAAAGCCTAAATAGCCCACACGTTCCCCTTAAAT  ← sequence
+                                                            ← separator (ignore)
?@@FFBFFDDHHBCEAFGEGIIDHGH@GDHHHGEHID@C?GGDG@FHIGGH@FHBEG:G  ← one quality character per base
```

**Phred+33 encoding.** To store each quality as a single character, round Q to an integer, **add 33**, and take the ASCII character with that code. (33 is the first printable ASCII character, `!`, so Q = 0 is `!`.) To decode, take the character's ASCII code and subtract 33:

- `I` has ASCII code 73, so Q = 73 − 33 = **40** (error 1 in 10,000).
- `5` has code 53, so Q = **20**.
- `#` has code 35, so Q = **2** (Illumina uses this for "don't trust this base").

```python
def QtoPhred33(Q):   return chr(Q + 33)
def phred33ToQ(ch):  return ord(ch) - 33

[phred33ToQ(c) for c in "?@@FF"]   # [30, 31, 31, 37, 37]
```

{{ref:tools#file-formats|tools#reading-fasta-and-fastq-in-python}}

{{widget:phred}}

{{game:phred-flash}}

:::think Decode the quality string `#!J`.
Subtract 33 from each ASCII code: `#` is 35 → **Q = 2**; `!` is 33 → **Q = 0**; `J` is 74 → **Q = 41**. The first two bases are essentially guesses (Q0 means p = 1); the third is wrong less than once in 10,000 calls.
:::

:::example Cleaning a FASTQ file before analysis (quality control)
Never trust raw reads. A standard first step, before assembly, mapping or variant calling:

1. **Look first.** Run **FastQC** (or MultiQC over many files). It plots quality by position, GC content, adapter content and duplication levels, so you can see what is wrong before fixing it.
2. **Trim adapters.** If a DNA fragment is shorter than the read length, the sequencer reads past the fragment into the adapter on the other end. Those adapter letters are not from the genome and must be cut off.
3. **Trim low-quality bases.** A common method is a **sliding window**: move a window of 4–5 bases along the read and cut the read where the window's mean quality drops below a threshold (e.g., Q20). Many tools also clip low-quality bases at the very start and end.
4. **Drop reads that became too short** (e.g., under 30–50 bases): short reads map ambiguously.

Tools that do steps 2–4: **fastp**, **cutadapt**, **Trimmomatic**. Run FastQC again afterwards to confirm the problem is fixed.
:::

:::cs From the course notebook (Sequence_reads.ipynb)
The notebook reads the φX174 genome from a FASTA file (skipping lines that start with `>`), parses a FASTQ file (lines 2 and 4 of every group of 4), builds a **histogram of base qualities**, plots **GC content by position in the read** and **mean quality by position**, and then maps reads to the genome by naive exact matching. At first only some reads match. They match much better once you (1) use only the first 30 bases of each read, where errors are rare, and (2) also search for the **reverse complement**, because reads come from both strands.
:::

## Third-generation (long-read) sequencing

Short reads are cheap and accurate, but 150 bases cannot span a 6,000-base repeat. **Third-generation** technologies read single DNA molecules, producing reads thousands to millions of bases long.

| Technology | How it works | Read length | Accuracy |
|---|---|---|---|
| Illumina SBS | cyclic reversible terminators on amplified clusters | 50–300 bp | ~99.9% |
| PacBio HiFi | a single DNA polymerase is watched in real time as it copies a circular template; going round the circle many times gives a consensus | ~15–25 kb | > 99.9% (HiFi consensus) |
| Oxford Nanopore | a single DNA strand ratchets through a protein pore in a membrane; each group of bases in the pore changes the electrical current, and neural networks decode the current trace into bases | kb to > 1 Mb | ~99% for a single read with recent chemistry |

**Why long reads matter.**
- They span repeats, which makes assembly far easier (the T2T human genome relied on them).
- They capture **structural variants** (large insertions, deletions, inversions) that short reads miss.
- They read **full-length RNA transcripts**, revealing isoforms directly.
- Nanopore reads **base modifications** such as methylation directly from the current signal, and a nanopore sequencer can be the size of a USB stick.

This video explains how nanopore sequencing reads a molecule as it passes through the pore:

{{video:bS3NiFLwPqE}}

## Beyond genome sequencing: what "-seq" measures

A sequencer reads DNA, but almost any biological question can be turned into DNA to read. That's why so many experiments end in "-seq":

- **WGS / WES:** whole genome / whole exome (just the exons) → find **variants**.
- **RNA-seq:** convert RNA into DNA (cDNA) with reverse transcriptase, then sequence → measure **gene expression** (Gene Expression lessons). **scRNA-seq** adds a barcode per cell.
- **ChIP-seq:** pull down the DNA bound by a specific protein (a transcription factor or histone mark) → find **binding sites**.
- **ATAC-seq / DNase-seq:** sequence DNA that is accessible, not tightly packed → find **open chromatin** and active regulatory regions.
- **Bisulfite sequencing:** chemical treatment converts unmethylated C to U, so methylated and unmethylated C read differently → map **DNA methylation**.
- **Metagenomics:** sequence all DNA in an environmental or gut sample → which **species** and genes are present.

Each produces FASTQ files of reads. The next lesson answers the first question in almost every pipeline: given billions of reads and a reference genome, **where does each read come from?**
