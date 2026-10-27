**জীববিজ্ঞানের প্রশ্ন:** বিভিন্ন species, gene বা virus strain বংশগতভাবে একে অপরের সঙ্গে কীভাবে সম্পর্কিত, আর একটা outbreak কোথা থেকে শুরু হয়েছিল? দুটো প্রশ্নেরই উত্তর দেয় একটা **phylogenetic tree** (বংশবৃক্ষ): এটা আসলে একদল sequence-এর ইতিহাস সম্পর্কে একটা hypothesis। এই lesson-টা Compeau & Pevzner Vol. 2, Ch. 7 অনুসরণ করে (lecture deck-এর সঙ্গে Phillip Compeau-এর 2024 সালের *Evolutionary Trees* slides)।

## Motivation: outbreak-এর উৎস খোঁজা

**SARS (2003)।** Guangdong প্রদেশের এক ডাক্তার Hong Kong-এর Metropole Hotel-এর 911 নম্বর রুমে উঠেছিলেন। তাঁর মাধ্যমে সংক্রমিত অতিথিরা virus-টা বয়ে নিয়ে গেলেন Hanoi আর Toronto-তে। SARS এল কোথা থেকে? Virus-এর genome-কে বিভিন্ন প্রাণী থেকে সংগ্রহ করা coronavirus-এর সঙ্গে তুলনা করে দেখা গেল, উৎস হলো **বাদুড় (bats)**, আর মাঝখানে **civet** নামের প্রাণী intermediate host হিসেবে virus-টা মানুষের কাছে পৌঁছে দিয়েছিল।

**এই কাজে virus কেন আদর্শ?** Coronavirus, influenza আর HIV — এরা সবাই **RNA virus**, আর RNA replication-এ ভুল হয় প্রচুর, তাই এরা খুব দ্রুত mutate করে। এ কারণেই flu-র টিকা প্রতি বছর বদলাতে হয়, আর HIV-এর এত subtype। এর আরেকটা ফল হলো, মাত্র কয়েক সপ্তাহের ব্যবধানে সংগ্রহ করা virus genome-ও কয়েকটা position-এ আলাদা হয় — আর কে কাকে সংক্রমিত করেছে তা বের করতে ঠিক এই তথ্যটাই দরকার। একই পদ্ধতিতে SARS-CoV-2-এর variant-গুলো trace করা হয়েছে, এবং দেখা গেছে HIV-এর উৎস শিম্পাঞ্জির SIV।

:::story হাতে কপি করা পাণ্ডুলিপি
ছাপাখানা আসার আগে বই কপি করতেন লিপিকাররা, আর প্রত্যেক লিপিকরই কিছু না কিছু ভুল করতেন। ভুলে ভরা একটা কপি থেকে যে নতুন কপি বানানো হয়, সেটা আগের ভুলগুলো তো পায়ই, সঙ্গে নিজের কিছু নতুন ভুলও যোগ করে। এখন টিকে থাকা পাণ্ডুলিপিগুলো জড়ো করুন — **কোন ভুলগুলো কাদের মধ্যে মিলে যায়**, সেই pattern দেখেই বলা যায় কে কার থেকে কপি করেছে: দুটো কপিতে যদি দশটা অস্বাভাবিক ভুল হুবহু মিলে যায়, তাহলে সম্ভবত দুটোই একই হারিয়ে যাওয়া মূল কপি থেকে এসেছে। গবেষকরা সত্যিই এভাবে পাণ্ডুলিপির বংশবৃক্ষ বানান।

Genome-ও ঠিক এভাবেই কপি হয়, এখানে mutation-গুলোই হলো লিপিকারের ভুল। **Distance method** প্রতিটা জোড়া কপির মধ্যে কতগুলো পার্থক্য আছে তা গোনে, তারপর সেই সংখ্যাগুলোর সঙ্গে মেলে এমন একটা tree বসায়। **Character-based method** প্রতিটা ভুলকে আলাদা করে দেখে, আর জিজ্ঞেস করে: কোন tree দিয়ে ব্যাখ্যা করা যায় যে এই ভুলটা কার কার মধ্যে আছে?
:::

আনুষ্ঠানিক সংজ্ঞায় যাওয়ার আগে এই ছোট video-টা দেখে নিন — এখানে দেখানো হয়েছে কীভাবে একটা tree পড়তে হয় আর tree বানানোর মূল যুক্তিটা কী:

{{video:09eD4A_HxVQ}}

:::bio দুটো computational পদ্ধতি
1. **Distance-based:** প্রথমে data-কে সংকুচিত করে প্রতিটা জোড়ার evolutionary distance-এর একটা matrix বানানো হয়, তারপর সেই matrix-এর সঙ্গে মেলে এমন tree তৈরি করা হয়।
2. **Character-based:** সরাসরি aligned sequence নিয়ে কাজ করা হয় (প্রতিটা column একটা "character"), আর tree *এবং* পূর্বপুরুষদের sequence — দুটোই অনুমান করা হয় (parsimony, maximum likelihood)।
:::

## Tree-এর পরিভাষা

- **Leaf** (degree 1) হলো বর্তমানের species বা sequence। **Internal node** হলো তাদের অজানা পূর্বপুরুষ; প্রতিটা internal node একটা বিভাজন বোঝায় (একটা speciation event, বা একটা transmission)।
- একটা leaf-এর একমাত্র প্রতিবেশী হলো তার **parent**, আর এদের দুটোকে যে edge জোড়ে তার নাম **limb**।
- **Edge length** বোঝায় কতটা evolution ঘটেছে, যেমন mutation-এর সংখ্যা।
- **Rooted tree:** একটা node-কে **root** হিসেবে ঠিক করা থাকে — সবার common ancestor — আর সময় root থেকে বাইরের দিকে প্রবাহিত হয়।
- **Unrooted tree:** শুধু সম্পর্ক দেখায়, সময়ের কোনো দিক থাকে না। অনেক method unrooted tree-ই তৈরি করে। এমন tree-কে root করতে হলে একটা **outgroup** যোগ করুন — এমন একটা species যেটা বাকি সবার চেয়ে দূরের বলে আগে থেকেই জানা; root বসবে সেই outgroup-এ যাওয়ার edge-এর উপর।

{{ref:algo#trees-and-recursion}}

## Distance matrix আর additivity

একটা **distance matrix** D প্রতিটা জোড়া leaf-এর জন্য একটা distance $D_{ij}$ দেয়। এটাকে হতে হবে **symmetric** ($D_{ij} = D_{ji}$), **non-negative**, diagonal-এ শূন্য, আর মানতে হবে **triangle inequality** $D_{ik} \le D_{ij} + D_{jk}$। (Slide-এ এটা ছাপা আছে $D_{ij} + D_{jk} \le D_{ik}$ হিসেবে; সঠিক দিকটা উপরেরটাই: j হয়ে ঘুরে যাওয়ার পথ সরাসরি পথের চেয়ে ছোট হতে পারে না।)

**Distance আসে কোথা থেকে?** সাধারণত একটা multiple sequence alignment থেকে: দুটো row কতগুলো column-এ আলাদা তা গুনুন, তারপর একই site-এ একাধিক substitution-এর জন্য সংশোধন করুন (কারণ পরের পরিবর্তন আগের পরিবর্তনকে ঢেকে দেয়)।

{{ref:math#distances-and-similarity|alignment#multiple-sequence-alignment}}

**Tree fit করানো।** Edge length সহ একটা tree-তে দুটো leaf-এর distance হলো তাদের মধ্যকার **path-এর সব edge length-এর যোগফল**। যদি প্রতিটা জোড়ার জন্য এই path length ঠিক $D_{ij}$-এর সমান হয়, তাহলে বলি tree-টা D-কে **fit** করে। আর কোনো একটা tree যদি D-কে fit করে, তাহলে D হলো **additive**।

**সব matrix additive নয়।** এটা যাচাই করার উপায় **four-point condition**: যেকোনো চারটা leaf i, j, k, l নিয়ে তিনটা যোগফল বের করুন — $D_{ij}+D_{kl}$, $D_{ik}+D_{jl}$, $D_{il}+D_{jk}$; এদের মধ্যে বড় দুটো অবশ্যই সমান হতে হবে। (কেন? একটা tree-তে তিনটা জোড়া-বিন্যাসের দুটো মাঝের path-টা দুবার ব্যবহার করে, তাই সমান হয়; তৃতীয়টা মাঝের path একবারও ব্যবহার করে না, তাই ছোট হয়।)

**উদাহরণ।** ধরা যাক leaf i, j, k, l-এর জন্য
$$D = \begin{pmatrix} 0 & 13 & 21 & 22 \\ 13 & 0 & 12 & 13 \\ 21 & 12 & 0 & 13 \\ 22 & 13 & 13 & 0 \end{pmatrix}$$
তিনটা যোগফল হলো $13 + 13 = 26$, $21 + 13 = 34$ আর $22 + 12 = 34$। বড় দুটো সমান, তাই D additive। নিচে আমরা এর tree-টা আবার গড়ে তুলব।

## Neighbor, limb length আর AdditivePhylogeny

**প্রথম ভাবনা** (slides থেকে): সবচেয়ে **ছোট** $D_{ij}$-টা নিন, ধরে নিন leaf i আর j হলো **neighbour** (তাদের parent একই, ধরা যাক m), তারপর i আর j-এর জায়গায় m বসান, যেখানে
$$D_{km} = \frac{D_{ik} + D_{jk} - D_{ij}}{2}$$
তারপর ছোট হয়ে আসা matrix-এ একই কাজ বারবার করুন। (সূত্রটা কেন এমন: k থেকে i-এর path আর k থেকে j-এর path দুটোই m-এর ভেতর দিয়ে যায়, তাই এদের যোগফলে k–m অংশটা দুবার গোনা হয়, সঙ্গে থাকে i–m আর j–m, যারা একসঙ্গে মিলে $D_{ij}$।)

**ফাঁদটা কোথায়।** সবচেয়ে কাছের জোড়াটা **সবসময়** neighbour হয় না। কোনো leaf যদি খুব দ্রুত evolve করে থাকে, তার limb লম্বা হয়, ফলে সে সবার থেকেই দূরে — এমনকি নিজের sibling থেকেও। Neighbour joining (নিচে) এই সমস্যার সমাধান করে।

:::think সবচেয়ে কাছের দুটো leaf কেন sibling না-ও হতে পারে?
Tree-তে দুটো leaf-এর distance হলো তাদের দুটো limb আর তাদের parent-দের মধ্যকার path — এই সবের যোগফল। ধরুন A আর B sibling, কিন্তু A খুব দ্রুত evolve করেছে (লম্বা limb): এখন A **সবার** থেকে দূরে, B থেকেও, আর B হয়তো A-র চেয়ে কোনো cousin C-র বেশি কাছে। সবচেয়ে ছোট $D_{ij}$ বেছে নিলে ভুল করে B আর C-কে জোড়া হবে। Neighbour joining এটা ঠিক করে প্রতিটা leaf-এর বাকি সবার থেকে মোট distance বিয়োগ করে, ফলে যে leaf সবার থেকে দূরে, তার জন্য ক্ষতিপূরণ হয়ে যায়।
:::

**Limb Length Theorem।** একটা additive matrix আর একটা leaf j-এর জন্য, j-এর limb-এর দৈর্ঘ্য
$$\text{LimbLength}(j) = \min_{i,k \neq j} \frac{D_{ij} + D_{jk} - D_{ik}}{2}$$
উদাহরণের matrix-এ: LimbLength(i) = min{(13 + 21 − 12)/2, (13 + 22 − 13)/2, (21 + 22 − 13)/2} = min{11, 11, 15} = **11**, আর LimbLength(j) = min{(13 + 12 − 21)/2, (13 + 13 − 22)/2, (12 + 13 − 13)/2} = **2**।

**AdditivePhylogeny** recursion দিয়ে হুবহু সঠিক tree-টা বানায়:
1. একটা leaf j বেছে নিয়ে তার limb length বের করুন।
2. j-এর row আর column থেকে সেটা বিয়োগ করুন, যাতে j হয়ে যায় 0 দৈর্ঘ্যের একটা "bald" limb (j এখন tree-এর *উপরেই* বসে আছে)।
3. এমন দুটো leaf i, k খুঁজুন যাতে $D_{ij} + D_{jk} = D_{ik}$: তাহলে j আছে i থেকে k-এর path-এর উপর, i থেকে $D_{ij}$ দূরত্বে।
4. j-কে সরিয়ে দিয়ে বাকি leaf-গুলোর tree recursively বানান, তারপর i–k path-এর সেই বিন্দুতে j-কে তার limb সহ **আবার জুড়ে দিন**।

একটা additive matrix-এর জন্য এই পদ্ধতি polynomial time-এ সেই একমাত্র tree-টা পুনর্গঠন করে যেটা matrix-কে fit করে।

## Ultrametric tree আর UPGMA

**Molecular clock।** ধরুন প্রতিটা lineage-এ evolution একই স্থির হারে চলেছে। তাহলে প্রতিটা internal node-এর একটা **বয়স (age)** থাকবে, leaf-গুলোর (বর্তমানের species) বয়স 0, আর root থেকে যেকোনো leaf-এ যাওয়ার path-এর দৈর্ঘ্য একই হবে। এই বৈশিষ্ট্যওয়ালা rooted tree-কে বলে **ultrametric**।

**UPGMA** (Unweighted Pair Group Method with Arithmetic mean) একটা সহজ clustering method, যেটা এই clock ধরে নেয়। আগে ধাপে ধাপে দেখানো video-টা দেখুন, তারপর algorithm-টা অনুসরণ করুন:

{{video:HMKAD13pncQ}}

1. n টা cluster দিয়ে শুরু করুন, প্রতিটা leaf-এর জন্য একটা, প্রত্যেকের বয়স 0।
2. সবচেয়ে **কাছের দুটো cluster** $C_1, C_2$ খুঁজুন, যেখানে দুটো cluster-এর distance মানে তাদের সদস্যদের মধ্যকার distance-এর **গড়**:
$$D_{C_1,C_2} = \frac{\sum_{i\in C_1}\sum_{j\in C_2} D_{ij}}{|C_1|\,|C_2|}$$
3. এদের একটা নতুন node-এর নিচে জুড়ে দিন, যার **বয়স $D_{C_1,C_2}/2$** (দুই দিক distance-এর অর্ধেক করে ভাগ নেয়)। প্রতিটা edge length = age(parent) − age(child)।
4. নতুন cluster থেকে বাকি সবার distance আবার হিসাব করুন (cluster-এর আকার দিয়ে weighted গড় হিসেবে), আর একটা মাত্র cluster না থাকা পর্যন্ত চালিয়ে যান: সেটাই root।

চেনা চেনা লাগছে? লাগারই কথা: UPGMA হুবহু Gene Expression lesson-এর **average-linkage hierarchical clustering**, শুধু এখানে node-এর উচ্চতাকে সময় হিসেবে পড়া হয়।

{{ref:expression1#hierarchical-clustering}}

{{widget:upgma preset="final"}}

{{game:tree-builder}}

:::example UPGMA, যেখানে D(A,B) = 4, D(C,D) = 4, বাকি সব distance 6
1. সবচেয়ে ছোট মান 4 ({A,B} আর {C,D}-এর মধ্যে টাই; A,B নিই)। বয়স **2**-এ **(AB)** জুড়ুন। নতুন distance: D(AB, C) = (6 + 6)/2 = 6, D(AB, D) = 6; D(C, D) = 4 অপরিবর্তিত।
2. সবচেয়ে ছোট মান 4 → বয়স **2**-এ **(CD)** জুড়ুন। D(AB, CD) = (6 + 6 + 6 + 6)/4 = 6।
3. বয়স **6/2 = 3**-এ **(AB)(CD)** জুড়ুন: এটাই root।

Branch length: A, B, C আর D প্রত্যেকে **2** (নিজের cluster node পর্যন্ত); AB → root **1** আর CD → root **1**। Newick: `((A:2,B:2):1,(C:2,D:2):1);`। প্রতিটা leaf root থেকে 3 দূরে, তাই tree-টা ultrametric — UPGMA সবসময় এমন tree-ই বানায়।
:::

:::example Ultrametric tree কী, আর এটা কেন গুরুত্বপূর্ণ?
এটা এমন একটা rooted tree যেখানে **root থেকে প্রতিটা leaf-এর distance সমান**; অন্যভাবে বললে, প্রতিটা internal node-এর একটা বয়স আছে আর সব leaf-এর বয়স 0। এটা **molecular clock** hypothesis-কে প্রকাশ করে (mutation স্থির হারে জমা হয়), যার ফলে branch length থেকে সরাসরি **divergence time** পড়া যায় আর speciation event-এর সময় নির্ধারণ করা যায়।

বাস্তবে কিন্তু বিভিন্ন lineage-এ হার প্রায়ই আলাদা হয় (generation time, population size, selection-এর কারণে), তাই UPGMA-র মতো clock-নির্ভর method **ভুল topology** দিতে পারে। তখন আমরা clock ছাড়া চলে এমন method (neighbour joining, maximum likelihood) বা **relaxed clock** model ব্যবহার করি।
:::

**UPGMA-র দুর্বলতা:** এটা আসলে D-এর সঙ্গে tree fit করায় না; clock না মানলে এটা ব্যর্থ হয়, এমনকি additive matrix-এও; আর গড়গুলো cluster-এর আকার দিয়ে weight করতে হয়। তবুও এটা সহজ, আর দ্রুত একটা baseline হিসেবে ব্যাপকভাবে ব্যবহৃত হয়।

:::think UPGMA কখন ভুল tree বানায়?
যখন **molecular clock** খাটে না। UPGMA ধরে নেয় সব lineage একই হারে evolve করে, তাই সে সবসময় সবচেয়ে কাছের জোড়াটা জোড়ে আর তাদের distance-এর অর্ধেক উচ্চতায় বসায়। কোনো lineage যদি দ্রুত evolve করে থাকে, তার লম্বা branch-গুলোর কারণে তাকে নিজের আসল আত্মীয়দের থেকে দূরের মনে হয়, আর UPGMA তাকে ভুল জায়গায় জুড়ে দেয় — এমনকি distance-গুলো যখন একটা tree-তে নিখুঁতভাবে fit করে (additive), তখনও। Neighbour joining কোনো clock ধরে নেয় না, আর additive data-র জন্য সঠিক tree-টাই ফিরিয়ে আনে।
:::

## Neighbor joining

**Saitou & Nei (1987)** "সবচেয়ে কাছের জোড়া সবসময় neighbour নয়" সমস্যাটার সমাধান করেছিলেন এভাবে: প্রতিটা distance-কে সংশোধন করা হয়, প্রতিটা leaf *সবার* থেকে কত দূরে তা দিয়ে। $\text{TotalDistance}_D(i) = \sum_k D_{ik}$ ধরে:

$$D^*_{ij} = (n-2)\,D_{ij} - \text{TotalDistance}_D(i) - \text{TotalDistance}_D(j)$$

দ্রুত evolve করা leaf-এর total distance বড় হয়, তাই তার $D^*$ মানগুলো কমে যায় — এভাবেই তার লম্বা limb-এর ক্ষতিপূরণ হয়।

**Neighbor-Joining Theorem:** একটা additive matrix D-এর জন্য, $D^*$-এর সবচেয়ে ছোট উপাদানটা সবসময় একজোড়া **neighbouring leaf**।

**প্রতিটা ধাপে:** সবচেয়ে ছোট $D^*$-ওয়ালা জোড়া i, j-কে একটা নতুন node m-এর নিচে জুড়ুন, যেখানে limb length
$$\Delta = \frac{\text{Total}(i) - \text{Total}(j)}{n-2},\quad \text{limb}(i) = \frac{D_{ij} + \Delta}{2},\quad \text{limb}(j) = \frac{D_{ij} - \Delta}{2}$$
তারপর বাকি প্রতিটা leaf k-এর জন্য $D_{km} = (D_{ik} + D_{jk} - D_{ij})/2$ বসান, আর ছোট matrix-এ আবার একই কাজ করুন।

:::example উপরের 4-leaf matrix-এ neighbour joining
**Total:** i = 13 + 21 + 22 = 56, j = 38, k = 46, l = 48। n = 4 হলে $D^*_{ij} = 2 \cdot 13 - 56 - 38 = -68$; একইভাবে $D^*_{kl} = -68$, আর বাকি প্রতিটা জোড়া দেয় −60। সুতরাং i, j হলো neighbour (k, l-ও তাই)।

**i আর j জোড়া:** Δ = (56 − 38)/2 = 9, তাই limb(i) = (13 + 9)/2 = **11** আর limb(j) = (13 − 9)/2 = **2** — Limb Length Theorem-এর সঙ্গে হুবহু মিলে যায়। নতুন distance: $D_{mk} = (21 + 12 - 13)/2 = 10$, $D_{ml} = (22 + 13 - 13)/2 = 11$, আর $D_{kl} = 13$।

**বাকি তিনটা node:** এরা একটা কেন্দ্রীয় node c-তে মেলে, যেখানে m–c = (10 + 11 − 13)/2 = 4, k–c = (10 + 13 − 11)/2 = 6, l–c = (11 + 13 − 10)/2 = 7।

**যাচাই:** path i → k হলো 11 + 4 + 6 = 21 = $D_{ik}$ ✓, আর i → l হলো 11 + 4 + 7 = 22 ✓।
:::

Neighbour joining additive matrix-এর জন্য হুবহু সঠিক tree বানায়, non-additive matrix-এর জন্যও ভালো tree দেয়, কোনো molecular clock লাগে না, আর চলে O(n³) সময়ে। এই lecture-এ একজন phylogenetics গবেষকের দৃষ্টিকোণ থেকে এটা ব্যাখ্যা করা হয়েছে:

{{video:Dj24mCLQYUE}}

{{widget:nj}}

## Character-based method: small parsimony

Distance method যখন একটা alignment-কে প্রতিটা জোড়ার জন্য একটা মাত্র সংখ্যায় সংকুচিত করে, তখন কিছু তথ্য ফেলে দেয়। **Character-based** method সরাসরি alignment-এর column নিয়ে কাজ করে।

**Parsimony** সেই ইতিহাসটাকে পছন্দ করে যেখানে **সবচেয়ে কম mutation** লাগে — অর্থাৎ data-র সবচেয়ে সরল ব্যাখ্যা।

:::think Distance method কী ফেলে দেয়, যা character-based method রেখে দেয়?
একটা distance matrix প্রতিটা জোড়া পূর্ণ sequence-কে চেপে একটা সংখ্যায় পরিণত করে। এতে হারিয়ে যায় **কোন** position-গুলো আলাদা আর **কীভাবে** আলাদা (কোন অক্ষর কোন অক্ষরে বদলেছে), ফলে যে নির্দিষ্ট, ভাগাভাগি করা পরিবর্তনগুলো আত্মীয়দের একসঙ্গে দলবদ্ধ করে, সেগুলো হারিয়ে যায়। Character-based method (parsimony, maximum likelihood) প্রতিটা column রেখে দেয়, আর internal node-গুলোতে পূর্বপুরুষের অক্ষরও অনুমান করে। এর মূল্য হলো বেশি computation।
:::

**Small Parsimony Problem:** একটা tree আর তার leaf-গুলোর অক্ষর দেওয়া আছে (একবারে একটা alignment column), internal node-গুলোতে এমনভাবে অক্ষর বসান যাতে edge-গুলো বরাবর **মোট পরিবর্তনের সংখ্যা সবচেয়ে কম** হয় (এটাই **parsimony score**)।

**Fitch's algorithm** প্রতিটা column-এর জন্য linear time-এ, দুটো pass-এ এটা সমাধান করে:
1. **Bottom-up** (leaf থেকে root-এর দিকে): প্রতিটা leaf-এর set হলো তার নিজের অক্ষর। প্রতিটা internal node-এ, দুই child-এর set যদি **ছেদ করে (intersect)**, তাহলে intersection নিন; না হলে **union** নিন আর **একটা পরিবর্তন** গুনুন।
2. **Top-down** (root থেকে leaf-এর দিকে): root-এর set থেকে একটা অক্ষর বেছে নিন, তারপর প্রতিটা child-কে একই অক্ষর দিন যদি সেটা child-এর set-এ থাকে, নইলে child-এর set থেকে যেকোনো একটা অক্ষর দিন।

**উদাহরণ।** Tree ((A, B), (C, D)), leaf-এর অক্ষর A = `A`, B = `C`, C = `C`, D = `C`। Bottom-up: {A} ∩ {C} খালি → union {A, C}, একটা পরিবর্তন; {C} ∩ {C} = {C}; root: {A, C} ∩ {C} = {C}। মোট: **1টা পরিবর্তন**। Top-down: root C, দুটো internal node-ই C, তাই একমাত্র পরিবর্তনটা ঘটেছে leaf A-তে যাওয়ার edge-এ।

{{widget:fitch}}

**Sankoff's algorithm** হলো এর dynamic-programming সাধারণীকরণ, যেখানে ইচ্ছামতো substitution cost দেওয়া যায় (যেমন, transition-এর খরচ transversion-এর চেয়ে কম)।

**Large parsimony**-তে সম্ভাব্য সব tree-আকারের উপরও খোঁজ চালাতে হয়। Tree-এর সংখ্যা বিস্ফোরকভাবে বাড়ে — n টা leaf-এর জন্য $(2n-3)!!$ টা rooted tree — আর সমস্যাটা NP-hard, তাই heuristic ব্যবহার করা হয়: একটা মোটামুটি ভালো tree থেকে শুরু করে **nearest-neighbour interchange**-এর মতো স্থানীয় পুনর্বিন্যাস প্রয়োগ করুন, আর যে পরিবর্তনে score কমে সেগুলো রেখে দিন।

{{ref:math#counting-how-big-is-the-search-space|algo#np-hardness-and-heuristics}}

:::sota গবেষকরা এখন কী ব্যবহার করেন
- **Maximum likelihood** (RAxML-NG, IQ-TREE), স্পষ্ট substitution model সহ (JC69, HKY, GTR+Γ), আর প্রতিটা branch-এর সমর্থন মাপতে **bootstrapping**।
- **Bayesian** inference (MrBayes, BEAST), relaxed molecular clock সহ, divergence-এর সময় নির্ধারণের জন্য (যেমন, SARS-CoV-2-এর lineage-গুলো কখন উদ্ভূত হয়েছিল)।
- **Nextstrain** সারা বিশ্ব থেকে upload করা genome দিয়ে viral outbreak-এর real-time phylogeny বানায়।
:::
