**Biological question:** how similar are two sequences, and which of their residues correspond to each other? **Why it matters:** similar sequence → similar structure → similar function. Alignment lets us transfer knowledge from well-studied genes and proteins to new ones, detect evolutionary relationships, and find variants in sequencing reads. This lesson follows Compeau & Pevzner Ch. 5 and the lecture's worked examples. It is the most important application of dynamic programming in the course.

This lecture introduces the whole family of alignment problems, starting from the edit distance you met in Read Mapping. It's a good overview to watch first.

{{video:-bjSPP2v6_Q}}

## What an alignment is

Write one sequence above the other, inserting **gaps (−)** so that similar residues line up in columns. Each column is one of:
- a **match** (same letter in both rows),
- a **mismatch** or **substitution** (different letters), or
- an **indel** (a letter against a gap): an insertion in one sequence, or equivalently a deletion in the other.

```text
ATGCATGC        ATGCATGC-        ATGC-TTA-
TGCATGCA        -TGCATGCA        -TGCATTAA      (slides: three alignments of related strings)
```

The first alignment has no gaps but almost every column mismatches. Shifting one sequence by a gap (middle) makes 7 columns match. Gaps model insertions and deletions, which really happen in evolution.

**Sequence Alignment Problem.** *Input:* sequences $S_1, S_2$ and a scoring function f (scores for each kind of column). *Output:* the alignment that maximizes $f(\text{align}(S_1, S_2))$.

**Scoring.** The score of an alignment is the **sum of its column scores**.
- For DNA, a simple scheme is match +1, mismatch −1, gap −2 (the numbers are a modelling choice).
- For proteins, **substitution matrices** such as **BLOSUM62** or PAM give a score for every pair of amino acids, reflecting how often that swap is seen in real related proteins compared with chance. They are **log-odds scores**: positive means "seen more often than chance". For example, I↔L scores +2 (both are similar hydrophobic amino acids), while W↔G scores −2.
- Gaps get a negative penalty d.

**Example (slides).** With a DNA substitution matrix and d = −5, aligning `GAC-AT` with `C-ACAT` scores (−7) + (−5) + (−7) + (−5) + 2 + 2 = **−20**: one column at a time, then add.

{{ref:math#logarithms-likelihood-and-log-odds}}

**Why not try every alignment?** The number of possible global alignments of two length-n sequences grows exponentially. It is larger than $\binom{2n}{n} \approx 4^n/\sqrt{\pi n}$, which for n = 100 is already about 10⁵⁹. But each alignment is built from a sequence of small local decisions (align these two letters, or put a gap in one of them), and the best alignment of the whole contains the best alignments of its prefixes. That structure is perfect for **dynamic programming**.

{{ref:math#counting-how-big-is-the-search-space|algo#dynamic-programming}}

## Global alignment: Needleman–Wunsch (1970)

**Global** alignment aligns the two sequences **end to end**: every letter of both appears in the alignment.

**The subproblem.** Let F(i, j) be the best score for aligning the prefix $x_{1..i}$ (the first i letters of x) with the prefix $y_{1..j}$.

**The recurrence.** Look at the last column of the best alignment of these prefixes. There are only three possibilities:
1. $x_i$ is aligned with $y_j$: the score is F(i − 1, j − 1) plus the score $s(x_i, y_j)$ of that pair.
2. $x_i$ is aligned with a gap: F(i − 1, j) plus the gap penalty d.
3. $y_j$ is aligned with a gap: F(i, j − 1) plus d.

The best alignment takes the best of the three:

$$F(i,j) = \max\begin{cases} F(i-1,j-1) + s(x_i, y_j) & \text{(align } x_i \text{ with } y_j\text{)}\\ F(i-1,j) + d & (x_i \text{ with a gap})\\ F(i,j-1) + d & (y_j \text{ with a gap})\end{cases}$$

**Base cases.** Aligning a prefix with the empty string needs all gaps: $F(0,0)=0$, $F(i,0) = i\cdot d$, $F(0,j) = j\cdot d$.

**Filling the table.** Put x down the side and y across the top. Fill the first row and column with the base cases, then fill row by row: each cell needs only its **diagonal**, **upper** and **left** neighbours, which are already done. Record which neighbour gave the max (a **pointer**).

**Traceback.** The global score is F(n, m), the bottom-right cell. Follow the pointers back to F(0, 0) to read off the alignment: **diagonal** = an aligned pair, **up** = a letter of x against a gap, **left** = a letter of y against a gap. If two neighbours tie, both lead to optimal alignments, so **ties give several co-optimal alignments**.

**Cost.** The table has (n + 1)(m + 1) cells and each takes constant time: **O(nm) time and space**.

:::example A tiny table by hand: x = ACG, y = AG, match +1, mismatch −1, gap −2
| | ε | A | G |
|---|---|---|---|
| ε | 0 | −2 | −4 |
| A | −2 | **1** | −1 |
| C | −4 | **−1** | 0 |
| G | −6 | −3 | **0** |

- F(1,1): A vs A, diagonal 0 + 1 = **1** (beats the gap options −4 and −4).
- F(2,1): C vs A. Diagonal F(1,0) − 1 = −3; up F(1,1) − 2 = **−1**; left F(2,0) − 2 = −6. Best: up (C against a gap).
- F(3,2): G vs G. Diagonal F(2,1) + 1 = **0**; up F(2,2) − 2 = −2; left F(3,1) − 2 = −5.

Traceback from F(3,2) = 0: diagonal (G/G), up (C/−), diagonal (A/A). The alignment is **ACG / A−G**, score 1 − 2 + 1 = 0.
:::

Here is a full table filled by hand, step by step, if you want to see the process once more:

{{video:ipp-pNRIp4g}}

{{widget:alignment preset="final"}}

:::example x = ACCGTGC, y = ACGTC, match +2, mismatch −1, gap −2
The bottom-right cell gives the **global score 6**. Two co-optimal alignments come from a tie during traceback:
```text
ACCGTGC        ACCGTGC
A-CGT-C        AC-GT-C
```
Check: 5 matches × 2 = 10, plus 2 gaps × (−2) = −4, total **6**. The full DP table is in the widget (preset "Final Q1(a) global").
:::

## Local alignment: Smith–Waterman (1981)

**Limitations of global alignment** (slides). Two related proteins may differ overall but share one conserved **functional domain**. A gene has conserved **exons** separated by long, variable **introns**. Global alignment forces end-to-end matching, so the unrelated parts drag the score down and can even misplace the conserved part. **Local alignment** finds instead the **best-matching pair of substrings**, one from each sequence, ignoring everything else.

**Three changes to the recurrence:**
1. Add **0** as a fourth option:
$$F(i,j) = \max\{0,\ F(i-1,j-1)+s(x_i,y_j),\ F(i-1,j)+d,\ F(i,j-1)+d\}$$
The 0 means "start a fresh alignment here". If the best alignment ending at (i, j) would have a negative score, it's better to drop it and start over, so negative prefixes are never carried forward.
2. The first row and column are all **0** (an alignment can start anywhere for free).
3. Traceback starts at the **highest cell anywhere in the table** (the best alignment can end anywhere) and stops at the first **0** (where it started).

**Example (slides).** With a DNA matrix and d = −5, AAG vs AGC: the best local alignment is `AG / AG` with score **4**, while the global score of the same pair is −6. The second-best local alignment, A/A, scores 2.

Watch the local version worked by hand, with the zero floor and the traceback to 0:

{{video:lu9ScxSejSE}}

{{widget:alignment preset="finalLocal"}}

{{game:align-duel}}

:::example Local alignment of x = ACCGTGC, y = ACGTC (+2/−1/−2)
The maximum cell value is **6**, reached at F(5,4) and again at F(7,5). From F(5,4) the best local alignments are
```text
CGT          ACCGT
CGT    and   AC-GT        (both score 6)
```
and from F(7,5) the traceback reproduces the full-length alignment (also 6).

**Why do global and local scores usually differ, and why are they equal here?** Global alignment must cover both sequences end to end, so every unmatched residue costs gap or mismatch penalties. Local alignment keeps only the highest-scoring segment pair and drops flanks that lower the score. Here the flanks add as many points as they cost: extending CGT/CGT to the full alignment adds two matches (+4) and two gaps (−4), net 0. So the local optimum (the core **CGT**) ties with the global score. With a harsher gap penalty (try −3 in the widget) the local score would exceed the global one.
:::

## Gap penalties: linear vs affine

A **linear** gap penalty charges d for every gap position, so a gap of length L costs L·d. But biologically, one long insertion or deletion is usually **a single mutational event**, much more likely than many separate short ones. A linear penalty makes a 4-base gap cost the same as four separate 1-base gaps, which is unrealistic. **Affine** gap penalties fix this:

$$\text{gap}(L) = d_{\text{open}} + (L-1)\cdot e_{\text{extend}}, \qquad |d_{\text{open}}| > |e_{\text{extend}}|$$

Opening a gap is expensive; extending an existing one is cheap.

**Example:** open −5, extend −1, length 4 → −5 + 3·(−1) = **−8**. Four separate 1-base gaps would cost 4·(−5) = −20, so the affine scheme strongly prefers one long gap.

**How to compute it.** The simple recurrence no longer works, because the cost of a gap column depends on whether the previous column was also a gap. The fix (**Gotoh**, 1982) keeps **three DP tables** and still runs in O(nm):
- **M**(i, j): best score with $x_i$ aligned to $y_j$;
- **X**(i, j): best score ending with $x_i$ against a gap;
- **Y**(i, j): best score ending with $y_j$ against a gap.

Entering X or Y from M costs the open penalty; staying in X or Y costs the extend penalty. The slides draw these three tables as **states** with transitions between them. That finite-state picture *is* a **pair HMM**, which you'll meet in the HMM lesson.

{{widget:affine-gap}}

## Speed: BLAST

Watch this explanation of BLAST's seeds, extension and E-values first:

{{video:NwiETShpIDo}}

O(nm) is fine for two genes, but not for searching one query against a database of hundreds of millions of sequences (slides: "550K proteins or billions of reads"). **BLAST** (Basic Local Alignment Search Tool; Altschul et al., 1990) is a **heuristic**: it gives up guaranteed optimality to run thousands of times faster.

1. **Seed.** Break the query into short words: length w ≈ 11 for DNA; for proteins, w = 3, plus "neighbourhood" words that score at least a threshold T against a query word under BLOSUM62 (so similar, not only identical, words count).
2. **Find hits.** Look up exact occurrences of those words in a pre-built index of the database.
3. **Extend.** From each hit, extend the alignment in both directions without gaps, stopping when the score drops more than X below the best seen (**X-drop**). Good extensions are **high-scoring segment pairs (HSPs)**, which are then extended with gaps.
4. **Report** each hit with an **E-value**: the number of hits this good you would expect **by chance** in a database of this size. E = 10⁻³⁰ is essentially impossible by chance; E = 5 is noise.

This is the same seed-and-extend idea as the pigeonhole principle in Read Mapping: exact short matches first, then careful verification.

{{ref:readmap#approximate-matching-hamming-edit-distance-pigeonhole|math#statistical-significance-and-multiple-testing}}

BLAST works for nucleotides and proteins (blastn, blastp, blastx, …) and is extremely fast, but it **does not guarantee** finding the optimal alignment that Smith–Waterman would find: a true match with no exact seed word is missed.

{{widget:blast}}

A two-minute recap of seed-and-extend:

{{video:kAAme1fBanc}}

## Multiple sequence alignment

If similarity is weak, pairwise alignment may not reveal that two sequences are related. Comparing **many** related sequences at once shows which columns are conserved across the whole family: *"pairwise alignment whispers, multiple alignment shouts."*

A **t-way alignment** is a matrix with t rows (one per sequence, with gaps) whose columns line up corresponding residues.

**Exact DP generalizes, but badly.** For two sequences the DP table is a 2-D grid; for t sequences it's a t-dimensional grid with about $n^t$ cells. Each cell has up to $2^t - 1$ predecessors (every non-empty subset of the sequences can advance by one letter), giving **$O(n^t\, 2^t)$** time. For 10 proteins of length 300 that is about $300^{10} \cdot 2^{10}$, hopeless. MSA with sum-of-pairs scoring is in fact NP-hard.

{{ref:algo#np-hardness-and-heuristics}}

**Practical heuristics:**
- **Progressive alignment** (ClustalW, Clustal Omega): compute pairwise distances, build a **guide tree**, then align the closest pairs first and progressively add sequences (or groups of sequences, represented as profiles) following the tree. Fast, but early mistakes are never undone ("once a gap, always a gap").
- **Iterative refinement** (MUSCLE): realign subsets to fix early mistakes.
- **Consistency- and FFT-based methods** (T-Coffee, MAFFT).

**Why MSAs matter downstream:** they feed **profiles and profile HMMs** (HMMER, Pfam) for finding distant family members, **phylogenetic trees** (next lesson), and **AlphaFold**, which reads co-evolution signals from MSA columns to predict 3D contacts.

## Summary

| | Global (NW) | Local (SW) | BLAST | MSA (DP) |
|---|---|---|---|---|
| Aligns | whole sequences | best pair of substrings | best local hits (heuristic) | t sequences |
| Recurrence | max of 3 | max of 3 and 0 | seed–extend | t-dimensional grid |
| Traceback | (n, m) → (0, 0) | max cell → first 0 | n/a | n/a |
| Optimal? | yes | yes | no | yes (but exponential) |
| Time | O(nm) | O(nm) | ~linear in practice | O(nᵗ2ᵗ) |
