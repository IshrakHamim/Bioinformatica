import type { Module } from '../types';
import content from '../content/readmap.md?raw';

const m: Module = {
  id: 'readmap',
  track: 'cse443',
  code: 'L06',
  title: 'String Matching for Read Mapping',
  subtitle: 'Naive matching, Boyer-Moore, k-mer indexes, edit distance, pigeonhole',
  icon: '🔍',
  color: '#3d6bf2',
  exam: 'mid',
  hours: 5,
  prereqs: ['sequencing', 'oric', 'algo'],
  content,
  concepts: ['naive-matching', 'boyer-moore', 'kmer-index', 'index-variants', 'edit-distance', 'pigeonhole', 'fm-index'],
  videos: [
    { id: '4Xyhb72LCX4', title: 'ADS1: Boyer-Moore basics', channel: 'Ben Langmead', why: 'Bad character & good suffix rules.' },
    { id: 'Wj606N0IAsw', title: 'ADS1: Boyer-Moore: putting it all together', channel: 'Ben Langmead', why: 'The exact example on the slides.' },
    { id: '2UsmUgJtwAI', title: 'ADS1: Indexing and k-mer indexes', channel: 'Ben Langmead', why: 'Index → hits → verification.' },
    { id: 'My_sw_Rf_4U', title: 'ADS1: Variations on k-mer indexes', channel: 'Ben Langmead', why: 'Subsampling and subsequence indexes (Mid 3(b)).' },
    { id: 'MCvHeW13DsE', title: 'ADS1: Approximate matching, Hamming and edit distance', channel: 'Ben Langmead', why: 'Why exact matching is not enough.' },
    { id: 'duatMINEGgE', title: 'ADS1: Pigeonhole principle', channel: 'Ben Langmead', why: 'Approximate matching via exact pieces.' },
    { id: 'bfnFgcB_Nlw', title: 'ADS1: Genome indexes used in research', channel: 'Ben Langmead', why: 'Suffix arrays, FM-index, real tools.' },
  ],
  articles: [
    { title: 'Langmead & Salzberg (2012) Fast gapped-read alignment with Bowtie 2', url: 'https://www.nature.com/articles/nmeth.1923', source: 'Nature Methods', why: 'FM-index based mapper.' },
    { title: 'Li & Durbin (2009) Fast and accurate short read alignment with Burrows–Wheeler transform', url: 'https://doi.org/10.1093/bioinformatics/btp324', source: 'Bioinformatics', why: 'BWA.' },
    { title: 'Ben Langmead teaching materials', url: 'https://www.langmead-lab.org/teaching.html', source: 'Johns Hopkins', why: 'Original slides and notebooks (Boyer-Moore, indexing).' },
  ],
  rosalind: [
    { id: 'ba1d', title: 'Find All Occurrences of a Pattern in a String' },
    { id: 'ba9a', title: 'Construct a Trie from a Collection of Patterns' },
    { id: 'ba9g', title: 'Construct the Suffix Array of a String' },
    { id: 'ba9i', title: 'Construct the Burrows-Wheeler Transform of a String' },
  ],
  quiz: [
    { id: 'q1', type: 'mcq', q: 'Boyer-Moore tries alignments ___ and compares characters ___.', options: ['left→right; left→right', 'left→right; right→left', 'right→left; left→right', 'randomly; right→left'], answer: 1, explain: 'Right-to-left comparison lets mismatches inform big skips.' },
    { id: 'q2', type: 'num', q: 'Naive exact matching of a 6-nt pattern in a 21-nt text tries how many alignments?', answer: 16, explain: 'n − m + 1 = 21 − 6 + 1.' },
    { id: 'q3', type: 'num', q: 'P = ACGTAC; a mismatch occurs at P[3] (T) against text G. Bad-character shift?', answer: 1, explain: 'The rightmost G left of offset 3 is P[2]; shift = 3 − 2 = 1.' },
    { id: 'q4', type: 'tf', q: 'An index hit always means the read matches at that offset.', answer: false, explain: 'Only the seed k-mer matches; the rest must be verified.' },
    { id: 'q5', type: 'mcq', q: 'Indexing only even offsets halves the index. What is the main cost?', options: ['Queries must try both an even- and an odd-phase k-mer of the read', 'It can no longer find matches', 'Hash collisions disappear', 'Verification is no longer needed'], answer: 0, explain: 'A match can start at an odd offset, so queries need multiple phases (more lookups/verifications).' },
    { id: 'q6', type: 'mcq', q: 'Pigeonhole: allowing k = 2 edits, split P into how many pieces?', options: ['2', '3', '4', 'k²'], answer: 1, explain: 'k + 1 pieces; at least one must match exactly.' },
    { id: 'q7', type: 'num', q: 'Edit distance between TGGCCGCGCAAAAACAGC and TGACCGCGCAAAACAGC?', answer: 2, explain: 'One substitution (G→A) and one deletion (an A).' },
    { id: 'q8', type: 'tf', q: 'Hamming distance can model insertions and deletions.', answer: false, explain: 'Only substitutions between equal-length strings; edit distance handles indels.' },
    { id: 'q9', type: 'mcq', q: 'Which structure underlies Bowtie2/BWA?', options: ['Overlap graph', 'Burrows–Wheeler transform / FM-index', 'Bloom filter only', 'B-tree'], answer: 1, explain: 'Compressed full-text index supporting fast exact search.' },
    { id: 'q10', type: 'mcq', q: 'Lookup in a sorted k-mer list uses…', options: ['linear scan', 'binary search, O(log n)', 'hashing, O(1)', 'DP'], answer: 1, explain: 'bisect_left finds the first matching key.' },
  ],
  flashcards: [
    { id: 'f1', front: 'Bad character rule', back: 'On mismatch, skip until the text char lines up with its rightmost occurrence in P to the left, or P passes it.' },
    { id: 'f2', front: 'Good suffix rule', back: 'Skip until the matched suffix t reoccurs in P aligned with t (or a prefix of P matches a suffix of t), or P passes t.' },
    { id: 'f3', front: 'Boyer-Moore shift', back: 'max(bad char, good suffix, 1); after a full match, shift by |P| − (longest border).' },
    { id: 'f4', front: 'k-mer index', back: 'Map every k-mer of T to its offsets; query the read’s k-mer, then verify each hit.' },
    { id: 'f5', front: 'Index hit vs match', back: 'A hit only guarantees the seed matches; full verification decides.' },
    { id: 'f6', front: 'Reducing index size', back: 'Subsample offsets (every n-th), spaced seeds, minimizers, suffix array/FM-index. More lookups/verification per query.' },
    { id: 'f7', front: 'Pigeonhole for k edits', back: 'Split P into k+1 pieces; one must match exactly; find pieces exactly, then verify.' },
    { id: 'f8', front: 'Edit distance recurrence', back: 'D[i][j] = min(D[i−1][j]+1, D[i][j−1]+1, D[i−1][j−1] + [xᵢ≠yⱼ]).' },
    { id: 'f9', front: 'MAPQ', back: 'Phred-scaled probability that a read’s reported mapping position is wrong (low in repeats).' },
  ],
  mindmap: {
    label: 'Read mapping',
    children: [
      { label: 'Exact online', children: [{ label: 'naive O(nm)' }, { label: 'Boyer-Moore (bad char, good suffix)' }] },
      { label: 'Offline index', children: [{ label: 'k-mer index' }, { label: 'sorted list + binary search' }, { label: 'hash table' }, { label: 'subsample / spaced seeds' }, { label: 'FM-index (BWT)' }] },
      { label: 'Approximate', children: [{ label: 'Hamming' }, { label: 'edit distance (DP)' }, { label: 'pigeonhole: seed & verify' }] },
      { label: 'Practice', children: [{ label: 'SAM/BAM, CIGAR, MAPQ' }, { label: 'variant calling' }] },
    ],
  },
  practice: [
    {
      id: 'p1',
      title: 'Boyer-Moore vs naive',
      source: 'Mid exam 3(a), 6 marks',
      exam: 'mid',
      marks: 6,
      prompt: 'Illustrate Boyer-Moore with both rules for Text `TACGACGTACGTAGACGTACG` and Pattern `ACGTAC`, and show how much is saved versus naive exact matching.',
      solution:
        'Offsets 0-based; compare right→left; shift = max(bad character, good suffix).\n\n1. **i = 0:** C=C, A=A, then P[3]=T ≠ T[3]=G. Bad char: rightmost G in P[0..2] is P[2] → shift 1. Good suffix: matched “AC” also occurs at P[0..1] → shift 4. **Shift 4.**\n2. **i = 4:** ACGTAC = T[4..9] → **match at 4**. Longest border of P is “AC” (length 2) → shift 6 − 2 = **4**.\n3. **i = 8:** P[5]=C ≠ T[13]=G. Bad char → 5 − 2 = **3**; good suffix 0. **Shift 3.**\n4. **i = 11:** P[5]=C ≠ T[16]=G → **shift 3**.\n5. **i = 14:** ACGTAC = T[14..19] → **match at 14**. Next offset 18 > 15, so done.\n\n**Boyer-Moore:** 5 alignments, 3 + 6 + 1 + 1 + 6 = **17 comparisons**.\n**Naive:** 16 alignments, **35 comparisons** (stopping at first mismatch).\n\nSaved 11 alignments (≈69%) and 18 comparisons (≈51%).\n\n{{widget:boyer-moore preset="mid"}}',
    },
    {
      id: 'p2',
      title: 'Reducing index size',
      source: 'Mid exam 3(b), 4 marks',
      exam: 'mid',
      marks: 4,
      prompt: 'What are the ways to reduce the size of the index table in reference-genome-based read mapping? How does that affect search efficiency?',
      solution:
        '1. **Subsample offsets**: index k-mers only at every 2nd/3rd offset (size ÷2, ÷3). Queries must look up the read’s k-mers at every phase (0..n−1), so there are **more lookups and more verifications**.\n2. **Subsequence / spaced-seed index**: key = characters at chosen positions; similar size, but mismatch-tolerant seeds (better sensitivity).\n3. **Larger k / store only distinct keys with offset lists**: fewer, more specific hits per query.\n4. **Compressed indexes**: suffix array, BWT/FM-index (Bowtie, BWA), minimizers (minimap2).\n\nEfficiency: the index uses less memory and is more cache-friendly, but each query does more work (multiple phases/seeds, extra verification) and short noisy reads may lose sensitivity: a space–time trade-off.',
    },
  ],
};
export default m;
