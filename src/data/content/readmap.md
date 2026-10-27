**Problem:** a sequencer gives us billions of short reads from one person, and we already have a **reference genome** for the species. For each read, find where in the reference it came from. This is **read mapping** (or read alignment). Once reads are placed, the differences between reads and reference are either sequencing errors or real **variants**, and telling them apart is variant calling. This lesson's slides are adapted from Ben Langmead's *Algorithms for DNA Sequencing* course, and Boyer-Moore follows Gusfield, Chapter 2.

**Why not just assemble?** Assembly (previous lessons) rebuilds a genome from scratch, which is hard. If a good reference already exists, and two humans are about 99.9% identical, it is far easier to **match each read against the reference**. That turns the problem into **string matching**: find where a short pattern P (the read, length m) occurs in a huge text T (the genome, length n).

:::story One sentence in a thousand-volume encyclopedia
You are handed one random sentence and must say exactly which volume, page and line it came from in a 1,000-volume encyclopedia. The sentence is a **read** (the pattern P); the encyclopedia is the **reference genome** (the text T, 3 billion letters). Now do it for a **billion** sentences, some of which contain typos.

The lesson tells how computer science made that possible, in four acts:
1. **Naive search:** slide the sentence along every line. Correct, hopelessly slow.
2. **Boyer-Moore:** still slide, but learn from each mismatch and **jump** past places that cannot match.
3. **An index:** stop sliding. Do a slow, one-time job of building an index, like the one at the back of a book, then look each sentence up almost instantly.
4. **Pigeonhole:** handle typos by looking up *pieces* of the sentence exactly, then checking the whole sentence only where a piece hit.

The theme throughout: **pay a preprocessing cost once to make the operation you repeat billions of times cheap.**
:::

## Naive exact matching

The simplest approach: try every possible starting position (**alignment**) of P in T, and compare characters until one mismatches.

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

**How much work is it?**
- The number of alignments tried is always $n - m + 1$.
- Each alignment compares at least 1 character and at most m, so character comparisons range from $n - m + 1$ (every alignment fails immediately) to $m(n - m + 1)$ (e.g., P = `AAAA` in T = `AAAAAAAA…`, where nearly every alignment matches far). The worst case is $O(nm)$.

For one 100-base read against a 3-billion-base genome, that is about 3 × 10⁹ alignments. For a billion reads it's hopeless. Two ways forward:
1. **Scan smarter:** skip alignments that cannot match (Boyer-Moore).
2. **Preprocess the genome once** so that each read can be looked up quickly (an index).

{{ref:algo#big-o-what-scales-to-a-genome}}

## Boyer-Moore: learn from mismatches to skip alignments

This video introduces the two Boyer-Moore rules with clear pictures. Watch it first; the text below then makes the rules precise.

{{video:4Xyhb72LCX4}}

**Key idea.** Try alignments **left to right**, as before, but compare characters **right to left** within each alignment. When a mismatch happens, use what you've just learned about the text to **skip alignments that cannot possibly match**.

### Bad character rule

When P[i] mismatches text character c, shift P to the right until either
- **(a)** the mismatch becomes a match: the **rightmost occurrence of c in P to the left of position i** lines up with c, or
- **(b)** P moves completely past c, if c does not occur in P[0..i−1].

$$\text{shift}_{bc} = i - (\text{rightmost index } j < i \text{ with } P[j] = c), \quad \text{or } i+1 \text{ if there is none}$$

**Worked example** (Langmead's slides): P = `CCTTTTGC`, T = `GCTTCTGCTACCTTTTGCGCGCGCGCGGAA`.

1. **Offset 0.** Comparing from the right: C=C, G=G, T=T, then P[4] = T vs T[4] = **C**: mismatch. The rightmost C in P left of position 4 is P[1], so shift by 4 − 1 = **3** (case a).
2. **Offset 3.** P[7] = C matches, then P[6] = G vs T[9] = **A**: mismatch. P has no A at all, so shift by 6 + 1 = **7**, moving P past the A (case b).
3. **Offset 10.** All 8 characters match: an occurrence at offset 10.

Naive matching would have tried 11 alignments to get there; Boyer-Moore tried 3.

### Good suffix rule

Let t be the **suffix of P that already matched** before the mismatch. Shift P until
- **(a)** another occurrence of t in P lines up with t in the text (preferring one preceded by a different character from the one that just mismatched, since the same character would mismatch again),
- **(b)** a **prefix** of P matches a suffix of t, or
- **(c)** P moves past t entirely.

Intuition: we know the text there reads t, so any useful alignment must put something matching t (or the end of t) in that spot.

### Putting them together

At each mismatch, compute both shifts and take the **maximum** (never less than 1). Both rules are safe: they never skip an alignment that could match. After a full match, shift so that the longest proper prefix of P that is also a suffix of P lines up.

In the lecture's example (P = `GTAGCGGCG`, T = `GTTATAGCTGATCGCGGCGTAGCGGCGAA`), the alignments tried are offsets 0, 7, 10 and 18: **15 alignments skipped**, and 11 characters of T are never examined at all.

{{widget:boyer-moore preset="mid"}}

{{game:shift-sprint}}

:::example A full Boyer-Moore trace: T = TACGACGTACGTAGACGTACG, P = ACGTAC
| # | offset | compared (right→left) | mismatch | bad char | good suffix | shift |
|---|---|---|---|---|---|---|
| 1 | 0 | C✓ A✓ T✗ | P[3]=T vs T[3]=G | rightmost G left of 3 is P[2] → **1** | matched "AC" reoccurs at P[0..1] → **4** | **4** |
| 2 | 4 | all 6 match | none: occurrence at **4** | n/a | after a match: "AC" is both prefix and suffix → **4** | **4** |
| 3 | 8 | C✗ | P[5]=C vs T[13]=G | G at P[2] → **3** | nothing matched → 0 | **3** |
| 4 | 11 | C✗ | P[5]=C vs T[16]=G | **3** | 0 | **3** |
| 5 | 14 | all 6 match | none: occurrence at **14** | n/a | **4** | 4 → offset 18 > 15, stop |

Boyer-Moore: **5 alignments, 17 character comparisons**. Naive: **16 alignments, 35 comparisons** (stopping at the first mismatch). Boyer-Moore skipped 11 of 16 alignments (about 69%) and about half the comparisons. Both find the matches at offsets 4 and 14 (0-based).
:::

**Cost.** Preprocessing P takes O(m·|Σ|) for the bad-character table (for each position and each letter, where is the rightmost occurrence to the left?) and O(m) for the good-suffix table (using the Z-algorithm). Matching is often **sublinear** in practice: many characters of T are never even looked at. **The longer the pattern, the bigger the skips.** Boyer-Moore powers tools like GNU `grep`.

This second video puts both rules together on the exact example from the slides, a good recap:

{{video:Wj606N0IAsw}}

## Indexing the genome

Boyer-Moore still scans the whole genome for every read. With billions of reads, it's better to **preprocess T once** and then answer each read quickly, the way a book's index maps key terms to page numbers so you don't reread the book.

{{video:2UsmUgJtwAI}}

**A k-mer index.** For every offset i in T, store the pair (k-mer T[i:i+k], i). To look up a read:
1. Take the read's first k-mer and look it up in the index. Each stored offset is an **index hit**.
2. An index hit is only a candidate: the first k letters match, but the rest might not. **Verify** the rest of the read at each candidate offset.

**Example.** T = `CGTGCGTGCTT`, k = 5: the 5-mers are CGTGC (offsets 0 and 4), GTGCG (1), TGCGT (2), GCGTG (3), GTGCT (5), TGCTT (6). Looking up P = `GCGTGCTT` uses its first 5-mer GCGTG → hit at offset 3. Verifying the remaining letters of P (CTT) against T[8..10] (CTT) confirms a match at offset 3. A query starting with CGTGC would get two hits (0 and 4), and each would need verifying.

**Two implementations from the slides:**
- **Sorted list + binary search:** sort all (k-mer, offset) pairs by k-mer, and find all entries for a query by binary search, O(log n) per lookup. In Python, `bisect.bisect_left` finds the first matching entry. Compact in memory.
- **Hash table:** k-mer → list of offsets. O(1) expected lookup, but more memory.

**Choosing k (specificity).** Small k gives many hits per k-mer (in a 3-billion-base genome, a given 5-mer occurs millions of times), so verification dominates. Larger k gives fewer, more specific hits, but a read error inside the k-mer means the true location is missed.

:::think Hash table or sorted list for the index?
**Hash table:** like a magic filing cabinet that tells you the right drawer at once. Lookups are **O(1)** on average, but it uses more memory and keeps no order, so AAAAA and AAAAC land in unrelated places. **Sorted list + binary search:** like a dictionary or phone book. Lookups are **O(log n)**, a little slower, but it is compact and ordered, so you can find all k-mers in an alphabetical range (useful, e.g., for every k-mer starting with a given prefix). With billions of queries the hash table's speed usually wins; when memory is tight, the sorted array (and its compressed descendants, suffix arrays and the FM-index) wins.
:::

{{ref:algo#hash-maps-counting-things-fast|algo#sorting-binary-search-and-indexes}}

{{widget:kmer-index}}

## Smaller indexes: variants of index search

A full k-mer index of the human genome stores about 3 × 10⁹ entries, which is large. This video covers the variations below.

{{video:My_sw_Rf_4U}}

Ways to make the index smaller, and what each costs:

1. **Subsample offsets.** Index only the k-mers at even offsets, or every third offset. The index shrinks to about 1/2 or 1/3. But now the read's first k-mer may start at an offset that was not indexed. So a query must try k-mers at **several phases** of the read: offsets 0 and 1 for "every 2nd", or 0, 1 and 2 for "every 3rd". At least one of them lines up with an indexed position. Cost: **more lookups per read and more verifications**.
2. **Subsequence (spaced-seed) index.** Index characters at selected positions (e.g., offsets 0, 2, 4 of each window) instead of a contiguous k-mer. Remember: *a substring is also a subsequence, but a subsequence need not be a substring.* Spaced seeds **tolerate mismatches at the skipped positions**, so they find more approximate matches at a similar index size.
3. **Compressed full-text indexes** (beyond the slides): **suffix arrays** and the **Burrows–Wheeler transform / FM-index**. The FM-index of the human genome fits in a few gigabytes and finds any exact substring in O(m) time, independent of genome size. It is the engine of **Bowtie/Bowtie2** and **BWA**.
4. **Minimizers.** In each window of w consecutive k-mers, store only the smallest one (according to a hash order). Two overlapping sequences that share a window are guaranteed to pick the same minimizer, so matches aren't lost, and the index shrinks to roughly 2/(w+1) of its full size. This is how **minimap2** indexes for long reads.

**Effect on search efficiency.** A smaller index means fewer memory accesses and better cache use. But each query does more work: multiple seeds or phases, more candidates to verify, and possibly lower sensitivity for short reads with errors. It's a classic **space–time trade-off**.

:::story Why spaced seeds help: searching for "Rob?rt"
Search a database for the name `Robert` and a typo like `Robart` breaks the exact match. Search instead with a pattern that ignores the fifth letter, `Rob?rt`, and both spellings hit. A **spaced seed** does the same with DNA: with the mask `11011`, the windows `ATGCG` and `ATTCG` both become the key `AT·CG`, so a mismatch at the "don't care" position no longer breaks the lookup. You find more true candidates per lookup, which makes the seeding step of approximate matching more sensitive at a similar index size.
:::

This talk shows the genome indexes actually used in research tools:

{{video:bfnFgcB_Nlw}}

## Approximate matching: Hamming, edit distance, pigeonhole

Exact matching isn't enough. A read differs from the reference because of **sequencing errors** and **natural variation** (SNPs, insertions, deletions). This video explains why, and introduces the two distances we use.

{{video:MCvHeW13DsE}}

- **Hamming distance:** the number of substitutions between two strings of equal length. Approximate matching with a Hamming threshold is a small change to the naive algorithm: count mismatches and give up on an alignment when the count exceeds the threshold. But it **cannot** handle insertions or deletions: one inserted base shifts everything after it and makes every later position look like a mismatch.
- **Edit (Levenshtein) distance:** the minimum number of **substitutions, insertions and deletions** that turn X into Y. For example, `GCAT` → `GAT` is one deletion, so the edit distance is 1, even though their lengths differ. It is computed by **dynamic programming** in O(|X|·|Y|) time, which is the bridge to the Sequence Alignment lesson.

{{ref:math#distances-and-similarity|algo#dynamic-programming}}

{{widget:edit-distance}}

**The pigeonhole principle** makes approximate matching fast by reducing it to exact matching.

Split P into **k + 1 non-overlapping pieces**. If P occurs in T with at most k edits, then **at least one piece occurs with no edits at all**: k edits can damage at most k pieces, so one of the k + 1 pieces must be untouched (k pigeons can't fill k + 1 holes).

**Algorithm:**
1. Find every exact occurrence of every piece, quickly (with an index or Boyer-Moore).
2. Around each hit, **verify** the whole of P, allowing up to k mismatches or edits.

**Example.** To find a 50-base read with up to 2 mismatches, split it into 3 pieces of about 17 bases. Any true occurrence contains at least one of the pieces exactly. Exact 17-mer matches are rare in a genome, so there are few candidates to verify.

:::think Why must a mapper also try each read's reverse complement?
DNA is double-stranded, fragments come from either strand at random, but the reference is written as one strand. A read from the other strand appears in the reference as its **reverse complement**. A mapper that tries only the read as given misses about half of all reads. (The course notebook shows this: many φX174 reads only match once you also search their reverse complements.)
:::

:::think Hamming distance or edit distance for read mapping?
**Edit distance.** Hamming distance counts only substitutions and needs equal lengths. Real reads also differ from the reference by small **insertions and deletions**, from sequencing errors (especially in homopolymer runs and long reads) and from real indel variants. One indel shifts every later base, so under Hamming distance the rest of the read looks like mismatches.
:::

{{video:duatMINEGgE}}

{{widget:pigeonhole}}

**What allowing errors costs** (the slides' benchmark: a 50-base string from an Alu repeat searched in human chromosome 1, hg19):

| Search | Character comparisons | Time | Matches |
|---|---|---|---|
| Boyer-Moore, exact | 32.5 M | ~67 s | 336 |
| Boyer-Moore + pigeonhole, ≤ 1 mismatch | 107 M | ~209 s | 1,045 |
| Boyer-Moore + pigeonhole, ≤ 2 mismatches | 171 M | ~328 s | 2,798 |

Allowing errors multiplies both the work and the number of hits, and a repeat like Alu matches in many places, which is why mappers report how *confident* they are in each placement.

:::sota What real read mappers do
1. **Seed:** find exact matches of short substrings using an FM-index (Bowtie2, BWA-MEM) or minimizers (minimap2). That is the pigeonhole idea at scale.
2. **Extend:** run dynamic-programming alignment (Smith–Waterman with affine gaps, accelerated with SIMD instructions) around each seed.
3. **Report** in **SAM/BAM** format: the position, a **CIGAR** string describing matches, insertions and deletions, and the **mapping quality** (MAPQ: a Phred-scaled confidence that the position is correct, which is low for reads from repeats).
4. **Downstream:** sort, mark PCR duplicates, and **call variants** (GATK, or DeepVariant, a convolutional neural network that classifies images of read pileups).
:::

{{ref:tools#file-formats|tools#typical-analysis-workflows}}
