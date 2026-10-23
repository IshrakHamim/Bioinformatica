Bioinformatics reuses a handful of algorithm-design patterns over and over. If you recognize the pattern, each new algorithm in this course becomes a variation you already know.

## The bioinformatics problem template

Every problem in Compeau & Pevzner is stated as **Input → Output** (exactly like Rosalind):

> **Minimum Skew Problem.** *Input:* a DNA string Genome. *Output:* all integers i minimizing Skewᵢ(Genome).

Before coding, ask: What is the search space? Can I enumerate it? Is there optimal substructure (DP)? Is a greedy choice safe? Is the problem NP-hard (then use heuristics or randomization)?

## Brute force and complexity

| Problem | Brute force | Better |
|---|---|---|
| Frequent words | O(n²k) | hash map O(nk) |
| Motif finding | all 4ᵏ patterns × all positions | greedy / randomized / Gibbs |
| Pattern matching | O(nm) naive | Boyer-Moore (sublinear typical), index O(m + hits) |
| Alignment | exponential enumeration | DP O(nm) |
| HMM decoding | \|Q\|ⁿ paths | Viterbi O(n\|Q\|²) |
| Assembly | Hamiltonian path (NP-complete) | Eulerian path O(\|E\|) |

**Big-O reminders:** n = 3×10⁹ for the human genome, so O(n) is fine, O(n log n) is OK, and O(n²) is impossible. Memory matters as much as time (index sizes).

## Hashing and indexing

- **Hash maps** give O(1) expected insert/lookup: frequency tables of k-mers, k-mer indexes, de Bruijn graph construction.
- **Sorted arrays + binary search**: O(log n) lookups with compact memory (sorted k-mer lists, suffix arrays).
- **Tries, suffix trees, suffix arrays, BWT/FM-index**: substring queries in time proportional to the query, independent of genome size.

## Greedy algorithms

Make the locally best choice and never look back (GreedyMotifSearch). They are fast but usually not optimal. Prove correctness only when a greedy-choice property holds; otherwise treat greedy as a heuristic and compare it with smarter methods.

## Dynamic programming

DP applies when an optimal solution is built from optimal solutions to **overlapping subproblems**.
1. Define the subproblem (F(i, j) = best alignment of prefixes).
2. Write the **recurrence** (max over a few choices).
3. Fill a table in an order that respects dependencies.
4. **Traceback** pointers to recover the solution.

DP in this course: edit distance, global/local alignment, affine gaps (3 tables), Viterbi/Forward (HMMs), small parsimony (Sankoff), Manhattan Tourist and Change Problem (textbook Ch. 5 warm-ups).

{{yt:8Q2IEIY2pDU|ADS1: Solving the edit distance problem (Ben Langmead)}}

## Randomized algorithms

- **Monte Carlo:** fast, may be wrong (RandomizedMotifSearch, Gibbs sampling) → run many times, keep the best.
- **Las Vegas:** always correct, random running time (randomized quicksort).
- Sampling from distributions, random restarts and seeds for reproducibility.

## Graph algorithms

- **BFS:** shortest paths in unweighted graphs (network diameter, closeness).
- **DFS / Hierholzer:** Eulerian cycles/paths in O(|E|).
- **Hamiltonian path:** NP-complete, so avoid formulations needing it.
- **Brandes' algorithm:** betweenness centrality in O(nm) for unweighted graphs.
- **Trees:** recursive algorithms on rooted trees (parsimony), tree distances (phylogeny).

## Iterative optimization: the EM pattern

Alternate two easy steps when optimizing two coupled unknowns:

| Algorithm | Step A | Step B |
|---|---|---|
| RandomizedMotifSearch | motifs → profile | profile → motifs |
| k-means (Lloyd) | centers → clusters | clusters → centers |
| Soft k-means (EM) | centers → responsibilities | responsibilities → centers |
| Viterbi training / Baum–Welch | parameters → paths (or expected counts) | paths → parameters |

All converge to **local** optima; initialization and restarts matter.

## NP-hardness in bioinformatics

Hamiltonian path (overlap assembly), multiple sequence alignment (sum-of-pairs), large parsimony and k-means are NP-hard in general. The practical response is: change the formulation (de Bruijn instead of overlap graphs), use heuristics (progressive MSA, local search), or accept approximations with guarantees (k-means++).
