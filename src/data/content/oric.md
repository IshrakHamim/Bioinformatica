**Biological question:** where in a bacterial genome does DNA replication begin? **Why care:** gene therapy uses engineered *viral vectors* to carry a healthy gene into a patient's cells. For a vector to replicate there, its origin of replication (**oriC**) must stay intact, so biologists need to know where it is. (The first successful human gene therapy, in 1990, treated a four-year-old girl with severe combined immunodeficiency.)

A biologist could find oriC experimentally by deleting pieces of the genome until replication stops. That is slow and expensive. A computer scientist asks instead: *is there a hidden message in the DNA sequence that marks the spot?* This lesson follows Chapter 1 of Compeau & Pevzner and builds that answer step by step, from simple word counting to a statistical signal left by replication itself.

If you like learning in Bangla, this walkthrough covers the first half of the chapter (k-mers and frequent words). Watch it before or alongside the next two sections.

{{video:smFsAm-R_Vo}}

## The hidden message: DnaA boxes

Replication starts when a protein called **DnaA** binds to oriC. It binds to short stretches of about 9 nucleotides called **DnaA boxes**. A DnaA box is a "bind here!" message written in DNA. Since one binding site might occur by chance, oriC contains *several* DnaA boxes close together so that the protein binds reliably.

So our plan is: **look for short words that appear surprisingly often** in a small region.

**Definitions you will use all course:**
- A **k-mer** is any string of length k. `ATG` is a 3-mer; `ATGATCAAG` is a 9-mer.
- $\text{Count}(Text, Pattern)$ is the number of times *Pattern* appears in *Text*, **including overlapping** occurrences. Count(`GCGCG`, `GCG`) = 2, because occurrences at positions 0 and 2 overlap.
- *Pattern* is a **most frequent k-mer** of *Text* if no other k-mer has a higher Count. There can be ties, which is why problems ask for *all* of them.

**Counting one pattern:** slide a window of length |Pattern| across the text and compare at each position.

```text
PatternCount(Text, Pattern)
  count ← 0
  for i ← 0 to |Text| − |Pattern|
      if Text[i, |Pattern|] = Pattern: count ← count + 1
  return count
```

**Finding the most frequent k-mers.** The naive *FrequentWords* calls PatternCount for each of the |Text| − k + 1 k-mers in Text. Each call scans the whole text, so the cost is about $O(|Text|^2 \cdot k)$. That is fine for 500 letters but hopeless for a genome.

**Better:** scan the text **once**, and for each k-mer increment its entry in a **frequency table** (a hash map from k-mer to count). Then take the k-mers with the largest count. Cost: $O(|Text| \cdot k)$.

**Worked example.** In `ACGTTGCATGTCGCATGATGCATGAGAGCT` with k = 4, the frequency table gives `CATG` and `GCAT` 3 times each and every other 4-mer fewer, so both are most frequent.

{{ref:algo#hash-maps-counting-things-fast|math#counting-how-big-is-the-search-space}}

"Count k-mers with a dictionary" comes back in genome assembly, read mapping and machine-learning features, so make sure it feels natural.

:::example Counting k-mers in a string
- A string of length n has **n − k + 1** k-mer positions, because a window of length k can start at positions 0 through n − k. A 1,000-bp genome therefore has 1000 − 6 + 1 = **995** 6-mer positions and **994** 7-mer positions.
- The number of *distinct* k-mers is at most min(n − k + 1, 4ᵏ), and smaller if some k-mers repeat. If a question says "distinct", state your assumption.
- For many sequences, multiply: 20 sequences of length 100 contain 20 × (100 − 6 + 1) = **1,900** 6-mer positions; 10 sequences of length 100 contain 10 × 92 = **920** 9-mer positions.
:::

## Frequent words in Vibrio cholerae

Let's try the idea on real data: the 540-nucleotide oriC region of *Vibrio cholerae*, the bacterium that causes cholera. Four different 9-mers appear 3 or more times in it:

**ATGATCAAG, CTTGATCAT, TCTTGATCA, CTCTTGATC**

**Is 3 times surprising?** There are $4^9 = 262{,}144$ possible 9-mers and only 540 − 9 + 1 = 532 positions, so the expected count of any *specific* 9-mer in a random string this long is about 532 / 262,144 ≈ 0.002. Seeing one 3 times is very unlikely by chance. These words are suspicious.

{{ref:math#expected-value-and-sampling-from-a-distribution|math#statistical-significance-and-multiple-testing}}

**The striking observation.** **ATGATCAAG** and **CTTGATCAT** are **reverse complements** of each other. Recall that DNA is double-stranded: a 9-mer on one strand appears as its reverse complement on the other. DnaA binds double-stranded DNA and does not care which strand carries the word. So the real signal is a 9-mer *together with* its reverse complement, appearing **6 times** in total in this short region. That is a very strong hint that it is the DnaA box.

{{ref:intro#dna-the-four-letter-molecule}}

Try counting k-mers yourself:

{{widget:kmer-counter}}

**Is it special to oriC, or just common everywhere?** To check, we solve the **Pattern Matching Problem**: find all positions where a pattern occurs in the whole genome. ATGATCAAG occurs 17 times in the 1.1-million-base *V. cholerae* chromosome that contains oriC. Seventeen is not remarkable for a long genome. But three of those occurrences (positions 151913, 152013 and 152394) sit within a few hundred bases of each other, right inside oriC. The word is not just frequent; it is **clumped**.

## Clumps

To make "close together" precise:

A k-mer forms an **(L, t)-clump** in a genome if some window of length L contains at least t occurrences of it.

**Clump Finding Problem.** *Input:* a genome, and integers k, L, t. *Output:* all distinct k-mers forming (L, t)-clumps in the genome.

**How to compute it.** Slide a window of length L along the genome. Keep a frequency table of the k-mers inside the window. When the window moves one step to the right, one k-mer leaves (decrement its count) and one enters (increment its count), so each step costs O(k) instead of recounting the whole window. Any k-mer whose count reaches t in some window is a clump.

{{widget:clumps}}

**The problem with clumps.** In *E. coli*, hundreds of different 9-mers form (500, 3)-clumps. Clumps alone cannot tell us where oriC is. We need a second, independent signal to narrow the search to a small region, and then we can look for DnaA boxes there. That signal comes from the mechanics of replication.

## Replication is asymmetric

Watch the replication animation again if leading and lagging strands are not fresh in your mind; this section relies on them.

{{video:TNKWgcFPHqw}}

A bacterial chromosome is usually **circular**. Replication starts at **oriC**, and two **replication forks** move away from it in opposite directions around the circle until they meet at the **terminus (terC)**, roughly opposite oriC.

Now recall the rule from the Introduction: DNA polymerase builds a new strand only **5′→3′**, so it reads its template **3′→5′**.

Split each of the two strands into two halves at oriC and terC. That gives four **half-strands**:
- On two of them, the polymerase can move in the same direction as the fork, continuously from oriC to terC. These are **leading half-strands**, which the textbook calls *reverse* half-strands.
- On the other two, the polymerase has to move against the fork. It waits for the fork to open about 2,000 bases, makes a short **Okazaki fragment** back toward oriC, and repeats. These are **lagging half-strands** (*forward* half-strands). **DNA ligase** joins the fragments.

The key difference: a lagging half-strand spends much longer sitting **single-stranded**, waiting for its next fragment to be built.

{{widget:replication-fork}}

{{ref:intro#replication-copying-the-genome}}

## Deamination and the skew diagram

The Bangla walkthrough continues with exactly this part of the chapter (skew and approximate matching). Watch it before reading on if you prefer.

{{video:Ec_pEQENfsE}}

**Why single-stranded time matters.** Single-stranded DNA mutates much faster than double-stranded DNA. The most common such mutation is **deamination of cytosine**: C loses an amine group and effectively turns into T. Over millions of years, this steadily removes C from the half-strand that spends more time single-stranded.

**The consequence.** Because of these mutations, the forward (lagging) half-strand ends up with **fewer C than G**, while its partner, the reverse half-strand, ends up with **fewer G than C**. If you walk along one strand of the genome from start to end and keep a running total of #G − #C:
- on the **reverse** half-strand (from terC to oriC), the total tends to **go down**;
- on the **forward** half-strand (from oriC to terC), it tends to **go up**.

**Skew.** Define $\text{Skew}_i(\text{Genome})$ as #G − #C in the first i nucleotides, with $\text{Skew}_0 = 0$. It is a running sum:

$$\text{Skew}_i = \text{Skew}_{i-1} + \begin{cases}+1 & \text{if } Genome_i = G\\ -1 & \text{if } Genome_i = C\\ 0 & \text{if A or T}\end{cases}$$

Plotting $\text{Skew}_i$ against i gives the **skew diagram**. The skew falls while you are on the reverse half-strand, reaches its **minimum where the reverse half-strand ends and the forward half-strand begins, which is oriC**, and then rises. terC is near the maximum.

:::example Computing a skew by hand
For `CATTCCGGA`, add +1 for each G, −1 for each C and 0 otherwise:

| i | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| letter | C | A | T | T | C | C | G | G | A |
| Skewᵢ | −1 | −1 | −1 | −1 | −2 | **−3** | −2 | −1 | −1 |

The minimum, −3, is at i = 6. Reading it backwards also works: if Skew₁₀₀ = 1 and Skew₁₀₁ = 2, the skew went up by 1, so nucleotide 101 must be **G**.
:::

{{widget:skew}}

**Minimum Skew Problem** (Rosalind BA1F): find all i where Skewᵢ is minimal. One left-to-right pass computes every prefix sum, so it takes O(n) time. In *E. coli* the minimum falls at about position 3,923,620, close to the experimentally known oriC.

Here is a short demonstration of drawing the skew diagram and reading oriC off it:

{{video:C2gQTVyq35E}}

{{game:skew-hunter}}

## Approximate matches: Hamming distance

We have a candidate region from the skew minimum in *E. coli*. Now look for DnaA boxes there. Surprise: **no 9-mer appears 3 or more times**, even counting reverse complements. Why? Because the DnaA boxes in *E. coli* are present with small **variations**. DnaA can bind sequences that differ from its ideal site in a letter or two, so biology tolerates mismatches, and our exact counting misses them.

To count "almost matches" we need a distance between strings:

- The **Hamming distance** between two strings of equal length is the number of positions where they differ. `CGAAT` vs `CGGAC` differ at positions 3 and 5, so the distance is 2.
- *Pattern* appears in *Text* **with at most d mismatches** if some k-mer of Text has Hamming distance ≤ d from Pattern.
- $\text{Count}_d(Text, Pattern)$ counts all such approximate occurrences.

**Example (from the slides).** $\text{Count}_1$(`AACAAGCTGATAAACATTTAAAGAG`, `AAAAA`) = **4**: the 5-mers `AACAA`, `ATAAA`, `AAACA` and `AAAGA` each differ from AAAAA in one position. Notice that AAAAA itself never appears in the text. With up to 2 mismatches the count rises to **11** (try it in the widget).

{{ref:math#distances-and-similarity}}

{{widget:approx-match}}

## Frequent words with mismatches & reverse complements

Now combine the ideas. A **most frequent k-mer with up to d mismatches** is a k-mer Pattern that maximizes $\text{Count}_d(Text, Pattern)$ over **all** $4^k$ possible k-mers. Important: it **does not need to appear in Text at all**. AAAAA above is a good example: it never occurs exactly, but it has 4 near-occurrences.

**Making it efficient.** Trying all $4^k$ patterns is slow ($4^9 \approx 262{,}000$ patterns, each scanned against the text). The trick is to work from the text instead:

1. For each k-mer in Text, generate its **d-neighbourhood**: every string within Hamming distance d of it. For d = 1 a k-mer has 1 + 3k neighbours (itself, plus 3 alternative letters at each of k positions); for k = 9 that is 28.
2. Increment a frequency table entry for every neighbour.
3. The neighbours with the highest totals are the most frequent k-mers with mismatches.

Only patterns that are close to something in the text ever get counted, which is far fewer than $4^k$.

**Adding reverse complements** (Rosalind BA1J): maximize $\text{Count}_d(Text, P) + \text{Count}_d(Text, \overline{P})$, where $\overline{P}$ is the reverse complement of P, because a DnaA box can sit on either strand.

**The payoff.** Applied to a window of about 500 bases around the *E. coli* skew minimum, with k = 9 and d = 1, this finds **TTATCCACA** and its reverse complement **TGTGGATAA**. These are real, experimentally confirmed DnaA boxes. Two weak signals combined (the skew narrows the region, approximate frequent words find the message) solved a problem that neither could solve alone.

:::warn Caveats a researcher should know
- The skew trick works well for many bacteria, but not all: some genomes have weak skews, multiple origins (archaea), or rearrangements that scramble the pattern.
- Eukaryotic chromosomes have thousands of origins and no single DnaA-box-like consensus. Finding them is active research and relies on experimental data (e.g., OK-seq, ORC ChIP-seq), not sequence alone.
- "Surprisingly frequent" always means "compared to a background model". Three occurrences is surprising for a 9-mer in 500 bases but not for a 3-mer.
:::

{{game:complement-rush}}

## Summary

| Problem | Input → Output | Idea / complexity |
|---|---|---|
| PatternCount | Text, Pattern → count | slide a window, O(nk) |
| FrequentWords | Text, k → most frequent k-mers | hash-map frequency table, O(nk) |
| Reverse complement | Pattern → revcomp | reverse + complement, O(k) |
| Pattern matching | Pattern, Genome → positions | naive O(nk); faster methods in Read Mapping |
| Clump finding | Genome, k, L, t → k-mers | sliding-window counts |
| Minimum skew | Genome → positions of the minimum | running sum (prefix sums), O(n) |
| Approximate matching | Text, Pattern, d → positions | Hamming distance ≤ d |
| Frequent words with mismatches (+ reverse complements) | Text, k, d → k-mers | d-neighbourhoods + hash map |

**The story in one line:** frequency alone finds candidates, clumps say "close together", the skew says "here", and approximate matching with reverse complements finds the real DnaA boxes.
