import type { Concept } from './types';

// id | label | group | home module | prerequisite concept ids
const TABLE = `
dna|DNA & base pairing|bio|intro|
revcomp|Reverse complement|bio|intro|dna
central-dogma|Central dogma|bio|intro|dna
replication|DNA replication|bio|intro|dna
genetic-code|Genetic code & codons|bio|intro|central-dogma
protein-structure|Protein structure|bio|intro|genetic-code
gene-regulation|Gene regulation & TFs|bio|intro|central-dogma
probability|Probability|math|math|
bayes|Bayes' rule|math|math|probability
log-odds|Likelihood & log-odds|math|math|probability
entropy|Entropy|math|math|probability
kl|KL divergence|math|math|entropy
covariance|Covariance|math|math|probability
eigen|Eigenvectors|math|math|covariance
gradient|Gradients|math|math|
distance-measures|Distance measures|math|math|
complexity|Big-O complexity|cs|algo|
hashing|Hashing|cs|algo|complexity
greedy-alg|Greedy algorithms|cs|algo|complexity
dp|Dynamic programming|cs|algo|complexity
randomized-alg|Randomized algorithms|cs|algo|probability
graph-alg|Graph algorithms|cs|algo|complexity
em-pattern|Alternating optimization (EM)|cs|algo|randomized-alg
np-hard|NP-hardness|cs|algo|complexity
databases|Biological databases|bio|tools|
file-formats|File formats|cs|tools|
pipelines|Analysis pipelines|cs|tools|file-formats
gene-ontology|Gene Ontology|bio|tools|databases
enrichment|Enrichment analysis|math|tools|gene-ontology,probability
kmer|k-mers|cs|oric|dna
frequent-words|Frequent words|cs|oric|kmer,hash-map
hash-map|Frequency tables|cs|oric|hashing
clump|Clumps|cs|oric|frequent-words
oric|Origin of replication|bio|oric|replication
skew|GC skew diagram|bio|oric|oric
hamming|Hamming distance|cs|oric|kmer
approx-matching|Approximate matching|cs|oric|hamming,revcomp
motif|Regulatory motifs|bio|motifs|gene-regulation,kmer
profile|Profile matrix|math|motifs|motif,probability
consensus|Consensus & score|cs|motifs|profile,hamming
median-string|Median string|cs|motifs|consensus
greedy|GreedyMotifSearch|cs|motifs|profile,greedy-alg
pseudocounts|Pseudocounts|math|motifs|profile
randomized|RandomizedMotifSearch|cs|motifs|greedy,randomized-alg
gibbs|Gibbs sampler|cs|motifs|randomized,pseudocounts
composition|k-mer composition|cs|assembly|kmer
overlap-graph|Overlap graph|cs|assembly|composition,graph-alg
hamiltonian|Hamiltonian path|cs|assembly|overlap-graph,np-hard
debruijn|de Bruijn graph|cs|assembly|composition,graph-alg
eulerian|Eulerian path|cs|assembly|debruijn
read-pairs|Read pairs|bio|assembly|eulerian
contigs|Contigs & scaffolds|cs|assembly|eulerian
repeats|Repeats|bio|assembly|dna
hgp|Human Genome Project|bio|sequencing|dna
sbs|Sequencing by synthesis|bio|sequencing|replication
phred|Phred quality|math|sequencing|sbs,probability
fastq|FASTQ|cs|sequencing|phred,file-formats
long-reads|Long reads|bio|sequencing|sbs
seq-assays|-seq assays|bio|sequencing|sbs
naive-matching|Naive matching|cs|readmap|complexity
boyer-moore|Boyer-Moore|cs|readmap|naive-matching
kmer-index|k-mer index|cs|readmap|hashing,kmer
index-variants|Index subsampling|cs|readmap|kmer-index
edit-distance|Edit distance|cs|readmap|dp,hamming
pigeonhole|Pigeonhole principle|cs|readmap|kmer-index,edit-distance
fm-index|BWT / FM-index|cs|readmap|kmer-index
microarray|Microarrays|bio|expression1|central-dogma
rnaseq|RNA-seq|bio|expression1|seq-assays,microarray
scrnaseq|scRNA-seq|bio|expression1|rnaseq
expression-matrix|Expression matrix|math|expression1|rnaseq
kmeans|k-means|ml|expression1|expression-matrix,distance-measures
kmeanspp|k-means++|ml|expression1|kmeans,randomized-alg
soft-kmeans|Soft k-means|ml|expression1|kmeans
em|EM algorithm|ml|expression1|soft-kmeans,em-pattern
hierarchical|Hierarchical clustering|ml|expression1|distance-measures
dim-reduction|Dimensionality reduction|ml|expression2|expression-matrix
pca|PCA|ml|expression2|eigen,dim-reduction
mds|MDS|ml|expression2|dim-reduction,distance-measures
sne|SNE|ml|expression2|kl,dim-reduction
crowding|Crowding problem|ml|expression2|sne
tsne|t-SNE|ml|expression2|crowding,gradient
umap|UMAP|ml|expression2|tsne
scoring|Scoring matrices|bio|alignment|protein-structure
global-alignment|Needleman–Wunsch|cs|alignment|dp,scoring
local-alignment|Smith–Waterman|cs|alignment|global-alignment
affine-gap|Affine gaps|cs|alignment|global-alignment
blast|BLAST|cs|alignment|local-alignment,kmer-index
msa|Multiple alignment|cs|alignment|global-alignment,np-hard
tree|Phylogenetic trees|bio|phylogeny|
distance-matrix|Distance matrices|math|phylogeny|msa,distance-measures
additive|Additive matrices|math|phylogeny|distance-matrix,tree
limb-length|Limb length|cs|phylogeny|additive
ultrametric|Ultrametric trees|bio|phylogeny|tree
upgma|UPGMA|cs|phylogeny|ultrametric,hierarchical
neighbor-joining|Neighbor joining|cs|phylogeny|limb-length
parsimony|Small parsimony|cs|phylogeny|tree,dp
hmm|Hidden Markov model|ml|hmm|probability
viterbi|Viterbi|cs|hmm|hmm,dp,log-odds
forward|Forward algorithm|cs|hmm|hmm,dp
posterior|Posterior decoding|math|hmm|forward,bayes
baum-welch|Baum–Welch|ml|hmm|posterior,em
cpg|CpG islands|bio|hmm|viterbi
gene-finding|Gene finding|bio|hmm|viterbi,genetic-code
profile-hmm|Profile HMMs|bio|hmm|hmm,msa
supervised|Supervised learning|ml|ml|
imbalance|Class imbalance|ml|ml|supervised
redundancy|Redundancy / homology|ml|ml|supervised,global-alignment
features|Feature extraction|ml|ml|supervised,kmer
feature-selection|Feature selection|ml|ml|features
knn|KNN|ml|ml|features,distance-measures
metrics|MCC, F1, AUROC|ml|ml|supervised
cross-validation|Cross-validation|ml|ml|metrics
leakage|Data leakage|ml|ml|cross-validation,feature-selection
linear-regression|Linear regression|ml|neural|
gradient-descent|Gradient descent|ml|neural|linear-regression,gradient
logistic|Logistic regression|ml|neural|gradient-descent
sigmoid|Sigmoid|ml|neural|logistic
neural-net|Neural networks|ml|neural|sigmoid
backprop|Backpropagation|ml|neural|neural-net,gradient
autoencoder|Autoencoders|ml|neural|neural-net,pca
vae|VAE|ml|neural|autoencoder,kl
embeddings|Embeddings (dna2vec)|ml|neural|neural-net,kmer
graph-types|Biological networks|bio|networks|gene-regulation,graph-alg
adjacency|Adjacency matrix|math|networks|graph-types
degree|Degree distribution|math|networks|adjacency
small-world|Small world|bio|networks|degree
scale-free|Scale-free & hubs|bio|networks|degree
transitivity|Clustering coefficient|math|networks|degree
modules|Modules & complexes|bio|networks|transitivity
centrality|Centrality|cs|networks|degree,graph-alg
girvan-newman|Girvan–Newman|cs|networks|centrality,modules
folding-problem|Protein folding problem|sota|structure-ai|protein-structure
coevolution|Co-evolution|sota|structure-ai|msa
alphafold2|AlphaFold 2|sota|structure-ai|coevolution,neural-net
plddt|pLDDT & PAE|sota|structure-ai|alphafold2
alphafold3|AlphaFold 3|sota|structure-ai|alphafold2
esmfold|ESMFold & PLMs|sota|structure-ai|alphafold2,embeddings
protein-design|Protein design|sota|structure-ai|alphafold3
alphamissense|AlphaMissense|sota|structure-ai|alphafold2
representation-learning|Representation learning|sota|genomic-ai|embeddings
contrastive|Contrastive learning|sota|genomic-ai|representation-learning
seq2function|Sequence-to-function|sota|genomic-ai|motif,neural-net
dna-lm|DNA language models|sota|genomic-ai|representation-learning
evo2|Evo 2|sota|genomic-ai|dna-lm
alphagenome|AlphaGenome|sota|genomic-ai|seq2function
single-cell-fm|Single-cell FMs|sota|genomic-ai|scrnaseq,representation-learning
variant-effect|Variant effect prediction|sota|genomic-ai|alphamissense,alphagenome
variant-calling|Variant calling|bio|modern-genomics|fm-index,phred
spatial|Spatial transcriptomics|bio|modern-genomics|scrnaseq
trajectory|Trajectory inference|ml|modern-genomics|scrnaseq,umap
comparative-genomics|Comparative genomics|bio|modern-genomics|tree,blast
dnds|dN/dS selection|bio|modern-genomics|comparative-genomics,genetic-code
crispr|CRISPR|bio|modern-genomics|approx-matching
pangenome|Pangenome graphs|sota|modern-genomics|debruijn,long-reads
`;

export const CONCEPTS: Concept[] = TABLE.trim()
  .split('\n')
  .map((line) => {
    const [id, label, group, module, req] = line.split('|');
    return { id, label, group: group as Concept['group'], module, requires: req ? req.split(',') : [] };
  });

export const CONCEPT_BY_ID = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
