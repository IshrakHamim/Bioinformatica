এই course-এর প্রতিটা algorithm যে data নিয়ে কাজ করে, তা তৈরি হয় একটা **sequencer**-এ। নিজের analysis-এর ওপর ভরসা রাখতে, আর ফলাফল অদ্ভুত দেখালে সমস্যা খুঁজে বের করতে, আপনাকে জানতে হবে read কীভাবে তৈরি হয়, error দেখতে কেমন, আর sequencer প্রতিটা অক্ষর নিয়ে তার আত্মবিশ্বাস কীভাবে জানায়। এই lesson Human Genome Project থেকে শুরু করে আজকের long-read যন্ত্র পর্যন্ত সেই গল্পটা বলে।

lecture deck-টা Ben Langmead-এর DNA sequencing course থেকে নেওয়া। শুরুর আগে প্রেক্ষাপট বুঝতে তাঁর ছোট্ট ভূমিকাটা দেখে নিন:

{{video:hpb-mH-yjLc}}

## Human Genome Project আর প্রতিযোগিতা

- **1987 সালে প্রস্তাব করে** U.S. Department of Energy (NIH নয়!), জীববিজ্ঞানের "Manhattan Project" হিসেবে। NIH তাদের genome office খোলে 1989-এ, আর আন্তর্জাতিক অংশীদারদের নিয়ে NIH–DOE-র যৌথ উদ্যোগ হিসেবে project আনুষ্ঠানিকভাবে শুরু হয় **1990** সালে। US-এর বাইরে সবচেয়ে বড় কেন্দ্র ছিল UK-র Sanger Centre।
- **লক্ষ্য:** প্রায় 3 billion base pair sequence করা, মোটামুটি **base প্রতি $1 খরচে, 2005-এর মধ্যে**।
- **কৌশল নিয়ে বিতর্ক।** public project প্রথমে genome-কে বড় বড় সাজানো টুকরোয় map করে, তারপর প্রতিটা টুকরো sequence করছিল। অন্যরা পক্ষে ছিলেন **whole-genome shotgun** sequencing-এর: *পুরো* genome-কে random টুকরোয় ভেঙে, সবগুলো sequence করে, computer দিয়ে জোড়া লাগানো (Assembly lesson)। সমালোচকরা ভেবেছিলেন repeat-এর কারণে shotgun assembly ব্যর্থ হবে।
- **1995:** TIGR (Craig Venter, Hamilton Smith) whole-genome shotgun দিয়ে প্রথম সম্পূর্ণ bacterial genome, *Haemophilus influenzae* (প্রায় 1.8 Mb, ~1,740টা gene), sequence করে।
- **1998:** Venter প্রতিষ্ঠা করেন **Celera Genomics**, যে কোম্পানি Applied Biosystems-এর নতুন capillary sequencer ব্যবহার করত। **2000:** Celera আর academic অংশীদাররা fruit fly-র genome প্রকাশ করে, দেখিয়ে দেয় যে বড় একটা প্রাণীর genome-এও shotgun assembly কাজ করে।
- **2001:** পরপর দুটো খসড়া (draft) human genome প্রকাশিত হয়: public consortium-এরটা *Nature*-এ আর Celera-রটা *Science*-এ। "মূলত সম্পূর্ণ" sequence আসে 2003-এ। বাকি ~8% (centromere, telomere, বড় duplicated অঞ্চল) পেতে অপেক্ষা করতে হয়েছে 2022-এর **T2T** genome পর্যন্ত।
- project চলার সময় gene সংখ্যার অনুমান কমতেই থাকে, প্রায় 100,000 থেকে নেমে আজকের ~20,000 protein-coding gene-এ।

:::think Human Genome Project প্রথম কেন Department of Energy প্রস্তাব করল, NIH নয়?
DOE তৈরি হয়েছিল atomic-energy কর্মসূচি থেকে, আর তারা কয়েক দশক ধরে **DNA-র ওপর radiation-এর প্রভাব** নিয়ে গবেষণা করছিল, যার মধ্যে ছিল Hiroshima আর Nagasaki-র বেঁচে যাওয়া মানুষদের মধ্যে বংশগত mutation। এ ধরনের mutation শনাক্ত করতে DNA map আর sequence করার আরও ভালো উপায় দরকার ছিল। তাছাড়া DOE এমন সব national laboratory চালাত, যেগুলোর বড় মাপের engineering আর computing-এর অভিজ্ঞতা ছিল, যা একটা genome project-এর জন্য অপরিহার্য।
:::

{{widget:timeline}}

## Sanger থেকে massively parallel sequencing

**Sanger sequencing (প্রথম প্রজন্ম, 1977)।** DNA polymerase একটা template কপি করে, যেখানে স্বাভাবিক nucleotide-এর সাথে অল্প পরিমাণে **dideoxynucleotide** মেশানো থাকে। এগুলো পরিবর্তিত nucleotide, chain-এ যুক্ত হলেই chain থামিয়ে দেয়। ফলে এমন সব কপি তৈরি হয় যেগুলো সম্ভাব্য প্রতিটা position-এ গিয়ে শেষ হয়েছে, আর প্রতিটার গায়ে তার শেষ base-এর পরিচয় চিহ্নিত থাকে। fragment-গুলোকে দৈর্ঘ্য অনুযায়ী সাজালে (capillary electrophoresis) এক position এক position করে sequence-টা পড়া যায়। Sanger read লম্বা (প্রায় 800–1,000 base) আর নির্ভুল, কিন্তু প্রতিটা capillary এক run-এ মাত্র **একটা fragment** পড়ে, তাই genome-এর মাপে এটা ধীর আর ব্যয়বহুল। একটা একক PCR product যাচাই করার জন্য এটা এখনো gold standard।

**দ্বিতীয় প্রজন্ম ("next-generation sequencing", মোটামুটি 2005 থেকে)।** মূল আইডিয়া হলো **massive parallelism**: **flow cell** নামের একটা কাচের slide-এ **একসাথে কয়েকশো million থেকে কয়েক billion fragment** sequence করা। একটা human genome-এর খরচ প্রায় $100 million (2001) থেকে নেমে $1,000-এর নিচে চলে এসেছে, Moore's law-এর চেয়েও অনেক দ্রুত। প্রধান chemistry হলো Illumina-র **sequencing by synthesis (SBS)**, যেটা lecture-এ একটা Lego animation দিয়ে ব্যাখ্যা করা হয়েছে।

আগে Illumina-র নিজেদের animation-টা দেখুন; নিচের ধাপগুলোতে আপনি যে যে পর্যায় দেখবেন, সেগুলোর নাম দেওয়া আছে।

{{video:fCd6B5HRaZ8}}

1. **Library preparation।** DNA-কে টুকরো করুন (যেমন ~300–500-base-এর টুকরো) আর দুই প্রান্তে ছোট, জানা **adapter** sequence জুড়ে দিন।
2. **Cluster generation।** fragment-গুলো flow cell-এ আটকানো complementary adapter-এর সাথে bind করে। প্রতিটা ওই জায়গাতেই বারবার কপি হয় (**bridge amplification**), ফলে প্রায় এক হাজার একই রকম কপির একটা **cluster** তৈরি হয়। একটা মাত্র molecule-এর signal দেখার মতো উজ্জ্বল নয়; একটা cluster-এর signal যথেষ্ট উজ্জ্বল।
3. **Sequencing cycle।** চারটা nucleotide-ই একসাথে দিন। প্রতিটা ধরনের সাথে আলাদা একটা **fluorescent dye** আর একটা **reversible terminator** থাকে, একটা রাসায়নিক "speed breaker", যেটা polymerase-কে **ঠিক একটা base** যোগ করার পর থামিয়ে দেয়।
4. **Imaging।** একটা laser dye-গুলোকে উত্তেজিত করে আর একটা camera পুরো flow cell-এর ছবি তোলে। প্রতিটা cluster সদ্য যোগ হওয়া base-এর রঙে জ্বলে ওঠে।
5. **Cleave and repeat।** রাসায়নিকভাবে dye আর terminator সরিয়ে ফেলুন, তারপর 100–300 cycle ধরে এটা পুনরাবৃত্তি করুন। সময়ের সাথে একটা cluster যে রঙের ধারা দেখায়, সেটাই তার **read**।

Introduction-এ যে base pairing শিখেছেন, পুরো ব্যাপারটা সেটার ওপরই দাঁড়িয়ে: প্রতি cycle-এ যে base যোগ হয়, সেটা template base-এর complement।

:::story একটা strand পড়া, তার কপির ছবি তুলে
মূল strand-টা আমরা কখনো সরাসরি পড়ি না। বরং **তার complementary কপিটা এক অক্ষর এক অক্ষর করে বানাই, আর প্রতিটা অক্ষরের পর একটা ছবি তুলি**। প্রতিটা নতুন অক্ষর তার নিজস্ব রঙে জ্বলে, তাই একটা বিন্দুতে রঙের ধারাটা *আসলে* কপির sequence, আর base pairing-এর সূত্রে মূল strand-এরও।

**reversible terminator** কেন এই পদ্ধতির প্রাণ: এটা নিশ্চিত করে যে *প্রতিটা* cluster-এ একসাথে প্রতি cycle-এ ঠিক একটা অক্ষর যোগ হবে। এটা না থাকলে দুটো ছবির মাঝে polymerase কয়েক অক্ষর এগিয়ে যেত, আর কয়টা যোগ হলো আমরা বুঝতে পারতাম না। এটা থাকলে এক billion cluster একই তালে, প্রতি ছবিতে এক অক্ষর করে, এগোয়। এই একই তালে চলাটাই "massively parallel"-এর আসল মানে।
:::

{{ref:intro#dna-the-four-letter-molecule}}

{{widget:sbs}}

## Error কোথা থেকে আসে

একটা cluster-এর ভেতরে সব কপির একদম একই তালে চলার কথা: cycle 50-এর পরে প্রতিটা কপি সদ্য base 50 যোগ করবে। কিন্তু chemistry নিখুঁত নয়:

- কখনো কখনো একটা strand কোনো cycle-এ **base যোগ করতে ব্যর্থ হয়**, ফলে এক ধাপ পিছিয়ে পড়ে (**phasing**)।
- কখনো কখনো terminator কাজ করে না আর একটা strand **দুটো base** যোগ করে ফেলে, ফলে এক ধাপ এগিয়ে যায় (**pre-phasing**)।

তাল-হারানো কপিগুলো বর্তমান position-এর জন্য *ভুল* রঙে জ্বলে। প্রতি cycle-এ এরকম কপির ভাগ বাড়তে থাকে, তাই:

- cluster-এর আলো হয়ে যায় কয়েকটা রঙের **মিশ্রণ**,
- base call হয় **কম নিশ্চিত**, আর
- read-এর **শেষের দিকে quality কমে যায়**। এজন্যই analysis-এর আগে প্রায়ই read-এর 3′ প্রান্ত **trim** করা (ছেঁটে ফেলা) হয়।

**Base quality।** প্রতিটা base call করার সময় sequencer p অনুমান করে, অর্থাৎ **call-টা ভুল হওয়ার probability**। (slide-এর Lego উদাহরণে 9 একক আলোর 3 একক ভুল রঙের, তাই p = 1/3।) এটাকে সে জানায় একটা **Phred quality score** হিসেবে:

$$Q = -10 \log_{10} p, \qquad p = 10^{-Q/10}$$

Q-তে প্রতি +10 মানে **10 গুণ কম error**:

| Q | error probability | accuracy |
|---|---|---|
| 10 | 10-এ 1 | 90% |
| 20 | 100-তে 1 | 99% |
| 30 | 1,000-এ 1 | 99.9% |
| 40 | 10,000-এ 1 | 99.99% |

**হাতে-কলমে উদাহরণ।**
- p = 1/3: Q = −10 log₁₀(1/3) ≈ **4.77**, খুবই অবিশ্বস্ত একটা call।
- Q = 25: p = 10⁻²·⁵ ≈ 0.0032, মোটামুটি 316-তে 1টা error।
- **একটা read-এ expected error:** error probability-গুলো যোগ করুন। 100-base-এর একটা read, যার প্রতিটা base Q30, তাতে expected error 100 × 0.001 = **0.1**; একই read Q20 হলে 1।

:::think 100-base-এর একটা read-এর প্রথম 70 base-এ Q > 30, আর শেষ 30 base-এ Q < 15। পুরো read map করবেন, নাকি trim করা read?
**trim করা** read (প্রথম 70 base) map করুন। Q < 15 মানে প্রতি base-এ 3%-এর বেশি error-এর সম্ভাবনা (Q15 → p ≈ 0.032), তাই শেষাংশে সম্ভবত এক বা একাধিক error আছে। ওই mismatch-গুলোর কারণে aligner হয়তো read-টা কোথাও বসাতেই পারবে না, বা এর score এত কমিয়ে দেবে যে read-টা বাদ পড়বে, আর সবচেয়ে খারাপ ক্ষেত্রে **ভুল** জায়গায় টেনে নিয়ে যাবে। genome-এর বেশিরভাগ অংশে 70টা নির্ভুল base দিয়েই unique-ভাবে map করা যায়। দৈর্ঘ্যের চেয়ে নির্ভুলতা বেশি জরুরি।
:::

{{ref:math#logarithms-likelihood-and-log-odds}}

## FASTQ file আর Phred+33

read আর তাদের quality রাখা হয় **FASTQ** file-এ, প্রতি read-এর জন্য চার লাইন:

```text
@ERR194146.1 HSQ1008:141:D0CC8ACXX:3:1308:20201:36071/1     ← read name
ACATCTGGTTCCTACTTCAGGGCCATAAAGCCTAAATAGCCCACACGTTCCCCTTAAAT  ← sequence
+                                                            ← separator (ignore)
?@@FFBFFDDHHBCEAFGEGIIDHGH@GDHHHGEHID@C?GGDG@FHIGGH@FHBEG:G  ← one quality character per base
```

**Phred+33 encoding।** প্রতিটা quality-কে একটা মাত্র character হিসেবে রাখতে Q-কে integer-এ round করুন, **33 যোগ করুন**, আর সেই code-এর ASCII character নিন। (33 হলো প্রথম printable ASCII character, `!`, তাই Q = 0 মানে `!`।) decode করতে character-টার ASCII code নিয়ে 33 বিয়োগ করুন:

- `I`-এর ASCII code 73, তাই Q = 73 − 33 = **40** (10,000-এ 1টা error)।
- `5`-এর code 53, তাই Q = **20**।
- `#`-এর code 35, তাই Q = **2** (Illumina এটা ব্যবহার করে "এই base-কে বিশ্বাস কোরো না" বোঝাতে)।

```python
def QtoPhred33(Q):   return chr(Q + 33)
def phred33ToQ(ch):  return ord(ch) - 33

[phred33ToQ(c) for c in "?@@FF"]   # [30, 31, 31, 37, 37]
```

{{ref:tools#file-formats|tools#reading-fasta-and-fastq-in-python}}

{{widget:phred}}

{{game:phred-flash}}

:::think quality string `#!J` decode করুন।
প্রতিটা ASCII code থেকে 33 বিয়োগ করুন: `#` হলো 35 → **Q = 2**; `!` হলো 33 → **Q = 0**; `J` হলো 74 → **Q = 41**। প্রথম দুটো base আসলে আন্দাজের সমান (Q0 মানে p = 1); তৃতীয়টা 10,000 call-এ একবারেরও কম ভুল হয়।
:::

:::example analysis-এর আগে FASTQ file পরিষ্কার করা (quality control)
raw read-কে কখনো চোখ বুজে বিশ্বাস করবেন না। assembly, mapping বা variant calling-এর আগে একটা প্রচলিত প্রথম ধাপ:

1. **আগে দেখুন।** **FastQC** চালান (বা অনেকগুলো file-এর ওপর MultiQC)। এটা position অনুযায়ী quality, GC content, adapter content আর duplication-এর মাত্রা plot করে, ফলে ঠিক করার আগেই দেখতে পান সমস্যাটা কী।
2. **adapter trim করুন।** DNA fragment যদি read length-এর চেয়ে ছোট হয়, sequencer fragment পেরিয়ে অন্য প্রান্তের adapter-এ ঢুকে পড়তে থাকে। ওই adapter-এর অক্ষরগুলো genome-এর নয়, কেটে বাদ দিতে হবে।
3. **low-quality base trim করুন।** একটা প্রচলিত পদ্ধতি হলো **sliding window**: 4–5 base-এর একটা window read বরাবর সরাতে থাকুন, আর যেখানে window-এর গড় quality একটা threshold-এর (যেমন Q20) নিচে নামে, সেখানে read কেটে দিন। অনেক tool একদম শুরু আর শেষের low-quality base-ও ছেঁটে দেয়।
4. **যে read-গুলো বেশি ছোট হয়ে গেছে সেগুলো বাদ দিন** (যেমন 30–50 base-এর কম): ছোট read অস্পষ্টভাবে (একাধিক জায়গায়) map হয়।

ধাপ 2–4 যেসব tool করে: **fastp**, **cutadapt**, **Trimmomatic**। পরে আবার FastQC চালিয়ে নিশ্চিত হোন যে সমস্যা মিটেছে।
:::

:::cs course notebook থেকে (Sequence_reads.ipynb)
notebook-টা একটা FASTA file থেকে φX174 genome পড়ে (`>` দিয়ে শুরু হওয়া লাইনগুলো বাদ দিয়ে), একটা FASTQ file parse করে (প্রতি 4 লাইনের গ্রুপের লাইন 2 আর 4), **base quality-র histogram** বানায়, **read-এর position অনুযায়ী GC content** আর **position অনুযায়ী গড় quality** plot করে, তারপর সরল exact matching দিয়ে read-গুলোকে genome-এ map করে। শুরুতে কেবল কিছু read মেলে। অনেক বেশি মেলে যখন আপনি (1) প্রতিটা read-এর শুধু প্রথম 30 base ব্যবহার করেন, যেখানে error বিরল, আর (2) **reverse complement**-ও খোঁজেন, কারণ read আসে দুই strand থেকেই।
:::

## তৃতীয় প্রজন্মের (long-read) sequencing

short read সস্তা আর নির্ভুল, কিন্তু 150 base দিয়ে 6,000-base-এর একটা repeat পার হওয়া যায় না। **Third-generation** প্রযুক্তিগুলো একক DNA molecule পড়ে, আর হাজার থেকে লাখ লাখ base লম্বা read তৈরি করে।

| প্রযুক্তি | কীভাবে কাজ করে | Read length | Accuracy |
|---|---|---|---|
| Illumina SBS | amplified cluster-এর ওপর চক্রাকারে reversible terminator | 50–300 bp | ~99.9% |
| PacBio HiFi | একটা একক DNA polymerase একটা circular template কপি করার সময় তাকে real time-এ পর্যবেক্ষণ করা হয়; বৃত্তটা বহুবার ঘুরে পড়লে একটা consensus পাওয়া যায় | ~15–25 kb | > 99.9% (HiFi consensus) |
| Oxford Nanopore | একটা একক DNA strand ধাপে ধাপে একটা membrane-এর protein pore-এর ভেতর দিয়ে যায়; pore-এ থাকা প্রতিটা base-গুচ্ছ বৈদ্যুতিক current বদলে দেয়, আর neural network সেই current-এর রেখা decode করে base বের করে | kb থেকে > 1 Mb | সাম্প্রতিক chemistry-তে একক read-এ ~99% |

**long read কেন গুরুত্বপূর্ণ।**
- এগুলো repeat পার হতে পারে, ফলে assembly অনেক সহজ হয় (T2T human genome এগুলোর ওপরই নির্ভর করেছে)।
- এগুলো **structural variant** (বড় insertion, deletion, inversion) ধরতে পারে, যেগুলো short read-এ ধরা পড়ে না।
- এগুলো **পূর্ণদৈর্ঘ্যের RNA transcript** পড়ে, ফলে isoform সরাসরি দেখা যায়।
- Nanopore current signal থেকে সরাসরি methylation-এর মতো **base modification** পড়তে পারে, আর একটা nanopore sequencer একটা USB stick-এর সমান ছোটও হতে পারে।

nanopore sequencing কীভাবে একটা molecule pore দিয়ে যাওয়ার সময় তাকে পড়ে, এই video-তে তা ব্যাখ্যা করা হয়েছে:

{{video:bS3NiFLwPqE}}

## Genome sequencing-এর বাইরে: "-seq" কী মাপে

sequencer DNA পড়ে, কিন্তু প্রায় যেকোনো জৈবিক প্রশ্নকেই পড়ার মতো DNA-তে রূপান্তর করা যায়। সেজন্যই এত experiment-এর নামের শেষে "-seq":

- **WGS / WES:** whole genome / whole exome (শুধু exon-গুলো) → **variant** খুঁজে বের করা।
- **RNA-seq:** reverse transcriptase দিয়ে RNA-কে DNA-তে (cDNA) রূপান্তর করে তারপর sequence করা → **gene expression** মাপা (Gene Expression lesson)। **scRNA-seq** প্রতিটা কোষের জন্য একটা barcode যোগ করে।
- **ChIP-seq:** একটা নির্দিষ্ট protein (transcription factor বা histone mark) যে DNA-তে bind করে আছে, সেটা আলাদা করে টেনে আনা → **binding site** খুঁজে বের করা।
- **ATAC-seq / DNase-seq:** যে DNA খোলা আছে, শক্তভাবে প্যাঁচানো নয়, সেটা sequence করা → **open chromatin** আর সক্রিয় regulatory অঞ্চল খুঁজে বের করা।
- **Bisulfite sequencing:** রাসায়নিক treatment-এ unmethylated C বদলে U হয়ে যায়, তাই methylated আর unmethylated C আলাদাভাবে পড়া যায় → **DNA methylation** map করা।
- **Metagenomics:** পরিবেশের বা অন্ত্রের (gut) একটা নমুনার সব DNA sequence করা → কোন কোন **species** আর gene আছে তা জানা।

এগুলোর প্রতিটাই read-ভর্তি FASTQ file তৈরি করে। পরের lesson প্রায় প্রতিটা pipeline-এর প্রথম প্রশ্নটার উত্তর দেয়: শত শত কোটি (billions of) read আর একটা reference genome হাতে থাকলে, **প্রতিটা read আসলে কোথা থেকে এসেছে?**
