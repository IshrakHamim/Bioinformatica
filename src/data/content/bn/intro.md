আপনি একজন computer scientist। ধরে নিন আপনার নতুন "programming language"-এ অক্ষর মাত্র 4টা, এর program-গুলো প্রায় 3 billion অক্ষর লম্বা, আর সেগুলো চলে এমন hardware-এ (cell) যা নিজেই program-গুলো কপি করে, সম্পাদনা করে এবং execute করে। পরের প্রতিটা algorithm-কে তার biological প্রেক্ষাপটে বুঝতে যতটুকু molecular biology লাগে, এই module ঠিক ততটুকু শেখাবে। Biology-র কোনো পূর্বজ্ঞান ধরে নেওয়া হয়নি।

:::tip Lesson-গুলো কীভাবে ব্যবহার করবেন
প্রতিটা অংশ পড়ুন, widget-গুলো নিজে চালিয়ে দেখুন (এগুলো live: input বদলে দেখুন কী হয়), আর শেষ হলে **Mark complete** চাপুন। Video-গুলো রাখা হয়েছে যেখানে সবচেয়ে বেশি কাজে লাগে: কিছু video কোনো অংশ পড়ার *আগে* দেখা ভালো, কিছু *পরে* recap হিসেবে, আর লেখাতেই বলে দেওয়া আছে কোনটা কখন। কোনো ধাপে যদি এমন গণিত বা algorithm আসে যেটা নিয়ে আপনি নিশ্চিত নন, তাহলে **🧱 Stuck? Quick refresher** chip-গুলো ঠিক দরকারি foundation অংশটা lesson-এর ভেতরেই খুলে দেয়।
:::

Biology-তে ঢোকার আগে, একজন computational genomics অধ্যাপকের এই ছোট talk-টা দেখে নিন। Sequencing আর string algorithm কেন biology-র কেন্দ্রে চলে এল, তিনি সেটা ব্যাখ্যা করেছেন। পুরো কোর্সটা কোন দৃষ্টিভঙ্গি থেকে দেখবেন, তার জন্য এটা একটা ভালো কাঠামো।

{{video:hpb-mH-yjLc}}

## Bioinformatics বনাম computational biology

- **Bioinformatics** হলো কম্পিউটার দিয়ে biological data সংগ্রহ, সংরক্ষণ, গোছানো আর বিশ্লেষণ করা, বিশেষ করে DNA, RNA আর protein sequence। মাথায় রাখুন: *tool, database, pipeline*।
- **Computational biology** গাণিতিক model, algorithm আর simulation ব্যবহার করে *biological system আসলে কীভাবে কাজ করে তা বোঝার* চেষ্টা করে। মাথায় রাখুন: *প্রশ্ন আর model*।

বাস্তবে দুটো একে অপরের সঙ্গে মিশে যায়, আর বেশিরভাগ গবেষক দুটোই কিছু কিছু করেন। আপনি যে কোর্সটা পড়ছেন (CSE443), সেটা **Compeau & Pevzner-এর *Bioinformatics Algorithms: An Active Learning Approach***-এর algorithmic ধারা অনুসরণ করে। প্রতিটা topic শুরু হয় একটা biological প্রশ্ন দিয়ে, তারপর সেটাকে একটা সুনির্দিষ্ট computational problem-এ রূপ দেওয়া হয়, এবং শেষে তার জন্য algorithm design করা হয়।

:::cs বারবার ফিরে আসা রেসিপি
1. **Biology:** "একটা bacterium-এ DNA replication কোথা থেকে শুরু হয়?"
2. **Problem:** *Input:* একটা DNA string *Genome*। *Output:* replication origin-এর position।
3. **Algorithm:** ছোট ছোট word গোনা, GC skew হিসাব করা, …
4. **বাস্তবের সঙ্গে মিলিয়ে দেখা:** আমরা কী কী ধরে নিয়েছিলাম, আর আসল data কীভাবে সেই অনুমান ভেঙে দেয়?
:::

{{ref:algo#reading-a-problem-input-output}}

**কোর্সে কী কী আছে** (প্রথম lecture অনুযায়ী): DNA-তে লুকানো বার্তা খোঁজা → genome assembly → sequencing technology আর read mapping → gene expression analysis (clustering, dimensionality reduction) → sequence alignment → phylogenetic tree → hidden Markov model → machine learning আর neural network → biological network। এরপর *Frontiers* track দেখায় এই ক্ষেত্রটা আজ কী নিয়ে কাজ করছে: AlphaFold, protein design আর genomic language model।

## Genome, gene, আর আমরা কেন একে অপরের থেকে আলাদা

**Cell।** প্রতিটা জীবই cell দিয়ে তৈরি। **Bacteria** (prokaryote) হলো nucleus ছাড়া একক cell; এদের DNA সাধারণত একটা বৃত্তাকার chromosome, যেটা cell-এর ভেতরে ভেসে থাকে। **Eukaryote**-রা (yeast, উদ্ভিদ, প্রাণী) তাদের DNA একটা **nucleus**-এর ভেতরে রাখে, কয়েকটা linear chromosome আকারে।

**Genome।** একটা জীবের সব DNA মিলিয়ে তার **genome**। একটা মানুষের cell-এ ~3.1 billion base-pair-এর genome-এর দুটো কপি থাকে, প্রতিটা biological পিতা-মাতার একজনের কাছ থেকে পাওয়া, তাই প্রতিটা cell-এ মোট প্রায় **6 billion অক্ষর**। একটা cell-এর DNA টেনে সোজা করলে প্রায় 2 m লম্বা হবে; সেটাকে কিছু protein (histone)-এর চারপাশে পেঁচিয়ে **chromatin** আকারে গুটিয়ে রাখা হয়।

**Chromosome।** Genome ভাগ করা থাকে কয়েকটা **chromosome**-এ: মানুষের আছে 23 জোড়া। একটা cell বিভাজিত হওয়ার আগে প্রতিটা chromosome ঘন হয়ে পাঠ্যবইয়ের ছবির সেই চেনা X-আকৃতির রূপ নেয়।

**Gene।** **Gene** হলো DNA-র একটা অংশ, যেটা কোনো একটা product, সাধারণত একটা protein, তৈরির নির্দেশ বহন করে। মানুষের প্রায় **20,000 protein-coding gene** আছে, আর protein-coding sequence পুরো genome-এর মাত্র প্রায় **1–2%**। বাকিটার মধ্যে আছে regulatory switch, non-coding RNA-র gene, বারবার পুনরাবৃত্ত sequence, আর অনেক কিছু যার কাজ এখনো অজানা।

:::story রান্নার বই হিসেবে genome
- **Genome** হলো একটা রান্নার বই, আর আপনার শরীরের প্রতিটা cell-এ এর একটা সম্পূর্ণ কপি আছে।
- একটা **gene** হলো একটা রেসিপি। **Chromosome** হলো সেই খণ্ডগুলো, যাতে বইটা বাঁধাই করা।
- মূল কপিটা কখনো লাইব্রেরি (nucleus) ছেড়ে যায় না। রান্না করতে হলে cell একটা রেসিপির ফেলে দেওয়ার মতো একটা **ফটোকপি** বানায়, সেটাই **mRNA** (transcription)।
- **Ribosome** হলো রান্নাঘর: এটা ফটোকপিটা একবারে তিন অক্ষর করে পড়ে আর পদটা জোড়া লাগায়, সেটাই **protein** (translation)।
- একটা liver cell আর একটা neuron-এর রান্নার বই একই, কিন্তু তারা আলাদা আলাদা রেসিপি রাঁধে। কোন রেসিপি, কখন, আর কতটা, সেই সিদ্ধান্ত নেওয়াই **gene regulation**, আর কাজটা করে **transcription factor**-রা, অর্থাৎ সেই switch-গুলো যা আপনি Motifs lesson-এ খুঁজবেন।
- একটা variant হলো বইয়ের একটা কপিতে একটা ছাপার ভুল। অনেকগুলোই নিরীহ; কিছু একটা রেসিপি নষ্ট করে দেয়।
:::

**Variation।** যেকোনো দুজন মানুষের DNA sequence প্রায় **99.9% অভিন্ন**। বাকি ~0.1% শুনতে কম লাগলেও সেটা লক্ষ লক্ষ position, যাদের বলে **genetic variant**। মাত্র একটা অক্ষর বদলে গেলেই একটা protein-এর আকৃতি বদলে যেতে পারে, কিংবা বদলে যেতে পারে সেটা কতটা তৈরি হয়, অথবা কখন আর কোথায় হয়। Variant-গুলো বৈশিষ্ট্য (চোখের রং, উচ্চতা), রোগের ঝুঁকি আর ওষুধে সাড়া দেওয়ার ধরনে ভূমিকা রাখে। এগুলো খুঁজে বের করা bioinformatics-এর প্রধান কাজগুলোর একটা (variant calling)।

:::bio Genotype → phenotype
**Genotype** হলো আপনি যে DNA বহন করেন। **Phenotype** হলো যা চোখে দেখা যায়: বৈশিষ্ট্য, রোগ, আচরণ। Genome-ই সব নির্ধারণ করে দেয় না: DNA-র ওপর রাসায়নিক চিহ্ন (epigenetics, যেমন DNA methylation), পরিবেশ আর দৈবচয়ন, সবই phenotype গড়ে তোলে। আপনার শরীরের প্রায় প্রতিটা cell-এর genome একই, তবু একটা neuron আর একটা skin cell দেখতে ও আচরণে সম্পূর্ণ আলাদা। একই program, ভিন্ন execution। কোন cell-এ কোন gene চালু থাকবে, সেটা ঠিক করে **gene regulation**।
:::

**Genetic রোগ।** DNA-র একটা পরিবর্তন হতে পারে **বংশগত (inherited)** (জন্ম থেকেই থাকে, পরিবারে চলে আসে, যেমন cystic fibrosis), অথবা জীবদ্দশায় **অর্জিত (acquired)**। অর্জিত পরিবর্তনের ক্লাসিক উদাহরণ cancer: একটা tissue-তে mutation জমতে জমতে একসময় cell-গুলো নিয়ন্ত্রণ ছাড়া বিভাজিত হতে থাকে। বেশিরভাগ variant নিরীহ; অল্প কয়েকটা একটা protein-কে নষ্ট করে বা বদলে দেয়।

**Model organism।** জীববিজ্ঞানীরা সরল জীব থেকে সাধারণ নিয়মগুলো শেখেন। Budding yeast *Saccharomyces cerevisiae* (~12 million bp, ~6,000 gene, 16টা chromosome) ছিল প্রথম eukaryote যার genome পুরোপুরি sequence করা হয় (1996)। *E. coli*-র মতো bacteria, fruit fly আর mouse হলো গবেষণাগারে বহুল ব্যবহৃত আরও কয়েকটা model organism।

## DNA: চার অক্ষরের অণু

DNA (deoxyribonucleic acid) হলো **nucleotide** নামের building block দিয়ে তৈরি একটা লম্বা শিকল, অর্থাৎ একটা **polymer**। প্রতিটা nucleotide-এর তিনটা অংশ: একটা **phosphate**, **deoxyribose** নামের একটা চিনি (sugar), আর চারটা **base**-এর যেকোনো একটা। Sugar আর phosphate মিলে তৈরি করে মেরুদণ্ড বা backbone; base-গুলোই হলো "অক্ষর"।

| Base | ধরন | Ring | কার সঙ্গে জোড় বাঁধে | Hydrogen bond |
|---|---|---|---|---|
| **A** adenine | purine | 2 | T | 2 |
| **G** guanine | purine | 2 | C | 3 |
| **C** cytosine | pyrimidine | 1 | G | 3 |
| **T** thymine | pyrimidine | 1 | A | 2 |

**Double helix।** DNA সাধারণত দুটো strand হিসেবে থাকে, যারা একে অপরকে পেঁচিয়ে আছে। একটা strand-এর base-গুলো অন্য strand-এর base-গুলোর সঙ্গে **hydrogen bond** দিয়ে জোড় বাঁধে: A সবসময় T-এর সঙ্গে, C সবসময় G-এর সঙ্গে। তাই দুটো strand **complementary**: একটা strand জানলে অন্যটা হুবহু জানা যায়। এ কারণেই DNA কপি করা যায়, আর এ কারণেই একটা strand sequence করাই যথেষ্ট।

G–C জোড়ায় তিনটা hydrogen bond, A–T জোড়ায় মাত্র দুটো, তাই **GC-rich DNA বেশি শক্তভাবে জোড়া লেগে থাকে**, আর AT-rich অঞ্চল সহজে আলাদা করা যায়। এ কারণেই replication origin আর promoter-গুলো সাধারণত AT-rich হয়।

**দিক (direction)।** প্রতিটা strand-এর একটা দিক আছে। Sugar-এর carbon atom-গুলোর নম্বর অনুযায়ী এক প্রান্তকে বলে **5′** ("five prime") আর অন্য প্রান্তকে **3′**। একটা helix-এর দুটো strand চলে **বিপরীত** দিকে (এরা **antiparallel**)। প্রথা অনুযায়ী আমরা সবসময় একটা strand লিখি 5′ থেকে 3′ দিকে।

```text
5′-ATGATCAAG-3′     top strand, read left to right
3′-TACTAGTTC-5′     bottom strand: complementary, running the other way
```

**Reverse complement।** নিচের strand-টাকে standard 5′→3′ দিকে লিখতে হলে সেটা ডান থেকে বামে পড়ুন: `CTTGATCAT`। Code-এর ভাষায়: string-টা **reverse** করুন, আর প্রতিটা অক্ষরের **complement** নিন। Bioinformatics-এ এটাই সবচেয়ে বেশি ব্যবহৃত একক operation, কারণ একটা read, একটা binding site বা একটা gene যেকোনো strand-এই থাকতে পারে।

$$\text{revcomp}(\texttt{ATGATCAAG}) = \texttt{CTTGATCAT}$$

```python
def reverse_complement(s):
    comp = {"A": "T", "T": "A", "C": "G", "G": "C"}
    return "".join(comp[b] for b in reversed(s))
```

নিচে একটা strand বানান আর দেখুন তার complement ও reverse complement কীভাবে সঙ্গে সঙ্গে বদলায়।

{{widget:dna-builder}}

**Upstream আর downstream।** একটা gene-এর সাপেক্ষে তার 5′ দিকের sequence হলো **upstream** (যেখানে সাধারণত gene-টাকে চালু করার switch-গুলো বসে থাকে), আর 3′ দিকের sequence হলো **downstream**। Gene যেকোনো strand-এ থাকতে পারে, তাই "upstream" সবসময় gene-টার নিজের দিকের সাপেক্ষে বোঝায়।

## Replication: genome কপি করা

Watson আর Crick double helix নিয়ে তাঁদের 1953 সালের paper শেষ করেছিলেন একটা বিখ্যাত, ইচ্ছাকৃতভাবে সংযত বাক্য দিয়ে: *"It has not escaped our notice that the specific pairing we have postulated immediately suggests a possible copying mechanism for the genetic material."* (অর্থাৎ, তাঁরা যে নির্দিষ্ট জোড় বাঁধার কথা বলছেন, সেটা থেকেই genetic material কপি হওয়ার একটা সম্ভাব্য উপায় সরাসরি বোঝা যায়।) যেহেতু প্রতিটা strand অন্যটাকে নির্ধারণ করে দেয়, তাই প্রতিটা strand-ই একটা নতুন সঙ্গী strand বানানোর template হতে পারে।

আগে এই ছোট animation-টা দেখে নিন; নিচের ধাপগুলো তারপর আপনি যা দেখলেন সেগুলোর নাম দেবে।

{{video:TNKWgcFPHqw}}

1. **খুলে যাওয়া (unwinding)।** দুটো strand আলাদা হতে শুরু করে একটা নির্দিষ্ট জায়গা থেকে, যাকে বলে **origin of replication** (bacteria-তে **oriC**)। আলাদা হওয়ার ফলে একটা Y-আকৃতির **replication fork** তৈরি হয়, যেটা DNA বরাবর এগিয়ে চলে।
2. **Template।** প্রতিটা পুরনো strand একটা template। **DNA polymerase** নামের enzyme একটা template ধরে হেঁটে যায় আর প্রতিটা position-এ complementary nucleotide জুড়ে দেয়।
3. **একমুখী নিয়ম।** DNA polymerase নতুন strand বানাতে পারে কেবল **5′→3′** দিকে (template পড়ে 3′→5′ দিকে)। একটা নতুন strand, **leading strand**, fork যেদিকে এগোয় সেদিকেই মুখ করে থাকে, তাই সেটা একটানা তৈরি হয়।
4. **Lagging strand।** অন্য নতুন strand-টা উল্টো দিকে মুখ করা। সেটা তৈরি হয় **পেছনের দিকে, ছোট ছোট টুকরোয়**, যাদের বলে **Okazaki fragment** (bacteria-তে প্রায় 1,000–2,000 base), আর fork আরও খানিকটা DNA খুললেই একেকটা নতুন টুকরো শুরু হয়। তারপর **DNA ligase** enzyme টুকরোগুলো জুড়ে দেয়।
5. **ফলাফল।** দুটো double helix, প্রতিটায় একটা পুরনো আর একটা নতুন strand। একে বলে **semi-conservative** replication।

**কোর্সের জন্য এটা কেন গুরুত্বপূর্ণ।** Lagging strand বেশি সময় single-stranded অবস্থায় থাকে, আর single-stranded DNA-তে mutation হয় অন্যভাবে। বিবর্তনের দীর্ঘ সময় ধরে এর ফলে একটা bacterial chromosome-এর দুই অর্ধেকে G আর C-এর মধ্যে একটা মাপা যায় এমন ভারসাম্যহীনতা তৈরি হয়, যাকে বলে **GC skew**। পরের lesson এটাকেই একটা algorithm-এ পরিণত করে, যা oriC খুঁজে বের করে।

:::think DNA polymerase কেন fork-এর দিকেই, একটানা দুটো strand কপি করে ফেলতে পারে না?
কারণ এটা nucleotide জুড়তে পারে কেবল একটা বাড়ন্ত strand-এর **3′ প্রান্তে**, তাই নতুন DNA সবসময় 5′→3′ দিকে বাড়ে। দুটো template strand চলে বিপরীত দিকে, তাই তাদের একটার ওপর নতুন strand-কে বাড়তে হয় fork থেকে *দূরে সরে*। Cell এই সমস্যার সমাধান করে সেই strand-টা পেছনের দিকে ছোট ছোট Okazaki fragment-এ বানিয়ে, তারপর সেগুলো সেলাই করে জুড়ে দিয়ে। এই অসমতাটাকেই oriC lesson কাজে লাগায়।
:::

## Transcription: DNA → RNA

DNA মূল কপি হিসেবে nucleus-এ থেকে যায়। কোনো gene ব্যবহার করতে হলে cell **RNA** (ribonucleic acid)-তে একটা কাজের কপি বানায়। এটাই **transcription**।

**কীভাবে কাজ করে।**
- **Transcription factor** নামের protein-গুলো **promoter**-এ, অর্থাৎ gene-এর ঠিক upstream অঞ্চলে, ছোট ছোট সংকেতে bind করে এবং **RNA polymerase**-কে ডেকে আনে **transcription start site (TSS)**-এ।
- RNA polymerase DNA-র একটা strand পড়ে, যাকে বলে **template strand**, আর 5′→3′ দিকে একটা complementary RNA বানায়।
- ফলে RNA-র sequence হয় DNA-র *অন্য* strand-টার, অর্থাৎ **coding strand**-এর মতোই, শুধু **T-এর জায়গায় U**। এ কারণেই gene sequence লেখা হয় coding strand হিসেবে।

**RNA বনাম DNA।** RNA-তে T-এর বদলে থাকে base **U (uracil)**, এর sugar হলো **ribose** (deoxyribose মানে একটা oxygen atom কম থাকা ribose, তাই নামে "deoxy"), আর এটা সাধারণত **single-stranded**, তাই নিজের ওপর ভাঁজ হয়ে নানা আকৃতি নিতে পারে।

**Eukaryote-এ processing।** প্রথম RNA কপিটা (pre-mRNA) nucleus ছেড়ে যাওয়ার আগে সম্পাদিত হয়। এটা ঘটে transcription-এর পরে। (Lecture slide-এ একে "post-translational" বলা হয়েছে, যেটা একটা ভুল: সঠিক শব্দ হলো post-transcriptional।)
- **Splicing** **intron**-গুলো কেটে বাদ দেয় আর **exon**-গুলো (যে অংশগুলো থেকে যায়) জোড়া লাগায়। মানুষের gene-এর বেশিরভাগটাই intron: একটা gene-এর মোট দৈর্ঘ্যের তুলনায় exon হতে পারে খুবই ছোট একটা অংশ।
- **Alternative splicing** exon-গুলোর ভিন্ন ভিন্ন subset রাখে, ফলে একটা gene থেকেই একটা protein-এর কয়েকটা সংস্করণ (**isoform**) তৈরি হতে পারে।
- সামনে একটা **5′ cap** (একটা পরিবর্তিত G) আর শেষে একটা **poly(A) tail** (পরপর অনেকগুলো A) যোগ করা হয়। দুটোই RNA-কে রক্ষা করে এবং translation হতে সাহায্য করে।

**যে ধরনের RNA জানা দরকার:**

| RNA | কাজ |
|---|---|
| **mRNA** (messenger) | একটা protein-এর রেসিপি ribosome পর্যন্ত বয়ে নিয়ে যায় |
| **tRNA** (transfer) | adapter: এর 3-base-এর **anticodon** একটা codon-এর সঙ্গে জোড় বাঁধে, আর এটা মিলে যাওয়া amino acid-টা বহন করে |
| **rRNA** (ribosomal) | ribosome-এর কাঠামোগত ও catalytic মূল অংশ |
| **snRNA** (small nuclear) | splicing machinery-র অংশ |
| miRNA, lncRNA, … | অন্য gene-গুলোকে নিয়ন্ত্রণ করে (আধুনিক গবেষণায় প্রায়ই দেখা যায়) |

## Translation: RNA → protein আর genetic code

**Ribosome** একটা mRNA পড়ে একটা protein বানায়। এটা mRNA পড়ে তিনটা করে base-এর, পরস্পর overlap না করা দলে, যাদের বলে **codon**, আর প্রতিটা codon একটা **amino acid** (অথবা "stop") নির্দেশ করে।

**Codon গোনা।** 4টা base আর 3টা position মানে $4^3 = 64$টা codon, কিন্তু amino acid মাত্র 20টা। তাই code-টা **redundant** (একে *degenerate*-ও বলে): বেশিরভাগ amino acid-এর একাধিক codon আছে। যেমন, GCU, GCC, GCA আর GCG, সবগুলোর মানেই alanine।

- **AUG** হলো **start codon**; এটা methionine (M)-কেও code করে, তাই বেশিরভাগ protein শুরু হয় M দিয়ে।
- **UAA, UAG, UGA** হলো **stop codon**: এরা protein শেষ করে।
- 61টা sense codon + 3টা stop = 64।

**পুরো হিসাব করা উদাহরণ।** mRNA `AUG GCC UUU UAA` translate হয়ে হয় **M A F**, তারপর stop (methionine, alanine, phenylalanine)।

**Reading frame।** কোথা থেকে তিনটা তিনটা করে গোনা শুরু করছেন, তার ওপর নির্ভর করে একই string থেকে আলাদা protein পাওয়া যায়। DNA `ATGGCCTTTTAA` নিন:

| Frame | Codon | Protein |
|---|---|---|
| base 1 থেকে শুরু | ATG GCC TTT TAA | M A F (stop) |
| base 2 থেকে শুরু | TGG CCT TTT | W P F |
| base 3 থেকে শুরু | GGC CTT TTA | G L L |

প্রতিটা strand-এ 3টা frame, আর strand 2টা, তাই একটা DNA sequence-এর **6টা সম্ভাব্য reading frame** থাকে। একটা **open reading frame (ORF)** চলে একটা start codon থেকে পরের in-frame stop codon পর্যন্ত। লম্বা ORF হলো প্রথম সূত্র যে একটা অঞ্চল কোনো protein code করছে। Gene finding-এর শুরু এই ধারণা থেকেই।

:::think একটা gene-এর coding sequence-এ একটা অক্ষর বদলে গেল। এটা কখনো নিরীহ, কখনো বিপর্যয়কর হয় কেন, অথচ একটা অক্ষর মুছে ফেললে প্রায় সবসময়ই বিপর্যয় ঘটে?
একটা **substitution** একটা codon বদলায়। Code redundant বলে বদলে যাওয়া codon হয়তো একই amino acid-ই code করবে (একটা *synonymous* পরিবর্তন, প্রায়ই নিরীহ); হয়তো কাছাকাছি ধরনের একটা amino acid বসিয়ে দেবে; অথবা একটা stop codon তৈরি করে protein-টাকে মাঝপথে কেটে দেবে। কিন্তু **একটা base-এর insertion বা deletion** reading frame সরিয়ে দেয়: তার পরের প্রতিটা codon ভুলভাবে তিনটা করে দলে পড়া হয় (একে বলে **frameshift**), ফলে protein-এর বাকিটা অর্থহীন হয়ে যায় এবং সাধারণত অকালেই একটা stop-এ গিয়ে ঠেকে। এ কারণেই 3-এর গুণিতক সংখ্যক base-এর indel প্রায়ই তুলনামূলক ভালোভাবে সহ্য করা যায়।
:::

{{widget:central-dogma}}

{{game:codon-quest}}

এই animation-এ transcription আর translation একসঙ্গে দেখানো হয়েছে। শেষ দুটো অংশের recap হিসেবে এখন এটা দেখুন।

{{video:gG7uCskUOrA}}

## Protein: sequence → structure → function

Cell-এর বেশিরভাগ কাজ করে protein। এরা রাসায়নিক বিক্রিয়া ঘটায় এমন **enzyme**, **কাঠামোগত** তন্তু, **transporter** (hemoglobin oxygen বহন করে), **antibody**, **signal আর receptor**, আর পেশি সংকোচনের **motor**।

একটা protein হলো amino acid-এর একটা শিকল। 20টা amino acid-এর পার্থক্য তাদের side chain-এ: কোনোটা বড়, কোনোটা ছোট, কোনোটা charged, কোনোটা পানি এড়িয়ে চলে (**hydrophobic**)। শিকলটা একটা নির্দিষ্ট 3D আকৃতিতে ভাঁজ হয়, আর এর পেছনে বড় চালিকাশক্তি হলো hydrophobic side chain-গুলোর পানি থেকে দূরে ভেতরে লুকিয়ে থাকার প্রবণতা। জীববিজ্ঞানীরা structure-কে চারটা স্তরে বর্ণনা করেন:

1. **Primary:** amino acid sequence নিজেই, 20টা অক্ষরের ওপর একটা string হিসেবে লেখা (যেমন `MKTAYIAK…`)।
2. **Secondary:** backbone বরাবর hydrogen bond দিয়ে ধরে রাখা স্থানীয়, পুনরাবৃত্ত আকৃতি, প্রধানত **α-helix** (প্যাঁচানো spiral) আর **β-sheet** (পাশাপাশি সাজানো strand)।
3. **Tertiary:** একটা শিকলের সম্পূর্ণ 3D ভাঁজ।
4. **Quaternary:** কয়েকটা শিকল একসঙ্গে জুড়ে তৈরি গঠন। Hemoglobin চারটা শিকল (2 α + 2 β)।

{{video:hok2hyED9go}}

**Anfinsen's principle:** অনেক protein-এর ক্ষেত্রে শুধু amino acid sequence-ই ভাঁজ হওয়া structure নির্ধারণ করে দেয়, আর structure নির্ধারণ করে function। Sequence থেকে structure অনুমান করা ছিল 50 বছরের একটা বড় চ্যালেঞ্জ। **AlphaFold 2** (2020) একক protein শিকলের জন্য কার্যত এর সমাধান করে ফেলে, আর সেজন্যই এসেছে **2024 সালের রসায়নে Nobel Prize** (দেখুন *Frontiers* track)।

:::cs আপনার জন্য এটা কেন গুরুত্বপূর্ণ
- *Sequence কাছাকাছি → structure কাছাকাছি → function কাছাকাছি।* এ কারণেই **sequence alignment** এত কাজের: একটা নতুন gene যদি ভালোভাবে গবেষণা করা কোনো gene-এর সঙ্গে ভালোভাবে align হয়, তাহলে সম্ভবত সেটাও কাছাকাছি কোনো কাজ করে।
- Protein আসলে 20 অক্ষরের alphabet-এর ওপর string, আর DNA হলো 4 অক্ষরের ওপর string। String algorithm, probabilistic model আর language model, সবই সরাসরি এদের ওপর প্রয়োগ করা যায়।
:::

## Gene regulation: কখন আর কতটা

সব gene সবসময় সক্রিয় থাকে না। একটা liver cell-এর দরকার একটা neuron-এর চেয়ে ভিন্ন protein, আর একটা bacterium-এর দরকারি enzyme বদলায় সে কী খাবার পাচ্ছে তার ওপর। **Gene regulation** নিয়ন্ত্রণ করে প্রতিটা gene **কখন**, **কোথায়** আর **কতটা** express হবে।

- **Promoter** (gene-এর ঠিক upstream-এ) আর **enhancer** (কখনো হাজার হাজার base দূরে)-এর মধ্যে থাকে ছোট ছোট **regulatory motif**, সাধারণত 6–20 base লম্বা। এগুলো হলো **transcription factor (TF)**-দের bind করার জায়গা।
- একটা TF bind করলে সেটা RNA polymerase-কে হয় সাহায্য করে (*activator*), নয়তো বাধা দেয় (*repressor*)।
- একটা TF সাধারণত তার motif বহনকারী **অনেকগুলো gene** নিয়ন্ত্রণ করে। যে gene-গুলো একসঙ্গে চালু হয় তারা সাধারণত একসঙ্গে কাজ করে, তাই একদল gene-এ একটা সাধারণ motif খুঁজে পেলে তাদের function সম্পর্কে কিছু একটা জানা যায়। এটাই *Regulatory Motifs* lesson (motif খোঁজা) আর *Gene Expression* lesson-গুলোকে (একই রকম আচরণ করা gene খোঁজা) জুড়ে দেয়।
- Regulation feedback-সহ **network** তৈরি করে। উদ্ভিদের circadian clock একটা ক্লাসিক উদাহরণ: protein TOC1, LHY আর CCA1 gene-কে সক্রিয় করে, আর তাদের protein আবার TOC1-কে দমন করে, ফলে একটা দৈনিক দোলন (oscillation) তৈরি হয়। *Biological Networks* lesson এরকম system নিয়েই কাজ করে।

:::sota Data pipeline হিসেবে central dogma
DNA (genome sequencing, variant calling) → RNA (RNA-seq: কোন gene চালু আছে, আর সেগুলো কীভাবে splice হচ্ছে) → protein (mass-spectrometry proteomics, AlphaFold structure) → interaction (network)। প্রতিটা তীরচিহ্ন নিজেই একটা গবেষণা ক্ষেত্র, যার নিজস্ব "-omics" আর নিজস্ব data আছে।
:::

## কোথায় অনুশীলন করবেন

- **Rosalind** হলো কোর্সে ব্যবহৃত problem-solving platform। এই site-এর প্রতিটা বড় algorithm-এর **Further reading**-এ তার Rosalind problem-এর link দেওয়া আছে। শুরু করুন *Bioinformatics Textbook Track* দিয়ে: BA1A (একটা pattern গোনা), BA1C (reverse complement), এভাবে।
- Lecture notebook *Sequence_reads.ipynb* ধাপে ধাপে দেখায় Python string, reverse complement, একটা FASTA file থেকে genome পড়া, FASTQ আর Phred quality parse করা, এবং আসল read-গুলোকে φX174 virus genome-এর সঙ্গে exact matching করা। Sequencing আর Read Mapping lesson এই notebook-টাই অনুসরণ করে।

{{ref:tools#file-formats|tools#reading-fasta-and-fastq-in-python|tools#databases-you-will-use}}
