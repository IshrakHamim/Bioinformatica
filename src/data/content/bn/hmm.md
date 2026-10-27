অনেক জৈবিক sequence আসলে **ভিন্ন ভিন্ন পরিসংখ্যানের অঞ্চলের মিশ্রণ**: CpG island বনাম সাধারণ DNA, exon বনাম intron, protein-এর membrane ভেদ করা অংশ বনাম cytoplasm-এ থাকা অংশ। আমরা sequence-টা দেখতে পাই, কিন্তু কোন অংশ কোন ধরনের অঞ্চল, সেই label-গুলো **লুকানো** থাকে। **Hidden Markov Model (HMM)** ঠিক এই পরিস্থিতিটাই বর্ণনা করে, আর এর সাথে আসে দক্ষ dynamic-programming algorithm, যা দিয়ে একটা sequence-এ label বসানো, sequence-টাকে score করা, এবং data থেকে model শেখা যায়। Course-এর উপকরণে আছে Carl Kingsford-ধাঁচের slides (casino-র উদাহরণ) আর Borodovsky & Ekisheva (2006)-এর Viterbi/Forward খেলনা-উদাহরণ।

Bayes' rule আর HMM যদি আপনার কাছে নতুন হয়, তাহলে এই বন্ধুসুলভ, intuition দিয়ে শুরু করা video-টা দিয়ে শুরু করুন। এটা ধাপে ধাপে ঠিক এই lesson-এর ধারণাগুলোতে পৌঁছে যায়।

{{video:kqSzLo9fenk}}

## অসৎ casino

একটা casino কখনো **fair coin** (P(heads) = 0.5) ছোড়ে, কখনো **biased coin** (P(heads) = 0.75)। আমরা শুধু টসের ফলাফলগুলো দেখি, কোন coin ব্যবহার হয়েছে তা দেখি না।

**Case 1: পুরো সময় একটাই coin।** x = H H T T T T H কোন coin থেকে এসেছে? প্রতিটা coin ধরে নিয়ে এই ফলাফলগুলোর probability হিসাব করুন (টসগুলো independent, তাই গুণ করলেই হয়):

$$\Pr(x \mid \text{Fair}) = 0.5^7 \approx 0.0078, \qquad \Pr(x \mid \text{Biased}) = 0.75^3\cdot 0.25^4 \approx 0.0016$$

**Log-odds score** $\log_2 \frac{0.0078}{0.0016} \approx 2.25 > 0$, অর্থাৎ পাল্লা "Fair"-এর দিকে। সাতবারের মধ্যে চারবার tails, এটা fair coin-এর ক্ষেত্রেই অনেক বেশি স্বাভাবিক।

{{ref:math#logarithms-likelihood-and-log-odds}}

**Case 2: casino গোপনে coin বদলায়**, প্রতিটা টসের পর 0.1 probability-তে। এখন প্রশ্নটাই অন্যরকম: *প্রতিটা অবস্থানে কোন coin ব্যবহার হয়েছিল?* Coin-টা এখন একটা **hidden state** যা সময়ের সাথে বদলায়, আর প্রতিটা টস একটা **observation** যা বর্তমান state-এর ওপর নির্ভর করে। এটাই একটা HMM।

:::story বাস্তবতার দুটো স্তর
প্রতিটা HMM সমস্যায় একটা স্তর থাকে যা আপনি দেখতে পান না, আর একটা যা দেখতে পান:

| | লুকানো স্তর (আসল সত্য) | দেখা যায় এমন স্তর (সূত্র) |
|---|---|---|
| Casino | dealer-এর হাতে কোন coin: Fair, Fair, Biased, Biased, Fair… | টসের ফল: H, T, H, H, T… |
| Genome | প্রতিটা base কোন ধরনের অঞ্চলে আছে: island, island, background… | base-গুলো: C, G, C, A, T… |

লুকানো স্তরটা এক state থেকে আরেক state-এ যায় (এগুলোই **transition**); প্রতিটা ধাপে বর্তমান state একটা দৃশ্যমান symbol তৈরি করে (এগুলো **emission**)। আমাদের কাজ সবসময় একটাই: সূত্রগুলো থেকে উল্টো দিকে ভেবে লুকানো গল্পটা বের করা।
:::

{{widget:casino}}

## আনুষ্ঠানিক সংজ্ঞা

একটা HMM হলো একটা tuple $(\Sigma, Q, A, E)$, সাথে initial probability:
- $\Sigma$: **দেখা যায় এমন symbol**-এর alphabet (H/T; অথবা A/C/G/T)।
- $Q$: লুকানো **state**-গুলোর set (Fair/Biased; Island/Background; exon/intron)।
- $A$: $|Q|\times|Q|$ মাপের **transition** matrix। $A_{kl} = \Pr(\pi_{i+1} = l \mid \pi_i = k)$ হলো state k থেকে state l-এ যাওয়ার probability। Casino-র ক্ষেত্রে $A_{FF} = 0.9$ আর $A_{FB} = 0.1$।
- $E$: $|Q|\times|\Sigma|$ মাপের **emission** matrix। $E_{k}(b) = \Pr(x_i = b \mid \pi_i = k)$ হলো state k থেকে symbol b বের হওয়ার probability। Casino-র ক্ষেত্রে $E_F(H) = 0.5$, $E_B(H) = 0.75$।
- **A-এর প্রতিটা সারি আর E-এর প্রতিটা সারির যোগফল 1**, কারণ প্রতিটা সারিই একটা probability distribution।

লুকানো path-টাকে আমরা লিখি π = π₁π₂…πₙ, আর দেখা sequence-টাকে x = x₁x₂…xₙ।

**Markov property:** পরের state শুধু বর্তমান state-এর ওপর নির্ভর করে, আগের ইতিহাসের ওপর নয়। তাই পরপর পাঁচটা Island state-এর পরেও Island-এ থেকে যাওয়ার probability সেই $A_{II}$-ই। আর i অবস্থানের emission নির্ভর করে শুধু i অবস্থানের state-এর ওপর।

:::story "স্মৃতিহীন", আবহাওয়া দিয়ে বোঝা
একটা সহজ আবহাওয়া model-কে Markovian বলা যায়, যদি আগামীকাল বৃষ্টির সম্ভাবনা শুধু **আজকের** আবহাওয়ার ওপর নির্ভর করে, গত সপ্তাহের ওপর নয়। এতে কিছু সত্যিকারের তথ্য উপেক্ষা করা হয়, কিন্তু অঙ্কটা সামলানো যায়: আজ পর্যন্ত সেরা path বের করতে শুধু গতকাল পর্যন্ত সেরা path-গুলো লাগে। ঠিক এই কারণেই Viterbi আর Forward তাদের table একবারে এক column করে ভরতে পারে।
:::

{{ref:math#conditional-probability-and-independence}}

**একটা sequence আর একটা path-এর joint probability।** ভাবুন HMM-টা নিজেই data তৈরি করছে: প্রথম state বাছাই করো, একটা symbol emit করো, transition করো, emit করো, transition করো, emit করো… প্রতিটা ধাপের probability গুণ করুন:

$$\Pr(x, \pi) = \Pr(\pi_1)\, E_{\pi_1}(x_1)\prod_{i=2}^{n} A_{\pi_{i-1}\pi_i}\, E_{\pi_i}(x_i)$$

**হাতে-কলমে উদাহরণ।** Casino, যেখানে start probability 0.5/0.5, একই coin-এ থাকা 0.9, বদলানো 0.1। x = HH-এর জন্য চারটা সম্ভাব্য path:

| Path | হিসাব | Pr(x, π) |
|---|---|---|
| FF | 0.5 · 0.5 · 0.9 · 0.5 | 0.1125 |
| FB | 0.5 · 0.5 · 0.1 · 0.75 | 0.01875 |
| BF | 0.5 · 0.75 · 0.1 · 0.5 | 0.01875 |
| BB | 0.5 · 0.75 · 0.9 · 0.75 | **0.2531** |

সবচেয়ে সম্ভাব্য path হলো **BB**। আর observation-গুলোর মোট probability হলো এগুলোর যোগফল, $\Pr(\text{HH}) \approx 0.4031$।

**তিনটা ক্লাসিক সমস্যা:**
1. **Decoding:** সবচেয়ে সম্ভাব্য path $\pi^* = \arg\max_\pi \Pr(x, \pi)$ খুঁজে বের করা → **Viterbi** algorithm।
2. **Evaluation:** $\Pr(x) = \sum_\pi \Pr(x,\pi)$ হিসাব করা, অর্থাৎ model-টা x-কে কতটা ভালো ব্যাখ্যা করে → **Forward** (বা Backward) algorithm।
3. **Learning:** data থেকে A আর E অনুমান করা → গণনা করে (path জানা থাকলে) বা **Baum–Welch** দিয়ে (জানা না থাকলে)।

ওপরের table-টা প্রতিটা path তালিকা করে সমস্যা 1 আর 2 সমাধান করেছে। কিন্তু path আছে $|Q|^n$টা: 2টা state আর 100টা টসের জন্য সেটা $2^{100} \approx 10^{30}$। তাই আমাদের dynamic programming দরকার।

{{ref:math#counting-how-big-is-the-search-space}}

## Viterbi: সবচেয়ে সম্ভাব্য path

Viterbi algorithm-এর এই সংক্ষিপ্ত derivation-টা দেখুন, তারপর recurrence-টা পড়ুন:

{{video:LGY4yMWUjL4}}

**Subproblem।** ধরা যাক $V_k(t)$ হলো প্রথম t-টা symbol $x_1..x_t$-এর জন্য **state k-তে শেষ হওয়া** **সেরা** path-এর probability।

**Recurrence।** সময় t-তে state l-এ শেষ হওয়া সেরা path-কে সময় t − 1-এ *কোনো না কোনো* state k থেকে আসতেই হবে। প্রতিটা k চেষ্টা করুন, সেরাটা রাখুন, তারপর state l-এ $x_t$-এর emission দিয়ে গুণ করুন:

$$V_k(1) = \Pr(\pi_1 = k)\,E_k(x_1)$$
$$V_l(t) = E_l(x_t)\,\max_{k}\big[V_k(t-1)\,A_{kl}\big], \qquad \text{ptr}_l(t) = \arg\max_k \big[V_k(t-1)\,A_{kl}\big]$$

**উত্তর** হলো $\max_k V_k(n)$। সেই cell থেকে **backpointer** ধরে t = 1 পর্যন্ত ফিরে গেলে π* পাওয়া যায়।

**HH উদাহরণে মিলিয়ে দেখা।** $V_F(1) = 0.5 \cdot 0.5 = 0.25$ আর $V_B(1) = 0.5 \cdot 0.75 = 0.375$। তারপর $V_B(2) = 0.75 \cdot \max(0.25 \cdot 0.1,\ 0.375 \cdot 0.9) = 0.75 \cdot 0.3375 = 0.2531$, backpointer B। Table-এর সেরা path BB-র সাথে হুবহু মিলে গেল, অথচ কোনো path তালিকা করতে হলো না।

এটা ঠিক alignment DP-র ভাবনাই: একটা table column ধরে ধরে ভরা হয় (প্রতিটা অবস্থানের জন্য এক column, প্রতিটা state-এর জন্য এক সারি), তারপর একটা traceback। Alignment-এর জন্য যেমন Needleman–Wunsch, HMM-এর জন্য তেমনি Viterbi।

{{ref:algo#dynamic-programming}}

**Log-এ কাজ করুন।** অনেকগুলো probability গুণ করলে underflow হয়: 0.1⁵ = 10⁻⁵ ঠিক আছে, কিন্তু এক million অবস্থান জুড়ে গুণফল কম্পিউটারের সংরক্ষণ করতে পারা ক্ষুদ্রতম সংখ্যার চেয়েও অনেক ছোট। তাই logarithm নিন: গুণফল হয়ে যায় **যোগফল**, আর recurrence হয়ে যায় **log-probability-র যোগফলের max**:

$$\log V_l(t) = \log E_l(x_t) + \max_k \big[\log V_k(t-1) + \log A_{kl}\big]$$

**Complexity।** Cell আছে $n|Q|$টা, প্রতিটায় $O(|Q|)$ কাজ (k-এর ওপর max), তাই table আর backpointer মিলিয়ে **time $O(n|Q|^2)$ আর space $O(n|Q|)$**। Sequence-এর দৈর্ঘ্যে exponential নয়, linear।

{{widget:viterbi}}

:::example Handout-এর উদাহরণ (Borodovsky & Ekisheva)
State H (high GC: A .2, C .3, G .3, T .2) আর L (low GC: A .3, C .2, G .2, T .3)। Start 0.5/0.5। Transition H→H .5, H→L .5, L→H .4, L→L .6। x = GGCACTGAA-এর জন্য, log₂-তে হিসাব করে:
- $V_H(1) = \log_2 0.5 + \log_2 0.3 = -1 - 1.737 = -2.737$, আর $V_L(1) = -1 - 2.322 = -3.322$।
- $V_H(2) = -1.737 + \max(-2.737-1,\ -3.322-1.322) = -5.474$; $V_L(2) = -2.322 + \max(-2.737-1,\ -3.322-0.737) = -6.059$।
- … এভাবে শেষ column পর্যন্ত চালিয়ে গেলে সেরা চূড়ান্ত মান **−24.49**, আর traceback দেয় path **HHHLLLLLL**, যার probability $2^{-24.49} \approx 4.25\times10^{-8}$।

ওপরের widget-এ নিজে করে দেখুন: একটা অক্ষর বদলান আর দেখুন path কীভাবে বদলে যায়।
:::

## Forward, backward আর posterior decoding

এই অংশের Forward–Backward algorithm আর posterior decoding এই video-তে আলোচনা করা হয়েছে:

{{video:QBDvFVmpgd0}}

**Forward algorithm।** $\Pr(x)$, অর্থাৎ **সব** path মিলিয়ে sequence-টার probability হিসাব করতে Viterbi-র table-টাই ব্যবহার করুন, শুধু **max**-এর জায়গায় **sum** বসান। ধরা যাক $f_k(t)$ হলো $x_1..x_t$-এর probability, যেখানে path শেষ হয়েছে state k-তে:

$$f_l(t) = E_l(x_t)\sum_k f_k(t-1)\,A_{kl}, \qquad \Pr(x) = \sum_k f_k(n)$$

**HH-তে মিলিয়ে দেখা:** $f_F(1) = 0.25$, $f_B(1) = 0.375$; তারপর $f_F(2) = 0.5 \cdot (0.25 \cdot 0.9 + 0.375 \cdot 0.1) = 0.13125$ আর $f_B(2) = 0.75 \cdot (0.25 \cdot 0.1 + 0.375 \cdot 0.9) = 0.27188$। এদের যোগফল **0.4031**, table-এর চারটা path যোগ করে যে মোট পেয়েছিলাম ঠিক সেটাই।

**Handout-এর উদাহরণ:** x = GGCA-এর জন্য $f_H(2) = 0.3 \cdot (0.15\cdot0.5 + 0.1\cdot0.4) = 0.0345$, …, এবং $\Pr(\text{GGCA}) = 0.0013767 + 0.0024665 =$ **0.0038432**। একটা uniform background model-এর সাথে তুলনা করুন: $0.25^4 \approx 0.0039$। অর্থাৎ এই খেলনা HMM-টা GGCA-কে random DNA-র চেয়ে ভালো ব্যাখ্যা করে *না*। এটা একটা ভালো মনে করিয়ে দেওয়া যে **সবসময় একটা null model-এর সাথে তুলনা করুন**।

:::story Viterbi বনাম Forward: pizza delivery
আপনার দরজায় একটা pizza এসে পৌঁছাল।
- **Viterbi** জিজ্ঞেস করে: ড্রাইভার সবচেয়ে সম্ভবত কোন একটা নির্দিষ্ট পথে এসেছে? বিজয়ী একজনই; প্রতিটা মোড়ে শুধু ঢোকার সেরা পথটা রাখা হয় (**max**)।
- **Forward** জিজ্ঞেস করে: সম্ভাব্য সব পথ গুনে, একটা pizza আদৌ দরজায় পৌঁছানোর সম্ভাবনা কত ছিল? প্রতিটা পথই অবদান রাখে; প্রতিটা মোড়ে ঢোকার সব উপায় যোগ করা হয় (**sum**)।
:::

:::think Pr(x), অর্থাৎ সব path মিলিয়ে মোট probability, কখন দরকার হয়?
**Model তুলনা করতে।** জানা coding অঞ্চল থেকে একটা HMM আর non-coding DNA থেকে আরেকটা HMM বানান, নতুন একটা sequence-এর ওপর দুটো model দিয়েই Forward চালান, তারপর $\Pr(x \mid \text{coding})$ আর $\Pr(x \mid \text{non-coding})$ তুলনা করুন। প্রথমটা যদি 10⁴ গুণ বড় হয়, তাহলে sequence-টা coding DNA-র মতোই অনেক বেশি দেখায়। Gene finder আর protein-family search (HMMER ও Pfam: "কোন family-র HMM এই protein-টাকে সবচেয়ে ভালো ব্যাখ্যা করে?") এভাবেই কাজ করে।
:::

**Backward algorithm।** $b_k(t) = \Pr(x_{t+1..n}\mid \pi_t = k)$, অর্থাৎ অবস্থান t-তে state k ধরে নিলে sequence-এর বাকি অংশের probability, যা ডান থেকে বামে হিসাব করা হয়।

**Posterior decoding।** Forward আর backward-কে Bayes' rule দিয়ে মেলালে পাওয়া যায়, পুরো sequence দেওয়া থাকলে অবস্থান t-তে state k থাকার probability:

$$\Pr(\pi_t = k \mid x) = \frac{f_k(t)\, b_k(t)}{\Pr(x)}$$

HH-এর ক্ষেত্রে দ্বিতীয় টসে biased coin ব্যবহার হওয়ার probability হলো (0.2531 + 0.0188)/0.4031 ≈ **0.67**: অবস্থান 2-তে B আছে এমন সব path-এর যোগফল, মোট দিয়ে ভাগ।

{{ref:math#bayes-rule}}

**Viterbi বনাম posterior decoding।** Viterbi দেয় একটাই সবচেয়ে সম্ভাব্য *path*। Posterior decoding প্রতিটা অবস্থানে আলাদা আলাদাভাবে সবচেয়ে সম্ভাব্য *state* বেছে নেয়; ফলাফলটা হয়তো একটা বৈধ path নাও হতে পারে (এতে probability 0-এর কোনো transition থাকতে পারে), কিন্তু এটা আপনাকে এটাও জানায় প্রতিটা label-এর ব্যাপারে model কতটা নিশ্চিত।

## Parameter শেখা

**Label করা path থাকলে:** hidden state-গুলো যদি জানা থাকে (যেমন annotate করা gene থেকে), তাহলে শুধু গুনুন আর normalize করুন:

$$A_{ab} = \frac{\#(a\to b)}{\sum_q \#(a \to q)}, \qquad E_a(x) = \frac{\#(a \text{ emits } x)}{\sum_y \#(a \text{ emits } y)}$$

**উদাহরণ।** Label করা path যদি হয় IIIBBI, তাহলে I থেকে বের হওয়া transition হলো দুবার I→I আর একবার I→B, তাই $A_{II} = 2/3$ আর $A_{IB} = 1/3$।

**Pseudocount** যোগ করুন (প্রতিটা গণনায় +1), যাতে training data-য় দেখা যায়নি এমন ঘটনার probability 0 না হয়ে যায়। Motif profile-এ যে ভাবনা দেখেছিলেন, এটা হুবহু সেটাই।

{{ref:motifs#greedymotifsearch-and-pseudocounts}}

**Label না থাকলে** path জানা নেই, তাই আমরা পালা করে path অনুমান করি আর parameter নতুন করে হিসাব করি:
- **Viterbi training:** random parameter দিয়ে শুরু করুন; তারপর বারবার করুন {Viterbi দিয়ে সেরা path decode করুন; সেই path ধরে গুনে A আর E নতুন করে হিসাব করুন}। এটা একটা local search, অনেকটা randomized motif search-এর মতো।
- **Baum–Welch:** একই loop, কিন্তু একটা সেরা path-এ আটকে না থেকে এটা forward–backward posterior থেকে হিসাব করা **expected count** ব্যবহার করে (প্রতিটা path তার probability-র অনুপাতে অবদান রাখে)। এটা **expectation–maximization (EM)**-এর একটা বিশেষ রূপ, আর কোনো iteration-এ likelihood কমে না।

{{ref:algo#iterative-optimization-the-em-pattern}}

{{video:FoMHdshE6oM}}

:::example Baum–Welch কি optimal model-এর নিশ্চয়তা দেয়?
**না।** এটা likelihood-এর একটা **local maximum**-এ গিয়ে থামে (সবচেয়ে খারাপ ক্ষেত্রে একটা saddle point-এ), যা শুরুর parameter-এর ওপর নির্ভর করে। আর model-এ state খুব বেশি হলে এটা overfit করতে পারে।

**প্রতিকার:** **একাধিকবার random restart** (সর্বোচ্চ likelihood-ওয়ালাটা রাখুন), **বুদ্ধিমানের মতো initialization** (যেমন ছোট একটা label করা set থেকে বা Viterbi training থেকে), **pseudocount বা Dirichlet prior**, model-এর structure-এ বাধা দেওয়া (অসম্ভব transition-গুলোকে 0-তে স্থির করে দেওয়া), আর annealing-ধাঁচের পদ্ধতি। আলাদা করে রাখা (held-out) data-তে generalization যাচাই করুন।
:::

## CpG island আর gene finding

**CpG island।** "CpG" মানে একই strand-এ একটা C-এর ঠিক পরে একটা G (মাঝের p হলো তাদের মধ্যকার phosphate)। মেরুদণ্ডী প্রাণীর genome-এ CpG বিরল, কারণ CpG-র C প্রায়ই **methylated** থাকে, আর methylated C-এর T-তে mutate হওয়ার প্রবণতা আছে। তবে অনেক gene-এর promoter-এর কাছে থাকে **CpG island**: কয়েকশো থেকে কয়েক হাজার base-এর এমন অংশ, যেখানে CpG methylated নয় এবং প্রচুর পরিমাণে থেকে যায়, আর সামগ্রিকভাবে C+G-র পরিমাণও বেশি। এগুলো খুঁজে পেলে gene-এর অবস্থান বের করতে সুবিধা হয়।

**CpG island-এর জন্য একটা HMM**-এ থাকে একটা **Island** state (যার emission-এ C আর G বেশি) আর একটা **Background** state (যেখানে A আর T বেশি), দুটোরই self-transition probability বেশি, যাতে অঞ্চলগুলো লম্বা হয়। তারপর Viterbi একটা genome-কে island আর background-এ ভাগ করে ফেলে।

**শুধু একটা GC% window সরিয়ে সরিয়ে দেখলেই তো হয়?** Window **transition-এর গঠন উপেক্ষা করে**: আপনাকে একটা মনগড়া window size বাছতে হয়, আর সীমানাগুলো হয় এলোমেলো। HMM প্রতিটা base-এর emission থেকে পাওয়া প্রমাণকে state বদলের খরচের সাথে ভারসাম্য করে, তাই AT-সমৃদ্ধ অঞ্চলে একটা মাত্র G দিয়ে island শুরু হয় না, কিন্তু একটা লম্বা GC-সমৃদ্ধ অংশ দিয়ে হয়।

এই lecture-টা CpG island-এর প্রয়োগ বিস্তারিতভাবে দেখায়:

{{video:xi9c7J-E2C0}}

:::example Exon আর intron আলাদা করার জন্য একটা HMM ডিজাইন করা
- **State:** exon (প্রায়ই তিনটা state, codon-এর প্রতিটা অবস্থানের জন্য একটা করে), intron, intergenic, সাথে splice site-এর জন্য state।
- **Emission** গঠনগত বৈশিষ্ট্য ধরে: exon **codon usage** মেনে চলে, 3-base-এর একটা পর্যাবৃত্তি থাকে, আর সাধারণত GC বেশি; intron-এ AT বেশি, আর এরা শুরু হয় **GT** দিয়ে এবং শেষ হয় **AG** দিয়ে (splice donor আর acceptor সংকেত)।
- **Transition** প্রকাশ করে **গঠন আর দৈর্ঘ্য**। Self-transition probability p হলে দৈর্ঘ্যের distribution হয় geometric, যার গড় 1/(1 − p), তাই লম্বা intron-এর জন্য intron→intron probability বেশি রাখা হয়। Exon→intron transition যায় donor-site state-এর মধ্য দিয়ে আর intron→exon যায় acceptor state-এর মধ্য দিয়ে, ফলে অসম্ভব ক্রম আর ঘটতে পারে না।
- এরপর **Viterbi** emission-এর প্রমাণকে transition-এর খরচের সাথে তুলনা করে প্রতিটা base-কে exon বা intron হিসেবে label করে: exon-এর ভেতরে কয়েকটা intron-এর মতো base থাকলেই state বদলে যায় না। **GENSCAN**-এর মতো gene finder এই ধরনেরই generalized HMM।
:::

{{game:cpg-detective}}

## আরও এগিয়ে: profile HMM আর pair HMM

- **Profile HMM** একটা protein family-র multiple alignment-কে model করে, প্রতিটা column-এর জন্য একটা **match**, একটা **insert** আর একটা **delete** state দিয়ে। **HMMER** (Sean Eddy) এগুলো দিয়ে database-এ খোঁজে, আর **Pfam**-এ কয়েক দশ হাজার protein family-র profile HMM রাখা আছে। দূরের আত্মীয় খুঁজতে এগুলো BLAST-এর চেয়ে অনেক বেশি sensitive, কারণ এরা জানে family-র কোন column-গুলো সংরক্ষিত।
- **Pair HMM** একসাথে *দুটো* sequence emit করে, পাশাপাশি বসানো জোড়া হিসেবে। এর Viterbi path *নিজেই* একটা alignment। Sequence Alignment lesson-এর তিন-state-ওয়ালা affine-gap diagram (M, X, Y) এরকমই একটা pair HMM।

{{ref:alignment#gap-penalties-linear-vs-affine}}

## এক নজরে

| Algorithm | কী হিসাব করে | Operation | Time | Space |
|---|---|---|---|---|
| Viterbi | সেরা path π* | max | O(n\|Q\|²) | O(n\|Q\|) |
| Forward | Pr(x) | sum | O(n\|Q\|²) | O(n\|Q\|) (শুধু Pr(x) দরকার হলে O(\|Q\|)) |
| Forward–Backward | Pr(πₜ = k \| x) | sum | O(n\|Q\|²) | O(n\|Q\|) |
| Baum–Welch | A, E (label ছাড়া data) | forward–backward-এর ওপর EM | প্রতি iteration-এ O(n\|Q\|²) | O(n\|Q\|) |
