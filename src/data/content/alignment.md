**Biological question:** how similar are two sequences, and which residues correspond? **Why:** similar sequence → similar structure → similar function. Alignment lets us transfer knowledge from studied genes/proteins to new ones, detect evolutionary relationships, and find variants in reads. This module follows Compeau & Pevzner Ch. 5 and the lecture's worked examples.

## What an alignment is

Write one sequence above the other, inserting **gaps (−)** so that similar residues line up. Each column is a **match**, a **mismatch** (substitution) or an **indel** (a gap: insertion in one sequence = deletion in the other).

```text
ATGCATGC        ATGCATGC-        ATGC-TTA-
TGCATGCA        -TGCATGCA        -TGCATTAA      (slides: three alignments of related strings)
```

**Sequence Alignment Problem.** *Input:* sequences $S_1, S_2$ and a scoring function f (substitution scores + gap penalties). *Output:* the alignment maximizing $f(\text{align}(S_1, S_2))$.

**Enumeration is infeasible.** The number of global alignments of two length-n sequences grows exponentially. It is even larger than $\binom{2n}{n} \approx 4^n/\sqrt{\pi n}$, which for n = 100 is already ~10⁵⁹. Each residue either aligns to a residue or to a gap; this local choice structure is perfect for **dynamic programming**.

**Scoring.** For DNA, simple match/mismatch scores. For proteins, **substitution matrices** like **BLOSUM62** or PAM capture which amino-acid swaps are common in evolution (e.g., I↔L scores +2; W↔G scores −2). Gaps have a penalty d (negative). Slide example with a DNA matrix and d = −5: `GAC-AT` vs `C-ACAT` scores (−7) + (−5) + (−7) + (−5) + 2 + 2 = **−20**.

## Global alignment: Needleman–Wunsch (1970)

Let F(i, j) be the best score aligning the prefixes $x_{1..i}$ and $y_{1..j}$:

$$F(0,0)=0,\quad F(i,0) = i\cdot d,\quad F(0,j) = j\cdot d$$
$$F(i,j) = \max\begin{cases} F(i-1,j-1) + s(x_i, y_j) & \text{(align } x_i \text{ with } y_j\text{)}\\ F(i-1,j) + d & (x_i \text{ with a gap})\\ F(i,j-1) + d & (y_j \text{ with a gap})\end{cases}$$

**DP recipe:** break into subproblems (prefix pairs), solve them optimally in order (row by row), and combine. Store a **pointer** to the neighbor that gave the max; **traceback** from F(n, m) to F(0, 0) reads off the alignment (diagonal = aligned pair, up = gap in y, left = gap in x). **Ties give several optimal alignments.** Time and space are **O(nm)**.

{{widget:alignment preset="final"}}

:::exam Final Q1(a): x = ACCGTGC, y = ACGTC, match +2, mismatch −1, gap −2
The bottom-right cell gives the **global score 6**. Two co-optimal alignments (tie in the traceback):
```text
ACCGTGC        ACCGTGC
A-CGT-C        AC-GT-C
```
Check: 5 matches × 2 = 10, 2 gaps × (−2) = −4 → **6**. The full DP table is in the widget (preset “Final Q1(a) global”).
:::

## Local alignment: Smith–Waterman (1981)

**Limitations of global alignment** (slides): related proteins may differ overall but share a conserved **functional domain**; genes contain long **introns** (variable) between conserved **exons**. Global alignment forces end-to-end matching and can be dragged down by unrelated regions. Local alignment finds the **best-matching pair of substrings**.

Changes to the recurrence:
1. Add **0** as a fourth option: $F(i,j) = \max\{0,\ F(i-1,j-1)+s,\ F(i-1,j)+d,\ F(i,j-1)+d\}$, so a negative prefix is never carried forward ("start fresh").
2. First row/column are 0.
3. Traceback starts at the **highest cell anywhere** and stops at the first **0**.

Slide example (DNA matrix, d = −5): AAG vs AGC → best local alignment `AG/AG` with score **4** (the global score of the same pair is −6). The “secondary best” local alignment A/A scores 2.

{{widget:alignment preset="finalLocal"}}

{{game:align-duel}}

:::exam Final Q1(b, c): local alignment of the same pair
The maximum cell value is **6**, reached at F(5,4) and again at F(7,5). From F(5,4) the best local alignments are
```text
CGT          ACCGT
CGT    and   AC-GT        (both score 6)
```
and from F(7,5) the traceback reproduces the full-length alignment (also 6).

**Why do global and local differ in general, and why are they equal here?** Global alignment must cover both sequences end to end, so every unmatched residue costs gap/mismatch penalties. Local alignment keeps only the highest-scoring segment pair and drops flanks that lower the score (negative prefixes reset to 0). Here the flanks add as many points as they cost: extending CGT/CGT to the full alignment adds two matches (+4) and two gaps (−4), net 0. So the local optimum (the core **CGT**) ties with the global score. With a harsher gap penalty (try −3 in the widget) the local score would exceed the global one.
:::

## Gap penalties: linear vs affine

A linear penalty charges d per gap position, so a gap of length L costs L·d. Biologically, one long indel (a single event) is more likely than many short ones, which motivates **affine** penalties:
$$\text{gap}(L) = d_{\text{open}} + (L-1)\cdot e_{\text{extend}}, \qquad |d_{\text{open}}| > |e_{\text{extend}}|$$
Example (Quiz 3): open −5, extend −1, length 4 → −5 + 3(−1) = **−8**.

Affine alignment is still O(nm), using three DP matrices (**Gotoh**). The slides draw these as **states**: **M** (aligned pair), **X** (insertion in x / deletion in y), **Y** (insertion in y). Entering X or Y from M costs the open penalty, staying costs the extend penalty. This finite-state view *is* a **pair HMM** (next modules).

{{widget:affine-gap}}

## Speed: BLAST

O(nm) is fine for two genes but not for a query against a database of hundreds of millions of sequences (slides: “550K proteins or billions of reads”). **BLAST** (Altschul et al., 1990) is a **heuristic**:
1. **Seed:** split the query into short words (DNA w ≈ 11; proteins w = 3 plus “neighborhood” words scoring ≥ T).
2. Find **exact word hits** in the database via an index.
3. **Extend** hits without gaps until the score drops by X (X-drop), giving **high-scoring segment pairs (HSPs)**; then gapped extension.
4. Report hits with an **E-value**: the expected number of hits that good by chance in a database of that size.

BLAST works for nucleotides and proteins (blastn, blastp, blastx…), is extremely fast, but **does not guarantee** the optimal alignment that Smith–Waterman would find.

{{widget:blast}}

## Multiple sequence alignment

If similarity is weak, pairwise alignment may not detect related sequences, but comparing many at once reveals conserved columns: *“pairwise alignment whispers, multiple alignment shouts.”*

A **t-way alignment** is a matrix with t rows (one per sequence, with gaps). DP generalizes to a t-dimensional grid: ~$n^t$ cells, each with up to $2^t - 1$ predecessors, giving **$O(n^t\, 2^t)$** time, impractical beyond a handful of sequences (MSA with sum-of-pairs scoring is NP-hard).

Practical **heuristics**: **progressive alignment** (ClustalW/Omega: build a guide tree, align the closest pairs first, then add sequences/profiles), iterative refinement (MUSCLE), and consistency/FFT-based methods (MAFFT, T-Coffee). MSAs feed **profiles/profile HMMs** (HMMER, Pfam), **phylogenetic trees** (next module) and **AlphaFold's** co-evolution signal.

## Summary

| | Global (NW) | Local (SW) | BLAST | MSA (DP) |
|---|---|---|---|---|
| Aligns | whole sequences | best substrings | best local hits (heuristic) | t sequences |
| Recurrence | max of 3 | max of 3 and 0 | seed–extend | t-dim grid |
| Traceback | (n,m) → (0,0) | max cell → first 0 | n/a | n/a |
| Optimal? | yes | yes | no | yes (exponential) |
| Time | O(nm) | O(nm) | ~linear in practice | O(nᵗ2ᵗ) |
