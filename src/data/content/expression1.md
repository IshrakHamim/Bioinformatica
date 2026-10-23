**Biological question:** given expression measurements of thousands of genes across conditions, time points or cells, which genes behave alike, and which samples or cells are alike? Genes with similar expression profiles are often **co-regulated** (same transcription factor) and functionally related. This module follows Compeau & Pevzner Vol. 2, Ch. 8, plus the course's material on measurement technologies.

## Machine learning in one paragraph

Mitchell's definition (slides): a program **learns** from experience **E** with respect to tasks **T** and performance measure **P** if its performance at T, as measured by P, improves with E.

- **T:** classification, regression, clustering, anomaly detection, imputation, denoising, synthesis…
- **P:** accuracy, ARI (adjusted Rand index for clustering), MAE, R², PSNR…
- **E:** training data: sequences, structures, physico-chemical properties, gene counts…

**Supervised** learning has labels (Module 13). **Unsupervised** learning finds structure without labels: **clustering** (this module) and **dimensionality reduction** (next module).

## Measuring gene expression: microarrays, RNA-seq, single-cell

Proteins are hard to measure comprehensively, so we measure **mRNA abundance** as a proxy.

**DNA microarrays.** Short DNA **probes** for known genes are fixed on a chip. RNA from cells is reverse-transcribed into labelled **cDNA**, washed over the chip, and **hybridizes** to complementary probes; fluorescence intensity measures abundance. Limitations (slides): only **known transcripts** (you must design probes), cannot distinguish **isoforms** or read sequence, **cross-hybridization/background noise**, and **saturation** at high expression (limited dynamic range).

**RNA-seq.** Isolate RNA → reverse transcriptase makes cDNA → **sequence** it → map reads to a reference (or assemble) → count reads per gene. Digital counts, huge dynamic range, discovers novel transcripts, isoforms, fusions and allele-specific expression.

**Single-cell RNA-seq (scRNA-seq).** Bulk methods average over millions of cells. scRNA-seq isolates individual cells (e.g., in droplets with **barcoded beads**). Every cDNA from one cell carries the same **cell barcode**, plus a **UMI** (unique molecular identifier) to count molecules rather than PCR copies. After sequencing, reads are **demultiplexed by barcode** to know which cell they came from, giving a **genes × cells** count matrix used to discover **cell types and states**.

:::exam Exam answers in one table (Mid 1(a), Quiz 2)
| | Microarray | Bulk RNA-seq | scRNA-seq |
|---|---|---|---|
| Measurement | hybridization intensity to fixed probes | sequencing read counts | read/UMI counts **per cell** |
| What is detected | only pre-designed known transcripts | known + novel transcripts, isoforms, SNPs | same, per cell, but sparse (dropouts) |
| Resolution | average over tissue | average over tissue | individual cells (heterogeneity, rare types) |
| Dynamic range | limited (background, saturation) | wide, digital | wide but noisy, many zeros |
| Interpretation | relative intensities, compare conditions | differential expression | clustering into cell types, trajectories, t-SNE/UMAP |
| Which cell? | n/a | n/a | **cell barcodes** (+ UMIs) |
:::

**Do we need a reference genome for RNA-seq?** (Quiz 2C) Not strictly. If a reference genome/transcriptome exists, reads are aligned (splice-aware aligners like STAR, HISAT2) or pseudo-aligned (Salmon, kallisto) to it. That is fast and accurate, and it identifies genes and splicing. For organisms **without** a reference, reads can be **assembled de novo** into transcripts (e.g., Trinity) and quantified against that assembly.

**Data sources (slides):** NCBI **GEO** (microarray and sequencing), **SRA** (raw reads), **ArrayExpress** (EBI's counterpart), and homogenized resources like recount2/recount3, ARCHS4, Toil, MetaSRA. Example: Parkinson's disease microarray study GSE6613.

## The gene expression matrix

Measure n genes at m checkpoints → an **n × m expression matrix** E; row i is gene i's **expression vector**. Genes with similar vectors may be co-regulated; a new gene's vector resembling a known gene's suggests related function. Applications: before/after drug treatment, cancer vs normal tissue.

Expression values are often log-transformed (e.g., log₂ fold change) because expression is multiplicative and heavy-tailed.

**Clustering vs classification:** classification assigns new items to known classes; clustering groups similar items to *reveal* hidden structure. A good clustering has **homogeneity** (points within a cluster are close) and **separation** (clusters are far apart).

## k-means as an optimization problem

Instead of choosing clusters directly, choose **k centers**. The distance from a point v to a set of centers C is $d(v, C) = \min_i d(v, C_i)$.

**Squared error distortion:**
$$\text{Distortion}(Data, C) = \frac{1}{n}\sum_{v \in Data} d(v, C)^2$$

**k-Means Clustering Problem:** find k centers minimizing distortion. It is NP-hard in general (even for k = 2 in high dimensions), so we use a heuristic.

**Lloyd's algorithm:**
1. Choose k initial centers.
2. **Centers → clusters:** assign each point to its nearest center.
3. **Clusters → centers:** move each center to the **center of gravity** (mean) of its points.
4. Repeat until centers stop moving.

Each step can only decrease distortion, so it converges, but to a **local** minimum that depends on initialization.

{{widget:kmeans}}

**Limitations (slides):** may get stuck in local minima; depends on initialization; k must be chosen; assumes **spherical, similar-size** clusters; sensitive to outliers and noise; costly for huge data; Euclidean distances lose meaning in very high dimensions; no categorical data.

:::exam Quiz 2: why does k-means mix genes from distinct pathways, and what to do?
Reasons: (1) bad initialization → local optimum; (2) wrong k (too small forces distinct groups together); (3) non-spherical or unequal-variance clusters; (4) un-normalized data, where Euclidean distance is dominated by a few highly expressed genes or by overall level rather than shape; (5) outliers/noise; (6) hard assignment although genes participate in several pathways.
Fixes: **k-means++** or many restarts (keep the lowest distortion); choose k by elbow/silhouette/gap statistic; **standardize/log-transform**, or use **correlation distance**; remove/handle outliers (k-medoids); **soft clustering** (soft k-means/GMM) or hierarchical clustering; validate with known biology (GO enrichment).
:::

**Outliers** (Quiz 2C): the mean is not robust. A few points at [100,100] drag a center far away (or grab a whole cluster for themselves), distorting all clusters. Handle by removing/winsorizing outliers, log-transforming, using **k-medoids/k-medians**, or density-based methods (DBSCAN).

## Initialization and k-means++

**Initialization matters** (Quiz 2B). With centers [1,1], [10,10], [20,20] and data tightly grouped around [5,5], [15,15], [25,25], the first assignment puts the 5s with C1 and the 25s with C3, and splits the 15-group (it is equidistant from C2 and C3). The next update pulls C2 toward 15 and C3 toward ~20+, after which all 15s go to C2. So here it **does converge** to the right clusters, because the initial centers are spread out and in the right order. If instead two initial centers start inside the same true group, Lloyd can converge to a wrong local optimum that never recovers.

**k-means++ (Arthur & Vassilvitskii, 2007):**
1. Pick the first center uniformly at random from the data.
2. For each point x, compute D(x) = distance to the nearest chosen center.
3. Pick the next center with probability $\frac{D(x)^2}{\sum_y D(y)^2}$.
4. Repeat until k centers; then run Lloyd. It gives an O(log k)-approximation in expectation.

{{widget:kmeans-pp}}

:::exam Quiz 2C: points {2, 4, 10, 12, 20}, first center 2
D² = 0, 4, 64, 100, 324 (sum 492) → P(4) = 0.0081, P(10) = 0.1301, P(12) = 0.2033, **P(20) = 0.6585**.
Why might 12 be selected rather than 20? Selection is **random**, proportional to D²; 20 is the most likely but 12 has a 20% chance. Choosing 12 still spreads centers out (2 and 12), giving a better start than random initialization (which could pick 2 and 4, both in the same group). The randomness also stops k-means++ from always grabbing extreme outliers.
:::

## Soft k-means (EM clustering)

Hard assignment makes little sense for points midway between centers. **Soft k-means** gives each point a **responsibility** (fractional membership) for each cluster, which is an **expectation-maximization (EM)** algorithm:

- **E-step (centers → soft clusters):**
$$w_{ik} = \frac{e^{-\beta\,\|x_i - \mu_k\|^2}}{\sum_{j=1}^{K} e^{-\beta\,\|x_i - \mu_j\|^2}}$$
- **M-step (soft clusters → centers):**
$$\mu_k = \frac{\sum_i w_{ik}\, x_i}{\sum_i w_{ik}}$$

(The textbook's “partition function” version uses $e^{-\beta\, d(x,\mu)}$ without the square; the course exams use the squared distance. The calculator below supports both.)

**β, the stiffness:**
- **β → 0:** every $w_{ik} \to 1/K$; every center becomes the global mean, so there is no clustering.
- **β → ∞:** the closest center gets weight 1 and the others 0, which is exactly **hard k-means**.
- **Overlapping clusters** (genes in several programs): a **moderate β** keeps meaningful partial memberships.

{{widget:soft-kmeans preset="mid"}}

:::exam Mid 4(a): μ₁ = (10,8,10), μ₂ = (4,8,3), β = 0.5
Squared distances (to μ₁, μ₂) and memberships:
- Gene 1 (10,8,10): 0, 85 → w = (1, ≈3.5×10⁻¹⁹)
- Gene 2 (10,0,9): 65, 136 → w = (1, ≈3.8×10⁻¹⁶)
- Gene 3 (4,8,3): 85, 0 → w = (≈3.5×10⁻¹⁹, 1)
- Gene 4 (7,8,3): 58, 9 → w = (≈2.3×10⁻¹¹, 1)
- Gene 5 (10,2,3): 85, 72 → w₁ = 1/(1 + e^{6.5}) ≈ **0.0015**, w₂ ≈ **0.9985**

Updated centers: **μ₁ ≈ (10.00, 4.00, 9.50)** (essentially the mean of genes 1–2) and **μ₂ ≈ (7.00, 6.00, 3.00)** (mean of genes 3–5). With β = 0.5 and these large distances, the result is almost a hard assignment.
:::

## Hierarchical clustering

Often we want a **hierarchy** (clusters within clusters) without fixing k. **Agglomerative clustering:**

1. Compute the n × n distance matrix D; start with n singleton clusters.
2. Find the two **closest** clusters $C_i, C_j$; merge them into $C_{new}$; record a node in the tree.
3. Update D with distances from $C_{new}$ to every other cluster.
4. Repeat until one cluster remains. The result is a **dendrogram**; cutting it at a height gives clusters.

Cluster distance (**linkage**):
$$D_{\min}(C_1, C_2) = \min_{i\in C_1, j\in C_2} D_{ij} \;(\text{single}) \qquad D_{\text{avg}}(C_1,C_2) = \frac{\sum_{i\in C_1}\sum_{j\in C_2} D_{ij}}{|C_1||C_2|}\;(\text{average})$$
and $D_{\max}$ (complete linkage). Single linkage tends to “chain”; complete gives compact clusters; average sits in between. Average linkage on a distance matrix is exactly **UPGMA**, which you'll meet again for phylogenies.

{{widget:hclust}}

Heatmaps with dendrograms on both axes (genes × samples) are the iconic figure of expression papers.
