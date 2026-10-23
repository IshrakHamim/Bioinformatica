**Biological question:** how are species, genes, or virus strains related by descent, and where did an outbreak come from? This module follows Compeau & Pevzner Vol. 2, Ch. 7 (the lecture deck plus Phillip Compeau's 2024 *Evolutionary Trees* slides).

## Motivation: tracing outbreaks

**SARS (2003):** a doctor from Guangdong checked into room 911 of Hong Kong's Metropole Hotel. Guests he infected carried the virus to Hanoi and Toronto. Where did SARS come from? Comparing viral genomes with coronaviruses from animals pointed to bats, with **civets** as an intermediate host.

**Why viruses mutate fast:** coronaviruses, influenza and HIV are **RNA viruses**, and RNA replication is error-prone. That is why the flu shot changes yearly and why HIV has many subtypes. It is also why their genomes are perfect for reconstructing transmission trees: there are many differences to compare. The same methods traced SARS-CoV-2 variants and HIV's origin in chimpanzee SIV.

:::bio Two computational questions
1. **Distance-based:** given a matrix of pairwise evolutionary distances, build a tree that fits it.
2. **Character-based:** given aligned sequences (characters) at the leaves, infer the tree *and* the ancestral sequences (parsimony, maximum likelihood).
:::

## Tree vocabulary

- **Leaves** (degree 1) = present-day species. **Internal nodes** = unknown ancestors (speciation events).
- A leaf's single neighbor is its **parent**; the edge to it is a **limb**.
- **Rooted tree:** a designated root = the common ancestor; edges point away from it (time flows outward).
- **Unrooted tree:** relationships only, no direction of time. Many methods produce unrooted trees; an **outgroup** (a known distant species) is used to root them.

## Distance matrices and additivity

A **distance matrix** D must be **symmetric** ($D_{ij} = D_{ji}$), **non-negative**, and satisfy the **triangle inequality** $D_{ik} \le D_{ij} + D_{jk}$. (The slide prints this as $D_{ij} + D_{jk} \le D_{ik}$; the correct direction is the one above.)

Distances can come from a multiple alignment (e.g., number of differing columns between two rows), corrected for multiple substitutions.

A tree **fits** D if the path length between every pair of leaves equals $D_{ij}$. D is **additive** if some tree fits it. **Not every matrix is additive** (four-point condition: for any four leaves, of the three pairwise sums $D_{ij}+D_{kl}$, $D_{ik}+D_{jl}$, $D_{il}+D_{jk}$, the two largest must be equal).

## Neighbors, limb lengths and AdditivePhylogeny

**A first idea** (slides): take the **minimum** $D_{ij}$, assume i and j are **neighbors**, replace them by their parent m with
$$D_{km} = \frac{D_{ik} + D_{jk} - D_{ij}}{2}$$
and recurse. **Pitfall:** the closest pair is **not always** a pair of neighbors. A fast-evolving neighbor can be far even though it is adjacent (this is what neighbor joining fixes).

**Limb Length Theorem.** For an additive matrix and a leaf j:
$$\text{LimbLength}(j) = \min_{i,k \neq j} \frac{D_{ij} + D_{jk} - D_{ik}}{2}$$
Slide example (leaves i, j, k, l with D = [[0,13,21,22],[13,0,12,13],[21,12,0,13],[22,13,13,0]]): LimbLength(i) = 11, LimbLength(j) = 2.

**AdditivePhylogeny:** pick a leaf j, compute its limb length, subtract it from j's row and column (making j a “bald” limb of length 0), find leaves i, k with $D_{ij} + D_{jk} = D_{ik}$ (j lies on the i–k path, at distance $D_{ij}$ from i), remove j, solve recursively, then **reattach** j at that point with its limb. This reconstructs the unique tree for an additive matrix in polynomial time.

## Ultrametric trees and UPGMA

If evolution ran at a constant rate (a **molecular clock**), every internal node v would have an **age**, leaves would have age 0, and every root-to-leaf path would have the same length. Such a rooted tree is **ultrametric**.

**UPGMA** (Unweighted Pair Group Method with Arithmetic mean) is a clustering heuristic assuming this clock:
1. Start with n single-leaf clusters, each of age 0.
2. Find the two **closest clusters** $C_1, C_2$, where cluster distance = **average** pairwise distance
$$D_{C_1,C_2} = \frac{\sum_{i\in C_1}\sum_{j\in C_2} D_{ij}}{|C_1|\,|C_2|}$$
3. Merge them into a new node of **age $D_{C_1,C_2}/2$**; edge lengths = age(parent) − age(child).
4. Recompute distances from the new cluster (size-weighted average), and repeat until one cluster remains (the root).

{{widget:upgma preset="final"}}

{{game:tree-builder}}

:::exam Final Q2(a): D(A,B) = 4, D(C,D) = 4, all other distances 6
1. Minimum is 4 (tie between {A,B} and {C,D}; take A,B). Merge **(AB)** at height **2**. New distances: D(AB,C) = (6+6)/2 = 6, D(AB,D) = 6, and D(C,D) = 4 is unchanged.
2. Minimum 4 → merge **(CD)** at height **2**. D(AB, CD) = (6+6+6+6)/4 = 6.
3. Merge **(AB)(CD)** at height **6/2 = 3** (root).

Branch lengths: A, B, C, D each **2** (to their cluster node); AB → root **1**, CD → root **1**. Newick: `((A:2,B:2):1,(C:2,D:2):1);`. Every leaf is 3 from the root, so the tree is ultrametric.
:::

:::exam Final Q2(b): what is an ultrametric tree and why does it matter?
A rooted tree in which **every root-to-leaf distance is the same**, equivalently each internal node has an age and all leaves (present-day species) are at age 0. It encodes the **molecular clock** hypothesis (mutations accumulate at a constant rate), letting us read **divergence times** directly from branch lengths and date speciation events. Biologically, rates often vary between lineages (generation time, population size, selection), so clock-based methods like UPGMA can produce the wrong topology. Then we use clock-free methods (neighbor joining, maximum likelihood) or **relaxed clocks**.
:::

**UPGMA's weaknesses:** it doesn't “fit” a tree to D, it fails when the clock is violated (even on additive matrices), and averages must be weighted by cluster sizes. Still, it is simple and widely used as a quick baseline (and it is exactly average-linkage hierarchical clustering).

## Neighbor joining

**Saitou & Nei (1987).** Correct the closest-pair mistake by penalizing leaves that are far from *everyone*:
$$D^*_{ij} = (n-2)\,D_{ij} - \text{TotalDistance}_D(i) - \text{TotalDistance}_D(j)$$
**Neighbor-Joining Theorem:** for an additive D, the minimum element of $D^*$ is always a pair of **neighboring leaves**.

Each step: join i, j (minimum $D^*$) into new node m; limb lengths
$$\Delta = \frac{\text{Total}(i) - \text{Total}(j)}{n-2},\quad \text{limb}(i) = \frac{D_{ij} + \Delta}{2},\quad \text{limb}(j) = \frac{D_{ij} - \Delta}{2}$$
then $D_{km} = (D_{ik} + D_{jk} - D_{ij})/2$; repeat. It reconstructs the exact tree for additive matrices, produces a good tree for non-additive ones, needs no molecular clock, and runs in O(n³).

{{widget:nj}}

## Character-based methods: small parsimony

Distance methods throw away information when they compress an alignment into numbers. **Character-based** methods work on the alignment columns directly.

**Small Parsimony Problem:** given a tree and the characters at its leaves, assign characters to internal nodes **minimizing the total number of changes** (the parsimony score). **Fitch's algorithm** (bottom-up set intersection/union, then top-down assignment) or **Sankoff's** DP (arbitrary substitution costs) solves it in linear time per column.

{{widget:fitch}}

**Large parsimony** (also search over all tree shapes) is NP-hard, so we use heuristic tree rearrangements (nearest-neighbor interchanges).

:::sota What researchers use today
- **Maximum likelihood** (RAxML-NG, IQ-TREE) with explicit substitution models (JC69, HKY, GTR+Γ) and **bootstrapping** for branch support.
- **Bayesian** inference (MrBayes, BEAST) with relaxed molecular clocks to date divergences (e.g., when SARS-CoV-2 lineages emerged).
- **Nextstrain** builds real-time phylogenies of viral outbreaks from genomes uploaded worldwide.
:::
