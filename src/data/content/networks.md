Genes and proteins don't act alone. The omics era produced data on thousands of interactions at once, which requires **systems-level** analysis. **Network biology** represents biological systems as graphs and analyzes them with graph theory, borrowing heavily from social network analysis. The lecture follows the EMBL-EBI course *Network analysis of protein interaction data*.

## Graphs, edges and adjacency matrices

- **Nodes** = biological entities (proteins, genes, metabolites); **edges** = interactions or relations.
- **Undirected** edges: physical **protein–protein interaction (PPI)** networks (A binds B ⇔ B binds A).
- **Directed** edges: **metabolic** and **gene regulatory** networks, where signal or mass flows one way (TF → target), giving hierarchical organisation.
- **Weighted** edges: interaction reliability, expression change one gene induces in another, sequence similarity.

**Adjacency matrix:** $A_{ij} = 1$ if there is an edge i–j (or its weight). For an undirected, unweighted graph, A is **symmetric** with a zero diagonal (no self-loops). Biological networks are sparse, so adjacency **lists** are used in practice.

**Types of biological networks:** PPI networks, metabolic networks, genetic interaction networks, gene/transcriptional regulatory networks, cell-signalling networks. **Sources:** manual curation of literature, high-throughput experiments (yeast two-hybrid, affinity purification–mass spectrometry), computational predictions, text mining (databases: STRING, BioGRID, IntAct, KEGG, Reactome).

**The interactome** = the totality of PPIs in a cell, organism or context. PPIs are specific, occur between defined binding regions and serve a function. Knowing them helps **assign roles to uncharacterized proteins** (guilt by association), detail **signalling pathways** and characterise **complexes** (e.g., the proteasome).

## Topology: degree, paths, diameter

- **Degree** k(v) = number of edges at v (in/out-degree for directed graphs).
- **Shortest path** d(u, v) = fewest edges between u and v, computed by BFS. It models how information or signals flow.
- **Diameter** = the maximum shortest-path distance over all pairs; **average path length** = the mean.
- **Degree distribution** P(k) = fraction of nodes with degree k.

{{widget:centrality preset="Quiz graph G"}}

## Small world, scale-free and hubs

**Small-world effect:** PPI networks are highly connected, with a **small diameter (few steps between any two proteins) no matter how big the network is**. Typically, the average path length grows only logarithmically with the number of nodes, while local clustering is high.

:::exam Final Q3(a): small-world effect and its implications
**What:** most pairs of nodes are linked by a short path (small diameter / average path length that grows ~log n), even in very large networks, usually together with high clustering.
**Implications:**
- **Efficient, fast signal propagation** across the cell; few steps from a receptor to the nucleus.
- Perturbations can **spread quickly**: a mutation or drug effect can reach distant processes (side effects, disease spreading through modules).
- Yet the network is **robust**: why doesn't a single failure wreck everything? Most nodes have low degree, and **hubs** (scale-free structure) keep paths short even after random failures.
- **Vulnerability:** targeted loss of hubs destroys the short paths and fragments the network; hubs are often essential/disease genes and drug targets.
:::

**Scale-free networks:** a degree distribution that roughly follows a **power law** $P(k) \sim k^{-\gamma}$: **many low-degree nodes and a few highly connected hubs**. (Barabási–Albert “preferential attachment”: new nodes link preferentially to already well-connected nodes.)

- **Stability under random failure:** random failures mostly hit low-degree nodes; even losing a hub rarely disconnects the network, thanks to other hubs.
- **Scale invariance:** properties stay similar whatever the network size; hubs make the small-world effect persist as the network grows.
- **Vulnerability to targeted attack:** removing a few major hubs breaks the network into isolated pieces. Hubs are enriched in **essential/lethal genes**, and many cancer proteins are hubs (e.g., **p53**).

{{widget:robustness}}

:::warn Researcher's note
How strictly biological networks are “scale-free” is debated (Broido & Clauset, *Nature Communications* 2019 found strong power laws are rare across real networks). Incomplete, biased interaction data also distort degree distributions. Treat “scale-free” as “heavy-tailed with hubs”.
:::

## Transitivity, modules, complexes and motifs

**Transitivity / clustering coefficient:** the tendency of a node's neighbors to be connected to each other (closing triangles). Local clustering of v = (links among v's neighbors) / (k(k − 1)/2). **High transitivity** means the network contains **communities**: densely interconnected groups that reflect **functional modules** and **protein complexes**.

Know these definitions precisely (Quiz 5):
- **Community/cluster:** nodes more connected among themselves than to the rest.
- **Module:** an exchangeable **functional unit** whose intrinsic properties don't change in a different context; its proteins need **not** interact at the same time or place.
- **Protein complex:** proteins interacting **at the same time and place**, forming stable multi-protein machinery.
- **Clique:** every node connected to every other.
- **Network motif:** a **statistically over-represented subgraph** with a characteristic dynamical behaviour (e.g., **negative feedback loop**, feed-forward loop), not a hub or a component.

## Centrality: which protein matters most?

- **Degree centrality:** number of neighbors (hubs).
- **Closeness centrality:** how close a node is to everyone else:
$$C(v) = \frac{n-1}{\sum_{j\neq v} d(v, j)}$$
- **Betweenness centrality:** the fraction of shortest paths passing through v, summed over node pairs:
$$B(v) = \sum_{s\neq v\neq t}\frac{\sigma_{st}(v)}{\sigma_{st}}$$
High-betweenness nodes are **bottlenecks** controlling information flow, which makes them candidates in signalling pathways and as **drug targets**.
- Others: eigenvector centrality / PageRank (random walks).

:::exam Quiz 5 graphs (computed in the widget)
**Graph G** (A–B, A–C, B–C, B–D, C–D, D–E): degree(B) = **3**; diameter **3** (A to E); closeness(B) = 4/(1+1+1+2) = **0.8**; highest betweenness **D** (= 3; every path to E passes through D).
**Graph J** (P–Q, Q–R, R–S, R–U, S–T): degree(R) = **3**; diameter **4** (P to T); closeness(R) = 5/7 ≈ **0.71 → “0.70”**; highest betweenness **R** (= 8).
**Graph K** (V–W, W–X, W–Y, X–Z): degree(W) = **3**; diameter **3**; closeness(W) = 4/5 = **0.8**; highest betweenness **W** (= 5).
:::

{{game:hub-hunter}}

## Clustering analysis: Girvan–Newman

**Girvan–Newman** (a greedy divisive algorithm): edges *between* communities carry many shortest paths, so they have high **edge betweenness**.
1. Compute edge betweenness for all edges.
2. Remove the highest one.
3. Recompute and repeat. The connected components that appear are the communities (giving a hierarchy).

It is “naïve”: it will report communities even when they're only marginally denser than the rest, and it is slow (O(m²n)). Modern alternatives optimize **modularity** (Louvain, Leiden) or use MCL (Markov clustering) for PPI complexes.

{{widget:girvan-newman}}

:::sota Where network biology is going
- **Network medicine:** disease genes cluster into “disease modules” in the interactome; drug repurposing by network proximity.
- **Graph neural networks** for drug–target interaction, protein function and polypharmacy side effects.
- Single-cell **gene regulatory network** inference (SCENIC) and spatial cell–cell communication networks.
:::
