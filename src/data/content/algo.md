Bioinformatics reuses a handful of algorithm-design patterns over and over: counting with hash tables, dynamic programming, greedy and randomized search, graph walks, and alternating optimization. Once you recognize the pattern, each new algorithm in the course becomes a variation of something you already know.

:::tip You do not have to read this first
The course lessons link here with **🧱 Stuck? Quick refresher** chips at the exact step that uses an idea, and the section opens inside the lesson. Read straight through if you want a full warm-up.
:::

## Reading a problem: Input → Output

Every problem in Compeau & Pevzner's textbook, and every Rosalind exercise, is stated in the same precise form:

> **Minimum Skew Problem.** *Input:* a DNA string Genome. *Output:* all integers i minimizing Skewᵢ(Genome).

This format matters. A biological question ("where does replication start?") is vague; a computational problem is exact, so you can write code for it, test it, and prove things about it. The course always moves through the same steps:

1. **Biology:** what do we want to know?
2. **Problem:** what exactly goes in and what must come out?
3. **Algorithm:** how do we compute the output, and how fast?
4. **Reality check:** which assumptions did the formulation make, and how do real data break them?

Before coding any problem, ask yourself:

- **What is the search space?** All k-mers? All alignments? All trees? (Count it: Math foundation, *Counting*.)
- **Can I enumerate it?** If it has $4^{20}$ or $2^{100}$ elements, no.
- **Is there optimal substructure?** If the best solution is built from best solutions of smaller pieces, dynamic programming applies.
- **Is a greedy choice safe?** Sometimes yes, often no.
- **Is the problem NP-hard?** Then look for a reformulation, a heuristic, or randomization.

## Big-O: what scales to a genome

**Big-O notation** describes how running time (or memory) grows with input size n, ignoring constant factors. O(n) means "doubling the input roughly doubles the time".

Genomes make this concrete. The human genome has n ≈ 3 × 10⁹ letters, and a computer does very roughly 10⁹ simple operations per second:

| Growth | Operations for n = 3 × 10⁹ | Feasible? |
|---|---|---|
| O(n) | 3 × 10⁹ | seconds |
| O(n log n) | ≈ 10¹¹ | minutes |
| O(n²) | ≈ 10¹⁹ | about 300 years |
| O(2ⁿ) | astronomically large | never |

So any algorithm that touches the whole genome must be close to linear. And **memory matters as much as time**: an index that stores 8 bytes for each of 3 × 10⁹ positions needs 24 GB.

Press Play and watch the same six growth rates race as n grows from 10 to the size of a genome:

{{widget:bigo}}

For the formal definitions (Big-O as an upper bound, Omega as a lower bound, Theta as a tight bound), Abdul Bari's lecture is the classic explanation:

{{video:A03oI0znAoc}}

Striver's lecture shows how to read the complexity off real code: count the loops, and remember that memory counts too.

{{video:FPu9Uld7W-E}}

How the course's problems improve once you find the right idea:

| Problem | Brute force | Better |
|---|---|---|
| Frequent words | O(n²k) | hash map, O(nk) |
| Motif finding | all 4ᵏ patterns × all positions | greedy, randomized, Gibbs |
| Pattern matching | O(nm) naive | Boyer-Moore (often sublinear), index O(m + hits) |
| Alignment | exponential enumeration | DP, O(nm) |
| HMM decoding | \|Q\|ⁿ paths | Viterbi, O(n\|Q\|²) |
| Assembly | Hamiltonian path (NP-complete) | Eulerian path, O(\|E\|) |

## Hash maps: counting things fast

A **hash map** (Python `dict`) stores key → value pairs with **O(1) expected** insert and lookup. The key is run through a hash function that picks a bucket, so you don't search through all entries.

The single most common bioinformatics use is a **frequency table** of k-mers:

```python
def frequency_table(text, k):
    freq = {}
    for i in range(len(text) - k + 1):      # every window start
        kmer = text[i:i+k]
        freq[kmer] = freq.get(kmer, 0) + 1   # O(1) on average
    return freq

freq = frequency_table("ACGTTGCATGTCGCATGATGCATGAGAGCT", 4)
best = max(freq.values())
print([k for k, c in freq.items() if c == best])   # ['GCAT', 'CATG'], each 3 times
```

One pass over the text, O(1) work per k-mer (plus O(k) to slice it): O(nk) total, versus O(n²k) for counting each pattern separately by rescanning the text.

Watch the frequency table being built. Each window is hashed straight to one bucket, so no step ever searches the whole table:

{{widget:hash-count}}

The same idea builds **k-mer indexes** (k-mer → list of positions, Read Mapping lesson), **de Bruijn graphs** (glue identical (k − 1)-mers into one node, Assembly lesson), and **k-mer feature vectors** for machine learning.

**Trade-off:** hash maps are fast but memory-hungry (pointers, empty buckets). When memory is tight, use sorted arrays instead (next section).

Abdul Bari explains what happens inside a hash table (hash functions, buckets, collisions):

{{video:mFY0J5W8Udk}}

Striver's lecture uses hashing for exactly our purpose, counting how often each element occurs:

{{video:KEs5UyBJ39g}}

## Sorting, binary search and indexes

**Binary search** finds an item in a **sorted** array of n items by repeatedly halving the range: O(log n) comparisons. For 3 × 10⁹ items that is only about 32 comparisons.

**Sorted k-mer index.** Make a list of (k-mer, position) pairs for every position in the genome and sort it by k-mer. To find all occurrences of a query k-mer, binary-search for the first entry with that key and read forward while the key matches. In Python, `bisect.bisect_left` does the search.

Step through a lookup in a small sorted index. Faded entries have been ruled out; the red box is the middle entry being compared:

{{widget:binary-search}}

Abdul Bari traces the iterative algorithm by hand, and Striver adds the real-life intuition and the classic overflow bug in `(lo + hi) / 2`:

{{video:C2apEw9pgtw}}

{{video:MHf6awe89xw}}

| | Hash table | Sorted array + binary search |
|---|---|---|
| Lookup | O(1) expected | O(log n) |
| Memory | larger | compact |
| Range / prefix queries | no | yes (neighbouring keys are adjacent) |

**Indexes that don't depend on genome size.** Tries, **suffix trees**, **suffix arrays** and the **Burrows–Wheeler transform / FM-index** let you find any substring in time proportional to the query length. The FM-index of the human genome fits in a few gigabytes; it powers the read mappers Bowtie2 and BWA. You don't need their internals for this course, only the idea: **preprocess the big text once, then answer many queries quickly.**

## Greedy algorithms

A **greedy** algorithm makes the choice that looks best right now and never revisits it.

Abdul Bari's introduction to the greedy method:

{{video:ARvQcqJ_-NY}}

**Example where greedy fails: making change.** Pay 8 with coins {1, 4, 5}. Greedy takes the largest coin that fits: 5, then 1, 1, 1 (four coins). The optimum is 4 + 4 (two coins). The early choice of 5 looked good locally but ruled out the best solution.

Greedy is correct only when the problem has a **greedy-choice property** you can prove (e.g., Dijkstra's shortest paths, Huffman coding). Otherwise, treat greedy as a fast **heuristic** and compare it against smarter methods.

In the course: **GreedyMotifSearch** picks the most probable k-mer in each string in turn and never reconsiders (Regulatory Motifs lesson). It is fast and often decent, but it can lock in a bad early choice, which motivates randomized methods.

## Dynamic programming

**Dynamic programming (DP)** solves a problem by solving smaller subproblems, storing their answers in a table, and building bigger answers from them. It works when:

- **optimal substructure:** the best solution contains best solutions to subproblems, and
- **overlapping subproblems:** the same subproblems recur many times, so storing them avoids recomputation.

The quickest way to *see* overlapping subproblems is the recursion tree of Fibonacci numbers, fib(n) = fib(n − 1) + fib(n − 2). Play it without memoization and watch the same calls (red) being solved again and again; then tick "memoize":

{{widget:fib-tree}}

Striver builds dynamic programming from exactly this example (memoization → tabulation → space optimization), and Abdul Bari explains the principle of optimality behind it:

{{video:tyB0ztf0DNY}}

{{video:5dRGRueKU3M}}

**The four-step recipe:**
1. **Define the subproblem** precisely (e.g., "MinCoins(m) = fewest coins that make m").
2. **Write the recurrence:** the subproblem's answer in terms of smaller ones.
3. **Fill the table** in an order where everything you need is already computed.
4. **Trace back** stored choices to recover the solution itself, not just its score.

**Worked example: change with coins {1, 4, 5}.**

$$\text{MinCoins}(m) = \min_{c \in \{1,4,5\},\ c \le m}\ \text{MinCoins}(m - c) + 1, \qquad \text{MinCoins}(0) = 0$$

| m | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| MinCoins | 0 | 1 | 2 | 3 | 1 | 1 | 2 | 3 | **2** |

For m = 8 the options are MinCoins(7) + 1 = 4, MinCoins(4) + 1 = **2**, MinCoins(3) + 1 = 4, so the answer is 2 (traceback: 8 → 4 → 0, two 4-coins). Greedy got 4. DP considers every choice at every step, but each subproblem is solved only once.

Now watch the table fill itself. At each cell, the highlighted cells are the subproblems it looks at; after the last cell, the traceback lights up the coins used. Try coins {1, 3, 4} and amount 6 for another case where greedy fails:

{{widget:coin-dp}}

**From 1-D to 2-D: alignment.** For two strings x and y, the subproblem is "best score aligning the first i letters of x with the first j letters of y". Each cell F(i, j) depends on three neighbours (left, up, diagonal), and the table has (n+1)(m+1) cells, giving O(nm) time. Edit distance, Needleman–Wunsch, Smith–Waterman and affine gaps are all this pattern. The video below derives it for edit distance from first principles.

{{video:8Q2IEIY2pDU}}

**DP in this course:** edit distance (Read Mapping), global/local alignment and affine gaps (Sequence Alignment), Viterbi and Forward (HMMs), small parsimony (Phylogeny), the Change and Manhattan Tourist problems (textbook warm-ups).

Abdul Bari's longest common subsequence (LCS) lecture is the best warm-up for sequence alignment: the table, the three neighbours and the traceback are the same, only the scores differ.

{{video:sSno9rV8Rhg}}

## Randomized algorithms

Randomized algorithms make random choices. Two kinds:

- **Monte Carlo:** fast, but the answer may be wrong or suboptimal. Run many times and keep the best. RandomizedMotifSearch and Gibbs sampling are Monte Carlo.
- **Las Vegas:** always correct; only the running time is random. Randomized quicksort is the classic example.

Abdul Bari's quicksort lecture explains the algorithm and the role of the pivot. Choosing the pivot at random (randomized quicksort) makes the slow case unlikely on every input while the output is always correctly sorted: the textbook Las Vegas algorithm.

{{video:7h1s2SojIRw}}

**Why randomness helps.** Deterministic local search can get stuck in the same bad local optimum every time. Random restarts explore different regions of the search space, and random *moves* (Gibbs sampling choosing a k-mer with probability proportional to its score, instead of always the best) let a search climb out of a local optimum.

See it happen. Each dot is one run (a "hiker") dropped at a random start:

{{widget:local-search}}

**Practical habits:** set a **random seed** so results are reproducible; run **many restarts**; report the best and how often it was found. How to draw from a distribution is in the Math foundation (*Sampling*).

## Graphs: the basics

A **graph** is a set of **nodes** (vertices) joined by **edges**. It is the natural data structure for anything made of relationships:

Striver's introduction covers the vocabulary below (directed, undirected, degree, paths, cycles, weights) with pictures:

{{video:M3_pLsDdeuU}}

| In the course | Nodes | Edges |
|---|---|---|
| de Bruijn graph | (k − 1)-mers | k-mers (reads) |
| Overlap graph | reads | overlaps |
| Protein interaction network | proteins | physical interactions |
| Phylogenetic tree | species and ancestors | descent |
| HMM state diagram | hidden states | transitions |

Vocabulary:
- **Directed** edges have a direction (u → v); **undirected** edges don't.
- **Degree** = number of edges at a node; directed graphs have **in-degree** and **out-degree**.
- A **path** is a sequence of nodes joined by edges; a **cycle** returns to its start.
- **Connected:** every node can reach every other.
- **Weighted** edges carry numbers (distances, confidences).

**Representations.** An **adjacency matrix** A has $A_{ij} = 1$ if there is an edge i → j; it uses n² memory. An **adjacency list** stores each node's neighbours; it uses memory proportional to the number of edges. Biological graphs are **sparse** (few edges per node), so adjacency lists are standard:

```python
graph = {"AT": ["TG"], "TG": ["GC", "GA"], "GC": ["CA", "CT"]}
```

## Breadth-first and depth-first search

**Breadth-first search (BFS)** explores a graph in layers: first all neighbours of the start, then their neighbours, and so on, using a queue. In an unweighted graph, the layer in which BFS first reaches a node is its **shortest-path distance** from the start.

```python
from collections import deque
def bfs_distances(graph, s):
    dist = {s: 0}
    q = deque([s])
    while q:
        u = q.popleft()
        for v in graph.get(u, []):
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist
```

Running BFS from every node gives all shortest-path distances, hence the **diameter** (largest distance) and **closeness centrality** used in the Biological Networks lesson. BFS takes O(|V| + |E|) per start node.

**Depth-first search (DFS)** goes as deep as possible along one branch before backtracking, using a stack or recursion. It finds connected components, detects cycles, and is the skeleton of **Hierholzer's algorithm** for Eulerian cycles (next section).

Compare the two on the same graph. Switch between BFS and DFS and watch the queue grow at the back while the stack grows on top:

{{widget:graph-search}}

Abdul Bari traces both traversals on one graph, and Striver's two lectures build each one with its queue or recursion stack:

{{video:pcKY4hjDrxk}}

{{video:-tgVpUgsQ5k}}

{{video:Qzf1a--rhp8}}

## Eulerian and Hamiltonian paths

Two questions that sound almost identical:

- **Eulerian path:** a walk that uses every **edge** exactly once.
- **Hamiltonian path:** a path that visits every **node** exactly once.

Their difficulty is completely different. **Eulerian** paths can be found in linear time, O(|E|). **Hamiltonian** paths are **NP-complete**: no efficient algorithm is known.

To feel why Hamiltonian paths are hard, watch Abdul Bari search for a Hamiltonian cycle by backtracking: the search tree branches at every node, and nothing like Euler's degree rule lets you skip it.

{{video:dQr4wZCiJJ4}}

**Euler's theorem (directed graphs).** A node is **balanced** if in-degree = out-degree. A connected directed graph has an **Eulerian cycle** iff every node is balanced. It has an **Eulerian path** iff all nodes are balanced except two: a start with out = in + 1 and an end with in = out + 1.

**Hierholzer's algorithm:**
1. Start at the start node (or anywhere, for a cycle) and keep walking along unused edges until you get stuck.
2. If unused edges remain, pick a node on your walk that still has unused edges, walk a new cycle from there, and splice it into the walk.
3. Repeat until every edge is used.

Here is the stack version of Hierholzer's algorithm at work on genome reads. Each read is an edge from its prefix to its suffix; the path it finds spells the genome:

{{widget:hierholzer}}

**Why it matters:** genome assembly can be posed either way. In an *overlap graph* (reads = nodes) the genome is a Hamiltonian path, which is intractable. In a *de Bruijn graph* (reads = edges) it is an Eulerian path, which is easy. Choosing the representation turned an impossible problem into a linear-time one.

{{video:TNYZZKrjCSk}}

## Trees and recursion

A **tree** is a connected graph with no cycles. A tree with n nodes has exactly n − 1 edges. A **rooted** tree designates one node as the root; every other node has a **parent**, and nodes without children are **leaves**.

Trees are naturally processed by **recursion**: solve the problem for each child's subtree, then combine at the parent.

If recursion still feels slippery, Striver's lecture draws the recursion tree and the call stack for small examples:

{{video:yVdKa8dnKiE}}

```python
def leaves(tree, node):
    kids = tree.get(node, [])
    if not kids:
        return [node]                   # a leaf
    return [x for c in kids for x in leaves(tree, c)]
```

**Post-order** traversal (children before parent) is the bottom-up pass of **Fitch's small-parsimony algorithm**; the top-down assignment afterwards is a **pre-order** pass. **Newick** format, `((A:2,B:2):1,(C:2,D:2):1);`, writes a tree as nested parentheses with branch lengths.

In the course: phylogenetic trees (UPGMA, neighbour joining, parsimony), dendrograms from hierarchical clustering, and the guide trees of progressive multiple alignment.

## Iterative optimization: the EM pattern

Many course algorithms optimize **two coupled unknowns** that are easy to solve one at a time:

- If you knew the motifs, the profile would be easy (count columns). If you knew the profile, the motifs would be easy (pick the most probable k-mers).
- If you knew the clusters, the centers would be easy (take means). If you knew the centers, the clusters would be easy (nearest center).

So **alternate**: fix one, solve for the other, swap, repeat until nothing changes.

| Algorithm | Step A | Step B |
|---|---|---|
| RandomizedMotifSearch | motifs → profile | profile → motifs |
| k-means (Lloyd) | centers → clusters | clusters → centers |
| Soft k-means (EM) | centers → responsibilities | responsibilities → centers |
| Viterbi training / Baum–Welch | parameters → paths (or expected counts) | paths → parameters |

**Expectation–maximization (EM)** is the probabilistic version: the E-step computes *soft* (probabilistic) assignments, and the M-step re-estimates parameters from them.

Each step never makes the objective worse, so the process converges, but only to a **local optimum** that depends on where you started. Initialization (e.g., k-means++) and multiple restarts matter.

Watch the alternation in k-means: assign points to the nearest center, move each center to the mean of its points, repeat. Different starts can end in different local optima.

{{widget:kmeans}}

## NP-hardness and heuristics

A problem is **NP-hard** if an efficient (polynomial-time) algorithm for it would give efficient algorithms for a huge class of problems believed to have none. In practice: **don't expect an exact, fast algorithm for large inputs.**

Abdul Bari's lecture on P, NP, NP-hard and NP-complete gives the formal picture, including what a reduction is:

{{video:e2cF8a5aAhE}}

NP-hard problems in the course:
- **Hamiltonian path** (overlap-graph assembly)
- **Multiple sequence alignment** with sum-of-pairs scoring
- **Large parsimony** (finding the best tree)
- **k-means** clustering (finding the global optimum)
- **Motif finding** in its general form

The three practical responses, all used in the course:
1. **Change the formulation:** de Bruijn graphs instead of overlap graphs.
2. **Use a heuristic** that is good in practice: progressive MSA, BLAST, tree rearrangements, greedy and randomized motif search.
3. **Use an approximation with a guarantee:** k-means++ is within O(log k) of optimal in expectation.

NP-hardness concerns worst cases. Real biological inputs are often far easier, which is why heuristics work so well.
