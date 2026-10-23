An expression dataset may have 20,000 genes (dimensions) per sample or cell. We can't see 20,000-D space, and distances there behave strangely. **Dimensionality reduction (DR)** finds a low-dimensional representation that keeps the structure we care about, for **visualization**, **compression**, **denoising** and as a **preprocessing** step before clustering or supervised learning.

## Choosing an estimator & the DR zoo

Before modelling, decide what you want (the scikit-learn “choosing the right estimator” map from the slides): predicting a **category** with labels → classification; a **quantity** → regression; no labels → clustering; just looking/reducing → dimensionality reduction.

Well-known DR methods (slides): PCA, principal component regression (PCR), partial least squares (PLSR), **multidimensional scaling (MDS)**, projection pursuit, linear/mixture discriminant analysis (LDA/MDA, which are supervised).

| Linear | Non-linear (manifold learning) |
|---|---|
| **PCA** | Isomap, LLE, Hessian eigenmaps, spectral embedding, MDS, **t-SNE** (and **UMAP**, the modern default for single-cell) |

## PCA: two equivalent views

PCA finds orthogonal directions (**principal components**) such that projecting onto the first few:
1. **maximizes the variance** of the projected data, or equivalently
2. **minimizes the reconstruction error** (mean squared distance between points and their projections).

They are equivalent because, for centered data, total variance = variance captured + residual error (Pythagoras).

{{widget:pca}}

## PCA by eigen-decomposition

1. Center the data: subtract the mean $\bar{x}$ from each sample (translate the origin to the mean).
2. Form $X = [x_1-\bar{x}, \dots, x_m-\bar{x}]$ and the **covariance matrix** $Q = XX^\top$ (up to a factor 1/(m − 1)). Q is square, symmetric and positive semi-definite, and it can be huge (n × n for n genes).
3. Find eigenvectors and eigenvalues: $Q\vec{v} = \lambda\vec{v}$. The eigenvector with the **largest eigenvalue** is the direction of maximum variance (**PC1**); the next is PC2, orthogonal to PC1, and so on.
4. **PCA theorem:** each centered point can be written as $x_j = \bar{x} + \sum_{i} g_{ji}\, e_i$ in the eigenbasis. If the genes are highly correlated, most coefficients $g_{ji}$ for small-eigenvalue directions are near 0, so keeping the top few components loses little.
5. Variance explained by PC i = $\lambda_i / \sum_j \lambda_j$ (scree plot).

{{widget:eigen}}

In practice PCA is computed with the **SVD** of the centered data matrix (numerically stable, and no need to form Q). For scRNA-seq, the standard pipeline runs PCA to ~50 components first, then clustering and t-SNE/UMAP on those.

## Preserving distances vs preserving neighborhoods

**Metric MDS** places low-dimensional points $y_i$ to preserve pairwise distances:
$$C = \frac{1}{a}\sum_{ij} w_{ij}\big(d_X(x_i,x_j) - d_Y(y_i,y_j)\big)^2$$
But in high dimensions, large distances are unreliable and hard to fit, and we often care most about **who is near whom**.

**Neighborhoods.** A *hard* neighborhood says “j is a neighbor of i or not”; a *soft* neighborhood gives each j a **probability** of being picked as i's neighbor:
$$p_{j|i} = \frac{\exp(-\|x_i - x_j\|^2 / 2\sigma_i^2)}{\sum_{k \neq i}\exp(-\|x_i - x_k\|^2 / 2\sigma_i^2)}$$
(the slides drop $2\sigma_i^2$ for simplicity). The same formula in the output space gives $q_{j|i}$ from the $y$'s.

## SNE and KL divergence

**Stochastic Neighbor Embedding (Hinton & Roweis, 2002)** makes the output neighborhoods match the input neighborhoods by minimizing the **Kullback–Leibler divergence**:
$$C = \sum_i \mathrm{KL}(P_i \,\|\, Q_i) = \sum_i\sum_j p_{j|i}\log\frac{p_{j|i}}{q_{j|i}}$$

- KL is **non-negative** and **0 iff the distributions are equal**; it measures the “surprise” when items from the first distribution were expected to follow the second (relative entropy).
- Minimized by **gradient descent**: start from random $y$'s and repeatedly move each point along $-\partial C/\partial y_i$. Intuitively, points feel **attractive and repulsive forces** that pull true neighbors together and push others apart. The StatQuest t-SNE deck animates exactly this on a 1-D line.

{{widget:kl}}

:::exam Mid 4(b): how does KL's asymmetry help SNE?
$\mathrm{KL}(P\|Q) \neq \mathrm{KL}(Q\|P)$. In $\sum p\log(p/q)$:
- If two points are **neighbors in high-D** (large p) but placed **far apart in the map** (small q), the term is **large**, a heavy penalty.
- If two points are **far apart in high-D** (tiny p) but placed **close in the map** (larger q), the term is **small** (it is weighted by the tiny p).

So SNE focuses its effort on **preserving local neighborhoods**, which is what we want for revealing clusters such as cell types, and it pays little attention to exact global distances. Side effects: global geometry (distances between clusters, cluster sizes) is not faithful, and with the Gaussian in the output space, many moderately distant points get squashed together (the crowding problem below).
:::

## The crowding problem and t-SNE

In high dimensions a point can have many equidistant neighbors. In 2-D there is **not enough room** near a point for all of them. SNE ends up pushing moderately distant points too close, so everything crowds into the center of the map.

**t-SNE (van der Maaten & Hinton, 2008)** fixes this with two changes:
1. **Heavy-tailed output distribution:** use a Student-t with one degree of freedom (Cauchy) in the low-D map:
$$q_{ij} = \frac{(1 + \|y_i - y_j\|^2)^{-1}}{\sum_{k\neq l}(1 + \|y_k - y_l\|^2)^{-1}}$$
The probability falls off slowly, so moderately distant points can sit **far apart** in the map without a big penalty. Clusters separate cleanly and the center does not crowd.
2. **Symmetric probabilities** $p_{ij} = (p_{j|i} + p_{i|j})/2n$, which give simpler, better-behaved gradients.

**Perplexity** sets each $\sigma_i$ by binary search so that the effective number of neighbors $2^{H(P_i)}$ equals a user value (typically 5–50). Dense regions get small σ, sparse regions large σ.

{{widget:tsne}}

:::warn Reading t-SNE plots correctly
- **Cluster sizes and distances between clusters are not meaningful.**
- Different runs or perplexities can look different; random seeds matter.
- Very low perplexity creates fake sub-clusters.
- t-SNE has no simple “transform” for new points; it is for visualization, not as features.
- **UMAP** (McInnes et al., 2018) is faster and keeps somewhat more global structure; it is the default in single-cell tools (Scanpy, Seurat).
:::

## Summary

| | PCA | MDS | t-SNE |
|---|---|---|---|
| Type | linear | distance-preserving | neighborhood-preserving, non-linear |
| Objective | max variance / min reconstruction | stress on distances | KL(P‖Q), heavy-tailed Q |
| Global structure | kept | kept | not faithful |
| Local clusters | may blur | may blur | very clear |
| Deterministic | yes | yes (classical) | no (random init) |
