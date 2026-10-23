An expression dataset may have 20,000 genes, which means every sample (or cell) is a point in 20,000-dimensional space. We can't look at 20,000 dimensions, and distances in such spaces behave strangely. **Dimensionality reduction (DR)** finds a low-dimensional representation that keeps the structure we care about. We use it for **visualization** (2-D plots), **compression**, **denoising**, and as a **preprocessing** step before clustering or supervised learning. This lesson covers PCA, the classic linear method, and t-SNE, the non-linear method behind most single-cell plots.

## Choosing an estimator & the DR zoo

Before modelling, decide what you are trying to do (the scikit-learn "choosing the right estimator" map in the slides):
- predicting a **category**, with labelled data → **classification**;
- predicting a **quantity** → **regression**;
- no labels, looking for groups → **clustering**;
- no labels, just looking at or compressing the data → **dimensionality reduction**.

Well-known DR methods (slides): PCA, principal component regression (PCR), partial least squares (PLSR), **multidimensional scaling (MDS)**, projection pursuit, and linear/mixture discriminant analysis (LDA/MDA, which use labels, so they are supervised).

| Linear | Non-linear (manifold learning) |
|---|---|
| **PCA** | Isomap, LLE, Hessian eigenmaps, spectral embedding, MDS, **t-SNE** (and **UMAP**, today's default for single-cell data) |

A **linear** method finds a flat subspace (a line, a plane) and projects the data onto it. A **non-linear** method can "unroll" curved structure, like flattening a rolled-up sheet of paper.

## PCA: two equivalent views

Watch this five-minute StatQuest video to get the intuition before the details:

{{video:HMOI_lkzW08}}

**Principal component analysis** finds new axes, called **principal components (PCs)**, that are orthogonal to each other and ordered by importance. Keeping the first few PCs and dropping the rest compresses the data with as little loss as possible.

"As little loss as possible" has two equivalent meanings. Projecting the data onto the first few PCs:
1. **maximizes the variance** of the projected data (the points stay as spread out as possible), or equivalently
2. **minimizes the reconstruction error** (the average squared distance between each point and its projection).

**Why are these the same?** For centered data, each point's squared distance from the origin splits into two perpendicular parts (Pythagoras): the part along the subspace and the part perpendicular to it. The total is fixed, so maximizing the first part is the same as minimizing the second.

**Intuition with two genes.** If two genes are strongly correlated, the samples form an elongated cloud along a diagonal line. PC1 is that diagonal, PC2 is perpendicular to it. Describing each sample by its position along PC1 alone captures most of the information in both genes.

{{widget:pca}}

## PCA by eigen-decomposition

The full derivation is in this StatQuest video, using gene-expression examples. Watch it alongside this section.

{{video:FgakZw6K1QQ}}

**The algorithm:**
1. **Center** the data: subtract the mean $\bar{x}$ from each sample, which moves the origin to the middle of the cloud.
2. Form $X = [x_1-\bar{x}, \dots, x_m-\bar{x}]$ and the **covariance matrix** $Q = XX^\top$ (up to a factor 1/(m − 1)). Q is square, symmetric and positive semi-definite. It can be huge: n × n for n genes.
3. Find the **eigenvectors and eigenvalues** of Q: $Q\vec{v} = \lambda\vec{v}$. The eigenvector with the **largest eigenvalue** is the direction of maximum variance, **PC1**; the next is **PC2**, orthogonal to PC1; and so on.
4. **PCA theorem:** each centered point can be written as $x_j = \bar{x} + \sum_{i} g_{ji}\, e_i$ in the eigenvector basis. If genes are highly correlated, most coefficients $g_{ji}$ along small-eigenvalue directions are near 0, so keeping only the top few components loses little.
5. The **fraction of variance explained** by PC i is $\lambda_i / \sum_j \lambda_j$. Plotting these fractions in decreasing order is a **scree plot**; you keep the components before it flattens out.

{{ref:math#vectors-matrices-and-covariance|math#eigenvectors-and-eigenvalues}}

**Worked example.** Two genes measured in four samples: A = (2, 4, 6, 8) and B = (1, 3, 2, 6). Their covariance matrix (computed in the Math foundation) is

$$Q = \begin{pmatrix} 6.67 & 4.67 \\ 4.67 & 4.67 \end{pmatrix}$$

Using the 2×2 formula $\lambda = \frac{a+d}{2} \pm \sqrt{\left(\frac{a-d}{2}\right)^2 + b^2} = 5.67 \pm \sqrt{1 + 21.8}$, the eigenvalues are **λ₁ ≈ 10.44** and **λ₂ ≈ 0.89**. PC1 explains 10.44/11.33 ≈ **92%** of the variance. Its direction is about (0.78, 0.63): both genes increase together, which matches their high correlation. One number per sample (the PC1 score) captures almost everything.

{{widget:eigen}}

If eigenvectors still feel abstract, this is the best visual explanation of what $A\vec v = \lambda \vec v$ means geometrically:

{{video:PFDu9oVAE-g}}

**In practice** PCA is computed with the **singular value decomposition (SVD)** of the centered data matrix, which is numerically more stable and never has to form the huge matrix Q. In scRNA-seq, the standard pipeline runs PCA down to about 50 components first, then does clustering and t-SNE/UMAP on those 50, which removes noise and speeds everything up.

## Preserving distances vs preserving neighborhoods

PCA keeps the directions of largest variance. A different goal is to place points in 2-D so that their **pairwise distances** match the original ones as closely as possible.

**Metric MDS** (multidimensional scaling) chooses low-dimensional points $y_i$ to minimize the mismatch, or **stress**, between original distances $d_X$ and map distances $d_Y$:

$$C = \frac{1}{a}\sum_{ij} w_{ij}\big(d_X(x_i,x_j) - d_Y(y_i,y_j)\big)^2$$

The problem: in high dimensions, **large distances are unreliable** (noise accumulates over thousands of genes) and hard to reproduce in 2-D. For revealing clusters, we care most about **who is near whom**, not about exact large distances.

**Neighbourhoods as probabilities.** A *hard* neighbourhood says "j is a neighbour of i, or not". A *soft* neighbourhood gives each point j a **probability** of being picked as i's neighbour, which decreases with distance, using a Gaussian centred on i:

$$p_{j|i} = \frac{\exp(-\|x_i - x_j\|^2 / 2\sigma_i^2)}{\sum_{k \neq i}\exp(-\|x_i - x_k\|^2 / 2\sigma_i^2)}$$

The denominator normalizes, so for each i the probabilities over all j sum to 1. (The slides drop the $2\sigma_i^2$ for simplicity.) The same formula applied to the map points $y$ gives $q_{j|i}$, the neighbour probabilities in the map.

{{ref:math#probability-basics|math#distances-and-similarity}}

## SNE and KL divergence

**Stochastic Neighbor Embedding (Hinton & Roweis, 2002)** chooses map positions so that the map's neighbourhoods match the original ones. It measures mismatch with the **Kullback–Leibler divergence** of each point's neighbour distribution, summed over points:

$$C = \sum_i \mathrm{KL}(P_i \,\|\, Q_i) = \sum_i\sum_j p_{j|i}\log\frac{p_{j|i}}{q_{j|i}}$$

- KL is **non-negative** and **zero only if the two distributions are equal**. It measures the average "surprise" when items that really follow P were expected to follow Q (relative entropy).
- C is minimized by **gradient descent**: start with random map positions $y$, then repeatedly move each point a little along $-\partial C/\partial y_i$. Intuitively, every point feels **attractive and repulsive forces**: true neighbours are pulled together, and points that shouldn't be neighbours are pushed apart. The StatQuest t-SNE video in the next section animates exactly this on a 1-D line.

{{ref:math#kl-divergence|math#derivatives-gradients-and-the-chain-rule}}

{{widget:kl}}

This five-minute video builds intuition for KL and, in particular, for why it is asymmetric, which is the key to the next box:

{{video:SxGYPqCgJWM}}

:::example How does KL's asymmetry help SNE?
$\mathrm{KL}(P\|Q) \neq \mathrm{KL}(Q\|P)$. Look at a single term $p\log(p/q)$:
- Two points are **neighbours in high-D** (large p) but placed **far apart in the map** (small q): the term is **large**, a heavy penalty.
- Two points are **far apart in high-D** (tiny p) but placed **close in the map** (larger q): the term is **small**, because it is weighted by the tiny p.

So SNE concentrates on **preserving local neighbourhoods**, which is what we want for revealing clusters such as cell types, and pays little attention to exact global distances. Side effects: global geometry (distances between clusters, cluster sizes) is not faithful, and with a Gaussian in the map, many moderately distant points get squashed together (the crowding problem, next).
:::

## The crowding problem and t-SNE

Watch the StatQuest video on t-SNE; the course's t-SNE slides are based on it.

{{video:NEaUSP4YerM}}

**The crowding problem.** In high dimensions, a point can have many neighbours all at about the same moderate distance (in 10-D you can fit 11 points all equally far from each other; in 2-D only 3). A 2-D map **doesn't have room** to keep all of them at that distance. SNE ends up placing moderately distant points too close, and everything crowds into the middle of the map.

**t-SNE (van der Maaten & Hinton, 2008)** fixes this with two changes:
1. **A heavy-tailed distribution in the map.** In the low-dimensional map, use a Student-t distribution with one degree of freedom (a Cauchy distribution) instead of a Gaussian:
$$q_{ij} = \frac{(1 + \|y_i - y_j\|^2)^{-1}}{\sum_{k\neq l}(1 + \|y_k - y_l\|^2)^{-1}}$$
This probability falls off slowly with distance, so moderately distant points can be placed **far apart** in the map without a big penalty. Clusters separate cleanly and the centre stops crowding.
2. **Symmetric probabilities** $p_{ij} = (p_{j|i} + p_{i|j})/2n$, which give simpler, better-behaved gradients.

**Perplexity.** Each point's Gaussian width $\sigma_i$ is chosen by binary search so that the effective number of neighbours, $2^{H(P_i)}$ (where H is the entropy of $P_i$), equals a value you set, typically 5–50. Points in dense regions get small σ; points in sparse regions get large σ. Perplexity is the main knob of t-SNE.

{{ref:math#entropy}}

{{widget:tsne}}

:::warn Reading t-SNE plots correctly
- **Cluster sizes and the distances between clusters are not meaningful.** Two clusters far apart on the plot are not necessarily more different than two close ones.
- Different runs or perplexities can look different, and random seeds matter.
- Very low perplexity can create fake sub-clusters.
- t-SNE has no simple way to place new points; it is for visualization, not for producing features.
- **UMAP** (McInnes et al., 2018) is faster and keeps somewhat more global structure; it is the default in single-cell tools (Scanpy, Seurat), and the same cautions apply.
:::

## Summary

| | PCA | MDS | t-SNE |
|---|---|---|---|
| Type | linear | distance-preserving | neighbourhood-preserving, non-linear |
| Objective | maximize variance / minimize reconstruction error | stress on distances | KL(P‖Q), heavy-tailed Q |
| Global structure | kept | kept | not faithful |
| Local clusters | may blur | may blur | very clear |
| Deterministic | yes | yes (classical MDS) | no (random initialization) |
| Typical use | preprocessing, first look, variance explained | visualizing a distance matrix | visualizing clusters, e.g., cell types |
