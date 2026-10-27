**জৈবিক প্রশ্ন:** transcription factor-রা কোন ছোট ছোট DNA pattern (**regulatory motif**)-এ বসে একগুচ্ছ gene একসাথে চালু বা বন্ধ করে? oriC lesson-এ লুকানো বার্তাটা (DnaA box) *একটা ছোট region-এর ভেতরেই* বারবার দেখা দিয়েছিল। regulatory motif-এর আচরণ আলাদা: এটা **genome জুড়ে ছড়িয়ে থাকা অনেকগুলো gene-এর প্রতিটার upstream region-এ মোটামুটি একবার করে** থাকে, আর প্রতিটা কপি একটু একটু আলাদা। সমস্যার এই পরিবর্তনের জন্যই নতুন algorithm দরকার। এই lesson-টা Compeau ও Pevzner-এর বইয়ের Chapter 2 অনুসরণ করে।

:::story বাড়ির মেইন সুইচ
**gene** হলো DNA নামের রান্নার বইয়ের একটা রেসিপি। আপনার শরীরের প্রতিটা cell-এ একই রান্নার বই আছে, কিন্তু একটা skin cell শুধু skin-এর রেসিপিগুলোই রান্না করে। **transcription factor** হলো একটা মেইন সুইচের মতো: একটাই protein, যা একসাথে পুরো একদল gene চালু করে দেয়। এটা সেটা করে একটা ছোট "রিসিভার" sequence-এ বসে, যার নাম **regulatory motif**, এবং যেটা ওই দলের প্রতিটা gene-এর ঠিক upstream-এ বসানো থাকে।

oriC-এর পর এটা কেন নতুন সমস্যা, একটা ছবিতে বোঝা যাক:
- **oriC** খোঁজা যেন একটা উপন্যাসের সেই অধ্যায়টা খুঁজে বের করা, যেখানে "Dr. Watson" নামটা কাছাকাছি অনেকবার এসেছে। এক জায়গা, অনেক কপি, প্রায় হুবহু এক।
- **regulatory motif** খোঁজা যেন "Sincerely," শব্দটা খোঁজা, যা **অনেকগুলো আলাদা চিঠির প্রতিটার শেষে একবার করে** থাকে, আর প্রতিবার বানানটা একটু আলাদা।

এই ঝাপসা, ছড়িয়ে থাকা সুইচগুলো খুঁজে পেলে আমরা জানতে পারি কোন gene-গুলো একসাথে নিয়ন্ত্রিত হয়, আর কোন মেইন সুইচ সেগুলোকে নিয়ন্ত্রণ করে।
:::

## Motif, transcription factor এবং কেন এরা একটু একটু আলাদা

Introduction lesson-এর কথা মনে করুন: **transcription factor (TF)** এমন একটা protein, যা gene-এর কাছে একটা ছোট DNA sequence-এ বসে সেই gene চালু বা বন্ধ করতে সাহায্য করে।

- যে sequence-এ এটা বসে, সেটাই **regulatory motif** (বা TF binding site)। সাধারণত এর দৈর্ঘ্য 6–20 base, আর এটা থাকে gene-এর **promoter** বা কোনো **enhancer**-এ।
- একটা TF সাধারণত সম্পর্কিত কাজে জড়িত **অনেকগুলো** gene নিয়ন্ত্রণ করে। তাই অনেকগুলো gene-এর upstream region-এ যদি একই motif থাকে, তাহলে সম্ভবত সেগুলো একসাথে নিয়ন্ত্রিত হয় এবং কাজের দিক থেকেও সম্পর্কিত।
- Motif-গুলো **degenerate**: TF কিছু substitution সহ্য করে নেয়, তাই প্রতিটা instance আদর্শ sequence থেকে একটু আলাদা হয়। ঠিক কোন কোন অক্ষর আছে তার ওপর binding কতটা শক্ত হবে তা নির্ভর করে, আর cell এভাবেই আংশিকভাবে gene expression কমবেশি করে।

{{ref:intro#gene-regulation-when-and-how-much}}

:::bio স্লাইডের দুটো গল্প
- **উদ্ভিদের circadian clock।** *Arabidopsis*-এ LHY, CCA1 আর TOC1 gene মিলে একটা negative feedback loop তৈরি করে, যা দিনে একবার করে দোলে। CCA1 বসে `AAAAAATCT` motif-এ। Steve Kay-এর দল (2000) প্রায় 500টা gene নিয়েছিল, যাদের expression প্রতিদিন চক্রাকারে ওঠানামা করে, আর তাদের upstream region-এ **evening element** `AAAATATCT` পেয়েছিল 46 বার। একটা test gene-এ ওই element-টা mutate করে দিলে circadian আচরণ নষ্ট হয়ে যায়: অর্থাৎ computation দিয়ে যা পাওয়া গিয়েছিল, ল্যাবে তা প্রমাণিত হয়।
- **মাছির immunity।** fruit fly সংক্রমিত হলে সে কিছু immunity gene চালু করে, যাদের upstream region-এ `TCGGGGATTTCC`-এর মতো 12-mer থাকে। এটা TF **NF-κB**-এর binding site।
:::

**FrequentWords আবার ব্যবহার করলেই তো হয়, তাই না?** ধরা যাক সব upstream region জোড়া লাগিয়ে k-mer গুনলেন। এতে এমন pattern পাওয়া যাবে যেগুলো *কোথাও না কোথাও* অনেকবার আছে, হয়তো সবগুলোই একটা region-এ। কিন্তু আমরা চাই এমন pattern, যা একটু-আধটু পরিবর্তনসহ **প্রতিটা sequence-এ** আছে। সঠিকভাবে বললে:

:::think সব upstream region জোড়া লাগিয়ে একটা string বানিয়ে FrequentWords চালানো ভুল পদ্ধতি কেন?
কারণ এতে সমস্যাটাই বদলে যায়। জীববিজ্ঞান বলছে motif-টা **প্রতিটা আলাদা sequence-এ মোটামুটি একবার করে** থাকে। জোড়া লাগানোর পর FrequentWords যেকোনো k-mer-কে পুরস্কার দেয় যা *কোথাও* ঘন ঘন আছে, যেমন একটা k-mer যা প্রথম sequence-এ তিনবার আছে কিন্তু বাকিগুলোতে একবারও নেই। ওটা একটা clump, পুরো সেটের সবার মধ্যে থাকা motif নয়। Model-কে তাই **প্রতি sequence-এ একটা occurrence** দাবি করতে হবে, আর নিচের (k, d)-motif-এর সংজ্ঞা ও motif matrix ঠিক সেটাই করে।
:::

**(k, d)-motif** হলো এমন একটা k-mer, যা একটা string collection-এর **প্রতিটা** string-এ **সর্বোচ্চ d mismatch** নিয়ে উপস্থিত।

**Implanted motif-এর উদাহরণ।** দশটা random 600-base string নিন, আর প্রতিটাতে `ATTTGGC`-এর একটা রূপ (সর্বোচ্চ 2টা random mutation সহ) বসিয়ে দিন। বসানো কপিগুলো হয়তো একবারও হুবহু `ATTTGGC` হবে না, আর দুটো কপি নিজেদের মধ্যে 4টা অক্ষর পর্যন্ত আলাদা হতে পারে। Motif খুঁজে পাওয়া মানে এই noise ভেদ করে আসল pattern-টা দেখতে পাওয়া।

{{ref:oric#approximate-matches-hamming-distance}}

## Brute force এবং median string

**Brute force (MotifEnumeration)।** Input-এর প্রতিটা k-mer-এর জন্য তার থেকে d mismatch-এর মধ্যে থাকা সব k-mer তৈরি করুন (এটাই তার d-neighbourhood), তারপর রাখুন শুধু সেগুলো, যেগুলো প্রতিটা string-এ ≤ d mismatch নিয়ে আছে। n দৈর্ঘ্যের t-টা string হলে খরচ মোটামুটি $O(t \cdot n^2 \cdot 4^k \cdot k)$। এটা k-এর সাপেক্ষে exponential; বাস্তবসম্মত motif দৈর্ঘ্যে এটা অচল।

**সমস্যাটাকে optimization হিসেবে নতুন করে ভাবা।** "সব জায়গায় d mismatch-এর মধ্যে আছে কি না" — এমন হ্যাঁ/না প্রশ্নের বদলে মাপুন একটা pattern সব string-এর সাথে *কতটা ভালোভাবে* মেলে।

- ধরা যাক $d(Pattern, Text)$ হলো Pattern আর Text-এর যেকোনো k-mer-এর মধ্যে **সবচেয়ে ছোট Hamming distance**। অর্থাৎ Pattern-টা Text-এ উপস্থিত থাকার কতটা কাছাকাছি আসে।
- উদাহরণ: Pattern = `AAA` আর Text = `TTACCTTAAC` হলে, Text-এর 3-mer-গুলোর মধ্যে `TAA` আর `AAC` আছে, দুটোই এক mismatch দূরে, আর কোনোটাই হুবহু মেলে না, তাই $d(\texttt{AAA}, Text) = 1$।
- সব string-এর ওপর যোগ করুন: $d(Pattern, Dna) = \sum_{i=1}^{t} d(Pattern, Dna_i)$। স্লাইডের উদাহরণে $d(\texttt{AAA}, Dna) = 1 + 1 + 2 + 0 + 1 = 5$।

**Median String Problem:** এমন k-mer Pattern খুঁজুন, যা $d(Pattern, Dna)$-কে সবচেয়ে ছোট করে।

**MedianString** সব $4^k$-টা pattern চেষ্টা করে প্রতিটার distance হিসাব করে, খরচ $O(4^k \cdot n \cdot k \cdot t)$। এটাও k-এর সাপেক্ষে exponential, তাই কেবল ছোট k-এর জন্য কাজের। তবে আরও গুরুত্বপূর্ণ কথা হলো, পাঠ্যবই দেখায় যে এটা একটা motif matrix-এর *score* সবচেয়ে ছোট করার সমস্যার **সমতুল্য** (পরের section)। এই দ্বিতীয় দৃষ্টিভঙ্গিটাই আমাদের দ্রুত heuristic বানাতে দেয়।

{{ref:math#distances-and-similarity|math#counting-how-big-is-the-search-space}}

## Count, profile, consensus এবং score

t-টা string-এর প্রতিটা থেকে একটা করে k-mer বেছে নিয়ে সেগুলো একটার নিচে একটা সাজান, পাবেন একটা $t \times k$ **motif matrix**। যেমন, t = 5 আর k = 5 হলে:

```text
A T C G T
G T C C A
C T A G T
C T C C T
C T C T G
```

এই matrix-এর চারটে সারাংশ কোর্সের বাকি অংশ জুড়ে বারবার আসবে:

- **Count(Motifs):** একটা 4 × k table, যেখানে লেখা থাকে প্রতিটা column-এ কোন nucleotide কতবার আছে। ওপরের column 2-এর সবই T, তাই Count(T, 2) = 5।
- **Profile(Motifs):** Count-কে t দিয়ে ভাগ করলে প্রতিটা column-এ প্রতিটা অক্ষরের frequency পাওয়া যায়। **প্রতিটা column-এর যোগফল 1**: অর্থাৎ প্রতিটা column হলো {A, C, G, T}-এর ওপর একটা probability distribution।
- **Consensus(Motifs):** প্রতিটা column-এর সবচেয়ে বেশিবার আসা অক্ষর। এটা input string-গুলোর কোনোটাতে না-ও থাকতে পারে। এটা "আদর্শ" motif সম্পর্কে আমাদের সবচেয়ে ভালো অনুমান।
- **Score(Motifs):** পুরো matrix-এ consensus-এর সাথে না মেলা অক্ষরের মোট সংখ্যা, যা $\sum_i \text{HammingDistance}(Motif_i, \text{Consensus})$-এর সমান। **যত কম, তত ভালো**: একটা নিখুঁত motif matrix (সব row হুবহু এক)-এর score 0।

**Profile অনুযায়ী একটা k-mer-এর probability।** Profile আসলে একটা ছোট generative model: একটা k-mer বানাতে column 1-এর distribution থেকে প্রথম অক্ষর টানুন, column 2-এর distribution থেকে দ্বিতীয়টা, এভাবে চলুক, প্রতিটা স্বাধীনভাবে। তাই একটা নির্দিষ্ট k-mer-এর probability হলো তার অক্ষরগুলোর column probability-গুলোর **গুণফল**:

$$\Pr(\text{Pattern} \mid \text{Profile}) = \prod_{j=1}^{k} \text{Profile}(Pattern_j,\ j)$$

একটা string-এর **profile-most-probable k-mer** হলো ওই string-এর সেই k-mer, যার এই probability সবচেয়ে বেশি। একটা profile দিয়ে sequence "scan" করা বলতে এটাই বোঝায়।

:::think একটা motif বোঝাতে consensus string-এর চেয়ে profile কেন ভালো?
Consensus প্রতিটা column থেকে শুধু বিজয়ী অক্ষরটা রাখে, বাকিগুলো ফেলে দেয়। কোনো column-এ 51% A আর 49% T থাকলে consensus বলবে "A", অথচ T-ও যে প্রায় সমান সম্ভাব্য, সেটা চাপা পড়ে যায়। Profile পুরো distribution-টাই রাখে (A 0.51, T 0.49), তাই ওই position-এ T এলে তাকে প্রায় A-এর সমান ভালো score দিতে পারে। আসল binding site-গুলো ঠিক এভাবেই ঝাপসা।
:::

{{ref:math#probability-basics|math#conditional-probability-and-independence}}

{{widget:profile preset="mid"}}

:::example ওপরের matrix-এর profile আর most-probable k-mer
`ATCGT, GTCCA, CTAGT, CTCCT, CTCTG` motif-গুলো থেকে এই profile পাওয়া যায় (column 1–5):

| | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| A | .2 | 0 | .2 | 0 | .2 |
| C | .6 | 0 | .8 | .4 | 0 |
| G | .2 | 0 | 0 | .4 | .2 |
| T | 0 | 1 | 0 | .2 | .6 |

**Consensus:** `CTC?T`, column 4-এ C আর G-এর মধ্যে টাই (CTCCT অথবা CTCGT)। **Score:** 8।

**`ACCTGTTTAT`-এর সবচেয়ে সম্ভাব্য 5-mer:** এই string-এ ছয়টা 5-mer আছে, আর **প্রতিটার probability 0**: প্রত্যেকটায় এমন একটা অক্ষর আছে, যার ওই column-এর profile entry 0। যেমন `CTGTT`-এর column 3-এ G দরকার, অথচ profile বলছে সেটা কখনো ঘটে না। পাঠ্যবইয়ের টাই-ভাঙার নিয়মে প্রথম 5-mer `ACCTG` ফেরত আসে, কিন্তু আসল শিক্ষাটা হলো **zero থাকলে তুলনাটাই অর্থহীন হয়ে যায়**। একটা মাত্র অদেখা অক্ষর এমন একটা k-mer-কে বাতিল করে দেয়, যা বাকি সব দিক থেকে ভালোভাবে মেলে।

**Laplace pseudocount দিলে** (প্রতিটা count-এ 1 যোগ করুন, তাতে প্রতিটা column-এর count-এর যোগফল হয় 5 + 4 = 9) বিজয়ী হয় **`CTGTT`**, যার probability $(4 \cdot 6 \cdot 1 \cdot 2 \cdot 4)/9^5 \approx 0.00325$। Pseudocount নিচের Greedy section-এ ব্যাখ্যা করা হয়েছে।
:::

## Entropy এবং information content

Score প্রতিটা mismatch-কে সমান ধরে। কিন্তু (A, A, A, A, C) অক্ষরের একটা column স্পষ্টতই (A, C, G, T, A)-এর চেয়ে বেশি conserved, আর আসল motif-এর কিছু column binding-এর জন্য অন্যগুলোর চেয়ে অনেক বেশি গুরুত্বপূর্ণ। **Entropy** মাপে একটা column কতটা অনিশ্চিত:

$$H(p_1,\dots,p_N) = -\sum_i p_i \log_2 p_i \qquad (\text{using } 0 \log 0 = 0)$$

- একটা uniform column (প্রতিটা ¼)-এর H = 2 bit: কোন অক্ষর আসবে সে সম্পর্কে কোনো তথ্যই নেই।
- পুরোপুরি conserved column (সব একই অক্ষর)-এর H = 0।
- স্লাইডের উদাহরণ: (0.2, 0.6, 0, 0.2) → 1.371 bit; (0, 0.6, 0, 0.4) → 0.971 bit; (0, 0, 0.9, 0.1) → 0.469 bit (স্লাইডে এটাকে রাউন্ড করে 0.467 লেখা)।

একটা **motif matrix-এর entropy** হলো তার column entropy-গুলোর যোগফল; যত কম, motif তত বেশি conserved। একটা column-এর **information content** হলো $2 - H$ bit। **Sequence logo**-তে (motif দেখানোর প্রচলিত ছবি) প্রতিটা অক্ষরের স্তূপের উচ্চতা এটাই, আর যেখানে স্তূপ উঁচু, সেই position-গুলোই সবচেয়ে গুরুত্বপূর্ণ।

**মনে রাখার সহজ নিয়ম: entropy কম = information content বেশি = বেশি conserved।**

:::example একটা motif set-এর score, profile, entropy আর একটা k-mer-এর probability
Motif (t = 5, k = 4): `ACGT, ACCT, AGGT, ATAC, ACGG`।

**Count আর consensus।**

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| A | 4 | 0 | 1 | 0 |
| C | 0 | 3 | 1 | 1 |
| G | 0 | 1 | 3 | 1 |
| T | 0 | 1 | 0 | 3 |

সবচেয়ে বেশি আসা অক্ষরগুলো মিলে হয় **ACGT**। **Score** = ACGT থেকে distance-গুলো: 0 + 1 + 1 + 2 + 1 = **5**।

**Profile** (5 দিয়ে ভাগ করে): column 1 হলো (A .8, C 0, G 0, T 0), column 2 হলো (0, .6, .2, .2), column 3 হলো (.2, .2, .6, 0), column 4 হলো (0, .2, .2, .6)।

**Pseudocount সহ entropy** (প্রতিটা count-এ 1 যোগ, তাই প্রতিটা column-এর যোগফল 9): column 1 হয় (5, 1, 1, 1)/9, যার H ≈ 1.549 bit; column 2–4 প্রতিটাই (1, 4, 2, 2)/9-এর কোনো না কোনো বিন্যাস, যার H ≈ 1.837 bit। মোট ≈ **7.06 bit**। একটা নিখুঁতভাবে conserved 4-column motif-এর মান হতো 0, আর পুরোপুরি random একটার 8।

**সাধারণ profile অনুযায়ী ACCC-এর probability:** 0.8 × 0.6 × 0.2 × 0.2 = **0.0192**। তুলনা করুন consensus ACGT-এর সাথে: 0.8 × 0.6 × 0.6 × 0.6 ≈ 0.173, যা সম্ভাব্য সর্বোচ্চ।
:::

{{ref:math#entropy|math#logarithms-likelihood-and-log-odds}}

{{widget:entropy}}

## GreedyMotifSearch এবং pseudocount

এবার প্রথম ব্যবহারযোগ্য algorithm। মূল ভাবনা: প্রথম string থেকে একটা k-mer বেছে নিন, তারপর একটা একটা করে string নিয়ে motif matrix গড়ে তুলুন, প্রতিবার সেই k-mer বেছে নিয়ে যা এখন পর্যন্ত বাছা motif-গুলোর সাথে সবচেয়ে ভালো মেলে।

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

**ধাপে ধাপে দেখা যাক।** বাইরের loop-টা Dna₁-এর প্রতিটা সম্ভাব্য শুরুর k-mer চেষ্টা করে। সেই বাছাই ঠিক হলে, Dna₂-এর motif হয় তার সাথে সবচেয়ে মিল থাকা k-mer (একটা মাত্র k-mer থেকে বানানো profile তার নিজের অক্ষরগুলোকে probability 1 দেয়, বাকিদের 0)। Dna₃-এর motif হলো প্রথম দুটোর profile অনুযায়ী সবচেয়ে সম্ভাব্য k-mer, এভাবে চলতে থাকে। t-টা string শেষ হলে motif set-টার score হিসাব হয়, আর সব শুরুর k-mer-এর মধ্যে যে set সবচেয়ে ভালো, সেটাই জেতে।

**খরচ:** মোটামুটি $O(n^2 \cdot k \cdot t)$, polynomial এবং দ্রুত। কিন্তু এটা **greedy**: Motif₁ আর শুরুর দিকের motif-গুলো একবার বাছা হয়ে গেলে আর কখনো সেগুলো নিয়ে পুনর্বিবেচনা হয় না।

{{ref:algo#greedy-algorithms}}

**বড় দুর্বলতা: zero probability।** Loop-এর শুরুর দিকে profile বানানো হয় মাত্র কয়েকটা motif থেকে, তাই অনেক entry 0 থাকে। যে k-mer-এ এমন একটা অক্ষরও আছে যা ওই column-এ আগে দেখা যায়নি, সেটার probability হয়ে যায় 0, যদিও বাকি সব জায়গায় সেটা নিখুঁতভাবে মেলে। স্লাইডের উদাহরণে (একটা implanted (4,1)-motif `ACGT`) এই কারণেই সাধারণ greedy ব্যর্থ হয়।

**Laplace's Rule of Succession (pseudocount)।** Normalize করার আগে Count matrix-এর প্রতিটা ঘরে 1 যোগ করুন। তাতে "কখনো দেখা যায়নি" মানে আর "অসম্ভব" থাকে না, হয়ে যায় "বিরল"।

:::story অতি-আত্মবিশ্বাসী গোয়েন্দা
একজন সন্দেহভাজন পরে নীল টুপি, লাল শার্ট, লাল জ্যাকেট আর নীল প্যান্ট, তবে মাঝেমধ্যে একটা কিছু বদলে ফেলে।

- **অতি-আত্মবিশ্বাসী গোয়েন্দা** (pseudocount ছাড়া) একজন সাক্ষীর বিবরণ পেয়েই profile লিখে ফেলেন: "সন্দেহভাজন 100% নিশ্চিতভাবে ঠিক এই পোশাকই পরে।" পরের বিবরণে একই পোশাকের একজনের কথা আছে, শুধু শার্টটা **সবুজ**। Profile বলছে সবুজ শার্টের probability 0, তাই গোয়েন্দা বিবরণটা ফেলে দেন, আর আসল সন্দেহভাজন হাতছাড়া হয়ে যায়।
- **বিবেচক গোয়েন্দা** (pseudocount সহ) লেখেন: "খুব সম্ভবত এই পোশাক, তবে অন্য রংও হতে পারে।" সবুজ শার্টের বিবরণটা "অসম্ভাব্য, কিন্তু অসম্ভব নয়", তাই সেটা ফাইলে থেকে যায়।

সাধারণ greedy search হলো সেই অতি-আত্মবিশ্বাসী গোয়েন্দা: এক-দুটো motif থেকে বানানো তার profile zero-তে ভরা, আর একটা মাত্র অদেখা অক্ষর বাকি সব দিক থেকে নিখুঁত একটা match-কে বাতিল করে দেয়।
:::

**উদাহরণ।** একটা column-এর count যদি হয় A:2, C:1, G:1, T:0, তাহলে সেটা হয়ে যায় 8-এর মধ্যে 3, 2, 2, 1, অর্থাৎ Pr(A) = **3/8**, Pr(C) = Pr(G) = **2/8 = 0.25**, Pr(T) = 1/8। T এখন অসম্ভাব্য, কিন্তু সম্ভব।

Pseudocount সহ greedy পুনরুদ্ধার করে `ACCT, ATGT, ACGG, ACGA, AGGT` motif-গুলো, যাদের consensus **ACGT**। নিচে ধাপে ধাপে চালিয়ে দেখুন।

{{widget:motif-search}}

## RandomizedMotifSearch (Monte Carlo)

Greedy তার প্রথম বাছাইগুলোতে আটকে যায়। ভিন্ন একটা কৌশল হলো একটা *random* অনুমান দিয়ে শুরু করে সেটাকে ক্রমে উন্নত করা।

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

প্রতিটা iteration-এ দুটো সহজ ধাপ:
1. **Motifs → Profile:** বর্তমান motif-গুলোর সারাংশ বানান।
2. **Profile → Motifs:** প্রতিটা string-এ সেই k-mer বেছে নিন, যা profile-এর সাথে সবচেয়ে ভালো মেলে।

যতক্ষণ score উন্নত হচ্ছে, ততক্ষণ পুনরাবৃত্তি করুন। এই পালাক্রমে চলা গঠনটা হুবহু k-means clustering (center → cluster → center) আর EM algorithm-এর মতো, যেগুলো আপনি Gene Expression ও HMM lesson-এ দেখবেন।

{{ref:algo#iterative-optimization-the-em-pattern}}

**Random শুরু থেকে কাজ হয় কীভাবে?** Random motif-গুলোর মধ্যেও কাকতালীয়ভাবে প্রতিটা column-এ implanted motif-এর কয়েকটা অক্ষর থাকে। এতে profile সামান্য হলেও আসল motif-এর দিকে হেলে পড়ে, ফলে পরের ধাপে আসল motif-এর instance-গুলো একটু ভালো score পায় এবং তাদের কয়েকটা বাছাই হয়। তখন profile আরও জোরালোভাবে হেলে যায়, আর motif-গুলো যেন "টেনে আনা" হয়। তবে সবসময় এমন ঘটে না।

**Local optimum এবং বারবার নতুন করে শুরু।** একবারের run প্রায়ই একটা দুর্বল **local optimum**-এ গিয়ে থামে: কোনো একক ধাপে আর উন্নতি হয় না, কিন্তু সেটা সেরা উত্তরও নয়। তাই আমরা আলাদা আলাদা random শুরু থেকে RandomizedMotifSearch **হাজার হাজার বার** চালাই, আর সেরা ফলাফলটা রাখি। এ কারণেই এটা একটা **Monte Carlo** algorithm: দ্রুত, সঠিকতার কোনো নিশ্চয়তা নেই, কিন্তু যথেষ্ট বার চালালে ভালো উত্তর পাওয়ার সম্ভাবনা খুব বেশি।

{{ref:algo#randomized-algorithms}}

## Gibbs sampling

RandomizedMotifSearch এক ধাপে **সব t-টা** motif বদলে ফেলতে পারে। এটা বেপরোয়া: এখন পর্যন্ত পাওয়া সঠিক motif-গুলো এক চালেই ফেলে দেওয়া হতে পারে। **GibbsSampler** বেশি সাবধানী: এটা প্রতি iteration-এ **একটা** motif বদলায়, আর সেটা greedy-ভাবে নয়, **random**-ভাবে বাছে।

Gibbs sampling যদি আপনার কাছে নতুন হয়, তাহলে একটা genomics কোর্সের এই lecture-টা বিশেষভাবে motif finding-এর জন্যই এটা পরিচয় করিয়ে দেয়। Pseudocode-এর আগে এটা দেখে নিন।

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

**প্রতিটা iteration, ধাপে ধাপে:**
1. Random-ভাবে একটা string i বেছে নিয়ে তার motif-টা সরিয়ে দিন।
2. বাকি t − 1টা motif থেকে (pseudocount সহ) একটা profile বানান।
3. Dnaᵢ-এর **প্রতিটা** k-mer-এর জন্য $\Pr(\text{k-mer}\mid\text{Profile})$ হিসাব করুন: এমন k-mer আছে n − k + 1টা।
4. এই probability-গুলোকে তাদের যোগফল দিয়ে ভাগ করে **normalize** করুন, তারপর **সেই পক্ষপাতদুষ্ট ছক্কাটা চালুন**, আর তা দিয়ে নতুন Motifᵢ বাছুন।

যে k-mer বেশি ভালো মেলে, তার বাছাই হওয়ার সম্ভাবনা বেশি, তবে নিশ্চিত নয়। এই randomness-টাই আসল কথা: মাঝেমধ্যে sampler একটু খারাপ k-mer-ও মেনে নেয়, আর সেটাই তাকে এমন **local optimum থেকে বেরিয়ে আসতে** দেয়, যেখানে greedy ধাপ আটকে যেত।

:::story সবচেয়ে নিচু উপত্যকা খুঁজছে পর্বতারোহীরা
প্রতিটা সম্ভাব্য motif set-কে একটা ভূপ্রকৃতির একেকটা বিন্দু হিসেবে ভাবুন, যেখানে উচ্চতা হলো score (যত নিচু, তত ভালো)।
- **Greedy আর RandomizedMotifSearch** সবসময় যেখানে দাঁড়িয়ে আছে সেখান থেকে ঢাল বেয়ে নিচে নামে। একটা ছোট উপত্যকায় শুরু করলে তার তলায় পৌঁছে থেমে যাবেন, পাশেই যে অনেক গভীর গিরিখাত আছে তা কখনো দেখবেন না (এটাই **local optimum**)।
- **বহুবার নতুন করে শুরু করা** মানে যেন এক হাজার পর্বতারোহীকে random জায়গায় নামিয়ে দেওয়া: তাদের কেউ না কেউ সম্ভবত সেই গভীর গিরিখাতের ঢালেই শুরু করবে।
- **Gibbs sampling** এমন একজন পর্বতারোহী, যে *সাধারণত* নিচের দিকে পা ফেলে, কিন্তু যেহেতু প্রতিটা পদক্ষেপ একটা ওজন-দেওয়া ছক্কা চেলে ঠিক হয়, তাই *মাঝেমধ্যে* ওপরের দিকেও পা ফেলে। ওই মাঝেমধ্যের "খারাপ" পদক্ষেপটাই তাকে অগভীর উপত্যকা থেকে উঠে এসে খোঁজ চালিয়ে যেতে দেয়।
:::

{{ref:math#expected-value-and-sampling-from-a-distribution}}

:::example k-mer probability-গুলোর যোগফল কেন 1 হয় না
$\Pr(\text{k-mer} \mid \text{Profile})$ হলো **সম্ভাব্য সব $4^k$-টা k-mer**-এর ওপর একটা distribution। সরিয়ে রাখা string-টায় তাদের মধ্যে মাত্র n − k + 1টা আছে, তাই এদের probability-র যোগফল দাঁড়ায় কোনো একটা C < 1 (স্লাইডের উদাহরণে 80/8⁴)। *এই* k-mer-গুলোর মধ্যে থেকে বাছতে হলে প্রতিটাকে C দিয়ে ভাগ করুন। এবার এদের যোগফল 1, অর্থাৎ একটা সঠিক distribution, যাকে স্লাইডে দেখানো হয়েছে সাতটা k-mer-ওয়ালা একটা string-এর জন্য একটা "সাত-পার্শ্বের ছক্কা" চালানো হিসেবে।
:::

:::example Nucleotide composition একপেশে হলে কী সমস্যা হয়
ধরা যাক upstream region-গুলো AT-rich। তাহলে random শুরুর motif থেকে বানানো profile-গুলোতে A আর T-এরই আধিপত্য থাকবে। `AAAAAAAA`-এর মতো low-complexity k-mer প্রতিটা string-এ উঁচু probability পাবে, ফলে randomized আর Gibbs search প্রায়ই এমন **ভুয়া motif-এ গিয়ে থামে, যা আসলে শুধু background composition-কেই প্রতিফলিত করে**, আর GC-যুক্ত আসল motif খুব কমই sample হয়।

**প্রতিকার:** k-mer-কে একটা **background model**-এর বিপরীতে score করুন (কাঁচা probability-র বদলে profile probability বনাম background probability-র log-odds, বা relative entropy ব্যবহার করুন), **background-corrected pseudocount** ব্যবহার করুন, low-complexity আর repeat region mask করুন, আর অনেকবার restart করুন।
:::

এই দ্বিতীয় video-টা Gibbs sampling-কে একটা সাধারণ Markov chain Monte Carlo পদ্ধতি হিসেবে ব্যাখ্যা করে; statistics-এর দিক থেকে গভীরভাবে বুঝতে চাইলে কাজে লাগবে:

{{video:7LB1VHp4tLE}}

**আরও কিছু বাস্তব সমস্যা** (স্লাইড: "What is the value of k?"): k আন্দাজ করতে হয়, অথবা কয়েকটা মান চেষ্টা করে দেখতে হয়; কিছু sequence-এ হয়তো motif-টা একেবারেই নেই; একাধিক motif থাকতে পারে, বা এক sequence-এ একাধিক কপি; আর দুটো strand-ই খুঁজতে হয় (reverse complement)। **MEME**-এর মতো আসল tool (যা expectation-maximization ব্যবহার করে) এই পরিস্থিতিগুলো সামলায় এমন statistical model দিয়ে, যা আপনি এখানে যা বানালেন তার খুব কাছের আত্মীয়।

:::think Motif-এর দৈর্ঘ্য জানা না থাকলে k কীভাবে ঠিক করবেন?
কোনো সূত্র নেই; k হলো একটা input যা আপনাকেই বাছতে হয়, আর বাছাইটা একটা trade-off।
- **ছোট k (6–8):** ছোট pattern কাকতালীয়ভাবেই সারাক্ষণ চোখে পড়ে, তাই false positive-এর ঝুঁকি থাকে (specificity কম)।
- **বড় k (15–20):** একটা conserved 20-mer কাকতালীয়ভাবে পাওয়া খুবই অসম্ভাব্য, তাই hit পেলে সেটা বিশ্বাসযোগ্য; কিন্তু আসল motif যদি ছোট বা খুব ঝাপসা হয়, তাহলে লম্বা k বেশি অনমনীয়, সেটা ধরতে পারে না (sensitivity কম)।

বাস্তবে আপনি k-এর একটা পরিসর জুড়ে search চালান, আর সেই দৈর্ঘ্যটা রাখেন যার motif statistically সবচেয়ে significant এবং জৈবিকভাবে অর্থবহ (যেমন, কোনো পরিচিত TF family-র সাথে মেলে)।
:::

:::think Randomized motif search আর Gibbs sampling কেন বহুবার চালাতে হয়?
একবারের run নির্ভর করে ভাগ্যক্রমে ভালো একটা শুরুর ওপর, আর পথে নেওয়া random বাছাইগুলোর ওপর, আর সেটা কোনো local optimum-এ গিয়ে থামতে পারে। প্রতিটা restart আসল motif-এর কাছাকাছি থেকে শুরু করার একটা স্বাধীন সুযোগ। যথেষ্ট restart দিলে **অন্তত একটা** run আসল motif খুঁজে পাওয়ার সম্ভাবনা বেশি হয়ে যায়, আর সব run-এর মধ্যে সবচেয়ে ভালো score-ওয়ালা ফলাফলটা আমরা রাখি।
:::

{{game:motif-hunter}}

## Algorithm-গুলোর তুলনা

| Algorithm | কৌশল | নিশ্চয়তা | খরচ |
|---|---|---|---|
| MotifEnumeration | d-neighbour-দের ওপর brute force | হুবহু (k, d)-motif | k-এর সাপেক্ষে exponential |
| MedianString | সব 4ᵏ pattern চেষ্টা করা | optimal median string | $O(4^k n k t)$ |
| GreedyMotifSearch | একটা একটা string নিয়ে motif গড়া | নেই (খারাপ বাছাইয়ে আটকে যেতে পারে) | $O(n^2 k t)$ |
| RandomizedMotifSearch | উন্নতি থামা পর্যন্ত profile ↔ motif | নেই; অনেক restart লাগে | প্রতি run-এ দ্রুত |
| GibbsSampler | একবারে একটা motif random-ভাবে resample | নেই; local optimum থেকে ভালোভাবে বের হয় | প্রতি iteration-এ দ্রুত |

:::story Motif খোঁজার চারটে উপায়
| Algorithm | কল্পনা করুন… | শক্তি | দুর্বলতা |
|---|---|---|---|
| MotifEnumeration | মহাবিশ্বের প্রতিটা string যাচাই করা | সবসময় সঠিক | অকল্পনীয় রকমের ধীর |
| MedianString | সব 4ᵏ pattern-এর ওপর একটু বুদ্ধিমান brute force | ছোট k-এর জন্য ঠিক আছে | তবুও k-এর সাপেক্ষে exponential |
| GreedyMotifSearch | এক অদূরদর্শী পর্বতারোহী, যে কখনো পেছনে তাকায় না | খুব দ্রুত | শুরুর ভুলে আটকে যায় |
| Randomized / Gibbs | এক হাজার পর্বতারোহী; Gibbs-এর জন ওপরেও পা ফেলতে পারে | বাস্তবে ভালো কাজ করে | নিশ্চয়তা নেই; অনেকবার চালাতে হয় |
:::

**যে তথ্যগুলো নিশ্চিতভাবে জেনে রাখা ভালো:**
- Gibbs sampling সবসময় একই উত্তরে পৌঁছায় **না**: এটা random শুরু আর পথের random বাছাইগুলোর ওপর নির্ভর করে (একটা run পুনরায় হুবহু পেতে চাইলে seed স্থির করে দিন)।
- Gibbs **প্রতি iteration-এ একটা motif update করে**। Randomness ঢোকে শুরুর motif-গুলোতে এবং প্রতিটা resampling ধাপে।
- কোনো randomized পদ্ধতিই global optimum-এর নিশ্চয়তা দেয় না।
- Pseudocount **zero probability আটকায়**।
- Consensus k-mer প্রতিটা column-এর সবচেয়ে বড় entry নেয়, তাই profile অনুযায়ী তার probability (column-গুলোর সর্বোচ্চ মানের গুণফল) **সম্ভাব্য সর্বোচ্চ**। Pseudocount থাকুক বা না থাকুক, এটা সত্য, কারণ সব জায়গায় +1 যোগ করলেও প্রতিটা column-এর ক্রম একই থাকে। অন্য k-mer এর সমান হতে পারে। Consensus-কে কোনো input string-এ থাকতেই হবে, এমন **নয়**।

একই chapter-এর একটা বাংলা walkthrough চাইলে, recap হিসেবে এই video-টা বেশ ভালো:

{{video:7hIHZF3l7-w}}
