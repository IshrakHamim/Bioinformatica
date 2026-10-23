Every algorithm in this course eats data produced by a **sequencer**. To trust (and debug) your analyses you must know how reads are made, what errors look like, and how quality is encoded.

## The Human Genome Project and the race

- **Proposed in 1987** by the U.S. Department of Energy (not NIH!) as biology's “Manhattan project”; NIH's genome office opened in 1989 and the project formally launched in **1990** as a joint NIH–DOE effort with international partners. The Sanger Centre (UK) was the largest center outside the US.
- Goal: sequence ~3 billion bp at about **$1 per base by 2005**.
- **1995:** TIGR (Craig Venter, Hamilton Smith) sequenced the first complete bacterial genome, *Haemophilus influenzae* (~1.8 Mb, ~1,740 genes), by **whole-genome shotgun** sequencing.
- **1998:** Venter founded **Celera Genomics** (for-profit) with new Applied Biosystems capillary machines. **2000:** Celera published the fruit fly genome, showing shotgun assembly works at large scale.
- **2001:** two draft human genomes were published back to back: the public consortium in *Nature* and Celera in *Science*. The essentially finished sequence followed in 2003. The last ~8% (centromeres, telomeres, segmental duplications) waited until the **T2T** genome (2022).
- Gene count estimates kept falling, from ~100,000 to today's ~20,000 protein-coding genes.

{{widget:timeline}}

## From Sanger to massively parallel sequencing

**Sanger (first-generation, 1977):** chain-terminating dideoxynucleotides produce fragments ending at each base; capillary electrophoresis reads ~800–1,000 bp per run with high accuracy, but one fragment per capillary. That is slow and expensive.

**Second generation (“next-generation”, ~2005+):** sequence **billions of fragments in parallel** on a glass flow cell. Cost per genome fell from ~$100 million (2001) to under $1,000, far faster than Moore's law. The dominant chemistry is Illumina's **sequencing by synthesis (SBS)**, the subject of the lecture's Lego animation:

1. **Library prep:** fragment DNA, ligate adapters.
2. **Cluster generation:** each fragment attaches to the slide and is amplified in place into a **cluster** of identical copies (*bridge amplification*), giving billions of templates.
3. **Cycle:** add all four nucleotides, each with a different **fluorescent dye** and a **reversible terminator** (“speed bump”), so every strand extends by **exactly one base**.
4. **Image:** laser excites dyes; a camera photographs the whole slide. Each cluster's color = the base just added.
5. **Cleave** dye and terminator; repeat for 100–300 cycles. The color sequence of a cluster is its **read**.

{{widget:sbs}}

{{yt:fCd6B5HRaZ8|Overview of Illumina Sequencing by Synthesis Workflow (Illumina)}}

## Where errors come from

Within a cluster, the copies should stay in lock-step. But occasionally a strand **fails to incorporate** a base in a cycle (falls behind, *phasing*) or a terminator fails and it adds **two** bases (jumps ahead, *pre-phasing*). Out-of-sync copies emit the *wrong* color. The fraction grows each cycle, so:

- the cluster's light becomes a **mixture** of colors,
- base calls become **uncertain**, and
- quality **decreases toward the end of reads**, which is why reads are trimmed.

**Base quality.** The sequencer estimates p = probability the call is wrong (in the slides: 3 of 9 light units are non-orange, so p = 1/3) and reports a **Phred quality**
$$Q = -10 \log_{10} p, \qquad p = 10^{-Q/10}$$

| Q | error probability | accuracy |
|---|---|---|
| 10 | 1 in 10 | 90% |
| 20 | 1 in 100 | 99% |
| 30 | 1 in 1,000 | 99.9% |
| 40 | 1 in 10,000 | 99.99% |

Slide example: p = 1/3 → Q = −10 log₁₀(1/3) ≈ **4.77**.

## FASTQ files and Phred+33

Reads are stored as **FASTQ**, four lines per read:

```text
@ERR194146.1 HSQ1008:141:D0CC8ACXX:3:1308:20201:36071/1     ← name
ACATCTGGTTCCTACTTCAGGGCCATAAAGCCTAAATAGCCCACACGTTCCCCTTAAAT  ← sequence
+                                                            ← (ignore)
?@@FFBFFDDHHBCEAFGEGIIDHGH@GDHHHGEHID@C?GGDG@FHIGGH@FHBEG:G  ← qualities
```

Each quality character encodes Q in **Phred+33**: round Q, add 33, and take the ASCII character. `I` = 73 − 33 = **Q40**; `#` = Q2.

```python
def QtoPhred33(Q):   return chr(Q + 33)
def phred33ToQ(ch):  return ord(ch) - 33
```

{{widget:phred}}

{{game:phred-flash}}

:::cs From the course notebook (Sequence_reads.ipynb)
The notebook reads the φX174 genome from FASTA (skip lines starting with `>`), parses a FASTQ file (lines 2 and 4 of every 4), builds a **histogram of base qualities**, plots **GC content by read position** and **mean quality by position**, then maps reads with naive exact matching. Real reads match only partially until you (1) use just the first 30 bases (fewer errors) and (2) also search the **reverse complement**, because reads come from both strands.
:::

## Third-generation (long-read) sequencing

| Technology | How | Read length | Accuracy (raw / consensus) |
|---|---|---|---|
| Illumina SBS | cyclic reversible terminators | 50–300 bp | ~99.9% |
| PacBio HiFi | single DNA polymerase watched in real time; circular template read many times | ~15–25 kb | > 99.9% (HiFi) |
| Oxford Nanopore | DNA ratchets through a protein pore; current changes decoded by neural networks | kb to > 1 Mb | ~99% simplex with recent chemistry |

Long reads span repeats (assembly!), structural variants and full-length RNA isoforms. Nanopore also reads **base modifications** (e.g., methylation) directly and runs on a USB-sized device.

{{yt:bS3NiFLwPqE|Oxford Nanopore ONT Sequencing (RobEdwards)}}

## Beyond genome sequencing: what “-seq” measures

The same machines read anything you can turn into DNA:

- **WGS / WES:** whole genome / exome → variants.
- **RNA-seq:** reverse-transcribe RNA to cDNA → expression (Modules 7–8). **scRNA-seq** adds cell barcodes.
- **ChIP-seq:** DNA bound by a protein (TF, histone mark).
- **ATAC-seq / DNase-seq:** open chromatin.
- **Bisulfite-seq:** DNA methylation.
- **Metagenomics:** all DNA in an environmental or gut sample.

Next module: given billions of reads and a reference genome, **where does each read come from?** (read mapping).
