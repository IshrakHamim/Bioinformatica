লেকচার নোটে বলা হয়েছিল, "একটা protein-এর 3D গঠন, আর সেই সূত্রে তার কাজ, ঠিক হয় তার sequence দিয়ে।" অথচ শুধু sequence দেখে সেই গঠন আগে থেকে বলে দেওয়া প্রায় 50 বছর ধরে জীববিজ্ঞানের সবচেয়ে বড় চ্যালেঞ্জগুলোর একটা ছিল। 2020 থেকে 2024-এর মধ্যে একক protein chain-এর ক্ষেত্রে সমস্যাটার মোটামুটি সমাধান হয়ে গেছে, আর এই কাজের জন্যই এসেছে **2024 সালের রসায়নে Nobel Prize**। এই lesson-এ দেখব কীভাবে এটা সম্ভব হলো, research-এর জন্য এর অর্থ কী, আর কোন প্রশ্নগুলো এখনও খোলা। এখানে Introduction lesson-এর protein-এর মৌলিক ধারণা, multiple sequence alignment আর neural network-এর ওপর ভর করে এগোব।

{{ref:intro#proteins-sequence-structure-function}}

শুরুটা হোক গল্প দিয়ে: এই documentary-তে AlphaFold দলকে সেই প্রতিযোগিতার ভেতর দিয়ে অনুসরণ করা হয়েছে, যেটা পুরো ক্ষেত্রটাকেই বদলে দিয়েছিল।

{{video:gg7WjuFs8F4}}

## Protein folding সমস্যা এবং CASP

**Prediction কেন দরকার?** পরীক্ষাগারে structure বের করার পদ্ধতিগুলো (X-ray crystallography, NMR, cryo-electron microscopy) দিয়ে একটা protein-এর গঠন জানতে কয়েক মাস থেকে কয়েক বছর লেগে যেতে পারে, আর কিছু protein-এর ক্ষেত্রে এসব পদ্ধতি একেবারেই কাজ করে না। **Protein Data Bank (PDB)**-তে পরীক্ষা করে পাওয়া structure আছে প্রায় 200,000+, অথচ sequencing থেকে আমরা পেয়েছি **কয়েকশো মিলিয়ন** protein sequence। এই বিশাল ফারাকটা পূরণ করে prediction।

**কঠিন কেন?** কয়েকশো amino acid-এর একটা chain তাত্ত্বিকভাবে অকল্পনীয় রকম বেশি উপায়ে ভাঁজ হতে পারে, তবু আসল protein প্রতিবার নির্ভরযোগ্যভাবে একটাই নির্দিষ্ট আকারে ভাঁজ হয়। পদার্থবিজ্ঞানের নিয়ম ধরে সরাসরি এটা simulate করা বেশিরভাগ protein-এর জন্য অনেক বেশি ধীর।

**CASP** (Critical Assessment of protein Structure Prediction) 1994 সাল থেকে প্রতি দুই বছরে একবার হয়, আর এটা একটা **blind** প্রতিযোগিতা: অংশগ্রহণকারীদের এমন protein-এর sequence দেওয়া হয় যাদের structure পরীক্ষাগারে বের করা হয়ে গেছে কিন্তু এখনও প্রকাশ করা হয়নি। পরে structure প্রকাশ হলে prediction-গুলোর নম্বর দেওয়া হয়। নির্ভুলতা মাপা হয় **GDT** দিয়ে (0–100; মোটামুটিভাবে, কত শতাংশ residue তার আসল অবস্থান থেকে একটা নির্দিষ্ট দূরত্বের মধ্যে বসানো গেছে)। প্রায় 90-এর ওপরে স্কোর হলে সেটাকে পরীক্ষাগারের ফলাফলের সমকক্ষ ধরা হয়।

Deep learning আসার আগে সবচেয়ে ভালো পদ্ধতিগুলো পদার্থবিজ্ঞান বা পরিসংখ্যান-ভিত্তিক energy function-এর সঙ্গে জানা structure-এর টুকরো জোড়া লাগানোর কৌশল মেলাত (Rosetta), আর **template** থেকে নকল করত, অর্থাৎ কাছাকাছি sequence-এর জানা structure থেকে।

**মূল জৈবিক সংকেত: co-evolution।** ধরা যাক ভাঁজ হওয়া protein-এ residue i আর j একে অপরকে স্পর্শ করে। তাহলে i-তে এমন কোনো mutation হলে যেটা এই সংযোগ নষ্ট করে, প্রায়ই j-তে আরেকটা mutation এসে সেটা পুষিয়ে দেয়। ফলে একটা protein family জুড়ে **multiple sequence alignment**-এর i আর j column একসঙ্গে বদলায়। এমন পরস্পর-সম্পর্কিত column খুঁজে পেলে বোঝা যায় কোন কোন residue **contact**-এ আছে, আর যথেষ্ট contact জানলে পুরো fold মোটামুটি ঠিক হয়ে যায়। এই কারণেই structure prediction-এ MSA এত কেন্দ্রীয় ভূমিকা রাখে।

{{ref:alignment#multiple-sequence-alignment}}

## AlphaFold 2: কীভাবে কাজ করে

**CASP14 (2020)।** AlphaFold 2 সব target মিলিয়ে প্রায় 92 median GDT পেয়েছিল, যা অনেক protein-এর ক্ষেত্রে পরীক্ষাগারের নির্ভুলতার সমান। পদ্ধতিটা Jumper et al. *Nature*-এ (2021) প্রকাশ করেন, সঙ্গে open-source code-ও দেন।

**Pipeline-টা এরকম:**
1. **Input:** target sequence, বড় বড় sequence database খুঁজে পাওয়া সম্পর্কিত sequence-গুলোর একটা **MSA**, আর (ঐচ্ছিকভাবে) structural **template**।
2. **Evoformer** (48টি block): এটা একটা **transformer** (এমন neural network যা *attention*-এর ওপর দাঁড়িয়ে, যার ফলে input-এর প্রতিটা উপাদান বাকি সব উপাদানের দিকে "তাকাতে" পারে)। এটা দুটো representation একসঙ্গে আপডেট করে: একটা **MSA representation** (sequence × residue), আর একটা **pair representation** (residue × residue, অর্থাৎ "residue i আর j-এর মধ্যে সম্পর্ক কী?" প্রশ্নের একটা শেখা রূপ)। দুটোর মধ্যে তথ্য আসা-যাওয়া করে। "**Triangle**" update-গুলো জ্যামিতিক সামঞ্জস্য বজায় রাখে: i যদি j-এর কাছে থাকে আর j যদি k-এর কাছে থাকে, তাহলে i থেকে k-এর দূরত্বও সেই অনুযায়ী সীমাবদ্ধ হয়ে যায়।
3. **Structure module:** representation-গুলোকে 3D coordinate-এ রূপান্তর করে। প্রতিটা residue-কে একটা rigid body (একটা "frame") হিসেবে ধরা হয়, যাকে **invariant point attention** দিয়ে ঘোরানো ও সরানো হয়। এর ফলে পুরো protein মহাশূন্যে কোন দিকে মুখ করে আছে তার ওপর ফলাফল নির্ভর করে না। এরপর side chain যোগ করা হয়।
4. **Recycling:** output-টাকে কয়েকবার network-এর মধ্য দিয়ে ফেরত পাঠিয়ে আরও নিখুঁত করা হয়।
5. **Confidence output:** **pLDDT** (প্রতিটা residue-র জন্য আস্থার মাপ, 0–100) আর **PAE** (residue জোড়ার মধ্যে predicted aligned error, যা বলে দেয় দুটো domain-এর আপেক্ষিক অবস্থানে ভরসা করা যায় কি না)।

{{ref:neural#neural-networks}}

## AlphaFold DB: 200 মিলিয়ন structure

2021 সালে DeepMind আর **EMBL-EBI** মিলে AlphaFold Protein Structure Database চালু করে। **2022** সালে এটা বেড়ে **200 মিলিয়নেরও বেশি** predicted structure-এ পৌঁছায়, যা UniProt-এর প্রায় সব protein-কে ঢেকে দেয়। এখন বেশিরভাগ protein project-এর শুরুতেই গবেষকেরা predicted structure-টা খুঁজে দেখে নেন।

নিজে একবার ঘুরে দেখুন। একটা protein বেছে নিন আর রংগুলো লক্ষ করুন; রং দিয়ে pLDDT দেখানো হচ্ছে:

{{widget:alphafold}}

**pLDDT কীভাবে পড়বেন:**
- **> 90** খুব বেশি আস্থা: backbone, আর সাধারণত side chain-ও, ঠিক আছে।
- **70–90** আস্থাযোগ্য: backbone সাধারণত ঠিক।
- **50–70** কম আস্থা: সাবধানে ব্যবহার করুন।
- **< 50** খুবই কম। এই অঞ্চলগুলো প্রায়ই **intrinsically disordered** (বাস্তবেই যাদের কোনো একটা নির্দিষ্ট স্থির আকার নেই)। তাই খুব কম pLDDT অনেক সময় নিছক ব্যর্থতা নয়, বরং একটা সত্যিকারের জৈবিক সংকেত।

আলাদা আলাদা domain কীভাবে সাজানো আছে, সেটায় ভরসা করার আগে অবশ্যই PAE-ও দেখে নেবেন।

{{ref:tools#databases-you-will-use|tools#file-formats}}

চিকিৎসা ও ওষুধ আবিষ্কারে AlphaFold-এর তাৎপর্য কী, সেটা একটা medical journal-এর এই ছোট ব্যাখ্যামূলক video-তে দেখানো হয়েছে:

{{video:7q8Uw3rmXyE}}

## AlphaFold 3, RoseTTAFold এবং language model দিয়ে folding

- **AlphaFold 3** (Abramson et al., *Nature* 2024) এমন **complex-এর যৌথ structure** predict করে যেখানে protein, **DNA, RNA, small-molecule ligand, ion** আর modified residue একসঙ্গে থাকে। এতে Evoformer-এর জায়গায় এসেছে হালকা একটা **Pairformer**, আর structure module-এর জায়গায় একটা **diffusion module**, যা সরাসরি atom-এর coordinate তৈরি করে। (Diffusion model শেখে কীভাবে noise সরাতে হয়: এটা এলোমেলো atom অবস্থান থেকে শুরু করে ধাপে ধাপে noise সরিয়ে একটা structure-এ পৌঁছায়, ঠিক যেভাবে image diffusion model noise থেকে ছবি বানায়।) Protein–ligand interaction-এর ক্ষেত্রে এটা docking tool-গুলোর চেয়ে অনেক বেশি উন্নতি দেখিয়েছে বলে জানানো হয়েছে। এটা AlphaFold Server-এর মাধ্যমে ব্যবহার করা যায়, আর November 2024-এ academic ব্যবহারের জন্য code ও weight প্রকাশ করা হয়েছে।
- **RoseTTAFold** (Baek et al., *Science* 2021, Baker lab): একটা "three-track" network, যা sequence, residue–residue দূরত্ব আর 3D coordinate, এই তিনটা নিয়ে একসঙ্গে যুক্তি করে। এর all-atom উত্তরসূরি nucleic acid আর small molecule সহ complex-ও সামলাতে পারে।
- **ESMFold** (Lin et al., *Science* 2023, Meta): এটা **ESM-2 protein language model** ব্যবহার করে (15 বিলিয়ন পর্যন্ত parameter, শুধু sequence দিয়ে train করা), আর কোনো MSA ছাড়াই **একটামাত্র sequence** থেকে structure predict করে, AlphaFold 2-এর চেয়ে অনেক দ্রুত। এটা দিয়ে প্রায় 600 মিলিয়ন metagenomic protein-এর structure predict করা হয়েছে (ESM Metagenomic Atlas)।
- **ESM3** (Hayes et al., *Science* 2025, EvolutionaryScale): sequence, structure আর function জুড়ে একটা multimodal generative model। এটা **esmGFP** তৈরি করেছে, একটা উজ্জ্বল fluorescent protein, যার জানা fluorescent protein-গুলোর সঙ্গে মিল মাত্র 58%।

**MSA ছাড়া একটা language model কীভাবে protein fold করতে পারে?** একটা protein language model-কে কয়েকশো মিলিয়ন sequence-এর ওপর train করা হয় এমনভাবে, যাতে লুকিয়ে রাখা (masked) amino acid-কে আশপাশের context দেখে অনুমান করতে পারে। এটা ভালোভাবে করতে গেলে model-কে শিখতেই হয় কোন কোন position একসঙ্গে বদলায়। এটা আসলে সেই একই co-evolution সংকেত যা MSA দেয়, শুধু এখানে সেটা জমা থাকে model-এর weight-এর ভেতরে। ESM-2-এর architecture আর training এই video-তে ব্যাখ্যা করা হয়েছে:

{{video:_9oTqDWGaFc}}

Folding সমস্যা থেকে শুরু করে AlphaFold-এর প্রভাব পর্যন্ত পুরো গল্পটার গভীর কিন্তু সহজবোধ্য একটা 25 মিনিটের ব্যাখ্যা চাইলে, একটা video-র মধ্যে এটাই সবচেয়ে ভালো:

{{video:P_fHJIYENdI}}

## Protein design এবং 2024 সালের Nobel Prize

Prediction-এর প্রশ্ন হলো: sequence → structure। **Design**-এর প্রশ্নটা উল্টো: কোন sequence এমন একটা structure-এ ভাঁজ হবে যেটা আমাদের চাওয়া কাজটা করবে? যেমন কোনো virus-এর সঙ্গে আটকে যাওয়া, কিংবা এমন একটা রাসায়নিক বিক্রিয়া ঘটানো যা প্রকৃতির কোনো enzyme করে না।

Design করা protein কী কী করতে পারে, David Baker এই talk-এ সেটা বুঝিয়েছেন:

{{video:PJLT0cAPNfs}}

- **RFdiffusion** (Watson et al., *Nature* 2023): একটা diffusion model, যা এলোমেলো coordinate থেকে noise সরিয়ে **নতুন protein backbone** তৈরি করে (binder, symmetric assembly, enzyme scaffold), আর এই প্রক্রিয়াটাকে কাঙ্ক্ষিত আকার বা binding target-এর দিকে চালিত করা হয়। Design করা একটা binder influenza haemagglutinin-এর সঙ্গে যুক্ত অবস্থায় তার cryo-EM structure বের করা হয়েছিল, আর সেটা design-এর সঙ্গে খুব কাছাকাছি মিলে গেছে।
- **ProteinMPNN** (Dauparas et al., *Science* 2022): একটা নির্দিষ্ট backbone দেওয়া থাকলে কোন sequence সেই আকারে ভাঁজ হবে তা design করে (একে বলে "inverse folding" সমস্যা)।
- **সাধারণ design loop:** RFdiffusion একটা backbone বানায় → ProteinMPNN সেই backbone-এর জন্য sequence design করে → AlphaFold দিয়ে যাচাই করা হয় প্রতিটা sequence ওই আকারে ভাঁজ হবে বলে predict হচ্ছে কি না → সেরা candidate-গুলো ল্যাবে তৈরি করে পরীক্ষা করা হয়।

RFdiffusion কীভাবে কাজ করে, এই technical seminar-এ সেটা ব্যাখ্যা করা হয়েছে:

{{video:wIHwHDt2NoI}}

**2024 সালের রসায়নে Nobel Prize:** অর্ধেক পেয়েছেন **David Baker** (University of Washington), "computational protein design-এর জন্য"; বাকি অর্ধেক যৌথভাবে পেয়েছেন **Demis Hassabis** আর **John Jumper** (Google DeepMind), "protein structure prediction-এর জন্য"।

## Structure থেকে variant: AlphaMissense

একটা **missense variant** একটা amino acid বদলে দেয়। বেশিরভাগই নিরীহ; কিছু protein-কে বিগড়ে দিয়ে রোগ ঘটায়। সম্ভাব্য variant-গুলোর বেশিরভাগের প্রভাব কেউ কখনো মেপে দেখেনি।

**AlphaMissense** (Cheng et al., *Science* 2023) AlphaFold-কে কাজে লাগিয়ে missense variant-কে score দেয়। এটা structure-এর প্রেক্ষাপটের সঙ্গে evolution-এর তথ্য মেলায় (সম্পর্কিত protein-গুলোতে প্রতিটা position-এ কোন amino acid কতটা সহ্য করা হয়?)। এটা মানুষের সম্ভাব্য সব **71 মিলিয়ন** missense variant-কে শ্রেণিবদ্ধ করেছে, যার 89%-কে likely benign বা likely pathogenic হিসেবে চিহ্নিত করেছে; তুলনায় মানব বিশেষজ্ঞরা নিশ্চিত করেছিলেন মাত্র 0.1%। বিরল রোগ নির্ণয়ে variant-গুলোর মধ্যে কোনগুলো আগে দেখতে হবে তা **prioritize** করতে এটা ব্যবহার হয়, তবে সবসময় clinical প্রমাণের পাশাপাশি, কখনোই তার বদলে নয়।

## যে সীমাবদ্ধতাগুলো গবেষকের জানা দরকার

- Prediction বেশিরভাগ ক্ষেত্রে একটা **একক স্থির structure** দেয়। কিন্তু protein গতিশীল: একাধিক conformation, allostery (কিছুর সঙ্গে যুক্ত হলে আকার বদলানো) আর folding pathway, এগুলো ধরা পড়ে না।
- **Disordered region**, যেসব বিরল **orphan protein**-এর আত্মীয় খুব কম (ফলে MSA অগভীর), আর **antibody–antigen** interface, এগুলো এখনও কঠিন।
- **Point mutation stability-র ওপর কী প্রভাব ফেলবে** তা সরাসরি predict করার জন্য AlphaFold নির্ভরযোগ্য নয়; এ কাজের জন্য আলাদা বিশেষায়িত model ব্যবহার করুন।
- Complex prediction (AlphaFold 3) কম-আস্থার অঞ্চলে দেখতে বিশ্বাসযোগ্য কিন্তু বানানো structure **hallucinate** করতে পারে, তাই সবসময় PAE আর pLDDT দেখে নিন।
- উচ্চ আস্থা ≠ নির্দিষ্ট প্রেক্ষাপটে জৈবিক সত্য (ligand, membrane, post-translational modification থাকলে)।

:::sota গবেষণার দিকনির্দেশনা (2025–26)
Conformational ensemble আর dynamics; ওষুধ আবিষ্কারের জন্য protein–ligand co-folding; enzyme আর binder-এর generative design (de novo antibody সহ); function prediction-এর জন্য protein language model; variant interpretation-এ structure-কে যুক্ত করা।
:::
