The course lessons quietly assume some probability, information theory, linear algebra, calculus and statistics. This module teaches exactly that math, from scratch, and each idea comes with the place in bioinformatics where you will meet it.

:::tip You do not have to read this first
Every course lesson has **🧱 Stuck? Quick refresher** links next to the steps that use this math. Clicking one opens the matching section below right inside the lesson. Read this module straight through only if you want a full warm-up.
:::

## Probability basics

A **probability** is a number between 0 and 1 attached to an **event**: 0 means impossible, 1 means certain. The set of all possible outcomes is the **sample space**. For one DNA position it is {A, C, G, T}.

A **probability distribution** assigns a probability to every outcome, and the probabilities **sum to 1**. A distribution for one DNA position might be

| A | C | G | T |
|---|---|---|---|
| 0.1 | 0.4 | 0.4 | 0.1 |

This is a GC-rich position. You will see exactly this kind of table as a column of a **motif profile** (Regulatory Motifs lesson) and as a row of an **emission matrix** (HMM lesson). The rule "each column, or each row, sums to 1" is just the statement that it is a distribution.

Three rules cover almost everything:

1. **Complement:** $\Pr(\text{not } A) = 1 - \Pr(A)$. If a base call is wrong with probability 0.001, it is right with probability 0.999.
2. **Or, for mutually exclusive events:** $\Pr(A \text{ or } B) = \Pr(A) + \Pr(B)$. The probability that a position is a purine (A or G) in the table above is 0.1 + 0.4 = 0.5.
3. **And, for independent events:** $\Pr(A \text{ and } B) = \Pr(A)\Pr(B)$ (next section).

**Discrete vs continuous.** DNA letters, codons and k-mers are *discrete* outcomes, so we add probabilities. Measurements like expression levels are *continuous*: then we use a **density** (such as the Gaussian bell curve) and probabilities are areas under it. In this course almost everything is discrete.

## Conditional probability and independence

$\Pr(A \mid B)$, read "probability of A **given** B", is the probability of A once you know B happened:

$$\Pr(A \mid B) = \frac{\Pr(A \text{ and } B)}{\Pr(B)}$$

Think of it as shrinking the world to the cases where B is true and asking what fraction of those also have A.

**Example.** In a genome, suppose 40% of positions are C or G, and 1% of positions are the start of a CG dinucleotide. Then, given that a position is C, the chance that the next base is G is $\Pr(\text{next is G} \mid \text{C})$. Vertebrate genomes have far fewer CG pairs than you would expect from their C and G content, so this conditional probability is low. That fact is the whole basis of **CpG island** detection in the HMM lesson.

**Independence** means knowing B tells you nothing about A: $\Pr(A \mid B) = \Pr(A)$, and equivalently $\Pr(A \text{ and } B) = \Pr(A)\Pr(B)$.

The independence assumption is everywhere in the course, so it is worth seeing exactly where:

- **Profile probability of a k-mer.** The probability of `ACG` under a motif profile is $\Pr(A \text{ in col 1}) \cdot \Pr(C \text{ in col 2}) \cdot \Pr(G \text{ in col 3})$. Multiplying assumes the columns are independent.
- **Probability of a coin-flip sequence.** $\Pr(HHT) = 0.5 \cdot 0.5 \cdot 0.5$ for a fair coin, because flips are independent.
- **HMMs** relax independence slightly: the hidden state at position t depends on the state at t − 1 (the *Markov property*), and each emitted letter depends only on its own state. Those are conditional probabilities: transitions $\Pr(\pi_t \mid \pi_{t-1})$ and emissions $\Pr(x_t \mid \pi_t)$.

:::warn Independence is a modelling choice
Real DNA positions are not independent (neighbouring bases in a binding site interact). Models assume independence because it makes the math and the computation tractable. When a method fails, an independence assumption is often the reason.
:::

## Bayes' rule

Bayes' rule turns a conditional probability around. If you know how likely the data are under a hypothesis, it tells you how likely the hypothesis is given the data:

$$\Pr(H \mid D) = \frac{\Pr(D \mid H)\,\Pr(H)}{\Pr(D)}$$

- $\Pr(H)$ is the **prior**: what you believed before seeing data.
- $\Pr(D \mid H)$ is the **likelihood**: how well hypothesis H explains data D.
- $\Pr(H \mid D)$ is the **posterior**: what you believe after seeing data.
- $\Pr(D)$ normalizes everything so the posteriors sum to 1. By the **law of total probability**, $\Pr(D) = \sum_H \Pr(D \mid H)\Pr(H)$: add up the ways the data could have arisen.

**Worked example: the dishonest casino.** A casino uses a fair coin (P(H) = 0.5) or a biased coin (P(H) = 0.75), each with prior 0.5. You see three heads, HHH.

- Likelihoods: $\Pr(HHH \mid \text{fair}) = 0.5^3 = 0.125$ and $\Pr(HHH \mid \text{biased}) = 0.75^3 \approx 0.422$.
- Evidence: $\Pr(HHH) = 0.125 \cdot 0.5 + 0.422 \cdot 0.5 \approx 0.273$.
- Posterior: $\Pr(\text{biased} \mid HHH) = 0.422 \cdot 0.5 / 0.273 \approx$ **0.77**.

Three heads moved your belief from 50% to 77% that the coin is biased. The HMM lesson does the same calculation at every position of a sequence (posterior decoding), and the Forward algorithm is how it computes $\Pr(D)$ efficiently.

{{video:kqSzLo9fenk}}

## Expected value and sampling from a distribution

The **expected value** is the probability-weighted average outcome:

$$E[X] = \sum_x x \cdot \Pr(X = x)$$

If position 3 of a motif is T with probability 0.8, then across 10 sequences you expect $10 \times 0.8 = 8$ T's. Expected values also give the "expected by chance" counts that make a pattern look surprising (oriC lesson) and the expected counts that Baum–Welch uses to re-estimate HMM parameters.

**Sampling.** Randomized algorithms (Gibbs sampling, k-means++) need to *draw* an outcome according to a distribution. The recipe:

1. If you have **weights** rather than probabilities, divide each by their sum so they add to 1 (**normalize**).
2. Draw a uniform random number u between 0 and 1.
3. Walk through the outcomes adding up probabilities; choose the first outcome where the running total exceeds u.

**Example.** Three k-mers have weights 0.004, 0.001 and 0.003. Their sum is 0.008, so the normalized probabilities are 0.5, 0.125 and 0.375, and the running totals are 0.5, 0.625, 1.0. If u = 0.55, the second k-mer is chosen; if u = 0.9, the third.

This "roll a biased die" step is exactly what the Gibbs sampler does when it picks a new motif, and why the k-mer probabilities do not need to sum to 1 before normalizing.

## Logarithms, likelihood and log-odds

You will see logarithms constantly, for three reasons.

**1. Logs turn products into sums.** $\log(ab) = \log a + \log b$. The probability of a long sequence is a product of thousands of small numbers; its log is a sum, which is easy to add up in a DP table.

**2. Logs prevent underflow.** A computer's double-precision numbers cannot go below about $10^{-308}$. The probability of a specific 1,000-letter DNA string under a uniform model is $0.25^{1000} \approx 10^{-602}$, which a computer rounds to 0. Its log is $1000 \cdot \log_2 0.25 = -2000$, a perfectly ordinary number. Viterbi on a genome is only possible in log space.

**3. Logs measure on a ratio scale.** Useful facts:

| Fact | Example |
|---|---|
| $\log_2 2^k = k$ | $\log_2 8 = 3$ |
| $\log_2 (1/2) = -1$ | a probability of 0.25 is −2 bits |
| $\log_{10} 10^{-3} = -3$ | used for Phred scores: Q = −10·log₁₀(0.001) = 30 |
| $\log(a/b) = \log a - \log b$ | ratios become differences |
| logs are increasing | the k that maximizes a probability also maximizes its log |

The last row is why algorithms can maximize log-probabilities instead of probabilities and get the same answer.

**Likelihood.** For fixed data D, the likelihood of a model M is $\Pr(D \mid M)$. Comparing two models by the **likelihood ratio** $\Pr(D \mid M_1) / \Pr(D \mid M_2)$ asks which explains the data better.

**Log-odds score.** Take $\log_2$ of the ratio. Positive means M₁ is favoured, negative means M₂, and zero means no preference. For the flips HHTTTTH: $\Pr(\cdot \mid \text{fair}) = 0.5^7 \approx 0.0078$ and $\Pr(\cdot \mid \text{biased}) = 0.75^3 \cdot 0.25^4 \approx 0.0016$, so the log-odds is $\log_2(0.0078/0.0016) \approx 2.25 > 0$: the fair coin wins. Substitution matrices like BLOSUM62 are tables of log-odds scores ("how much more often do these two amino acids align in real proteins than by chance?").

## Entropy

Entropy measures **uncertainty**, in bits:

$$H(p) = -\sum_i p_i \log_2 p_i \qquad (\text{with } 0 \log 0 = 0)$$

Intuition: it is the average number of yes/no questions you need to guess the outcome.

- A uniform DNA position (¼ each) has H = 2 bits: you need two questions ("purine or pyrimidine?", then "which one?").
- A position that is always G has H = 0: no question needed.
- (½, ¼, ¼, 0) has $H = -(0.5\log_2 0.5 + 2 \cdot 0.25 \log_2 0.25) = 0.5 + 1 = 1.5$ bits.

For an alphabet of N letters, entropy ranges from 0 (certain) to $\log_2 N$ (uniform): 2 bits for DNA, about 4.32 bits for the 20 amino acids.

**Where you'll use it.** In motif finding, a **conserved** column has low entropy. The **information content** of a column, $2 - H$ for DNA, is the height of the letter stack in a **sequence logo**. Perplexity in t-SNE is $2^{H}$, the "effective number of neighbours".

{{widget:entropy}}

## KL divergence

The **Kullback–Leibler divergence** measures how different distribution P is from a reference distribution Q:

$$\mathrm{KL}(P\,\|\,Q) = \sum_i p_i \log\frac{p_i}{q_i}$$

Read it as: "if outcomes really follow P but I expected Q, how surprised am I on average?"

Properties you need:

- $\mathrm{KL}(P\|Q) \ge 0$, and it equals 0 only when P = Q.
- It is **not symmetric**. With P = (0.5, 0.5) and Q = (0.9, 0.1): $\mathrm{KL}(P\|Q) \approx 0.74$ bits but $\mathrm{KL}(Q\|P) \approx 0.53$ bits.
- A term is large when $p_i$ is large but $q_i$ is small (an outcome that happens often but was expected rarely). When $p_i$ is tiny the term barely counts, whatever $q_i$ is.

That last property is the reason **SNE and t-SNE preserve local neighbourhoods** (Dimensionality Reduction lesson): putting true neighbours far apart is punished heavily, putting non-neighbours close is punished lightly. KL also appears as the **relative entropy** of a motif against background DNA, and as the regularizer in a **VAE**.

{{widget:kl}}

{{video:SxGYPqCgJWM}}

## Vectors, matrices and covariance

**Data as a matrix.** Expression data are an **n × d matrix**: one row per sample (or cell), one column per gene. Row i is a point in d-dimensional space; that is all "a sample is a vector" means.

**Mean and centering.** The mean of a column is that gene's average expression. **Centering** subtracts each column's mean so the cloud of points sits around the origin. PCA always starts by centering.

**Variance** measures spread of one variable: the average squared deviation from the mean, $\mathrm{var}(x) = \frac{1}{n-1}\sum_i (x_i - \bar x)^2$.

**Covariance** measures whether two variables move together:

$$\mathrm{cov}(x, y) = \frac{1}{n-1}\sum_i (x_i - \bar x)(y_i - \bar y)$$

Positive: when one is above its mean, the other tends to be too. Negative: they move in opposite directions. Near zero: no linear relationship.

**Worked example.** Gene A = (2, 4, 6, 8) and gene B = (1, 3, 2, 6) across four samples. The means are 5 and 3, so the deviations are (−3, −1, 1, 3) and (−2, 0, −1, 3).
- cov(A, B) = (6 + 0 − 1 + 9)/3 ≈ 4.67
- var(A) = (9 + 1 + 1 + 9)/3 ≈ 6.67, var(B) = (4 + 0 + 1 + 9)/3 ≈ 4.67
- **Correlation** = cov/(sd_A · sd_B) ≈ 4.67/√(6.67 · 4.67) ≈ **0.84**: strongly co-expressed.

The **covariance matrix** Σ collects every pairwise covariance, with variances on the diagonal. For centered data X it is $\Sigma = \frac{1}{n-1}X^\top X$. It is always **symmetric** (cov(x, y) = cov(y, x)) and positive semi-definite. PCA is entirely about this matrix.

{{video:qtaqvPAeEJY}}

## Eigenvectors and eigenvalues

Multiplying a vector by a matrix usually changes its direction. An **eigenvector** v of a matrix A is special: A only stretches it, by a factor λ called the **eigenvalue**:

$$A\mathbf{v} = \lambda\mathbf{v}$$

**Example.** For $A = \begin{pmatrix}2 & 1\\ 1 & 2\end{pmatrix}$, the vector (1, 1) maps to (3, 3), so it is an eigenvector with λ = 3. The vector (1, −1) maps to (1, −1), with λ = 1.

For a 2×2 symmetric matrix $\begin{pmatrix}a & b\\ b & d\end{pmatrix}$ the eigenvalues have a closed form:

$$\lambda = \frac{a+d}{2} \pm \sqrt{\left(\frac{a-d}{2}\right)^2 + b^2}$$

Check with the example: $2 \pm \sqrt{0 + 1} = 3$ or 1. ✓

**Why PCA cares.** For a **covariance matrix**:
- the eigenvectors are the directions of the data cloud's axes, and they are **orthogonal** (because Σ is symmetric);
- each eigenvalue is the **variance of the data along its eigenvector**.

So the eigenvector with the largest eigenvalue is the direction in which the data spread the most: **PC1**. The fraction of variance PC1 explains is $\lambda_1/\sum_j \lambda_j$.

**SVD** is the numerically stable way to get the same answer: for centered data $X = USV^\top$, the columns of V are the principal axes and $S^2/(n-1)$ are the eigenvalues of the covariance matrix.

{{widget:eigen}}

{{video:PFDu9oVAE-g}}

## Distances and similarity

Clustering, nearest neighbours, motif search and tree building all need a notion of "how far apart are these two things?" Choosing the distance is part of modelling.

| Measure | Definition | Example | Used for |
|---|---|---|---|
| Hamming | number of positions that differ (equal lengths) | CGAAT vs CGGAC → 2 | motifs, approximate matching |
| Edit (Levenshtein) | fewest substitutions, insertions and deletions | GCAT vs GAT → 1 | read mapping, alignment |
| Euclidean | $\sqrt{\sum_i (x_i - y_i)^2}$ | (0,0) to (3,4) → 5 | k-means, KNN, PCA |
| Pearson correlation distance | $1 - r(x, y)$ | (1,2,3) vs (10,20,30) → 0 | expression profiles |
| Cosine similarity | $\dfrac{x \cdot y}{\|x\|\,\|y\|}$ | (1,0,1) vs (1,1,0) → 0.5 | embeddings (dna2vec) |
| Tree (path) distance | sum of edge lengths between two leaves | | phylogeny |

**Shape vs level.** Gene profiles (1, 2, 3) and (10, 20, 30) are far apart in Euclidean distance (about 33.7) but have correlation 1: they rise and fall together, just at different levels. If you want to group genes that are *co-regulated*, correlation distance usually makes more sense. If you want to group samples by absolute expression, Euclidean on log-transformed data is typical.

A proper **metric** is non-negative, zero only for identical items, symmetric, and satisfies the **triangle inequality** $d(x, z) \le d(x, y) + d(y, z)$. Phylogeny's distance matrices are required to satisfy these.

## Derivatives, gradients and the chain rule

**Derivative = slope.** For a function e(w), the derivative $e'(w)$ says how fast e changes when w changes a little. At a minimum (the bottom of a valley) the slope is 0.

**Example.** $e(w) = (w - 3)^2$ has derivative $e'(w) = 2(w - 3)$. At w = 0 the slope is −6: the function goes *down* as w increases, so to reduce e we should increase w.

**Gradient descent** follows that logic repeatedly:

$$w \leftarrow w - \alpha \, e'(w)$$

With learning rate α = 0.1, starting at w = 0: w becomes 0 − 0.1·(−6) = 0.6, then 0.6 − 0.1·(−4.8) = 1.08, and so on toward 3. Steps get smaller as the slope flattens near the minimum. If α is too large the steps overshoot and can diverge; if too small, progress is slow.

**Partial derivatives and the gradient.** With many parameters $w_1, \dots, w_n$, the partial derivative $\partial e/\partial w_j$ is the slope when only $w_j$ changes. The **gradient** $\nabla e$ is the vector of all of them; it points uphill, so gradient descent steps in the opposite direction.

**Chain rule.** For a composition $f(g(x))$:

$$\frac{d}{dx} f(g(x)) = f'(g(x)) \cdot g'(x)$$

A neural network is a long chain of functions, and **backpropagation** is the chain rule applied layer by layer from the output backwards. A useful derivative: the sigmoid $\sigma(z) = 1/(1 + e^{-z})$ has $\sigma'(z) = \sigma(z)(1 - \sigma(z))$.

**Local vs global optima.** Many objectives have several valleys. Gradient descent, k-means, EM, Baum–Welch and randomized motif search all stop at the bottom of *a* valley, not necessarily the deepest one. That is why these algorithms are run from several random starts.

## Counting: how big is the search space?

Counting tells you whether brute force is possible. Before designing an algorithm, count what it would have to try.

- **k-mers over DNA:** $4^k$ possible strings. $4^9 = 262{,}144$; $4^{20} \approx 10^{12}$.
- **k-mer positions in a string of length n:** $n - k + 1$ (the window can start at positions 0 to n − k).
- **Codons:** $4^3 = 64$ for 20 amino acids plus stop signals.
- **Protein k-mers:** $20^k$.
- **Hidden state paths** in an HMM with |Q| states over n positions: $|Q|^n$. With 2 states and 100 positions that is $2^{100} \approx 10^{30}$, which is why Viterbi uses DP.
- **Global alignments** of two length-n sequences: more than $\binom{2n}{n} \approx 4^n/\sqrt{\pi n}$.
- **Rooted binary trees** on n labelled leaves: $(2n-3)!! = 1 \cdot 3 \cdot 5 \cdots (2n-3)$. For 10 species that is already 34,459,425 trees.

When the count is exponential, brute force is out, and you look for dynamic programming, a clever reformulation, or a heuristic (Algorithms foundation).

## Statistical significance and multiple testing

When a method reports "this k-mer is over-represented" or "these genes are enriched for immune response", you need to ask: could this have happened by chance?

**Null hypothesis and p-value.** The **null hypothesis** is the boring explanation ("the gene list is a random sample"). The **p-value** is the probability of seeing a result at least this extreme *if the null were true*. A small p-value (conventionally < 0.05) suggests the boring explanation is unlikely. It is **not** the probability that the null is true.

**Multiple testing.** If you test 20,000 genes at p < 0.05, you expect about 20,000 × 0.05 = **1,000 false positives** even when nothing is going on. Corrections:
- **Bonferroni:** require p < 0.05/m (here 2.5 × 10⁻⁶). Very strict.
- **Benjamini–Hochberg (FDR):** controls the expected *fraction* of false discoveries among the results you report. This is the standard in genomics (DESeq2 "adjusted p-value", GO enrichment "q-value").

**Where you'll see this:**
- **GO enrichment** uses the hypergeometric (Fisher's exact) test: "my cluster has 40 genes, 12 are annotated 'immune response'; how likely is that if I drew 40 genes at random?" (Tools foundation).
- **BLAST E-values** are the expected number of hits this good by chance in a database of that size; E = 10⁻⁵⁰ means essentially impossible by chance.
- **Background models** in motif finding and oriC finding: "appears 3 times" is only surprising relative to what a random sequence would produce.
