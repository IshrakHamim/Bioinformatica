কোর্স syllabus-এর শেষ বিষয়গুলো (representation learning, contrastive learning, modality-র alignment, generative AI) দেখিয়ে দেয় genomics research কোন দিকে যাচ্ছে: **বিপুল পরিমাণ label-ছাড়া তথ্য থেকে DNA, RNA, protein আর কোষের representation শেখা, তারপর সেগুলো বারবার কাজে লাগানো**, prediction আর design দুটোর জন্যই। এই পাঠে আপনার আগে থেকে জানা ধারণাগুলোকে (k-mer, motif profile, HMM, embedding, VAE) আজকের model-গুলোর সঙ্গে জুড়ে দেব, আর দেখব কীভাবে এই model-গুলোকে সমালোচনার চোখে বিচার করতে হয়।

## k-mer থেকে embedding

**একটা sequence-কে সংখ্যায় পরিণত করব কীভাবে?** কোর্সে আপনি এর তিন রকম উত্তর দেখেছেন:

- **One-hot আর k-mer count** (oriC আর Supervised Learning পাঠে): সহজ, কিন্তু অনেক বেশি dimension, বেশিরভাগ ঘর শূন্য (sparse), আর প্রতিটা k-mer বাকি সব k-mer থেকে সমান দূরত্বে। ATGGC যতটা ATGGG থেকে আলাদা, ঠিক ততটাই CACGA থেকেও।
- **Static embedding:** dna2vec (2017) আর ProtVec word2vec ব্যবহার করে প্রতিটা k-mer-এর জন্য একটা ঘন (dense) vector শিখেছিল, যাতে কাছাকাছি k-mer কাছাকাছি vector পায় (এদের cosine similarity alignment score-এর সঙ্গে তাল মিলিয়ে চলে)।
- **Contextual embedding** (transformer): এখানে প্রতিটা *position* (অবস্থান) এমন একটা vector পায় যেটা **চারপাশের পুরো sequence**-এর ওপর নির্ভর করে। একই k-mer promoter-এ এক রকম vector পায়, intron-এ আরেক রকম। জৈবিক "language model"-গুলোর ভিত্তি এটাই।

{{ref:ml#step-3-features|neural#autoencoders}}

**Representation learning-এর রেসিপি:**
1. বিশাল label-ছাড়া তথ্যভান্ডারের ওপর (জানা সব protein sequence, হাজার হাজার genome, লক্ষ লক্ষ কোষ) একটা বড় model-কে **pretrain** করুন **self-supervised** objective দিয়ে, অর্থাৎ এমন objective যেখানে label আসে তথ্য থেকেই।
2. শেখা representation-গুলো অল্প label-ওয়ালা downstream কাজে **আবার ব্যবহার** করুন: model-টাকে fine-tune করে, অথবা এর embedding-এর ওপর একটা ছোট classifier শিখিয়ে নিয়ে।

**Self-supervised objective-গুলো:**
- **Masked language modelling** (BERT-ধাঁচের): কিছু token লুকিয়ে রাখুন, আর model-কে এমনভাবে শেখান যাতে আশপাশের প্রসঙ্গ দেখে সেগুলো আন্দাজ করতে পারে। একটা masked amino acid ঠিকঠাক অনুমান করতে হলে model-কে শিখতে হয় প্রতিটা অবস্থানে কোন residue মানানসই, আর এর মধ্যেই evolution-এর সীমাবদ্ধতাগুলো ধরা পড়ে। DNABERT, Nucleotide Transformer, ESM-2 এটা ব্যবহার করে।
- **Autoregressive modelling** (GPT-ধাঁচের): আগের সব token দেখে পরের token-টা কী হবে তা আন্দাজ করা। Evo/Evo 2 আর protein generator-গুলো এটা ব্যবহার করে। যেহেতু এটা $\Pr(\text{next token} \mid \text{past})$ model করে, তাই এখান থেকে sample নিয়ে নতুন sequence **generate** (তৈরি) করা যায়।
- **Contrastive learning:** একই জিনিসের দুটো "view"-এর representation-কে কাছে টানুন (দুটো augmentation, অথবা জোড়া modality, যেমন একটা protein আর তার লিখিত বর্ণনা, কিংবা একই কোষের RNA আর chromatin-accessibility profile), আর সম্পর্কহীন জোড়াগুলোকে দূরে ঠেলে দিন। CLIP-ধাঁচের এই modality **alignment**-এর ফলে এক modality দিয়ে আরেক modality-তে খোঁজা যায়।
- **Autoencoding / VAE:** তথ্যকে ছোট আকারে সংকুচিত করে আবার আগের রূপে পুনর্গঠন করা (যেমন single-cell data-র জন্য scVI)।

{{ref:math#probability-basics}}

**এক অনুচ্ছেদে attention।** একটা transformer layer-এ প্রতিটা position বাকি সব position-এর তথ্যের একটা weighted average নেয়, আর weight-গুলো (attention) বিষয়বস্তুর (content) ওপর কীভাবে নির্ভর করবে তা model নিজেই শেখে। ফলে একটা enhancer-এর কোনো position কয়েক দশ হাজার base দূরের একটা promoter-এর দিকে "মনোযোগ" দিতে পারে। এমন অনেকগুলো layer পরপর সাজালে ওপরে বলা contextual embedding তৈরি হয়। খরচ বাড়ে sequence-এর দৈর্ঘ্যের বর্গ অনুপাতে, আর সেজন্যই লম্বা context-এর DNA model-গুলোতে বিশেষ architecture লাগে।

পুরো ছবিটা বিস্তারিতভাবে জানতে চাইলে, computational biology-তে protein language model নিয়ে এই MIT lecture-টা গভীরভাবে আলোচনা করে:

{{video:uPoFdCUqBWk}}

## Sequence-to-function model

Deep learning-এর আরেকটা ব্যবহার: আণবিক পরিমাপগুলো (কোনো transcription factor কোথায় bind করে, chromatin কতটা খোলা বা accessible, একটা gene কতটা expressed) **সরাসরি DNA sequence থেকে** আগাম বলে দেওয়া; এর জন্য model-কে বড় বড় পরীক্ষামূলক dataset দিয়ে শেখানো হয়।

| বছর | Model | মূল ধারণা |
|---|---|---|
| 2015 | DeepBind, DeepSEA | CNN motif-এর মতো filter শেখে (data থেকে শেখা PWM!), যা দিয়ে TF binding আর chromatin mark predict করে |
| 2021 | **Enformer** (*Nature Methods*) | ~100 kb receptive field-ওয়ালা একটা transformer, যা হাজার হাজার track predict করে; দূরের enhancer-এর প্রভাবও ধরতে পারে |
| 2025–26 | **AlphaGenome** (Google DeepMind; API June 2025, *Nature* Jan 2026) | **1 Mb** input, বিভিন্ন modality জুড়ে single-base resolution-এ prediction (expression, splicing, accessibility, contact…); **non-coding variant** regulation কতটা বদলায় তার score দেয় |

**কোর্সের সঙ্গে যোগসূত্র।** এসব model-এর প্রথম layer-এর convolution filter-গুলো আসলে ছোট ছোট weight matrix, যেগুলো sequence-এর ওপর দিয়ে সরিয়ে সরিয়ে চালানো হয়। Motif **profile** দিয়ে DNA scan করা ঠিক এটাই। প্রশিক্ষিত model-গুলো Regulatory Motifs পাঠের **regulatory motif**-গুলোকে নতুন করে আবিষ্কার করে, তবে এবার আমাদের হাতে খুঁজে বের করে নয়, তথ্য থেকে নিজে নিজে শিখে।

{{ref:motifs#count-profile-consensus-and-score}}

**Variant-এর ক্ষেত্রে কেন এটা গুরুত্বপূর্ণ?** রোগের সঙ্গে যুক্ত বেশিরভাগ variant **non-coding**: এরা protein sequence বদলায় না, বদলায় regulation। একটা sequence-to-function model reference sequence আর variant sequence দুটোর জন্যই track-এর মান হিসাব করে বের করতে পারে, আর দুটোর পার্থক্য থেকে variant-এর প্রভাবের একটা আনুমানিক মাপ পাওয়া যায়।

AlphaGenome-এর লেখকেরা এই roundtable আলোচনায় তাঁদের model ব্যাখ্যা করেছেন:

{{video:V8lhUqKqzUc}}

## Genomic language model

- **DNABERT** (2021): মানুষের DNA-কে k-mer token-এ ভাগ করে তার ওপর train করা BERT।
- **Nucleotide Transformer** (*Nature Methods* 2025): 50 মিলিয়ন থেকে 2.5 বিলিয়ন parameter, 3,202টি মানব genome আর নানা প্রজাতির 850টি genome-এর ওপর train করা।
- **Evo** (*Science* 2024) আর **Evo 2** (Arc Institute; preprint Feb 2025, *Nature* 2026): **single-nucleotide resolution**-এ কাজ করা autoregressive model। Evo 2-এর দুটো সংস্করণ আছে, 7 বিলিয়ন আর 40 বিলিয়ন parameter-এর; জীবনের সব domain-এর 128,000-এরও বেশি genome থেকে নেওয়া **9.3 ট্রিলিয়নেরও বেশি nucleotide**-এর ওপর এটা train করা হয়েছে, আর এর context **1 মিলিয়ন** token পর্যন্ত। কোনো নির্দিষ্ট কাজের জন্য আলাদা করে শেখানো ছাড়াই এটা variant classify করতে পারে (যেমন **BRCA1**-এর pathogenic বনাম benign variant), আর DNA **generate** করতে পারে, যার মধ্যে আছে bacteriophage genome, যেগুলো পরে গবেষণাগারে পরীক্ষা করে দেখা হয়েছে।

**Variant-কে score দেওয়ার জন্য আলাদা করে না শেখানো সত্ত্বেও একটা language model কীভাবে সেটা পারে?** Model প্রতিটা sequence-কে একটা probability দেয়। একটা ক্ষতিকর mutation সাধারণত sequence-টাকে এমন করে তোলে যে শেখার সময় দেখা কার্যকর sequence-গুলোর তুলনায় সেটাকে কম "স্বাভাবিক" মনে হয়, ফলে তার likelihood কমে যায়। Variant sequence আর reference sequence-এর জন্য model-এর log-likelihood তুলনা করলেই একটা **zero-shot** variant-effect score পাওয়া যায়। HMM আর profile-এর ক্ষেত্রে আপনি যে log-odds যুক্তি ব্যবহার করেছিলেন, এটা ঠিক সেটাই।

{{ref:math#logarithms-likelihood-and-log-odds}}

Arc Institute-এর পক্ষ থেকে Evo 2-এর অফিসিয়াল পরিচিতি:

{{video:o_w-E--u7GQ}}

আর technical খুঁটিনাটির জন্য Evo 2 নিয়ে একটা পূর্ণাঙ্গ research talk:

{{video:Rarn97Wpl1A}}

## Single-cell foundation model

একই রেসিপি single-cell RNA-seq-এ প্রয়োগ করা হয়: প্রতিটা কোষকে gene দিয়ে গড়া একটা "বাক্য" হিসেবে ধরা হয়, যেখানে gene-গুলো expression অনুযায়ী ক্রম অনুসারে সাজানো (rank) বা ভাগে ভাগ (bin) করা থাকে, তারপর কয়েক কোটি কোষের ওপর pretrain করা হয়।
- **Geneformer** (*Nature* 2023): rank-value encoding (expression অনুযায়ী gene-গুলোকে সাজানো), ~30 মিলিয়ন কোষ; in-silico perturbation-এর মাধ্যমে রোগের সম্ভাব্য target প্রস্তাব করতে ব্যবহার হয়েছে।
- **scGPT** (*Nature Methods* 2024): 33 মিলিয়ন+ কোষের ওপর generative pretraining; cell-type annotation, batch integration আর perturbation prediction।

{{ref:expression1#measuring-gene-expression-microarrays-rna-seq-single-cell}}

:::warn বিশ্বাস করার আগে যাচাই করুন
স্বাধীন benchmark-গুলোতে (2023–2025) দেখা গেছে, zero-shot পরিস্থিতিতে single-cell আর DNA foundation model অনেক সময় **সহজ baseline-কেও হারাতে পারে না** (highly variable gene + PCA, k-mer model, বা supervised CNN)। একজন গবেষক হিসেবে আপনার করণীয়: homology বিবেচনা করে বা পুরো chromosome আলাদা রেখে data split করুন, শক্তিশালী সহজ baseline-এর সঙ্গে তুলনা করুন (Supervised Learning পাঠের leakage সতর্কতাটা মনে রাখুন), আর ফলাফলের অনিশ্চয়তা (uncertainty) রিপোর্ট করুন।
:::

{{ref:ml#step-4-feature-selection}}

## Variant effect prediction

গবেষণার একটা কেন্দ্রীয় সমস্যা: একটা variant দেওয়া আছে, এটা কি ক্ষতিকর?
- **Coding variant:** AlphaMissense (structure + evolution), আর protein language model-এর likelihood (ESM দিয়ে ওই position-এ mutant residue আর wild-type residue-র log-probability তুলনা করুন)।
- **Non-coding variant:** sequence-to-function model (Enformer, AlphaGenome) regulatory track-এ কী পরিবর্তন আসবে তার পূর্বাভাস দেয়; genomic language model মাপে variant-টা কতটা "অপ্রত্যাশিত"।
- **Clinical ব্যবহারে** prediction-কে সবসময় মেলানো হয় population frequency (gnomAD: সুস্থ মানুষের মধ্যে যে variant সাধারণ, সেটা গুরুতর কোনো বিরল রোগের কারণ হওয়ার সম্ভাবনা কম), পরিবারে উত্তরাধিকারের ধরন, আর functional assay-এর সঙ্গে, ACMG guideline মেনে।

## কোর্সের ধারণাগুলো আধুনিক AI-তে কোথায় মেলে

| কোর্সের ধারণা | আধুনিক প্রতিরূপ |
|---|---|
| Profile matrix / PWM (Regulatory Motifs) | প্রথম layer-এর CNN filter; motif-এর দিকে attention |
| Sequence-এর ওপর HMM (HMMs) | transformer আর state-space model (Evo-র StripedHyena) |
| Alignment আর MSA (Sequence Alignment) | AlphaFold-এর MSA input; শেখা pairwise representation |
| PCA / t-SNE (Dimensionality Reduction) | VAE আর foundation model-এর latent space; embedding-এর UMAP |
| k-mer feature (Supervised Learning) | শেখা token আর embedding |
| Gibbs sampling / EM | design-এর জন্য diffusion আর autoregressive sampling |
| Log-odds score | variant effect-এর জন্য language model-এর likelihood ratio |
