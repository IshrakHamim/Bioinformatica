একটা expression dataset-এ 20,000 gene থাকতে পারে, অর্থাৎ প্রতিটা sample (বা cell) হলো 20,000-dimensional space-এর একটা বিন্দু। 20,000 dimension আমরা চোখে দেখতে পারি না, আর এমন space-এ distance-গুলোও অদ্ভুত আচরণ করে। **Dimensionality reduction (DR)** এমন একটা কম-dimension-এর রূপ খুঁজে বের করে, যেখানে আমাদের দরকারি গঠনটুকু টিকে থাকে। একে আমরা ব্যবহার করি **visualization** (2-D plot), **compression**, **denoising**-এর জন্য, আর clustering বা supervised learning-এর আগে একটা **preprocessing** ধাপ হিসেবে। এই lesson-এ আছে PCA, যা ক্লাসিক linear পদ্ধতি, আর t-SNE, যে non-linear পদ্ধতি দিয়ে বেশিরভাগ single-cell plot আঁকা হয়।

## Estimator বাছাই আর DR পদ্ধতির চিড়িয়াখানা

Model বানানোর আগে ঠিক করুন আপনি আসলে কী করতে চাইছেন (slide-এ দেওয়া scikit-learn-এর "choosing the right estimator" map অনুযায়ী):
- label-যুক্ত data থেকে একটা **category** অনুমান করা → **classification**;
- একটা **পরিমাণ (quantity)** অনুমান করা → **regression**;
- label নেই, দল খুঁজছেন → **clustering**;
- label নেই, শুধু data-টা দেখতে বা সংকুচিত করতে চান → **dimensionality reduction**।

পরিচিত DR পদ্ধতি (slide): PCA, principal component regression (PCR), partial least squares (PLSR), **multidimensional scaling (MDS)**, projection pursuit, আর linear/mixture discriminant analysis (LDA/MDA; এরা label ব্যবহার করে, তাই supervised)।

| Linear | Non-linear (manifold learning) |
|---|---|
| **PCA** | Isomap, LLE, Hessian eigenmaps, spectral embedding, MDS, **t-SNE** (আর **UMAP**, যা এখন single-cell data-র default) |

একটা **linear** পদ্ধতি একটা সমতল subspace (একটা রেখা, একটা তল) খুঁজে data-টাকে তার ওপর project করে। একটা **non-linear** পদ্ধতি বাঁকানো গঠনকেও "খুলে" ফেলতে পারে, অনেকটা গুটানো একটা কাগজকে টেনে সমান করার মতো।

## PCA: একই জিনিসের দুটো দৃষ্টিভঙ্গি

খুঁটিনাটিতে যাওয়ার আগে ধারণাটা পেতে এই পাঁচ মিনিটের StatQuest video-টা দেখুন:

{{video:HMOI_lkzW08}}

**Principal component analysis** নতুন কিছু অক্ষ খুঁজে বের করে, যাদের বলে **principal component (PC)**; এরা একে অপরের সঙ্গে orthogonal (লম্ব) এবং গুরুত্ব অনুযায়ী সাজানো। প্রথম কয়েকটা PC রেখে বাকিগুলো বাদ দিলে data সংকুচিত হয়, আর তাতে তথ্য হারায় যতটা সম্ভব কম।

:::story পেনসিল
একটা পেনসিল শূন্যে ধরুন। এর প্রতিটা বিন্দুর তিনটা coordinate আছে (x, y, z), কিন্তু পেনসিলটা কি সত্যিই ত্রিমাত্রিক? এর আকৃতির প্রায় পুরোটাই ধরা যায় **একটা** সংখ্যা দিয়ে: পেনসিলের দৈর্ঘ্য বরাবর বিন্দুটা কতদূরে আছে। পেনসিলের ঠিক মাঝখান দিয়ে একটা নতুন অক্ষ টানুন, প্রতিটা বিন্দুকে তার ওপর project করুন, ব্যস: সবচেয়ে গুরুত্বপূর্ণ তথ্যটা রেখেই আপনি 3 dimension থেকে 1-এ নেমে এলেন।

PCA এই ধরনের অক্ষ নিজে থেকেই খুঁজে বের করে। Gene-expression data-য় এই "পেনসিল" হলো সেই দিক, যে দিক বরাবর sample-গুলোর পার্থক্য সবচেয়ে বেশি; প্রায়ই সেটা একটা আসল জৈবিক signal, যেমন tumour বনাম স্বাভাবিক।
:::

"যতটা সম্ভব কম তথ্য হারানো" কথাটার দুটো সমতুল্য অর্থ আছে। প্রথম কয়েকটা PC-র ওপর data project করলে:
1. project করা data-র **variance সর্বোচ্চ হয়** (বিন্দুগুলো যতটা সম্ভব ছড়িয়ে থাকে), অথবা সমানভাবে বলা যায়,
2. **reconstruction error সর্বনিম্ন হয়** (প্রতিটা বিন্দু আর তার projection-এর মধ্যে গড় squared distance)।

**এই দুটো একই কেন?** Centered data-র ক্ষেত্রে প্রতিটা বিন্দুর origin থেকে squared distance দুটো পরস্পর লম্ব অংশে ভাগ হয়ে যায় (Pythagoras): subspace বরাবর অংশ, আর subspace-এর লম্ব অংশ। মোটটা স্থির, তাই প্রথম অংশকে সর্বোচ্চ করা আর দ্বিতীয় অংশকে সর্বনিম্ন করা একই কথা।

**দুটো gene দিয়ে বোঝা যাক।** দুটো gene যদি জোরালোভাবে correlated হয়, তাহলে sample-গুলো একটা কোনাকুনি রেখা বরাবর লম্বাটে একটা মেঘের মতো ছড়িয়ে থাকে। PC1 হলো সেই কোনাকুনি রেখা, PC2 তার লম্ব। প্রতিটা sample-কে শুধু PC1 বরাবর তার অবস্থান দিয়ে বর্ণনা করলেই দুটো gene-এর বেশিরভাগ তথ্য ধরা পড়ে যায়।

{{widget:pca}}

## Eigen-decomposition দিয়ে PCA

পুরো derivation-টা আছে এই StatQuest video-তে, gene-expression-এর উদাহরণ দিয়ে। এই অংশটা পড়ার সময় পাশাপাশি দেখুন।

{{video:FgakZw6K1QQ}}

**Algorithm:**
1. Data-কে **center** করুন: প্রতিটা sample থেকে mean $\bar{x}$ বিয়োগ করুন, এতে origin সরে যায় মেঘটার ঠিক মাঝখানে।
2. $X = [x_1-\bar{x}, \dots, x_m-\bar{x}]$ বানান, আর তা থেকে **covariance matrix** $Q = XX^\top$ (একটা 1/(m − 1) গুণক বাদে)। Q বর্গাকার, symmetric এবং positive semi-definite। এটা বিশাল হতে পারে: n gene হলে n × n।
3. Q-এর **eigenvector আর eigenvalue** বের করুন: $Q\vec{v} = \lambda\vec{v}$। যে eigenvector-এর **eigenvalue সবচেয়ে বড়**, সেটাই সর্বোচ্চ variance-এর দিক, অর্থাৎ **PC1**; তার পরেরটা **PC2**, যা PC1-এর লম্ব; এভাবে চলতে থাকে।
4. **PCA theorem:** eigenvector basis-এ প্রতিটা centered বিন্দুকে লেখা যায় $x_j = \bar{x} + \sum_{i} g_{ji}\, e_i$ আকারে। Gene-গুলো জোরালোভাবে correlated হলে ছোট-eigenvalue দিকগুলো বরাবর বেশিরভাগ coefficient $g_{ji}$ প্রায় 0, তাই শুধু ওপরের কয়েকটা component রাখলে খুব কম তথ্য হারায়।
5. PC i যতটা variance ব্যাখ্যা করে, তার ভগ্নাংশ (**fraction of variance explained**) হলো $\lambda_i / \sum_j \lambda_j$। এই ভগ্নাংশগুলো বড় থেকে ছোট ক্রমে plot করলে পাওয়া যায় **scree plot**; plot-টা সমতল হয়ে যাওয়ার আগ পর্যন্ত component-গুলো রাখুন।

{{ref:math#vectors-matrices-and-covariance|math#eigenvectors-and-eigenvalues}}

**হাতে-কলমে উদাহরণ।** চারটা sample-এ মাপা দুটো gene: A = (2, 4, 6, 8) আর B = (1, 3, 2, 6)। এদের covariance matrix (Math foundation-এ হিসাব করা হয়েছে) হলো

$$Q = \begin{pmatrix} 6.67 & 4.67 \\ 4.67 & 4.67 \end{pmatrix}$$

2×2 matrix-এর formula $\lambda = \frac{a+d}{2} \pm \sqrt{\left(\frac{a-d}{2}\right)^2 + b^2} = 5.67 \pm \sqrt{1 + 21.8}$ ব্যবহার করলে eigenvalue দুটো হয় **λ₁ ≈ 10.44** আর **λ₂ ≈ 0.89**। PC1 একাই variance-এর 10.44/11.33 ≈ **92%** ব্যাখ্যা করে। এর দিক মোটামুটি (0.78, 0.63): দুটো gene একসঙ্গে বাড়ে, যা তাদের উঁচু correlation-এর সঙ্গে মেলে। প্রতি sample-এ একটা সংখ্যা (PC1 score) দিয়েই প্রায় সবকিছু ধরা যায়।

{{widget:eigen}}

Eigenvector এখনও যদি বিমূর্ত লাগে, তাহলে $A\vec v = \lambda \vec v$ জ্যামিতিকভাবে কী বোঝায়, তার সবচেয়ে ভালো দৃশ্যমান ব্যাখ্যা এটা:

{{video:PFDu9oVAE-g}}

**বাস্তবে** PCA হিসাব করা হয় centered data matrix-এর **singular value decomposition (SVD)** দিয়ে; এটা সংখ্যাগতভাবে বেশি stable, আর বিশাল matrix Q কখনো বানাতেই হয় না। scRNA-seq-এর standard pipeline-এ প্রথমে PCA দিয়ে প্রায় 50টা component-এ নামানো হয়, তারপর সেই 50টার ওপর clustering আর t-SNE/UMAP চালানো হয়; এতে noise কমে আর সবকিছু দ্রুত হয়।

:::think PC1 আর PC2 মিলে variance-এর মাত্র 15% ব্যাখ্যা করে। PCA plot-টা কি বিশ্বাস করা যায়?
সাবধান থাকুন। Plot-টা variation-এর মাত্র 15% দেখাচ্ছে, বাকি 85% এতে অদৃশ্য। Data-র গঠন অনেকগুলো দিকে ছড়ানো, তাই plot-এ যে দলগুলো মিশে আছে মনে হচ্ছে, সেগুলো পরের component-গুলোতে আলাদা হয়ে যেতে পারে, আর যে দলগুলো দেখা যাচ্ছে সেগুলোও দুর্বল হতে পারে। Scree plot দেখুন, আরও component দেখুন, অথবা visualization-এর জন্য একটা non-linear পদ্ধতি চেষ্টা করুন।
:::

:::think PC1 সুস্থ আর cancer sample আলাদা করছে। কোন gene-গুলো এই পার্থক্যের পেছনে, PCA কি তা বলতে পারে?
হ্যাঁ। প্রতিটা principal component হলো মূল gene-গুলোর একটা weighted যোগফল, আর এই weight-গুলোকে বলে **loading**। PC1-এ যেসব gene-এর loading-এর পরম মান বড়, তারাই দল দুটোকে আলাদা করা দিকটায় সবচেয়ে বেশি অবদান রাখে, তাই পরবর্তী অনুসন্ধানের জন্য তারা ভালো প্রার্থী (এবং একটা যথাযথ differential-expression test দিয়ে মিলিয়ে দেখার জন্যও)।
:::

:::think কয়টা component রাখা উচিত?
দুটো প্রচলিত নিয়ম: (1) scree plot-এর **elbow** (কনুইয়ের মতো বাঁক), যেখানে আরেকটা component যোগ করলে আর তেমন variance বাড়ে না; (2) একটা **cumulative-variance threshold**: PC যোগ করতে থাকুন যতক্ষণ না তারা মিলে variance-এর ধরুন 80–90% ব্যাখ্যা করে। Plot করার জন্য রাখা হয় 2 বা 3টা; clustering-এর input হিসেবে (যেমন single-cell বিশ্লেষণে) প্রায়ই রাখা হয় 10–50টা।
:::

## Distance রক্ষা বনাম neighbourhood রক্ষা

PCA সবচেয়ে বড় variance-এর দিকগুলো ধরে রাখে। আরেকটা ভিন্ন লক্ষ্য হতে পারে: বিন্দুগুলোকে 2-D-তে এমনভাবে বসানো যাতে তাদের **জোড়ায় জোড়ায় distance** মূল distance-এর সঙ্গে যতটা সম্ভব মেলে।

**Metric MDS** (multidimensional scaling) কম-dimension-এর বিন্দু $y_i$ এমনভাবে বাছে যাতে মূল distance $d_X$ আর map-এর distance $d_Y$-এর মধ্যে অমিল, অর্থাৎ **stress**, সবচেয়ে কম হয়:

$$C = \frac{1}{a}\sum_{ij} w_{ij}\big(d_X(x_i,x_j) - d_Y(y_i,y_j)\big)^2$$

সমস্যাটা হলো: high dimension-এ **বড় distance-গুলো নির্ভরযোগ্য নয়** (হাজার হাজার gene জুড়ে noise জমতে থাকে), আর 2-D-তে এগুলো হুবহু ফুটিয়ে তোলাও কঠিন। Cluster খুঁজে বের করার জন্য আমাদের সবচেয়ে বেশি দরকার **কে কার কাছে আছে**, বড় distance-এর নিখুঁত মান নয়।

:::story দুই ধরনের মানচিত্র
- **MDS** এমন মানচিত্র আঁকে যা **distance** রক্ষা করে: দুটো শহর 100 km দূরে হলে মানচিত্রে তারা 10 cm দূরে থাকবে, আর প্রতিটা জোড়াই গুরুত্বপূর্ণ।
- **SNE** এমন মানচিত্র আঁকে যা **neighbourhood (প্রতিবেশ)** রক্ষা করে: শহর B যদি শহর A-র সবচেয়ে কাছের প্রতিবেশী হয়, তাহলে মানচিত্রেও সে A-র সবচেয়ে কাছের প্রতিবেশী থাকবে, মাপ নিখুঁত না হলেও। অনেক দূরের জোড়াগুলো প্রায় গোনাতেই ধরা হয় না।

Cluster খোঁজার জন্য (cell type, একসঙ্গে expressed gene-এর দল) সাধারণত neighbourhood-এর মানচিত্রটাই আপনার দরকার, কারণ হাজার হাজার dimension-এ বড় distance-গুলো এমনিতেই বেশিরভাগ noise।
:::

**Probability হিসেবে neighbourhood।** একটা *hard* neighbourhood বলে "j হয় i-এর প্রতিবেশী, নয়তো নয়"। একটা *soft* neighbourhood প্রতিটা বিন্দু j-কে i-এর প্রতিবেশী হিসেবে বাছা পড়ার একটা **probability** দেয়, যা distance বাড়লে কমে; এর জন্য i-কে কেন্দ্র করে একটা Gaussian ব্যবহার করা হয়:

$$p_{j|i} = \frac{\exp(-\|x_i - x_j\|^2 / 2\sigma_i^2)}{\sum_{k \neq i}\exp(-\|x_i - x_k\|^2 / 2\sigma_i^2)}$$

হর (denominator) normalize করে, তাই প্রতিটা i-এর জন্য সব j জুড়ে probability-গুলোর যোগফল 1। (Slide-এ সরলতার জন্য $2\sigma_i^2$ বাদ দেওয়া হয়েছে।) একই formula map-এর বিন্দু $y$-এর ওপর প্রয়োগ করলে পাওয়া যায় $q_{j|i}$, অর্থাৎ map-এ প্রতিবেশী হওয়ার probability।

{{ref:math#probability-basics|math#distances-and-similarity}}

## SNE আর KL divergence

**Stochastic Neighbor Embedding (Hinton & Roweis, 2002)** map-এ বিন্দুগুলোর অবস্থান এমনভাবে বাছে যাতে map-এর neighbourhood-গুলো মূলগুলোর সঙ্গে মেলে। অমিলটা মাপা হয় প্রতিটা বিন্দুর প্রতিবেশী-distribution-এর **Kullback–Leibler divergence** দিয়ে, সব বিন্দু জুড়ে যোগ করে:

$$C = \sum_i \mathrm{KL}(P_i \,\|\, Q_i) = \sum_i\sum_j p_{j|i}\log\frac{p_{j|i}}{q_{j|i}}$$

- KL **কখনো ঋণাত্মক হয় না**, আর **শুধু দুটো distribution সমান হলেই শূন্য হয়**। এটা মাপে গড় "বিস্ময়": যে জিনিসগুলো আসলে P অনুসরণ করে, সেগুলো Q অনুসরণ করবে বলে আশা করলে কতটা অবাক হতে হয় (relative entropy)।
- C সর্বনিম্ন করা হয় **gradient descent** দিয়ে: map-এ random অবস্থান $y$ দিয়ে শুরু করুন, তারপর বারবার প্রতিটা বিন্দুকে $-\partial C/\partial y_i$ বরাবর একটু করে সরান। সহজ করে ভাবলে, প্রতিটা বিন্দু **আকর্ষণ আর বিকর্ষণ বল** অনুভব করে: আসল প্রতিবেশীরা কাছে টানে, আর যাদের প্রতিবেশী হওয়ার কথা নয় তারা দূরে ঠেলে দেয়। পরের অংশের StatQuest t-SNE video ঠিক এই জিনিসটাই একটা 1-D রেখার ওপর animation করে দেখিয়েছে।

{{ref:math#kl-divergence|math#derivatives-gradients-and-the-chain-rule}}

{{widget:kl}}

এই পাঁচ মিনিটের video KL-এর ধারণা তৈরি করে, বিশেষ করে এটা কেন asymmetric (দুই দিকে সমান নয়), যা পরের বক্সটা বোঝার চাবিকাঠি:

{{video:SxGYPqCgJWM}}

:::example KL-এর asymmetry SNE-কে কীভাবে সাহায্য করে?
$\mathrm{KL}(P\|Q) \neq \mathrm{KL}(Q\|P)$। একটা মাত্র পদ $p\log(p/q)$ দেখুন:
- দুটো বিন্দু **high-D-তে প্রতিবেশী** (p বড়) কিন্তু **map-এ দূরে বসানো** (q ছোট): পদটা **বড়**, অর্থাৎ কড়া শাস্তি।
- দুটো বিন্দু **high-D-তে দূরে** (p খুব ছোট) কিন্তু **map-এ কাছে বসানো** (q তুলনায় বড়): পদটা **ছোট**, কারণ সেটা খুব ছোট p দিয়ে গুণ হচ্ছে।

তাই SNE মনোযোগ দেয় **local neighbourhood রক্ষা করায়**, যা cell type-এর মতো cluster প্রকাশ করার জন্য আমাদের ঠিক দরকার, আর সঠিক global distance নিয়ে খুব একটা মাথা ঘামায় না। পার্শ্বপ্রতিক্রিয়া: global জ্যামিতি (cluster-গুলোর মধ্যে distance, cluster-এর আকার) বিশ্বস্ত থাকে না, আর map-এ Gaussian ব্যবহার করলে মাঝারি দূরত্বের অনেক বিন্দু একসঙ্গে চেপে যায় (crowding problem, পরের অংশে)।
:::

## Crowding problem আর t-SNE

t-SNE-এর ওপর StatQuest video-টা দেখুন; course-এর t-SNE slide-গুলো এটার ওপর ভিত্তি করেই বানানো।

{{video:NEaUSP4YerM}}

**Crowding problem।** High dimension-এ একটা বিন্দুর অনেক প্রতিবেশী থাকতে পারে, যারা সবাই মোটামুটি একই মাঝারি দূরত্বে (10-D-তে এমন 11টা বিন্দু রাখা যায় যারা সবাই একে অপর থেকে সমান দূরে; 2-D-তে মাত্র 3টা)। একটা 2-D map-এ তাদের সবাইকে ওই দূরত্বে রাখার মতো **জায়গাই নেই**। ফলে SNE মাঝারি দূরত্বের বিন্দুগুলোকে বেশি কাছে বসিয়ে ফেলে, আর সবকিছু map-এর মাঝখানে ভিড় করে।

**t-SNE (van der Maaten & Hinton, 2008)** দুটো পরিবর্তন দিয়ে এটা ঠিক করে:
1. **Map-এ heavy-tailed distribution।** কম-dimension-এর map-এ Gaussian-এর বদলে এক degree of freedom-এর Student-t distribution (অর্থাৎ Cauchy distribution) ব্যবহার করুন:
$$q_{ij} = \frac{(1 + \|y_i - y_j\|^2)^{-1}}{\sum_{k\neq l}(1 + \|y_k - y_l\|^2)^{-1}}$$
এই probability distance বাড়লে ধীরে ধীরে কমে, তাই মাঝারি দূরত্বের বিন্দুগুলোকে বড় শাস্তি ছাড়াই map-এ **অনেক দূরে** বসানো যায়। Cluster-গুলো পরিষ্কারভাবে আলাদা হয়, মাঝখানের ভিড়ও থেমে যায়।
2. **Symmetric probability** $p_{ij} = (p_{j|i} + p_{i|j})/2n$, যা সরল এবং ভালোভাবে আচরণ করা gradient দেয়।

**Perplexity।** প্রতিটা বিন্দুর Gaussian-এর প্রস্থ $\sigma_i$ binary search দিয়ে এমনভাবে বাছা হয় যাতে কার্যকর প্রতিবেশীর সংখ্যা, $2^{H(P_i)}$ (যেখানে H হলো $P_i$-এর entropy), আপনার ঠিক করে দেওয়া একটা মানের সমান হয়, সাধারণত 5–50। ঘন অঞ্চলের বিন্দুগুলো পায় ছোট σ; পাতলা অঞ্চলের বিন্দুগুলো পায় বড় σ। Perplexity হলো t-SNE-এর প্রধান নিয়ন্ত্রণ-চাবি।

{{ref:math#entropy}}

{{widget:tsne}}

:::warn t-SNE plot ঠিকভাবে পড়া
- **Cluster-এর আকার আর cluster-গুলোর মধ্যের দূরত্ব অর্থবহ নয়।** Plot-এ দুটো cluster অনেক দূরে থাকলেই যে তারা কাছাকাছি থাকা দুটো cluster-এর চেয়ে বেশি আলাদা, তা নয়।
- আলাদা run বা আলাদা perplexity-তে plot দেখতে ভিন্ন হতে পারে, আর random seed-ও প্রভাব ফেলে।
- খুব কম perplexity ভুয়া sub-cluster তৈরি করতে পারে।
- নতুন বিন্দু বসানোর কোনো সহজ উপায় t-SNE-এর নেই; এটা visualization-এর জন্য, feature তৈরির জন্য নয়।
- **UMAP** (McInnes et al., 2018) দ্রুততর এবং global গঠন কিছুটা বেশি ধরে রাখে; single-cell tool-গুলোতে (Scanpy, Seurat) এটাই default, আর একই সতর্কতা এখানেও খাটে।
:::

## সারসংক্ষেপ

| | PCA | MDS | t-SNE |
|---|---|---|---|
| ধরন | linear | distance রক্ষাকারী | neighbourhood রক্ষাকারী, non-linear |
| উদ্দেশ্য (objective) | variance সর্বোচ্চ / reconstruction error সর্বনিম্ন | distance-এর ওপর stress | KL(P‖Q), heavy-tailed Q |
| Global গঠন | টিকে থাকে | টিকে থাকে | বিশ্বস্ত নয় |
| Local cluster | ঝাপসা হতে পারে | ঝাপসা হতে পারে | খুব পরিষ্কার |
| Deterministic | হ্যাঁ | হ্যাঁ (classical MDS) | না (random initialization) |
| সাধারণ ব্যবহার | preprocessing, প্রথম নজর, variance explained | একটা distance matrix visualize করা | cluster visualize করা, যেমন cell type |

:::think আপনার কাছে 1 million cell × 50 feature আছে, আর একটা classifier-এর input চাই। PCA না t-SNE?
**PCA।** এটা দশ লাখ বিন্দুতেও চলে, deterministic, আর একটা সত্যিকারের **transformation** দেয়: আপনি সেটা সংরক্ষণ করে পরে নতুন sample-এর ওপর হুবহু একই projection প্রয়োগ করতে পারেন, যা একটা classifier pipeline-এর দরকার। t-SNE অনেক বেশি বিন্দুতে ধীর, প্রতিবার চালালে আলাদা layout দেয়, আর পুরো optimization আবার না চালিয়ে নতুন কোনো বিন্দু বসানোর উপায় নেই। এটা visualization tool, feature extractor নয়।
:::
