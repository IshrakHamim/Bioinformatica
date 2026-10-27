**Biological question:** how are species, genes or virus strains related by descent, and where did an outbreak come from? A **phylogenetic tree** answers both: it is a hypothesis about the history of a group of sequences. This lesson follows Compeau & Pevzner Vol. 2, Ch. 7 (the lecture deck plus Phillip Compeau's 2024 *Evolutionary Trees* slides).

## Motivation: tracing outbreaks

**SARS (2003).** A doctor from Guangdong province checked into room 911 of Hong Kong's Metropole Hotel. Guests he infected carried the virus on to Hanoi and Toronto. Where did SARS come from? Comparing the viral genome with coronaviruses sampled from animals pointed to **bats** as the source, with **civets** as an intermediate host that passed it to humans.

**Why viruses are ideal for this.** Coronaviruses, influenza and HIV are **RNA viruses**, and RNA replication is error-prone, so they mutate fast. That's why the flu shot changes every year and why HIV has many subtypes. It also means that viral genomes collected even weeks apart differ in a few positions, which is exactly the information needed to reconstruct who infected whom. The same methods traced SARS-CoV-2 variants and HIV's origin in chimpanzee SIV.

:::story Copying manuscripts by hand
Before printing, books were copied by scribes, and every scribe made a few mistakes. A copy made from a flawed copy inherits its mistakes and adds new ones. Collect the surviving manuscripts, and the pattern of **shared mistakes** tells you who copied from whom: two copies sharing ten unusual errors probably descend from the same lost parent. Scholars really do build such family trees of manuscripts.

Genomes are copied the same way, with mutations as the scribal errors. **Distance methods** count how many differences separate each pair of copies and fit a tree to those counts. **Character-based methods** look at each error individually and ask which tree explains who shares it.
:::

Before the formal definitions, this short video shows how to read a tree and the basic logic of building one:

{{video:09eD4A_HxVQ}}

:::bio Two computational approaches
1. **Distance-based:** first compress the data into a matrix of pairwise evolutionary distances, then build a tree that fits the matrix.
2. **Character-based:** work directly on the aligned sequences (each column is a "character"), inferring the tree *and* the ancestral sequences (parsimony, maximum likelihood).
:::

## Tree vocabulary

- **Leaves** (degree 1) are present-day species or sequences. **Internal nodes** are their unknown ancestors; each represents a split (a speciation event, or a transmission).
- A leaf's single neighbour is its **parent**, and the edge joining them is a **limb**.
- **Edge lengths** represent amount of evolution, for example the number of mutations.
- **Rooted tree:** one node is designated the **root**, the common ancestor of everything, and time flows from the root outward.
- **Unrooted tree:** shows relationships only, with no direction of time. Many methods produce unrooted trees. To root one, include an **outgroup**, a species known to be more distant than all the others; the root goes on the edge leading to it.

{{ref:algo#trees-and-recursion}}

## Distance matrices and additivity

A **distance matrix** D gives a distance $D_{ij}$ for every pair of leaves. It must be **symmetric** ($D_{ij} = D_{ji}$), **non-negative**, zero on the diagonal, and satisfy the **triangle inequality** $D_{ik} \le D_{ij} + D_{jk}$. (The slide prints this as $D_{ij} + D_{jk} \le D_{ik}$; the correct direction is the one above: going through j can't be shorter than going directly.)

**Where distances come from.** Typically from a multiple sequence alignment: count the columns in which two rows differ, then correct for multiple substitutions at the same site (which hide earlier changes).

{{ref:math#distances-and-similarity|alignment#multiple-sequence-alignment}}

**Fitting a tree.** In a tree with edge lengths, the distance between two leaves is the **sum of edge lengths on the path** between them. A tree **fits** D if that path length equals $D_{ij}$ for every pair. D is **additive** if some tree fits it.

**Not every matrix is additive.** The **four-point condition** tests it: for every four leaves i, j, k, l, compute the three sums $D_{ij}+D_{kl}$, $D_{ik}+D_{jl}$, $D_{il}+D_{jk}$; the two largest must be equal. (In a tree, two of the three pairings use the central path twice and are equal, and the third uses it zero times and is smaller.)

**Example.** For leaves i, j, k, l with
$$D = \begin{pmatrix} 0 & 13 & 21 & 22 \\ 13 & 0 & 12 & 13 \\ 21 & 12 & 0 & 13 \\ 22 & 13 & 13 & 0 \end{pmatrix}$$
the three sums are $13 + 13 = 26$, $21 + 13 = 34$ and $22 + 12 = 34$. The two largest are equal, so D is additive. We'll reconstruct its tree below.

## Neighbors, limb lengths and AdditivePhylogeny

**A first idea** (slides): take the **smallest** $D_{ij}$, assume leaves i and j are **neighbours** (they share a parent m), replace them by m with
$$D_{km} = \frac{D_{ik} + D_{jk} - D_{ij}}{2}$$
and repeat on the smaller matrix. (The formula: the path from k to i and the path from k to j both pass through m, so their sum counts k–m twice plus i–m and j–m, which together are $D_{ij}$.)

**The pitfall.** The closest pair is **not always** a pair of neighbours. If one leaf evolved very fast, its limb is long, so it is far from everyone, even from its own sibling. Neighbour joining (below) fixes this.

:::think Why can the closest pair of leaves fail to be siblings?
Distance on a tree is the sum of the two limbs plus the path between their parents. Picture siblings A and B where A evolved very fast (a long limb): A is now far from **everyone**, including B, and B may be closer to some cousin C than to A. Picking the smallest $D_{ij}$ would wrongly join B and C. Neighbour joining fixes this by subtracting each leaf's total distance to everyone else, so a leaf that is far from all others gets compensated.
:::

**Limb Length Theorem.** For an additive matrix and a leaf j, the length of j's limb is
$$\text{LimbLength}(j) = \min_{i,k \neq j} \frac{D_{ij} + D_{jk} - D_{ik}}{2}$$
For the example matrix: LimbLength(i) = min{(13 + 21 − 12)/2, (13 + 22 − 13)/2, (21 + 22 − 13)/2} = min{11, 11, 15} = **11**, and LimbLength(j) = min{(13 + 12 − 21)/2, (13 + 13 − 22)/2, (12 + 13 − 13)/2} = **2**.

**AdditivePhylogeny** builds the exact tree recursively:
1. Pick a leaf j and compute its limb length.
2. Subtract it from j's row and column, making j a "bald" limb of length 0 (j now sits *on* the tree).
3. Find leaves i, k with $D_{ij} + D_{jk} = D_{ik}$: then j lies on the path from i to k, at distance $D_{ij}$ from i.
4. Remove j, build the tree for the remaining leaves recursively, then **reattach** j at that point on the i–k path with its limb.

For an additive matrix this reconstructs the unique tree that fits it, in polynomial time.

## Ultrametric trees and UPGMA

**The molecular clock.** Suppose evolution ran at a constant rate in every lineage. Then every internal node would have an **age**, leaves (present-day species) would have age 0, and every root-to-leaf path would have the same length. A rooted tree with this property is **ultrametric**.

**UPGMA** (Unweighted Pair Group Method with Arithmetic mean) is a simple clustering method that assumes this clock. Watch the step-by-step video first, then follow the algorithm:

{{video:HMKAD13pncQ}}

1. Start with n clusters, one per leaf, each of age 0.
2. Find the two **closest clusters** $C_1, C_2$, where the distance between clusters is the **average** distance between their members:
$$D_{C_1,C_2} = \frac{\sum_{i\in C_1}\sum_{j\in C_2} D_{ij}}{|C_1|\,|C_2|}$$
3. Merge them under a new node of **age $D_{C_1,C_2}/2$** (each side contributes half the distance). Each edge length = age(parent) − age(child).
4. Recompute distances from the new cluster to all others (as size-weighted averages) and repeat until one cluster remains: the root.

If this looks familiar, it is: UPGMA is exactly **average-linkage hierarchical clustering** from the Gene Expression lesson, with node heights interpreted as times.

{{ref:expression1#hierarchical-clustering}}

{{widget:upgma preset="final"}}

{{game:tree-builder}}

:::example UPGMA with D(A,B) = 4, D(C,D) = 4, all other distances 6
1. The minimum is 4 (a tie between {A,B} and {C,D}; take A,B). Merge **(AB)** at age **2**. New distances: D(AB, C) = (6 + 6)/2 = 6, D(AB, D) = 6; D(C, D) = 4 is unchanged.
2. The minimum is 4 → merge **(CD)** at age **2**. D(AB, CD) = (6 + 6 + 6 + 6)/4 = 6.
3. Merge **(AB)(CD)** at age **6/2 = 3**: the root.

Branch lengths: A, B, C and D each **2** (to their cluster node); AB → root **1** and CD → root **1**. Newick: `((A:2,B:2):1,(C:2,D:2):1);`. Every leaf is 3 from the root, so the tree is ultrametric, as UPGMA always produces.
:::

:::example What is an ultrametric tree, and why does it matter?
A rooted tree in which **every root-to-leaf distance is the same**; equivalently, each internal node has an age and all leaves are at age 0. It encodes the **molecular clock** hypothesis (mutations accumulate at a constant rate), which lets us read **divergence times** directly from branch lengths and date speciation events.

In reality, rates often differ between lineages (generation time, population size, selection), so clock-based methods like UPGMA can produce the **wrong topology**. Then we use clock-free methods (neighbour joining, maximum likelihood) or **relaxed clock** models.
:::

**UPGMA's weaknesses:** it doesn't actually fit a tree to D; it fails when the clock is violated, even on additive matrices; and averages must be weighted by cluster size. Still, it is simple and widely used as a quick baseline.

:::think When does UPGMA build the wrong tree?
When the **molecular clock** fails. UPGMA assumes every lineage evolves at the same rate, so it always joins the closest pair and places it at half their distance. If one lineage evolved fast, its long branches make it look distant from its true relatives, and UPGMA attaches it in the wrong place, even when the distances fit a tree perfectly (are additive). Neighbour joining makes no clock assumption and recovers the right tree for additive data.
:::

## Neighbor joining

**Saitou & Nei (1987)** fixed the "closest pair isn't always neighbours" problem by correcting each distance for how far each leaf is from *everyone*. With $\text{TotalDistance}_D(i) = \sum_k D_{ik}$:

$$D^*_{ij} = (n-2)\,D_{ij} - \text{TotalDistance}_D(i) - \text{TotalDistance}_D(j)$$

A fast-evolving leaf has a large total distance, which lowers its $D^*$ values and so compensates for its long limb.

**Neighbor-Joining Theorem:** for an additive matrix D, the smallest element of $D^*$ is always a pair of **neighbouring leaves**.

**Each step:** join the pair i, j with the smallest $D^*$ under a new node m, with limb lengths
$$\Delta = \frac{\text{Total}(i) - \text{Total}(j)}{n-2},\quad \text{limb}(i) = \frac{D_{ij} + \Delta}{2},\quad \text{limb}(j) = \frac{D_{ij} - \Delta}{2}$$
then set $D_{km} = (D_{ik} + D_{jk} - D_{ij})/2$ for every other leaf k, and repeat on the smaller matrix.

:::example Neighbour joining on the 4-leaf matrix above
**Totals:** i = 13 + 21 + 22 = 56, j = 38, k = 46, l = 48. With n = 4, $D^*_{ij} = 2 \cdot 13 - 56 - 38 = -68$; similarly $D^*_{kl} = -68$, and every other pair gives −60. So i, j are neighbours (and so are k, l).

**Join i and j:** Δ = (56 − 38)/2 = 9, so limb(i) = (13 + 9)/2 = **11** and limb(j) = (13 − 9)/2 = **2**, matching the Limb Length Theorem. New distances: $D_{mk} = (21 + 12 - 13)/2 = 10$, $D_{ml} = (22 + 13 - 13)/2 = 11$, and $D_{kl} = 13$.

**Three nodes left:** they meet at one central node c with m–c = (10 + 11 − 13)/2 = 4, k–c = (10 + 13 − 11)/2 = 6, l–c = (11 + 13 − 10)/2 = 7.

**Check:** the path i → k is 11 + 4 + 6 = 21 = $D_{ik}$ ✓, and i → l is 11 + 4 + 7 = 22 ✓.
:::

Neighbour joining reconstructs the exact tree for additive matrices, produces a good tree for non-additive ones, needs no molecular clock, and runs in O(n³). This lecture explains it from a phylogenetics researcher's point of view:

{{video:Dj24mCLQYUE}}

{{widget:nj}}

## Character-based methods: small parsimony

Distance methods throw information away when they compress an alignment into one number per pair. **Character-based** methods work directly on the alignment columns.

**Parsimony** prefers the history with the **fewest mutations**, the simplest explanation of the data.

:::think What do distance methods throw away that character-based methods keep?
A distance matrix squeezes each pair of whole sequences into one number. It forgets **which** positions differ and **how** (which letter changed to which), and so it loses the shared, specific changes that group relatives together. Character-based methods (parsimony, maximum likelihood) keep every column and also infer the ancestral letters at internal nodes. The price is more computation.
:::

**Small Parsimony Problem:** given a tree and the letters at its leaves (one alignment column at a time), assign letters to the internal nodes **minimizing the total number of changes** along the edges (the **parsimony score**).

**Fitch's algorithm** solves it in linear time per column, in two passes:
1. **Bottom-up** (from leaves to root): each leaf's set is its letter. At each internal node, if its two children's sets **intersect**, take the intersection; otherwise take the **union** and count **one change**.
2. **Top-down** (from root to leaves): pick a letter for the root from its set, then give each child the same letter if it's in the child's set, or any letter from the child's set otherwise.

**Example.** Tree ((A, B), (C, D)) with leaf letters A = `A`, B = `C`, C = `C`, D = `C`. Bottom-up: {A} ∩ {C} is empty → union {A, C}, one change; {C} ∩ {C} = {C}; root: {A, C} ∩ {C} = {C}. Total: **1 change**. Top-down: root C, both internal nodes C, so the single change is on the edge to leaf A.

{{widget:fitch}}

**Sankoff's algorithm** is the dynamic-programming generalization that allows arbitrary substitution costs (e.g., transitions cheaper than transversions).

**Large parsimony** also searches over all possible tree shapes. The number of trees explodes, $(2n-3)!!$ rooted trees for n leaves, and the problem is NP-hard, so heuristics are used: start from a reasonable tree and apply local rearrangements such as **nearest-neighbour interchanges**, keeping changes that lower the score.

{{ref:math#counting-how-big-is-the-search-space|algo#np-hardness-and-heuristics}}

:::sota What researchers use today
- **Maximum likelihood** (RAxML-NG, IQ-TREE) with explicit substitution models (JC69, HKY, GTR+Γ) and **bootstrapping** to measure support for each branch.
- **Bayesian** inference (MrBayes, BEAST) with relaxed molecular clocks to date divergences (e.g., when SARS-CoV-2 lineages emerged).
- **Nextstrain** builds real-time phylogenies of viral outbreaks from genomes uploaded worldwide.
:::
