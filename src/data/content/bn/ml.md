আপনার কাছে আছে স্বাভাবিক আর tumour ফুসফুস টিস্যুর RNA-seq data, প্রতিটা sample-এর label সহ। নতুন একটা sample এল: এটা কি tumour? আরেক ক্ষেত্রে, আপনার কাছে আছে পরিচিত toxic আর non-toxic peptide-এর sequence। নতুন একটা peptide কি toxic? দুটোই **supervised learning** সমস্যা: **label দেওয়া উদাহরণ** থেকে একটা function শিখুন, তারপর নতুন উদাহরণের label অনুমান করুন। এই lesson অনুসরণ করে lecture-এর 7-ধাপের pipeline আর Libbrecht & Noble-এর review *Machine learning applications in genetics and genomics* (Nature Reviews Genetics, 2015)। এখানে কোনো একটা নির্দিষ্ট algorithm-এর চেয়ে বেশি জোর দেওয়া হয়েছে পুরো প্রক্রিয়াটা সঠিকভাবে করার উপর, কারণ বাস্তবে বেশিরভাগ ভুল ঠিক সেখানেই হয়।

## Unsupervised বনাম supervised sample classification

নতুন ফুসফুসের sample-টা classify করার দুটো উপায় আছে:

- **Unsupervised পথ:** label ব্যবহার না করেই সব sample-কে cluster বা project করুন (hierarchical clustering, k-means, PCA, MDS), দেখুন label-ওয়ালা sample-গুলো কোথায় পড়ছে, আর নতুন sample-টা যে পরিচিত sample-গুলোর কাছে গিয়ে পড়ে, সেই অনুযায়ী তাকে label দিন।
- **Supervised পথ:** training-এর সময় label ব্যবহার করে শিখুন **কোন feature-গুলো class-গুলোকে আলাদা করে**, আর **cross-validation** দিয়ে মূল্যায়ন করুন, যাতে নিশ্চিত হওয়া যায় model-টা না-দেখা sample-এও কাজ করে।

ভালো label থাকলে supervised learning সাধারণত অনেক বেশি নির্ভুল, কারণ এটা ঠিক সেই পার্থক্যগুলোর দিকে মনোযোগ দেয় যেগুলো প্রশ্নটার জন্য গুরুত্বপূর্ণ। অন্যদিকে unsupervised learning এমন structure খুঁজে পায় যেটা খোঁজার কথা আপনি জানতেনই না (যেমন, একটা নতুন tumour subtype)।

:::story উত্তরপত্র ছাড়া আর উত্তরপত্র সহ ছবি বাছাই
কাউকে টিস্যু sample-এর এক হাজারটা label ছাড়া ছবি দিন আর বলুন এগুলো আলাদা আলাদা স্তূপে ভাগ করতে: সে চোখে যা সবচেয়ে বেশি পড়ে সেই অনুযায়ী ভাগ করবে (staining, আলো, টিস্যুর ধরন), যেটা tumour বনাম normal হতেও পারে, না-ও হতে পারে। এটা unsupervised learning। এবার একই ছবিগুলো দিন, সঙ্গে অর্ধেক ছবির উত্তরপত্র — তখন সে শিখে নেবে **ঠিক কোন feature-গুলো আসলে tumour-কে normal থেকে আলাদা করে**। এটা supervised learning, আর এ কারণেই label যখন বিশ্বাসযোগ্য, তখন সাধারণত সেটাই জেতে।
:::

{{ref:expression1#k-means-as-an-optimization-problem|expression2#pca-two-equivalent-views}}

**Generative বনাম discriminative model** (Libbrecht & Noble):
- **Generative** model বর্ণনা করে প্রতিটা class-এর data কীভাবে তৈরি হয়: $\Pr(x \mid \text{class})$। উদাহরণ: HMM, naive Bayes। এগুলো সহজে ব্যাখ্যা করা যায় (interpretable) আর missing data স্বাভাবিকভাবেই সামলাতে পারে।
- **Discriminative** model সরাসরি class-গুলোর মধ্যকার সীমারেখা শেখে: $\Pr(\text{class} \mid x)$, বা শুধু একটা সিদ্ধান্তের নিয়ম। উদাহরণ: logistic regression, SVM, neural network। Data প্রচুর থাকলে এগুলো প্রায়ই বেশি নির্ভুল।

## 7-ধাপের pipeline

Lecture-এ একটা supervised bioinformatics project-কে সাতটা ধাপে সাজানো হয়েছে। Lesson-এর বাকি অংশে আমরা একটা একটা করে ধাপগুলো দেখব।

1. **Problem formulation:** ঠিক কী predict করব, কিসের ভিত্তিতে?
2. **Data collection:** নির্ভরযোগ্য label-ওয়ালা উদাহরণ কোথা থেকে আসবে?
3. **Feature extraction:** sequence-কে সংখ্যায় রূপান্তর।
4. **Feature selection:** তথ্যবহুল সংখ্যাগুলো রেখে দেওয়া।
5. **Classification algorithm:** একটা model বেছে নিয়ে train করা।
6. **Testing:** সৎভাবে performance মাপা (metric আর sampling)।
7. **Deployment:** model-টাকে অন্যদের ব্যবহারযোগ্য করা (যেমন, একটা web server)।

## ধাপ 1–2: সমস্যা নির্ধারণ আর data সংগ্রহ

**কী কী predict করা যায়?** প্রায় যেকোনো কিছু, যার উত্তর কিছু উদাহরণের জন্য জানা আছে:
- **DNA:** কোথায় replication origin, promoter বা enhancer আছে, কোথায় recombination hot-spot, methylation site বা protein-binding site।
- **RNA:** কোষের ভেতরে অবস্থান (subcellular location), coding বনাম non-coding, editing site, RNA-র ধরন।
- **Protein:** inflammatory বনাম anti-inflammatory, toxicity, antiviral activity, bacteriophage protein, DNA-binding, subcellular localization।
- **Interaction:** drug–target, protein–protein।

সাধারণত **input হলো একটা sequence**, আর **output একটা class** (binary, multi-class, বা multi-label — যখন একটা item-এর একসঙ্গে একাধিক label থাকতে পারে), অথবা একটা সংখ্যা (regression)।

**Data** আসে যাচাই করা উৎস থেকে: পরীক্ষাগারের experiment (in vitro), প্রকাশিত গবেষণা (literature), আর curated database (UniProt, PDB, GEO…)। যেসব সমস্যা নিয়ে অনেক কাজ হয়েছে, সেখানে প্রকাশিত **benchmark dataset** ব্যবহার করুন — এতে অন্যান্য method-এর সঙ্গে ন্যায্য তুলনা করা যায়।

{{ref:tools#databases-you-will-use}}

Data নিয়ে দুটো চিরাচরিত সমস্যা:

- **Class imbalance।** Positive উদাহরণ প্রায়ই negative-এর তুলনায় অনেক কম (খুব কম peptide-ই toxic), কিংবা negative একেবারেই পাওয়া যায় না (কেউ প্রকাশ করে না যে "এই protein DNA-তে bind *করে না*")। তখন একটা model সবসময় সংখ্যাগরিষ্ঠ class-টা predict করেই উঁচু accuracy পেয়ে যেতে পারে। সমাধান: সংখ্যাগরিষ্ঠ class-কে **undersample** করা, সংখ্যালঘু class-কে **oversample** করা (duplicate করে, বা **SMOTE** দিয়ে, যেটা সংখ্যালঘু class-এর কাছাকাছি উদাহরণগুলোর মাঝখানে কৃত্রিম উদাহরণ তৈরি করে), loss-এ class weight দেওয়া, বা generative augmentation।
- **Redundancy।** Homologous (খুব কাছাকাছি) sequence যদি training আর test দুই set-এই থাকে, তাহলে performance ফুলে-ফেঁপে বেশি দেখায়: model শুধু প্রায়-হুবহু কপিগুলো চিনে ফেলে। Redundancy দূর করতে **sequence-গুলোকে cluster করুন** (যেমন, **CD-HIT** দিয়ে 30–40% identity-তে) আর প্রতিটা cluster থেকে একটা রাখুন, অথবা এমনভাবে ভাগ করুন যাতে পুরো cluster হয় training-এ যায় নয়তো test-এ — আর এটা করতে হবে data ভাগ করার **আগেই**।

## ধাপ 3: feature

Model-এর দরকার সংখ্যা। **Feature extraction** প্রতিটা sequence-কে একটা নির্দিষ্ট দৈর্ঘ্যের vector-এ পরিণত করে।

**k-mer composition** সবচেয়ে সহজ আর সবচেয়ে প্রচলিত। প্রতিটা k-mer গুনুন আর মোট k-mer-এর সংখ্যা দিয়ে ভাগ করুন। `ACGTAC`-এর জন্য k = 2 হলে পাঁচটা 2-mer হলো AC, CG, GT, TA, AC, তাই vector-এ AC = 2/5, CG = GT = TA = 1/5, আর বাকি 12টা dinucleotide 0। যেকোনো দৈর্ঘ্যের sequence এভাবে একটা 16-dimensional vector হয়ে যায়।

{{ref:oric#the-hidden-message-dnaa-boxes|math#counting-how-big-is-the-search-space}}

**Feature-এর ধরন:**
- **Sequence-based:** nucleotide k-mer বা amino-acid/dipeptide composition, gapped k-mer, position-specific encoding (one-hot)।
- **Physico-chemical:** hydrophobicity, charge, polarity, molecular weight, isoelectric point। **Pseudo-amino-acid composition** এগুলোকে sequence-এর ক্রমের তথ্যের সঙ্গে মেলায়।
- **Evolutionary:** PSI-BLAST থেকে পাওয়া **PSSM** profile, বা HMM profile। Homolog-দের মধ্যে প্রতিটা position কতটা conserved, সেটা function সম্পর্কে খুব ভালো পূর্বাভাস দেয়।
- **Structural:** predicted secondary structure, solvent accessibility, disorder; অথবা AlphaFold-predicted 3D structure থেকে নেওয়া feature।
- **Embedding:** dna2vec, ProtVec বা **protein language model** (ESM-2, ProtT5)-এর মতো model থেকে শেখা vector। আজকাল সাধারণত এগুলোই একক feature set হিসেবে সবচেয়ে শক্তিশালী।

আমরা এমন feature পছন্দ করি যেগুলো **হিসাব করা সস্তা** আর **interpretable**। বেশিরভাগ feature-এর **scaling** লাগে (mean 0 আর standard deviation 1-এ standardize করা, বা min–max দিয়ে [0, 1]-এ আনা), বিশেষ করে KNN-এর মতো distance-based model-এর জন্য — নইলে বড় মানের একটা feature-ই পুরো distance-কে নিয়ন্ত্রণ করে ফেলে।

{{widget:kmer-features}}

:::example Sequence থেকে protein function predict করার feature
1. **Composition:** amino-acid composition (20-D), dipeptide বা tripeptide (k-mer) composition, k-spaced residue pair।
2. **Physico-chemical** profile: hydrophobicity, charge, polarity, molecular weight, pI, pseudo-AAC।
3. **Evolutionary তথ্য:** homolog থেকে PSSM বা profile HMM; annotated protein-এর BLAST hit থেকে **homology transfer**।
4. **Structural feature:** predicted secondary structure, solvent accessibility, disorder, বা AlphaFold-predicted structure (contact, pocket)।
5. **Domain আর motif:** Pfam/InterPro domain, signal peptide, transmembrane segment আছে কি না।
6. **শেখা embedding:** protein language-model embedding (ESM-2, ProtT5), dna2vec-ধাঁচের k-mer embedding।
7. **Context** (অনুমতি থাকলে): interaction-network-এ প্রতিবেশী, co-expression partner, partner-দের GO annotation।
:::

## ধাপ 4: feature selection

হাজার হাজার feature আর মাত্র কয়েকশো উদাহরণ — এটা **overfitting**-এর নিশ্চিত রেসিপি: model এমন noise মুখস্থ করে ফেলে যেটা কাকতালীয়ভাবে training set-কে আলাদা করে দেয়। বেশি feature থাকলে training-ও ধীর হয়, আর curse of dimensionality দেখা দেয় (distance-গুলোর অর্থ কমে যায়)। তাই আমরা তথ্যবহুল feature-গুলো বেছে নিই:

- **Filter method:** প্রতিটা feature-কে আলাদাভাবে, model থেকে স্বাধীনভাবে score করুন (variance, label-এর সঙ্গে correlation, χ², mutual information, t-test), আর সেরাগুলো রাখুন। দ্রুত আর সহজ।
- **Wrapper method:** feature-এর বিভিন্ন subset-এর উপর খোঁজ চালান, প্রতিটা subset-কে বিচার করুন model-এর নিজের validation performance দিয়ে (forward selection, backward elimination, recursive feature elimination)। বেশি নির্ভুল, কিন্তু ব্যয়বহুল।
- **Embedded method:** selection ঘটে training-এর ভেতরেই (L1/lasso regularization অকেজো weight-গুলোকে ঠেলে একদম শূন্যে নিয়ে যায়; tree model feature importance দেয়)।
- অথবা selection-এর বদলে dimensionality কমান (PCA), তবে তাতে interpretability কমে যায়।

:::warn Data leakage
Supervised feature selection, আর scaling-এর মতো যেকোনো fit করা preprocessing, অবশ্যই **শুধু training data** দিয়ে করতে হবে। পুরো dataset দিয়ে feature বেছে তারপর cross-validate করলে, কোন feature বাছা হবে তাতে test fold-গুলো আগেই প্রভাব ফেলে দিয়েছে — ফলে result অতিরিক্ত আশাবাদী আর অবৈধ। Bioinformatics ML paper-এ এটা সবচেয়ে সাধারণ ভুলগুলোর একটা। প্রতিটা fit করা ধাপ cross-validation loop-এর *ভেতরে* রাখুন (scikit-learn-এর `Pipeline` আপনার হয়ে এটা করে দেয়)।
:::

## ধাপ 5: classifier বাছাই, যেমন KNN

"যে সবচেয়ে সরল model data-কে ভালোভাবে ব্যাখ্যা করে, সেটাই ব্যবহার করুন।" সরল দিয়ে শুরু করুন, আর জটিলতা যোগ করুন কেবল তখনই যখন সেটা স্পষ্টভাবে কাজে দেয়।

**k-nearest neighbours (KNN):** training set-টা জমা করে রাখুন। নতুন একটা point x-কে classify করতে, তার সবচেয়ে কাছের k টা training point খুঁজুন (সাধারণত scaled feature-এর উপর Euclidean distance), আর তাদের label-এর **সংখ্যাগরিষ্ঠ ভোট (majority vote)** নিন। এখানে আলাদা কোনো training phase-ই নেই।

- **ছোট k** (যেমন 1) training data-র প্রতিটা খামখেয়ালিপনা অনুসরণ করে: এবড়োখেবড়ো decision boundary, overfitting।
- **বড় k** অতিরিক্ত মসৃণ করে ফেলে, ফলে underfit হয়।
- k একটা **hyperparameter**, যেটা validation data দেখে বেছে নেওয়া হয়।

:::story KNN মানে প্রতিবেশীদের জিজ্ঞেস করা
একটা নতুন বাড়ি ধনী না গরিব এলাকায়, তা আন্দাজ করতে চাইলে তার সবচেয়ে কাছের k টা বাড়ি দেখুন। শুধু **একটা** সবচেয়ে কাছের বাড়িকে জিজ্ঞেস করলে (k = 1) পাশের একটা ব্যতিক্রমী বাড়িই আপনাকে বোকা বানাতে পারে: এটা overfitting। আবার **পুরো শহরকে** জিজ্ঞেস করলে প্রতিটা বাড়িই পাবে শহরের সংখ্যাগরিষ্ঠ উত্তর: এটা underfitting। ভালো k এতজন প্রতিবেশীকে জিজ্ঞেস করে যাতে ব্যতিক্রমীটা ভোটে হেরে যায়, কিন্তু এত বেশি নয় যে আপনি নিজের এলাকা ছাড়িয়ে চলে যান।
:::

{{ref:math#distances-and-similarity}}

{{widget:knn}}

**আরও কিছু বহুল-ব্যবহৃত model:** logistic regression, SVM, random forest, gradient boosting (XGBoost), আর neural network (পরের lesson)। Binary classification-এর জন্য **logistic regression** হলো আদর্শ প্রথম model: এটা sigmoid function দিয়ে একটা probability দেয়। এই StatQuest video-টা এটা পরিষ্কারভাবে বোঝায়, আর পরের lesson-এ আমরা এটা গোড়া থেকে বানাব:

{{video:yIYKR4sgzI8}}

## ধাপ 6: testing — metric আর sampling

**Confusion matrix** একটা binary classifier-এর চারটা সম্ভাব্য ফলাফল গোনে: true positive (TP), false positive (FP), true negative (TN) আর false negative (FN)। প্রতিটা metric এটা থেকেই হিসাব করা হয়:

$$\text{Precision} = \frac{TP}{TP+FP},\ \ \text{Recall} = \frac{TP}{TP+FN},\ \ F_1 = \frac{2PR}{P+R}$$
$$\text{MCC} = \frac{TP\cdot TN - FP\cdot FN}{\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}$$

- **Precision:** যেগুলোকে positive বলে predict করা হয়েছে, তার কত অংশ সত্যিই positive? **Recall** (sensitivity): আসল positive-গুলোর কত অংশ আমরা খুঁজে পেয়েছি?
- **Accuracy/error:** কেবল balanced class-এর ক্ষেত্রেই ঠিক আছে।
- **F1** precision আর recall-কে একসঙ্গে মেলায়; **MCC** চারটা ঘরই ব্যবহার করে আর এর মান −1 থেকে 1 (0 = এলোমেলো অনুমানের চেয়ে ভালো নয়)। দুটোই imbalance-এর বিরুদ্ধে টেকসই।
- **AUROC:** threshold-নিরপেক্ষ মাপ — model positive-গুলোকে negative-এর উপরে কতটা ভালোভাবে সাজায়। Positive বিরল হলে **AUPR** (precision–recall curve-এর নিচের ক্ষেত্রফল) AUROC-এর চেয়ে বেশি তথ্য দেয়।

:::example Imbalanced class-এ accuracy কেন বিভ্রান্ত করে
1,000টা peptide, যার 50টা toxic। একটা model দিল TP = 40, FN = 10, FP = 20, TN = 930।
- Precision = 40/60 ≈ **0.67**, recall = 40/50 = **0.80**, F1 ≈ **0.73**, MCC ≈ **0.71**, accuracy = 970/1000 = **0.97**।
- একটা অকেজো model যে সবকিছুকে "non-toxic" বলে, সে accuracy পায় 950/1000 = **0.95** — প্রায় সমান — কিন্তু তার recall 0 আর MCC 0।

Accuracy এদের মধ্যে প্রায় কোনো পার্থক্যই দেখায় না; recall, F1 আর MCC দেখায়।
:::

{{widget:confusion}}

{{game:metric-match}}

**Sampling strategy** (সৎ মূল্যায়নের জন্য data কীভাবে ভাগ করবেন):
- **Train–test split:** এক অংশে train করুন, আলাদা করে রাখা অংশের ফল report করুন।
- **Train–validation–test:** hyperparameter (যেমন KNN-এর k) শুধু validation set দেখে tune করুন, আর test set-এ হাত দিন একবারই, একেবারে শেষে।
- **k-fold cross-validation:** data-কে k টা fold-এ ভাগ করুন, k − 1টায় train করে বাকি একটায় test করুন, এভাবে ঘুরিয়ে ঘুরিয়ে করে গড় নিন। **Stratified** fold প্রতিটা fold-এ class-এর অনুপাত একই রাখে।
- ভিন্ন উৎস থেকে আসা (অন্য lab, অন্য organism বা অন্য সময়কাল) একটা **independent test set** হলো gold standard।

:::think Cross-validation-এ আপনার model-এর MCC 0.95, কিন্তু অন্য lab-এর data-তে অনেক খারাপ। সমস্যা কোথায়?
সাধারণ অপরাধীরা:
- **Redundancy:** প্রায়-অভিন্ন (homologous) sequence training আর test দুই fold-এই চলে গেছে, তাই cross-validation মেপেছে মুখস্থ করার ক্ষমতা, generalization নয়।
- **Leakage:** feature selection, scaling বা tuning-এ data ভাগ করার আগেই পুরো dataset ব্যবহার করা হয়েছে।
- **Batch effect আর distribution shift:** নতুন lab ভিন্ন protocol, যন্ত্র বা জনগোষ্ঠী ব্যবহার করে, তাই feature-গুলো দেখতে আলাদা।
- **ছোট dataset-এ overfitting:** উদাহরণের তুলনায় feature অনেক বেশি।

প্রতিকার: homology-সচেতন split (sequence-গুলোকে cluster করুন, যেমন CD-HIT দিয়ে, আর প্রতিটা cluster এক পাশেই রাখুন), সব fit করা preprocessing training fold-এর ভেতরে করা, আর সবসময় একটা independent test set-এর ফল report করা।
:::

## ধাপ 7: deployment

একটা model অন্যদের কাজে আসে কেবল তখনই, যখন তারা সেটা ব্যবহার করতে পারে। এটাকে একটা **web server**, একটা package, বা অন্তত code আর trained weight হিসেবে প্রকাশ করুন। Slides-এর একটা উদাহরণ: **ToxinPred2** (Raghava lab, IIIT-Delhi), যেটা sequence থেকে peptide আর protein-এর toxicity predict করে, batch-এ, একটা web interface-এর মাধ্যমে।

এই সাতটা ধাপের পেছনে যে ব্যবহারিক দক্ষতা কাজ করে, তা হলো biological data-র জন্য সঠিক code লেখা। একটা bioinformatics ML channel-এর এই video-তে Rosalind ব্যবহার করে সেই coding-এর মানসিকতাটা দেখানো হয়েছে:

{{video:6oHl7hNWn2o}}

:::sota এই ক্ষেত্র এখন কোথায় দাঁড়িয়ে
- Protein-function prediction-এ এখন প্রাধান্য **protein language-model embedding + হালকা classifier**-এর, আর structure-সচেতন model-এর।
- Genomics-এ deep sequence model (Enformer, AlphaGenome) দিয়ে সরাসরি DNA থেকে regulatory activity predict করা হয়।
- কোন classifier বাছলেন তার চেয়ে **কঠোর মূল্যায়ন** (homology-সচেতন split, আলাদা করে রাখা organism, শক্তিশালী সরল baseline) বেশি গুরুত্বপূর্ণ।
:::
