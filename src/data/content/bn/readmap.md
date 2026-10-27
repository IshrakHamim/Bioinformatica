**সমস্যা:** একজন মানুষের DNA থেকে sequencer আমাদের শত শত কোটি ছোট read দিয়েছে, আর ওই প্রজাতির একটা **reference genome** আমাদের হাতে আগে থেকেই আছে। প্রতিটা read-এর জন্য বের করতে হবে, reference-এর ঠিক কোন জায়গা থেকে এটা এসেছে। একেই বলে **read mapping** (বা read alignment)। Read-গুলো জায়গামতো বসানো হয়ে গেলে read আর reference-এর মধ্যে যে পার্থক্যগুলো দেখা যায়, সেগুলো হয় sequencing error, নয়তো আসল **variant**; এই দুটোকে আলাদা করার কাজটাই variant calling। এই lesson-এর slide-গুলো Ben Langmead-এর *Algorithms for DNA Sequencing* course থেকে নেওয়া, আর Boyer-Moore অংশটা Gusfield-এর Chapter 2 অনুসরণ করে।

**শুধু assemble করলেই তো হয়, তাই না?** Assembly (আগের lesson-গুলো) একদম শূন্য থেকে genome বানায়, আর সেটা কঠিন কাজ। যদি একটা ভালো reference আগে থেকেই থাকে (আর দুজন মানুষের DNA প্রায় 99.9% একই), তাহলে **প্রতিটা read-কে reference-এর সাথে মিলিয়ে দেখা** অনেক সহজ। এতে সমস্যাটা হয়ে দাঁড়ায় **string matching**: বিশাল একটা text T (genome, দৈর্ঘ্য n)-এর ভেতরে ছোট একটা pattern P (read, দৈর্ঘ্য m) কোথায় কোথায় আছে, তা খুঁজে বের করা।

:::story হাজার খণ্ডের বিশ্বকোষে একটা বাক্য
ধরুন আপনার হাতে এলোমেলোভাবে একটা বাক্য দেওয়া হলো, আর বলতে হবে 1,000 খণ্ডের একটা বিশ্বকোষের ঠিক কোন খণ্ডের কোন পাতার কোন লাইন থেকে এটা এসেছে। বাক্যটা হলো একটা **read** (pattern P); বিশ্বকোষটা হলো **reference genome** (text T, 3 billion অক্ষর)। এবার কাজটা করুন **একশো কোটি** বাক্যের জন্য, যার কিছুতে আবার বানান ভুলও আছে।

Computer science কীভাবে এটা সম্ভব করল, এই lesson সেই গল্পটা চার অঙ্কে বলে:
1. **Naive search:** বাক্যটাকে প্রতিটা লাইনের ওপর দিয়ে সরিয়ে সরিয়ে মেলানো। ঠিক উত্তর দেয়, কিন্তু হতাশাজনকভাবে ধীর।
2. **Boyer-Moore:** এখনো সরিয়ে সরিয়েই মেলানো, তবে প্রতিটা অমিল থেকে কিছু শিখে যেসব জায়গায় মিল হওয়া সম্ভবই নয়, সেগুলো **লাফিয়ে** পার হয়ে যাওয়া।
3. **Index:** সরানো বন্ধ। বইয়ের শেষে যেমন index থাকে, তেমন একটা index বানানোর ধীর কাজটা একবার করে ফেলুন, তারপর প্রতিটা বাক্য প্রায় সঙ্গে সঙ্গে খুঁজে নিন।
4. **Pigeonhole:** বানান ভুল সামলাতে বাক্যের *টুকরোগুলো* হুবহু খুঁজুন, তারপর যেখানে কোনো টুকরো মিলেছে শুধু সেখানেই পুরো বাক্যটা যাচাই করুন।

পুরো lesson জুড়ে মূল সুর একটাই: **যে কাজটা শত কোটিবার করতে হবে, সেটাকে সস্তা করতে আগে একবার preprocessing-এর খরচটা দিয়ে দিন।**
:::

## Naive exact matching

সবচেয়ে সরল পদ্ধতি: T-এর ভেতরে P-এর প্রতিটা সম্ভাব্য শুরুর অবস্থান (**alignment**) চেষ্টা করুন, আর অক্ষর ধরে ধরে মেলাতে থাকুন যতক্ষণ না কোনোটা অমিল হয়।

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

**কতটা কাজ লাগে?**
- কতগুলো alignment চেষ্টা করা হয়, সেটা সবসময় $n - m + 1$।
- প্রতিটা alignment-এ কমপক্ষে 1টা আর সর্বোচ্চ mটা অক্ষর তুলনা হয়। তাই মোট character comparison $n - m + 1$ (প্রতিটা alignment প্রথম অক্ষরেই ব্যর্থ) থেকে $m(n - m + 1)$ পর্যন্ত হতে পারে (যেমন T = `AAAAAAAA…`-এর ভেতরে P = `AAAA` খুঁজলে প্রায় প্রতিটা alignment অনেক দূর পর্যন্ত মিলে যায়)। Worst case হলো $O(nm)$।

3 billion base-এর genome-এর বিপরীতে একটা 100-base read-এর জন্য এটা প্রায় 3 × 10⁹টা alignment। একশো কোটি read-এর জন্য এটা একেবারেই অচল। সামনে এগোনোর দুটো পথ:
1. **আরও বুদ্ধি করে scan করা:** যেসব alignment মিলতেই পারে না, সেগুলো বাদ দেওয়া (Boyer-Moore)।
2. **Genome-টা একবার preprocess করে রাখা**, যাতে প্রতিটা read দ্রুত খুঁজে পাওয়া যায় (index)।

{{ref:algo#big-o-what-scales-to-a-genome}}

## Boyer-Moore: অমিল থেকে শিখে alignment বাদ দেওয়া

এই video-টা পরিষ্কার ছবি দিয়ে Boyer-Moore-এর দুটো নিয়মের পরিচয় দেয়। আগে এটা দেখুন; নিচের লেখা তারপর নিয়মগুলোকে নিখুঁতভাবে বলবে।

{{video:4Xyhb72LCX4}}

**মূল ধারণা।** আগের মতোই alignment-গুলো **বাঁ থেকে ডানে** চেষ্টা করুন, কিন্তু প্রতিটা alignment-এর ভেতরে অক্ষরগুলো তুলনা করুন **ডান থেকে বাঁয়ে**। অমিল হলে text সম্পর্কে এইমাত্র যা জানলেন, সেটা কাজে লাগিয়ে **যেসব alignment কোনোভাবেই মিলতে পারে না, সেগুলো লাফিয়ে পার হন**।

### Bad character rule

P[i] যদি text-এর অক্ষর c-এর সাথে না মেলে, তাহলে P-কে ডানে সরাতে থাকুন যতক্ষণ না
- **(a)** অমিলটা মিলে যায়: অর্থাৎ **P-তে position i-এর বাঁ দিকে c-এর সবচেয়ে ডানের occurrence**-টা c-এর ঠিক নিচে এসে বসে, অথবা
- **(b)** c যদি P[0..i−1]-এ একেবারেই না থাকে, তাহলে P পুরোপুরি c-কে পেরিয়ে যায়।

$$\text{shift}_{bc} = i - (\text{rightmost index } j < i \text{ with } P[j] = c), \quad \text{or } i+1 \text{ if there is none}$$

**হাতে-কলমে উদাহরণ** (Langmead-এর slide থেকে): P = `CCTTTTGC`, T = `GCTTCTGCTACCTTTTGCGCGCGCGCGGAA`।

1. **Offset 0।** ডান দিক থেকে তুলনা: C=C, G=G, T=T, তারপর P[4] = T বনাম T[4] = **C**: অমিল। P-তে position 4-এর বাঁয়ে সবচেয়ে ডানের C হলো P[1], তাই 4 − 1 = **3** ঘর সরান (case a)।
2. **Offset 3।** P[7] = C মিলল, তারপর P[6] = G বনাম T[9] = **A**: অমিল। P-তে কোনো A-ই নেই, তাই 6 + 1 = **7** ঘর সরিয়ে P-কে A-এর ওপারে নিয়ে যান (case b)।
3. **Offset 10।** 8টা অক্ষরই মিলে গেল: offset 10-এ একটা occurrence।

এখানে পৌঁছাতে naive matching-কে 11টা alignment চেষ্টা করতে হতো; Boyer-Moore করেছে মাত্র 3টা।

### Good suffix rule

ধরুন t হলো **P-এর সেই suffix যেটা অমিলের আগেই মিলে গিয়েছিল**। P-কে সরাতে থাকুন যতক্ষণ না
- **(a)** P-এর ভেতরে t-এর আরেকটা occurrence text-এর t-এর ঠিক নিচে আসে (এমন occurrence-কে অগ্রাধিকার দিন যার ঠিক আগের অক্ষরটা এইমাত্র অমিল হওয়া অক্ষর থেকে আলাদা, কারণ একই অক্ষর হলে আবার অমিল হবে),
- **(b)** P-এর একটা **prefix** t-এর একটা suffix-এর সাথে মিলে যায়, অথবা
- **(c)** P পুরোপুরি t-কে পেরিয়ে যায়।

সহজ যুক্তি: আমরা জানি text-এর ওই জায়গায় লেখা আছে t, তাই কাজের যেকোনো alignment-এ ওই জায়গায় t-এর সাথে মেলে এমন কিছু (বা t-এর শেষাংশ) বসাতেই হবে।

### দুটো নিয়ম একসাথে

প্রতিটা অমিলে দুটো shift-ই হিসাব করুন আর **বড়টা** নিন (কখনো 1-এর কম নয়)। দুটো নিয়মই নিরাপদ: যে alignment মিলতে পারত, এরা কখনো সেটা বাদ দেয় না। পুরোপুরি মিলে গেলে এমনভাবে সরান যাতে P-এর সবচেয়ে লম্বা proper prefix, যেটা P-এর suffix-ও বটে, সেটা জায়গামতো বসে।

Lecture-এর উদাহরণে (P = `GTAGCGGCG`, T = `GTTATAGCTGATCGCGGCGTAGCGGCGAA`) চেষ্টা করা alignment-গুলো হলো offset 0, 7, 10 আর 18: **15টা alignment বাদ পড়েছে**, আর T-এর 11টা অক্ষর একবারও দেখাই হয়নি।

{{widget:boyer-moore preset="mid"}}

{{game:shift-sprint}}

:::example Boyer-Moore-এর পূর্ণ trace: T = TACGACGTACGTAGACGTACG, P = ACGTAC
| # | offset | তুলনা (ডান→বাঁ) | অমিল | bad char | good suffix | shift |
|---|---|---|---|---|---|---|
| 1 | 0 | C✓ A✓ T✗ | P[3]=T vs T[3]=G | 3-এর বাঁয়ে সবচেয়ে ডানের G হলো P[2] → **1** | মিলে যাওয়া "AC" আবার আছে P[0..1]-এ → **4** | **4** |
| 2 | 4 | 6টাই মিলেছে | নেই: occurrence **4**-এ | প্রযোজ্য নয় | মিলের পরে: "AC" একই সাথে prefix ও suffix → **4** | **4** |
| 3 | 8 | C✗ | P[5]=C vs T[13]=G | G আছে P[2]-এ → **3** | কিছুই মেলেনি → 0 | **3** |
| 4 | 11 | C✗ | P[5]=C vs T[16]=G | **3** | 0 | **3** |
| 5 | 14 | 6টাই মিলেছে | নেই: occurrence **14**-এ | প্রযোজ্য নয় | **4** | 4 → offset 18 > 15, থামুন |

Boyer-Moore: **5টা alignment, 17টা character comparison**। Naive: **16টা alignment, 35টা comparison** (প্রথম অমিলেই থেমে)। Boyer-Moore 16টার মধ্যে 11টা alignment (প্রায় 69%) আর প্রায় অর্ধেক comparison বাদ দিয়েছে। দুটো পদ্ধতিই offset 4 আর 14-এ (0-based) মিল খুঁজে পায়।
:::

**খরচ।** P-কে preprocess করতে bad-character table-এর জন্য লাগে O(m·|Σ|) (প্রতিটা position আর প্রতিটা অক্ষরের জন্য: বাঁ দিকে সবচেয়ে ডানের occurrence কোথায়?), আর good-suffix table-এর জন্য O(m) (Z-algorithm ব্যবহার করে)। বাস্তবে matching প্রায়ই **sublinear** হয়: T-এর অনেক অক্ষর একবার দেখাও হয় না। **Pattern যত লম্বা, লাফ তত বড়।** GNU `grep`-এর মতো tool Boyer-Moore দিয়েই চলে।

দ্বিতীয় এই video-টা slide-এর ঠিক একই উদাহরণে দুটো নিয়ম একসাথে প্রয়োগ করে দেখায়, ঝালিয়ে নেওয়ার জন্য ভালো:

{{video:Wj606N0IAsw}}

## Genome-এর index বানানো

Boyer-Moore তবুও প্রতিটা read-এর জন্য পুরো genome scan করে। শত শত কোটি read থাকলে ভালো হলো **T-কে একবার preprocess করে রাখা**, তারপর প্রতিটা read-এর উত্তর দ্রুত দেওয়া, ঠিক যেমন বইয়ের index গুরুত্বপূর্ণ শব্দ থেকে পাতা নম্বর বলে দেয়, যাতে পুরো বই আবার পড়তে না হয়।

{{video:2UsmUgJtwAI}}

**k-mer index।** T-এর প্রতিটা offset i-এর জন্য (k-mer T[i:i+k], i) জোড়াটা রেখে দিন। একটা read খুঁজতে:
1. Read-এর প্রথম k-mer নিয়ে index-এ খুঁজুন। পাওয়া প্রতিটা offset হলো একটা **index hit**।
2. Index hit শুধু একটা সম্ভাব্য প্রার্থী: প্রথম kটা অক্ষর মিলেছে, কিন্তু বাকিটা না-ও মিলতে পারে। প্রতিটা প্রার্থী offset-এ read-এর বাকি অংশ **যাচাই (verify)** করুন।

**উদাহরণ।** T = `CGTGCGTGCTT`, k = 5: 5-mer-গুলো হলো CGTGC (offset 0 আর 4), GTGCG (1), TGCGT (2), GCGTG (3), GTGCT (5), TGCTT (6)। P = `GCGTGCTT` খুঁজতে এর প্রথম 5-mer GCGTG ব্যবহার করি → offset 3-এ hit। P-এর বাকি অক্ষরগুলো (CTT) T[8..10] (CTT)-এর সাথে যাচাই করলে offset 3-এ মিল নিশ্চিত হয়। কোনো query যদি CGTGC দিয়ে শুরু হতো, সে দুটো hit পেত (0 আর 4), আর দুটোই যাচাই করতে হতো।

**Slide থেকে দুটো implementation:**
- **Sorted list + binary search:** সব (k-mer, offset) জোড়াকে k-mer অনুযায়ী sort করুন, তারপর binary search দিয়ে কোনো query-র সব entry খুঁজে বের করুন, প্রতিবার খুঁজতে O(log n)। Python-এ `bisect.bisect_left` প্রথম মিলে যাওয়া entry-টা বের করে দেয়। Memory-তে জায়গা কম লাগে।
- **Hash table:** k-mer → offset-এর list। গড়ে O(1)-এ খোঁজা যায়, তবে memory বেশি লাগে।

**k বেছে নেওয়া (specificity)।** ছোট k হলে প্রতিটা k-mer-এর অনেক hit আসে (3 billion base-এর genome-এ একটা নির্দিষ্ট 5-mer লক্ষ লক্ষবার থাকে), তাই সময়ের বেশিরভাগটাই যায় যাচাইয়ে। বড় k হলে hit কম আর বেশি নির্দিষ্ট হয়, কিন্তু k-mer-এর ভেতরে read error পড়লে আসল জায়গাটাই হাতছাড়া হয়।

:::think Index-এর জন্য hash table ভালো, নাকি sorted list?
**Hash table:** যেন একটা জাদুর ফাইল-আলমারি, যেটা সঙ্গে সঙ্গে ঠিক ড্রয়ারটা বলে দেয়। গড়ে খোঁজা **O(1)**, কিন্তু memory বেশি লাগে আর কোনো ক্রম থাকে না, তাই AAAAA আর AAAAC একেবারে সম্পর্কহীন জায়গায় গিয়ে পড়ে। **Sorted list + binary search:** যেন একটা অভিধান বা ফোনবুক। খোঁজা **O(log n)**, একটু ধীর, কিন্তু জায়গা কম লাগে আর ক্রম বজায় থাকে, তাই বর্ণানুক্রমের একটা পরিসরের সব k-mer খুঁজে পাওয়া যায় (কাজের জিনিস, যেমন একটা নির্দিষ্ট prefix দিয়ে শুরু হওয়া সব k-mer খুঁজতে)। শত শত কোটি query থাকলে সাধারণত hash table-এর গতিই জেতে; memory টানাটানি হলে জেতে sorted array (আর এর compressed উত্তরসূরিরা, suffix array আর FM-index)।
:::

{{ref:algo#hash-maps-counting-things-fast|algo#sorting-binary-search-and-indexes}}

{{widget:kmer-index}}

## ছোট index: index search-এর নানা রূপ

মানুষের genome-এর একটা পূর্ণ k-mer index-এ প্রায় 3 × 10⁹টা entry থাকে, যেটা বেশ বড়। নিচের বিকল্পগুলো এই video-তে আলোচনা করা হয়েছে।

{{video:My_sw_Rf_4U}}

Index ছোট করার উপায়, আর প্রতিটার বিনিময়ে কী দিতে হয়:

1. **Offset subsample করা।** শুধু জোড় offset-এর k-mer, বা প্রতি তৃতীয় offset-এর k-mer index করুন। Index ছোট হয়ে প্রায় 1/2 বা 1/3 হয়ে যায়। কিন্তু এখন read-এর প্রথম k-mer এমন offset-এ শুরু হতে পারে যেটা index করা হয়নি। তাই একটা query-কে read-এর **কয়েকটা phase**-এর k-mer চেষ্টা করতে হয়: "প্রতি 2য়"-এর জন্য offset 0 আর 1, "প্রতি 3য়"-এর জন্য 0, 1 আর 2। এদের অন্তত একটা কোনো indexed position-এর সাথে মিলে যাবেই। খরচ: **প্রতি read-এ বেশি lookup আর বেশি যাচাই**।
2. **Subsequence (spaced-seed) index।** একটানা k-mer-এর বদলে বাছাই করা কিছু position-এর অক্ষর index করুন (যেমন প্রতিটা window-এর offset 0, 2, 4)। মনে রাখুন: *substring মাত্রই subsequence, কিন্তু subsequence মাত্রই substring নয়।* Spaced seed **বাদ দেওয়া position-গুলোতে mismatch সহ্য করতে পারে**, তাই প্রায় একই আকারের index দিয়েই এরা বেশি approximate match খুঁজে পায়।
3. **Compressed full-text index** (slide-এর বাইরের বিষয়): **suffix array** আর **Burrows–Wheeler transform / FM-index**। মানুষের genome-এর FM-index কয়েক gigabyte-এ এঁটে যায়, আর যেকোনো exact substring O(m) সময়ে খুঁজে পায়, genome-এর আকার যা-ই হোক। **Bowtie/Bowtie2** আর **BWA**-এর ইঞ্জিন এটাই।
4. **Minimizer।** পরপর w-টা k-mer-এর প্রতিটা window-তে শুধু সবচেয়ে ছোটটা রাখুন (একটা hash ক্রম অনুযায়ী)। দুটো overlap করা sequence যদি একটা window ভাগ করে নেয়, তাহলে দুটোই নিশ্চিতভাবে একই minimizer বেছে নেবে, তাই কোনো match হারায় না, আর index ছোট হয়ে পূর্ণ আকারের মোটামুটি 2/(w+1) হয়ে যায়। Long read-এর জন্য **minimap2** এভাবেই index বানায়।

**Search-এর দক্ষতায় প্রভাব।** ছোট index মানে কম memory access আর cache-এর ভালো ব্যবহার। কিন্তু প্রতিটা query-কে বেশি কাজ করতে হয়: একাধিক seed বা phase, যাচাই করার জন্য বেশি প্রার্থী, আর error-ওয়ালা short read-এর ক্ষেত্রে হয়তো কম sensitivity। এটা একটা ক্লাসিক **space–time trade-off**।

:::story Spaced seed কেন কাজে দেয়: "Rob?rt" খোঁজা
একটা database-এ `Robert` নামটা খুঁজছেন, কিন্তু `Robart`-এর মতো একটা বানান ভুল থাকলেই exact match ভেঙে যায়। এর বদলে এমন একটা pattern দিয়ে খুঁজুন যেটা পঞ্চম অক্ষরটা উপেক্ষা করে, `Rob?rt`, তাহলে দুটো বানানই ধরা পড়বে। **Spaced seed** DNA-র ক্ষেত্রে ঠিক এটাই করে: mask `11011` দিলে `ATGCG` আর `ATTCG` দুটো window-ই key `AT·CG` হয়ে যায়, ফলে "যা খুশি থাকুক" position-এ mismatch থাকলেও lookup আর ভাঙে না। প্রতি lookup-এ বেশি আসল প্রার্থী পাওয়া যায়, তাই প্রায় একই আকারের index দিয়েই approximate matching-এর seeding ধাপটা বেশি sensitive হয়।
:::

এই talk-টা দেখায় research tool-গুলোতে বাস্তবে কোন genome index ব্যবহার হয়:

{{video:bfnFgcB_Nlw}}

## Approximate matching: Hamming, edit distance, pigeonhole

শুধু exact matching যথেষ্ট নয়। একটা read reference থেকে আলাদা হয় **sequencing error** আর **প্রাকৃতিক variation**-এর (SNP, insertion, deletion) কারণে। এই video ব্যাখ্যা করে কেন, আর আমরা যে দুটো distance ব্যবহার করি, সেগুলোর পরিচয় দেয়।

{{video:MCvHeW13DsE}}

- **Hamming distance:** সমান দৈর্ঘ্যের দুটো string-এর মধ্যে কতগুলো substitution আছে। Hamming threshold দিয়ে approximate matching করতে naive algorithm-এ সামান্য পরিবর্তন লাগে: mismatch গুনতে থাকুন, আর গোনা threshold ছাড়িয়ে গেলে ওই alignment বাদ দিন। কিন্তু এটা insertion বা deletion সামলাতে **পারে না**: একটা base insert হলে তার পরের সবকিছু সরে যায়, আর পরের প্রতিটা position-কে mismatch মনে হয়।
- **Edit (Levenshtein) distance:** X-কে Y-তে বদলাতে সর্বনিম্ন কতগুলো **substitution, insertion আর deletion** লাগে। যেমন `GCAT` → `GAT` একটা deletion, তাই দৈর্ঘ্য আলাদা হলেও edit distance 1। এটা **dynamic programming** দিয়ে O(|X|·|Y|) সময়ে হিসাব করা হয়, আর এখান থেকেই Sequence Alignment lesson-এ যাওয়ার সেতু।

{{ref:math#distances-and-similarity|algo#dynamic-programming}}

{{widget:edit-distance}}

**Pigeonhole principle** approximate matching-কে exact matching-এ নামিয়ে এনে দ্রুত করে দেয়।

P-কে **k + 1টা non-overlapping টুকরোয়** ভাগ করুন। P যদি T-তে সর্বোচ্চ kটা edit সহ থাকে, তাহলে **অন্তত একটা টুকরো কোনো edit ছাড়াই হুবহু থাকবে**: kটা edit সর্বোচ্চ kটা টুকরো নষ্ট করতে পারে, তাই k + 1টা টুকরোর অন্তত একটা অক্ষত থাকতেই হবে (kটা কবুতর দিয়ে k + 1টা খোপ ভরানো যায় না)।

**Algorithm:**
1. প্রতিটা টুকরোর সব exact occurrence দ্রুত খুঁজে বের করুন (index বা Boyer-Moore দিয়ে)।
2. প্রতিটা hit-এর আশেপাশে সর্বোচ্চ kটা mismatch বা edit মেনে নিয়ে পুরো P **যাচাই** করুন।

**উদাহরণ।** সর্বোচ্চ 2টা mismatch সহ একটা 50-base read খুঁজতে চাইলে সেটাকে মোটামুটি 17 base-এর 3টা টুকরোয় ভাগ করুন। যেকোনো আসল occurrence-এ অন্তত একটা টুকরো হুবহু থাকবে। Genome-এ 17-mer-এর exact match বিরল, তাই যাচাই করার মতো প্রার্থী থাকে অল্পই।

:::think একটা mapper-কে প্রতিটা read-এর reverse complement-ও কেন চেষ্টা করতে হয়?
DNA double-stranded, আর fragment-গুলো এলোমেলোভাবে যেকোনো strand থেকে আসে, কিন্তু reference লেখা থাকে একটা strand হিসেবে। অন্য strand থেকে আসা read reference-এ দেখা দেয় তার **reverse complement** হিসেবে। যে mapper শুধু read-টা যেমন আছে তেমনই খোঁজে, সে প্রায় অর্ধেক read হারায়। (Course notebook-এ এটা দেখা যায়: অনেক φX174 read কেবল তখনই মেলে যখন তাদের reverse complement-ও খোঁজা হয়।)
:::

:::think Read mapping-এর জন্য Hamming distance, নাকি edit distance?
**Edit distance।** Hamming distance শুধু substitution গোনে, আর এর জন্য দৈর্ঘ্য সমান হতে হয়। বাস্তবের read reference থেকে ছোট ছোট **insertion আর deletion**-এর কারণেও আলাদা হয়, যা আসে sequencing error থেকে (বিশেষ করে homopolymer run আর long read-এ) এবং আসল indel variant থেকে। একটা indel পরের প্রতিটা base সরিয়ে দেয়, তাই Hamming distance-এ read-এর বাকি অংশ পুরোটাই mismatch মনে হয়।
:::

{{video:duatMINEGgE}}

{{widget:pigeonhole}}

**ভুল মেনে নিলে কত খরচ পড়ে** (slide-এর benchmark: human chromosome 1, hg19-এ একটা Alu repeat থেকে নেওয়া 50-base string খোঁজা হয়েছে):

| Search | Character comparison | সময় | Match |
|---|---|---|---|
| Boyer-Moore, exact | 32.5 M | ~67 s | 336 |
| Boyer-Moore + pigeonhole, ≤ 1 mismatch | 107 M | ~209 s | 1,045 |
| Boyer-Moore + pigeonhole, ≤ 2 mismatches | 171 M | ~328 s | 2,798 |

ভুল মেনে নিলে কাজ আর hit-এর সংখ্যা দুটোই কয়েক গুণ বেড়ে যায়, আর Alu-র মতো repeat অনেক জায়গায় মিলে যায়। এজন্যই mapper-রা প্রতিটা placement নিয়ে তারা কতটা *নিশ্চিত*, সেটাও জানায়।

:::sota বাস্তবের read mapper-রা যা করে
1. **Seed:** FM-index (Bowtie2, BWA-MEM) বা minimizer (minimap2) দিয়ে ছোট substring-এর exact match খোঁজে। বড় পরিসরে এটাই pigeonhole-এর ধারণা।
2. **Extend:** প্রতিটা seed-এর আশেপাশে dynamic-programming alignment চালায় (affine gap সহ Smith–Waterman, SIMD instruction দিয়ে দ্রুত করা)।
3. **Report** করে **SAM/BAM** format-এ: position, match/insertion/deletion বর্ণনা করা একটা **CIGAR** string, আর **mapping quality** (MAPQ: position-টা যে ঠিক, তার Phred-scale-এ মাপা আস্থা; repeat থেকে আসা read-এর ক্ষেত্রে এটা কম হয়)।
4. **পরবর্তী ধাপ (downstream):** sort করা, PCR duplicate চিহ্নিত করা, আর **variant call** করা (GATK, বা DeepVariant, যেটা একটা convolutional neural network যা read pileup-এর ছবি দেখে শ্রেণিবিন্যাস করে)।
:::

{{ref:tools#file-formats|tools#typical-analysis-workflows}}
