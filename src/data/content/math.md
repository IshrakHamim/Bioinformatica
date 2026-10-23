The course quietly assumes probability, information theory and some linear algebra. This module collects exactly the math you need, with the bioinformatics use of each idea.

## Probability essentials

- **Independence:** $\Pr(A \cap B) = \Pr(A)\Pr(B)$. Profile probabilities multiply column probabilities, which assumes positions are independent.
- **Conditional probability:** $\Pr(A\mid B) = \Pr(A\cap B)/\Pr(B)$. HMM emissions $\Pr(x_t\mid \pi_t)$ and transitions $\Pr(\pi_{t+1}\mid\pi_t)$ are conditionals.
- **Bayes' rule:** $\Pr(H\mid D) = \dfrac{\Pr(D\mid H)\Pr(H)}{\Pr(D)}$, used for posterior decoding in HMMs and for posterior class probabilities.
- **Law of total probability:** $\Pr(D) = \sum_H \Pr(D\mid H)\Pr(H)$. The Forward algorithm sums over all hidden paths.
- **Expected value:** $E[X] = \sum x\Pr(x)$. E.g., expected count of T at a position with Pr(T) = 0.8 across 10 sequences is 8.
- **Sampling from a discrete distribution:** normalize weights to sum to 1, draw u ~ Uniform(0,1), and pick the first item whose cumulative weight exceeds u. That is Gibbs sampling's “biased die”.

**Likelihood and log-odds.** For data D and models M₁, M₂: the **likelihood ratio** $\Pr(D\mid M_1)/\Pr(D\mid M_2)$; take $\log_2$ for a **log-odds score** (> 0 favors M₁). Logs turn products into sums and prevent **underflow**.

## Information theory: entropy and KL

**Entropy** of a distribution (bits):
$$H(p) = -\sum_i p_i\log_2 p_i$$
Maximum $\log_2 N$ when uniform (2 bits for DNA); 0 when deterministic. In motifs, low entropy = conserved column.

{{widget:entropy}}

**Kullback–Leibler divergence** (relative entropy):
$$\mathrm{KL}(P\,\|\,Q) = \sum_i p_i \log\frac{p_i}{q_i} \;\ge\; 0$$
It equals 0 iff P = Q and is **not symmetric**. It is used in SNE/t-SNE, VAEs, and motif scoring against a background (relative entropy).

{{widget:kl}}

## Linear algebra for PCA

- Data as an **n × d matrix** (rows = samples, columns = genes). **Center** by subtracting column means.
- **Covariance matrix** $\Sigma = \frac{1}{n-1}X_c^\top X_c$: symmetric, positive semi-definite. The diagonal holds variances; off-diagonal entries are covariances.
- **Eigenvectors:** $\Sigma\mathbf{v} = \lambda\mathbf{v}$. For symmetric Σ they are orthogonal; λ is the variance along $\mathbf{v}$.
- For a 2×2 symmetric matrix $\begin{pmatrix}a & b\\ b & d\end{pmatrix}$: $\lambda = \frac{a+d}{2} \pm \sqrt{\left(\frac{a-d}{2}\right)^2 + b^2}$.
- **SVD** $X_c = U S V^\top$: columns of V are principal axes, and $S^2/(n-1)$ are the eigenvalues.

{{widget:eigen}}

{{yt:PFDu9oVAE-g|Eigenvectors and eigenvalues (3Blue1Brown)}}

## Distances and similarity

| Measure | Formula | Used for |
|---|---|---|
| Hamming | # mismatches (equal length) | motifs, approximate matching |
| Edit (Levenshtein) | min # substitutions + indels | read mapping, alignment |
| Euclidean | $\sqrt{\sum (x_i-y_i)^2}$ | k-means, KNN |
| Pearson correlation distance | $1 - r(x, y)$ | expression profiles (shape, not level) |
| Cosine similarity | $\frac{x\cdot y}{\|x\|\|y\|}$ | embeddings (dna2vec) |
| Tree/path distance | sum of edge lengths | phylogeny |

## Optimization and calculus

- **Derivative = slope**; at a minimum it is zero. **Gradient** = vector of partial derivatives; it points uphill.
- **Gradient descent:** $w \leftarrow w - \alpha\nabla e(w)$. Learning rate α trades speed for stability.
- **Chain rule** (→ backpropagation): $\frac{d}{dx}f(g(x)) = f'(g(x))\,g'(x)$. Example: $\sigma'(z) = \sigma(z)(1-\sigma(z))$.
- **Local vs global optima:** greedy, randomized motif search, k-means, EM and Baum–Welch all find *local* optima, so restarts matter.

## Combinatorics you'll need

- Number of k-mers over {A,C,G,T}: $4^k$. Number of k-mer positions in a length-n string: $n - k + 1$.
- Codons: $4^3 = 64$. Amino-acid k-mers: $20^k$.
- Paths in an HMM: $|Q|^n$, which is why we use DP.
- Rooted binary trees on n labelled leaves: $(2n-3)!! = 1\cdot3\cdot5\cdots(2n-3)$, which explodes quickly (why large parsimony is hard).
