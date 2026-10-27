Course-এর সূচিতে এমন কিছু বিষয় আছে যেগুলো slide deck-এ শুধু ছুঁয়ে যাওয়া হয়েছে: **variant calling**, **single-cell RNA-seq ও spatial transcriptomics**, **gene ontology ও pathway**, আর **evolutionary ও comparative genomics**। এই পাঠে প্রতিটা বিষয়ের একটা গবেষকের চোখে দেখা মানচিত্র পাবেন, যা দাঁড়িয়ে আছে আপনার আগে শেখা algorithm-গুলোর ওপর। প্রতিটা অংশে বলে দেওয়া আছে সেটা আগের কোন কোন পাঠের ওপর নির্ভর করে, যাতে অচেনা কিছু এলে আপনি সেখানে ফিরে যেতে পারেন।

## Variant calling: কোথায় genome আলাদা

**লক্ষ্য:** একজন মানুষের genome reference থেকে কোথায় কোথায় আলাদা, সেটা খুঁজে বের করা। Variant তিন আকারের হয়:
- **SNV** (single-nucleotide variant): একটা মাত্র base বদলে গেছে;
- ছোট **indel**: কয়েকটা base ঢুকে গেছে (insertion) বা মুছে গেছে (deletion);
- **structural variant (SV):** বড় মাপের deletion, duplication, inversion আর translocation, যার আকার মোটামুটি 50 base থেকে শুরু করে লক্ষ লক্ষ base পর্যন্ত।

**Short read-এর জন্য প্রচলিত pipeline:**
1. Read-গুলোকে reference-এ **map করুন** (BWA-MEM; Read Mapping পাঠ), তারপর অবস্থান অনুযায়ী সাজিয়ে (sort) নিন।
2. **PCR duplicate চিহ্নিত করুন।** এগুলো একই মূল DNA fragment-এর হুবহু কপি; চিহ্নিত না করলে এগুলোকে আলাদা আলাদা স্বাধীন প্রমাণ হিসেবে গোনা হয়ে যেত। এরপর base quality-গুলো আবার calibrate করুন।
3. প্রতিটা অবস্থানে **pileup** দেখুন, অর্থাৎ ওই অবস্থান ঢেকে রাখা সব read একসাথে। একটা **heterozygous** SNV (প্রতিটা allele-এর একটা করে কপি) হলে মোটামুটি 50% read-এ alternative base দেখা যায়; homozygous হলে প্রায় 100% read-এ। কম quality-র একটা মাত্র read-এ ভিন্ন base দেখা গেলে সেটা সম্ভবত sequencing error। GATK HaplotypeCaller-এর মতো পরিসংখ্যানভিত্তিক caller-গুলো ওই অঞ্চলে সম্ভাব্য haplotype-গুলো স্থানীয়ভাবে আবার assemble করে (একটা ছোট **de Bruijn graph** দিয়ে, ঠিক Assembly পাঠের মতো), আর base quality (**Phred** score, Sequencing পাঠ) থেকে **genotype likelihood** হিসাব করে।
4. **DeepVariant** (Google) pileup-গুলোকে ছবিতে রূপান্তর করে, তারপর একটা convolutional neural network দিয়ে genotype শ্রেণিবিভাগ (classify) করে।
5. প্রতিটা variant **ছেঁকে নিন (filter) ও annotate করুন**: কোন gene-এ পড়েছে, তার ফল কী (missense, stop-gain, splice site…), জনগোষ্ঠীতে কত ঘন ঘন দেখা যায় (gnomAD), আর এর সম্ভাব্য প্রভাব কী (AlphaMissense); তারপর ব্যাখ্যা করুন।

{{ref:tools#typical-analysis-workflows|tools#file-formats}}

**Long read** (PacBio HiFi, Nanopore) SV আর বারবার পুনরাবৃত্ত (repetitive) অঞ্চলের ক্ষেত্রে অনেক ভালো কাজ করে। **T2T-CHM13** আর **pangenome graph** reference **reference bias** কমায়। Reference bias মানে হলো: একটা মাত্র linear reference-এ যে sequence নেই, সেই sequence বহনকারী read-গুলো ঠিকমতো map হয় না, ফলে ওই জায়গার variant-গুলো ধরা পড়ে না।

## Single-cell ও spatial transcriptomics: প্রতিটা cell আলাদা করে

**scRNA-seq** (Gene Expression পাঠ) প্রতিটা cell-এর আলাদা করে expression মাপে। Barcode আর UMI-র ব্যাপারটা যদি মনে না থাকে, droplet পদ্ধতির ভিডিওটা আরেকবার দেখে নিন:

{{video:4NAS1qTJmYA}}

**প্রচলিত বিশ্লেষণ**, আর প্রতিটা ধাপ course-এর কোথা থেকে এসেছে:
1. Droplet + barcode লাগানো bead → এমন read যেগুলোতে **cell barcode** আর **UMI** ট্যাগ করা আছে → একটা sparse genes × cells count matrix।
2. **QC:** খালি droplet, মরণাপন্ন cell (mitochondrial RNA-র ভাগ বেশি) আর doublet (একটা droplet-এ দুটো cell) বাদ দিন।
3. Sequencing depth-এর পার্থক্য দূর করতে **normalize** করুন, তারপর log-transform করুন।
4. সবচেয়ে বেশি ওঠানামা করা gene-গুলো (**highly variable gene**) বেছে নিন।
5. **PCA** দিয়ে ~50 dimension-এ নামিয়ে আনুন (Dimensionality Reduction পাঠ)।
6. Cell-গুলোর একটা **k-nearest-neighbour graph** বানান, আর **Leiden** দিয়ে সেটা cluster করুন (এটা modularity-ভিত্তিক একটা community detection পদ্ধতি, Biological Networks পাঠ)।
7. চোখে দেখার (visualization) জন্য **UMAP** বা t-SNE।
8. Marker gene দেখে cluster-গুলোকে cell type হিসেবে **চিহ্নিত (annotate) করুন**, তারপর differential expression, **trajectory inference** (একটা differentiation প্রক্রিয়ার মধ্য দিয়ে cell-গুলোকে "pseudotime" বরাবর সাজানো) আর **RNA velocity** (unspliced আর spliced RNA-র অনুপাত থেকে প্রতিটা cell-এর ভবিষ্যৎ অবস্থা অনুমান করা) করুন।

{{ref:tools#gene-ontology-and-enrichment-analysis}}

**Spatial transcriptomics** tissue-র ভেতরে প্রতিটা মাপের **অবস্থান** ধরে রাখে, ফলে কোন cell type কার পাশে বসে আছে তা দেখা যায় (*Nature Methods* একে 2020 সালের Method of the Year ঘোষণা করেছিল)। এই ছোট পরিচিতিমূলক ভিডিওতে প্রধান পদ্ধতিগুলো দেখানো হয়েছে:

{{video:q74euInZqm4}}

- **Sequencing-ভিত্তিক:** tissue এমন একটা slide-এর ওপর রাখা হয় যেটা অনেকগুলো capture spot দিয়ে ঢাকা, আর প্রতিটা spot-এ একটা করে **spatial barcode** থাকে; তারপর sequence করা হয় (10x Visium আর তার চেয়ে বেশি resolution-এর পরবর্তী প্রযুক্তিগুলো)। একটা spot-এ কয়েকটা cell থাকতে পারে, তাই প্রতিটা spot-এ কোন cell type কতটা আছে তা অনুমান করতে একটা scRNA-seq reference দিয়ে **deconvolution** করতে হয়।
- **Imaging-ভিত্তিক:** in-situ hybridization বা in-situ sequencing সরাসরি microscope-এর নিচে, cell-এর ভেতরের সূক্ষ্ম স্তর পর্যন্ত (subcellular resolution) কয়েকশো থেকে কয়েক হাজার gene পড়তে পারে (MERFISH, Xenium, CosMx)।
- **বিশ্লেষণ:** spatial domain খোঁজা (আশেপাশের অবস্থানগুলোর সাথে মিলিয়ে মসৃণ করে clustering), cell–cell communication বোঝা (ligand–receptor network), আর জায়গাভেদে যাদের expression বদলায় এমন gene (spatially variable gene) খুঁজে বের করা।

Spatial data বিশ্লেষণের আরও গভীর technical পরিচয়ের জন্য:

{{video:_qsHqB67O70}}

## Comparative ও evolutionary genomics: প্রজাতিতে প্রজাতিতে তুলনা

বিভিন্ন প্রজাতির পুরো genome পাশাপাশি তুলনা করে দেখা হয় কোনটা **conserved** বা সংরক্ষিত (সম্ভবত কার্যকর কিছু, কারণ selection এটাকে টিকিয়ে রেখেছে) আর কোনটা **বদলেছে** (adaptation)।

- **Ortholog** হলো বিভিন্ন প্রজাতির এমন gene, যেগুলো তাদের common ancestor-এর একটা gene থেকে এসেছে (তারা **speciation**-এর মাধ্যমে আলাদা হয়েছে)। **Paralog** আলাদা হয় একই genome-এর ভেতরে **gene duplication**-এর মাধ্যমে। Ortholog-রা সাধারণত একই কাজ ধরে রাখে, তাই এক প্রজাতি থেকে আরেক প্রজাতিতে annotation স্থানান্তর করার জন্য এরাই সঠিক জোড়া। Ortholog নির্ণয় করা হয় reciprocal best BLAST hit বা phylogeny দিয়ে (Sequence Alignment আর Phylogeny পাঠ)।
- **Synteny:** বিভিন্ন প্রজাতির মধ্যে gene-গুলোর একই ক্রম বজায় থাকা। **Genome rearrangement** (inversion, translocation) কতটা হয়েছে তা মাপা হয় reversal distance বা breakpoint distance দিয়ে (Compeau & Pevzner, Ch. 6)।
- অনেকগুলো প্রজাতির alignment (multi-species alignment) থেকে পাওয়া **conservation score** (phyloP, phastCons) কার্যকর অংশগুলোকে চিহ্নিত করে, এমনকি যেগুলো protein বানায় না (non-coding) সেগুলোকেও।
- **dN/dS**: প্রতি site-এ non-synonymous substitution (যা amino acid বদলে দেয়) আর synonymous substitution (যা বদলায় না)-এর অনুপাত। এটা 1-এর বেশি হলে বোঝায় **positive selection** (পরিবর্তনকে সুবিধা দেওয়া হচ্ছে); 1-এর কম হলে **purifying selection** (পরিবর্তন সরিয়ে ফেলা হচ্ছে); 1-এর কাছাকাছি হলে neutral evolution।
- **Horizontal gene transfer**-এর মাধ্যমে bacteria-দের মধ্যে gene আদান-প্রদান হয় (এভাবেই antibiotic resistance ছড়ায়), আর **রোগজীবাণুর phylogenomics** দিয়ে রোগের প্রাদুর্ভাব (outbreak) অনুসরণ করা হয় (Nextstrain)।

{{ref:alignment#speed-blast|phylogeny#neighbor-joining}}

## CRISPR ও functional genomics

আগে এই ভিডিওটা দেখে নিন, CRISPR কীভাবে DNA edit করে; নিচের সব bioinformatics সমস্যা এর ওপরই দাঁড়িয়ে।

{{video:6tw_JVz_IEc}}

**CRISPR–Cas9** (2020 সালের রসায়নে Nobel Prize: Emmanuelle Charpentier ও Jennifer Doudna) DNA কাটে এমন একটা জায়গায়, যেটা বেছে দেয় ~20-nucleotide-এর একটা **guide RNA**, আর জায়গাটা থাকে একটা ছোট **PAM** sequence-এর ঠিক পাশে (প্রচলিত SpCas9-এর জন্য NGG)। এখান থেকে যে computational সমস্যাগুলো আসে:
- **Guide design:** এমন guide বাছতে হবে যা target-কে কাটবে কিন্তু আর কোথাও কাটবে না। তার মানে পুরো genome ঘেঁটে এমন **off-target** site খুঁজতে হবে যেগুলো কয়েকটা mismatch সহ guide-এর সাথে মিলে যায়: Read Mapping পাঠের approximate string matching ঠিক এই কাজটাই করে।
- **Pooled CRISPR screen:** একদল cell-এ একসাথে হাজার হাজার gene knock out করা হয়, তারপর যে guide-গুলো টিকে থাকে সেগুলো sequence করে gene ধরে ধরে গোনা হয়, আর সেখান থেকে কোন gene-গুলো অপরিহার্য (essential) তার একটা ক্রম সাজানো হয়।
- **Perturb-seq:** CRISPR perturbation-এর সাথে scRNA-seq readout জুড়ে দেওয়া হয়, যাতে প্রতিটা knockout প্রতিটা gene-এর expression-এ কী প্রভাব ফেলে তা মাপা যায়; এই তথ্য দিয়ে gene regulation-এর কার্যকারণ (causal) model train করা হয়।

{{ref:readmap#approximate-matching-hamming-edit-distance-pigeonhole}}

## Pangenome আর T2T যুগ

- **T2T-CHM13** (2022): প্রথম সম্পূর্ণ, ফাঁকহীন human genome। এটা প্রায় 200 Mb নতুন sequence যোগ করেছে (centromere, rDNA array, segmental duplication), আর এটা সম্ভব হয়েছে long read-এর কারণে (Sequencing আর Assembly পাঠ)।
- **Human Pangenome Reference Consortium**-এর খসড়া (2023, 47 জন মানুষ) অনেকগুলো human haplotype একসাথে একটা **graph** হিসেবে উপস্থাপন করে, ফলে reference bias কমে। Graph-এ read map করা (vg, minigraph) আসলে আপনার শেখা string algorithm-গুলোকেই graph-এর path-এর জন্য সাধারণ রূপ দেওয়া।

{{ref:algo#graphs-the-basics}}

## গবেষণার দক্ষতার checklist

- GEO/SRA data থেকে একটা প্রকাশিত বিশ্লেষণ শুরু থেকে শেষ পর্যন্ত নিজে করে দেখুন।
- Pipeline লিখুন (Snakemake/Nextflow), software environment-এর version রেকর্ড রাখুন, আর চিত্রগুলো এমনভাবে তৈরি করুন যেন আবার হুবহু বানানো যায়।
- গবেষণাপত্রের পদ্ধতি সমালোচনার চোখে পড়ুন: data leakage, batch effect, multiple testing (FDR), আর তুলনার জন্য baseline আছে কি না।
- আগে আপনার biological প্রশ্নটা পরিষ্কার জানুন; algorithm শুধু সেই প্রশ্নের উত্তর দেওয়ার একটা হাতিয়ার।

{{ref:tools#practice-and-keep-learning|math#statistical-significance-and-multiple-testing}}
