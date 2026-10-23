**Biological question:** which short DNA patterns (**regulatory motifs**) do transcription factors bind to switch groups of genes on or off? In the oriC lesson the hidden message (the DnaA box) appeared many times *in one small region*. A regulatory motif behaves differently: it appears **about once in the upstream region of each of many genes scattered across the genome**, and every copy is slightly different. That change in the problem calls for new algorithms. This lesson follows Chapter 2 of Compeau & Pevzner.

## Motifs, transcription factors and why they vary

Recall from the Introduction: a **transcription factor (TF)** is a protein that binds a short DNA sequence near a gene and helps turn that gene on or off.

- The binding sequence is a **regulatory motif** (or TF binding site), typically 6–20 bases long, sitting in the gene's **promoter** or an **enhancer**.
- A single TF usually regulates **many** genes involved in related processes. So if many genes share a motif in their upstream regions, they are probably controlled together and functionally related.
- Motifs are **degenerate**: the TF tolerates some substitutions, so each instance differs slightly from the ideal sequence. Binding strength varies with the exact letters, which is part of how cells tune gene expression.

{{ref:intro#gene-regulation-when-and-how-much}}

:::bio Two stories from the slides
- **The circadian clock in plants.** In *Arabidopsis*, the genes LHY, CCA1 and TOC1 form a negative feedback loop that oscillates once a day. CCA1 binds the motif `AAAAAATCT`. Steve Kay's group (2000) took about 500 genes whose expression cycles daily and found the **evening element** `AAAATATCT` 46 times in their upstream regions. Mutating that element destroyed circadian behaviour in a test gene: the computational finding was confirmed in the lab.
- **Fly immunity.** When fruit flies are infected, they switch on immunity genes whose upstream regions contain 12-mers similar to `TCGGGGATTTCC`, the binding site of the TF **NF-κB**.
:::

**Why not just reuse FrequentWords?** Suppose you concatenate all upstream regions and count k-mers. That finds patterns that appear many times *somewhere*, which might all be in one region. We want a pattern present, with variation, **in each sequence**. The precise version:

A **(k, d)-motif** is a k-mer that appears in **every** string of a collection with **at most d mismatches**.

**Implanted motif example.** Take ten random 600-base strings and plant a variant of `ATTTGGC` (with up to 2 random mutations) in each. The planted copies may never match `ATTTGGC` exactly, and two copies may differ from each other by up to 4 letters. Finding the motif means seeing through that noise.

{{ref:oric#approximate-matches-hamming-distance}}

## Brute force and median string

**Brute force (MotifEnumeration).** For every k-mer in the input, generate every k-mer within d mismatches of it (its d-neighbourhood), and keep the ones that appear in every string with ≤ d mismatches. With t strings of length n this costs roughly $O(t \cdot n^2 \cdot 4^k \cdot k)$. Exponential in k; for realistic motif lengths, it fails.

**Reformulating as an optimization.** Instead of a yes/no "within d mismatches everywhere", measure *how well* a pattern fits all the strings.

- Let $d(Pattern, Text)$ be the **smallest Hamming distance** between Pattern and any k-mer in Text. It is how close Pattern comes to occurring in Text.
- Example: for Pattern = `AAA` and Text = `TTACCTTAAC`, the 3-mers of Text include `TAA` and `AAC`, each one mismatch away, and none matches exactly, so $d(\texttt{AAA}, Text) = 1$.
- Sum over all strings: $d(Pattern, Dna) = \sum_{i=1}^{t} d(Pattern, Dna_i)$. The slides' example gives $d(\texttt{AAA}, Dna) = 1 + 1 + 2 + 0 + 1 = 5$.

**Median String Problem:** find the k-mer Pattern minimizing $d(Pattern, Dna)$.

**MedianString** tries all $4^k$ patterns and computes the distance of each, costing $O(4^k \cdot n \cdot k \cdot t)$. That is still exponential in k, and it is practical only for small k. More importantly, the textbook shows it is **equivalent** to minimizing the *score* of a motif matrix (next section). That second view lets us design fast heuristics.

{{ref:math#distances-and-similarity|math#counting-how-big-is-the-search-space}}

## Count, profile, consensus and score

Pick one k-mer from each of the t strings and stack them into a $t \times k$ **motif matrix**. For example, with t = 5 and k = 5:

```text
A T C G T
G T C C A
C T A G T
C T C C T
C T C T G
```

Four summaries of this matrix appear throughout the rest of the course:

- **Count(Motifs):** a 4 × k table of how often each nucleotide appears in each column. Column 2 above is all T, so Count(T, 2) = 5.
- **Profile(Motifs):** Count divided by t, giving the frequency of each letter in each column. **Each column sums to 1**: each column is a probability distribution over {A, C, G, T}.
- **Consensus(Motifs):** the most frequent letter in each column. It need not occur in any of the input strings. It is our best guess of the "ideal" motif.
- **Score(Motifs):** the number of letters that disagree with the consensus, summed over the matrix, which equals $\sum_i \text{HammingDistance}(Motif_i, \text{Consensus})$. **Lower is better**: a perfect motif matrix (all rows identical) has score 0.

**Probability of a k-mer under a profile.** A profile is a little generative model: to produce a k-mer, draw column 1's letter from column 1's distribution, column 2's from column 2's, and so on, independently. So the probability of a specific k-mer is the **product** of its letters' column probabilities:

$$\Pr(\text{Pattern} \mid \text{Profile}) = \prod_{j=1}^{k} \text{Profile}(Pattern_j,\ j)$$

The **profile-most-probable k-mer** of a string is the k-mer in that string with the highest such probability. It is how we "scan" a sequence with a profile.

{{ref:math#probability-basics|math#conditional-probability-and-independence}}

{{widget:profile preset="mid"}}

:::example Profile and most-probable k-mer for the matrix above
The motifs `ATCGT, GTCCA, CTAGT, CTCCT, CTCTG` give this profile (columns 1–5):

| | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| A | .2 | 0 | .2 | 0 | .2 |
| C | .6 | 0 | .8 | .4 | 0 |
| G | .2 | 0 | 0 | .4 | .2 |
| T | 0 | 1 | 0 | .2 | .6 |

**Consensus:** `CTC?T`, with a C/G tie in column 4 (CTCCT or CTCGT). **Score:** 8.

**Most probable 5-mer in `ACCTGTTTAT`:** this string has six 5-mers, and **every one has probability 0**: each contains a letter whose profile entry in that column is 0. For instance `CTGTT` needs G in column 3, which the profile says never happens. By the textbook's tie rule the first 5-mer, `ACCTG`, is returned, but the real lesson is that **zeros make the comparison meaningless**. One unseen letter wipes out a k-mer that otherwise matches well.

**With Laplace pseudocounts** (add 1 to every count, so each column's counts sum to 5 + 4 = 9), the winner becomes **`CTGTT`**, with probability $(4 \cdot 6 \cdot 1 \cdot 2 \cdot 4)/9^5 \approx 0.00325$. Pseudocounts are explained in the Greedy section below.
:::

## Entropy and information content

Score counts every mismatch equally. But a column with letters (A, A, A, A, C) is clearly more conserved than (A, C, G, T, A), and some columns of a real motif are much more important for binding than others. **Entropy** measures how uncertain a column is:

$$H(p_1,\dots,p_N) = -\sum_i p_i \log_2 p_i \qquad (\text{using } 0 \log 0 = 0)$$

- A uniform column (¼ each) has H = 2 bits: no information about which letter to expect.
- A fully conserved column (all one letter) has H = 0.
- Examples from the slides: (0.2, 0.6, 0, 0.2) → 1.371 bits; (0, 0.6, 0, 0.4) → 0.971 bits; (0, 0, 0.9, 0.1) → 0.469 bits (the slide rounds this to 0.467).

The **entropy of a motif matrix** is the sum of its column entropies; lower means a more conserved motif. The **information content** of a column is $2 - H$ bits. It is the height of each letter stack in a **sequence logo**, the standard picture of a motif, where tall stacks mark the positions that matter most.

**Rule of thumb: lower entropy = higher information content = more conserved.**

{{ref:math#entropy|math#logarithms-likelihood-and-log-odds}}

{{widget:entropy}}

## GreedyMotifSearch and pseudocounts

Now the first practical algorithm. The idea: choose a k-mer from the first string, then build the motif matrix one string at a time, each time picking the k-mer that best fits the motifs chosen so far.

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

**Walking through it.** The outer loop tries every possible starting k-mer from Dna₁. Given that choice, Dna₂'s motif is the k-mer most similar to it (a profile from one k-mer gives probability 1 to its own letters and 0 to the others). Dna₃'s motif is the most probable k-mer under the profile of the first two, and so on. After all t strings, the motif set is scored, and the best set over all starting k-mers wins.

**Cost:** about $O(n^2 \cdot k \cdot t)$, polynomial and fast. But it is **greedy**: once Motif₁ and the early motifs are chosen, they are never reconsidered.

{{ref:algo#greedy-algorithms}}

**The bigger flaw: zero probabilities.** Early in the loop, the profile is built from only a few motifs, so many entries are 0. Any k-mer containing a single letter never seen in that column gets probability 0, even if it matches perfectly everywhere else. In the slides' example (an implanted (4,1)-motif `ACGT`), plain greedy fails because of this.

**Laplace's Rule of Succession (pseudocounts).** Add 1 to every cell of the Count matrix before normalizing. "Never seen" becomes "rare", not "impossible".

**Example.** A column with counts A:2, C:1, G:1, T:0 becomes 3, 2, 2, 1 out of 8, so Pr(A) = **3/8**, Pr(C) = Pr(G) = **2/8 = 0.25**, Pr(T) = 1/8. T is now unlikely but possible.

With pseudocounts, greedy recovers the motifs `ACCT, ATGT, ACGG, ACGA, AGGT` with consensus **ACGT**. Step through it below.

{{widget:motif-search}}

## RandomizedMotifSearch (Monte Carlo)

Greedy commits to its first choices. A different strategy is to start from a *random* guess and improve it.

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

Each iteration does two easy steps:
1. **Motifs → Profile:** summarize the current motifs.
2. **Profile → Motifs:** in each string, pick the k-mer that best fits the profile.

Repeat while the score improves. This alternating structure is exactly the same as k-means clustering (centers → clusters → centers) and the EM algorithm, which you'll meet in the Gene Expression and HMM lessons.

{{ref:algo#iterative-optimization-the-em-pattern}}

**Why can a random start possibly work?** Even random motifs contain, by chance, a few letters of the implanted motif in each column. That slightly biases the profile toward the true motif, so in the next step the true motif instances score a little better and some get picked. Then the profile is biased more strongly, and the motifs are "pulled in". It doesn't always happen.

**Local optima and restarts.** A single run often ends at a poor **local optimum**: no single step improves it, but it's not the best answer. So we run RandomizedMotifSearch **thousands of times** from different random starts and keep the best result. That makes it a **Monte Carlo** algorithm: fast, with no guarantee of correctness, but very likely to find a good answer given enough runs.

{{ref:algo#randomized-algorithms}}

## Gibbs sampling

RandomizedMotifSearch may replace **all t** motifs in one step. That is reckless: correct motifs found so far can be thrown away in a single move. **GibbsSampler** is more cautious: it changes **one** motif per iteration, and chooses it **randomly** rather than greedily.

If you are new to Gibbs sampling, this lecture from a genomics course introduces it specifically for motif finding. Watch it before the pseudocode.

{{video:NRjhfyXWHuQ}}

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

**Each iteration, step by step:**
1. Pick one string i at random and remove its motif.
2. Build a profile (with pseudocounts) from the other t − 1 motifs.
3. Compute $\Pr(\text{k-mer}\mid\text{Profile})$ for **every** k-mer in Dnaᵢ: there are n − k + 1 of them.
4. **Normalize** these probabilities by dividing by their sum, and **roll that biased die** to choose the new Motifᵢ.

Better-fitting k-mers are more likely to be chosen, but not certain. That randomness is the point: sometimes the sampler accepts a slightly worse k-mer, and that lets it **escape local optima** that would trap a greedy step.

{{ref:math#expected-value-and-sampling-from-a-distribution}}

:::example Why the k-mer probabilities don't add up to 1
$\Pr(\text{k-mer} \mid \text{Profile})$ is a distribution over **all $4^k$ possible k-mers**. The removed string contains only n − k + 1 of them, so their probabilities add up to some C < 1 (in the slides' example, 80/8⁴). To choose among *these* k-mers, divide each by C. Now they sum to 1 and form a proper distribution, which the slides picture as rolling a "seven-sided die" for a string with seven k-mers.
:::

:::example What goes wrong with a skewed nucleotide composition
Suppose the upstream regions are AT-rich. Then profiles built from random starting motifs are dominated by A and T. Low-complexity k-mers like `AAAAAAAA` get high probabilities in every string, so randomized and Gibbs search tend to converge to **false motifs that simply reflect the background composition**, and a true GC-containing motif is rarely sampled.

**Remedies:** score k-mers against a **background model** (use the log-odds of the profile probability versus the background probability, or relative entropy, instead of raw probability), use **background-corrected pseudocounts**, mask low-complexity and repeat regions, and use many restarts.
:::

This second video explains Gibbs sampling as a general Markov chain Monte Carlo method, useful if you want the deeper statistical picture:

{{video:7LB1VHp4tLE}}

**Other practical issues** (slide: "What is the value of k?"): k must be guessed or scanned over several values; some sequences may not contain the motif at all; there can be several motifs, or several copies per sequence; and both strands should be searched (reverse complements). Real tools like **MEME** (which uses expectation-maximization) handle these cases with statistical models closely related to what you've built here.

{{game:motif-hunter}}

## Comparing the algorithms

| Algorithm | Strategy | Guarantee | Cost |
|---|---|---|---|
| MotifEnumeration | brute force over d-neighbours | exact (k, d)-motifs | exponential in k |
| MedianString | try all 4ᵏ patterns | optimal median string | $O(4^k n k t)$ |
| GreedyMotifSearch | build motifs one string at a time | none (can lock in bad choices) | $O(n^2 k t)$ |
| RandomizedMotifSearch | profile ↔ motifs until no improvement | none; needs many restarts | fast per run |
| GibbsSampler | resample one motif at a time, randomly | none; escapes local optima better | fast per iteration |

**Facts worth being sure of:**
- Gibbs sampling **does not** always converge to the same answer: it depends on the random start and the random choices along the way (fix a seed to reproduce a run).
- Gibbs **updates one motif per iteration**. Randomness enters in the initial motifs and in every resampling step.
- Neither randomized method guarantees the global optimum.
- Pseudocounts **prevent zero probabilities**.
- The consensus k-mer takes the largest entry of every column, so its probability (the product of the column maxima) **is the highest possible** under the profile. This holds with or without pseudocounts, because adding +1 everywhere keeps each column's ordering. Other k-mers can tie it. The consensus need **not** occur in any input string.

For a Bangla walkthrough of the same chapter, this video works well as a recap:

{{video:7hIHZF3l7-w}}
