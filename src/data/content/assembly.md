**Biological question:** sequencers cannot read a genome from one end to the other. They read millions of short fragments, called **reads**, taken from random positions. How do we put the genome back together? The textbook calls this the **exploding newspaper problem**: imagine a stack of copies of the same newspaper blown to pieces. You must reconstruct the text from overlapping scraps, and some scraps are lost. This lesson follows Chapter 3 of Compeau & Pevzner and shows how the right choice of graph turns an intractable problem into an easy one.

## Why assembly is hard

**Scale.** The human genome has about 3 billion base pairs. Some plant and amoeba genomes are much larger still. The first genome ever sequenced, the virus **φX174** (5,386 nucleotides), was done by Fred Sanger's group in 1977.

**How reads arise.** Many copies of the genome are broken at random places, and each fragment is read from one end, giving a read of, say, 100–300 letters for Illumina. With enough reads, every position is covered many times, and neighbouring reads **overlap**. Assembly is the process of using those overlaps to chain reads back into the genome.

**What makes it difficult in reality:**
1. We don't know which **strand** each read came from.
2. Reads contain **errors** (typically 0.1–1% for short reads).
3. Some regions are **not covered** by any read, because sampling is random.
4. **Repeats.** About half of the human genome is repetitive. The ~300-nucleotide **Alu** element, for example, occurs over a million times with small variations. A read lying entirely inside a repeat could have come from any copy, so we cannot tell where it belongs.

This short video states the "laws of assembly": why overlaps let us chain reads, why more coverage helps, and why repeats are the fundamental obstacle. Watch it before continuing.

{{video:dY01jRGFUiI}}

**Simplifying assumptions for now.** To find the core algorithmic idea, the textbook first assumes an ideal world. Remember these; the last section explains how real assemblers relax each one.
1. All reads are k-mers of the same length k.
2. All reads come from the same strand.
3. Reads have **no errors** and achieve **perfect coverage**: every k-mer of the genome is read, exactly once.

## String composition and reconstruction

- $\text{Composition}_k(Text)$ is the collection of all k-mers of Text, **including repeats**, usually listed in lexicographic (alphabetical) order. For example,
$\text{Composition}_3(\texttt{TATGGGGTGC})$ = {ATG, GGG, GGG, GGT, GTG, TAT, TGC, TGG}. Notice GGG appears twice because the genome contains GGGG.
- **String Reconstruction Problem.** *Input:* an integer k and a collection of k-mers. *Output:* a string whose k-mer composition equals the collection.

Under our ideal assumptions, the reads *are* the composition, shuffled. The task is to put them in the right order.

**If we knew the order, spelling the genome would be trivial.** Define **Prefix(Pattern)** as the first k − 1 letters and **Suffix(Pattern)** as the last k − 1 letters. In the genome, consecutive k-mers overlap in k − 1 letters: Suffix of one = Prefix of the next. A sequence of k-mers with this property is a **genome path**. To spell it, write the first k-mer and then append just the last letter of each following k-mer:

```text
TAT
 ATG
  TGG
   GGG
    GGG
     GGT
      GTG
       TGC
TATGGGGTGC      (k + n − 1 = 3 + 8 − 1 = 10 letters for n = 8 k-mers)
```

So the real question is: **how do we find the order?** That's where graphs come in.

{{ref:algo#graphs-the-basics}}

## Overlap graphs and Hamiltonian paths

This video introduces the overlap-graph view of assembly that this section describes.

{{video:yPJ7yHRk2OI}}

**First idea: an overlap graph.** Make one **node for each k-mer** (read). Draw a directed edge from Pattern to Pattern′ whenever Suffix(Pattern) = Prefix(Pattern′): the second could follow the first in the genome.

For the composition of TATGGGGTGC, there is an edge TAT → ATG (because AT = AT), ATG → TGG, TGG → GGG, and so on. The genome corresponds to a path that visits **every node exactly once**, which is a **Hamiltonian path**.

**The problem.** Finding a Hamiltonian path is **NP-complete**. No efficient algorithm is known for general graphs, and with millions of reads, brute-force search over orderings is out of the question.

(Fun connection from the slides: a **k-universal binary string** contains every binary k-mer exactly once, such as `0001110100` for k = 3. Constructing one is the same kind of problem, and its elegant solution, below, is the same trick.)

{{ref:algo#eulerian-and-hamiltonian-paths|algo#np-hardness-and-heuristics}}

## de Bruijn graphs and Eulerian paths

This lecture derives the de Bruijn graph idea with clear examples. It is the most important idea in the lesson, so watch it before or right after reading this section.

{{video:TNYZZKrjCSk}}

**Flip the representation.** Instead of k-mers as nodes, make the **(k − 1)-mers the nodes** and the **k-mers the edges**.

**DeBruijn(Patterns):** for each k-mer, draw an edge from its Prefix to its Suffix. Then **glue** all nodes with the same label into one node. Repeated k-mers become parallel edges between the same two nodes.

**Example.** The 3-mer `ATG` becomes the edge AT → TG. `TGC` becomes TG → GC. The two edges share the node TG, so they chain together, spelling ATGC.

Now the genome is a walk that uses **every edge exactly once**: an **Eulerian path**. And unlike Hamiltonian paths, Eulerian paths are easy to find, in linear time.

:::story The single most important idea in this lesson
Both graphs describe the **same** reads and the same overlaps. The only thing we changed is what we call a node:

- **Reads as nodes** (overlap graph): rebuilding the genome means visiting every *node* once. That is the Hamiltonian path problem, with no known efficient algorithm.
- **Reads as edges** (de Bruijn graph): rebuilding the genome means walking every *edge* once. That is the Eulerian path problem, which Euler solved in 1735 and which runs in linear time.

Same data, different representation, and an impossible problem becomes an easy one. When an algorithm seems hopeless, try changing how you model the data before you try a cleverer search.
:::

:::cs Euler's theorem (directed version)
A node is **balanced** if its in-degree equals its out-degree. **Every balanced, strongly connected directed graph has an Eulerian cycle.** A graph has an Eulerian **path** if and only if it is connected and balanced except for exactly two nodes: a **start** with out = in + 1 and an **end** with in = out + 1. Adding a temporary edge end → start balances the graph; find a cycle, then cut that edge to get the path.
:::

**Why is every node of a genome's de Bruijn graph (nearly) balanced?** Each occurrence of a (k − 1)-mer in the genome is entered by one k-mer and left by the next. So every node has as many incoming as outgoing edges, except the first (k − 1)-mer of the genome (one extra out) and the last (one extra in). Exactly Euler's condition for a path.

**Hierholzer's algorithm (linear time):**
1. Start at the start node and walk along unused edges, choosing any one, until you get stuck. In a balanced graph you can only get stuck at the end node (or back at the start, for a cycle).
2. If unused edges remain, pick a node on your walk that still has unused edges, walk a new cycle from there, and **splice** it into your walk at that node.
3. Repeat until every edge is used. Total time O(|E|).

{{widget:debruijn preset="mid"}}

{{game:euler-trail}}

**Historical root.** In 1735, **Euler** proved that you cannot walk through the city of Königsberg crossing each of its seven bridges exactly once, because its land masses had an odd number of bridges. That was the birth of graph theory. Hamilton's version of the puzzle (visit every *node* once) looks almost identical but is computationally far harder.

:::example Assembling reads AGC, ATG, CAG, CTG, GCA, GCT, TGA, TGC
**Edges** (prefix → suffix): AG→GC, AT→TG, CA→AG, CT→TG, GC→CA, GC→CT, TG→GA, TG→GC.

**Degrees:** **AT** has out 1, in 0, so it is the start; **GA** has in 1, out 0, so it is the end; every other node is balanced (GC and TG have in = out = 2).

**Eulerian path:** AT → TG → GC → CA → AG → GC → CT → TG → GA.

**Spell it:** **ATGCAGCTGA** (length 3 + 8 − 1 = 10). Check: its 3-mer composition is exactly the 8 reads.

**A trap:** if from TG you take TG → GA first, you reach the end with edges left over. That's exactly why Hierholzer explores until stuck, then splices in the cycles it missed.
:::

This four-minute recap walks through de Bruijn assembly once more on a small example:

{{video:OY9Q_rUCGDw}}

## Read pairs and paired de Bruijn graphs

Repeats longer than k create several possible Eulerian paths, and only one is the real genome. Longer reads would resolve repeats, but for a long time long reads were very error-prone. Instead, sequencing labs generated **read pairs**: two reads taken from the two ends of the same longer fragment, so they are separated by a roughly **known distance** d in the genome. A read pair is like a "gapped read" of length k + d + k whose middle is unknown.

- A **(k, d)-mer** is a pair (a | b) of k-mers separated by d letters in the genome. The (3, 2)-mers of `TAATGCCATGGGATGTT` begin (TAA|CCA), (AAT|CAT), (ATG|ATG), … : for example, TAA starts at position 0 and CCA starts 3 + 2 = 5 positions later.
- **Paired de Bruijn graph:** nodes are pairs of (k − 1)-mers (prefix of a | prefix of b), and each read pair is an edge from (prefix a | prefix b) to (suffix a | suffix b). Because each edge carries information from two places in the genome d letters apart, repeats shorter than the pair span often stop creating ambiguity, and many false paths disappear.
- **Caveat:** in a paired de Bruijn graph, not every Eulerian path spells a valid genome. The spelled top string (from the a's) and bottom string (from the b's) must agree once the bottom is shifted by k + d. Reconstruction checks this ("String Spelled by a Gapped Genome Path").

## Real data: coverage, errors, contigs

Now relax the assumptions one by one. This lecture shows what real assemblers do about errors and repeats, and introduces contigs and scaffolds.

{{video:0Ho2__cFsVY}}

**Imperfect coverage → read breaking.** Real sequencing never captures every k-mer. Suppose we have 10-mer reads but some genome 10-mers were never read. Break every read into all of its shorter k-mers, say 5-mers. A genome 5-mer is covered if *any* read covers it, which is much more likely than covering a specific 10-mer. The trade-off: **smaller k gives better coverage but a more tangled graph**, because short (k − 1)-mers are more likely to repeat in the genome by chance.

{{widget:read-breaking}}

**Contigs.** Even after read breaking, coverage gaps and repeats prevent a single Eulerian path through the whole genome. So assemblers output **contigs**: long contiguous stretches that can be assembled unambiguously. In graph terms, a contig is a **maximal non-branching path**: a path whose internal nodes each have exactly one edge in and one edge out. Wherever the graph branches (a repeat) or ends (a coverage gap), a contig stops. Contigs are then ordered and oriented into **scaffolds** using read pairs.

**Sequencing errors → bubbles and tips.** A single error in a read changes up to k of its k-mers, creating edges that aren't in the genome. For example, `CGTACGGACA` and the erroneous `CGTATGGACA` share their beginning and end but differ in the middle, so the graph gets a **bubble**: two alternative paths between the same pair of nodes. An error near a read's end creates a dead-end **tip**. Because each error is rare, erroneous k-mers have **low counts**. Assemblers count k-mers, discard rare ones, trim tips and pop bubbles.

:::think Does a de Bruijn graph always have a single Eulerian path? What does that mean for assembly?
No. A repeat longer than k − 1 creates a node with several edges in and several out, so there are several Eulerian paths, each spelling a different possible genome, and the graph alone cannot say which is real. That ambiguity, not finding the path, is what makes assembly hard. The remedies all add longer-range information: a larger k (if reads allow it), **read pairs** that span the repeat, and **long reads** that cover it entirely.
:::

:::think What happens to the de Bruijn graph as k grows? Then why not just use very long k?
A larger k means fewer (k − 1)-mers repeat in the genome, so the graph has fewer branches and becomes simpler. If k exceeds the longest repeat, the graph is a single path. But k can't exceed the read length, and reads must cover every k-mer: the longer the k, the more likely some genome k-mer was never read (coverage gaps), and the more likely a read error lands inside it. For years technology offered short accurate reads or long error-prone ones, never both, which is why read breaking (smaller k) and read pairs were so important.
:::

:::think A real assembly gives you hundreds of contigs instead of one chromosome. Why?
Two reasons. **Coverage gaps:** k-mers that were never read leave missing edges, so the path breaks. **Repeats:** where the graph branches, the assembler cannot choose a path safely, so it stops the contig there and starts a new one on the other side. Scaffolding with read pairs (and long reads) then orders and orients the contigs.
:::

:::example From the classroom assumptions to real assemblers
| Assumption in class | Reality | What assemblers do |
|---|---|---|
| all reads are k-mers of one length | reads vary in length | **read breaking** into k-mers; choose k (or try several) |
| perfect coverage | random sampling misses regions | high **depth** (30× or more), read breaking, output **contigs** instead of one path |
| no errors | 0.1–1% for short reads, more for some long reads | **error correction** by k-mer counting; remove **tips**, pop **bubbles** |
| single known strand | reads come from both strands | add each read **and its reverse complement** (canonical k-mers) |
| unique Eulerian path | **repeats** create many paths | **paired-end / mate-pair** reads, **long reads** (PacBio HiFi, Nanopore), scaffolding |
:::

:::sota State of the art
- De Bruijn-graph assemblers for short reads: Velvet (2008), SPAdes, MEGAHIT (for metagenomes).
- **Long reads** changed everything. PacBio HiFi reads (about 15–20 kb at over 99.9% accuracy) and Oxford Nanopore ultra-long reads (100 kb and more) span most repeats. Assemblers like **hifiasm** and **Verkko** use string/overlap graphs again, because long reads are few enough that overlap-based methods become practical.
- The **Telomere-to-Telomere (T2T) consortium** published the first truly complete human genome (CHM13) in *Science* in 2022, adding about 200 million bases missing from the reference GRCh38. The **Human Pangenome Reference Consortium** released a draft pangenome of 47 individuals in *Nature* (2023), represented as a **graph** of variation rather than a single string.
:::

## Summary

- **Overlap graph** (reads are nodes) → the genome is a **Hamiltonian path**: NP-complete.
- **de Bruijn graph** (reads are edges, (k − 1)-mers are nodes) → the genome is an **Eulerian path**: linear time with Hierholzer's algorithm.
- de Bruijn graphs scale to billions of reads because each distinct (k − 1)-mer is stored once, however many reads contain it.
- Read pairs carry information across repeats; paired de Bruijn graphs use it.
- Practical assembly = error correction + de Bruijn graph + simplification (tips, bubbles) + contigs + scaffolding with read pairs and long reads.
