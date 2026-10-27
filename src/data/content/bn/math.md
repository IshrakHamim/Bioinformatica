কোর্সের lesson-গুলো নিঃশব্দে ধরে নেয় যে আপনি কিছুটা probability, information theory, linear algebra, calculus আর statistics জানেন। এই module ঠিক সেই গণিতটুকুই একদম গোড়া থেকে শেখায়, আর প্রতিটা ধারণার সঙ্গে দেখিয়ে দেয় bioinformatics-এর কোথায় আপনি সেটার দেখা পাবেন।

:::tip আগে এটা পড়ে নেওয়া বাধ্যতামূলক নয়
কোর্সের প্রতিটা lesson-এ যেসব ধাপে এই গণিত লাগে, তার পাশেই **🧱 Stuck? Quick refresher** link থাকে। সেটায় ক্লিক করলে নিচের মিলে যাওয়া অংশটা lesson-এর ভেতরেই খুলে যায়। পুরো একটা warm-up চাইলে তবেই এই module শুরু থেকে শেষ পর্যন্ত পড়ুন।
:::

## Probability-র মূল কথা

**Probability** হলো 0 থেকে 1-এর মধ্যে একটা সংখ্যা, যেটা কোনো **event**-এর সঙ্গে জুড়ে থাকে: 0 মানে অসম্ভব, 1 মানে নিশ্চিত। সম্ভাব্য সব outcome মিলিয়ে যে set, তাকে বলে **sample space**। DNA-র একটা position-এর জন্য এটা {A, C, G, T}।

**Probability distribution** প্রতিটা outcome-কে একটা করে probability দেয়, আর সেই probability-গুলোর **যোগফল 1** হয়। DNA-র একটা position-এর distribution এরকম হতে পারে:

| A | C | G | T |
|---|---|---|---|
| 0.1 | 0.4 | 0.4 | 0.1 |

এটা একটা GC-rich position। ঠিক এই ধরনের table আপনি দেখবেন **motif profile**-এর একটা column হিসেবে (Regulatory Motifs lesson) এবং **emission matrix**-এর একটা row হিসেবে (HMM lesson)। "প্রতিটা column, বা প্রতিটা row-এর যোগফল 1" নিয়মটা আসলে শুধু এটুকুই বলে যে ওটা একটা distribution।

প্রায় সবকিছু তিনটা নিয়মেই চলে যায়:

1. **Complement:** $\Pr(\text{not } A) = 1 - \Pr(A)$। কোনো base call ভুল হওয়ার probability যদি 0.001 হয়, তাহলে সেটা ঠিক হওয়ার probability 0.999।
2. **"অথবা", যখন event-গুলো একসঙ্গে ঘটতে পারে না (mutually exclusive):** $\Pr(A \text{ or } B) = \Pr(A) + \Pr(B)$। ওপরের table-এ একটা position purine (A অথবা G) হওয়ার probability হলো 0.1 + 0.4 = 0.5।
3. **"এবং", যখন event-গুলো independent:** $\Pr(A \text{ and } B) = \Pr(A)\Pr(B)$ (পরের অংশে বিস্তারিত)।

**Discrete বনাম continuous।** DNA-র অক্ষর, codon আর k-mer হলো *discrete* outcome, তাই আমরা probability যোগ করি। কিন্তু expression level-এর মতো পরিমাপ *continuous*: তখন আমরা একটা **density** ব্যবহার করি (যেমন Gaussian bell curve), আর probability হয় তার নিচের ক্ষেত্রফল। এই কোর্সে প্রায় সবকিছুই discrete।

## Conditional probability আর independence

$\Pr(A \mid B)$-কে পড়া হয় "B **দেওয়া থাকলে** A-এর probability"। অর্থাৎ B যে ঘটেছে সেটা জানার পর A ঘটার probability:

$$\Pr(A \mid B) = \frac{\Pr(A \text{ and } B)}{\Pr(B)}$$

এভাবে ভাবুন: পুরো জগৎটাকে ছোট করে শুধু সেই ঘটনাগুলোতে নিয়ে আসুন যেখানে B সত্য, তারপর জিজ্ঞেস করুন তাদের মধ্যে কত ভাগে A-ও সত্য।

**উদাহরণ।** ধরা যাক একটা genome-এর 40% position হলো C বা G, আর 1% position থেকে একটা CG dinucleotide শুরু হয়। তাহলে একটা position C হলে পরের base G হওয়ার সম্ভাবনা হলো $\Pr(\text{next is G} \mid \text{C})$। মেরুদণ্ডী প্রাণীর (vertebrate) genome-এ C আর G-এর পরিমাণ দেখে যতগুলো CG জোড়া আশা করা উচিত, বাস্তবে তার চেয়ে অনেক কম থাকে, তাই এই conditional probability কম। HMM lesson-এ **CpG island** খোঁজার পুরো ভিত্তিই এই তথ্য।

**Independence** মানে B জানলে A সম্পর্কে নতুন কিছুই জানা যায় না: $\Pr(A \mid B) = \Pr(A)$, যা একই কথা $\Pr(A \text{ and } B) = \Pr(A)\Pr(B)$।

Independence-এর অনুমান পুরো কোর্স জুড়ে ছড়িয়ে আছে, তাই ঠিক কোথায় কোথায় সেটা ব্যবহার হচ্ছে দেখে রাখা ভালো:

- **একটা k-mer-এর profile probability।** কোনো motif profile অনুযায়ী `ACG`-এর probability হলো $\Pr(A \text{ in col 1}) \cdot \Pr(C \text{ in col 2}) \cdot \Pr(G \text{ in col 3})$। গুণ করার মানেই ধরে নেওয়া হচ্ছে column-গুলো independent।
- **Coin-flip sequence-এর probability।** একটা fair coin-এর জন্য $\Pr(HHT) = 0.5 \cdot 0.5 \cdot 0.5$, কারণ প্রতিটা টস independent।
- **HMM** independence-এর শর্ত একটু শিথিল করে: position t-এর hidden state নির্ভর করে t − 1-এর state-এর ওপর (একে বলে *Markov property*), আর প্রতিটা emit করা অক্ষর নির্ভর করে শুধু নিজের state-এর ওপর। এগুলো conditional probability: transition $\Pr(\pi_t \mid \pi_{t-1})$ আর emission $\Pr(x_t \mid \pi_t)$।

:::warn Independence একটা modelling-এর সিদ্ধান্ত
বাস্তবে DNA-র position-গুলো independent নয় (একটা binding site-এ পাশাপাশি base-গুলো একে অপরকে প্রভাবিত করে)। Model-গুলো independence ধরে নেয়, কারণ তাতে গণিত আর computation সামলানোর মতো থাকে। কোনো method ব্যর্থ হলে প্রায়ই তার পেছনের কারণ হয় এই রকম একটা independence-এর অনুমান।
:::

## Bayes' rule

Bayes' rule একটা conditional probability-কে উল্টে দেয়। কোনো hypothesis সত্য হলে data কতটা সম্ভাব্য, সেটা যদি আপনি জানেন, তাহলে এই নিয়ম বলে দেয় data দেখার পর hypothesis-টা কতটা সম্ভাব্য:

$$\Pr(H \mid D) = \frac{\Pr(D \mid H)\,\Pr(H)}{\Pr(D)}$$

- $\Pr(H)$ হলো **prior**: data দেখার আগে আপনার বিশ্বাস।
- $\Pr(D \mid H)$ হলো **likelihood**: hypothesis H, data D-কে কতটা ভালোভাবে ব্যাখ্যা করে।
- $\Pr(H \mid D)$ হলো **posterior**: data দেখার পরে আপনার বিশ্বাস।
- $\Pr(D)$ সবকিছুকে normalize করে, যাতে posterior-গুলোর যোগফল 1 হয়। **Law of total probability** অনুযায়ী $\Pr(D) = \sum_H \Pr(D \mid H)\Pr(H)$: data যত উপায়ে তৈরি হতে পারত, সবগুলো যোগ করুন।

**পুরো হিসাব করা উদাহরণ: অসৎ casino।** একটা casino হয় একটা fair coin (P(H) = 0.5) ব্যবহার করে, নয়তো একটা biased coin (P(H) = 0.75), আর প্রতিটার prior 0.5। আপনি পরপর তিনটা head দেখলেন, HHH।

- Likelihood: $\Pr(HHH \mid \text{fair}) = 0.5^3 = 0.125$ এবং $\Pr(HHH \mid \text{biased}) = 0.75^3 \approx 0.422$।
- Evidence: $\Pr(HHH) = 0.125 \cdot 0.5 + 0.422 \cdot 0.5 \approx 0.273$।
- Posterior: $\Pr(\text{biased} \mid HHH) = 0.422 \cdot 0.5 / 0.273 \approx$ **0.77**।

তিনটা head দেখে coin-টা biased হওয়ার ব্যাপারে আপনার বিশ্বাস 50% থেকে বেড়ে 77% হয়ে গেল। HMM lesson একটা sequence-এর প্রতিটা position-এ ঠিক এই হিসাবটাই করে (posterior decoding), আর $\Pr(D)$ দক্ষভাবে বের করার উপায় হলো Forward algorithm।

{{video:kqSzLo9fenk}}

## Expected value আর distribution থেকে sampling

**Expected value** হলো probability দিয়ে weight করা গড় outcome:

$$E[X] = \sum_x x \cdot \Pr(X = x)$$

কোনো motif-এর position 3-এ T থাকার probability যদি 0.8 হয়, তাহলে 10টা sequence জুড়ে আপনি $10 \times 0.8 = 8$টা T আশা করবেন। Expected value থেকেই আসে "এমনি এমনি (by chance) কতবার হওয়ার কথা" সেই count, যার তুলনায় একটা pattern অবাক করার মতো দেখায় (oriC lesson), আর Baum–Welch HMM-এর parameter নতুন করে estimate করতে যে expected count ব্যবহার করে, সেটাও এখান থেকেই।

**Sampling।** Randomized algorithm-গুলোর (Gibbs sampling, k-means++) একটা distribution অনুযায়ী একটা outcome *তুলে নিতে* হয়। পদ্ধতিটা এরকম:

1. Probability-র বদলে যদি আপনার কাছে **weight** থাকে, তাহলে প্রতিটাকে মোট যোগফল দিয়ে ভাগ করুন, যাতে সব মিলিয়ে 1 হয় (**normalize**)।
2. 0 আর 1-এর মধ্যে একটা uniform random সংখ্যা u নিন।
3. Outcome-গুলোর ওপর দিয়ে এগোতে এগোতে probability যোগ করতে থাকুন; যে outcome-এ পৌঁছে চলমান যোগফল প্রথমবার u ছাড়িয়ে যায়, সেটাই বেছে নিন।

**উদাহরণ।** তিনটা k-mer-এর weight 0.004, 0.001 আর 0.003। এদের যোগফল 0.008, তাই normalize করা probability হয় 0.5, 0.125 আর 0.375, আর চলমান যোগফল 0.5, 0.625, 1.0। u = 0.55 হলে দ্বিতীয় k-mer বাছাই হবে; u = 0.9 হলে তৃতীয়টা।

Gibbs sampler যখন একটা নতুন motif বেছে নেয়, তখন ঠিক এই "একটা অসম ছক্কা গড়ানো" ধাপটাই করে। আর এ কারণেই normalize করার আগে k-mer probability-গুলোর যোগফল 1 হওয়ার দরকার নেই।

## Logarithm, likelihood আর log-odds

Logarithm আপনি সারাক্ষণই দেখবেন, তিনটা কারণে।

**1. Log গুণফলকে যোগফলে বদলে দেয়।** $\log(ab) = \log a + \log b$। একটা লম্বা sequence-এর probability হলো হাজার হাজার ছোট সংখ্যার গুণফল; তার log হয় একটা যোগফল, যেটা একটা DP table-এ সহজেই যোগ করে যাওয়া যায়।

**2. Log underflow ঠেকায়।** কম্পিউটারের double-precision সংখ্যা মোটামুটি $10^{-308}$-এর নিচে নামতে পারে না। Uniform model-এ 1,000 অক্ষরের একটা নির্দিষ্ট DNA string-এর probability হলো $0.25^{1000} \approx 10^{-602}$, যেটাকে কম্পিউটার 0 বানিয়ে ফেলে। অথচ এর log হলো $1000 \cdot \log_2 0.25 = -2000$, একদম সাধারণ একটা সংখ্যা। একটা genome-এর ওপর Viterbi চালানো কেবল log space-এই সম্ভব।

**3. Log অনুপাতের (ratio) স্কেলে মাপে।** কাজের কিছু তথ্য:

| তথ্য | উদাহরণ |
|---|---|
| $\log_2 2^k = k$ | $\log_2 8 = 3$ |
| $\log_2 (1/2) = -1$ | 0.25 probability মানে −2 bits |
| $\log_{10} 10^{-3} = -3$ | Phred score-এ ব্যবহার হয়: Q = −10·log₁₀(0.001) = 30 |
| $\log(a/b) = \log a - \log b$ | অনুপাত হয়ে যায় বিয়োগফল |
| log ক্রমবর্ধমান (increasing) | যে k একটা probability-কে সর্বোচ্চ করে, সেটাই তার log-কেও সর্বোচ্চ করে |

শেষ row-টার কারণেই algorithm-গুলো probability-র বদলে log-probability maximize করতে পারে, আর উত্তর একই আসে।

**Likelihood।** নির্দিষ্ট data D-এর জন্য একটা model M-এর likelihood হলো $\Pr(D \mid M)$। দুটো model-কে **likelihood ratio** $\Pr(D \mid M_1) / \Pr(D \mid M_2)$ দিয়ে তুলনা করা মানে জিজ্ঞেস করা, কোনটা data-কে বেশি ভালো ব্যাখ্যা করে।

**Log-odds score।** অনুপাতটার $\log_2$ নিন। ধনাত্মক হলে M₁ এগিয়ে, ঋণাত্মক হলে M₂, আর শূন্য হলে কোনোটাই নয়। HHTTTTH টসগুলোর জন্য: $\Pr(\cdot \mid \text{fair}) = 0.5^7 \approx 0.0078$ এবং $\Pr(\cdot \mid \text{biased}) = 0.75^3 \cdot 0.25^4 \approx 0.0016$, তাই log-odds হলো $\log_2(0.0078/0.0016) \approx 2.25 > 0$: fair coin জিতল। BLOSUM62-এর মতো substitution matrix আসলে log-odds score-এর table ("আসল protein-এ এই দুটো amino acid এমনি এমনি যতবার align হওয়ার কথা, তার চেয়ে কতগুণ বেশি হয়?")।

## Entropy

Entropy **অনিশ্চয়তা** মাপে, bit-এ:

$$H(p) = -\sum_i p_i \log_2 p_i \qquad (\text{with } 0 \log 0 = 0)$$

সহজ করে ভাবলে: outcome-টা অনুমান করতে গড়ে কতগুলো হ্যাঁ/না প্রশ্ন লাগবে, সেটাই entropy।

- একটা uniform DNA position (প্রতিটা ¼)-এর H = 2 bits: দুটো প্রশ্ন লাগে ("purine নাকি pyrimidine?", তারপর "কোনটা?")।
- যে position সবসময় G, তার H = 0: কোনো প্রশ্নই লাগে না।
- (½, ¼, ¼, 0)-এর ক্ষেত্রে $H = -(0.5\log_2 0.5 + 2 \cdot 0.25 \log_2 0.25) = 0.5 + 1 = 1.5$ bits।

N অক্ষরের একটা alphabet-এ entropy 0 (নিশ্চিত) থেকে $\log_2 N$ (uniform) পর্যন্ত হতে পারে: DNA-র জন্য 2 bits, 20টা amino acid-এর জন্য প্রায় 4.32 bits।

**কোথায় কাজে লাগবে।** Motif finding-এ একটা **conserved** column-এর entropy কম। একটা column-এর **information content**, DNA-র জন্য $2 - H$, হলো **sequence logo**-তে অক্ষরের স্তূপের উচ্চতা। t-SNE-তে perplexity হলো $2^{H}$, অর্থাৎ "কার্যত কতজন neighbour"।

{{widget:entropy}}

## KL divergence

**Kullback–Leibler divergence** মাপে একটা distribution P একটা reference distribution Q থেকে কতটা আলাদা:

$$\mathrm{KL}(P\,\|\,Q) = \sum_i p_i \log\frac{p_i}{q_i}$$

এভাবে পড়ুন: "outcome-গুলো আসলে P মেনে ঘটে, কিন্তু আমি Q আশা করছিলাম, তাহলে গড়ে আমি কতটা অবাক হব?"

যে বৈশিষ্ট্যগুলো জানা দরকার:

- $\mathrm{KL}(P\|Q) \ge 0$, এবং এটা 0 হয় কেবল তখনই যখন P = Q।
- এটা **symmetric নয়**। P = (0.5, 0.5) আর Q = (0.9, 0.1) হলে $\mathrm{KL}(P\|Q) \approx 0.74$ bits, কিন্তু $\mathrm{KL}(Q\|P) \approx 0.53$ bits।
- একটা term বড় হয় যখন $p_i$ বড় কিন্তু $q_i$ ছোট (যে outcome প্রায়ই ঘটে, অথচ আশা করা হয়েছিল কালেভদ্রে ঘটবে)। $p_i$ খুব ছোট হলে $q_i$ যা-ই হোক, term-টার প্রায় কোনো ওজন থাকে না।

এই শেষ বৈশিষ্ট্যটার কারণেই **SNE আর t-SNE স্থানীয় neighbourhood ধরে রাখে** (Dimensionality Reduction lesson): আসল neighbour-দের দূরে সরিয়ে দিলে কঠিন শাস্তি, কিন্তু যারা neighbour নয় তাদের কাছে নিয়ে এলে শাস্তি হালকা। KL আরও দেখা যায় background DNA-র তুলনায় একটা motif-এর **relative entropy** হিসেবে, আর **VAE**-র regularizer হিসেবে।

{{widget:kl}}

{{video:SxGYPqCgJWM}}

## Vector, matrix আর covariance

**Matrix হিসেবে data।** Expression data হলো একটা **n × d matrix**: প্রতিটা sample (বা cell)-এর জন্য একটা row, প্রতিটা gene-এর জন্য একটা column। Row i হলো d-dimensional space-এ একটা বিন্দু; "একটা sample হলো একটা vector" কথাটার মানে শুধু এটুকুই।

**Mean আর centering।** একটা column-এর mean হলো সেই gene-এর গড় expression। **Centering** মানে প্রতিটা column থেকে তার mean বিয়োগ করা, যাতে বিন্দুগুলোর মেঘটা origin-এর চারপাশে বসে। PCA সবসময় centering দিয়ে শুরু হয়।

**Variance** একটা variable কতটা ছড়িয়ে আছে তা মাপে: mean থেকে বিচ্যুতির বর্গের গড়, $\mathrm{var}(x) = \frac{1}{n-1}\sum_i (x_i - \bar x)^2$।

**Covariance** মাপে দুটো variable একসঙ্গে ওঠানামা করে কি না:

$$\mathrm{cov}(x, y) = \frac{1}{n-1}\sum_i (x_i - \bar x)(y_i - \bar y)$$

ধনাত্মক: একটা যখন নিজের mean-এর ওপরে থাকে, অন্যটাও সাধারণত ওপরে থাকে। ঋণাত্মক: দুটো উল্টো দিকে চলে। শূন্যের কাছাকাছি: কোনো linear সম্পর্ক নেই।

**পুরো হিসাব করা উদাহরণ।** চারটা sample জুড়ে gene A = (2, 4, 6, 8) আর gene B = (1, 3, 2, 6)। Mean দুটো 5 আর 3, তাই বিচ্যুতিগুলো (−3, −1, 1, 3) আর (−2, 0, −1, 3)।
- cov(A, B) = (6 + 0 − 1 + 9)/3 ≈ 4.67
- var(A) = (9 + 1 + 1 + 9)/3 ≈ 6.67, var(B) = (4 + 0 + 1 + 9)/3 ≈ 4.67
- **Correlation** = cov/(sd_A · sd_B) ≈ 4.67/√(6.67 · 4.67) ≈ **0.84**: জোরালোভাবে co-expressed।

**Covariance matrix** Σ সব জোড়ার covariance এক জায়গায় রাখে, diagonal-এ থাকে variance-গুলো। Centered data X-এর জন্য এটা $\Sigma = \frac{1}{n-1}X^\top X$। এটা সবসময় **symmetric** (cov(x, y) = cov(y, x)) এবং positive semi-definite। PCA-র পুরো কারবারই এই matrix-কে ঘিরে।

{{video:qtaqvPAeEJY}}

## Eigenvector আর eigenvalue

একটা vector-কে একটা matrix দিয়ে গুণ করলে সাধারণত তার দিক বদলে যায়। কিন্তু matrix A-এর একটা **eigenvector** v বিশেষ: A তাকে শুধু টেনে লম্বা (বা ছোট) করে, λ গুণ, আর এই λ-কে বলে **eigenvalue**:

$$A\mathbf{v} = \lambda\mathbf{v}$$

**উদাহরণ।** $A = \begin{pmatrix}2 & 1\\ 1 & 2\end{pmatrix}$-এর জন্য vector (1, 1) গিয়ে হয় (3, 3), তাই এটা λ = 3 সহ একটা eigenvector। Vector (1, −1) গিয়ে হয় (1, −1), λ = 1।

একটা 2×2 symmetric matrix $\begin{pmatrix}a & b\\ b & d\end{pmatrix}$-এর eigenvalue-গুলোর একটা সরাসরি সূত্র আছে:

$$\lambda = \frac{a+d}{2} \pm \sqrt{\left(\frac{a-d}{2}\right)^2 + b^2}$$

উদাহরণ দিয়ে মিলিয়ে নিন: $2 \pm \sqrt{0 + 1} = 3$ অথবা 1। ✓

**PCA কেন এ নিয়ে মাথা ঘামায়।** একটা **covariance matrix**-এর ক্ষেত্রে:
- eigenvector-গুলো হলো data-মেঘের অক্ষগুলোর দিক, এবং এরা পরস্পর **orthogonal** (কারণ Σ symmetric);
- প্রতিটা eigenvalue হলো **নিজের eigenvector বরাবর data-র variance**।

তাই সবচেয়ে বড় eigenvalue-ওয়ালা eigenvector হলো সেই দিক, যেদিকে data সবচেয়ে বেশি ছড়িয়ে আছে: **PC1**। PC1 মোট variance-এর যে ভগ্নাংশ ব্যাখ্যা করে, তা হলো $\lambda_1/\sum_j \lambda_j$।

একই উত্তর পাওয়ার numerically stable উপায় হলো **SVD**: centered data $X = USV^\top$ হলে V-এর column-গুলো principal axis, আর $S^2/(n-1)$ হলো covariance matrix-এর eigenvalue।

{{widget:eigen}}

{{video:PFDu9oVAE-g}}

## Distance আর similarity

Clustering, nearest neighbour, motif search, tree তৈরি, সবকিছুতেই একটা ধারণা লাগে: "এই দুটো জিনিস একে অপরের থেকে কত দূরে?" কোন distance বেছে নেবেন, সেটাও modelling-এরই অংশ।

| মাপকাঠি | সংজ্ঞা | উদাহরণ | কোথায় ব্যবহার হয় |
|---|---|---|---|
| Hamming | কতগুলো position-এ অমিল (সমান দৈর্ঘ্যে) | CGAAT vs CGGAC → 2 | motif, approximate matching |
| Edit (Levenshtein) | সবচেয়ে কম কতগুলো substitution, insertion আর deletion লাগে | GCAT vs GAT → 1 | read mapping, alignment |
| Euclidean | $\sqrt{\sum_i (x_i - y_i)^2}$ | (0,0) to (3,4) → 5 | k-means, KNN, PCA |
| Pearson correlation distance | $1 - r(x, y)$ | (1,2,3) vs (10,20,30) → 0 | expression profile |
| Cosine similarity | $\dfrac{x \cdot y}{\|x\|\,\|y\|}$ | (1,0,1) vs (1,1,0) → 0.5 | embedding (dna2vec) |
| Tree (path) distance | দুটো leaf-এর মাঝের edge-গুলোর দৈর্ঘ্যের যোগফল | | phylogeny |

**আকৃতি বনাম মাত্রা।** Gene profile (1, 2, 3) আর (10, 20, 30) Euclidean distance-এ অনেক দূরে (প্রায় 33.7), কিন্তু এদের correlation 1: এরা একসঙ্গে ওঠে আর নামে, শুধু মাত্রাটা আলাদা। আপনি যদি *co-regulated* gene-গুলোকে এক দলে রাখতে চান, তাহলে সাধারণত correlation distance বেশি যুক্তিসংগত। আর যদি sample-গুলোকে absolute expression অনুযায়ী দলে ভাগ করতে চান, তাহলে log-transform করা data-র ওপর Euclidean-ই চলতি পদ্ধতি।

একটা সত্যিকারের **metric** হতে হলে distance-কে অ-ঋণাত্মক হতে হবে, শুধু অভিন্ন জিনিসের ক্ষেত্রে শূন্য হতে হবে, symmetric হতে হবে, এবং **triangle inequality** $d(x, z) \le d(x, y) + d(y, z)$ মানতে হবে। Phylogeny-র distance matrix-গুলোর জন্য এই শর্তগুলো মানা বাধ্যতামূলক।

## Derivative, gradient আর chain rule

**Derivative = ঢাল (slope)।** একটা function e(w)-এর derivative $e'(w)$ বলে দেয় w সামান্য বদলালে e কত দ্রুত বদলায়। Minimum-এ (উপত্যকার একদম তলায়) ঢাল 0।

**উদাহরণ।** $e(w) = (w - 3)^2$-এর derivative $e'(w) = 2(w - 3)$। w = 0-তে ঢাল −6: w বাড়লে function *নিচে* নামে, তাই e কমাতে হলে আমাদের w বাড়ানো উচিত।

**Gradient descent** এই যুক্তিটাই বারবার প্রয়োগ করে:

$$w \leftarrow w - \alpha \, e'(w)$$

Learning rate α = 0.1 নিয়ে w = 0 থেকে শুরু করলে: w হয় 0 − 0.1·(−6) = 0.6, তারপর 0.6 − 0.1·(−4.8) = 1.08, এভাবে ধীরে ধীরে 3-এর দিকে এগোয়। Minimum-এর কাছে ঢাল যত সমতল হয়, ধাপগুলো তত ছোট হয়ে আসে। α খুব বড় হলে ধাপগুলো লক্ষ্য পেরিয়ে চলে যায় এবং diverge করতে পারে; খুব ছোট হলে অগ্রগতি হয় ধীর।

**Partial derivative আর gradient।** অনেকগুলো parameter $w_1, \dots, w_n$ থাকলে partial derivative $\partial e/\partial w_j$ হলো শুধু $w_j$ বদলালে যে ঢাল পাওয়া যায়। এদের সবগুলো মিলিয়ে যে vector, সেটাই **gradient** $\nabla e$; এটা চড়াইয়ের দিকে নির্দেশ করে, তাই gradient descent ঠিক উল্টো দিকে পা ফেলে।

**Chain rule।** একটা composition $f(g(x))$-এর জন্য:

$$\frac{d}{dx} f(g(x)) = f'(g(x)) \cdot g'(x)$$

একটা neural network হলো function-এর একটা লম্বা শিকল, আর **backpropagation** মানে output থেকে পেছনের দিকে এক layer করে chain rule প্রয়োগ করা। একটা কাজের derivative: sigmoid $\sigma(z) = 1/(1 + e^{-z})$-এর $\sigma'(z) = \sigma(z)(1 - \sigma(z))$।

**Local বনাম global optimum।** অনেক objective-এর একাধিক উপত্যকা থাকে। Gradient descent, k-means, EM, Baum–Welch আর randomized motif search, সবাই *কোনো একটা* উপত্যকার তলায় গিয়ে থামে, সেটা সবচেয়ে গভীরটা না-ও হতে পারে। এ কারণেই এই algorithm-গুলো কয়েকটা আলাদা random শুরুর বিন্দু থেকে চালানো হয়।

## গোনা: search space কত বড়?

গুনে দেখলেই বোঝা যায় brute force আদৌ সম্ভব কি না। Algorithm design করার আগে গুনে নিন সেটাকে কতগুলো সম্ভাবনা পরীক্ষা করতে হবে।

- **DNA-র ওপর k-mer:** $4^k$টা সম্ভাব্য string। $4^9 = 262{,}144$; $4^{20} \approx 10^{12}$।
- **n দৈর্ঘ্যের string-এ k-mer-এর position:** $n - k + 1$ (window শুরু হতে পারে position 0 থেকে n − k পর্যন্ত)।
- **Codon:** $4^3 = 64$, যা দিয়ে 20টা amino acid আর stop signal বোঝানো হয়।
- **Protein k-mer:** $20^k$।
- |Q|টা state-ওয়ালা একটা HMM-এ n position জুড়ে **hidden state path:** $|Q|^n$। 2টা state আর 100টা position হলেই সেটা $2^{100} \approx 10^{30}$, আর এ কারণেই Viterbi DP ব্যবহার করে।
- n দৈর্ঘ্যের দুটো sequence-এর **global alignment:** $\binom{2n}{n} \approx 4^n/\sqrt{\pi n}$-এর চেয়েও বেশি।
- n-টা label করা leaf-এর ওপর **rooted binary tree:** $(2n-3)!! = 1 \cdot 3 \cdot 5 \cdots (2n-3)$। মাত্র 10টা species-এর জন্যই সেটা 34,459,425টা tree।

Count যখন exponential, তখন brute force বাদ, আর আপনাকে খুঁজতে হবে dynamic programming, সমস্যাটাকে চতুরভাবে নতুন করে সাজানো, অথবা একটা heuristic (Algorithms foundation)।

## Statistical significance আর multiple testing

কোনো method যখন বলে "এই k-mer প্রত্যাশার চেয়ে বেশি আছে (over-represented)" বা "এই gene-গুলো immune response-এ enriched", তখন আপনাকে প্রশ্ন করতে হবে: এটা কি নিছক কাকতালীয়ভাবে ঘটতে পারত?

**Null hypothesis আর p-value।** **Null hypothesis** হলো একঘেয়ে, সাদামাটা ব্যাখ্যাটা ("gene list-টা নিছক একটা random sample")। **p-value** হলো *null সত্য হলে* অন্তত এতটা চরম ফল দেখার probability। ছোট p-value (প্রচলিতভাবে < 0.05) ইঙ্গিত দেয় যে সাদামাটা ব্যাখ্যাটা অসম্ভাব্য। এটা null সত্য হওয়ার probability **নয়**।

**Multiple testing।** 20,000 gene-কে p < 0.05-এ test করলে, আসলে কিছুই না ঘটলেও আপনি প্রায় 20,000 × 0.05 = **1,000টা false positive** আশা করবেন। এর সংশোধন:
- **Bonferroni:** শর্ত দিন p < 0.05/m (এখানে 2.5 × 10⁻⁶)। খুবই কড়া।
- **Benjamini–Hochberg (FDR):** আপনি যে ফলগুলো রিপোর্ট করছেন, তার মধ্যে false discovery-র প্রত্যাশিত *ভগ্নাংশ* নিয়ন্ত্রণ করে। Genomics-এ এটাই standard (DESeq2-র "adjusted p-value", GO enrichment-এর "q-value")।

**কোথায় এটা দেখবেন:**
- **GO enrichment** hypergeometric (Fisher's exact) test ব্যবহার করে: "আমার cluster-এ 40টা gene, তার 12টা 'immune response' হিসেবে annotate করা; random ভাবে 40টা gene তুললে এমনটা হওয়ার সম্ভাবনা কত?" (Tools foundation)।
- **BLAST E-value** হলো ওই আকারের একটা database-এ এমনি এমনি এত ভালো কতগুলো hit পাওয়ার কথা, তার প্রত্যাশিত সংখ্যা; E = 10⁻⁵⁰ মানে কাকতালীয়ভাবে হওয়া কার্যত অসম্ভব।
- Motif finding আর oriC finding-এর **background model**: "3 বার আছে" কথাটা অবাক করার মতো কেবল তখনই, যখন একটা random sequence কতবার দিত তার সঙ্গে তুলনা করা হয়।
