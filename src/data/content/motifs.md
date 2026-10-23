**Biological question:** which short DNA patterns (**regulatory motifs**) do transcription factors bind to switch groups of genes on or off? Unlike DnaA boxes, which *clump* in one region, a regulatory motif appears **about once in each of many upstream regions scattered across the genome**, and with variations. This module follows Chapter 2 of Compeau & Pevzner.

## Motifs, transcription factors and why they vary

- A **transcription factor (TF)** binds a short **regulatory motif** (TF binding site) in a promoter or enhancer near the genes it controls.
- A TF usually regulates many genes involved in related processes, so genes sharing a motif in their upstream regions are likely functionally related.
- Motifs are **degenerate**: binding tolerates some substitutions, so each instance differs slightly.

:::bio Two stories from the slides
- **Circadian clock (Arabidopsis):** LHY, CCA1 and TOC1 form a negative feedback loop. CCA1 binds `AAAAAATCT`. Steve Kay (2000) took ~500 genes with circadian expression and found the **evening element** `AAAATATCT` 46 times in their upstream regions; mutating it destroyed circadian behaviour in a test gene.
- **Fly immunity:** infected flies switch on immunity genes whose upstream regions contain 12-mers similar to `TCGGGGATTTCC`, the binding site of **NF-κB**.
:::

**Why not just reuse FrequentWords?** Concatenating all upstream regions and counting is the wrong model. We want a pattern present (with variation) in *each* sequence, not one pattern many times in one place. A **(k, d)-motif** is a k-mer appearing in every string with ≤ d mismatches.

## Brute force and median string

**MotifEnumeration(Dna, k, d):** for every k-mer in Dna, try every k-mer Pattern′ within d mismatches, and keep those appearing in *every* string with ≤ d mismatches. With t strings of length n this costs roughly $O(t \cdot n^2 \cdot 4^k \cdot k)$. That is exponential in k and fails for realistic motifs.

**Reformulate as optimization.** Let $d(Pattern, Text)$ be the minimum Hamming distance between Pattern and any k-mer in Text, and
$$d(Pattern, Dna) = \sum_{i=1}^{t} d(Pattern, Dna_i).$$
The **Median String Problem:** find the k-mer minimizing $d(Pattern, Dna)$. Example from the slides: $d(\texttt{AAA}, Dna) = 1+1+2+0+1 = 5$.

**MedianString** tries all $4^k$ patterns: $O(4^k \cdot n \cdot k \cdot t)$. It is still exponential in k, but it is equivalent to the motif-scoring formulation below, which is the key insight that lets us design heuristics.

## Count, profile, consensus and score

Stack the chosen k-mers (one per sequence) into a $t \times k$ **motif matrix**.

- **Count(Motifs):** a 4×k matrix of how often each nucleotide appears in each column.
- **Profile(Motifs):** Count divided by t (column frequencies). **Each column sums to 1.**
- **Consensus(Motifs):** the most frequent nucleotide in each column (a k-mer that need not occur in any sequence).
- **Score(Motifs):** number of *unpopular* letters = $\sum_i \text{HammingDistance}(Motif_i, \text{Consensus})$. Lower is better.

**Probability of a k-mer under a profile:** multiply the column probabilities:
$$\Pr(\text{Pattern} \mid \text{Profile}) = \prod_{j=1}^{k} \text{Profile}(Pattern_j,\ j)$$
A **profile-most-probable k-mer** in a string is the k-mer of that string with the highest such probability.

{{widget:profile preset="mid"}}

:::exam Mid exam 1(d): profile & most-probable k-mer
Motifs `ATCGT, GTCCA, CTAGT, CTCCT, CTCTG` give the profile (columns 1–5)

| | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| A | .2 | 0 | .2 | 0 | .2 |
| C | .6 | 0 | .8 | .4 | 0 |
| G | .2 | 0 | 0 | .4 | .2 |
| T | 0 | 1 | 0 | .2 | .6 |

Consensus: `CTC?T` with a C/G tie in column 4 (CTCCT or CTCGT). In `ACCTGTTTAT` **every one of the six 5-mers has probability 0**: each contains a letter with profile 0 in its column (e.g., `CTGTT` needs G in column 3). By the textbook tie rule the first k-mer, `ACCTG`, is returned, but the real lesson is that zeros make the comparison meaningless. With Laplace pseudocounts (+1) the winner is **`CTGTT`** with $(4\cdot 6\cdot 1\cdot 2\cdot 4)/9^5 \approx 0.00325$.
:::

## Entropy and information content

Score treats every mismatch equally. **Entropy** measures how *uncertain* a column is:
$$H(p_1,\dots,p_N) = -\sum_i p_i \log_2 p_i \qquad (0 \log 0 = 0)$$

- Uniform column (¼ each): H = 2 bits (no information). A fully conserved column: H = 0.
- Slide examples: (0.2, 0.6, 0, 0.2) → 1.371; (0, 0.6, 0, 0.4) → 0.971; (0, 0, 0.9, 0.1) → 0.469 (the slide rounds this to 0.467).
- Entropy of a motif matrix = sum of column entropies. **Information content** of a column = 2 − H; it is the height of each stack in a **sequence logo**.
- **Lower entropy / higher information content = more conserved.**

{{widget:entropy}}

## GreedyMotifSearch and pseudocounts

```text
GreedyMotifSearch(Dna, k, t)
  BestMotifs ← first k-mer of each string
  for each k-mer Motif in Dna₁:
      Motif₁ ← Motif
      for i ← 2 to t:
          Profile ← Profile(Motif₁ … Motifᵢ₋₁)
          Motifᵢ ← Profile-most-probable k-mer in Dnaᵢ
      if Score(Motifs) < Score(BestMotifs): BestMotifs ← Motifs
  return BestMotifs
```

It runs fast, $O(n^2 \cdot k \cdot t)$, but it is **greedy**: it commits to Motif₁ and never reconsiders. The bigger flaw is **zero probabilities**. After choosing only a few motifs, many profile entries are 0, so any k-mer containing a single “unseen” letter gets probability 0 even if it otherwise matches perfectly. In the slide example (implanted (4,1)-motif `ACGT`), plain greedy fails.

**Laplace's Rule of Succession (pseudocounts):** add 1 to every cell of Count before normalizing. A column with counts A:2, C:1, G:1, T:0 becomes 3,2,2,1 over 8, so Pr(A) = **3/8**, Pr(G) = **2/8 = 0.25**. With pseudocounts, greedy recovers motifs `ACCT, ATGT, ACGG, ACGA, AGGT` with consensus **ACGT** (step through it below).

{{widget:motif-search}}

## RandomizedMotifSearch (Monte Carlo)

```text
RandomizedMotifSearch(Dna, k, t)
  Motifs ← a random k-mer from each string
  BestMotifs ← Motifs
  loop:
      Profile ← Profile(Motifs)            (with pseudocounts)
      Motifs ← Profile-most-probable k-mer from each string
      if Score(Motifs) < Score(BestMotifs): BestMotifs ← Motifs
      else: return BestMotifs
```

Each iteration builds a profile from the current motifs and picks the best k-mers *given* that profile. This is the same alternating pattern as k-means (Module 7) and EM. A single run often ends at a poor **local optimum**, so we run it **thousands of times** from random starts and keep the best. That is a **Monte Carlo** algorithm: fast, but not guaranteed to be correct.

Why does random start ever work? Even random motifs contain, by chance, a slightly over-represented implanted pattern, and the profile then “pulls” the true motifs in.

## Gibbs sampling

RandomizedMotifSearch may replace **all t** motifs in one step, which is reckless because correct motifs can be thrown away. **GibbsSampler** is cautious: it changes **one** motif per iteration.

```text
GibbsSampler(Dna, k, t, N)
  Motifs ← random k-mer from each string;  BestMotifs ← Motifs
  for j ← 1 to N:
      i ← Random(t)
      Profile ← Profile(Motifs without Motifᵢ)          (pseudocounts!)
      Motifᵢ ← Profile-RANDOMLY generated k-mer in Dnaᵢ
      if Score(Motifs) < Score(BestMotifs): BestMotifs ← Motifs
  return BestMotifs
```

**Profile-randomly generated k-mer:** compute $\Pr(\text{k-mer}\mid\text{Profile})$ for each of the n − k + 1 k-mers of Dnaᵢ, **normalize them by their sum**, and roll that biased die. Better k-mers are more likely but not certain, so the sampler can **escape local optima**.

:::exam Mid exam 1(b): “the k-mer probabilities don't add up to 1. Why?”
Pr(k-mer | Profile) is a distribution over **all 4ᵏ possible k-mers**. The deleted string contains only n − k + 1 of them, so their probabilities sum to some C < 1 (e.g., 80/8⁴ in the slides). To sample among *these* k-mers we divide each by C, turning them into a proper distribution (a “seven-sided die” in the slide example).
:::

:::exam Mid exam 1(c): skewed nucleotide composition
If upstream regions are, say, AT-rich, then profiles built from random starts are dominated by A/T. Low-complexity k-mers like `AAAAAAAA` then get high probabilities everywhere, so randomized/Gibbs search converges to **false motifs that just reflect the background composition**, and the true (GC-containing) motif is under-sampled. Remedies: score against a **background model** (log-odds or relative entropy instead of raw probability), use **background-corrected pseudocounts**, mask low-complexity/repeat regions, and use multiple restarts.
:::

**Other practical issues** (slide: “What is the value of k?”): k must be guessed or scanned (try several k); motifs may be absent in some sequences; there may be several motifs or several copies per sequence; and both strands should be searched (reverse complements). Tools like **MEME** (expectation-maximization) handle these, using statistical models closely related to what you've built here.

{{game:motif-hunter}}

## Comparing the algorithms

| Algorithm | Strategy | Guarantee | Cost |
|---|---|---|---|
| MotifEnumeration | brute force over d-neighbors | exact (k,d)-motifs | exponential in k |
| MedianString | try all 4ᵏ patterns | optimal median | $O(4^k n k t)$ |
| GreedyMotifSearch | build motifs one string at a time | none (local) | $O(n^2 k t)$ |
| RandomizedMotifSearch | profile ↔ motifs until no improvement | none; many restarts | fast per run |
| GibbsSampler | resample one motif at a time, randomly | none; escapes local optima better | fast per iteration |

Quiz-style truths: Gibbs **does not** always converge to the same answer (it depends on the random start and seed); it **updates one motif per iteration**; randomness enters in the initial selection and in each resampling step; neither randomized method guarantees the global optimum; pseudocounts **prevent zero probabilities**; the consensus k-mer takes the largest entry of every column, so its probability (the product of column maxima) **is the highest possible**. This holds with or without pseudocounts, since adding +1 everywhere keeps each column's ordering, but other k-mers can tie it. And the consensus need **not** occur in any input string.
