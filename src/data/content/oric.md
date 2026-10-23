**Biological question:** where in a bacterial genome does DNA replication begin? **Why care:** gene therapy uses engineered *viral vectors*. For a vector to replicate inside a patient's cells, its origin of replication (**oriC**) must stay intact, so biologists must know where it is. (The first successful human gene therapy, in 1990, treated a four-year-old girl with severe combined immunodeficiency.)

A biologist could delete pieces of the genome until replication stops. That is slow and expensive. A computer scientist asks: *is there a hidden message in the sequence itself?* This module follows Chapter 1 of Compeau & Pevzner.

## The hidden message: DnaA boxes

Replication is initiated by the protein **DnaA**, which binds short ~9-nt segments in oriC called **DnaA boxes**. A DnaA box is a “bind here!” message hidden in the DNA. If we can find unusually frequent short words in a region, they may be such messages.

**Definitions you'll use all course:**
- A **k-mer** is a string of length k.
- $\text{Count}(Text, Pattern)$ = number of (possibly overlapping) occurrences of *Pattern* in *Text*.
- *Pattern* is a **most frequent k-mer** if it maximizes Count over all k-mers. There can be ties, which is why the problem asks for *all* of them.

```text
PatternCount(Text, Pattern)
  count ← 0
  for i ← 0 to |Text| − |Pattern|
      if Text[i, |Pattern|] = Pattern: count ← count + 1
  return count
```

**FrequentWords** (naive): for each of the $|Text|-k+1$ positions, call PatternCount, giving $O(|Text|^2 \cdot k)$. **Better:** slide a window once and increment a **hash map** (frequency table), giving $O(|Text| \cdot k)$. This “count k-mers with a dictionary” idea returns in genome assembly, read mapping and ML feature extraction.

:::exam Quick counting facts (quiz favourites)
- A string of length n has **n − k + 1** k-mers (counting repeats). A 1000-bp genome therefore has 1000 − 6 + 1 = **995** 6-mers and **994** 7-mers (k-mer *positions*). The number of *distinct* k-mers is at most min(n − k + 1, 4ᵏ), and fewer if some repeat. Quiz questions saying “distinct” usually expect n − k + 1, so state your assumption.
- 20 sequences of length 100 contain 20 × (100 − 6 + 1) = **1,900** candidate 6-mers. 10 sequences of length 100 have 10 × 92 = **920** candidate 9-mers.
:::

## Frequent words in Vibrio cholerae

In the 540-nt oriC of *Vibrio cholerae* (the cholera bacterium), four 9-mers appear 3 or more times: **ATGATCAAG, CTTGATCAT, TCTTGATCA, CTCTTGATC**. In a random string of that length, a specific 9-mer appearing 3 times is very unlikely, which makes these suspicious.

The striking discovery: **ATGATCAAG** and **CTTGATCAT** are **reverse complements** of each other. DnaA doesn't care which strand it binds, so the real signal is a 9-mer *together with* its reverse complement, appearing 6 times in total.

{{widget:kmer-counter}}

**Is it really special?** The **Pattern Matching Problem** (find all positions of a pattern) shows ATGATCAAG occurs 17 times in the whole 1.1-Mb V. cholerae genome. But three of them (positions 151913, 152013, 152394) form a **clump**: they occur close together, right in oriC.

## Clumps

A k-mer forms an **(L, t)-clump** if some window of length L contains at least t occurrences of it.

**Clump Finding Problem.** *Input:* Genome, k, L, t. *Output:* all distinct k-mers forming (L, t)-clumps.

{{widget:clumps}}

Problem: in *E. coli*, hundreds of 9-mers form (500, 3)-clumps, so clumps alone cannot locate oriC. We need a second, independent signal to narrow the search. That signal comes from the biology of replication itself.

## Replication is asymmetric

In a circular bacterial chromosome, replication starts at **oriC** and two **replication forks** move in opposite directions until they meet at the **terminus (terC)**, roughly opposite oriC.

- DNA polymerase can only *read* a template **3′→5′** (it builds 5′→3′).
- Divide each strand into two **half-strands** (oriC→terC and terC→oriC). On *reverse* half-strands, polymerase can move continuously from oriC to terC: these are **leading** half-strands.
- On *forward* half-strands, polymerase must work backwards toward oriC. It waits for the fork to open (~2,000 nt), primes, copies a short **Okazaki fragment**, and repeats. These are **lagging** half-strands. **DNA ligase** stitches fragments together.

{{widget:replication-fork}}

## Deamination and the skew diagram

The forward (lagging) half-strand spends much longer **single-stranded**, and single-stranded DNA mutates far faster. The most common such mutation is **deamination of cytosine (C → T)**. Over evolutionary time the forward half-strand loses C, so it has relatively more G than C. Its partner (reverse half-strand) correspondingly loses G.

Consequence: walking along the genome 5′→3′, **#G − #C decreases on the reverse half-strand and increases on the forward half-strand**.

**Skew.** $\text{Skew}_i(\text{Genome})$ = #G − #C in the first i nucleotides, with $\text{Skew}_0 = 0$:

$$\text{Skew}_i = \text{Skew}_{i-1} + \begin{cases}+1 & \text{if } Genome_i = G\\ -1 & \text{if } Genome_i = C\\ 0 & \text{otherwise}\end{cases}$$

The skew decreases (reverse half-strand) until it reaches oriC and then increases (forward half-strand). So **oriC is where the skew is minimal**, and terC is near the maximum.

{{widget:skew}}

:::exam Worked mini-example (Quiz 1)
Skew of `CATTCCGGA` after each prefix: C → −1, A → −1, T → −1, T → −1, C → **−2** (position 5), C → −3, G → −2, G → −1, A → −1.
If Skew₁₀₀ = 1 and Skew₁₀₁ = 2, the skew went up by 1, so nucleotide 101 is **G**.
:::

**Minimum Skew Problem** (Rosalind BA1F): find all i minimizing Skew_i. One linear pass, O(n). In *E. coli* the minimum lands at ~3,923,620, close to the experimentally known oriC.

## Approximate matches: Hamming distance

In *E. coli*'s skew minimum region, **no 9-mer** (even with its reverse complement) appears 3 or more times. The DnaA boxes there are present with **variations**: biology tolerates mismatches.

- **Hamming distance** = number of positions where two equal-length strings differ. `CGAAT` vs `CGGAC` → 2.
- Pattern appears in Text **with at most d mismatches** if some substring has Hamming distance ≤ d from it.
- $\text{Count}_d(Text, Pattern)$ counts such approximate occurrences. Example from the slides: $\text{Count}_1$(AACAAGCTGATAAACATTTAAAGAG, AAAAA) = 4 (AACAA, ATAAA, AAACA, AAAGA; two of them overlap). The exercise asks for $\text{Count}_2$: the widget below gives **11**.

{{widget:approx-match}}

## Frequent words with mismatches & reverse complements

A **most frequent k-mer with up to d mismatches** maximizes $\text{Count}_d(Text, Pattern)$ over *all* $4^k$ k-mers. It **does not need to appear** in Text at all (AAAAA above). Searching all $4^k$ patterns is slow, so the efficient approach generates the **d-neighborhood** of each k-mer in Text (all strings within Hamming distance d) and counts neighbors in a hash map.

Combining everything (BA1J): maximize $\text{Count}_d(Text, P) + \text{Count}_d(Text, \overline{P})$ where $\overline{P}$ is the reverse complement. Applied in a window around the *E. coli* skew minimum, this finds **TTATCCACA** and its reverse complement TGTGGATAA. These are real experimentally confirmed DnaA boxes.

:::warn Caveats a researcher should know
- The skew trick works well for many bacteria, but not universally: some genomes have weak skews, multiple origins (archaea, eukaryotes), or rearrangements.
- Eukaryotic chromosomes have thousands of origins and no single DnaA-box-like consensus. Finding them is an active research topic (using experimental data like OK-seq and ORC ChIP-seq, not sequence alone).
- Statistical surprise depends on a background model. “Appears 3 times” is surprising for 9-mers in 500 nt, but not for 3-mers.
:::

## Summary

| Problem | Input → Output | Idea / complexity |
|---|---|---|
| PatternCount | Text, Pattern → count | slide window, O(nk) |
| FrequentWords | Text, k → most frequent k-mers | hash map, O(nk) |
| Reverse complement | Pattern → revcomp | O(k) |
| Pattern matching | Pattern, Genome → positions | naive O(nk); fast methods in Read Mapping |
| Clump finding | Genome, k, L, t → k-mers | sliding window counts |
| Minimum skew | Genome → argmin positions | prefix sums, O(n) |
| Approx. matching | Text, Pattern, d → positions | Hamming ≤ d |
| Freq. words w/ mismatches (+RC) | Text, k, d → k-mers | d-neighborhoods + hash map |
