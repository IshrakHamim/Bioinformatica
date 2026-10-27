Gene আর protein একা একা কাজ করে না: তারা একে অপরের সঙ্গে bind করে, একে অপরকে নিয়ন্ত্রণ করে, আর শৃঙ্খলের মতো পরপর signal পৌঁছে দেয়। "Omics" যুগে একসঙ্গে হাজার হাজার interaction-এর data পাওয়া যাচ্ছে, তাই দরকার **systems-level** (পুরো ব্যবস্থাকে একসঙ্গে দেখা) বিশ্লেষণ। **Network biology** জৈবিক ব্যবস্থাকে graph হিসেবে উপস্থাপন করে আর graph theory দিয়ে বিশ্লেষণ করে, social-network analysis থেকে প্রচুর ধার নিয়ে (প্রশ্নগুলোও একই: কে কেন্দ্রে, কে কোন community-তে, কোনো কিছু কত দ্রুত ছড়ায়?)। Lecture-টা EMBL-EBI-এর *Network analysis of protein interaction data* course অনুসরণ করে।

## Graph, edge আর adjacency matrix

- **Node** হলো জৈবিক সত্তা: protein, gene, metabolite। **Edge** হলো এদের মধ্যকার interaction বা সম্পর্ক।
- **Undirected** edge: ভৌতভাবে bind করার **protein–protein interaction (PPI)** network। A যদি B-তে bind করে, তাহলে B-ও A-তে bind করে।
- **Directed** edge: **metabolic** আর **gene regulatory** network, যেখানে signal বা পদার্থ একদিকে প্রবাহিত হয় (একটা transcription factor → তার target gene), ফলে একটা স্তরভিত্তিক (hierarchical) বিন্যাস তৈরি হয়।
- **Weighted** edge: একটা interaction কতটা নির্ভরযোগ্য, একটা gene-এর পরিবর্তন আরেকটার expression-কে কতটা জোরালোভাবে প্রভাবিত করে, বা sequence similarity।

{{ref:algo#graphs-the-basics}}

**Adjacency matrix:** i আর j-এর মধ্যে edge থাকলে $A_{ij} = 1$ (বা edge-এর weight)। Undirected, unweighted graph-এর জন্য A হয় **symmetric**, আর diagonal-এ শূন্য (কোনো self-loop নেই)। জৈবিক network-গুলো **sparse** (প্রতিটা protein হাতে গোনা কয়েকটার সঙ্গে interact করে, হাজারটার সঙ্গে নয়), তাই বাস্তবে adjacency **list** ব্যবহার করা হয়।

**উদাহরণ।** A–B, A–C, B–C, B–D, C–D, D–E edge-ওয়ালা graph G-এর adjacency matrix হলো

| | A | B | C | D | E |
|---|---|---|---|---|---|
| A | 0 | 1 | 1 | 0 | 0 |
| B | 1 | 0 | 1 | 1 | 0 |
| C | 1 | 1 | 0 | 1 | 0 |
| D | 0 | 1 | 1 | 0 | 1 |
| E | 0 | 0 | 0 | 1 | 0 |

প্রতিটা row-এর যোগফল হলো ওই node-এর degree (B-এর 3)। পুরো lesson জুড়ে আমরা এই graph-টাই ব্যবহার করব।

**জৈবিক network-এর ধরন:** PPI network, metabolic network, genetic interaction network, gene/transcriptional regulatory network, আর cell-signalling network।

**Edge-গুলো আসে কোথা থেকে:** প্রকাশিত গবেষণা হাতে ঘেঁটে সংকলন (manual curation); high-throughput experiment (**yeast two-hybrid**, যেটা জোড়ায় জোড়ায় protein bind করে কি না পরীক্ষা করে, আর **affinity purification–mass spectrometry**, যেটা একটা protein-কে তার partner-সহ টেনে বের করে আনে); computational prediction; আর text mining। Database: STRING, BioGRID, IntAct, KEGG, Reactome।

{{ref:tools#databases-you-will-use}}

**Interactome** হলো একটা কোষ, organism বা নির্দিষ্ট প্রেক্ষাপটে সব PPI-এর সমষ্টি। PPI-গুলো নির্দিষ্ট (specific), নির্ধারিত binding অঞ্চলের মধ্যে ঘটে, আর একটা কাজে লাগে। এগুলো জানা থাকলে **অচেনা protein-এর ভূমিকা নির্ধারণ** করা যায় ("guilt by association": যে protein-এর সব partner DNA repair-এ কাজ করে, সম্ভবত সেটাও তাই করে), **signalling pathway**-এর মানচিত্র বানানো যায়, আর proteasome-এর মতো **protein complex** চিহ্নিত করা যায়।

## Topology: degree, path, diameter

**Topology** মানে network-এর আকার: কে কার সঙ্গে যুক্ত।

- **Degree** k(v): node v-তে কতগুলো edge আছে (directed graph-এ in-degree আর out-degree)।
- **Shortest path** d(u, v): u থেকে v-তে যেতে সবচেয়ে কম কতগুলো edge পার হতে হয়। এটা দেখায় একটা signal কতটা সরাসরি যেতে পারে। u থেকে **breadth-first search** চালিয়ে এটা হিসাব করা হয়।
- **Diameter:** সব জোড়ার shortest-path distance-এর মধ্যে সবচেয়ে বড়টা — network-এর "প্রস্থ"। **Average path length:** সব জোড়ার গড়।
- **Degree distribution** P(k): degree k-ওয়ালা node-গুলোর ভগ্নাংশ। এর আকার (পরের section) network কেমন আচরণ করে সে সম্পর্কে অনেক কিছু বলে দেয়।

**Graph G-তে:** d(A, E) = 3 (A → B → D → E, বা A → C → D → E), আর এর চেয়ে দূরে কোনো জোড়া নেই, তাই diameter **3**।

{{ref:algo#breadth-first-and-depth-first-search}}

{{widget:centrality preset="Quiz graph G"}}

## Small world, scale-free আর hub

**Small-world effect।** PPI network-গুলো খুব ঘনভাবে যুক্ত, **diameter ছোট, তাই network যত বড়ই হোক, যেকোনো দুটো protein-এর মধ্যে মাত্র কয়েকটা ধাপের ব্যবধান**। সাধারণত node-এর সংখ্যা বাড়লে average path length বাড়ে কেবল logarithmically, অথচ local clustering উঁচুই থাকে। (এটা "six degrees of separation"-এর — অর্থাৎ পৃথিবীর যেকোনো দুজন মানুষ মোটামুটি ছয় ধাপের পরিচয়ে যুক্ত — জৈবিক সংস্করণ।)

:::story Airline-এর route map
Airline route-এর একটা মানচিত্র দেখুন। বেশিরভাগ airport-এর হাতে গোনা কয়েকটা route, অথচ অল্প কয়েকটা hub (Dubai, Istanbul, Singapore) শত শত জায়গার সঙ্গে যুক্ত। প্রায় যেকোনো দুটো শহরের মধ্যে আপনি দুই-তিনটা flight-এই পৌঁছে যেতে পারেন, কারণ যাত্রাপথ একটা hub হয়ে যায়: এটাই **small-world** effect। Protein interaction network-ও দেখতে একই রকম: অনেক protein-এর partner কম, আর অল্প কয়েকটা hub protein-এর partner অনেক অনেক।

Airline-এর এই ছবিটা robustness-ও ব্যাখ্যা করে। একটা ছোট আঞ্চলিক airport বন্ধ হলে বাকিদের প্রায় কিছুই যায় আসে না (random failure)। কিন্তু দুই-তিনটা বড় hub বন্ধ হলে সব জায়গায় যাত্রীরা আটকে পড়েন (targeted attack)।
:::

:::example Small-world effect আর তার তাৎপর্য
**এটা কী:** বেশিরভাগ node-জোড়া একটা ছোট path দিয়ে যুক্ত (ছোট diameter, বা average path length বাড়ে log n-এর মতো করে), এমনকি খুব বড় network-এও, আর সাধারণত সঙ্গে থাকে উঁচু clustering।

**তাৎপর্য:**
- কোষজুড়ে **দক্ষ, দ্রুত signal প্রবাহ**: membrane-এর একটা receptor থেকে nucleus পর্যন্ত মাত্র কয়েকটা ধাপ।
- Perturbation (বিঘ্ন) **দ্রুত ছড়াতে** পারে: একটা mutation বা ওষুধ দূরের প্রক্রিয়াতেও পৌঁছে যেতে পারে (side effect; module-এর ভেতর দিয়ে রোগ ছড়ানো)।
- তবুও network-টা **robust**: বেশিরভাগ node-এর degree কম, আর **hub**-গুলো (scale-free গঠন, নিচে দেখুন) এলোমেলো ব্যর্থতার পরেও path-গুলো ছোট রাখে।
- **দুর্বলতা:** hub হারালে ছোট path-গুলো নষ্ট হয়ে যায় আর network টুকরো টুকরো হয়ে যায়। Hub-গুলো প্রায়ই essential gene, রোগের gene আর drug target।
:::

**Scale-free network**-এর degree distribution মোটামুটি একটা **power law** মেনে চলে:

$$P(k) \sim k^{-\gamma}$$

এর মানে **অনেক node-এর connection কম, আর অল্প কয়েকটা hub-এর connection খুব বেশি**। তুলনা করুন একটা random network-এর সঙ্গে, যেখানে বেশিরভাগ node-এর degree গড়ের কাছাকাছি, আর hub প্রায় নেই বললেই চলে। Barabási–Albert model power law-কে ব্যাখ্যা করে **preferential attachment** দিয়ে: নতুন node-গুলো বেশি করে সেই node-গুলোর সঙ্গেই যুক্ত হয় যাদের আগে থেকেই অনেক connection ("ধনী আরও ধনী হয়") — যেমন gene duplication-এ তৈরি নতুন একটা protein তার parent-এর partner-গুলো উত্তরাধিকার সূত্রে পায়।

যে বিজ্ঞানী scale-free network-এর নামকরণ করেছিলেন, তাঁর মুখেই শুনুন:

{{video:RfgjHoVCZwU}}

**Scale-free গঠনের ফলাফল:**
- **Random failure-এ স্থিতিশীল:** এলোমেলো ব্যর্থতা বেশিরভাগ ক্ষেত্রে কম-degree node-গুলোকেই আঘাত করে (কারণ এরা সংখ্যায় অনেক), আর একটা hub হারালেও বাকি hub-গুলোর কল্যাণে network খুব কমই বিচ্ছিন্ন হয়।
- **Scale invariance:** network-এর আকার যাই হোক, বৈশিষ্ট্যগুলো একই রকম দেখায়; network বড় হলেও hub-গুলো small-world effect বজায় রাখে।
- **Targeted attack-এ দুর্বল:** কয়েকটা বড় hub সরিয়ে দিলেই network বিচ্ছিন্ন টুকরোয় ভেঙে যায়। Hub-গুলোর মধ্যে **essential (মুছে ফেললে প্রাণঘাতী) gene** বেশি পাওয়া যায়, আর ক্যান্সারের অনেক protein-ই hub — যার ক্লাসিক উদাহরণ **p53**।

:::think Hub-গুলো প্রায়ই essential gene আর drug target। এটা একই সঙ্গে সুযোগ আর ঝুঁকি কেন?
**সুযোগ:** একটা hub knock out করলে একসঙ্গে অনেকগুলো pathway বিঘ্নিত হয় — কোনো pathogen বা ক্যান্সার কোষ যদি ওই hub-এর উপর নির্ভর করে, তাহলে ঠিক এটাই আপনি চান। **ঝুঁকি:** সেই একই hub সাধারণত সুস্থ কোষেও জরুরি কাজ করে, তাই যে ওষুধ এটাকে আঘাত করে সেটা প্রায়ই toxic হয়, অনেক side effect দেয়। এ কারণেই network medicine প্রায়ই এমন target খোঁজে যেটা একটা **disease module**-এর কেন্দ্রে, কিন্তু পুরো interactome-এর কেন্দ্রে নয়।
:::

Widget-এ দুই ধরনের attack-ই চেষ্টা করে দেখুন: প্রথমে এলোমেলো node সরান, তারপর hub-গুলো সরান।

{{widget:robustness}}

:::warn গবেষকের জন্য নোট
জৈবিক network কতটা কঠোরভাবে "scale-free", তা নিয়ে বিতর্ক আছে: Broido & Clauset (*Nature Communications*, 2019) দেখিয়েছেন যে বাস্তব network-গুলোতে জোরালো power law বিরল। তার উপর interaction data অসম্পূর্ণ আর পক্ষপাতদুষ্ট (যেসব protein নিয়ে বেশি গবেষণা হয়েছে, তাদের জানা partner-ও বেশি), যা degree distribution-কে বিকৃত করে। তাই "scale-free" কথাটাকে পড়ুন "heavy-tailed, hub-সহ" হিসেবে।
:::

## Transitivity, module, complex আর motif

**Transitivity** মাপা হয় **clustering coefficient** দিয়ে — এটা হলো একটা node-এর প্রতিবেশীরা নিজেরাও পরস্পর যুক্ত থাকার প্রবণতা: A যদি B আর C দুজনের সঙ্গেই interact করে, তাহলে B আর C-ও কি interact করে (একটা ত্রিভুজ সম্পূর্ণ করে)? Degree k-ওয়ালা একটা node v-এর local clustering coefficient হলো

$$C(v) = \frac{\text{number of edges among v's neighbours}}{k(k-1)/2}$$

অর্থাৎ v-এর প্রতিবেশীদের মধ্যে যতগুলো edge আছে, তাকে সম্ভাব্য সর্বোচ্চ edge-সংখ্যা দিয়ে ভাগ।

**উদাহরণ।** Graph G-তে B-এর প্রতিবেশী A, C আর D। এদের মধ্যে A–C আর C–D edge আছে, কিন্তু A–D নেই: সম্ভাব্য 3টার মধ্যে 2টা, তাই C(B) = **2/3**।

**উঁচু transitivity** মানে network-এ **community** আছে: ঘনভাবে আন্তঃসংযুক্ত কিছু দল, যারা প্রায়ই **functional module** আর **protein complex**-কে প্রতিফলিত করে।

এই সংজ্ঞাগুলো নিখুঁতভাবে জানুন; এগুলো সহজেই গুলিয়ে যায়:
- **Community (cluster):** এমন node-এর দল যারা network-এর বাকি অংশের তুলনায় নিজেদের মধ্যে বেশি যুক্ত।
- **Module:** একটা **functional unit**, যেটা বদলে অন্য প্রেক্ষাপটে বসানো যায় আর তাতে এর নিজস্ব বৈশিষ্ট্য বদলায় না। এর protein-গুলোকে একই সময়ে বা একই জায়গায় interact করতে হবে, এমন **কোনো** শর্ত নেই।
- **Protein complex:** যেসব protein **একই সময়ে, একই জায়গায়** interact করে একটা স্থিতিশীল বহু-protein যন্ত্র তৈরি করে।
- **Clique:** এমন একদল node, যেখানে প্রতিটা node বাকি প্রত্যেকটার সঙ্গে যুক্ত।
- **Network motif:** একটা ছোট subgraph, যেটা random network-এর তুলনায় **পরিসংখ্যানগতভাবে বেশি বার দেখা যায় (statistically over-represented)** আর যার একটা বৈশিষ্ট্যপূর্ণ dynamical আচরণ আছে, যেমন **negative feedback loop** বা **feed-forward loop**। (এটা hub নয়, component-ও নয়।) Introduction-এ দেখা উদ্ভিদের circadian clock একটা negative feedback loop।

:::think দুটো protein কখনো ভৌতভাবে bind না করেও কি একই module-এ থাকতে পারে?
হ্যাঁ। **Module** একটা functional unit: এর সদস্যরা একটা কাজে সহযোগিতা করে, কিন্তু তাদের একই সময়ে বা একই জায়গায় interact করার দরকার নেই (একটা pathway-এর পরপর আসা enzyme-গুলোর কথা ভাবুন, যারা partner-দের একটা শৃঙ্খলের মাধ্যমে যুক্ত)। **Protein complex**-এর শর্ত আরও কড়া: এর সদস্যরা একই সময়ে, একই জায়গায় পরস্পরের সঙ্গে bind করে একটা যন্ত্র তৈরি করে। প্রতিটা complex কোনো না কোনো module-এর অংশ, কিন্তু প্রতিটা module complex নয়।
:::

{{ref:intro#gene-regulation-when-and-how-much}}

## Centrality: কোন protein সবচেয়ে গুরুত্বপূর্ণ?

আগে প্রধান centrality মাপগুলোর এই overview-টা দেখে নিন:

{{video:NgUj8DEH5Tc}}

"গুরুত্বপূর্ণ" কথাটার ভিন্ন ভিন্ন সংজ্ঞা থেকে আসে ভিন্ন ভিন্ন centrality:

- **Degree centrality:** প্রতিবেশীর সংখ্যা। উঁচু degree-র node-গুলো হলো **hub**।
- **Closeness centrality:** একটা node গড়ে বাকি সবার কতটা কাছে:
$$C(v) = \frac{n-1}{\sum_{j\neq v} d(v, j)}$$
Closeness 1 মানে node-টা বাকি প্রত্যেকটা node-এর সরাসরি প্রতিবেশী।
- **Betweenness centrality:** অন্য সব node-জোড়ার মধ্যে কতগুলো shortest path v-এর **ভেতর দিয়ে** যায়, তার যোগফল (একাধিক shortest path থাকলে ভগ্নাংশ হিসেবে গোনা হয়):
$$B(v) = \sum_{s\neq v\neq t}\frac{\sigma_{st}(v)}{\sigma_{st}}$$
যেখানে $\sigma_{st}$ হলো s থেকে t-এর shortest path-এর সংখ্যা আর $\sigma_{st}(v)$ হলো তার মধ্যে কতগুলো v-এর ভেতর দিয়ে যায়। উঁচু betweenness-এর node-গুলো হলো **bottleneck**, যারা network-এর বিভিন্ন অংশের মধ্যে তথ্যের প্রবাহ নিয়ন্ত্রণ করে — এ কারণে signalling pathway-তে আর **drug target** হিসেবে এরা সম্ভাব্য প্রার্থী, এমনকি এদের degree কম হলেও।
- অন্যগুলো: **eigenvector centrality** আর **PageRank** (একটা node গুরুত্বপূর্ণ যদি তার প্রতিবেশীরা গুরুত্বপূর্ণ হয়; random walk দিয়ে হিসাব করা হয়)।

:::story এক শহরে degree, closeness আর betweenness
- **Degree** হলো আপনার কতজন বন্ধু।
- **Closeness** হলো আপনার কাছ থেকে একটা খবর কত দ্রুত শহরের সবার কাছে পৌঁছায়।
- **Betweenness** হলো শহরের কতগুলো সবচেয়ে ছোট পথ আপনার বাড়ির ভেতর দিয়ে যায়। শহরের দুই অংশের মাঝে একটা সেতুর betweenness বিশাল, যদিও তার রাস্তা মাত্র দুটো: সেতুটা বন্ধ করুন, দুই অংশ আর যোগাযোগ করতে পারবে না। নিচের Girvan–Newman ঠিক এই সেতুগুলো সরিয়েই community খুঁজে বের করে।
:::

:::example তিনটা ছোট graph-এ centrality (widget-এ যাচাই করে দেখুন)
**Graph G** (A–B, A–C, B–C, B–D, C–D, D–E): degree(B) = **3**; diameter **3** (A থেকে E)। B-এর closeness: A, C, D, E-এর distance 1, 1, 1, 2, যোগফল 5, তাই closeness(B) = 4/5 = **0.8**। সবচেয়ে বেশি betweenness: **D** (= 3), কারণ A, B বা C থেকে E-তে যাওয়ার প্রতিটা shortest path-কে D-এর ভেতর দিয়ে যেতেই হয়।

**Graph J** (P–Q, Q–R, R–S, R–U, S–T): degree(R) = **3**; diameter **4** (P থেকে T); closeness(R) = 5/7 ≈ **0.71** (course-এর option-এ "0.70" হিসেবে দেওয়া); সবচেয়ে বেশি betweenness **R** (= 8)।

**Graph K** (V–W, W–X, W–Y, X–Z): degree(W) = **3**; diameter **3**; closeness(W) = 4/5 = **0.8**; সবচেয়ে বেশি betweenness **W** (= 5)।
:::

{{game:hub-hunter}}

## Clustering analysis: Girvan–Newman

Community-গুলো স্বয়ংক্রিয়ভাবে খুঁজব কীভাবে? **Girvan–Newman** একটা greedy, divisive (ভাঙতে ভাঙতে এগোনো) algorithm, যেটা একটা পর্যবেক্ষণের উপর দাঁড়িয়ে: community-গুলোর **মাঝে** যে অল্প কয়েকটা edge চলে, সেগুলো দিয়ে অনেক shortest path যায় (দুই community-র মধ্যকার সব traffic-কে এগুলো পার হতেই হয়), তাই এদের **edge betweenness** বেশি।

1. প্রতিটা edge-এর edge betweenness হিসাব করুন (betweenness centrality-র edge সংস্করণ)।
2. সবচেয়ে বেশি betweenness-এর edge-টা **সরিয়ে দিন**।
3. Edge betweenness আবার হিসাব করুন আর একই কাজ চালিয়ে যান। Community-গুলোর মাঝের edge-গুলো একে একে উধাও হতে থাকলে network ভেঙে আলাদা আলাদা connected component-এ পরিণত হয়: এগুলোই community। কোন ক্রমে ভাঙন ঘটল তা লিখে রাখলে একটা স্তরবিন্যাস (hierarchy) পাওয়া যায়, dendrogram-এর মতো।

এই worked example-এ edge betweenness হিসাব করে ধাপে ধাপে edge সরানো দেখানো হয়েছে:

{{video:aWzSsPO3uuw}}

**সীমাবদ্ধতা।** এটা "সাদামাটা" (naïve): community-গুলো বাকি অংশের চেয়ে সামান্য একটু ঘন হলেও এটা সেগুলোকে community বলে report করবে, আর এটা ধীর (m টা edge আর n টা node-এর জন্য O(m²n), কারণ প্রতিবার edge সরানোর পর betweenness আবার হিসাব করতে হয়)। আধুনিক বিকল্পগুলো **modularity** optimize করে (Louvain আর Leiden algorithm, যেগুলো single-cell analysis-এ cell cluster করতেও ব্যবহৃত হয়), অথবা protein complex খুঁজতে **MCL** (Markov clustering) ব্যবহার করে।

{{ref:expression1#hierarchical-clustering}}

{{widget:girvan-newman}}

:::sota Network biology কোন দিকে এগোচ্ছে
- **Network medicine:** রোগের gene-গুলো interactome-এ "disease module" হিসেবে জট পাকিয়ে থাকে; একটা ওষুধের network-এ disease module-এর কতটা কাছে অবস্থান, তা মেপে ওষুধটাকে নতুন রোগে ব্যবহার (repurpose) করা যায়।
- drug–target interaction, protein function আর polypharmacy side effect-এর জন্য **graph neural network**।
- Single-cell **gene regulatory network** inference (SCENIC), আর ligand–receptor জোড়া থেকে বানানো spatial cell–cell communication network।
:::
