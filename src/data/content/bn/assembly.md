**Biological প্রশ্ন:** sequencer কোনো genome-কে এক মাথা থেকে আরেক মাথা পর্যন্ত একটানা পড়তে পারে না। এর বদলে সে genome-এর এলোমেলো জায়গা থেকে লক্ষ লক্ষ ছোট টুকরো পড়ে, এগুলোকে বলে **read**। এখন এই টুকরোগুলো থেকে পুরো genome আবার জোড়া লাগাব কীভাবে? পাঠ্যবইয়ে একে বলা হয়েছে **exploding newspaper problem**: ধরুন একই খবরের কাগজের অনেকগুলো কপি একসাথে বোমায় উড়ে টুকরো টুকরো হয়ে গেছে। এখন সেই টুকরোগুলোর মধ্যে যেখানে যেখানে লেখা মিলে যায় (overlap), সেটা কাজে লাগিয়ে পুরো লেখাটা আবার বানাতে হবে, আর কিছু টুকরো চিরতরে হারিয়েও গেছে। এই lesson Compeau & Pevzner-এর Chapter 3 অনুসরণ করে, এবং দেখায় কীভাবে ঠিক graph বেছে নিলেই একটা প্রায় অসম্ভব সমস্যা সহজ হয়ে যায়।

## Assembly কেন কঠিন

**আকার।** মানুষের genome-এ প্রায় 3 billion base pair আছে। কিছু উদ্ভিদ আর amoeba-র genome এর চেয়েও অনেক বড়। ইতিহাসে প্রথম যে genome sequence করা হয়েছিল, সেটা ছিল **φX174** নামের একটা virus (5,386 nucleotide), 1977 সালে Fred Sanger-এর দল কাজটা করে।

**Read কীভাবে তৈরি হয়।** Genome-এর অনেকগুলো কপিকে এলোমেলো জায়গায় ভাঙা হয়, তারপর প্রতিটা টুকরোর এক মাথা থেকে পড়া হয়। Illumina-র ক্ষেত্রে এভাবে ধরুন 100–300 অক্ষরের একটা read পাওয়া যায়। যথেষ্ট read থাকলে genome-এর প্রতিটা অবস্থান অনেকবার করে পড়া হয়ে যায়, আর পাশাপাশি read-গুলো একে অপরের সাথে **overlap** করে। Assembly মানে হলো এই overlap-গুলো ব্যবহার করে read-গুলোকে শিকলের মতো জুড়ে আবার genome বানানো।

**বাস্তবে কাজটা কঠিন কেন:**
1. কোন read DNA-র কোন **strand** থেকে এসেছে, আমরা জানি না।
2. Read-এ **ভুল (error)** থাকে (short read-এ সাধারণত 0.1–1%)।
3. Sampling এলোমেলো বলে কিছু অংশ কোনো read-এই **ধরা পড়ে না (not covered)**।
4. **Repeat।** মানুষের genome-এর প্রায় অর্ধেকই repetitive। যেমন ~300-nucleotide-এর **Alu** element টি সামান্য এদিক-ওদিক পরিবর্তনসহ দশ লক্ষেরও বেশিবার আছে। যে read পুরোটাই কোনো repeat-এর ভেতরে পড়ে, সেটা repeat-এর যেকোনো কপি থেকে আসতে পারত, তাই সেটা আসলে কোথায় বসবে বলা যায় না।

নিচের ছোট video-টা assembly-র "নিয়মগুলো" বলে দেয়: overlap থাকলে কেন read জোড়া যায়, coverage বাড়লে কেন সুবিধা হয়, আর repeat কেন মৌলিক বাধা। সামনে এগোনোর আগে এটা দেখে নিন।

{{video:dY01jRGFUiI}}

**আপাতত কিছু সরল অনুমান।** মূল algorithmic ধারণাটা খুঁজে পেতে পাঠ্যবই প্রথমে একটা আদর্শ জগৎ ধরে নেয়। এগুলো মনে রাখুন; শেষ section-এ দেখব বাস্তবের assembler-রা কীভাবে প্রতিটা অনুমান শিথিল করে।
1. সব read একই দৈর্ঘ্য k-এর k-mer।
2. সব read একই strand থেকে এসেছে।
3. Read-এ **কোনো ভুল নেই** এবং **perfect coverage** আছে: genome-এর প্রতিটা k-mer ঠিক একবার করে পড়া হয়েছে।

## String composition এবং reconstruction

- $\text{Composition}_k(Text)$ হলো Text-এর সব k-mer-এর সংগ্রহ, **repeat-সহ**, সাধারণত lexicographic (বর্ণানুক্রমিক) ক্রমে সাজানো। যেমন,
$\text{Composition}_3(\texttt{TATGGGGTGC})$ = {ATG, GGG, GGG, GGT, GTG, TAT, TGC, TGG}। লক্ষ করুন GGG দুবার এসেছে, কারণ genome-এ GGGG আছে।
- **String Reconstruction Problem।** *Input:* একটা পূর্ণসংখ্যা k আর k-mer-এর একটা সংগ্রহ। *Output:* এমন একটা string, যার k-mer composition ঠিক ওই সংগ্রহটাই।

আমাদের আদর্শ অনুমানে read-গুলো আসলে composition-টাই, শুধু এলোমেলো করে সাজানো। কাজ হলো এগুলোকে ঠিক ক্রমে বসানো।

**ক্রমটা জানা থাকলে genome লেখা একেবারে সোজা।** **Prefix(Pattern)** মানে প্রথম k − 1টা অক্ষর, আর **Suffix(Pattern)** মানে শেষ k − 1টা অক্ষর। Genome-এ পরপর দুটো k-mer k − 1টা অক্ষরে overlap করে: একটার Suffix = পরেরটার Prefix। এই বৈশিষ্ট্যওয়ালা k-mer-এর ধারাকে বলে **genome path**। এটা থেকে genome লিখতে প্রথম k-mer-টা পুরো লিখুন, তারপর পরের প্রতিটা k-mer-এর শুধু শেষ অক্ষরটা জুড়ে দিন:

```text
TAT
 ATG
  TGG
   GGG
    GGG
     GGT
      GTG
       TGC
TATGGGGTGC      (k + n − 1 = 3 + 8 − 1 = 10 letters for n = 8 k-mers)
```

তাহলে আসল প্রশ্ন হলো: **ক্রমটা খুঁজে পাব কীভাবে?** এখানেই graph-এর ভূমিকা।

{{ref:algo#graphs-the-basics}}

## Overlap graph এবং Hamiltonian path

এই section-এ assembly-কে যে overlap graph হিসেবে দেখা হয়েছে, এই video-টা সেটারই পরিচয় দেয়।

{{video:yPJ7yHRk2OI}}

**প্রথম ধারণা: overlap graph।** প্রতিটা k-mer (read)-এর জন্য একটা করে **node** বানান। যখনই Suffix(Pattern) = Prefix(Pattern′), তখন Pattern থেকে Pattern′-এর দিকে একটা directed edge আঁকুন: মানে genome-এ দ্বিতীয়টা প্রথমটার ঠিক পরে আসতে পারে।

TATGGGGTGC-এর composition-এর জন্য TAT → ATG একটা edge (কারণ AT = AT), তেমনি ATG → TGG, TGG → GGG, এভাবে চলতে থাকে। Genome তখন এমন একটা path, যেটা **প্রতিটা node ঠিক একবার** ছুঁয়ে যায়; একে বলে **Hamiltonian path**।

**সমস্যাটা হলো।** Hamiltonian path খোঁজা **NP-complete**। সাধারণ graph-এর জন্য কোনো দক্ষ algorithm জানা নেই, আর লক্ষ লক্ষ read থাকলে সব সম্ভাব্য ক্রম brute-force দিয়ে যাচাই করার প্রশ্নই ওঠে না।

(Slide থেকে একটা মজার যোগসূত্র: **k-universal binary string** এমন একটা string যেখানে প্রতিটা binary k-mer ঠিক একবার করে আছে, যেমন k = 3-এর জন্য `0001110100`। এরকম string বানানোও একই ধরনের সমস্যা, আর নিচে এর যে সুন্দর সমাধান দেখব, সেটাও একই কৌশল।)

{{ref:algo#eulerian-and-hamiltonian-paths|algo#np-hardness-and-heuristics}}

## de Bruijn graph এবং Eulerian path

এই lecture-টা পরিষ্কার উদাহরণ দিয়ে de Bruijn graph-এর ধারণা গড়ে তোলে। পুরো lesson-এর সবচেয়ে গুরুত্বপূর্ণ ধারণা এটাই, তাই section-টা পড়ার আগে বা ঠিক পরে video-টা দেখুন।

{{video:TNYZZKrjCSk}}

**উপস্থাপনাটা উল্টে দিন।** k-mer-কে node না বানিয়ে **(k − 1)-mer-গুলোকে node** আর **k-mer-গুলোকে edge** বানান।

**DeBruijn(Patterns):** প্রতিটা k-mer-এর জন্য তার Prefix থেকে Suffix-এর দিকে একটা edge আঁকুন। তারপর একই label-ওয়ালা সব node-কে **জুড়ে (glue)** একটা node বানিয়ে ফেলুন। কোনো k-mer একাধিকবার থাকলে সেগুলো একই দুই node-এর মধ্যে parallel edge হয়ে যায়।

**উদাহরণ।** 3-mer `ATG` হয়ে যায় edge AT → TG। `TGC` হয়ে যায় TG → GC। দুটো edge-ই TG node-টা ভাগ করে নেয়, তাই এরা পরপর জুড়ে ATGC লেখে।

এখন genome হলো এমন একটা হাঁটা (walk), যেটা **প্রতিটা edge ঠিক একবার** ব্যবহার করে: একে বলে **Eulerian path**। আর Hamiltonian path-এর মতো নয়, Eulerian path খুঁজে পাওয়া সহজ, linear time-এই হয়ে যায়।

:::story এই lesson-এর একমাত্র সবচেয়ে গুরুত্বপূর্ণ ধারণা
দুটো graph-ই **একই** read আর একই overlap-এর বর্ণনা দেয়। আমরা শুধু বদলেছি কোন জিনিসটাকে node বলছি:

- **Read-কে node ধরলে** (overlap graph): genome আবার বানানো মানে প্রতিটা *node* একবার করে ছোঁয়া। এটা Hamiltonian path problem, যার কোনো দক্ষ algorithm জানা নেই।
- **Read-কে edge ধরলে** (de Bruijn graph): genome আবার বানানো মানে প্রতিটা *edge* একবার করে পার হওয়া। এটা Eulerian path problem, যেটা Euler 1735 সালেই সমাধান করেছিলেন, আর যেটা linear time-এ চলে।

ডেটা একই, শুধু উপস্থাপনা আলাদা, আর তাতেই একটা অসম্ভব সমস্যা সহজ হয়ে গেল। কোনো algorithm যখন আশাহীন মনে হয়, তখন আরও চালাক search খোঁজার আগে ভেবে দেখুন ডেটাকে অন্যভাবে model করা যায় কি না।
:::

:::cs Euler-এর theorem (directed version)
কোনো node-এর in-degree আর out-degree সমান হলে তাকে **balanced** বলে। **প্রতিটা balanced, strongly connected directed graph-এ একটা Eulerian cycle থাকে।** একটা graph-এ Eulerian **path** থাকবে যদি এবং কেবল যদি graph-টা connected হয় এবং ঠিক দুটো node ছাড়া বাকি সব balanced হয়: একটা **start** node, যেখানে out = in + 1, আর একটা **end** node, যেখানে in = out + 1। End → start একটা অস্থায়ী edge যোগ করলে graph-টা balanced হয়ে যায়; তখন একটা cycle খুঁজুন, তারপর ওই edge-টা কেটে দিলেই path পেয়ে যাবেন।
:::

**কোনো genome-এর de Bruijn graph-এর প্রায় প্রতিটা node balanced কেন?** Genome-এ কোনো (k − 1)-mer যতবার আসে, প্রতিবার একটা k-mer দিয়ে তাতে ঢোকা হয় আর পরের k-mer দিয়ে বেরোনো হয়। তাই প্রতিটা node-এ যতগুলো edge ঢোকে, ততগুলোই বেরোয়; ব্যতিক্রম শুধু genome-এর প্রথম (k − 1)-mer (একটা বাড়তি বেরোনো edge) আর শেষটা (একটা বাড়তি ঢোকা edge)। Path-এর জন্য Euler-এর শর্ত ঠিক এটাই।

**Hierholzer's algorithm (linear time):**
1. Start node থেকে শুরু করে অব্যবহৃত edge ধরে হাঁটতে থাকুন (যেকোনো একটা বেছে নিলেই হবে), যতক্ষণ না আটকে যান। Balanced graph-এ আপনি শুধু end node-এই আটকাতে পারেন (cycle হলে আবার start-এ ফিরে)।
2. যদি এখনো অব্যবহৃত edge বাকি থাকে, তাহলে আপনার হাঁটা পথের এমন একটা node বেছে নিন যেখান থেকে অব্যবহৃত edge আছে, সেখান থেকে নতুন একটা cycle হাঁটুন, আর সেই node-এ cycle-টা আপনার পথের ভেতরে **জুড়ে দিন (splice)**।
3. সব edge ব্যবহার না হওয়া পর্যন্ত এটা চালিয়ে যান। মোট সময় O(|E|)।

{{widget:debruijn preset="mid"}}

{{game:euler-trail}}

**ঐতিহাসিক শিকড়।** 1735 সালে **Euler** প্রমাণ করেন যে Königsberg শহরের সাতটা সেতুর প্রতিটা ঠিক একবার করে পার হয়ে শহরে ঘোরা সম্ভব নয়, কারণ সেখানকার স্থলভাগগুলোর সাথে বিজোড় সংখ্যক সেতু যুক্ত ছিল। এখান থেকেই graph theory-র জন্ম। Hamilton-এর সংস্করণের ধাঁধাটা (প্রতিটা *node* একবার ছোঁয়া) দেখতে প্রায় একই রকম, কিন্তু computation-এর দিক থেকে অনেক বেশি কঠিন।

:::example AGC, ATG, CAG, CTG, GCA, GCT, TGA, TGC read-গুলো assemble করা
**Edge** (prefix → suffix): AG→GC, AT→TG, CA→AG, CT→TG, GC→CA, GC→CT, TG→GA, TG→GC।

**Degree:** **AT**-এর out 1, in 0, তাই এটা start; **GA**-র in 1, out 0, তাই এটা end; বাকি সব node balanced (GC আর TG-র in = out = 2)।

**Eulerian path:** AT → TG → GC → CA → AG → GC → CT → TG → GA।

**লিখে ফেলুন:** **ATGCAGCTGA** (দৈর্ঘ্য 3 + 8 − 1 = 10)। যাচাই: এর 3-mer composition ঠিক ওই 8টা read-ই।

**একটা ফাঁদ:** TG থেকে যদি প্রথমেই TG → GA নেন, তাহলে কিছু edge বাকি রেখেই end-এ পৌঁছে যাবেন। ঠিক এই কারণেই Hierholzer আটকে না যাওয়া পর্যন্ত এগোয়, তারপর বাদ পড়া cycle-গুলো পথে জুড়ে দেয়।
:::

চার মিনিটের এই recap-টা একটা ছোট উদাহরণে de Bruijn assembly আরেকবার ধাপে ধাপে দেখায়:

{{video:OY9Q_rUCGDw}}

## Read pair এবং paired de Bruijn graph

k-এর চেয়ে লম্বা repeat থাকলে একাধিক Eulerian path তৈরি হয়, আর তার মধ্যে শুধু একটাই আসল genome। লম্বা read হলে repeat-এর জট খুলে যেত, কিন্তু দীর্ঘদিন লম্বা read-এ ভুল ছিল অনেক বেশি। তাই sequencing lab-গুলো এর বদলে **read pair** তৈরি করত: একই লম্বা fragment-এর দুই মাথা থেকে নেওয়া দুটো read, যাদের মধ্যে genome-এ মোটামুটি **জানা একটা দূরত্ব** d থাকে। একটা read pair-কে ভাবতে পারেন k + d + k দৈর্ঘ্যের একটা "ফাঁকওয়ালা read" (gapped read) হিসেবে, যার মাঝখানটা অজানা।

- একটা **(k, d)-mer** হলো k-mer-এর একটা জোড়া (a | b), genome-এ যাদের মাঝে d অক্ষরের ব্যবধান। `TAATGCCATGGGATGTT`-এর (3, 2)-mer-গুলো শুরু হয় এভাবে: (TAA|CCA), (AAT|CAT), (ATG|ATG), … ; যেমন TAA শুরু হয় position 0-তে, আর CCA শুরু হয় তার 3 + 2 = 5 position পরে।
- **Paired de Bruijn graph:** এখানে node হলো (k − 1)-mer-এর জোড়া (a-এর prefix | b-এর prefix), আর প্রতিটা read pair হলো (prefix a | prefix b) থেকে (suffix a | suffix b)-এর দিকে একটা edge। প্রতিটা edge যেহেতু genome-এর d অক্ষর দূরের দুটো জায়গার তথ্য বহন করে, তাই pair-এর বিস্তারের চেয়ে ছোট repeat-গুলো প্রায়ই আর অস্পষ্টতা তৈরি করে না, আর অনেক ভুল path হারিয়ে যায়।
- **সতর্কতা:** paired de Bruijn graph-এ প্রতিটা Eulerian path-ই বৈধ genome লেখে না। a-গুলো থেকে লেখা ওপরের string আর b-গুলো থেকে লেখা নিচের string-কে, নিচেরটা k + d সরিয়ে বসালে, একে অপরের সাথে মিলতে হবে। Reconstruction-এর সময় এটা যাচাই করা হয় ("String Spelled by a Gapped Genome Path")।

## বাস্তব ডেটা: coverage, error, contig

এবার অনুমানগুলো একটা একটা করে শিথিল করা যাক। এই lecture দেখায় বাস্তবের assembler-রা error আর repeat নিয়ে কী করে, আর contig ও scaffold-এর সাথে পরিচয় করিয়ে দেয়।

{{video:0Ho2__cFsVY}}

**অসম্পূর্ণ coverage → read breaking।** বাস্তব sequencing কখনোই প্রতিটা k-mer ধরতে পারে না। ধরা যাক আমাদের read-গুলো 10-mer, কিন্তু genome-এর কিছু 10-mer কখনো পড়াই হয়নি। তখন প্রতিটা read-কে তার সব ছোট k-mer-এ ভেঙে ফেলুন, ধরুন 5-mer-এ। Genome-এর একটা 5-mer covered হবে যদি *যেকোনো* read সেটা ধরে, আর এটা কোনো নির্দিষ্ট 10-mer ধরা পড়ার চেয়ে অনেক বেশি সম্ভাব্য। এর বিনিময় মূল্য: **k ছোট হলে coverage ভালো হয়, কিন্তু graph আরও জট পাকায়**, কারণ ছোট (k − 1)-mer genome-এ কাকতালীয়ভাবে বারবার আসার সম্ভাবনা বেশি।

{{widget:read-breaking}}

**Contig।** Read breaking-এর পরেও coverage-এর ফাঁক আর repeat-এর কারণে পুরো genome জুড়ে একটা মাত্র Eulerian path পাওয়া যায় না। তাই assembler-রা output দেয় **contig**: লম্বা একটানা অংশ, যেগুলো কোনো দ্ব্যর্থতা ছাড়াই assemble করা যায়। Graph-এর ভাষায়, contig হলো একটা **maximal non-branching path**: এমন path যার ভেতরের প্রতিটা node-এ ঠিক একটা edge ঢোকে আর একটা বেরোয়। যেখানেই graph শাখায় ভাগ হয় (repeat) বা শেষ হয়ে যায় (coverage-এর ফাঁক), সেখানেই contig থেমে যায়। এরপর read pair ব্যবহার করে contig-গুলোকে ক্রমে সাজিয়ে ও দিক ঠিক করে **scaffold** বানানো হয়।

**Sequencing error → bubble আর tip।** একটা read-এ একটা মাত্র ভুল তার k-mer-গুলোর সর্বোচ্চ kটা বদলে দিতে পারে, ফলে এমন edge তৈরি হয় যেগুলো genome-এ নেই। যেমন `CGTACGGACA` আর ভুলওয়ালা `CGTATGGACA`-র শুরু আর শেষ একই, কিন্তু মাঝখানটা আলাদা, তাই graph-এ একটা **bubble** তৈরি হয়: একই দুই node-এর মাঝে দুটো বিকল্প path। Read-এর শেষ প্রান্তের কাছে ভুল হলে তৈরি হয় একটা কানাগলি, যাকে বলে **tip**। প্রতিটা ভুল যেহেতু বিরল, ভুল k-mer-গুলোর **count কম** হয়। তাই assembler-রা k-mer গোনে, বিরলগুলো বাদ দেয়, tip ছেঁটে ফেলে আর bubble ফাটিয়ে দেয়।

:::think de Bruijn graph-এ কি সবসময় একটাই Eulerian path থাকে? Assembly-র জন্য এর মানে কী?
না। k − 1-এর চেয়ে লম্বা একটা repeat এমন একটা node তৈরি করে, যেখানে অনেকগুলো edge ঢোকে আর অনেকগুলো বেরোয়। ফলে একাধিক Eulerian path তৈরি হয়, প্রতিটা আলাদা একটা সম্ভাব্য genome লেখে, আর শুধু graph দেখে বলা যায় না কোনটা আসল। Assembly-কে কঠিন করে এই দ্ব্যর্থতাই, path খুঁজে পাওয়া নয়। এর সব প্রতিকারই আরও দূর-বিস্তৃত তথ্য যোগ করে: বড় k (read-এ কুলোলে), repeat পেরিয়ে যায় এমন **read pair**, আর repeat-টা পুরো ঢেকে ফেলে এমন **long read**।
:::

:::think k বাড়লে de Bruijn graph-এর কী হয়? তাহলে খুব বড় k নিলেই হয় না কেন?
k বড় হলে কম (k − 1)-mer genome-এ বারবার আসে, তাই graph-এ শাখা কমে আর সেটা সরল হয়। k যদি সবচেয়ে লম্বা repeat-কেও ছাড়িয়ে যায়, তাহলে graph একটা মাত্র path হয়ে যায়। কিন্তু k read-এর দৈর্ঘ্যের চেয়ে বড় হতে পারে না, আর read-গুলোকে প্রতিটা k-mer ধরতে হবে: k যত লম্বা, genome-এর কোনো k-mer কখনো না পড়া থেকে যাওয়ার (coverage gap) সম্ভাবনা তত বেশি, আর সেটার ভেতরে কোনো read error পড়ার সম্ভাবনাও তত বেশি। বহু বছর ধরে প্রযুক্তি দিত হয় ছোট কিন্তু নির্ভুল read, নয়তো লম্বা কিন্তু ভুলে ভরা read, দুটো একসাথে কখনো নয়; এজন্যই read breaking (ছোট k) আর read pair এত গুরুত্বপূর্ণ ছিল।
:::

:::think বাস্তবের assembly একটা chromosome-এর বদলে শত শত contig দেয়। কেন?
দুটো কারণ। **Coverage gap:** যে k-mer কখনো পড়া হয়নি, তার edge অনুপস্থিত থাকে, তাই path ভেঙে যায়। **Repeat:** যেখানে graph শাখায় ভাগ হয়, সেখানে assembler নিরাপদে কোনো path বেছে নিতে পারে না, তাই সেখানেই contig থামিয়ে অন্য পাশে নতুন একটা শুরু করে। এরপর read pair (আর long read) দিয়ে scaffolding করে contig-গুলোকে ক্রমে সাজানো ও দিক ঠিক করা হয়।
:::

:::example ক্লাসের অনুমান থেকে বাস্তবের assembler
| ক্লাসে যা ধরে নিয়েছিলাম | বাস্তবে | Assembler-রা যা করে |
|---|---|---|
| সব read একই দৈর্ঘ্যের k-mer | read-এর দৈর্ঘ্য আলাদা আলাদা | k-mer-এ **read breaking**; একটা k বেছে নেওয়া (বা কয়েকটা চেষ্টা করা) |
| perfect coverage | এলোমেলো sampling-এ কিছু অংশ বাদ পড়ে | উঁচু **depth** (30× বা তার বেশি), read breaking, একটা path-এর বদলে **contig** output |
| কোনো error নেই | short read-এ 0.1–1%, কিছু long read-এ আরও বেশি | k-mer গুনে **error correction**; **tip** সরানো, **bubble** ফাটানো |
| একটাই জানা strand | read দুই strand থেকেই আসে | প্রতিটা read **এবং তার reverse complement** যোগ করা (canonical k-mer) |
| একটাই Eulerian path | **repeat** অনেক path তৈরি করে | **paired-end / mate-pair** read, **long read** (PacBio HiFi, Nanopore), scaffolding |
:::

:::sota এখনকার সেরা পদ্ধতি
- Short read-এর জন্য de Bruijn-graph assembler: Velvet (2008), SPAdes, MEGAHIT (metagenome-এর জন্য)।
- **Long read** সবকিছু বদলে দিয়েছে। PacBio HiFi read (প্রায় 15–20 kb, 99.9%-এর বেশি নির্ভুল) আর Oxford Nanopore-এর ultra-long read (100 kb বা তার বেশি) বেশিরভাগ repeat পুরো পেরিয়ে যায়। **hifiasm** আর **Verkko**-র মতো assembler আবার string/overlap graph ব্যবহার করে, কারণ long read সংখ্যায় যথেষ্ট কম বলে overlap-ভিত্তিক পদ্ধতি বাস্তবে চালানো সম্ভব হয়ে যায়।
- **Telomere-to-Telomere (T2T) consortium** 2022 সালে *Science*-এ প্রথম সত্যিকারের সম্পূর্ণ মানব genome (CHM13) প্রকাশ করে, যেটা reference GRCh38-এ অনুপস্থিত প্রায় 200 million base যোগ করে। **Human Pangenome Reference Consortium** 2023 সালে *Nature*-এ 47 জন মানুষের একটা খসড়া pangenome প্রকাশ করে, যেটা একটা মাত্র string হিসেবে নয়, বরং variation-এর একটা **graph** হিসেবে উপস্থাপিত।
:::

## সারসংক্ষেপ

- **Overlap graph** (read হলো node) → genome একটা **Hamiltonian path**: NP-complete।
- **de Bruijn graph** (read হলো edge, (k − 1)-mer হলো node) → genome একটা **Eulerian path**: Hierholzer's algorithm দিয়ে linear time।
- de Bruijn graph শত শত কোটি read পর্যন্ত সামলাতে পারে, কারণ প্রতিটা আলাদা (k − 1)-mer একবারই রাখা হয়, যত read-এই সেটা থাকুক না কেন।
- Read pair repeat-এর ওপারের তথ্য বয়ে আনে; paired de Bruijn graph সেই তথ্য কাজে লাগায়।
- বাস্তবের assembly = error correction + de Bruijn graph + সরলীকরণ (tip, bubble) + contig + read pair আর long read দিয়ে scaffolding।
