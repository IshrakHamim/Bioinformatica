**Biological question:** we measure the expression of thousands of genes across conditions, time points or individual cells. Which genes behave alike, and which samples or cells are alike? Genes with similar expression patterns are often **co-regulated** (switched by the same transcription factor) and functionally related, so grouping them is a powerful first step toward understanding a dataset. This lesson follows Compeau & Pevzner Vol. 2, Ch. 8, plus the course's material on how expression is measured.

## Machine learning in one paragraph

Clustering is our first machine-learning method, so start with the definition used in the slides (Tom Mitchell's): a program **learns** from experience **E** with respect to a task **T** and a performance measure **P** if its performance at T, as measured by P, improves with E.

- **T (task):** classification, regression, clustering, anomaly detection, imputation (filling in missing values), denoising, generating new data…
- **P (performance):** accuracy, the adjusted Rand index (ARI, how well a clustering agrees with known labels), mean absolute error, R², and so on.
- **E (experience):** training data: sequences, structures, physico-chemical properties, gene expression counts…

**Supervised** learning has labels for the training data ("this sample is a tumour") and learns to predict them (the Supervised Learning lesson). **Unsupervised** learning has no labels and looks for structure: **clustering** (this lesson) and **dimensionality reduction** (next lesson).

## Measuring gene expression: microarrays, RNA-seq, single-cell

Recall the central dogma: genes are transcribed into mRNA, which is translated into protein. Proteins are hard to measure comprehensively, so we measure **mRNA abundance** as a proxy for how active each gene is.

**DNA microarrays.** Watch this 3-minute explanation of how a microarray works, then read the summary.

{{video:NgRfc6atXQ8}}

Short single-stranded DNA **probes**, one or more per known gene, are fixed in spots on a glass chip. RNA from the cells is converted (reverse-transcribed) into **cDNA** carrying a fluorescent label and washed over the chip. Each cDNA **hybridizes** (base-pairs) to its complementary probe. The brightness of each spot measures how much of that gene's RNA was present.

Limitations (from the slides):
- only **known transcripts** can be measured, because you must design a probe in advance;
- it cannot distinguish **isoforms** or read the actual sequence;
- **cross-hybridization** (cDNA sticking to similar probes) and **background noise**;
- **saturation**: very bright spots stop getting brighter, so the dynamic range is limited.

**RNA-seq.** Isolate RNA → reverse transcriptase makes cDNA → **sequence** it → map the reads to a reference (or assemble them) → **count reads per gene**. The counts are digital, the dynamic range is huge, and because you read the actual sequence you can discover new transcripts, isoforms, gene fusions and allele-specific expression. This video shows how the count matrix is produced:

{{video:tlf6wYJrwKY}}

{{ref:tools#typical-analysis-workflows}}

**Single-cell RNA-seq (scRNA-seq).** Bulk methods measure the average over millions of cells, which hides differences between cell types. scRNA-seq measures each cell separately:

1. Cells are isolated, for example into tiny oil **droplets**, each with one **barcoded bead**.
2. Every cDNA made from one cell is tagged with that bead's **cell barcode**, plus a **UMI** (unique molecular identifier), a random tag that is different for each original mRNA molecule.
3. Everything is pooled and sequenced together.
4. Reads are **demultiplexed by barcode** to know which cell they came from, and **UMIs are counted** instead of reads, so PCR copies of the same molecule count once.

The result is a **genes × cells** count matrix, used to discover **cell types and states**. Watch 10x Genomics' animation of the droplet method:

{{video:4NAS1qTJmYA}}

And this two-minute summary of single-cell sequencing as a recap:

{{video:6UVOdCc1Q7I}}

:::example Comparing the three technologies
| | Microarray | Bulk RNA-seq | scRNA-seq |
|---|---|---|---|
| Measurement | hybridization intensity to fixed probes | sequencing read counts | read/UMI counts **per cell** |
| What is detected | only pre-designed known transcripts | known + novel transcripts, isoforms, SNPs | the same, per cell, but sparse (many genes read as zero: "dropouts") |
| Resolution | average over the tissue | average over the tissue | individual cells (heterogeneity, rare cell types) |
| Dynamic range | limited (background, saturation) | wide, digital | wide but noisy, many zeros |
| Typical analysis | compare relative intensities between conditions | differential expression | clustering into cell types, trajectories, t-SNE/UMAP |
| How do we know which cell? | n/a | n/a | **cell barcodes** (+ UMIs to count molecules) |
:::

**Do we need a reference genome for RNA-seq?** Not strictly. If a reference genome or transcriptome exists, reads are aligned to it with splice-aware aligners (STAR, HISAT2) or pseudo-aligned (Salmon, kallisto). That is fast and accurate, and it tells you which gene each read comes from. For organisms **without** a reference, reads can be **assembled de novo** into transcripts (e.g., with Trinity) and quantified against that assembly.

**Where the data live** (slides): NCBI **GEO** (microarray and sequencing studies), **SRA** (raw reads), **ArrayExpress** (EBI's counterpart), and homogenized resources such as recount2/recount3, ARCHS4, Toil and MetaSRA. Example: the Parkinson's disease microarray study GSE6613.

{{ref:tools#databases-you-will-use}}

## The gene expression matrix

Measure n genes at m checkpoints (conditions, time points, samples) and you get an **n × m expression matrix**. Row i is gene i's **expression vector**: its profile across the checkpoints.

```text
            t1    t2    t3    t4
gene A     2.0   4.1   6.0   8.2     rises steadily
gene B     1.0   2.1   2.9   4.1     rises steadily, lower level
gene C     8.0   6.1   4.0   2.0     falls
```

- Genes with similar vectors (A and B) may be co-regulated.
- If a gene of unknown function has a vector resembling a known gene's, they may be involved in related processes.
- Typical studies: before vs after a drug, cancer vs normal tissue, a time course of development.

:::story Finding the "sectors" in a stock market
Track the daily price of thousands of companies for a year. Nobody tells you which industry each company is in, yet the airline stocks rise and fall together, and so do the oil stocks. Group companies by the *shape* of their price curves and you rediscover "airlines" and "oil" from the data alone.

Clustering genes is the same idea: genes are the companies, conditions are the days, expression is the price. Genes that rise and fall together are probably switched by the same transcription factor or work in the same pathway. This is **guilt by association**: if 9 genes in a cluster are known to work in metabolism, the 10th, unknown one is a good bet for metabolism too. And a tight cluster of co-regulated genes is the natural input for motif finding, to look for the shared switch upstream of them.
:::

**Each gene is a point in m-dimensional space** (or, transposing the matrix, each sample is a point in n-dimensional gene space). Clustering groups nearby points. What "nearby" means depends on the distance: Euclidean distance puts A and B fairly far apart because their *levels* differ, while correlation distance puts them together because their *shapes* match.

**Log transformation.** Expression values are usually log-transformed (e.g., log₂) before analysis. Expression changes are multiplicative (a gene going from 10 to 20 is as big a change as 1,000 to 2,000), and raw values are heavy-tailed, so a few very highly expressed genes would dominate distances.

{{ref:math#vectors-matrices-and-covariance|math#distances-and-similarity}}

**Clustering vs classification.** Classification assigns items to **known** classes. Clustering groups similar items to **reveal** hidden structure, with no labels. A good clustering has two properties:
- **homogeneity:** points within a cluster are close to each other;
- **separation:** points in different clusters are far apart.

## k-means as an optimization problem

To make "good clustering" precise, choose **k centers** instead of choosing clusters directly. Each point belongs to its nearest center. The distance from a point v to a set of centers C is $d(v, C) = \min_i d(v, C_i)$.

**Squared error distortion** measures how well the centers fit the data:

$$\text{Distortion}(Data, C) = \frac{1}{n}\sum_{v \in Data} d(v, C)^2$$

**k-Means Clustering Problem:** find the k centers that minimize the distortion. It is NP-hard in general (even for k = 2 in high dimensions), so in practice we use a heuristic.

{{ref:algo#np-hardness-and-heuristics}}

Watch this StatQuest video for a visual walk-through of the algorithm and of choosing k before reading the steps:

{{video:4b5d3muPQmA}}

**Lloyd's algorithm:**
1. Choose k initial centers.
2. **Centers → clusters:** assign each point to its nearest center.
3. **Clusters → centers:** move each center to the **center of gravity** (the mean) of its points.
4. Repeat steps 2–3 until the centers stop moving.

**Worked example.** Points 1, 2, 3, 10, 11, 12 on a line, k = 2, starting centers 1 and 2.
- Assign: 1 goes to center 1; 2, 3, 10, 11, 12 are closer to center 2.
- Update: center 1 = 1, center 2 = (2 + 3 + 10 + 11 + 12)/5 = 7.6.
- Assign: 1, 2, 3 are closer to 1 than to 7.6; 10, 11, 12 are closer to 7.6.
- Update: centers 2 and 11. Assign again: nothing changes, so stop.
- Final distortion = (1 + 0 + 1 + 1 + 0 + 1)/6 ≈ 0.67.

**Why it converges.** Step 2 can only lower the distortion (each point moves to a closer center), and step 3 can only lower it (the mean minimizes the sum of squared distances to a set of points). The distortion never increases, and there are finitely many ways to assign points, so the algorithm stops. But it stops at a **local** minimum, which depends on the starting centers.

{{ref:algo#iterative-optimization-the-em-pattern}}

{{widget:kmeans}}

{{game:lloyd-step}}

**Limitations (slides):** k-means can get stuck in local minima; it depends on initialization; k must be chosen in advance; it assumes **spherical, similar-sized** clusters; it is sensitive to outliers and noise; it is costly for huge data; Euclidean distances lose meaning in very high dimensions; and it cannot handle categorical data.

:::example Why might k-means mix genes from distinct pathways, and what can you do?
**Reasons:** (1) a bad initialization leads to a poor local optimum; (2) the wrong k (too small forces distinct groups together); (3) clusters that are not spherical or have unequal spread; (4) un-normalized data, where Euclidean distance is dominated by a few highly expressed genes or by overall level rather than shape; (5) outliers and noise; (6) hard assignment, even though genes often take part in several pathways.

**Fixes:** **k-means++** or many restarts (keep the lowest distortion); choose k with the elbow method, silhouette score or gap statistic; **standardize or log-transform**, or use **correlation distance**; remove or down-weight outliers (k-medoids); use **soft clustering** (soft k-means, Gaussian mixtures) or hierarchical clustering; and validate clusters against known biology (GO enrichment).
:::

**Outliers.** The mean is not robust: a few points at [100, 100] drag a center far away (or grab a whole cluster for themselves), distorting every other cluster. Handle them by removing or capping outliers, log-transforming, using **k-medoids or k-medians** (centers must be actual data points, or medians), or density-based methods such as DBSCAN.

:::think You run k-means twice on the same data and get two different clusterings. Is something broken?
No. Lloyd's algorithm starts from (usually random) initial centers and only ever walks downhill in distortion, so different starts can end in different **local minima**. Use k-means++ initialization, run many restarts, and keep the result with the lowest distortion.
:::

:::think Your data form two long, thin, parallel clusters, and you run k-means with k = 2. What happens?
k-means assigns each point to its nearest center, which carves space into convex, roughly round regions. Two long parallel strips are not round, so k-means will likely cut **across** both strips, giving each center the nearby halves of both, instead of separating the strips. Single-linkage hierarchical clustering or a density-based method (DBSCAN), which follow chains of nearby points, handle this shape far better.
:::

## Initialization and k-means++

**Initialization matters.** Try centers [1,1], [10,10], [20,20] with data tightly grouped around [5,5], [15,15] and [25,25]. The first assignment puts the 5s with the first center and the 25s with the third, and splits the 15-group (it is equidistant from the second and third centers). The next update pulls the second center toward 15 and the third toward ~20+, after which all the 15s go to the second center. So in this case it **does converge** to the right clusters, because the initial centers are spread out and in the right order. If instead two initial centers start inside the same true group, Lloyd can converge to a wrong local optimum that it never escapes.

**k-means++ (Arthur & Vassilvitskii, 2007)** picks initial centers that are spread out, using randomness:

1. Pick the first center uniformly at random from the data points.
2. For each point x, compute D(x), its distance to the nearest center chosen so far.
3. Pick the next center at random, choosing point x with probability $\frac{D(x)^2}{\sum_y D(y)^2}$. Far-away points are much more likely.
4. Repeat until there are k centers, then run Lloyd's algorithm as usual.

The expected distortion is guaranteed to be within a factor O(log k) of the optimum, and in practice it converges faster and to better solutions.

{{ref:math#expected-value-and-sampling-from-a-distribution}}

{{video:4qJWhvFQb9g}}

{{widget:kmeans-pp}}

:::example k-means++ on points {2, 4, 10, 12, 20}, first center 2
D² = 0, 4, 64, 100, 324 (sum 492), so P(4) = 4/492 ≈ 0.0081, P(10) ≈ 0.1301, P(12) ≈ 0.2033, **P(20) ≈ 0.6585**.

**Why might 12 be chosen rather than 20?** Selection is **random**, in proportion to D². 20 is the most likely choice, but 12 still has about a 20% chance. Choosing 12 still spreads the centers out (2 and 12), a far better start than plain random initialization, which could pick 2 and 4, both in the same group. The randomness also stops k-means++ from always grabbing extreme outliers.
:::

## Soft k-means (EM clustering)

Hard assignment is awkward for a point halfway between two centers: forcing it into one cluster throws away information. **Soft k-means** gives each point a **responsibility**, a fractional membership in each cluster, with responsibilities summing to 1 per point. This is an **expectation–maximization (EM)** algorithm, alternating two steps:

- **E-step (centers → soft clusters):** the responsibility of cluster k for point i decays exponentially with squared distance:
$$w_{ik} = \frac{e^{-\beta\,\|x_i - \mu_k\|^2}}{\sum_{j=1}^{K} e^{-\beta\,\|x_i - \mu_j\|^2}}$$
- **M-step (soft clusters → centers):** each center becomes a **weighted mean**, every point contributing in proportion to its responsibility:
$$\mu_k = \frac{\sum_i w_{ik}\, x_i}{\sum_i w_{ik}}$$

(The textbook's "partition function" version uses $e^{-\beta\, d(x,\mu)}$ without the square; the course uses the squared distance. The calculator below supports both.)

**β, the stiffness parameter:**
- **β → 0:** every $w_{ik} \to 1/K$. Every point belongs equally to every cluster, all centers collapse to the global mean, and there is no clustering.
- **β → ∞:** the closest center gets weight 1 and the others 0. This is exactly **hard k-means**.
- **Moderate β:** points between clusters keep meaningful partial memberships, which suits genes that take part in several programs.

{{widget:soft-kmeans preset="mid"}}

:::example One round of soft k-means: μ₁ = (10,8,10), μ₂ = (4,8,3), β = 0.5
Squared distances (to μ₁, μ₂) and responsibilities:
- Gene 1 (10,8,10): 0, 85 → w = (1, ≈3.5×10⁻¹⁹)
- Gene 2 (10,0,9): 65, 136 → w = (1, ≈3.8×10⁻¹⁶)
- Gene 3 (4,8,3): 85, 0 → w = (≈3.5×10⁻¹⁹, 1)
- Gene 4 (7,8,3): 58, 9 → w = (≈2.3×10⁻¹¹, 1)
- Gene 5 (10,2,3): 85, 72 → w₁ = 1/(1 + e^{6.5}) ≈ **0.0015**, w₂ ≈ **0.9985**

To get Gene 5's numbers: divide the top and bottom of the formula by $e^{-0.5 \cdot 72}$, giving $w_1 = e^{-0.5 \cdot 85}/(e^{-0.5\cdot 85} + e^{-0.5 \cdot 72}) = 1/(1 + e^{0.5 \cdot 13})$.

**Updated centers:** μ₁ ≈ (10.00, 4.00, 9.50), essentially the mean of genes 1–2, and μ₂ ≈ (7.00, 6.00, 3.00), the mean of genes 3–5. With β = 0.5 and such large distances, the result is almost a hard assignment.
:::

## Hierarchical clustering

Often we don't know k, and biology is naturally nested: cell types contain subtypes, and pathways contain sub-pathways. **Hierarchical clustering** builds a whole tree of clusters within clusters. Watch this explanation of linkage and dendrograms first:

{{video:7xHsRkOdVwo}}

**Agglomerative (bottom-up) clustering:**
1. Compute the n × n distance matrix D and start with n singleton clusters.
2. Find the two **closest** clusters $C_i, C_j$ and merge them into $C_{new}$. Record the merge as a node in the tree, at a height equal to their distance.
3. Update D with the distance from $C_{new}$ to every other cluster.
4. Repeat until one cluster remains. The tree is a **dendrogram**; cutting it at some height gives a flat clustering.

How do we measure the distance between two *clusters*? That choice is called the **linkage**:

$$D_{\min}(C_1, C_2) = \min_{i\in C_1, j\in C_2} D_{ij} \;(\text{single}) \qquad D_{\text{avg}}(C_1,C_2) = \frac{\sum_{i\in C_1}\sum_{j\in C_2} D_{ij}}{|C_1||C_2|}\;(\text{average})$$

and $D_{\max}$, the largest pairwise distance (complete linkage).

**Worked example.** Four points on a line: A = 1, B = 2, C = 6, D = 8. Pairwise distances: AB 1, CD 2, BC 4, AC 5, BD 6, AD 7.
1. Merge A and B (distance 1).
2. Merge C and D (distance 2), the closest remaining pair.
3. Distance between {A,B} and {C,D}: **single** = min(5, 7, 4, 6) = 4; **average** = (5 + 7 + 4 + 6)/4 = 5.5; **complete** = 7. The final merge happens at that height.

Single linkage tends to **chain** clusters together through intermediate points; complete linkage gives compact clusters; average sits in between. Average linkage on a distance matrix is exactly **UPGMA**, which you'll meet again for building phylogenetic trees.

{{widget:hclust}}

Heatmaps with dendrograms on both axes (genes × samples, each axis reordered by its tree) are the iconic figure of expression papers.

:::think 10,000 genes, 50 conditions: hierarchical clustering or k-means?
Hierarchical clustering needs all pairwise distances: about 5 × 10⁷ pairs, and at least O(n²) time (naive implementations O(n³)), recomputing distances after each of the 9,999 merges. That is feasible on a modern computer but slow and memory-hungry, and it grows quadratically. k-means costs O(n · k · m) per iteration (n genes, k clusters, m conditions), so it scales easily. For very large n (say a million cells), k-means or graph-based methods are the practical choice; for a few thousand items, hierarchical clustering's full tree is worth the cost.
:::

:::think What are the weak spots of hierarchical clustering?
1. **Cost:** at least quadratic in the number of items.
2. **No undo:** it is greedy, and a bad early merge (e.g., caused by an outlier) can never be reversed.
3. **The linkage choice matters:** single, average and complete linkage can give quite different trees, and none is right for every dataset.
4. **Where to cut the dendrogram** to get clusters is a judgement call.
:::
