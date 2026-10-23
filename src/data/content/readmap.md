**Problem:** a sequencer gives us billions of short reads from a person; we already have a **reference genome** of the species. For each read, find where it came from (**read mapping / alignment**). Differences between read and reference are then either sequencing errors or real **variants**, the start of variant calling. The slides for this lecture are adapted from Ben Langmead's *Algorithms for DNA Sequencing* course, and Boyer-Moore follows Gusfield Ch. 2.

## Naive exact matching

```python
def naive(p, t):
    occurrences = []
    for i in range(len(t) - len(p) + 1):    # loop over alignments
        match = True
        for j in range(len(p)):              # loop over characters
            if t[i+j] != p[j]:               # compare characters
                match = False
                break                        # mismatch: reject alignment
        if match:
            occurrences.append(i)            # all chars matched: record
    return occurrences
```

- Alignments tried: always $n - m + 1$ (n = |T|, m = |P|).
- Character comparisons: at least $n - m + 1$, at most $m(n - m + 1)$, so worst case $O(nm)$.
- For one 100-bp read against a 3-Gb genome that's ~3×10⁹ alignments; for a billion reads it is hopeless. We need either **smarter scanning** (Boyer-Moore) or **preprocessing the genome** (an index).

## Boyer-Moore: learn from mismatches to skip alignments

Try **alignments left→right**, but **compare characters right→left**. When a mismatch occurs, use what we learned to skip alignments that cannot possibly match.

**Bad character rule.** On a mismatch at pattern offset i against text character c, shift P right until (a) the mismatch becomes a match (the rightmost c in P left of i lines up with it), or (b) P moves completely past c (if c is not in P[0..i−1]):
$$\text{shift}_{bc} = i - (\text{rightmost index } j < i \text{ with } P[j] = c), \quad \text{or } i+1 \text{ if none}$$

**Good suffix rule.** Let t = the suffix of P already matched. Shift until (a) another occurrence of t in P lines up with t in T (preferring one preceded by a different character than the mismatching one), or (b) a prefix of P matches a suffix of t, or (c) P moves past t.

**Put together:** shift by the **maximum** of the two rules (never less than 1). After a full match, shift so the longest proper prefix of P that is also a suffix lines up.

In the slide example (P = `GTAGCGGCG`, T = `GTTATAGCTGATCGCGGCGTAGCGGCGAA`), alignments tried are offsets 0, 7, 10, 18: **15 alignments skipped**, and 11 characters of T are never examined.

{{widget:boyer-moore preset="mid"}}

{{game:shift-sprint}}

:::exam Mid exam 3(a): T = TACGACGTACGTAGACGTACG, P = ACGTAC
| # | offset | compared (right→left) | mismatch | bad char | good suffix | shift |
|---|---|---|---|---|---|---|
| 1 | 0 | C✓ A✓ T✗ | P[3]=T vs T[3]=G | rightmost G left of 3 is P[2] → **1** | matched “AC” reoccurs at P[0..1] → **4** | **4** |
| 2 | 4 | all 6 match | none, occurrence at **4** | n/a | match rule: “AC” is both prefix and suffix → **4** | **4** |
| 3 | 8 | C✗ | P[5]=C vs T[13]=G | G at P[2] → **3** | nothing matched → 0 | **3** |
| 4 | 11 | C✗ | P[5]=C vs T[16]=G | **3** | 0 | **3** |
| 5 | 14 | all 6 match | none, occurrence at **14** | n/a | **4** | 4 → offset 18 > 15, stop |

Boyer-Moore: **5 alignments, 17 character comparisons**. Naive: **16 alignments, 35 comparisons** (with early exit). Savings: 11 of 16 alignments skipped (≈69%) and about half the comparisons. Both find the matches at offsets 4 and 14 (0-based).
:::

Preprocessing P takes O(m·|Σ|) for the bad-character table and O(m) for good suffix (Z-algorithm). Typical running time is **sublinear** in n: many characters of T are never looked at. The longer the pattern, the bigger the skips. Boyer-Moore powers tools like GNU `grep`.

{{yt:Wj606N0IAsw|ADS1: Boyer-Moore: putting it all together (Ben Langmead)}}

## Indexing the genome

Preprocess **T** once, then answer every read quickly, like a book's index (key terms → page numbers) or a grocery store's aisles.

**k-mer index:** for every offset i, store k-mer T[i:i+k] → i. Query: look up the read's first k-mer, get candidate offsets (**index hits**), then **verify** the rest of the read at each candidate.

- An index hit is not necessarily a match: the remaining characters must be checked.
- Two implementations from the slides:
  - **Sorted list (multimap) + binary search:** sort (k-mer, offset) pairs; find all entries with key = query by binary search, O(log n) per lookup. In Python, `bisect.bisect_left` finds the first.
  - **Hash table:** k-mer → list of offsets; O(1) expected lookup; uses more memory than a compact sorted array.
- **Specificity:** small k → huge lists of hits per k-mer (many verifications); large k → fewer, more specific hits.

{{widget:kmer-index}}

## Smaller indexes: variants of index search

The human genome has ~3×10⁹ k-mer positions, so a full index is big. Ways to shrink it (Mid exam 3(b)):

1. **Subsample offsets:** index only k-mers at even offsets, or every 3rd offset. The index shrinks to ~1/2 or ~1/3. A query must now try k-mers at **several phases** of the read (offset 0 and 1 for “every 2nd”; 0, 1, 2 for “every 3rd”) so that at least one aligns with an indexed position. Cost: **more lookups per read and more verifications**.
2. **Subsequence (spaced-seed) index:** index characters at selected positions (e.g., offsets 0, 2, 4) instead of contiguous k-mers. *A substring is also a subsequence, but a subsequence need not be a substring.* Spaced seeds tolerate mismatches at the skipped positions, so they improve sensitivity for approximate matching at similar size.
3. **Compressed full-text indexes** (beyond the slides): **suffix arrays** and the **Burrows–Wheeler Transform / FM-index**. The FM-index of the human genome fits in a few GB and supports exact substring search in O(m) time independent of genome size. It is the engine of **Bowtie/Bowtie2** and **BWA**.
4. **Minimizers:** store only the smallest k-mer (by a hash order) in each window of w consecutive k-mers. This shrinks the index by roughly 2/(w+1) while guaranteeing that matching windows share a seed (**minimap2** for long reads).

**Effect on search efficiency:** a smaller index means fewer memory accesses and better cache use, but each query does more work: multiple seeds/phases, more candidate verifications, and possibly lower sensitivity for short reads with errors. It is a classic **space–time trade-off**.

## Approximate matching: Hamming, edit distance, pigeonhole

Reads differ from the reference because of **sequencing errors** and **natural variation** (SNPs, indels).

- **Hamming distance:** number of substitutions (equal lengths only). Naive approximate matching with a Hamming threshold just counts mismatches and stops after too many. It cannot handle insertions or deletions.
- **Edit (Levenshtein) distance:** minimum number of substitutions, insertions and deletions turning X into Y. Computed by **dynamic programming** in O(|X||Y|), which is the bridge to Sequence Alignment (Module 10).

{{widget:edit-distance}}

**Pigeonhole principle.** Split P into k + 1 non-overlapping pieces. If P occurs with ≤ k edits, then **at least one piece occurs with 0 edits** (k edits cannot touch k + 1 pieces). Algorithm: find each piece *exactly* (fast: index or Boyer-Moore), then **verify** the full P around each hit, allowing ≤ k mismatches/edits.

{{widget:pigeonhole}}

From the slides' benchmark (a 50-nt string from an Alu repeat searched in human chromosome 1, hg19): Boyer-Moore exact took 32.5 M character comparisons and ~67 s (336 matches); Boyer-Moore + pigeonhole with ≤ 1 mismatch took 107 M comparisons and ~209 s (1,045 matches); with ≤ 2 mismatches, 171 M and ~328 s (2,798 matches). Allowing errors multiplies both the work and the number of hits.

:::sota What real read mappers do
1. **Seed:** exact matches of short substrings via FM-index (Bowtie2, BWA-MEM) or minimizers (minimap2). That is the pigeonhole idea at scale.
2. **Extend:** dynamic-programming alignment (Smith-Waterman with affine gaps, SIMD-accelerated) around the seed.
3. **Report** in **SAM/BAM** format: position, CIGAR string (matches/insertions/deletions) and **mapping quality** (MAPQ, Phred-scaled confidence that the position is correct; low for repeats).
4. Downstream: sort, mark duplicates, **variant calling** (GATK, DeepVariant, which is a CNN that calls variants from read pileup images).
:::
