Genes and proteins don't act alone: they bind each other, regulate each other and pass signals along chains. The "omics" era produced data on thousands of interactions at once, which calls for **systems-level** analysis. **Network biology** represents biological systems as graphs and analyzes them with graph theory, borrowing heavily from social-network analysis (the same questions: who is central, who is in which community, how fast does something spread?). The lecture follows the EMBL-EBI course *Network analysis of protein interaction data*.

## Graphs, edges and adjacency matrices

- **Nodes** are biological entities: proteins, genes, metabolites. **Edges** are interactions or relationships between them.
- **Undirected** edges: physical **protein–protein interaction (PPI)** networks. If A binds B, then B binds A.
- **Directed** edges: **metabolic** and **gene regulatory** networks, where a signal or mass flows one way (a transcription factor → its target gene), giving a hierarchical organisation.
- **Weighted** edges: the reliability of an interaction, how strongly one gene's change affects another's expression, or sequence similarity.

{{ref:algo#graphs-the-basics}}

**Adjacency matrix:** $A_{ij} = 1$ if there is an edge between i and j (or the edge's weight). For an undirected, unweighted graph, A is **symmetric** with zeros on the diagonal (no self-loops). Biological networks are **sparse** (each protein interacts with a handful of others, not thousands), so adjacency **lists** are used in practice.

**Example.** The graph G with edges A–B, A–C, B–C, B–D, C–D, D–E has adjacency matrix

| | A | B | C | D | E |
|---|---|---|---|---|---|
| A | 0 | 1 | 1 | 0 | 0 |
| B | 1 | 0 | 1 | 1 | 0 |
| C | 1 | 1 | 0 | 1 | 0 |
| D | 0 | 1 | 1 | 0 | 1 |
| E | 0 | 0 | 0 | 1 | 0 |

Each row sum is that node's degree (B has 3). We'll use this graph throughout the lesson.

**Types of biological networks:** PPI networks, metabolic networks, genetic interaction networks, gene/transcriptional regulatory networks, and cell-signalling networks.

**Where the edges come from:** manual curation of the literature; high-throughput experiments (**yeast two-hybrid**, which tests pairs of proteins for binding, and **affinity purification–mass spectrometry**, which pulls down a protein with its partners); computational predictions; and text mining. Databases: STRING, BioGRID, IntAct, KEGG, Reactome.

{{ref:tools#databases-you-will-use}}

**The interactome** is the totality of PPIs in a cell, organism or context. PPIs are specific, happen between defined binding regions, and serve a function. Knowing them helps **assign roles to uncharacterized proteins** ("guilt by association": a protein whose partners all work in DNA repair probably does too), map **signalling pathways**, and characterize **protein complexes** such as the proteasome.

## Topology: degree, paths, diameter

**Topology** means the shape of the network: who connects to whom.

- **Degree** k(v): the number of edges at node v (in-degree and out-degree for directed graphs).
- **Shortest path** d(u, v): the fewest edges you must traverse from u to v. It models how directly a signal can travel. Computed by **breadth-first search** from u.
- **Diameter:** the largest shortest-path distance over all pairs, the "width" of the network. **Average path length:** the mean over all pairs.
- **Degree distribution** P(k): the fraction of nodes with degree k. Its shape (next section) says a lot about how the network behaves.

**In graph G:** d(A, E) = 3 (A → B → D → E, or A → C → D → E), and no pair is further apart, so the diameter is **3**.

{{ref:algo#breadth-first-and-depth-first-search}}

{{widget:centrality preset="Quiz graph G"}}

## Small world, scale-free and hubs

**The small-world effect.** PPI networks are highly connected, with **a small diameter, so few steps separate any two proteins, no matter how big the network is**. Typically, the average path length grows only logarithmically with the number of nodes, while local clustering stays high. (It's the biological version of "six degrees of separation".)

:::story An airline route map
Look at a map of airline routes. Most airports have a handful of routes, while a few hubs (Dubai, Istanbul, Singapore) connect to hundreds. You can get between almost any two cities in two or three flights, because you route through a hub: that is the **small-world** effect. Protein interaction networks look the same: many proteins with few partners, a few hub proteins with very many.

The airline picture also explains robustness. A small regional airport closing barely matters to anyone else (random failure). Closing two or three major hubs strands passengers everywhere (targeted attack).
:::

:::example The small-world effect and what it implies
**What it is:** most pairs of nodes are linked by a short path (a small diameter, or an average path length growing like log n), even in very large networks, usually together with high clustering.

**Implications:**
- **Efficient, fast signal propagation** across the cell: few steps from a receptor at the membrane to the nucleus.
- Perturbations can **spread quickly**: a mutation or drug can reach distant processes (side effects; disease spreading through modules).
- Yet the network is **robust**: most nodes have low degree, and **hubs** (scale-free structure, below) keep paths short even after random failures.
- **Vulnerability:** losing hubs destroys the short paths and fragments the network. Hubs are often essential genes, disease genes and drug targets.
:::

**Scale-free networks** have a degree distribution that roughly follows a **power law**:

$$P(k) \sim k^{-\gamma}$$

That means **many nodes with few connections and a few highly connected hubs**. Compare a random network, where most nodes have about the average degree and hubs are essentially absent. The Barabási–Albert model explains power laws by **preferential attachment**: new nodes link preferentially to nodes that are already well connected ("the rich get richer"), as a new protein created by gene duplication inherits its parent's partners.

Hear it from the scientist who named scale-free networks:

{{video:RfgjHoVCZwU}}

**Consequences of scale-free structure:**
- **Stable under random failure:** random failures mostly hit low-degree nodes (there are so many of them), and even losing one hub rarely disconnects the network, thanks to the other hubs.
- **Scale invariance:** properties look similar whatever the network size; hubs keep the small-world effect as the network grows.
- **Vulnerable to targeted attack:** removing a few major hubs breaks the network into isolated pieces. Hubs are enriched in **essential (lethal-when-deleted) genes**, and many cancer proteins are hubs, **p53** being the classic example.

:::think Hubs are often essential genes and drug targets. Why is that both an opportunity and a risk?
**Opportunity:** knocking out a hub disrupts many pathways at once, which is what you want against a pathogen or a cancer cell that depends on it. **Risk:** the same hub usually does essential work in healthy cells too, so drugs that hit it tend to be toxic, with many side effects. That is why network medicine often looks for targets that are central to a **disease module** but not to the whole interactome.
:::

Try both kinds of attack in the widget: remove random nodes, then remove the hubs.

{{widget:robustness}}

:::warn Researcher's note
How strictly biological networks are "scale-free" is debated: Broido & Clauset (*Nature Communications*, 2019) found that strong power laws are rare across real networks. Interaction data are also incomplete and biased (well-studied proteins have more known partners), which distorts degree distributions. Treat "scale-free" as "heavy-tailed, with hubs".
:::

## Transitivity, modules, complexes and motifs

**Transitivity**, measured by the **clustering coefficient**, is the tendency of a node's neighbours to be connected to each other: if A interacts with B and with C, do B and C interact too (closing a triangle)? The local clustering coefficient of a node v with degree k is

$$C(v) = \frac{\text{number of edges among v's neighbours}}{k(k-1)/2}$$

**Example.** In graph G, B's neighbours are A, C and D. Among them, A–C and C–D are edges but A–D is not: 2 of the 3 possible edges, so C(B) = **2/3**.

**High transitivity** means the network contains **communities**: densely interconnected groups that often reflect **functional modules** and **protein complexes**.

Know these definitions precisely; they are easy to mix up:
- **Community (cluster):** nodes more connected among themselves than to the rest of the network.
- **Module:** a **functional unit** that is exchangeable and whose intrinsic properties don't change in a different context. Its proteins need **not** interact at the same time or place.
- **Protein complex:** proteins interacting **at the same time and place**, forming a stable multi-protein machine.
- **Clique:** a set of nodes in which every node is connected to every other.
- **Network motif:** a small subgraph that is **statistically over-represented** compared with random networks and has a characteristic dynamical behaviour, such as a **negative feedback loop** or a **feed-forward loop**. (Not a hub, and not a component.) The plant circadian clock from the Introduction is a negative feedback loop.

:::think Can two proteins belong to the same module even if they never physically bind?
Yes. A **module** is a functional unit: its members cooperate in one task but need not interact at the same time or place (think of the successive enzymes of a pathway, linked through a chain of partners). A **protein complex** is stricter: its members bind each other at the same time and place to form one machine. Every complex is part of some module, but not every module is a complex.
:::

{{ref:intro#gene-regulation-when-and-how-much}}

## Centrality: which protein matters most?

Watch this overview of the main centrality measures first:

{{video:NgUj8DEH5Tc}}

Different definitions of "important" give different centralities:

- **Degree centrality:** the number of neighbours. High-degree nodes are **hubs**.
- **Closeness centrality:** how close a node is to everyone else, on average:
$$C(v) = \frac{n-1}{\sum_{j\neq v} d(v, j)}$$
A node with closeness 1 is adjacent to every other node.
- **Betweenness centrality:** how many shortest paths pass **through** v, summed over all pairs of other nodes (counting a fraction when there are several shortest paths):
$$B(v) = \sum_{s\neq v\neq t}\frac{\sigma_{st}(v)}{\sigma_{st}}$$
where $\sigma_{st}$ is the number of shortest paths from s to t and $\sigma_{st}(v)$ the number that pass through v. High-betweenness nodes are **bottlenecks** controlling the flow of information between parts of the network, which makes them candidates in signalling pathways and as **drug targets**, even when their degree is low.
- Others: **eigenvector centrality** and **PageRank** (a node is important if its neighbours are important; computed with random walks).

:::story Degree, closeness and betweenness in one town
- **Degree** is how many friends you have.
- **Closeness** is how quickly news from you can reach everyone in town.
- **Betweenness** is how many of the town's shortest routes pass through your house. A bridge between two halves of a town has enormous betweenness even if it has only two roads: block it and the halves can't talk. Girvan–Newman, below, finds communities by removing exactly these bridges.
:::

:::example Centralities in three small graphs (check them in the widget)
**Graph G** (A–B, A–C, B–C, B–D, C–D, D–E): degree(B) = **3**; diameter **3** (A to E). Closeness of B: distances to A, C, D, E are 1, 1, 1, 2, summing to 5, so closeness(B) = 4/5 = **0.8**. Highest betweenness: **D** (= 3), because every shortest path from A, B or C to E must pass through D.

**Graph J** (P–Q, Q–R, R–S, R–U, S–T): degree(R) = **3**; diameter **4** (P to T); closeness(R) = 5/7 ≈ **0.71** (given as "0.70" in the course options); highest betweenness **R** (= 8).

**Graph K** (V–W, W–X, W–Y, X–Z): degree(W) = **3**; diameter **3**; closeness(W) = 4/5 = **0.8**; highest betweenness **W** (= 5).
:::

{{game:hub-hunter}}

## Clustering analysis: Girvan–Newman

How do we find the communities automatically? **Girvan–Newman** is a greedy, divisive algorithm built on one observation: the few edges that run **between** communities carry many shortest paths (all traffic between the communities must cross them), so they have high **edge betweenness**.

1. Compute the edge betweenness of every edge (the edge version of betweenness centrality).
2. **Remove** the edge with the highest betweenness.
3. Recompute edge betweenness and repeat. As edges between communities disappear, the network falls apart into connected components: the communities. Recording the order of splits gives a hierarchy, like a dendrogram.

This worked example computes edge betweenness and removes edges step by step:

{{video:aWzSsPO3uuw}}

**Limitations.** It is "naïve": it will report communities even when they are only marginally denser than the rest, and it is slow (O(m²n) for m edges and n nodes, because betweenness is recomputed after every removal). Modern alternatives optimize **modularity** (the Louvain and Leiden algorithms, also used to cluster cells in single-cell analysis) or use **MCL** (Markov clustering) to find protein complexes.

{{ref:expression1#hierarchical-clustering}}

{{widget:girvan-newman}}

:::sota Where network biology is going
- **Network medicine:** disease genes cluster into "disease modules" in the interactome; drugs can be repurposed by measuring their network proximity to a disease module.
- **Graph neural networks** for drug–target interaction, protein function and polypharmacy side effects.
- Single-cell **gene regulatory network** inference (SCENIC), and spatial cell–cell communication networks built from ligand–receptor pairs.
:::
