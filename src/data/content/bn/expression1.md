**জৈবিক প্রশ্ন:** আমরা হাজার হাজার gene-এর expression মাপি নানা condition-এ, নানা time point-এ, কিংবা আলাদা আলাদা cell-এ। প্রশ্ন হলো: কোন gene-গুলো একই রকম আচরণ করে, আর কোন sample বা cell-গুলো একে অপরের মতো? যেসব gene-এর expression pattern মিলে যায়, সেগুলো প্রায়ই **co-regulated** (একই transcription factor দিয়ে চালু-বন্ধ হয়) এবং কাজের দিক থেকেও সম্পর্কিত। তাই এদের দলে ভাগ করাটা একটা dataset বোঝার পথে খুব শক্তিশালী প্রথম ধাপ। এই lesson Compeau & Pevzner Vol. 2, Ch. 8 অনুসরণ করে, সঙ্গে আছে course-এর সেই অংশ যেখানে expression কীভাবে মাপা হয় তা দেখানো হয়েছে।

## এক অনুচ্ছেদে machine learning

Clustering আমাদের প্রথম machine-learning পদ্ধতি, তাই slide-এ দেওয়া সংজ্ঞা (Tom Mitchell-এর) দিয়ে শুরু করা যাক: একটা program কোনো task **T** আর একটা performance measure **P**-এর সাপেক্ষে অভিজ্ঞতা **E** থেকে **শেখে**, যদি E বাড়ার সঙ্গে সঙ্গে T-তে তার পারফরম্যান্স (P দিয়ে মাপা) ভালো হতে থাকে।

- **T (task):** classification, regression, clustering, anomaly detection, imputation (হারিয়ে যাওয়া মান পূরণ করা), denoising, নতুন data তৈরি করা…
- **P (performance):** accuracy, adjusted Rand index (ARI, অর্থাৎ একটা clustering জানা label-এর সঙ্গে কতটা মেলে), mean absolute error, R², ইত্যাদি।
- **E (experience):** training data: sequence, structure, physico-chemical বৈশিষ্ট্য, gene expression count…

**Supervised** learning-এ training data-র label থাকে ("এই sample-টা tumour") এবং model সেই label অনুমান করতে শেখে (এটা Supervised Learning lesson-এর বিষয়)। **Unsupervised** learning-এ কোনো label নেই; সেখানে আমরা data-র ভেতরের গঠন খুঁজি: **clustering** (এই lesson) আর **dimensionality reduction** (পরের lesson)।

## Gene expression মাপা: microarray, RNA-seq, single-cell

Central dogma মনে করুন: gene থেকে transcription হয়ে mRNA তৈরি হয়, আর mRNA থেকে translation হয়ে protein। Protein সবগুলো একসঙ্গে মাপা কঠিন, তাই প্রতিটা gene কতটা সক্রিয় তার আন্দাজ পেতে আমরা **mRNA-র পরিমাণ (abundance)** মাপি।

**DNA microarray।** Microarray কীভাবে কাজ করে তার এই 3 মিনিটের ব্যাখ্যাটা দেখুন, তারপর নিচের সারাংশ পড়ুন।

{{video:NgRfc6atXQ8}}

একটা কাচের chip-এর ওপর ছোট ছোট spot-এ single-stranded DNA-র ছোট টুকরো, অর্থাৎ **probe**, বসানো থাকে; প্রতিটা জানা gene-এর জন্য এক বা একাধিক probe। Cell থেকে নেওয়া RNA-কে reverse-transcribe করে **cDNA** বানানো হয়, তাতে একটা fluorescent label লাগানো থাকে, তারপর সেটা chip-এর ওপর দিয়ে ধুয়ে দেওয়া হয়। প্রতিটা cDNA তার complementary probe-এর সঙ্গে **hybridize** করে (base-pair তৈরি করে জুড়ে যায়)। কোনো spot কতটা উজ্জ্বল, সেটা বলে দেয় ওই gene-এর RNA কতটা ছিল।

সীমাবদ্ধতা (slide থেকে):
- শুধু **জানা transcript** মাপা যায়, কারণ probe আগে থেকেই design করে রাখতে হয়;
- **isoform** আলাদা করতে পারে না, আসল sequence-ও পড়তে পারে না;
- **cross-hybridization** (cDNA কাছাকাছি রকমের অন্য probe-এ লেগে যাওয়া) আর **background noise**;
- **saturation**: খুব উজ্জ্বল spot একটা পর্যায়ের পর আর বেশি উজ্জ্বল হয় না, ফলে dynamic range সীমিত।

**RNA-seq।** RNA আলাদা করুন → reverse transcriptase দিয়ে cDNA বানান → সেটা **sequence** করুন → read-গুলোকে reference-এ map করুন (অথবা assemble করুন) → **প্রতিটা gene-এ কতগুলো read পড়ল গুনুন**। এখানে count-গুলো digital, dynamic range বিশাল, আর যেহেতু আসল sequence পড়া হচ্ছে, তাই নতুন transcript, isoform, gene fusion আর allele-specific expression-ও আবিষ্কার করা যায়। Count matrix কীভাবে তৈরি হয় তা এই video-তে দেখানো হয়েছে:

{{video:tlf6wYJrwKY}}

{{ref:tools#typical-analysis-workflows}}

**Single-cell RNA-seq (scRNA-seq)।** Bulk পদ্ধতি লক্ষ লক্ষ cell-এর গড় মাপে, ফলে বিভিন্ন cell type-এর মধ্যের পার্থক্য ঢাকা পড়ে যায়। scRNA-seq প্রতিটা cell আলাদা করে মাপে:

1. Cell-গুলোকে আলাদা করা হয়, যেমন তেলের ছোট ছোট **droplet**-এ, যেখানে প্রতিটা droplet-এ থাকে একটা করে **barcoded bead**।
2. একটা cell থেকে তৈরি প্রতিটা cDNA-তে ওই bead-এর **cell barcode** লাগিয়ে দেওয়া হয়, সঙ্গে একটা **UMI** (unique molecular identifier), যা একটা random tag এবং প্রতিটা আসল mRNA molecule-এর জন্য আলাদা।
3. সবকিছু একসঙ্গে মিশিয়ে একবারে sequence করা হয়।
4. **Barcode দেখে read-গুলোকে demultiplex করা হয়**, অর্থাৎ কোন read কোন cell থেকে এসেছে তা জানা যায়; আর read না গুনে **UMI গোনা হয়**, যাতে একই molecule-এর PCR copy-গুলো একবারই গোনা হয়।

ফলাফল হলো একটা **genes × cells** count matrix, যা দিয়ে **cell type আর cell state** খুঁজে বের করা হয়। Droplet পদ্ধতির ওপর 10x Genomics-এর animation-টা দেখুন:

{{video:4NAS1qTJmYA}}

আর ঝালিয়ে নেওয়ার জন্য single-cell sequencing-এর এই দুই মিনিটের সারাংশ:

{{video:6UVOdCc1Q7I}}

:::example তিনটা প্রযুক্তির তুলনা
| | Microarray | Bulk RNA-seq | scRNA-seq |
|---|---|---|---|
| কী মাপা হয় | নির্দিষ্ট probe-এ hybridization-এর intensity | sequencing read count | **প্রতিটা cell-এ** read/UMI count |
| কী ধরা পড়ে | শুধু আগে থেকে design করা জানা transcript | জানা + নতুন transcript, isoform, SNP | একই জিনিস, cell ধরে ধরে, তবে sparse (অনেক gene-এর মান শূন্য আসে: "dropout") |
| Resolution | পুরো tissue-র গড় | পুরো tissue-র গড় | আলাদা আলাদা cell (heterogeneity, বিরল cell type) |
| Dynamic range | সীমিত (background, saturation) | বিস্তৃত, digital | বিস্তৃত কিন্তু noisy, অনেক শূন্য |
| সাধারণ বিশ্লেষণ | condition-গুলোর মধ্যে আপেক্ষিক intensity তুলনা | differential expression | cell type অনুযায়ী clustering, trajectory, t-SNE/UMAP |
| কোন cell, তা কীভাবে জানি? | প্রযোজ্য নয় | প্রযোজ্য নয় | **cell barcode** (+ molecule গোনার জন্য UMI) |
:::

**RNA-seq-এর জন্য কি reference genome লাগবেই?** কড়াকড়িভাবে না। Reference genome বা transcriptome থাকলে read-গুলোকে splice-aware aligner (STAR, HISAT2) দিয়ে তার ওপর align করা হয়, অথবা pseudo-align করা হয় (Salmon, kallisto)। এটা দ্রুত ও নির্ভুল, আর প্রতিটা read কোন gene থেকে এসেছে তাও বলে দেয়। যেসব organism-এর reference **নেই**, সেখানে read-গুলোকে **de novo assemble** করে transcript বানানো হয় (যেমন Trinity দিয়ে), তারপর সেই assembly-র সাপেক্ষে quantify করা হয়।

**Data কোথায় পাওয়া যায়** (slide): NCBI **GEO** (microarray ও sequencing study), **SRA** (raw read), **ArrayExpress** (EBI-র সমতুল্য database), আর একই ছাঁচে সাজানো resource যেমন recount2/recount3, ARCHS4, Toil ও MetaSRA। উদাহরণ: Parkinson's disease-এর microarray study GSE6613।

{{ref:tools#databases-you-will-use}}

## Gene expression matrix

n-টা gene-কে m-টা checkpoint-এ (condition, time point, sample) মাপলে পাওয়া যায় একটা **n × m expression matrix**। Row i হলো gene i-এর **expression vector**: checkpoint-গুলো জুড়ে তার profile।

```text
            t1    t2    t3    t4
gene A     2.0   4.1   6.0   8.2     rises steadily
gene B     1.0   2.1   2.9   4.1     rises steadily, lower level
gene C     8.0   6.1   4.0   2.0     falls
```

(এখানে gene A আর B নিয়মিত বাড়ছে, B-র মাত্রা একটু কম; gene C কমছে।)

- যেসব gene-এর vector কাছাকাছি (যেমন A আর B), সেগুলো co-regulated হতে পারে।
- অজানা কাজের কোনো gene-এর vector যদি জানা কোনো gene-এর মতো হয়, তাহলে দুটো হয়তো সম্পর্কিত প্রক্রিয়ায় জড়িত।
- সাধারণ study: ওষুধ দেওয়ার আগে বনাম পরে, cancer বনাম স্বাভাবিক tissue, বিকাশের (development) time course।

:::story শেয়ারবাজারে "sector" খুঁজে বের করা
হাজার হাজার কোম্পানির শেয়ারের দৈনিক দাম এক বছর ধরে লক্ষ করুন। কোন কোম্পানি কোন শিল্পের, তা কেউ আপনাকে বলে দেয়নি; তবু দেখবেন airline-এর শেয়ারগুলো একসঙ্গে ওঠে-নামে, তেলের কোম্পানিগুলোও তাই। দামের curve-এর *আকৃতি* দেখে কোম্পানিগুলোকে দলে ভাগ করলে শুধু data থেকেই আপনি "airline" আর "তেল" sector আবার খুঁজে পাবেন।

Gene clustering ঠিক একই ধারণা: gene হলো কোম্পানি, condition হলো দিন, expression হলো দাম। যেসব gene একসঙ্গে ওঠে-নামে, সেগুলো সম্ভবত একই transcription factor দিয়ে চালু হয় বা একই pathway-তে কাজ করে। একে বলে **guilt by association** (সঙ্গ দেখে চেনা): একটা cluster-এর 9টা gene যদি metabolism-এ কাজ করে বলে জানা থাকে, তাহলে 10ম অজানা gene-টাও metabolism-এ কাজ করে, এমন বাজি ধরাই যুক্তিসঙ্গত। আর co-regulated gene-এর একটা ঘন cluster হলো motif finding-এর স্বাভাবিক input: এদের upstream-এ সেই সাধারণ "switch"-টা খোঁজার জন্য।
:::

**প্রতিটা gene হলো m-dimensional space-এর একটা বিন্দু** (অথবা matrix-টা transpose করলে, প্রতিটা sample হলো n-dimensional gene space-এর একটা বিন্দু)। Clustering কাছাকাছি বিন্দুগুলোকে একসঙ্গে দলে ফেলে। কিন্তু "কাছাকাছি" মানে কী, তা নির্ভর করে কোন distance ব্যবহার করছেন তার ওপর: Euclidean distance অনুযায়ী A আর B বেশ দূরে, কারণ তাদের *মাত্রা* আলাদা; অথচ correlation distance অনুযায়ী তারা কাছাকাছি, কারণ তাদের *আকৃতি* মেলে।

**Log transformation।** বিশ্লেষণের আগে সাধারণত expression মানগুলোর log নেওয়া হয় (যেমন log₂)। কারণ expression-এর পরিবর্তন গুণিতক হারে ঘটে (10 থেকে 20-তে যাওয়া আর 1,000 থেকে 2,000-এ যাওয়া সমান বড় পরিবর্তন), আর raw মানগুলোর বণ্টন heavy-tailed, ফলে কয়েকটা খুব বেশি expressed gene-ই distance-এর হিসাবে আধিপত্য করত।

{{ref:math#vectors-matrices-and-covariance|math#distances-and-similarity}}

**Clustering বনাম classification।** Classification জিনিসগুলোকে **আগে থেকে জানা** class-এ ভাগ করে। Clustering কোনো label ছাড়াই একই রকম জিনিসগুলোকে দলে ফেলে লুকানো গঠন **প্রকাশ** করে। একটা ভালো clustering-এর দুটো বৈশিষ্ট্য থাকে:
- **homogeneity:** একই cluster-এর বিন্দুগুলো একে অপরের কাছাকাছি;
- **separation:** আলাদা cluster-এর বিন্দুগুলো একে অপরের থেকে দূরে।

## Optimization problem হিসেবে k-means

"ভালো clustering" কথাটাকে নির্দিষ্ট করতে সরাসরি cluster না বেছে বরং **k-টা center** বেছে নিই। প্রতিটা বিন্দু তার সবচেয়ে কাছের center-এর দলে পড়ে। একটা বিন্দু v থেকে center-এর set C-র distance হলো $d(v, C) = \min_i d(v, C_i)$।

Center-গুলো data-র সঙ্গে কতটা ভালো খাপ খায়, তা মাপে **squared error distortion**:

$$\text{Distortion}(Data, C) = \frac{1}{n}\sum_{v \in Data} d(v, C)^2$$

**k-Means Clustering Problem:** এমন k-টা center খুঁজুন যাতে distortion সবচেয়ে কম হয়। সাধারণভাবে এটা NP-hard (high dimension-এ k = 2 হলেও), তাই বাস্তবে আমরা একটা heuristic ব্যবহার করি।

{{ref:algo#np-hardness-and-heuristics}}

ধাপগুলো পড়ার আগে algorithm-টা আর k বাছাইয়ের ব্যাপারটা চোখে দেখে নিতে এই StatQuest video-টা দেখুন:

{{video:4b5d3muPQmA}}

**Lloyd's algorithm:**
1. প্রথমে k-টা center বেছে নিন।
2. **Center → cluster:** প্রতিটা বিন্দুকে তার সবচেয়ে কাছের center-এর দলে দিন।
3. **Cluster → center:** প্রতিটা center-কে সরিয়ে তার বিন্দুগুলোর **center of gravity**-তে (অর্থাৎ গড়ে, mean-এ) নিয়ে যান।
4. Center-গুলো নড়া বন্ধ না হওয়া পর্যন্ত ধাপ 2–3 বারবার করুন।

**হাতে-কলমে উদাহরণ।** একটা রেখার ওপর বিন্দু 1, 2, 3, 10, 11, 12; k = 2, শুরুর center 1 আর 2।
- Assign: 1 যায় center 1-এ; 2, 3, 10, 11, 12 center 2-এর বেশি কাছে।
- Update: center 1 = 1, center 2 = (2 + 3 + 10 + 11 + 12)/5 = 7.6।
- Assign: 1, 2, 3 এখন 7.6-এর চেয়ে 1-এর বেশি কাছে; 10, 11, 12 যায় 7.6-এর কাছে।
- Update: center হয় 2 আর 11। আবার assign করলে কিছুই বদলায় না, তাই থামুন।
- চূড়ান্ত distortion = (1 + 0 + 1 + 1 + 0 + 1)/6 ≈ 0.67।

**এটা কেন থামে (converge করে)?** ধাপ 2 শুধু distortion কমাতেই পারে (প্রতিটা বিন্দু আরও কাছের center-এ যায়), আর ধাপ 3-ও শুধু কমাতে পারে (একগুচ্ছ বিন্দুর থেকে squared distance-এর যোগফল সবচেয়ে কম হয় তাদের mean-এ)। Distortion কখনো বাড়ে না, আর বিন্দুগুলোকে ভাগ করার উপায় সীমিত সংখ্যক, তাই algorithm একসময় থামবেই। কিন্তু এটা থামে একটা **local** minimum-এ, যা শুরুর center-গুলোর ওপর নির্ভর করে।

{{ref:algo#iterative-optimization-the-em-pattern}}

{{widget:kmeans}}

{{game:lloyd-step}}

**সীমাবদ্ধতা (slide):** k-means local minimum-এ আটকে যেতে পারে; ফলাফল initialization-এর ওপর নির্ভর করে; k আগে থেকেই ঠিক করে দিতে হয়; এটা ধরে নেয় cluster-গুলো **গোলাকার এবং মোটামুটি একই আকারের**; outlier আর noise-এ সহজে প্রভাবিত হয়; বিশাল data-য় খরচসাপেক্ষ; খুব high dimension-এ Euclidean distance অর্থ হারায়; আর categorical data সামলাতে পারে না।

:::example k-means কেন আলাদা pathway-এর gene মিশিয়ে ফেলতে পারে, আর তখন কী করবেন?
**কারণ:** (1) খারাপ initialization-এর ফলে একটা দুর্বল local optimum-এ পৌঁছানো; (2) ভুল k (k খুব ছোট হলে আলাদা দলগুলো জোর করে একসঙ্গে পড়ে); (3) cluster-গুলো গোলাকার নয় বা তাদের বিস্তার অসমান; (4) normalize না করা data, যেখানে Euclidean distance-এ কয়েকটা অতি-expressed gene বা আকৃতির বদলে সামগ্রিক মাত্রাই প্রাধান্য পায়; (5) outlier আর noise; (6) hard assignment, অথচ gene প্রায়ই একাধিক pathway-তে অংশ নেয়।

**সমাধান:** **k-means++** অথবা অনেকবার নতুন করে চালানো (সবচেয়ে কম distortion-ওয়ালাটা রাখুন); elbow method, silhouette score বা gap statistic দিয়ে k বাছুন; **standardize বা log-transform** করুন, অথবা **correlation distance** ব্যবহার করুন; outlier সরান বা তাদের গুরুত্ব কমান (k-medoids); **soft clustering** (soft k-means, Gaussian mixture) বা hierarchical clustering ব্যবহার করুন; আর জানা জীববিজ্ঞানের সঙ্গে মিলিয়ে cluster-গুলো যাচাই করুন (GO enrichment)।
:::

**Outlier।** Mean robust নয়: [100, 100]-এ থাকা কয়েকটা বিন্দু একটা center-কে অনেক দূরে টেনে নিতে পারে (বা একটা পুরো cluster নিজেরাই দখল করে নিতে পারে), ফলে বাকি সব cluster বিকৃত হয়। এর সমাধান: outlier সরিয়ে দেওয়া বা তাদের মান একটা সীমায় বেঁধে দেওয়া, log-transform করা, **k-medoids বা k-medians** ব্যবহার করা (যেখানে center-কে হতে হয় আসল কোনো data point, অথবা median), কিংবা DBSCAN-এর মতো density-based পদ্ধতি।

:::think একই data-য় দুবার k-means চালিয়ে দুটো আলাদা clustering পেলেন। কিছু কি ভেঙে গেছে?
না। Lloyd's algorithm (সাধারণত random) শুরুর center থেকে যাত্রা শুরু করে এবং distortion-এর ঢাল বেয়ে শুধু নিচের দিকেই নামে, তাই ভিন্ন শুরু ভিন্ন **local minimum**-এ গিয়ে থামতে পারে। k-means++ initialization ব্যবহার করুন, অনেকবার চালান, আর যেটার distortion সবচেয়ে কম সেটা রাখুন।
:::

:::think আপনার data-য় দুটো লম্বা, সরু, সমান্তরাল cluster আছে, আর আপনি k = 2 দিয়ে k-means চালালেন। কী হবে?
k-means প্রতিটা বিন্দুকে তার সবচেয়ে কাছের center-এ দেয়, ফলে space-টা convex, মোটামুটি গোল অঞ্চলে ভাগ হয়ে যায়। দুটো লম্বা সমান্তরাল ফালি গোল নয়, তাই k-means সম্ভবত ফালি দুটোকে আলাদা না করে দুটোকেই **আড়াআড়ি** কেটে ফেলবে, প্রতিটা center পাবে দুই ফালিরই কাছের অর্ধেক অংশ। Single-linkage hierarchical clustering বা density-based পদ্ধতি (DBSCAN), যারা কাছাকাছি বিন্দুর শিকল ধরে এগোয়, এই আকৃতি অনেক ভালোভাবে সামলায়।
:::

## Initialization আর k-means++

**Initialization গুরুত্বপূর্ণ।** ধরা যাক center [1,1], [10,10], [20,20], আর data ঘনভাবে জড়ো হয়ে আছে [5,5], [15,15] আর [25,25]-এর চারপাশে। প্রথম assignment-এ 5-এর দলটা যায় প্রথম center-এ, 25-এর দলটা তৃতীয়টায়, আর 15-এর দলটা ভাগ হয়ে যায় (কারণ এটা দ্বিতীয় আর তৃতীয় center থেকে সমান দূরে)। পরের update-এ দ্বিতীয় center 15-এর দিকে আর তৃতীয়টা ~20+-এর দিকে সরে যায়, তারপর সব 15 যায় দ্বিতীয় center-এ। অর্থাৎ এই ক্ষেত্রে algorithm ঠিক cluster-এই **converge করে**, কারণ শুরুর center-গুলো ছড়ানো এবং সঠিক ক্রমে সাজানো ছিল। কিন্তু যদি দুটো শুরুর center একই আসল দলের ভেতরে পড়ে, Lloyd এমন একটা ভুল local optimum-এ গিয়ে থামতে পারে যেখান থেকে সে আর কখনো বের হতে পারে না।

**k-means++ (Arthur & Vassilvitskii, 2007)** randomness ব্যবহার করে এমনভাবে শুরুর center বাছে যাতে সেগুলো ছড়িয়ে থাকে:

1. Data point-গুলোর মধ্য থেকে uniformly random ভাবে প্রথম center বাছুন।
2. প্রতিটা বিন্দু x-এর জন্য D(x) হিসাব করুন: এখন পর্যন্ত বাছা সবচেয়ে কাছের center থেকে তার distance।
3. পরের center random ভাবে বাছুন, যেখানে বিন্দু x বাছা হওয়ার probability $\frac{D(x)^2}{\sum_y D(y)^2}$। দূরের বিন্দুগুলোর বাছা পড়ার সম্ভাবনা অনেক বেশি।
4. k-টা center না হওয়া পর্যন্ত এটা চালিয়ে যান, তারপর যথারীতি Lloyd's algorithm চালান।

গ্যারান্টি আছে যে expected distortion সর্বোত্তম মানের O(log k) গুণের মধ্যে থাকবে, আর বাস্তবে এটা দ্রুত এবং ভালো সমাধানে converge করে।

{{ref:math#expected-value-and-sampling-from-a-distribution}}

{{video:4qJWhvFQb9g}}

{{widget:kmeans-pp}}

:::example বিন্দু {2, 4, 10, 12, 20}-এ k-means++, প্রথম center 2
D² = 0, 4, 64, 100, 324 (যোগফল 492), তাই P(4) = 4/492 ≈ 0.0081, P(10) ≈ 0.1301, P(12) ≈ 0.2033, **P(20) ≈ 0.6585**।

**20-এর বদলে 12 বাছা হতে পারে কেন?** বাছাইটা **random**, D²-এর অনুপাতে। 20 বাছা পড়ার সম্ভাবনাই সবচেয়ে বেশি, কিন্তু 12-এরও প্রায় 20% সুযোগ আছে। 12 বাছা হলেও center-গুলো ছড়িয়েই থাকে (2 আর 12), যা সাধারণ random initialization-এর চেয়ে অনেক ভালো শুরু; সাধারণ random পদ্ধতিতে 2 আর 4 দুটোই বাছা পড়তে পারত, যারা একই দলের। এই randomness-এর আরেকটা সুবিধা: k-means++ সবসময় চরম outlier-গুলোকেই center বানিয়ে ফেলে না।
:::

## Soft k-means (EM clustering)

দুটো center-এর ঠিক মাঝামাঝি থাকা একটা বিন্দুর জন্য hard assignment অস্বস্তিকর: তাকে জোর করে একটা cluster-এ ঢোকালে তথ্য হারিয়ে যায়। **Soft k-means** প্রতিটা বিন্দুকে একটা **responsibility** দেয়, অর্থাৎ প্রতিটা cluster-এ আংশিক সদস্যপদ, যেখানে একটা বিন্দুর সব responsibility-র যোগফল 1। এটা একটা **expectation–maximization (EM)** algorithm, যা পালা করে দুটো ধাপ চালায়:

- **E-step (center → soft cluster):** বিন্দু i-এর জন্য cluster k-এর responsibility squared distance বাড়ার সঙ্গে exponentially কমে:
$$w_{ik} = \frac{e^{-\beta\,\|x_i - \mu_k\|^2}}{\sum_{j=1}^{K} e^{-\beta\,\|x_i - \mu_j\|^2}}$$
- **M-step (soft cluster → center):** প্রতিটা center হয়ে যায় একটা **weighted mean**, যেখানে প্রতিটা বিন্দু তার responsibility-র অনুপাতে অবদান রাখে:
$$\mu_k = \frac{\sum_i w_{ik}\, x_i}{\sum_i w_{ik}}$$

(পাঠ্যবইয়ের "partition function" সংস্করণে square ছাড়া $e^{-\beta\, d(x,\mu)}$ ব্যবহার করা হয়; course-এ ব্যবহার করা হয় squared distance। নিচের calculator দুটোই সমর্থন করে।)

**β, অর্থাৎ stiffness parameter:**
- **β → 0:** প্রতিটা $w_{ik} \to 1/K$। প্রতিটা বিন্দু সব cluster-এ সমানভাবে থাকে, সব center গিয়ে মেশে global mean-এ, কোনো clustering-ই হয় না।
- **β → ∞:** সবচেয়ে কাছের center পায় weight 1, বাকিরা 0। এটা হুবহু **hard k-means**।
- **মাঝারি β:** cluster-গুলোর মাঝে থাকা বিন্দুগুলো অর্থবহ আংশিক সদস্যপদ ধরে রাখে, যা একাধিক program-এ অংশ নেওয়া gene-এর জন্য মানানসই।

{{widget:soft-kmeans preset="mid"}}

:::example Soft k-means-এর এক round: μ₁ = (10,8,10), μ₂ = (4,8,3), β = 0.5
Squared distance (μ₁ আর μ₂ থেকে) এবং responsibility:
- Gene 1 (10,8,10): 0, 85 → w = (1, ≈3.5×10⁻¹⁹)
- Gene 2 (10,0,9): 65, 136 → w = (1, ≈3.8×10⁻¹⁶)
- Gene 3 (4,8,3): 85, 0 → w = (≈3.5×10⁻¹⁹, 1)
- Gene 4 (7,8,3): 58, 9 → w = (≈2.3×10⁻¹¹, 1)
- Gene 5 (10,2,3): 85, 72 → w₁ = 1/(1 + e^{6.5}) ≈ **0.0015**, w₂ ≈ **0.9985**

Gene 5-এর সংখ্যাগুলো কীভাবে এল: formula-র লব ও হর দুটোকেই $e^{-0.5 \cdot 72}$ দিয়ে ভাগ করুন, তাহলে পাবেন $w_1 = e^{-0.5 \cdot 85}/(e^{-0.5\cdot 85} + e^{-0.5 \cdot 72}) = 1/(1 + e^{0.5 \cdot 13})$।

**নতুন center:** μ₁ ≈ (10.00, 4.00, 9.50), যা কার্যত gene 1–2-এর mean, আর μ₂ ≈ (7.00, 6.00, 3.00), যা gene 3–5-এর mean। β = 0.5 আর এত বড় distance হওয়ায় ফলাফল প্রায় hard assignment-এর মতোই।
:::

## Hierarchical clustering

প্রায়ই আমরা k জানি না, আর জীববিজ্ঞান স্বভাবতই স্তরে স্তরে সাজানো: cell type-এর ভেতরে subtype থাকে, pathway-র ভেতরে sub-pathway। **Hierarchical clustering** cluster-এর ভেতরে cluster, এভাবে পুরো একটা tree বানায়। আগে linkage আর dendrogram-এর এই ব্যাখ্যাটা দেখে নিন:

{{video:7xHsRkOdVwo}}

**Agglomerative (নিচ থেকে ওপরে, bottom-up) clustering:**
1. n × n distance matrix D হিসাব করুন, আর n-টা singleton cluster (প্রতিটায় একটা করে বিন্দু) দিয়ে শুরু করুন।
2. সবচেয়ে **কাছের** দুটো cluster $C_i, C_j$ খুঁজে তাদের জুড়ে $C_{new}$ বানান। এই merge-টা tree-তে একটা node হিসেবে লিখে রাখুন, যার উচ্চতা তাদের distance-এর সমান।
3. $C_{new}$ থেকে বাকি প্রতিটা cluster-এর distance দিয়ে D update করুন।
4. একটা মাত্র cluster না থাকা পর্যন্ত চালিয়ে যান। তৈরি হওয়া tree-টাকে বলে **dendrogram**; কোনো একটা উচ্চতায় এটাকে কাটলে একটা সাধারণ (flat) clustering পাওয়া যায়।

দুটো *cluster*-এর মধ্যে distance কীভাবে মাপব? এই বাছাইটাকে বলে **linkage**:

$$D_{\min}(C_1, C_2) = \min_{i\in C_1, j\in C_2} D_{ij} \;(\text{single}) \qquad D_{\text{avg}}(C_1,C_2) = \frac{\sum_{i\in C_1}\sum_{j\in C_2} D_{ij}}{|C_1||C_2|}\;(\text{average})$$

আর আছে $D_{\max}$, অর্থাৎ জোড়ায় জোড়ায় distance-গুলোর মধ্যে সবচেয়ে বড়টা (complete linkage)।

**হাতে-কলমে উদাহরণ।** একটা রেখার ওপর চারটা বিন্দু: A = 1, B = 2, C = 6, D = 8। জোড়ায় জোড়ায় distance: AB 1, CD 2, BC 4, AC 5, BD 6, AD 7।
1. A আর B জুড়ুন (distance 1)।
2. C আর D জুড়ুন (distance 2), কারণ বাকিদের মধ্যে এরাই সবচেয়ে কাছের জোড়া।
3. {A,B} আর {C,D}-এর distance: **single** = min(5, 7, 4, 6) = 4; **average** = (5 + 7 + 4 + 6)/4 = 5.5; **complete** = 7। শেষ merge-টা হয় সেই উচ্চতায়।

Single linkage মাঝের বিন্দুগুলোর মাধ্যমে cluster-গুলোকে শিকলের মতো জুড়ে ফেলার (**chaining**) প্রবণতা দেখায়; complete linkage দেয় আঁটসাঁট cluster; average থাকে এই দুইয়ের মাঝামাঝি। Distance matrix-এর ওপর average linkage হুবহু **UPGMA**, যার দেখা আপনি আবার পাবেন phylogenetic tree বানানোর সময়।

{{widget:hclust}}

দুই অক্ষেই dendrogram-সহ heatmap (genes × samples, প্রতিটা অক্ষ তার নিজের tree অনুযায়ী নতুন করে সাজানো) হলো expression paper-এর সবচেয়ে পরিচিত ছবি।

:::think 10,000 gene, 50 condition: hierarchical clustering না k-means?
Hierarchical clustering-এর সব জোড়ার distance লাগে: প্রায় 5 × 10⁷ জোড়া, আর সময় লাগে অন্তত O(n²) (সাদামাটা implementation-এ O(n³)), কারণ 9,999-টা merge-এর প্রতিটার পর distance নতুন করে হিসাব করতে হয়। আধুনিক computer-এ এটা করা সম্ভব, কিন্তু ধীর আর প্রচুর memory খায়, এবং আকার বাড়লে খরচ বাড়ে বর্গ হারে। k-means-এর প্রতি iteration-এ খরচ O(n · k · m) (n gene, k cluster, m condition), তাই এটা সহজেই বড় data-য় চলে। খুব বড় n-এর জন্য (ধরুন দশ লাখ cell) k-means বা graph-based পদ্ধতিই বাস্তবসম্মত; কয়েক হাজার item হলে hierarchical clustering-এর পূর্ণ tree-টা খরচের যোগ্য।
:::

:::think Hierarchical clustering-এর দুর্বল দিকগুলো কী?
1. **খরচ:** item-এর সংখ্যার সাপেক্ষে অন্তত quadratic।
2. **ফেরানো যায় না:** এটা greedy, তাই শুরুর দিকের একটা খারাপ merge (যেমন কোনো outlier-এর কারণে) আর কখনো উল্টানো যায় না।
3. **Linkage বাছাই গুরুত্বপূর্ণ:** single, average আর complete linkage বেশ আলাদা tree দিতে পারে, আর কোনোটাই সব dataset-এর জন্য সঠিক নয়।
4. Cluster পেতে **dendrogram কোথায় কাটবেন**, সেটা বিচার-বিবেচনার ব্যাপার।
:::
