**জীববিজ্ঞানের প্রশ্ন:** দুটো sequence কতটা একরকম, আর একটার কোন residue (অক্ষর: nucleotide বা amino acid) অন্যটার কোন residue-র সাথে মেলে? **কেন জরুরি:** sequence মিললে সাধারণত structure মেলে, আর structure মিললে function-ও মেলে। তাই alignment দিয়ে আমরা ভালোভাবে গবেষণা হওয়া gene ও protein-এর জ্ঞান নতুন gene/protein-এ খাটাতে পারি, বিবর্তনগত সম্পর্ক ধরতে পারি, আর sequencing read-এ variant খুঁজে পেতে পারি। এই lesson Compeau & Pevzner-এর Ch. 5 এবং lecture-এর worked example অনুসরণ করে। পুরো course-এ dynamic programming-এর সবচেয়ে গুরুত্বপূর্ণ প্রয়োগ এটাই।

নিচের lecture-টা পুরো alignment problem-পরিবারের সাথে পরিচয় করিয়ে দেয়, শুরু করে Read Mapping-এ দেখা edit distance থেকে। প্রথমে এটা দেখে নিলে পুরো ছবিটা মাথায় থাকবে।

{{video:-bjSPP2v6_Q}}

## Alignment আসলে কী

একটা sequence আরেকটার ঠিক ওপরে লিখুন, আর মাঝে মাঝে **gap (−)** বসান, যাতে মিলে যাওয়া residue-গুলো একই column-এ পড়ে। তখন প্রতিটা column হবে এই তিনটার কোনো একটা:
- **match** (দুই সারিতে একই অক্ষর),
- **mismatch** বা **substitution** (ভিন্ন অক্ষর), অথবা
- **indel** (একদিকে অক্ষর, অন্যদিকে gap): একটা sequence-এ insertion, বা একই কথা অন্যভাবে বললে অন্যটায় deletion।

```text
ATGCATGC        ATGCATGC-        ATGC-TTA-
TGCATGCA        -TGCATGCA        -TGCATTAA      (slides: three alignments of related strings)
```

প্রথম alignment-এ কোনো gap নেই, কিন্তু প্রায় সব column-ই mismatch। একটা gap দিয়ে একটা sequence-কে এক ঘর সরিয়ে দিলেই (মাঝেরটা) 7টা column মিলে যায়। Gap আসলে insertion আর deletion-কে প্রকাশ করে, আর বিবর্তনে এগুলো সত্যিই ঘটে।

:::story Ctrl+F কেন জীববিজ্ঞানে অচল: কানে কানে খবর পাঠানোর খেলা
Ctrl+F চাপলে কম্পিউটার **হুবহু** মিল খোঁজে। Hamming distance একটু বেশি ছাড় দেয়, কিন্তু শুধু সমান দৈর্ঘ্যের string-এর জন্য। বিবর্তন যেন লক্ষ লক্ষ বছর ধরে চলা একটা কানে কানে খবর পাঠানোর খেলা (ইংরেজিতে "telephone" game): পথে অক্ষর **বদলে যায়** (CAT → CGT), **ঢুকে পড়ে** (CAT → CAAT), আবার **হারিয়ে যায়** (CAT → CT)। মানুষের একটা gene আর শিম্পাঞ্জির সংশ্লিষ্ট gene একই গল্প বলে, শুধু বানান আলাদা, আর প্রায়ই দৈর্ঘ্যও আলাদা।

Alignment প্রশ্নটাই বদলে দেয়: কম্পিউটারের প্রশ্ন "এ দুটো কি হুবহু এক?" থেকে জীববিজ্ঞানীর প্রশ্নে, "এরা কীভাবে সম্পর্কিত, আর কোন অক্ষর কোনটার সাথে মেলে?" Gap বসানোর অনুমতি আছে বলেই ATGCATGC আর TGCATGCA তাদের সাধারণ অংশ TGCATGC প্রকাশ করতে পারে।
:::

:::think v (ওপরে) আর w (নিচে)-এর alignment-এ v-তে একটা gap থাকলে সেটা insertion নাকি deletion?
দুটোই, কোন দিক থেকে দেখছেন তার ওপর নির্ভর করে। v-এর gap-এর মুখোমুখি w-এর যে অক্ষর, সেটাকে w-তে **insertion** হিসেবেও পড়া যায়, আবার v থেকে **deletion** হিসেবেও। পূর্বপুরুষ sequence-টা না জানলে আসলে কোনটা ঘটেছিল বলা যায় না, তাই দুটোকে একসাথে **indel** বলা হয়।
:::

**Sequence Alignment Problem.** *Input:* দুটো sequence $S_1, S_2$ এবং একটা scoring function f (প্রতিটা ধরনের column-এর জন্য score)। *Output:* সেই alignment যেটা $f(\text{align}(S_1, S_2))$-কে সর্বোচ্চ করে।

**Scoring.** একটা alignment-এর score হলো তার **সব column-এর score-এর যোগফল**।
- DNA-র জন্য একটা সহজ scheme: match +1, mismatch −1, gap −2 (সংখ্যাগুলো মডেল বানানোর সময় আমাদের বেছে নেওয়া)।
- Protein-এর জন্য **substitution matrix** যেমন **BLOSUM62** বা PAM প্রতিটা amino acid জোড়ার একটা score দেয়। Score-টা বলে, সত্যিকারের সম্পর্কিত protein-গুলোতে ওই বদলটা কত ঘন ঘন দেখা যায়, দৈবক্রমে যতটা আশা করা যেত তার তুলনায়। এগুলো **log-odds score**: positive মানে "দৈবের চেয়ে বেশি দেখা যায়"। যেমন I↔L-এর score +2 (দুটোই কাছাকাছি ধরনের hydrophobic amino acid), আর W↔G-এর score −2।
- Gap-এর জন্য থাকে একটা negative penalty d।

**উদাহরণ (slides)।** একটা DNA substitution matrix আর d = −5 নিয়ে `GAC-AT` কে `C-ACAT`-এর সাথে align করলে score হয় (−7) + (−5) + (−7) + (−5) + 2 + 2 = **−20**: প্রতিটা column আলাদা করে score করুন, তারপর যোগ করুন।

{{ref:math#logarithms-likelihood-and-log-odds}}

**সব alignment চেষ্টা করে দেখলেই তো হয়?** না, কারণ n দৈর্ঘ্যের দুটো sequence-এর সম্ভাব্য global alignment-এর সংখ্যা exponential হারে বাড়ে। সংখ্যাটা $\binom{2n}{n} \approx 4^n/\sqrt{\pi n}$-এর চেয়েও বড়, আর n = 100 হলেই সেটা প্রায় 10⁵⁹। তবে আশার কথা হলো, প্রতিটা alignment ছোট ছোট স্থানীয় সিদ্ধান্তের একটা ধারা দিয়ে তৈরি (এই দুই অক্ষরকে পাশাপাশি বসাব, নাকি একটার বিপরীতে gap দেব), আর পুরোটার সেরা alignment-এর ভেতরে তার prefix-গুলোর সেরা alignment-ও থাকে। এই গঠনটাই **dynamic programming**-এর জন্য একদম উপযুক্ত।

:::story Manhattan-এর পর্যটক
একজন পর্যটক শহরের grid-এর ওপরের-বাম কোণ থেকে নিচের-ডান কোণে হেঁটে যাবেন, শুধু **দক্ষিণে** বা **পূর্বে** যেতে পারবেন, আর প্রতিটা block-এ কিছু দর্শনীয় জিনিস আছে। কোন পথে গেলে সবচেয়ে বেশি দেখা হবে?

x-কে y-এর সাথে align করা ঠিক এই হাঁটা। x-কে পাশে (সারি বরাবর) আর y-কে ওপরে (column বরাবর) বসান। **কোনাকুনি** এক ধাপ মানে দুটোরই পরের অক্ষর পাশাপাশি বসানো (match বা mismatch), **নিচে** এক ধাপ মানে x-এর একটা অক্ষর gap-এর বিপরীতে, আর **ডানে** এক ধাপ মানে y-এর একটা অক্ষর gap-এর বিপরীতে। এক কোণ থেকে অন্য কোণে যাওয়ার প্রতিটা পথই একটা alignment, আর সেরা alignment হলো সর্বোচ্চ score-এর পথ।

যে কৌশলটা আমাদের বাঁচায়: যেকোনো মোড়ে পৌঁছানোর সেরা পথটাকে আসতেই হবে ঠিক ওপরের, বামের, বা কোনাকুনি পেছনের মোড় থেকে। তাই ওপরের-বাম কোণ থেকে শুরু করে বাইরের দিকে প্রতিটা মোড়ের সেরা score লিখে ফেলুন, প্রতিবার আগেই হিসাব করা score ব্যবহার করে। যে রাঁধুনি প্রতিবার রেসিপিতে লাগলেই নতুন করে সিরাপ না বানিয়ে একবার এক ব্যাচ বানিয়ে তাকে তুলে রাখেন, তিনিও আসলে dynamic programming করছেন।
:::

{{ref:math#counting-how-big-is-the-search-space|algo#dynamic-programming}}

## Global alignment: Needleman–Wunsch (1970)

**Global** alignment দুটো sequence-কে **শুরু থেকে শেষ পর্যন্ত** align করে: দুটোরই প্রতিটা অক্ষর alignment-এ থাকে।

**Subproblem।** ধরা যাক F(i, j) হলো prefix $x_{1..i}$ (x-এর প্রথম i অক্ষর)-কে prefix $y_{1..j}$-এর সাথে align করার সেরা score।

**Recurrence।** এই দুই prefix-এর সেরা alignment-এর শেষ column-টা দেখুন। সেখানে মাত্র তিনটা সম্ভাবনা:
1. $x_i$ বসেছে $y_j$-এর সাথে: score হবে F(i − 1, j − 1) যোগ ওই জোড়ার score $s(x_i, y_j)$।
2. $x_i$ বসেছে একটা gap-এর সাথে: F(i − 1, j) যোগ gap penalty d।
3. $y_j$ বসেছে একটা gap-এর সাথে: F(i, j − 1) যোগ d।

সেরা alignment এই তিনটার মধ্যে যেটা সবচেয়ে ভালো সেটাই নেয়:

$$F(i,j) = \max\begin{cases} F(i-1,j-1) + s(x_i, y_j) & \text{(align } x_i \text{ with } y_j\text{)}\\ F(i-1,j) + d & (x_i \text{ with a gap})\\ F(i,j-1) + d & (y_j \text{ with a gap})\end{cases}$$

**Base case।** কোনো prefix-কে খালি string-এর সাথে align করতে হলে পুরোটাই gap দিতে হয়: $F(0,0)=0$, $F(i,0) = i\cdot d$, $F(0,j) = j\cdot d$।

**Table পূরণ।** x-কে পাশে আর y-কে ওপরে বসান। প্রথম সারি আর প্রথম column base case দিয়ে ভরুন, তারপর সারি ধরে ধরে বাকিটা ভরুন: প্রতিটা cell-এর দরকার শুধু তার **কোনাকুনি**, **ওপরের** আর **বামের** প্রতিবেশী, যেগুলো ততক্ষণে তৈরি হয়ে গেছে। কোন প্রতিবেশী থেকে max এসেছে সেটা লিখে রাখুন (একটা **pointer**)।

**Traceback।** Global score হলো F(n, m), অর্থাৎ নিচের-ডান কোণের cell। সেখান থেকে pointer ধরে F(0, 0) পর্যন্ত ফিরে গেলে alignment-টা পড়ে ফেলা যায়: **কোনাকুনি** = পাশাপাশি বসানো একটা জোড়া, **ওপরে** = x-এর একটা অক্ষর gap-এর বিপরীতে, **বামে** = y-এর একটা অক্ষর gap-এর বিপরীতে। দুটো প্রতিবেশী সমান হলে দুটো পথই optimal alignment-এ নিয়ে যায়, তাই **tie হলে একাধিক co-optimal alignment পাওয়া যায়**।

**খরচ।** Table-এ (n + 1)(m + 1)টা cell, আর প্রতিটায় constant সময় লাগে: **O(nm) time ও space**।

:::example হাতে করা একটা ছোট table: x = ACG, y = AG, match +1, mismatch −1, gap −2
| | ε | A | G |
|---|---|---|---|
| ε | 0 | −2 | −4 |
| A | −2 | **1** | −1 |
| C | −4 | **−1** | 0 |
| G | −6 | −3 | **0** |

- F(1,1): A বনাম A, কোনাকুনি 0 + 1 = **1** (gap-এর দুই বিকল্প −4 আর −4-কে হারায়)।
- F(2,1): C বনাম A। কোনাকুনি F(1,0) − 1 = −3; ওপর থেকে F(1,1) − 2 = **−1**; বাম থেকে F(2,0) − 2 = −6। সেরা: ওপর থেকে (C একটা gap-এর বিপরীতে)।
- F(3,2): G বনাম G। কোনাকুনি F(2,1) + 1 = **0**; ওপর থেকে F(2,2) − 2 = −2; বাম থেকে F(3,1) − 2 = −5।

F(3,2) = 0 থেকে traceback: কোনাকুনি (G/G), ওপরে (C/−), কোনাকুনি (A/A)। Alignment-টা হলো **ACG / A−G**, score 1 − 2 + 1 = 0।
:::

আরেকবার পুরো প্রক্রিয়াটা দেখতে চাইলে, এই video-তে একটা পূর্ণ table ধাপে ধাপে হাতে ভরা হয়েছে:

{{video:ipp-pNRIp4g}}

{{widget:alignment preset="final"}}

:::example x = ACCGTGC, y = ACGTC, match +2, mismatch −1, gap −2
নিচের-ডান cell দেয় **global score 6**। Traceback-এর সময় একটা tie থেকে দুটো co-optimal alignment আসে:
```text
ACCGTGC        ACCGTGC
A-CGT-C        AC-GT-C
```
মিলিয়ে দেখুন: 5টা match × 2 = 10, যোগ 2টা gap × (−2) = −4, মোট **6**। পুরো DP table widget-এ আছে (preset "Final Q1(a) global")।
:::

## Local alignment: Smith–Waterman (1981)

**Global alignment-এর সীমাবদ্ধতা** (slides)। দুটো সম্পর্কিত protein সামগ্রিকভাবে আলাদা হতে পারে, অথচ দুটোতেই একটা সংরক্ষিত **functional domain** থাকতে পারে। একটা gene-এ সংরক্ষিত **exon**-গুলোর মাঝে থাকে লম্বা, পরিবর্তনশীল **intron**। Global alignment জোর করে শুরু থেকে শেষ পর্যন্ত মেলায়, ফলে সম্পর্কহীন অংশগুলো score নামিয়ে দেয়, এমনকি সংরক্ষিত অংশটাকেও ভুল জায়গায় বসিয়ে দিতে পারে। **Local alignment** তার বদলে খোঁজে **সবচেয়ে ভালো মেলে এমন একজোড়া substring**, প্রতিটা sequence থেকে একটা করে, আর বাকি সব উপেক্ষা করে।

**Recurrence-এ তিনটা পরিবর্তন:**
1. চতুর্থ বিকল্প হিসেবে **0** যোগ করুন:
$$F(i,j) = \max\{0,\ F(i-1,j-1)+s(x_i,y_j),\ F(i-1,j)+d,\ F(i,j-1)+d\}$$
এই 0-এর মানে "এখান থেকে নতুন একটা alignment শুরু করো"। (i, j)-তে শেষ হওয়া সেরা alignment-এর score যদি negative হয়ে যায়, তাহলে সেটা ফেলে দিয়ে নতুন করে শুরু করাই ভালো। ফলে negative prefix কখনো সামনে বয়ে নেওয়া হয় না।
2. প্রথম সারি আর প্রথম column সবই **0** (alignment যেকোনো জায়গা থেকে বিনা খরচে শুরু হতে পারে)।
3. Traceback শুরু হয় **পুরো table-এর সর্বোচ্চ cell** থেকে (সেরা alignment যেকোনো জায়গায় শেষ হতে পারে), আর থামে প্রথম **0**-তে পৌঁছালে (যেখানে সেটা শুরু হয়েছিল)।

:::story Local alignment-এর দুটো ছবি
**একটা উপন্যাস আর একটা sonnet।** আপনার সন্দেহ, *War and Peace*-এর কোথাও Shakespeare-এর একটা sonnet উদ্ধৃত আছে। Global alignment উপন্যাসের পুরো 1.2 million শব্দকে কবিতার 100 শব্দের সাথে জোর করে মেলাবে, penalty জমতে জমতে পাহাড় হবে, আর রায় দেবে এরা সম্পর্কহীন। Local alignment যেন একটা search engine: বাকি সব উপেক্ষা করে শুধু মিলে যাওয়া অনুচ্ছেদটা ফেরত দেয়। জীববিজ্ঞানে এর রূপ: মানুষ আর ইঁদুরের homeobox gene সামগ্রিকভাবে অনেকটা আলাদা হয়ে গেছে, কিন্তু দুটোতেই প্রায় হুবহু এক রকম প্রায় 180 nucleotide-এর একটা **homeodomain** আছে। Local alignment সেটা খুঁজে পায়; global alignment-এ সেটা বাকি অংশের ভিড়ে ডুবে যায়।

**বিনা ভাড়ার taxi।** Manhattan-এর ছবিতে recurrence-এর 0 হলো একটা ফ্রি taxi। যে পথে হাঁটছেন তার score negative হয়ে গেলে সেটা ছেড়ে দিন, taxi নিয়ে এখানে চলে আসুন, আর score 0 থেকে নতুন করে শুরু করুন। আর দূরের কোণ পর্যন্ত হেঁটে যাওয়ার দরকার নেই, যেখানে দেখার জিনিস সবচেয়ে ভালো ছিল সেখানেই নেমে পড়তে পারেন। এ কারণেই traceback শুরু হয় **সর্বোচ্চ cell** থেকে আর থামে প্রথম **0**-তে।
:::

**উদাহরণ (slides)।** একটা DNA matrix আর d = −5 নিয়ে AAG বনাম AGC: সেরা local alignment হলো `AG / AG`, score **4**, অথচ একই জোড়ার global score −6। দ্বিতীয় সেরা local alignment A/A, score 2।

Local সংস্করণটা হাতে করে দেখুন, zero floor (0-এর নিচে না নামা) আর 0 পর্যন্ত traceback সহ:

{{video:lu9ScxSejSE}}

{{widget:alignment preset="finalLocal"}}

{{game:align-duel}}

:::example x = ACCGTGC, y = ACGTC-এর local alignment (+2/−1/−2)
সর্বোচ্চ cell-এর মান **6**, যা পাওয়া যায় F(5,4)-এ এবং আবার F(7,5)-এ। F(5,4) থেকে সেরা local alignment-গুলো হলো
```text
CGT          ACCGT
CGT    and   AC-GT        (both score 6)
```
আর F(7,5) থেকে traceback করলে পুরো দৈর্ঘ্যের alignment-টাই ফিরে আসে (সেটারও score 6)।

**Global আর local score সাধারণত আলাদা হয় কেন, আর এখানে সমান হলো কেন?** Global alignment-কে দুটো sequence শুরু থেকে শেষ পর্যন্ত ঢাকতে হয়, তাই প্রতিটা না-মেলা residue-র জন্য gap বা mismatch penalty গুনতে হয়। Local alignment শুধু সর্বোচ্চ score-এর segment জোড়াটা রাখে, আর যে দুই পাশের অংশ (flank) score কমায় সেগুলো বাদ দেয়। এখানে flank-গুলো যত point যোগ করে ঠিক ততটাই খরচ করে: CGT/CGT-কে পুরো alignment পর্যন্ত বাড়ালে দুটো match (+4) আর দুটো gap (−4) যোগ হয়, নিট 0। তাই local optimum (মূল অংশ **CGT**) global score-এর সমান হয়ে যায়। Gap penalty আরও কড়া হলে (widget-এ −3 দিয়ে দেখুন) local score global-এর চেয়ে বেশি হতো।
:::

## Gap penalties: linear বনাম affine

**Linear** gap penalty প্রতিটা gap অবস্থানের জন্য d কাটে, তাই L দৈর্ঘ্যের একটা gap-এর খরচ L·d। কিন্তু জীববিজ্ঞানের দিক থেকে, একটা লম্বা insertion বা deletion সাধারণত **একটাই mutation ঘটনা**, আর অনেকগুলো আলাদা ছোট ঘটনার চেয়ে সেটা অনেক বেশি সম্ভাব্য। Linear penalty-তে 4-base-এর একটা gap আর চারটা আলাদা 1-base gap-এর খরচ একই, যা বাস্তবসম্মত নয়। **Affine** gap penalty এটা ঠিক করে:

$$\text{gap}(L) = d_{\text{open}} + (L-1)\cdot e_{\text{extend}}, \qquad |d_{\text{open}}| > |e_{\text{extend}}|$$

Gap খোলা দামি; আগে থেকে খোলা gap লম্বা করা সস্তা।

**উদাহরণ:** open −5, extend −1, দৈর্ঘ্য 4 → −5 + 3·(−1) = **−8**। চারটা আলাদা 1-base gap-এর খরচ হতো 4·(−5) = −20, তাই affine scheme একটা লম্বা gap-কেই জোরালোভাবে পছন্দ করে।

:::story Parking-এর জরিমানা
নো-পার্কিং জায়গায় তিন ঘণ্টা গাড়ি রাখলে আপনি পান **একটা** জরিমানার টিকিট। আলাদা তিনবার এক ঘণ্টা করে অবৈধভাবে রাখলে পান **তিনটা**। Linear gap penalty হলো এমন এক ট্রাফিক কর্মকর্তা, যিনি আপনি যতক্ষণ থাকবেন প্রতি মিনিটে নতুন টিকিট লেখেন: একটা লম্বা gap-কে (যা প্রায়ই একটাই mutation ঘটনা, যেমন polymerase slippage) তিনি এমনভাবে শাস্তি দেন যেন সেটা অনেকগুলো আলাদা ঘটনা। Affine penalty হলো gap খোলার জন্য একটা বড় টিকিট, আর প্রতিটা বাড়তি base-এর জন্য একটা ছোট ফি, যা জীববিজ্ঞানের সাথে মেলে।
:::

**কীভাবে হিসাব করবেন।** সাধারণ recurrence এখানে আর কাজ করে না, কারণ একটা gap column-এর খরচ নির্ভর করে আগের column-টাও gap ছিল কি না তার ওপর। সমাধান (**Gotoh**, 1982) হলো **তিনটা DP table** রাখা, আর তবুও সময় O(nm):
- **M**(i, j): $x_i$ যখন $y_j$-এর সাথে বসানো, তখনকার সেরা score;
- **X**(i, j): $x_i$ একটা gap-এর বিপরীতে রেখে শেষ হওয়া সেরা score;
- **Y**(i, j): $y_j$ একটা gap-এর বিপরীতে রেখে শেষ হওয়া সেরা score।

M থেকে X বা Y-তে ঢুকতে লাগে open penalty; X বা Y-তেই থেকে গেলে লাগে extend penalty। Slides-এ এই তিনটা table আঁকা হয়েছে **state** হিসেবে, যাদের মধ্যে transition আছে। এই finite-state ছবিটা আসলে একটা **pair HMM**, যা আপনি HMM lesson-এ দেখবেন।

:::think Affine gap কি alignment-কে asymptotically ধীর করে দেয়?
না। একটার বদলে তিনটা table, তাই প্রতিটা cell-এ মোটামুটি তিন গুণ কাজ হয়, কিন্তু সেটা একটা constant factor মাত্র। Time ও space **O(nm)**-ই থাকে।
:::

{{widget:affine-gap}}

## গতি: BLAST

প্রথমে BLAST-এর seed, extension আর E-value নিয়ে এই ব্যাখ্যাটা দেখে নিন:

{{video:NwiETShpIDo}}

দুটো gene-এর জন্য O(nm) ঠিক আছে, কিন্তু একটা query-কে কয়েকশো million sequence-এর database-এর বিপরীতে খুঁজতে গেলে নয় (slides: "550K proteins or billions of reads")। **BLAST** (Basic Local Alignment Search Tool; Altschul et al., 1990) একটা **heuristic**: নিশ্চিত optimality ছেড়ে দিয়ে এটা হাজার গুণ দ্রুত চলে।

1. **Seed।** Query-কে ছোট ছোট word-এ ভাঙুন: DNA-র জন্য দৈর্ঘ্য w ≈ 11; protein-এর জন্য w = 3, সাথে "neighbourhood" word-গুলোও, অর্থাৎ যেসব word BLOSUM62 অনুযায়ী কোনো query word-এর বিপরীতে অন্তত একটা threshold T score করে (ফলে শুধু হুবহু এক নয়, কাছাকাছি word-ও গোনা হয়)।
2. **Hit খোঁজা।** আগে থেকে বানানো database index-এ ওই word-গুলোর হুবহু উপস্থিতি খুঁজুন।
3. **Extend।** প্রতিটা hit থেকে gap ছাড়াই দুই দিকে alignment বাড়াতে থাকুন, আর থামুন যখন score এ পর্যন্ত দেখা সেরা score-এর চেয়ে X-এর বেশি নিচে নেমে যায় (**X-drop**)। ভালো extension-গুলো হলো **high-scoring segment pair (HSP)**, যেগুলোকে পরে gap সহ আরও বাড়ানো হয়।
4. **Report।** প্রতিটা hit-এর সাথে একটা **E-value** দিন: এই আকারের database-এ **দৈবক্রমে** এত ভালো কতগুলো hit আশা করা যায়, সেই সংখ্যা। E = 10⁻³⁰ মানে দৈবক্রমে প্রায় অসম্ভব; E = 5 মানে noise।

এটা Read Mapping-এর pigeonhole principle-এর সেই একই seed-and-extend ভাবনা: আগে ছোট হুবহু মিল, তারপর যত্ন করে যাচাই।

{{ref:readmap#approximate-matching-hamming-edit-distance-pigeonhole|math#statistical-significance-and-multiple-testing}}

BLAST nucleotide আর protein দুটোর জন্যই কাজ করে (blastn, blastp, blastx, …) এবং অসম্ভব দ্রুত, কিন্তু Smith–Waterman যে optimal alignment খুঁজে পেত সেটা পাওয়ার **নিশ্চয়তা দেয় না**: কোনো সত্যিকারের মিলে যদি একটাও হুবহু seed word না থাকে, BLAST সেটা মিস করে।

{{widget:blast}}

Seed-and-extend-এর দুই মিনিটের একটা ঝালাই:

{{video:kAAme1fBanc}}

## Multiple sequence alignment

মিল দুর্বল হলে pairwise alignment হয়তো দেখাতেই পারবে না যে দুটো sequence সম্পর্কিত। একসাথে **অনেকগুলো** সম্পর্কিত sequence তুলনা করলে বোঝা যায় কোন column-গুলো পুরো পরিবার জুড়ে সংরক্ষিত: *"pairwise alignment ফিসফিস করে, multiple alignment চিৎকার করে।"*

:::story Pairwise alignment ফিসফিস করে, multiple alignment চিৎকার করে
একটা বইয়ে "bioinfomatics" বানান ভুল দেখলে আপনি পাত্তা দেবেন না: নিছক টাইপের ভুল। কিন্তু দশজন লেখকের দশটা বইয়ে একই ভুল বানান দেখলে সন্দেহ হবে, এটা মোটেই দৈবক্রমে নয়। ঠিক তেমনি, দুটো protein-এর মধ্যে একটা residue মিলে যাওয়া কাকতালীয় হতে পারে, কিন্তু অনেক প্রজাতির পুরো একটা পরিবার জুড়ে যে column একই থাকে, সেটা প্রায় নিশ্চিতভাবেই protein-এর structure বা function-এর জন্য গুরুত্বপূর্ণ। Multiple alignment এই সংরক্ষিত অবস্থানগুলোকে চোখে পড়ার মতো করে তোলে।
:::

একটা **t-way alignment** হলো t সারির একটা matrix (প্রতিটা sequence-এর জন্য এক সারি, gap সহ), যার column-গুলোতে সংশ্লিষ্ট residue-গুলো সারিবদ্ধ থাকে।

**Exact DP-কে সাধারণীকরণ করা যায়, কিন্তু ফল খারাপ।** দুটো sequence-এর জন্য DP table একটা 2-D grid; t sequence-এর জন্য এটা একটা t-dimensional grid, যাতে প্রায় $n^t$টা cell। প্রতিটা cell-এর সর্বোচ্চ $2^t - 1$টা পূর্বসূরি থাকে (sequence-গুলোর যেকোনো অ-খালি subset এক অক্ষর এগোতে পারে), ফলে time হয় **$O(n^t\, 2^t)$**। 300 দৈর্ঘ্যের 10টা protein-এর জন্য সেটা প্রায় $300^{10} \cdot 2^{10}$, একেবারেই অসম্ভব। আসলে sum-of-pairs scoring সহ MSA একটা NP-hard সমস্যা।

{{ref:algo#np-hardness-and-heuristics}}

**ব্যবহারিক heuristic:**
- **Progressive alignment** (ClustalW, Clustal Omega): pairwise distance হিসাব করুন, একটা **guide tree** বানান, তারপর সবচেয়ে কাছের জোড়াগুলো আগে align করুন, আর tree অনুসরণ করে ধাপে ধাপে sequence (বা profile হিসেবে প্রকাশ করা sequence-এর দল) যোগ করুন। দ্রুত, কিন্তু শুরুর দিকের ভুল আর কখনো শোধরানো হয় না ("once a gap, always a gap": একবার gap বসলে চিরকাল gap)।
- **Iterative refinement** (MUSCLE): শুরুর ভুল ঠিক করতে subset-গুলোকে আবার align করে।
- **Consistency- ও FFT-ভিত্তিক পদ্ধতি** (T-Coffee, MAFFT)।

**পরের ধাপে MSA কেন জরুরি:** MSA থেকে তৈরি হয় **profile ও profile HMM** (HMMER, Pfam), যা দিয়ে পরিবারের দূরের সদস্যদের খোঁজা হয়; **phylogenetic tree** (পরের lesson); আর **AlphaFold**, যা MSA column-গুলো থেকে co-evolution-এর সংকেত পড়ে 3D contact অনুমান করে।

:::think Progressive alignment-এর প্রধান দুর্বলতা কী?
"Once a gap, always a gap।" প্রতিটা pairwise ধাপ পরের sequence যোগ হওয়ার আগেই পাকাপাকি হয়ে যায়, তাই শুরুর দিকে করা একটা ভুল (প্রায়ই প্রথম, সবচেয়ে কাছাকাছি জোড়াটা align করার সময়) চূড়ান্ত alignment পর্যন্ত চলে যায় এবং আর কখনো শোধরানো যায় না। Iterative refinement (MUSCLE) আর consistency-ভিত্তিক পদ্ধতি (T-Coffee) এই সমস্যা কমানোর জন্যই এসেছে।
:::

## সারসংক্ষেপ

| | Global (NW) | Local (SW) | BLAST | MSA (DP) |
|---|---|---|---|---|
| কী align করে | পুরো sequence | সেরা substring জোড়া | সেরা local hit (heuristic) | t-টা sequence |
| Recurrence | 3টার max | 3টা আর 0-এর max | seed–extend | t-dimensional grid |
| Traceback | (n, m) → (0, 0) | max cell → প্রথম 0 | প্রযোজ্য নয় | প্রযোজ্য নয় |
| Optimal? | হ্যাঁ | হ্যাঁ | না | হ্যাঁ (কিন্তু exponential) |
| Time | O(nm) | O(nm) | বাস্তবে ~linear | O(nᵗ2ᵗ) |
