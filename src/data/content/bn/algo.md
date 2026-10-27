Bioinformatics-এ গুটিকয়েক algorithm design-এর কৌশল ঘুরেফিরে বারবার ব্যবহার হয়: hash table দিয়ে গোনা, dynamic programming, greedy আর randomized search, graph-এর ওপর দিয়ে হাঁটা, আর পালা করে optimization (alternating optimization)। একবার কৌশলটা চিনে ফেললে course-এর প্রতিটা নতুন algorithm আপনার আগে থেকে জানা কোনো কিছুরই একটা রূপভেদ মনে হবে।

:::tip এটা আগে পড়ে নেওয়ার দরকার নেই
Course-এর পাঠগুলোতে ঠিক যে ধাপে কোনো ধারণা ব্যবহার হয়, সেখানে **🧱 Stuck? Quick refresher** chip দিয়ে এখানে link দেওয়া আছে, আর সংশ্লিষ্ট অংশটা পাঠের ভেতরেই খুলে যায়। পুরোপুরি প্রস্তুতি নিতে চাইলে শুরু থেকে শেষ পর্যন্ত টানা পড়ে ফেলুন।
:::

## সমস্যা পড়তে শেখা: Input → Output

Compeau & Pevzner-এর textbook-এর প্রতিটা সমস্যা, আর Rosalind-এর প্রতিটা exercise, একই নিখুঁত ছাঁচে লেখা:

> **Minimum Skew Problem.** *Input:* একটা DNA string Genome। *Output:* সেই সব integer i, যেগুলোর জন্য Skewᵢ(Genome) সবচেয়ে কম।

এই ছাঁচটা গুরুত্বপূর্ণ। একটা biological প্রশ্ন ("replication কোথা থেকে শুরু হয়?") অস্পষ্ট; কিন্তু একটা computational সমস্যা একদম নির্দিষ্ট, তাই তার জন্য code লেখা যায়, test করা যায়, আর তার সম্পর্কে কিছু প্রমাণও করা যায়। Course সবসময় একই ধাপগুলো ধরে এগোয়:

1. **Biology:** আমরা আসলে কী জানতে চাই?
2. **সমস্যা:** ঠিক কী input যাবে, আর কী output বের হতে হবে?
3. **Algorithm:** output-টা কীভাবে হিসাব করব, আর কত দ্রুত?
4. **বাস্তবতার যাচাই:** সমস্যাটা সাজাতে গিয়ে কী কী অনুমান ধরে নেওয়া হয়েছে, আর সত্যিকারের data সেই অনুমানগুলো কীভাবে ভাঙে?

কোনো সমস্যার code লেখার আগে নিজেকে জিজ্ঞেস করুন:

- **Search space কী?** সব k-mer? সব alignment? সব tree? (গুনে দেখুন: Math foundation, *Counting*।)
- **সবগুলো কি একটা একটা করে দেখা সম্ভব?** যদি $4^{20}$ বা $2^{100}$টা উপাদান থাকে, তাহলে না।
- **Optimal substructure আছে কি?** যদি সেরা সমাধানটা ছোট ছোট অংশের সেরা সমাধান দিয়েই তৈরি হয়, তাহলে dynamic programming খাটবে।
- **Greedy পছন্দ কি নিরাপদ?** কখনো হ্যাঁ, প্রায়ই না।
- **সমস্যাটা কি NP-hard?** তাহলে সমস্যাটা নতুনভাবে সাজানোর উপায়, একটা heuristic, বা randomization খুঁজুন।

## Big-O: কোনটা genome-এর মাপে চলে

**Big-O notation** বলে দেয় input-এর আকার n বাড়লে running time (বা memory) কীভাবে বাড়ে; ধ্রুবক গুণকগুলো এখানে বাদ দেওয়া হয়। O(n) মানে "input দ্বিগুণ হলে সময়ও মোটামুটি দ্বিগুণ হয়"।

Genome-এর উদাহরণে ব্যাপারটা একদম স্পষ্ট হয়ে যায়। মানুষের genome-এ n ≈ 3 × 10⁹টা অক্ষর, আর একটা computer মোটা দাগে প্রতি সেকেন্ডে 10⁹টা সাধারণ operation করতে পারে:

| বৃদ্ধির হার | n = 3 × 10⁹ হলে operation সংখ্যা | সম্ভব কি? |
|---|---|---|
| O(n) | 3 × 10⁹ | কয়েক সেকেন্ড |
| O(n log n) | ≈ 10¹¹ | কয়েক মিনিট |
| O(n²) | ≈ 10¹⁹ | প্রায় 300 বছর |
| O(2ⁿ) | কল্পনাতীত বড় | কখনোই না |

তাই পুরো genome ছুঁয়ে যায় এমন যেকোনো algorithm-কে প্রায় linear হতেই হবে। আর **memory-ও সময়ের মতোই গুরুত্বপূর্ণ**: 3 × 10⁹টা অবস্থানের প্রতিটার জন্য 8 byte রাখে এমন একটা index-এর লাগবে 24 GB।

Play চাপুন, আর দেখুন n যখন 10 থেকে বেড়ে একটা genome-এর আকারে পৌঁছায়, তখন একই ছয়টা বৃদ্ধির হার কীভাবে দৌড়ায়:

{{widget:bigo}}

আনুষ্ঠানিক সংজ্ঞাগুলোর জন্য (Big-O মানে ওপরের সীমা, Omega মানে নিচের সীমা, Theta মানে আঁটসাঁট সীমা) Abdul Bari-র lecture হলো ক্লাসিক ব্যাখ্যা:

{{video:A03oI0znAoc}}

Striver-এর lecture দেখায় সত্যিকারের code দেখে কীভাবে complexity পড়ে ফেলতে হয়: loop-গুলো গুনুন, আর মনে রাখুন memory-ও হিসাবের মধ্যে পড়ে।

{{video:FPu9Uld7W-E}}

সঠিক ধারণাটা খুঁজে পেলে course-এর সমস্যাগুলো কতটা উন্নত হয়:

| সমস্যা | Brute force | ভালো উপায় |
|---|---|---|
| Frequent words | O(n²k) | hash map, O(nk) |
| Motif finding | সব 4ᵏটা pattern × সব অবস্থান | greedy, randomized, Gibbs |
| Pattern matching | সরল পদ্ধতিতে O(nm) | Boyer-Moore (প্রায়ই sublinear), index O(m + hits) |
| Alignment | সব সম্ভাবনা গোনা, exponential | DP, O(nm) |
| HMM decoding | \|Q\|ⁿটা path | Viterbi, O(n\|Q\|²) |
| Assembly | Hamiltonian path (NP-complete) | Eulerian path, O(\|E\|) |

## Hash map: দ্রুত গোনার কৌশল

একটা **hash map** (Python-এ `dict`) key → value জোড়া রাখে, আর এতে insert আর lookup দুটোই হয় গড়ে **O(1)** সময়ে। Key-টাকে একটা hash function-এর মধ্য দিয়ে চালানো হয়, যা সরাসরি একটা bucket বেছে দেয়; ফলে সব entry ঘেঁটে খুঁজতে হয় না।

Bioinformatics-এ এর সবচেয়ে বেশি ব্যবহার হলো k-mer-এর একটা **frequency table** বানানো:

```python
def frequency_table(text, k):
    freq = {}
    for i in range(len(text) - k + 1):      # every window start
        kmer = text[i:i+k]
        freq[kmer] = freq.get(kmer, 0) + 1   # O(1) on average
    return freq

freq = frequency_table("ACGTTGCATGTCGCATGATGCATGAGAGCT", 4)
best = max(freq.values())
print([k for k, c in freq.items() if c == best])   # ['GCAT', 'CATG'], each 3 times
```

Text-এর ওপর দিয়ে একবারই যাওয়া, প্রতিটা k-mer-এ O(1) কাজ (আর কেটে নিতে O(k)): সব মিলিয়ে O(nk)। অন্যদিকে প্রতিটা pattern-এর জন্য বারবার পুরো text ঘেঁটে আলাদা করে গুনলে লাগত O(n²k)।

দেখুন frequency table কীভাবে তৈরি হচ্ছে। প্রতিটা window সরাসরি hash হয়ে একটা bucket-এ চলে যায়, তাই কোনো ধাপেই পুরো table খুঁজতে হয় না:

{{widget:hash-count}}

একই ধারণা দিয়ে তৈরি হয় **k-mer index** (k-mer → অবস্থানের তালিকা, Read Mapping পাঠ), **de Bruijn graph** (একই রকম (k − 1)-mer-গুলোকে জুড়ে একটা node বানানো, Assembly পাঠ), আর machine learning-এর জন্য **k-mer feature vector**।

**লাভ-ক্ষতির হিসাব:** hash map দ্রুত, কিন্তু memory খায় অনেক (pointer, খালি bucket)। Memory কম থাকলে তার বদলে sorted array ব্যবহার করুন (পরের অংশ)।

Hash table-এর ভেতরে আসলে কী ঘটে (hash function, bucket, collision), Abdul Bari সেটা ব্যাখ্যা করেছেন:

{{video:mFY0J5W8Udk}}

Striver-এর lecture hashing-কে ঠিক আমাদের কাজেই লাগায়: প্রতিটা উপাদান কতবার আছে তা গোনা।

{{video:KEs5UyBJ39g}}

## Sorting, binary search আর index

**Binary search** একটা **sorted** array-এর n-টা উপাদানের মধ্যে কোনো কিছু খোঁজে খোঁজার পরিসরটা বারবার অর্ধেক করে: O(log n)টা তুলনা। 3 × 10⁹টা উপাদানের জন্য সেটা মাত্র প্রায় 32টা তুলনা।

**Sorted k-mer index।** Genome-এর প্রতিটা অবস্থানের জন্য একটা (k-mer, position) জোড়া বানিয়ে তালিকা করুন, তারপর k-mer অনুযায়ী sort করুন। কোনো query k-mer কোথায় কোথায় আছে জানতে, binary search দিয়ে ওই key-এর প্রথম entry-টা খুঁজুন, তারপর যতক্ষণ key মিলছে ততক্ষণ সামনের দিকে পড়ে যান। Python-এ এই খোঁজার কাজটা করে `bisect.bisect_left`।

একটা ছোট sorted index-এ ধাপে ধাপে একটা lookup করে দেখুন। ঝাপসা entry-গুলো বাদ পড়ে গেছে; লাল বাক্সটা হলো মাঝের যে entry-টার সাথে তুলনা চলছে:

{{widget:binary-search}}

Abdul Bari iterative algorithm-টা হাতে-কলমে ধাপে ধাপে দেখান, আর Striver যোগ করেন বাস্তব জীবনের intuition আর `(lo + hi) / 2`-এর সেই ক্লাসিক overflow bug:

{{video:C2apEw9pgtw}}

{{video:MHf6awe89xw}}

| | Hash table | Sorted array + binary search |
|---|---|---|
| Lookup | গড়ে O(1) | O(log n) |
| Memory | বেশি | কম, ঠাসা |
| Range / prefix query | না | হ্যাঁ (কাছাকাছি key-গুলো পাশাপাশি থাকে) |

**যে index genome-এর আকারের ওপর নির্ভর করে না।** Trie, **suffix tree**, **suffix array** আর **Burrows–Wheeler transform / FM-index** দিয়ে যেকোনো substring খোঁজা যায় এমন সময়ে, যা শুধু query-র দৈর্ঘ্যের সমানুপাতিক। মানুষের genome-এর FM-index কয়েক gigabyte-এর মধ্যেই এঁটে যায়; Bowtie2 আর BWA-র মতো read mapper এর ওপরেই চলে। এই course-এর জন্য এদের ভেতরের খুঁটিনাটি জানার দরকার নেই, শুধু মূল ধারণাটা: **বড় text-টাকে একবার preprocess করে রাখুন, তারপর অনেক query দ্রুত উত্তর দিন।**

## Greedy algorithm

একটা **greedy** algorithm প্রতিটা ধাপে ঠিক সেই মুহূর্তে যেটা সবচেয়ে ভালো মনে হয় সেটাই বেছে নেয়, আর পরে কখনো সেই সিদ্ধান্ত ফিরে দেখে না।

Greedy পদ্ধতির পরিচয় নিয়ে Abdul Bari-র lecture:

{{video:ARvQcqJ_-NY}}

**যেখানে greedy ব্যর্থ হয়: খুচরা দেওয়া।** {1, 4, 5} মানের coin দিয়ে 8 দিতে হবে। Greedy প্রতিবার সবচেয়ে বড় যে coin-টা খাটে সেটা নেয়: 5, তারপর 1, 1, 1 (চারটা coin)। অথচ সেরা উত্তর হলো 4 + 4 (দুটো coin)। শুরুতে 5 বেছে নেওয়াটা তখনকার জন্য ভালো দেখাচ্ছিল, কিন্তু সেটাই সেরা সমাধানের পথ বন্ধ করে দিয়েছে।

Greedy তখনই সঠিক, যখন সমস্যাটার একটা **greedy-choice property** থাকে যা আপনি প্রমাণ করতে পারেন (যেমন Dijkstra-র shortest path, Huffman coding)। নইলে greedy-কে একটা দ্রুত **heuristic** হিসেবে দেখুন, আর আরও বুদ্ধিমান পদ্ধতির সাথে তুলনা করে যাচাই করুন।

Course-এ: **GreedyMotifSearch** একটার পর একটা string থেকে সবচেয়ে সম্ভাব্য k-mer-টা বেছে নেয়, আর কখনো পুনর্বিবেচনা করে না (Regulatory Motifs পাঠ)। এটা দ্রুত আর প্রায়ই মোটামুটি ভালো ফল দেয়, কিন্তু শুরুর দিকের একটা খারাপ পছন্দে আটকে যেতে পারে; এই সমস্যা থেকেই randomized পদ্ধতির প্রয়োজন আসে।

## Dynamic programming

**Dynamic programming (DP)**-এর মূল কৌশলটা সহজ: বড় সমস্যাটাকে ছোট ছোট subproblem-এ ভাঙুন, প্রতিটা subproblem একবারই সমাধান করে উত্তরটা একটা table-এ লিখে রাখুন, তারপর সেই জমানো উত্তরগুলো জুড়ে বড় সমস্যার উত্তর বানান। এটা কাজ করে যখন:

- **optimal substructure:** সেরা সমাধানের ভেতরে subproblem-গুলোর সেরা সমাধান থাকে, আর
- **overlapping subproblems:** একই subproblem বারবার ফিরে আসে, তাই উত্তরগুলো জমিয়ে রাখলে একই হিসাব বারবার করতে হয় না।

Overlapping subproblem *চোখে দেখার* সবচেয়ে সহজ উপায় হলো Fibonacci সংখ্যার recursion tree, fib(n) = fib(n − 1) + fib(n − 2)। Memoization ছাড়া চালিয়ে দেখুন, একই call (লাল রঙে) কীভাবে বারবার সমাধান হচ্ছে; তারপর "memoize"-এ টিক দিন:

{{widget:fib-tree}}

Striver ঠিক এই উদাহরণ থেকেই dynamic programming গড়ে তোলেন (memoization → tabulation → space optimization), আর Abdul Bari এর পেছনের principle of optimality ব্যাখ্যা করেন:

{{video:tyB0ztf0DNY}}

{{video:5dRGRueKU3M}}

**চার ধাপের রেসিপি:**
1. **Subproblem-টা নিখুঁতভাবে সংজ্ঞায়িত করুন** (যেমন "MinCoins(m) = m বানাতে সবচেয়ে কম কয়টা coin লাগে")।
2. **Recurrence লিখুন:** subproblem-এর উত্তরকে ছোট subproblem-গুলোর উত্তর দিয়ে প্রকাশ করুন।
3. **Table পূরণ করুন** এমন ক্রমে, যাতে যা যা লাগবে তা আগেই হিসাব করা থাকে।
4. **Traceback করুন:** জমিয়ে রাখা পছন্দগুলো পেছন দিকে অনুসরণ করে শুধু score নয়, সমাধানটাই বের করে আনুন।

**হাতে-কলমে উদাহরণ: {1, 4, 5} coin দিয়ে খুচরা।**

$$\text{MinCoins}(m) = \min_{c \in \{1,4,5\},\ c \le m}\ \text{MinCoins}(m - c) + 1, \qquad \text{MinCoins}(0) = 0$$

| m | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| MinCoins | 0 | 1 | 2 | 3 | 1 | 1 | 2 | 3 | **2** |

m = 8-এর জন্য বিকল্পগুলো হলো MinCoins(7) + 1 = 4, MinCoins(4) + 1 = **2**, MinCoins(3) + 1 = 4, তাই উত্তর 2 (traceback: 8 → 4 → 0, অর্থাৎ দুটো 4-এর coin)। Greedy পেয়েছিল 4। DP প্রতিটা ধাপে প্রতিটা পছন্দই বিবেচনা করে, কিন্তু প্রতিটা subproblem সমাধান করে মাত্র একবার।

এবার দেখুন table নিজে নিজে কীভাবে ভরে ওঠে। প্রতিটা ঘরে, হাইলাইট করা ঘরগুলো হলো সেই subproblem যেগুলো সে দেখছে; শেষ ঘরের পর traceback জ্বলে উঠে দেখায় কোন কোন coin ব্যবহার হলো। Greedy ব্যর্থ হয় এমন আরেকটা উদাহরণের জন্য coin {1, 3, 4} আর পরিমাণ 6 দিয়ে চেষ্টা করুন:

{{widget:coin-dp}}

**1-D থেকে 2-D: alignment।** দুটো string x আর y-এর ক্ষেত্রে subproblem হলো "x-এর প্রথম i-টা অক্ষরকে y-এর প্রথম j-টা অক্ষরের সাথে align করার সেরা score"। প্রতিটা ঘর F(i, j) নির্ভর করে তিনটা প্রতিবেশীর ওপর (বাঁয়ে, ওপরে, কোনাকুনি), আর table-এ ঘর আছে (n+1)(m+1)টা, ফলে সময় লাগে O(nm)। Edit distance, Needleman–Wunsch, Smith–Waterman আর affine gap, সবই এই একই ছাঁচ। নিচের ভিডিওটা edit distance-এর জন্য এটা একদম গোড়া থেকে বের করে দেখায়।

{{video:8Q2IEIY2pDU}}

**এই course-এ DP:** edit distance (Read Mapping), global/local alignment আর affine gap (Sequence Alignment), Viterbi আর Forward (HMMs), small parsimony (Phylogeny), Change আর Manhattan Tourist সমস্যা (textbook-এর প্রস্তুতিমূলক সমস্যা)।

Sequence alignment-এর আগে প্রস্তুতি হিসেবে সবচেয়ে ভালো হলো Abdul Bari-র longest common subsequence (LCS) lecture: table, তিনটা প্রতিবেশী আর traceback সবই এক, শুধু score আলাদা।

{{video:sSno9rV8Rhg}}

## Randomized algorithm

Randomized algorithm এলোমেলো (random) পছন্দ করে। এরা দুই রকম:

- **Monte Carlo:** দ্রুত, কিন্তু উত্তরটা ভুল বা সেরার চেয়ে খারাপ হতে পারে। তাই অনেকবার চালান, আর সেরাটা রাখুন। RandomizedMotifSearch আর Gibbs sampling হলো Monte Carlo।
- **Las Vegas:** উত্তর সবসময় সঠিক; শুধু running time-টা random। Randomized quicksort হলো এর ক্লাসিক উদাহরণ।

Abdul Bari-র quicksort lecture algorithm-টা আর তাতে pivot-এর ভূমিকা ব্যাখ্যা করে। Pivot এলোমেলোভাবে বাছলে (randomized quicksort) যেকোনো input-এই ধীর অবস্থাটা হওয়ার সম্ভাবনা কমে যায়, অথচ output সবসময় ঠিকঠাক sorted থাকে: এটাই textbook-এর আদর্শ Las Vegas algorithm।

{{video:7h1s2SojIRw}}

**Randomness কেন কাজে লাগে।** Deterministic local search প্রতিবার একই খারাপ local optimum-এ আটকে যেতে পারে। Random restart দিয়ে search space-এর ভিন্ন ভিন্ন অঞ্চল ঘুরে দেখা যায়, আর random *পদক্ষেপ* (যেমন Gibbs sampling সবসময় সেরা k-mer না নিয়ে, score-এর সমানুপাতিক সম্ভাবনায় একটা k-mer বেছে নেয়) একটা search-কে local optimum থেকে বেরিয়ে আসতে সাহায্য করে।

নিজের চোখে দেখুন। প্রতিটা বিন্দু হলো একবারের চালনা (একজন "পর্বতারোহী"), যাকে একটা এলোমেলো শুরুর জায়গায় নামিয়ে দেওয়া হয়েছে:

{{widget:local-search}}

**ব্যবহারিক অভ্যাস:** একটা **random seed** ঠিক করে দিন যাতে ফল আবার হুবহু পাওয়া যায়; **অনেকবার restart** করুন; সেরা ফলটা আর সেটা কতবার পাওয়া গেছে দুটোই জানান। কোনো distribution থেকে কীভাবে নমুনা নিতে হয়, তা আছে Math foundation-এ (*Sampling*)।

## Graph: মৌলিক ধারণা

একটা **graph** হলো কিছু **node** (vertex), যেগুলো **edge** দিয়ে জোড়া। সম্পর্ক দিয়ে তৈরি যেকোনো কিছুর জন্য এটাই স্বাভাবিক data structure:

Striver-এর পরিচিতিমূলক lecture-এ নিচের শব্দগুলো (directed, undirected, degree, path, cycle, weight) ছবি দিয়ে বোঝানো হয়েছে:

{{video:M3_pLsDdeuU}}

| Course-এ | Node | Edge |
|---|---|---|
| de Bruijn graph | (k − 1)-mer | k-mer (read) |
| Overlap graph | read | overlap |
| Protein interaction network | protein | ভৌত interaction |
| Phylogenetic tree | প্রজাতি (species) আর তাদের পূর্বপুরুষ | বংশধারা (descent) |
| HMM state diagram | hidden state | transition |

পরিভাষা:
- **Directed** edge-এর একটা দিক আছে (u → v); **undirected** edge-এর নেই।
- **Degree** = একটা node-এ কয়টা edge লেগে আছে; directed graph-এ আছে **in-degree** আর **out-degree**।
- **Path** হলো edge দিয়ে জোড়া node-এর একটা ক্রম; **cycle** যেখান থেকে শুরু সেখানেই ফিরে আসে।
- **Connected:** প্রতিটা node থেকে অন্য প্রতিটা node-এ পৌঁছানো যায়।
- **Weighted** edge-এর সাথে একটা সংখ্যা থাকে (দূরত্ব, আস্থা)।

**Graph কীভাবে রাখা হয়।** একটা **adjacency matrix** A-তে i → j edge থাকলে $A_{ij} = 1$; এতে memory লাগে n²। একটা **adjacency list** প্রতিটা node-এর প্রতিবেশীদের তালিকা রাখে; এতে memory লাগে edge-এর সংখ্যার সমানুপাতিক। Biological graph-গুলো **sparse** (প্রতি node-এ অল্প কয়েকটা edge), তাই adjacency list-ই প্রচলিত:

```python
graph = {"AT": ["TG"], "TG": ["GC", "GA"], "GC": ["CA", "CT"]}
```

## Breadth-first আর depth-first search

**Breadth-first search (BFS)** একটা queue ব্যবহার করে graph-টা স্তরে স্তরে ঘুরে দেখে: প্রথমে শুরুর node-এর সব প্রতিবেশী, তারপর তাদের প্রতিবেশী, এভাবে চলতে থাকে। Unweighted graph-এ BFS যে স্তরে প্রথমবার কোনো node-এ পৌঁছায়, সেটাই শুরু থেকে ওই node-এর **shortest-path distance**।

```python
from collections import deque
def bfs_distances(graph, s):
    dist = {s: 0}
    q = deque([s])
    while q:
        u = q.popleft()
        for v in graph.get(u, []):
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist
```

প্রতিটা node থেকে BFS চালালে সব জোড়ার shortest-path distance পাওয়া যায়, আর তা থেকে **diameter** (সবচেয়ে বড় দূরত্ব) আর **closeness centrality**, যেগুলো Biological Networks পাঠে ব্যবহার হয়। প্রতিটা শুরুর node-এর জন্য BFS-এ সময় লাগে O(|V| + |E|)।

**Depth-first search (DFS)** একটা stack বা recursion ব্যবহার করে একটা শাখা ধরে যতটা সম্ভব গভীরে যায়, তারপর পিছিয়ে আসে (backtrack)। এটা দিয়ে connected component খোঁজা যায়, cycle ধরা যায়, আর এটাই Eulerian cycle-এর জন্য **Hierholzer's algorithm**-এর কাঠামো (পরের অংশ)।

একই graph-এ দুটোকে তুলনা করুন। BFS আর DFS-এর মধ্যে বদল করে দেখুন: queue বাড়ে পেছন দিকে, আর stack বাড়ে ওপরের দিকে:

{{widget:graph-search}}

Abdul Bari একই graph-এ দুটো traversal-ই ধাপে ধাপে দেখান, আর Striver-এর দুটো lecture প্রতিটাকে তার queue বা recursion stack দিয়ে গড়ে তোলে:

{{video:pcKY4hjDrxk}}

{{video:-tgVpUgsQ5k}}

{{video:Qzf1a--rhp8}}

## Eulerian আর Hamiltonian path

দুটো প্রশ্ন, শুনতে প্রায় একই রকম:

- **Eulerian path:** এমন একটা হাঁটা, যা প্রতিটা **edge** ঠিক একবার ব্যবহার করে।
- **Hamiltonian path:** এমন একটা path, যা প্রতিটা **node** ঠিক একবার ছুঁয়ে যায়।

অথচ এদের কঠিনতা সম্পূর্ণ আলাদা। **Eulerian** path linear সময়ে, O(|E|)-এ খুঁজে পাওয়া যায়। **Hamiltonian** path হলো **NP-complete**: এর জন্য কোনো দক্ষ algorithm জানা নেই।

Hamiltonian path কেন কঠিন সেটা অনুভব করতে, দেখুন Abdul Bari কীভাবে backtracking দিয়ে একটা Hamiltonian cycle খোঁজেন: search tree প্রতিটা node-এ শাখা ছড়ায়, আর Euler-এর degree নিয়মের মতো কোনো শর্টকাট নেই যা দিয়ে এই খোঁজা এড়ানো যায়।

{{video:dQr4wZCiJJ4}}

**Euler's theorem (directed graph)।** একটা node-কে **balanced** বলে যদি in-degree = out-degree হয়। একটা connected directed graph-এ **Eulerian cycle** থাকে যদি এবং কেবল যদি প্রতিটা node balanced হয়। আর **Eulerian path** থাকে যদি এবং কেবল যদি দুটো বাদে সব node balanced হয়: একটা শুরুর node, যেখানে out = in + 1, আর একটা শেষের node, যেখানে in = out + 1।

**Hierholzer's algorithm:**
1. শুরুর node থেকে (cycle হলে যেকোনো জায়গা থেকে) শুরু করুন, আর অব্যবহৃত edge ধরে হাঁটতে থাকুন যতক্ষণ না আটকে যান।
2. যদি এখনো অব্যবহৃত edge থাকে, তাহলে আপনার হাঁটা পথের এমন একটা node বাছুন যেটাতে এখনো অব্যবহৃত edge আছে, সেখান থেকে একটা নতুন cycle হাঁটুন, আর সেটাকে মূল পথের ভেতরে জুড়ে দিন।
3. প্রতিটা edge ব্যবহার না হওয়া পর্যন্ত এভাবে চালিয়ে যান।

এখানে genome read-এর ওপর Hierholzer's algorithm-এর stack সংস্করণ কাজ করছে। প্রতিটা read হলো তার prefix থেকে suffix পর্যন্ত একটা edge; algorithm যে path খুঁজে পায়, সেটা পড়লেই genome-টা পাওয়া যায়:

{{widget:hierholzer}}

**কেন এটা গুরুত্বপূর্ণ:** genome assembly-কে দুইভাবেই সাজানো যায়। একটা *overlap graph*-এ (read = node) genome হলো একটা Hamiltonian path, যা কার্যত সমাধানের অযোগ্য। একটা *de Bruijn graph*-এ (read = edge) এটা একটা Eulerian path, যা সহজ। শুধু উপস্থাপনের ধরন বদলেই একটা অসম্ভব সমস্যা linear সময়ের সমস্যায় পরিণত হয়েছে।

{{video:TNYZZKrjCSk}}

## Tree আর recursion

একটা **tree** হলো cycle ছাড়া একটা connected graph। n-টা node-এর একটা tree-তে ঠিক n − 1টা edge থাকে। একটা **rooted** tree-তে একটা node-কে root হিসেবে ধরা হয়; বাকি প্রতিটা node-এর একটা **parent** থাকে, আর যেসব node-এর কোনো child নেই সেগুলো **leaf**।

Tree নিয়ে কাজ করার স্বাভাবিক উপায় হলো **recursion**: প্রতিটা child-এর subtree-র জন্য সমস্যাটা সমাধান করুন, তারপর parent-এ এসে সেগুলো জুড়ে দিন।

Recursion যদি এখনো পিচ্ছিল মনে হয়, Striver-এর lecture ছোট উদাহরণ দিয়ে recursion tree আর call stack এঁকে দেখায়:

{{video:yVdKa8dnKiE}}

```python
def leaves(tree, node):
    kids = tree.get(node, [])
    if not kids:
        return [node]                   # a leaf
    return [x for c in kids for x in leaves(tree, c)]
```

**Post-order** traversal (আগে child, পরে parent) হলো **Fitch's small-parsimony algorithm**-এর নিচ থেকে ওপরে যাওয়ার ধাপ; তারপর ওপর থেকে নিচে মান বসানোর ধাপটা একটা **pre-order** traversal। **Newick** format, `((A:2,B:2):1,(C:2,D:2):1);`, একটা tree-কে branch length সহ nested বন্ধনী দিয়ে লেখে।

Course-এ: phylogenetic tree (UPGMA, neighbour joining, parsimony), hierarchical clustering থেকে পাওয়া dendrogram, আর progressive multiple alignment-এর guide tree।

## পুনরাবৃত্ত optimization: EM-এর ছাঁচ

Course-এর অনেক algorithm এমন **দুটো পরস্পর-নির্ভর অজানা** নিয়ে optimization করে, যাদের একটা একটা করে সমাধান করা সহজ:

- Motif-গুলো জানা থাকলে profile বের করা সহজ হতো (column ধরে গুনে নিন)। আবার profile জানা থাকলে motif-গুলো বের করা সহজ হতো (সবচেয়ে সম্ভাব্য k-mer বেছে নিন)।
- Cluster-গুলো জানা থাকলে center বের করা সহজ হতো (গড় নিন)। আবার center জানা থাকলে cluster বের করা সহজ হতো (সবচেয়ে কাছের center)।

তাই **পালা করে** করুন: একটাকে স্থির রেখে অন্যটা সমাধান করুন, তারপর অদলবদল করুন, আর কিছু না বদলানো পর্যন্ত এভাবে চালিয়ে যান।

| Algorithm | ধাপ A | ধাপ B |
|---|---|---|
| RandomizedMotifSearch | motif → profile | profile → motif |
| k-means (Lloyd) | center → cluster | cluster → center |
| Soft k-means (EM) | center → responsibility | responsibility → center |
| Viterbi training / Baum–Welch | parameter → path (বা প্রত্যাশিত count) | path → parameter |

**Expectation–maximization (EM)** হলো এর probabilistic রূপ: E-step *নরম* (probabilistic) assignment হিসাব করে, আর M-step সেগুলো থেকে parameter-গুলো নতুন করে অনুমান করে।

প্রতিটা ধাপ objective-কে কখনো খারাপ করে না, তাই প্রক্রিয়াটা একসময় স্থির হয় (converge করে), তবে শুধু একটা **local optimum**-এ, যা নির্ভর করে আপনি কোথা থেকে শুরু করেছিলেন তার ওপর। তাই শুরুর মান বাছাই (যেমন k-means++) আর একাধিকবার restart করা গুরুত্বপূর্ণ।

k-means-এ এই পালাবদলটা দেখুন: প্রতিটা বিন্দুকে সবচেয়ে কাছের center-এ দিন, প্রতিটা center-কে তার বিন্দুগুলোর গড়ে সরিয়ে নিন, আবার করুন। ভিন্ন শুরু থেকে ভিন্ন local optimum-এ গিয়ে থামতে পারে।

{{widget:kmeans}}

## NP-hardness আর heuristic

একটা সমস্যাকে **NP-hard** বলা হয় যদি তার জন্য একটা দক্ষ (polynomial-time) algorithm পাওয়া গেলে বিশাল এক শ্রেণির সমস্যার জন্যও দক্ষ algorithm পাওয়া যেত, অথচ ধারণা করা হয় সেগুলোর কোনোটারই এমন algorithm নেই। বাস্তবে এর মানে: **বড় input-এর জন্য একই সাথে নিখুঁত আর দ্রুত algorithm আশা করবেন না।**

P, NP, NP-hard আর NP-complete নিয়ে Abdul Bari-র lecture আনুষ্ঠানিক চিত্রটা দেয়, reduction কী সেটাও:

{{video:e2cF8a5aAhE}}

Course-এর NP-hard সমস্যাগুলো:
- **Hamiltonian path** (overlap graph দিয়ে assembly)
- sum-of-pairs scoring সহ **multiple sequence alignment**
- **Large parsimony** (সেরা tree খোঁজা)
- **k-means** clustering (global optimum খোঁজা)
- সাধারণ রূপে **motif finding**

তিনটা ব্যবহারিক সমাধান, যার সবগুলোই course-এ ব্যবহার হয়েছে:
1. **সমস্যাটা নতুনভাবে সাজান:** overlap graph-এর বদলে de Bruijn graph।
2. **বাস্তবে ভালো কাজ করে এমন heuristic ব্যবহার করুন:** progressive MSA, BLAST, tree rearrangement, greedy আর randomized motif search।
3. **নিশ্চয়তাসহ একটা approximation ব্যবহার করুন:** k-means++ প্রত্যাশিত মানে (in expectation) optimal-এর O(log k) গুণের মধ্যে থাকে।

NP-hardness-এর কথা আসলে সবচেয়ে খারাপ ক্ষেত্র (worst case) নিয়ে। সত্যিকারের biological input প্রায়ই অনেক সহজ হয়, আর সেজন্যই heuristic-গুলো এত ভালো কাজ করে।
