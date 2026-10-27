Sequence, structure আর expression data-র জন্য neural network এখন সবচেয়ে প্রচলিত model। Lecture-এর মতোই এই lesson-এ আমরা একেবারে গোড়া থেকে এটা গড়ে তুলব: linear regression → gradient descent → logistic regression → neural network → autoencoder। তারপর এটাকে যুক্ত করব course folder-এর দুটো paper-এর সাথে: **dna2vec** আর **VAE-based imputation**। প্রতিটা ধাপ আগের ধাপের সাথে একটা করে নতুন ধারণা যোগ করে, তাই ক্রম মেনে পড়ুন।

## Regression এবং error function

**Regression**-এ আমরা একটা function $\hat{y} = f(\mathbf{x})$ শিখি, যার output একটা **continuous** সংখ্যা। স্লাইডের উদাহরণ: toxicity, inflammation, gram-staining, localization আর structure-এর মতো feature থেকে একটা protein-এর lowest-energy state predict করা।

**Simple linear regression** একটা feature আর একটা সরলরেখা ব্যবহার করে:

$$\hat{y} = w_0 + w_1 x_1$$

- $w_0$ হলো **intercept**: $x_1 = 0$ হলে prediction কত।
- $w_1$ হলো **slope**: $x_1$ 1 বাড়লে prediction কতটা বদলায়।

"শেখা" মানে $w_0$ আর $w_1$ এমনভাবে বাছা, যাতে prediction-গুলো আসল মানের কাছাকাছি হয়। এর জন্য এমন একটা সংখ্যা দরকার, যা বলে দেবে বর্তমান weight-গুলো কতটা ভুল: এটাই **error function** (বা loss)। m-টা training example-এর ওপর **squared error** হলো

$$e = \frac{1}{2}\sum_{i=1}^{m}\big(\hat{y}^{(i)} - y^{(i)}\big)^2 = \frac{1}{2}\sum_{i=1}^{m}\big(w_0 + w_1x_1^{(i)} - y^{(i)}\big)^2$$

বর্গ করার ফলে সব error ধনাত্মক হয়, আর বড় error ছোট error-এর চেয়ে বেশি শাস্তি পায়; ½ রাখা হয়েছে শুধু derivative-টা পরিচ্ছন্ন করার জন্য।

**উদাহরণ।** Data point (1, 2), (2, 4), (3, 6) (হুবহু y = 2x)। $w_0 = w_1 = 0$ হলে প্রতিটা prediction 0, error-গুলো −2, −4, −6, আর $e = \frac12(4 + 16 + 36) = 28$।

## Gradient descent

আগে এই StatQuest video-টা দেখুন: স্লাইডের derivation-টাই এখানে ধাপে ধাপে করে দেখানো হয়েছে।

{{video:sDv4f4s2SB8}}

**মূল ভাবনা।** Error e-কে weight-গুলোর ওপর বিছানো একটা ভূপ্রকৃতি হিসেবে ভাবুন। আমরা চাই সবচেয়ে নিচু বিন্দুটা। Minimum-এ slope (derivative) 0। যেকোনো জায়গা থেকে শুরু করে বারবার slope-এর উল্টো দিকে, অর্থাৎ **ঢাল বেয়ে নিচে**, পা ফেলুন:
- slope ঋণাত্মক হলে w বাড়ালে error কমে, তাই w বাড়ান;
- slope ধনাত্মক হলে w কমান;
- ঢাল যত খাড়া (minimum থেকে যত দূরে), পদক্ষেপ তত বড়।

:::story ঘন কুয়াশায় পাহাড় থেকে নামা
আপনি একটা পাহাড়ের ঢালে দাঁড়িয়ে, কুয়াশা এত ঘন যে শুধু পায়ের নিচের মাটিটুকু টের পাচ্ছেন, আর আপনাকে উপত্যকার তলায় পৌঁছাতে হবে। বুদ্ধিমানের কাজ হলো: মাটি কোন দিকে ঢালু টের পান, নিচের দিকে এক পা ফেলুন, আবার একই কাজ করুন। যেখানে ঢাল খাড়া, সেখানে বড় পা ফেলুন; মাটি যত সমান হয়ে আসে, পদক্ষেপ তত ছোট হয়, আর একসময় আপনি তলায় থিতু হন।

উচ্চতা হলো error, আপনার অবস্থান হলো weight-গুলো, পায়ে যে ঢাল টের পাচ্ছেন সেটা **gradient**, আর আপনার পায়ের মাপ হলো **learning rate α**। পা বেশি লম্বা ফেললে উপত্যকা পেরিয়ে উল্টো দিকের ঢালে গিয়ে পড়বেন, হয়তো আগের চেয়েও উঁচুতে। এটাকেই বলে divergence।
:::

**Learning rate α** পদক্ষেপের মাপ ঠিক করে:

$$w_j \leftarrow w_j - \alpha\,\frac{\partial e}{\partial w_j}$$

**Squared error-এর derivative।** Chain rule অনুযায়ী, কোনো weight-এর সাপেক্ষে $\frac12(\hat y - y)^2$-এর derivative হলো $(\hat y - y)$ গুণ ওই weight-এর সাপেক্ষে $\hat y$-এর derivative, যা $w_0$-এর জন্য 1 আর $w_j$-এর জন্য $x_j$:

$$\frac{\partial e}{\partial w_0} = \sum_i(\hat{y}^{(i)} - y^{(i)})\cdot 1, \qquad \frac{\partial e}{\partial w_j} = \sum_i(\hat{y}^{(i)} - y^{(i)})\,x_j^{(i)}$$

**আগের উদাহরণটা এগিয়ে নেওয়া যাক।** x = 1, 2, 3-এ error −2, −4, −6 হলে: $\partial e/\partial w_0 = -12$ আর $\partial e/\partial w_1 = -2 - 8 - 18 = -28$। α = 0.05 নিলে: $w_0 = 0 + 0.6 = 0.6$ আর $w_1 = 0 + 1.4 = 1.4$। নতুন prediction-গুলো 2.0, 3.4, 4.8, আর error 28 থেকে নেমে আসে **0.9**-এ। আরও ধাপ চালালে মান এগোতে থাকে $w_0 = 0$, $w_1 = 2$-এর দিকে।

{{ref:math#derivatives-gradients-and-the-chain-rule}}

একই সূত্র অনেক feature-এর ক্ষেত্রেও খাটে: $\hat{y} = w_0 + w_1x_1 + \dots + w_nx_n$, প্রতিটা weight-এর জন্য একটা করে partial derivative।

**α বাছাই।** খুব ছোট হলে: convergence খুব ধীর। খুব বড় হলে: পদক্ষেপ minimum পেরিয়ে যায়, এদিক-ওদিক লাফায়, এমনকি **diverge** করতে পারে (error বাড়তে থাকে)। Widget-এ দুটোই চেষ্টা করে দেখুন।

{{widget:gradient-descent}}

## Classification: logistic regression এবং sigmoid

এবার label হলো **binary**: একটা protein antiviral (1) কি না (0)? একটা **linear classifier** একটা weighted sum হিসাব করে দেখে বিন্দুটা একটা রেখার (বহু মাত্রায়, একটা hyperplane-এর) কোন পাশে পড়েছে:

$$f(\mathbf{x}) = w_0 + w_1x_1 + \dots + w_nx_n, \qquad \text{predict } 1 \text{ if } f(\mathbf{x}) > 0$$

এই নিয়মটা একটা **step function**: এটা হঠাৎ 0 থেকে 1-এ লাফ দেয়। এটা continuous নয়, differentiable-ও নয়, তাই gradient descent একে ব্যবহার করতে পারে না (লাফের জায়গাটা ছাড়া সব জায়গায় slope শূন্য)। এর বদলে নিই মসৃণ **sigmoid**:

$$\sigma(z) = \frac{1}{1+e^{-z}}, \qquad \sigma'(z) = \sigma(z)\,(1-\sigma(z))$$

- σ(0) = 0.5; z বড় ধনাত্মক হলে σ প্রায় 1, বড় ঋণাত্মক হলে σ প্রায় 0।
- Output 0 আর 1-এর মধ্যে থাকে, তাই একে label 1 হওয়ার **probability** হিসেবে পড়া যায়।
- Derivative-টা σ থেকেই সস্তায় হিসাব করা যায়।

$\hat y = \sigma(w_0 + w_1x_1 + \dots)$ model-টাই হলো **logistic regression**। (সহজ রাখার জন্য স্লাইডে squared error-ই রাখা হয়েছে। বাস্তবে logistic regression minimize করে **cross-entropy**, $-[y\log\hat y + (1-y)\log(1-\hat y)]$, যা আরও পরিচ্ছন্ন gradient দেয় এবং আত্মবিশ্বাসী ভুল উত্তরকে কঠোর শাস্তি দেয়।)

এই StatQuest video-টা logistic regression আর তার probability কীভাবে কাজ করে সেটা ব্যাখ্যা করে; network-এ যাওয়ার আগে ভালো একটা recap:

{{video:yIYKR4sgzI8}}

{{widget:sigmoid}}

## Neural network

**Logistic regression আসলে একটা মাত্র neuron**: একটা weighted sum, তারপর একটা non-linear "activation" (sigmoid)। **Neural network** এমন অনেকগুলো neuron-কে **layer**-এ সাজিয়ে জোড়ে, প্রতিটা layer পরেরটাকে input দেয়।

আগে 3Blue1Brown-এর এই video-টা দেখুন, layer, weight আর activation-এর একটা দৃশ্যমান পরিচয়:

{{video:aircAruvnKk}}

- **Input layer:** feature-গুলো।
- **Hidden layer:** প্রতিটা neuron আগের layer-এর output-গুলোর ওপর $\sigma(\mathbf{w}^\top\mathbf{x} + b)$ (বা ReLU, $\max(0, z)$) হিসাব করে। এগুলো **learned representation**: মাঝপথের feature, যা network নিজেই উদ্ভাবন করে নেয়।
- **Output layer:** prediction (binary classification-এর জন্য একটা sigmoid, multi-class-এর জন্য class-গুলোর ওপর একটা softmax, regression-এর জন্য একটা linear unit)।

**হাতে-কলমে একটা neuron।** Input x = (1, 2), weight w = (0.5, −0.25), bias b = 0.1: z = 0.5 − 0.5 + 0.1 = 0.1, output σ(0.1) ≈ 0.525। একটা network প্রতিটা neuron-এর জন্য, layer ধরে ধরে, এই কাজটাই করে (এটাকে বলে **forward pass**)।

**Training** তখনও একটা error function-এর ওপর gradient descent-ই। Network হলো function-এর একটা লম্বা শিকল, তাই প্রতিটা weight-এর সাপেক্ষে error-এর gradient হিসাব হয় **chain rule** দিয়ে, output layer থেকে পেছনের দিকে। এটাই **backpropagation**: এটা মোটামুটি একটা forward pass-এর সমান সময়েই সবগুলো gradient বের করে ফেলে।

এই video-টা দেখায় একটা network তার cost landscape-এর ওপর gradient descent চালিয়ে কীভাবে শেখে:

{{video:IHZwWFHWa-w}}

**চওড়া বনাম গভীর।** তত্ত্বগতভাবে একটা মাত্র, খুব চওড়া hidden layer যেকোনো function approximate করতে পারে, কিন্তু **deep** network (অনেক layer) hierarchical feature অনেক বেশি দক্ষভাবে শেখে: শুরুর layer-গুলো সরল pattern ধরে, পরের layer-গুলো সেগুলো জুড়ে জটিলতর কিছু বানায়। একটা DNA model-এ শুরুর filter-গুলো হয়তো ছোট motif ধরবে, আর পরের layer-গুলো ধরবে motif-এর সমন্বয়। Deep learning-এর মূল কথা এটাই।

:::think একটা neural network-এ non-linear activation আদৌ লাগে কেন?
এটা না থাকলে প্রতিটা layer আগের layer-এর একটা linear function হিসাব করে, আর linear function-এর শিকল জুড়লে সেটা **একটাই** linear function হয়ে দাঁড়ায়। Activation ছাড়া একটা 50-layer network sigmoid-ছাড়া logistic regression-এর চেয়ে বেশি শক্তিশালী নয়, অর্থাৎ শুধু একটা সরল boundary। Layer-গুলোর মাঝের non-linearity (sigmoid, ReLU)-ই স্তূপ করা layer-গুলোকে decision boundary বাঁকাতে আর feature থেকে নতুন feature গড়তে দেয়।
:::

**Bioinformatics-এ যেসব architecture দেখবেন:**
- **CNN** (convolutional network) শেখা filter-গুলো sequence বরাবর সরিয়ে সরিয়ে চালায়, অনেকটা motif scanner-এর মতো: DeepBind আর DeepSEA (2015)।
- **RNN/LSTM** sequence-কে এক ধাপ এক ধাপ করে process করে।
- **Graph neural network** কাজ করে molecule আর interaction network-এর ওপর।
- **Transformer** attention ব্যবহার করে প্রতিটা position-কে বাকি সব position-এর সাথে সম্পর্কিত করে: protein ও DNA language model, AlphaFold-এর Evoformer, Enformer, AlphaGenome।

## Autoencoder

**Autoencoder** এমন একটা network, যাকে **label ছাড়াই** train করা হয় নিজের input-টাই আবার তৈরি করতে। এর দুটো অংশ:
- একটা **encoder** $z = g(x)$, যা input-কে সংকুচিত করে একটা **code** z বানায়, আর
- একটা **decoder** $\hat{x} = h(z)$, যা code থেকে input-টা আবার গড়ে তোলে।

Training-এ reconstruction error $\|x - \hat{x}\|^2$ minimize করা হয়। Output-টা নিজে কোনো কাজের নয় (এটা তো input-এরই কপি); কাজের অংশটা হলো **code z**, data থেকে শেখা একটা সংক্ষিপ্ত representation।

:::story পুরো বই এক টুইটে, তারপর টুইট থেকে আবার বই
ধরুন আপনাকে একটা পুরো বই একটা ছোট্ট টুইটে সংকুচিত করতে হবে, আর আরেকজনকে শুধু আপনার টুইট দেখে বইটা আবার লিখতে হবে। সফল হতে হলে আপনি কেবল আসল জিনিসগুলোই রাখতে পারবেন: কাহিনি, প্রধান চরিত্র। আবার লেখা বইটা কখনোই মূল লক্ষ্য নয়; মূল জিনিস হলো **টুইটটা**। Autoencoder-এর encoder টুইটটা লেখে (code z), decoder বইটা আবার লেখে (reconstruction), আর code-টাই সেই সংক্ষিপ্ত representation, যা আমরা রেখে দিই এবং clustering, visualization, imputation বা classification-এ ব্যবহার করি।
:::

এই পাঁচ মিনিটের video-টা encoder–decoder ধারণাটা ব্যাখ্যা করে:

{{video:qiUEgSCyY5o}}

**তিন ধরনের autoencoder:**
- **Undercomplete:** code input-এর চেয়ে **ছোট** (একটা bottleneck), যা network-কে বাধ্য করে শুধু সবচেয়ে গুরুত্বপূর্ণ structure-টুকু রাখতে। এটা PCA-র একটা non-linear সাধারণীকরণ: squared loss-ওয়ালা একটা linear autoencoder ঠিক PCA-র মতো একই subspace শেখে।
- **Denoising:** input-কে নষ্ট করে দিন (noise যোগ করুন, বা কিছু মান mask করুন), আর network-কে train করুন **পরিষ্কার** input-টা ফিরিয়ে আনতে। এতে network robust feature শেখে, আর language model-এর masked pretraining-এর পেছনের ধারণাও এটাই।
- **Variational (VAE):** encoder একটা মাত্র বিন্দুর বদলে একটা **distribution** দেয় (প্রতিটা latent dimension-এর জন্য একটা mean আর একটা variance), আর decoder তার থেকে নেওয়া একটা sample থেকে reconstruct করে। Training-এ minimize করা হয় **reconstruction loss + KL divergence**, যেখানে KL মাপে latent distribution আর একটা standard Gaussian-এর পার্থক্য। KL term-টা latent space-কে মসৃণ ও continuous রাখে (কাছাকাছি code decode হয়ে কাছাকাছি data দেয়) এবং overfitting কমায়, ফলে আপনি latent space থেকে **sample** নিয়ে নতুন, বাস্তবসম্মত data তৈরি করতে পারেন।

{{ref:expression2#pca-by-eigen-decomposition|math#kl-divergence}}

এই video-টা VAE ব্যাখ্যা করে, reparameterization trick আর KL term সহ:

{{video:9zKuYvjFFS8}}

:::bio Course paper 1: VAE দিয়ে genomic data imputation (Qiu, Zheng & Gevaert, GigaScience 2020)
Transcriptome আর methylome data-তে missing value খুবই সাধারণ ব্যাপার। লেখকেরা সম্পূর্ণ data-র ওপর একটা VAE train করেছিলেন, আর বারবার reconstruct করে করে missing entry-গুলো impute করেছিলেন। বেশিরভাগ পরিস্থিতিতে VAE প্রচলিত পদ্ধতির (SVD- আর KNN-based imputation) **সমান বা তার চেয়ে ভালো** ফল দিয়েছে, আর **evaluation-এর সময় দ্রুততর** ছিল। যেসব data **not at random** হারিয়েছে, সেগুলোর জন্য তাঁরা data কীভাবে হারিয়েছে সে সম্পর্কে পূর্বজ্ঞান কাজে লাগিয়েছেন। তাঁরা এটাও দেখিয়েছেন, কেন VAE-র regularized latent space একটা সাধারণ deterministic autoencoder-এর চেয়ে ভালো impute করে।
:::

:::bio Course paper 2: dna2vec (Ng, 2017)
One-hot k-mer vector বিশাল (একটা 8-mer-এর জন্য লাগে 4⁸ = 65,536 dimension), আর যেকোনো দুটো k-mer-এর দূরত্ব সমান, যদিও ATGGC-এর তো CACGA-র চেয়ে ATGGG-এর বেশি কাছে থাকা উচিত। dna2vec human genome-এর ওপর পরিবর্তনশীল দৈর্ঘ্যের k-mer (3–8)-এর জন্য **word2vec-ধাঁচের embedding** (একটা অগভীর two-layer network) train করে। ফলাফল: embedding vector যোগ করা অনেকটা nucleotide **জোড়া লাগানোর (concatenation)** মতো আচরণ করে, আর embedding-গুলোর **cosine similarity** **Needleman–Wunsch** alignment score-এর সাথে correlated। এটা ছিল DNA-র জন্য representation learning-এর একটা প্রথম দিকের উদাহরণ, আজকের genomic language model-গুলোর পূর্বপুরুষ।
:::

## Neural network দিয়ে class imbalance সামলানো

আগের lesson-এর কথা মনে করুন: class imbalanced হলে একটা model বিরল class-টাকে উপেক্ষা করেও accurate দেখাতে পারে। 1,000টা cancer আর 100টা normal sample থাকলে সবসময় "cancer" predict করলেই 90.9% accuracy পাওয়া যায়।

{{ref:ml#step-6-testing-metrics-and-sampling|ml#step-1-2-formulate-and-collect}}

:::example 1000 cancer বনাম 100 normal sample সামলানোর পাঁচটা উপায়
1. **Class-weighted (cost-sensitive) loss:** প্রতিটা sample-এর loss-কে মোটামুটি N/(2·N_class) দিয়ে weight দিন, তাহলে বিরল normal class-এ ভুল করলে খরচ প্রায় 10 গুণ বেশি পড়বে। অথবা **focal loss** ব্যবহার করুন, যা সহজ example-গুলোর weight কমিয়ে দেয়।
2. **Mini-batch-এ re-sampling:** normal oversample করুন বা cancer undersample করুন, যাতে batch-গুলো balanced হয়; সাথে data **augmentation** যোগ করুন।
3. **Generative oversampling:** minority class-এর ওপর একটা **VAE (বা GAN)** train করে কৃত্রিম normal profile **sample** করুন (SMOTE-এর মতো, তবে শেখা একটা latent space-এ)।
4. **Anomaly-detection দৃষ্টিভঙ্গি:** শুধু majority class-এর ওপর একটা **autoencoder** train করুন; যেসব sample সেটা খারাপভাবে reconstruct করে (error বেশি), সেগুলোকে অন্য class হিসেবে চিহ্নিত করুন।
5. Validation data-র ওপর **decision threshold টিউন করুন**, আর accuracy-র বদলে **MCC, F1, balanced accuracy ও AUPR** report করুন।
:::

Class weight নিজে চেষ্টা করে দেখুন: imbalanced data-র ওপর একটা logistic regression train করুন, আর দেখুন weighting decision boundary-কে কী করে।

{{widget:logreg}}

## সারসংক্ষেপ

| ধারণা | মূল সূত্র / ভাবনা |
|---|---|
| Linear regression | ŷ = w₀ + Σ wⱼxⱼ, e = ½Σ(ŷ − y)² |
| Gradient descent | w ← w − α ∂e/∂w |
| Sigmoid | σ(z) = 1/(1 + e^{−z}), σ′ = σ(1 − σ) |
| Neural net | σ(Wx + b)-এর layer, backpropagation দিয়ে train করা |
| Autoencoder | ‖x − h(g(x))‖² minimize করা |
| VAE | reconstruction + KL(q(z\|x) ‖ N(0, I)) |
