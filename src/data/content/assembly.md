**Biological question:** sequencers cannot read a genome from end to end. They read millions of short fragments (**reads**) from random positions. How do we put the genome back together? This is the **exploding newspaper problem**: many copies of the same newspaper blown to pieces, and we must reconstruct the text from overlapping scraps, some of which are lost. This module follows Chapter 3 of Compeau & Pevzner.

## Why assembly is hard

Scale: the human genome is ~3 billion bp; *Amoeba dubia*'s is reportedly ~200 times longer. The first genome sequenced, bacteriophage **φX174** (5,386 nt), was done by Fred Sanger in 1977.

Real-world difficulties:
1. We don't know which **strand** a read came from.
2. Reads contain **errors**.
3. Some regions are **not covered** by any read.
4. **Repeats.** About 50% of the human genome is repetitive. For example, the ~300-nt **Alu** element occurs over a million times with only small variations. Reads inside a repeat could come from anywhere.

**Simplifying assumptions for now** (Mid exam 2(b) asks about these!):
1. All reads are k-mers of the same length k.
2. All reads come from the same strand.
3. Reads have **no errors** and achieve **perfect coverage**: every k-mer of the genome is read (exactly once).

## String composition and reconstruction

- $\text{Composition}_k(Text)$ = the multiset of all k-mers of Text (including repeats), usually listed lexicographically. Example: $\text{Composition}_3(\texttt{TATGGGGTGC})$ = {ATG, GGG, GGG, GGT, GTG, TAT, TGC, TGG}.
- **String Reconstruction Problem.** *Input:* integer k and a collection of k-mers. *Output:* a string whose k-mer composition equals the collection.
- If the k-mers were *ordered* (a **genome path**, where each k-mer's last k − 1 symbols equal the next one's first k − 1), spelling the string is trivial: take the first k-mer and append the last symbol of each subsequent one. The result has length **k + n − 1**.

Define **Prefix(Pattern)** = first k − 1 symbols and **Suffix(Pattern)** = last k − 1 symbols.

## Overlap graphs and Hamiltonian paths

**Overlap graph:** one node per k-mer, and a directed edge Pattern → Pattern′ whenever Suffix(Pattern) = Prefix(Pattern′). A genome is then a path that visits **every node exactly once**: a **Hamiltonian path**.

The problem: finding a Hamiltonian path is **NP-complete**. No efficient algorithm is known for general graphs. (Fun connection from the slides: **k-universal binary strings**, which contain every binary k-mer exactly once, such as `0001110100` for k = 3, are the same kind of problem.)

## de Bruijn graphs and Eulerian paths

Flip the representation: make the **(k − 1)-mers nodes** and the **k-mers edges**.

**DeBruijn(Patterns):** for each k-mer, draw an edge Prefix(k-mer) → Suffix(k-mer). Identical (k − 1)-mers are glued into one node; repeated k-mers become parallel edges.

Now the genome is a walk that uses **every edge exactly once**: an **Eulerian path**. That is easy.

{{widget:debruijn preset="mid"}}

:::cs Euler's theorem (directed version)
A node is **balanced** if in-degree = out-degree. **Every balanced, strongly connected directed graph is Eulerian** (has an Eulerian cycle). A graph has an Eulerian **path** iff it is connected and balanced except for exactly two nodes: a start with out = in + 1 and an end with in = out + 1. Adding a temporary edge end → start makes it balanced, so find a cycle and then cut that edge.
:::

**Hierholzer's algorithm (linear time):** start anywhere (at the start node for a path) and walk unused edges until you get stuck. That always happens at the start (cycle) or the end (path). If unused edges remain, restart a walk from a node on your current cycle that still has unused edges and splice the new cycle in. Total time O(|E|).

Historical root: **Euler (1735)** proved the **Bridges of Königsberg** walk impossible (four land masses connected by seven bridges) because the nodes had odd degree. Hamilton's version (visit every *node*) looks similar but is computationally much harder.

:::exam Mid exam 2(a): reads AGC, ATG, CAG, CTG, GCA, GCT, TGA, TGC
Edges (prefix → suffix): AG→GC, AT→TG, CA→AG, CT→TG, GC→CA, GC→CT, TG→GA, TG→GC.
Degrees: **AT** has out 1, in 0 (start); **GA** has in 1, out 0 (end); every other node is balanced (GC and TG have in = out = 2).
Eulerian path: AT → TG → GC → CA → AG → GC → CT → TG → GA.
Spell: **ATGCAGCTGA** (length 3 + 8 − 1 = 10). Check: its 3-mer composition is exactly the 8 given reads. Taking TG → GA first would strand the remaining edges, which is why Hierholzer explores until stuck and then splices cycles.
:::

## Read pairs and paired de Bruijn graphs

Longer reads would resolve repeats, but long reads used to be very error-prone. Instead, biologists generate **read pairs**: two k-mers separated by a known distance d in the genome, forming a “gapped read” of length k + d + k whose middle is unknown.

- A **(k, d)-mer** is a pair (a | b). Example from the slides: the (3, 2)-mers of `TAATGCCATGGGATGTT` (two 3-mers with a gap of 2 between them) start with (TAA|CCA), (AAT|CAT), (ATG|ATG), …
- **Paired de Bruijn graph:** nodes are pairs of (k − 1)-mers (prefix of a | prefix of b), and edges are read pairs. Read pairs carry information across repeats, so many false paths disappear.
- **Caveat:** in a paired de Bruijn graph, not every Eulerian path spells a valid genome; the spelled top and bottom strings must agree after the gap. We check that while reconstructing (String Spelled by a Gapped Genome Path).

## Real data: coverage, errors, contigs

**Imperfect coverage → read breaking.** If 10-mer reads miss some genome 10-mers, break each read into all its shorter k-mers (e.g., 5-mers): coverage of 5-mers is far more likely to be perfect. Trade-off: **smaller k gives better coverage but a more tangled graph** (more repeated (k − 1)-mers).

{{widget:read-breaking}}

**Contigs.** Even after read breaking, gaps and repeats prevent a single Eulerian path. Assemblers output **contigs**: long contiguous segments corresponding to **maximal non-branching paths** in the graph. In practice, genomes are almost always assembled into contigs, which are then ordered into **scaffolds** using read pairs.

**Sequencing errors → bubbles and tips.** A read with one error (`CGTACGGACA` vs `CGTATGGACA`) creates k wrong k-mers, forming a **bubble** (two alternative paths between the same nodes) or a dead-end **tip**. Erroneous k-mers are rare (low count), so assemblers remove low-frequency k-mers and pop bubbles.

:::exam Mid exam 2(b): unrealistic assumptions and how they are handled
| Assumption in class | Reality | What assemblers do |
|---|---|---|
| all reads are k-mers of one length | reads vary in length | **read breaking** into k-mers; choose k (or several k) |
| perfect coverage | random sampling misses regions | high **depth** (30×+), read breaking, output **contigs** instead of one path |
| no errors | 0.1–1% (short reads) or more (long reads) | **error correction** by k-mer counting; remove **tips**, pop **bubbles** |
| single known strand | reads come from both strands | add each read **and its reverse complement** (canonical k-mers) |
| unique Eulerian path | **repeats** give many paths | **paired-end / mate-pair** reads, **long reads** (PacBio HiFi, Nanopore), scaffolding |
:::

:::sota State of the art
- Short-read assemblers based on de Bruijn graphs: Velvet (2008), SPAdes, MEGAHIT (metagenomes).
- **Long reads** changed everything: PacBio HiFi reads (~15–20 kb at > 99.9% accuracy) and Oxford Nanopore ultra-long reads (100 kb+) span most repeats. Assemblers like **hifiasm** and **Verkko** use string/overlap graphs again, because long reads are few enough to make overlap-based methods practical.
- The **Telomere-to-Telomere (T2T) consortium** published the first truly complete human genome (CHM13) in *Science* (2022), adding ~200 Mb missing from the reference GRCh38. The **Human Pangenome Reference Consortium** released a draft pangenome of 47 individuals in *Nature* (2023), represented as a **graph** of variation.
:::

## Summary

- Overlap graph → Hamiltonian path (NP-complete). de Bruijn graph → Eulerian path (linear time).
- de Bruijn graphs scale to billions of reads because they store each distinct (k − 1)-mer once.
- Practical assembly = error correction + de Bruijn graph + simplification + contigs + scaffolding with pairs/long reads.
