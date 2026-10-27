**জৈবিক প্রশ্ন:** একটা bacterial genome-এ DNA replication ঠিক কোথা থেকে শুরু হয়? **কেন এটা জানা দরকার:** gene therapy-তে বিশেষভাবে তৈরি করা *viral vector* দিয়ে একটা সুস্থ gene রোগীর কোষে পৌঁছে দেওয়া হয়। vector-টা সেখানে replicate করতে চাইলে তার origin of replication (**oriC**) অক্ষত থাকতে হবে, তাই biologist-দের জানতে হয় oriC ঠিক কোথায়। (মানুষের ওপর প্রথম সফল gene therapy হয়েছিল 1990 সালে; চার বছরের একটা মেয়ের severe combined immunodeficiency রোগের চিকিৎসায়।)

একজন biologist চাইলে পরীক্ষাগারেই oriC খুঁজে বের করতে পারেন: genome-এর একেকটা অংশ মুছে ফেলে দেখা, কোনটা মুছলে replication থেমে যায়। কিন্তু এটা সময়সাপেক্ষ, খরচও অনেক। একজন computer scientist প্রশ্নটা অন্যভাবে করেন: *DNA sequence-এর ভেতরেই কি এমন কোনো লুকানো বার্তা আছে, যেটা জায়গাটা চিহ্নিত করে রাখে?* এই lesson Compeau & Pevzner-এর Chapter 1 অনুসরণ করে ধাপে ধাপে সেই উত্তরটা গড়ে তোলে: সাধারণ word গোনা থেকে শুরু করে replication নিজেই genome-এ যে statistical ছাপ রেখে যায়, সেই পর্যন্ত।

:::story পুরো lesson-টা একটা গোয়েন্দা গল্প হিসেবে
1. **অস্পষ্ট প্রশ্ন:** replication কোথা থেকে শুরু হয়?
2. **প্রথম hypothesis:** যেখানে অনেকগুলো DnaA box গাদাগাদি করে বসে আছে, সেখান থেকেই শুরু। তাহলে এমন k-mer খুঁজি যেগুলো *একটা ছোট window-এর ভেতরে* ঘন ঘন আসে (clump), সাথে reverse complement আর প্রায়-মিল (near-match) গুলোও গুনি। **সমস্যা:** পুরো genome জুড়ে এভাবে খুঁজলে শত শত candidate পাওয়া যায়। খড়ের গাদায় সুঁই খোঁজার মতো অবস্থা।
3. **দ্বিতীয় hypothesis:** replication যেভাবে কাজ করে, তাতে *পুরো* genome-এর ওপর একটা statistical "দাগ" পড়ে যায়। genome ধরে হাঁটতে হাঁটতে G বিয়োগ C গুনতে থাকুন, দেখবেন এই দাগটা ঠিক origin-এ গিয়ে সবচেয়ে নিচে নামে। পদ্ধতিটা দ্রুত (একবার পড়ে গেলেই হয়), কিন্তু এর resolution কম: এটা আপনাকে একটা এলাকা দেখিয়ে দেয়, হুবহু বার্তাটা নয়।
4. **দুটো মিলিয়ে নিন:** skew দিয়ে এলাকাটা খুঁজে বের করুন (লাখ লাখ base-এর মধ্যে মাত্র কয়েকশো base), তারপর শুধু সেই window-এর ভেতরে mismatch আর reverse complement সহ frequent word খুঁজুন।

পড়ার সময় এই পরিকল্পনাটা মাথায় রাখুন: আগে একটা সস্তা, পুরো-genome-জুড়ে, **low-resolution** পদ্ধতি দিয়ে খোঁজার জায়গা ছোট করা হয়, তারপর একটা দামি, **high-resolution** পদ্ধতি দিয়ে আসল signal-টা ধরা হয়। এই pattern আপনি বারবার দেখবেন (BLAST আর read mapper ঠিক এভাবেই কাজ করে)।
:::

বাংলায় শিখতে পছন্দ করলে এই walkthrough-টা দেখতে পারেন; এতে chapter-এর প্রথম অর্ধেক (k-mer আর frequent word) আছে। পরের দুটো section পড়ার আগে বা পাশাপাশি দেখে নিন।

{{video:smFsAm-R_Vo}}

## লুকানো বার্তা: DnaA box

**DnaA** নামের একটা protein যখন oriC-তে এসে বসে (bind করে), তখনই replication শুরু হয়। এটা bind করে মোটামুটি 9 nucleotide লম্বা ছোট ছোট অংশে, যেগুলোর নাম **DnaA box**। DnaA box হলো DNA-র ভাষায় লেখা একটা "এখানে বসো!" নির্দেশ। একটা মাত্র binding site তো কাকতালীয়ভাবেও তৈরি হয়ে যেতে পারে, তাই oriC-তে কাছাকাছি *কয়েকটা* DnaA box থাকে, যাতে protein-টা নির্ভরযোগ্যভাবে bind করতে পারে।

তাহলে আমাদের পরিকল্পনা: **একটা ছোট এলাকার মধ্যে অস্বাভাবিক বেশিবার আসা ছোট word খুঁজে বের করা।**

**যে সংজ্ঞাগুলো পুরো course জুড়ে লাগবে:**
- **k-mer** মানে k দৈর্ঘ্যের যেকোনো string। `ATG` একটা 3-mer; `ATGATCAAG` একটা 9-mer।
- $\text{Count}(Text, Pattern)$ হলো *Text*-এ *Pattern* কতবার আছে তার সংখ্যা, **overlap করা occurrence-গুলোসহ**। যেমন Count(`GCGCG`, `GCG`) = 2, কারণ position 0 আর position 2-এর occurrence দুটো একে অপরের ওপর পড়ে (overlap করে)।
- *Text*-এর অন্য কোনো k-mer-এর Count যদি *Pattern*-এর চেয়ে বেশি না হয়, তাহলে *Pattern* হলো Text-এর একটা **most frequent k-mer**। একাধিক k-mer-এর মধ্যে টাই হতে পারে, সেজন্যই problem-গুলোতে *সবগুলো* most frequent k-mer চাওয়া হয়।

**একটা pattern গোনা:** |Pattern| দৈর্ঘ্যের একটা window text-এর ওপর দিয়ে সরাতে থাকুন, আর প্রতিটা position-এ মিলিয়ে দেখুন।

```text
PatternCount(Text, Pattern)
  count ← 0
  for i ← 0 to |Text| − |Pattern|
      if Text[i, |Pattern|] = Pattern: count ← count + 1
  return count
```

**সবচেয়ে frequent k-mer খুঁজে বের করা।** সরল (naive) *FrequentWords* পদ্ধতি Text-এর |Text| − k + 1টা k-mer-এর প্রত্যেকটার জন্য আলাদা করে PatternCount চালায়। প্রতিবার পুরো text আবার scan করতে হয়, তাই মোট খরচ মোটামুটি $O(|Text|^2 \cdot k)$। 500 অক্ষরের জন্য এটা চলে, কিন্তু একটা genome-এর জন্য একেবারেই অচল।

**ভালো উপায়:** text-টা **একবারই** scan করুন, আর প্রতিটা k-mer পেলে একটা **frequency table**-এ (k-mer থেকে count-এর একটা hash map) তার ঘরে এক যোগ করুন। শেষে সবচেয়ে বেশি count-ওয়ালা k-mer-গুলো নিয়ে নিন। খরচ: $O(|Text| \cdot k)$।

**হাতে-কলমে উদাহরণ।** `ACGTTGCATGTCGCATGATGCATGAGAGCT`-এ k = 4 নিলে frequency table দেখায় `CATG` আর `GCAT` দুটোই 3 বার করে আছে, বাকি সব 4-mer এর চেয়ে কম। তাই দুটোই most frequent।

{{ref:algo#hash-maps-counting-things-fast|math#counting-how-big-is-the-search-space}}

"dictionary দিয়ে k-mer গোনা" কৌশলটা genome assembly, read mapping আর machine learning-এর feature তৈরিতে বারবার ফিরে আসবে, তাই এটা যেন আপনার হাতে একদম স্বাভাবিক হয়ে যায়।

:::example একটা string-এ k-mer গোনা
- n দৈর্ঘ্যের একটা string-এ **n − k + 1**টা k-mer position থাকে, কারণ k দৈর্ঘ্যের window-টা position 0 থেকে n − k পর্যন্ত যেকোনো জায়গায় শুরু হতে পারে। তাই 1,000-bp-এর একটা genome-এ 6-mer position আছে 1000 − 6 + 1 = **995**টা, আর 7-mer position **994**টা।
- *আলাদা আলাদা* (distinct) k-mer-এর সংখ্যা সর্বোচ্চ min(n − k + 1, 4ᵏ), আর কিছু k-mer পুনরাবৃত্ত হলে এর চেয়ে কম। প্রশ্নে "distinct" বলা থাকলে আপনি কী ধরে নিচ্ছেন সেটা স্পষ্ট করে বলুন।
- অনেকগুলো sequence থাকলে গুণ করুন: 100 দৈর্ঘ্যের 20টা sequence-এ 6-mer position আছে 20 × (100 − 6 + 1) = **1,900**টা; 100 দৈর্ঘ্যের 10টা sequence-এ 9-mer position 10 × 92 = **920**টা।
:::

## Vibrio cholerae-তে frequent word

চলুন আইডিয়াটা আসল data-তে পরীক্ষা করি: কলেরা রোগের জন্য দায়ী bacterium *Vibrio cholerae*-এর 540-nucleotide লম্বা oriC অঞ্চল। এর মধ্যে চারটা আলাদা 9-mer 3 বা তার বেশিবার এসেছে:

**ATGATCAAG, CTTGATCAT, TCTTGATCA, CTCTTGATC**

**3 বার আসাটা কি অবাক হওয়ার মতো?** সম্ভাব্য 9-mer আছে $4^9 = 262{,}144$টা, অথচ position মাত্র 540 − 9 + 1 = 532টা। তাই এই দৈর্ঘ্যের একটা random string-এ *নির্দিষ্ট* কোনো একটা 9-mer-এর expected count মোটামুটি 532 / 262,144 ≈ 0.002। কাকতালীয়ভাবে একটাকে 3 বার দেখা খুবই অসম্ভাব্য। কাজেই এই word-গুলো সন্দেহজনক।

{{ref:math#expected-value-and-sampling-from-a-distribution|math#statistical-significance-and-multiple-testing}}

**চমকপ্রদ পর্যবেক্ষণ।** **ATGATCAAG** আর **CTTGATCAT** একে অপরের **reverse complement**। মনে করুন, DNA double-stranded: একটা strand-এ যে 9-mer থাকে, অন্য strand-এ সেটা তার reverse complement রূপে দেখা যায়। DnaA bind করে double-stranded DNA-তে, word-টা কোন strand-এ লেখা তাতে তার কিছু যায় আসে না। তাই আসল signal হলো একটা 9-mer *আর* তার reverse complement *একসাথে*, যারা এই ছোট্ট অঞ্চলে মোট **6 বার** এসেছে। এটাই যে DnaA box, তার খুব জোরালো ইঙ্গিত।

{{ref:intro#dna-the-four-letter-molecule}}

নিজে k-mer গুনে দেখুন:

{{widget:kmer-counter}}

**এটা কি শুধু oriC-র বিশেষত্ব, নাকি সব জায়গাতেই এমন সাধারণ?** যাচাই করতে আমরা **Pattern Matching Problem** সমাধান করি: পুরো genome-এ pattern-টা যত জায়গায় আছে, সব position খুঁজে বের করা। oriC যে 1.1-million-base *V. cholerae* chromosome-এ আছে, তাতে ATGATCAAG আছে 17 বার। একটা লম্বা genome-এর জন্য 17 তেমন কিছু না। কিন্তু এর তিনটা occurrence (position 151913, 152013 আর 152394) একে অপরের মাত্র কয়েকশো base-এর মধ্যে, ঠিক oriC-র ভেতরে বসে আছে। word-টা শুধু frequent নয়; এটা **জোট বেঁধে আছে (clumped)**।

## Clump

"কাছাকাছি" কথাটাকে নিখুঁতভাবে সংজ্ঞায়িত করা যাক:

genome-এ L দৈর্ঘ্যের এমন কোনো window যদি থাকে যার ভেতরে একটা k-mer অন্তত t বার আছে, তাহলে বলা হয় k-mer-টা একটা **(L, t)-clump** তৈরি করেছে।

**Clump Finding Problem।** *Input:* একটা genome, আর integer k, L, t। *Output:* genome-এ (L, t)-clump তৈরি করে এমন সব distinct k-mer।

**কীভাবে হিসাব করবেন।** L দৈর্ঘ্যের একটা window genome বরাবর সরাতে থাকুন। window-এর ভেতরের k-mer-গুলোর একটা frequency table রাখুন। window এক ঘর ডানে সরলে একটা k-mer বেরিয়ে যায় (তার count এক কমান) আর একটা ঢোকে (তার count এক বাড়ান)। ফলে প্রতি ধাপে পুরো window আবার গুনতে হয় না, খরচ মাত্র O(k)। কোনো window-এ যে k-mer-এর count t-তে পৌঁছায়, সেটাই clump।

{{widget:clumps}}

**Clump-এর সমস্যা।** *E. coli*-তে শত শত আলাদা 9-mer (500, 3)-clump তৈরি করে। শুধু clump দেখে তাই oriC কোথায় বলা যায় না। দরকার একটা দ্বিতীয়, স্বাধীন signal, যেটা খোঁজার জায়গাটা একটা ছোট অঞ্চলে নামিয়ে আনবে; তারপর সেখানে DnaA box খোঁজা যাবে। সেই signal আসে replication-এর যান্ত্রিক কার্যপ্রণালী থেকে।

:::think "most frequent word" আর "clump"-এর আসল পার্থক্যটা কী?
**Frequent Words** পুরো string-টা দেখে: একটা k-mer জেতে যদি সেটা *যেকোনো জায়গায়* বেশি থাকে। **Clump Finding** চায় L দৈর্ঘ্যের *একটা ছোট window-এর ভেতরে* বেশি frequency। origin-এর জন্য clump-এর মডেলটাই বেশি উপযুক্ত, কারণ DnaA box কোষের কাজে লাগে কেবল তখনই, যখন কয়েকটা একটা ছোট অঞ্চলে **কাছাকাছি** বসে থাকে। যে word পুরো genome জুড়ে পাতলাভাবে ছড়িয়ে আছে, সংখ্যায় বেশি হলেও সেটা origin-এর signal নয়।
:::

## Replication অপ্রতিসম (asymmetric)

leading আর lagging strand যদি মনে না থাকে, replication-এর animation-টা আরেকবার দেখে নিন; এই section পুরোপুরি ওগুলোর ওপর নির্ভর করে।

{{video:TNKWgcFPHqw}}

bacterial chromosome সাধারণত **বৃত্তাকার (circular)**। replication শুরু হয় **oriC** থেকে, আর দুটো **replication fork** সেখান থেকে বৃত্ত বরাবর উল্টো দিকে এগোতে থাকে, যতক্ষণ না তারা **terminus (terC)**-এ মিলিত হয়। terC মোটামুটি oriC-র ঠিক বিপরীত দিকে।

এবার Introduction-এর নিয়মটা মনে করুন: DNA polymerase নতুন strand বানাতে পারে শুধু **5′→3′** দিকে, তাই সে template পড়ে **3′→5′** দিকে।

দুটো strand-এর প্রতিটাকে oriC আর terC-তে কেটে দুই ভাগ করুন। তাতে চারটা **half-strand** পাওয়া যায়:
- এর দুটোতে polymerase fork যেদিকে যাচ্ছে সেদিকেই চলতে পারে, oriC থেকে terC পর্যন্ত একটানা। এগুলো **leading half-strand**, textbook এদের বলে *reverse* half-strand।
- বাকি দুটোতে polymerase-কে fork-এর উল্টো দিকে চলতে হয়। সে অপেক্ষা করে যতক্ষণ না fork প্রায় 2,000 base খুলে দেয়, তারপর oriC-র দিকে পিছিয়ে একটা ছোট **Okazaki fragment** বানায়, তারপর আবার একই কাজ। এগুলো **lagging half-strand** (*forward* half-strand)। fragment-গুলো জোড়া লাগায় **DNA ligase**।

:::story একটা উপমা: বৃত্তাকার রেসট্র্যাক নতুন করে পাকা করা
একটা বৃত্তাকার রেসট্র্যাক কল্পনা করুন, যার দুটো লেন, মানে দুটো strand। আপনাকে দুটো লেনেরই একদম নতুন একটা কপি বানাতে হবে, আর আপনার রাস্তা-পাকা করার মেশিনের (**DNA polymerase**) একটা অলঙ্ঘনীয় নিয়ম আছে: **সে শুধু একদিকেই চলতে পারে** (5′→3′ নিয়ম)।

- যেখানে খুশি শুরু করা যাবে না: কর্মীদের শুরু করতে হবে অফিসিয়াল start line, **oriC** থেকে। সেখানে তারা লেন দুটো আলাদা করে টেনে খোলে, ফলে একটা "bubble" তৈরি হয় যার দুই প্রান্তে দুটো কাজের এলাকা (**replication fork**), যারা ট্র্যাক বরাবর একে অপরের থেকে দূরে সরে যায়।
- একটা কাজের এলাকা অনুসরণ করুন। একটা লেনে মেশিনের অনুমোদিত দিক আর এলাকাটা যেদিকে সরছে, দুটো মিলে যায়। তাই মেশিন এলাকার পেছন পেছন মসৃণভাবে চলে, আর পুরো লেন একটানা এক টুকরোয় পাকা হয়: এটাই **leading strand**।
- অন্য লেনে মেশিনটা উল্টো দিকে মুখ করে আছে। তাই কর্মীরা অপেক্ষা করে যতক্ষণ না একটা অংশ (প্রায় 2,000 base) খুলে যায়, তারপর সেই অংশের দূর প্রান্তে মেশিন নামায়, আর মেশিন **পেছন দিকে** পাকা করতে করতে আগের পাকা টুকরোয় গিয়ে ঠেকে। তারপর পরের অংশের জন্য অপেক্ষা, এভাবে চলতে থাকে। এই পেছনমুখী টুকরোগুলোই **Okazaki fragment**, আর আলকাতরা দিয়ে জোড়া বন্ধ করার একটা মেশিন (**DNA ligase**) টুকরোগুলোর মাঝের ফাঁক সিল করে দেয়: এটাই **lagging strand**।
- দুটো কাজের এলাকা × (একটা leading + একটা lagging) = **একসাথে চারটা পাকা করার কাজ চলছে**। slide-এ "four DNA polymerases" বলতে এটাই বোঝানো হয়েছে।

**একজন computer scientist কেন এটা নিয়ে ভাববেন:** lagging লেনটা পরের মেশিনের অপেক্ষায় অনেকক্ষণ খোলা অবস্থায়, একা (single) পড়ে থাকে। খোলা লেনের ক্ষতি বেশি হয়। পরের section এই ক্ষতিটাকেই একটা algorithm-এ রূপ দেয়।
:::

মূল পার্থক্যটা হলো: একটা lagging half-strand তার পরের fragment তৈরি হওয়ার অপেক্ষায় অনেক বেশি সময় **single-stranded** অবস্থায় পড়ে থাকে।

{{widget:replication-fork}}

{{ref:intro#replication-copying-the-genome}}

## Deamination আর skew diagram

বাংলা walkthrough-টা ঠিক chapter-এর এই অংশ (skew আর approximate matching) দিয়েই এগিয়েছে। চাইলে পড়ার আগে দেখে নিন।

{{video:Ec_pEQENfsE}}

**single-stranded থাকার সময়টা কেন গুরুত্বপূর্ণ।** single-stranded DNA-তে double-stranded DNA-র চেয়ে অনেক দ্রুত mutation হয়। এ ধরনের সবচেয়ে সাধারণ mutation হলো **cytosine-এর deamination**: C একটা amine group হারিয়ে কার্যত T-তে পরিণত হয়। লাখ লাখ বছর ধরে এটা যে half-strand বেশি সময় single-stranded থাকে, তার থেকে ধীরে ধীরে C কমিয়ে দেয়।

**এর ফল।** এই mutation-গুলোর কারণে forward (lagging) half-strand-এ শেষমেশ **G-এর চেয়ে C কম** থাকে, আর তার সঙ্গী reverse half-strand-এ **C-এর চেয়ে G কম** থাকে। এখন যদি genome-এর একটা strand ধরে শুরু থেকে শেষ পর্যন্ত হাঁটেন আর #G − #C-এর একটা চলমান যোগফল রাখেন:
- **reverse** half-strand-এ (terC থেকে oriC), যোগফলটা **কমার** প্রবণতা দেখায়;
- **forward** half-strand-এ (oriC থেকে terC), এটা **বাড়ার** প্রবণতা দেখায়।

**Skew।** $\text{Skew}_i(\text{Genome})$-কে সংজ্ঞায়িত করি প্রথম i টা nucleotide-এ #G − #C হিসেবে, যেখানে $\text{Skew}_0 = 0$। এটা আসলে একটা চলমান যোগফল (running sum):

$$\text{Skew}_i = \text{Skew}_{i-1} + \begin{cases}+1 & \text{if } Genome_i = G\\ -1 & \text{if } Genome_i = C\\ 0 & \text{if A or T}\end{cases}$$

i-এর বিপরীতে $\text{Skew}_i$ plot করলে পাওয়া যায় **skew diagram**। reverse half-strand-এ থাকার সময় skew নামতে থাকে, **ঠিক যেখানে reverse half-strand শেষ হয়ে forward half-strand শুরু হয়, সেখানে সর্বনিম্ন (minimum) বিন্দুতে পৌঁছায়, আর সেটাই oriC**, তারপর আবার উঠতে থাকে। terC থাকে maximum-এর কাছাকাছি।

:::example হাতে skew হিসাব করা
`CATTCCGGA`-এর জন্য প্রতিটা G-তে +1, প্রতিটা C-তে −1, আর বাকিগুলোতে 0 যোগ করুন:

| i | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| অক্ষর | C | A | T | T | C | C | G | G | A |
| Skewᵢ | −1 | −1 | −1 | −1 | −2 | **−3** | −2 | −1 | −1 |

minimum, −3, আছে i = 6-এ। উল্টো দিক থেকেও পড়া যায়: যদি Skew₁₀₀ = 1 আর Skew₁₀₁ = 2 হয়, তাহলে skew 1 বেড়েছে, তাই nucleotide 101 অবশ্যই **G**।
:::

{{widget:skew}}

**Minimum Skew Problem** (Rosalind BA1F): যেসব i-তে Skewᵢ সর্বনিম্ন, সবগুলো খুঁজে বের করা। বাম থেকে ডানে একবার গেলেই সব prefix sum হিসাব হয়ে যায়, তাই সময় লাগে O(n)। *E. coli*-তে minimum পড়ে মোটামুটি position 3,923,620-এ, পরীক্ষাগারে জানা oriC-র খুব কাছে।

:::think কারণগুলোকে একটা শিকলের মতো সাজিয়ে ব্যাখ্যা করুন: skew-এর minimum কেন oriC চিহ্নিত করে?
DNA polymerase শুধু একদিকে কাজ করে → প্রতিটা fork-এ একটা একটানা leading strand আর একটা খণ্ড খণ্ড lagging strand থাকে → lagging strand-এর template বেশি সময় single-stranded থাকে → single-stranded DNA-তে C→T deamination অনেক বেশি ঘটে → বিবর্তনের দীর্ঘ সময়ে একটা half-strand C হারায় (আর তার সঙ্গী হারায় G) → genome ধরে হাঁটলে #G − #C এক অর্ধেকে কমে, অন্য অর্ধেকে বাড়ে → যেখানে দিক বদলায়, অর্থাৎ minimum, সেখানেই দুই অর্ধেক মিলেছে: **oriC**।
:::

:::think একটা নতুন bacterium-এর skew-এর minimum position 1,500,000-এ আর maximum 3,000,000-এ। oriC আর terC কোথায়?
**oriC ≈ 1,500,000** (minimum: এখানে skew কমা থেকে বাড়ার দিকে মোড় নেয়) আর **terC ≈ 3,000,000** (maximum: replication fork-গুলো এখানে মিলিত হয়, বৃত্তে oriC-র মোটামুটি বিপরীত দিকে)।
:::

:::think আগে skew হিসাব করে পরে word খোঁজা কেন, উল্টোটা নয় কেন?
খরচের কারণে। লাখ লাখ base জুড়ে প্রতিটা 9-mer-এর clump, mismatch আর reverse complement সহ খোঁজা ব্যয়বহুল, আর তাতে অনেক ভুল candidate উঠে আসে। skew মাত্র একবারের **O(n)** pass, যেটা খোঁজার জায়গা লাখ লাখ base থেকে কয়েকশো base-এ নামিয়ে আনে। দামি search-টা শুধু সেই window-এ চালালে কাজ অনেক দ্রুত হয়, noise-ও অনেক কম থাকে।
:::

:::think deamination যদি C-কে T বানায়, তাহলে A−T skew না দেখে G−C skew দেখি কেন?
একই mutation A আর T-কেও কিছুটা সরিয়ে দেয়, আর অনেক bacterium-এ দুর্বল একটা A−T skew সত্যিই দেখা যায়। কিন্তু বাস্তবে bacterial genome-গুলোতে replication-এর signal হিসেবে G−C skew-ই **বেশি শক্তিশালী আর বেশি সামঞ্জস্যপূর্ণ**। A আর T-এর পরিমাণ অন্য কিছু শক্তির টানেও ওঠানামা করে, যেমন gene কোন strand-এ বসে আছে বা codon usage, তাই A−T signal-এ noise বেশি। গবেষকরা কখনো কখনো দুটো একসাথে ব্যবহার করেন, কিন্তু প্রথম নজর দেওয়ার মানক পদ্ধতি হলো G−C skew।
:::

skew diagram আঁকা আর তা থেকে oriC পড়ে নেওয়ার একটা ছোট প্রদর্শনী:

{{video:C2gQTVyq35E}}

{{game:skew-hunter}}

## Approximate match: Hamming distance

*E. coli*-র skew minimum থেকে আমরা একটা candidate অঞ্চল পেয়েছি। এবার সেখানে DnaA box খুঁজি। অবাক কাণ্ড: reverse complement গুনলেও **কোনো 9-mer 3 বা তার বেশিবার আসে না**। কেন? কারণ *E. coli*-র DnaA box-গুলোতে ছোটখাটো **ভিন্নতা (variation)** আছে। DnaA তার আদর্শ site থেকে এক-দুই অক্ষর আলাদা sequence-এও bind করতে পারে, অর্থাৎ জীববিজ্ঞান mismatch সহ্য করে, আর আমাদের হুবহু-মিল গোনা সেগুলো ধরতে পারে না।

"প্রায় মিল" গুনতে হলে দুটো string-এর মধ্যে একটা দূরত্ব মাপার উপায় লাগবে:

- সমান দৈর্ঘ্যের দুটো string-এর **Hamming distance** হলো যতগুলো position-এ তারা আলাদা, সেই সংখ্যা। `CGAAT` আর `CGGAC` আলাদা position 3 আর 5-এ, তাই distance 2।
- Text-এর কোনো k-mer-এর সাথে Pattern-এর Hamming distance ≤ d হলে বলা হয় *Pattern* *Text*-এ **সর্বোচ্চ d mismatch সহ** আছে।
- $\text{Count}_d(Text, Pattern)$ এরকম সব approximate occurrence গোনে।

**উদাহরণ (slide থেকে)।** $\text{Count}_1$(`AACAAGCTGATAAACATTTAAAGAG`, `AAAAA`) = **4**: 5-mer `AACAA`, `ATAAA`, `AAACA` আর `AAAGA`-এর প্রত্যেকটা AAAAA থেকে এক position-এ আলাদা। লক্ষ করুন, AAAAA নিজে text-এ একবারও নেই। সর্বোচ্চ 2 mismatch ধরলে count বেড়ে হয় **11** (widget-এ চেষ্টা করে দেখুন)।

:::think ACGT থেকে Hamming distance 2-এর মধ্যে কয়টা 4-mer আছে?
নির্দিষ্ট distance ধরে ধরে গুনুন:
- **Distance 0:** শুধু ACGT নিজে, তাই **1**।
- **Distance 1:** 4টা position-এর 1টা বেছে নিন, সেখানে বাকি 3টা অক্ষরের একটা বসান: 4 × 3 = **12** (CCGT, GCGT, TCGT, AAGT, …, ACGG)।
- **Distance 2:** 4টা position-এর 2টা বেছে নেওয়ার উপায় $\binom{4}{2} = 6$, আর সেগুলোতে অক্ষর বসানোর উপায় 3 × 3 = 9: 6 × 9 = **54**।

মোট: 1 + 12 + 54 = **67**। সাধারণভাবে একটা k-mer-এর d-neighbourhood-এ সদস্য থাকে $\sum_{i=0}^{d}\binom{k}{i}3^i$টা, যা d বাড়ার সাথে খুব দ্রুত বাড়ে। এজন্যই অনেক mismatch নিয়ে খোঁজা ব্যয়বহুল হয়ে পড়ে।
:::

{{ref:math#distances-and-similarity}}

{{widget:approx-match}}

## Mismatch আর reverse complement সহ frequent word

এবার আইডিয়াগুলো জোড়া লাগাই। **সর্বোচ্চ d mismatch সহ most frequent k-mer** হলো এমন একটা k-mer Pattern, যেটা সম্ভাব্য **সব** $4^k$টা k-mer-এর মধ্যে $\text{Count}_d(Text, Pattern)$-কে সর্বোচ্চ করে। গুরুত্বপূর্ণ কথা: এটার **Text-এ আদৌ থাকার দরকার নেই**। ওপরের AAAAA তার ভালো উদাহরণ: হুবহু একবারও আসেনি, কিন্তু এর 4টা প্রায়-occurrence আছে।

**কীভাবে দক্ষ করা যায়।** সব $4^k$টা pattern চেষ্টা করা ধীর ($4^9 \approx 262{,}000$টা pattern, প্রতিটাকে text-এর সাথে scan করতে হবে)। কৌশলটা হলো উল্টো দিক থেকে, text থেকে শুরু করা:

1. Text-এর প্রতিটা k-mer-এর **d-neighbourhood** বানান: এর থেকে Hamming distance d-এর মধ্যে থাকা সব string। d = 1 হলে একটা k-mer-এর neighbour 1 + 3kটা (নিজে, আর k-টা position-এর প্রতিটায় 3টা বিকল্প অক্ষর); k = 9 হলে সেটা 28।
2. প্রতিটা neighbour-এর জন্য frequency table-এ তার ঘরে এক যোগ করুন।
3. যে neighbour-গুলোর মোট সবচেয়ে বেশি, সেগুলোই mismatch সহ most frequent k-mer।

এভাবে শুধু সেই pattern-গুলোই গোনা হয় যেগুলো text-এর কোনো কিছুর কাছাকাছি, আর তাদের সংখ্যা $4^k$-এর চেয়ে অনেক কম।

**Reverse complement যোগ করা** (Rosalind BA1J): $\text{Count}_d(Text, P) + \text{Count}_d(Text, \overline{P})$-কে সর্বোচ্চ করুন, যেখানে $\overline{P}$ হলো P-এর reverse complement, কারণ একটা DnaA box যেকোনো strand-এ বসে থাকতে পারে।

**ফলাফল।** *E. coli*-র skew minimum-এর চারপাশে মোটামুটি 500 base-এর একটা window-এ k = 9 আর d = 1 নিয়ে এটা চালালে পাওয়া যায় **TTATCCACA** আর তার reverse complement **TGTGGATAA**। এগুলো সত্যিকারের, পরীক্ষাগারে নিশ্চিত হওয়া DnaA box। দুটো দুর্বল signal একসাথে (skew অঞ্চলটা ছোট করে দেয়, approximate frequent word বার্তাটা খুঁজে বের করে) এমন একটা সমস্যার সমাধান করল, যেটা কোনোটাই একা পারত না।

:::think skew-এর তিনটা আলাদা position-এ একই minimum মান। কী করবেন?
তিনটাকেই candidate origin হিসেবে ধরুন। **প্রতিটার** চারপাশে কয়েকশো base-এর window-এ mismatch আর reverse complement সহ frequent word চালান, আর যে window-এ DnaA-box candidate-গুলোর সবচেয়ে বিশ্বাসযোগ্য গুচ্ছ পাওয়া যায় (দুই strand-এই কয়েকটা প্রায় একই রকম 9-mer), সেটাকে প্রাধান্য দিন। কোনোটাই আলাদা করে চোখে না পড়লে বুঝতে হবে genome-টার skew অস্বাভাবিক, আর তখন পরীক্ষাগারের data লাগবে।
:::

:::warn একজন গবেষকের যে সতর্কতাগুলো জানা উচিত
- skew-এর কৌশল অনেক bacterium-এ ভালো কাজ করে, কিন্তু সবগুলোতে নয়: কিছু genome-এ skew দুর্বল, কিছুতে একাধিক origin থাকে (archaea), আবার কিছুতে rearrangement হয়ে pattern এলোমেলো হয়ে যায়।
- eukaryotic chromosome-এ হাজার হাজার origin থাকে, আর DnaA box-এর মতো কোনো একক consensus নেই। এগুলো খুঁজে বের করা এখনো সক্রিয় গবেষণার বিষয়, আর তা শুধু sequence-এর ওপর নয়, পরীক্ষাগারের data-র (যেমন OK-seq, ORC ChIP-seq) ওপর নির্ভর করে।
- "অস্বাভাবিক বেশি frequent" সবসময় মানে "একটা background model-এর তুলনায়"। 500 base-এ একটা 9-mer-এর 3 বার আসা অবাক করার মতো, কিন্তু একটা 3-mer-এর জন্য নয়।
:::

{{game:complement-rush}}

## সারসংক্ষেপ

| Problem | Input → Output | আইডিয়া / complexity |
|---|---|---|
| PatternCount | Text, Pattern → count | window সরিয়ে সরিয়ে, O(nk) |
| FrequentWords | Text, k → most frequent k-mers | hash-map frequency table, O(nk) |
| Reverse complement | Pattern → revcomp | উল্টানো + complement, O(k) |
| Pattern matching | Pattern, Genome → positions | naive O(nk); দ্রুততর পদ্ধতি Read Mapping-এ |
| Clump finding | Genome, k, L, t → k-mers | sliding-window count |
| Minimum skew | Genome → minimum-এর positions | running sum (prefix sum), O(n) |
| Approximate matching | Text, Pattern, d → positions | Hamming distance ≤ d |
| Mismatch সহ frequent word (+ reverse complement) | Text, k, d → k-mers | d-neighbourhood + hash map |

**পুরো গল্প এক লাইনে:** শুধু frequency দিয়ে candidate পাওয়া যায়, clump বলে "কাছাকাছি", skew বলে "এখানে", আর reverse complement সহ approximate matching আসল DnaA box-গুলো খুঁজে বের করে।
