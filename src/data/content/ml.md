You have RNA-seq from labelled normal and tumor lung tissue. A new sample arrives: is it a tumor? You have sequences of known toxic and non-toxic peptides. Is a new peptide toxic? This is **supervised learning**: learn a function from labelled examples, then predict labels for new ones. This module follows the lecture's 7-step pipeline and Libbrecht & Noble's review *Machine learning applications in genetics and genomics* (Nat Rev Genet 2015).

## Unsupervised vs supervised sample classification

- **Unsupervised route:** cluster or project the data (hierarchical clustering, k-means, fuzzy k-means after MDS, PCA), look at where the labelled samples fall, and label the unknown sample by its nearest known samples.
- **Supervised route:** use the labels to learn which features *separate* the classes, and evaluate with **cross-validation** to avoid overfitting.

Supervised learning is usually far more accurate when good labels exist. Unsupervised learning finds structure you didn't know to look for. Libbrecht & Noble also distinguish **generative** models (model how data are produced, e.g., HMMs and naive Bayes; interpretable, handle missing data) from **discriminative** models (directly model the decision boundary, e.g., SVMs, neural nets; often more accurate).

## The 7-step pipeline

1. **Problem formulation**
2. **Data collection**
3. **Feature extraction**
4. **Feature selection**
5. **Classification algorithm**
6. **Testing** (metrics + sampling)
7. **Deployment** (e.g., a web server)

## Step 1–2: formulate and collect

**What can we predict?** For DNA: origins of replication, promoters, enhancers, recombination hot-spots, methylation sites, protein-binding sites. For RNA: subcellular location, coding vs non-coding, editing sites, RNA types. For proteins: inflammatory vs anti-inflammatory, toxicity, antiviral activity, bacteriophage proteins, DNA-binding, localization. Also structures and interactions (drug–target, protein–protein). Usually: **input = a sequence, output = a class or property** (binary, multi-class or multi-label).

**Data** come from validated sources: experiments (in vitro) → literature → curated databases (UniProt, PDB, GEO…). Two classic problems:

- **Imbalance:** positives are often far fewer (or negatives are missing entirely). Fix with **undersampling** the majority class, **oversampling** the minority (duplication, **SMOTE**), class weights, or generative augmentation.
- **Redundancy:** homologous (very similar) sequences inflate performance because train and test contain near-copies. Remove them with sequence clustering (**CD-HIT** at e.g. 30–40% identity) *before* splitting.

For established problems, use published **benchmark datasets** (and compare fairly).

## Step 3: features

Models need numbers. **Feature types:**

- **Sequence-based:** k-mer (nucleotide) or amino-acid / dipeptide composition, gapped k-mers, position-specific encodings (one-hot).
- **Physico-chemical:** hydrophobicity, charge, polarity, molecular weight, isoelectric point (pseudo-amino-acid composition combines these with order information).
- **Evolutionary:** **PSSM** profiles from PSI-BLAST or HMM profiles. Conservation is highly predictive.
- **Structural:** predicted secondary structure, solvent accessibility, disorder; or features from AlphaFold-predicted 3D structures.
- **Embeddings:** learned vectors from models like dna2vec, ProtVec, or **protein language models** (ESM-2, ProtT5). Today these are usually the strongest single feature set.

We prefer features that are **cheap to generate** and **human-interpretable**. Most need **scaling** (standardize or min–max), especially for distance-based models like KNN.

{{widget:kmer-features}}

:::exam Final Q3(c): features for predicting protein function from sequence
1. **Composition:** amino-acid composition (20-D), dipeptide/tripeptide (k-mer) composition, k-spaced residue pairs.
2. **Physico-chemical** profiles: hydrophobicity, charge, polarity, molecular weight, pI, pseudo-AAC.
3. **Evolutionary information:** PSSM / profile-HMM from homologs; **homology transfer** via BLAST hits to annotated proteins.
4. **Structural features:** predicted secondary structure, solvent accessibility, disorder, or AlphaFold-predicted structure (contacts, pockets).
5. **Domains & motifs:** Pfam/InterPro domain presence, signal peptides, transmembrane segments.
6. **Learned embeddings:** protein language-model embeddings (ESM-2, ProtT5), dna2vec-style k-mer embeddings.
7. **Context** (if allowed): PPI-network neighbors, co-expression, GO annotations of partners.
:::

## Step 4: feature selection

Too many features → overfitting, slow training, the curse of dimensionality. Select informative ones:

- **Filter methods:** score each feature independently of the model (variance, correlation, χ², mutual information, t-test) and keep the top ones. Fast.
- **Wrapper methods:** search feature subsets using the model's own performance (forward selection, backward elimination, recursive feature elimination). Accurate but expensive.
- **Embedded:** selection inside training (L1/lasso, tree importances).
- Or reduce dimensionality (PCA).

:::warn Data leakage
Supervised feature selection (and any fitted preprocessing, like scaling) must use **only the training data**. Selecting features on the full dataset and then cross-validating gives optimistic, invalid results. It is one of the most common errors in bioinformatics ML papers.
:::

## Step 5: choose a classifier, e.g. KNN

“Use the simplest model that explains the data best.” **k-nearest neighbors:** store the training set; to classify x, find its k closest training samples (Euclidean distance on scaled features) and take a majority vote. No training phase. Small k overfits (jagged boundaries); large k underfits.

{{widget:knn}}

Other workhorses: logistic regression, SVMs, random forests, gradient boosting (XGBoost), and neural networks (next module).

## Step 6: testing — metrics and sampling

**Confusion matrix** → metrics:
$$\text{Precision} = \frac{TP}{TP+FP},\ \ \text{Recall} = \frac{TP}{TP+FN},\ \ F_1 = \frac{2PR}{P+R}$$
$$\text{MCC} = \frac{TP\cdot TN - FP\cdot FN}{\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}$$

- **Accuracy/error:** fine only for balanced classes.
- **F1, MCC:** robust to imbalance (MCC uses all four cells and ranges −1…1).
- **AUROC:** threshold-free ranking quality. **AUPR:** better than AUROC when positives are rare.

{{widget:confusion}}

{{game:metric-match}}

**Sampling strategies:** train–test split; train–validation–test (tune hyperparameters on validation only); **k-fold cross-validation** (stratified, so each fold keeps class ratios); an independent test set from a different source is the gold standard.

## Step 7: deployment

Publish a usable tool: a web server or package. Example from the slides: **ToxinPred2** (Raghava lab, IIIT-Delhi), which predicts peptide/protein toxicity from sequence in batch.

:::sota Where the field is now
- Protein-function prediction is dominated by **protein language-model embeddings + light classifiers**, and by structure-aware models.
- Genomics uses deep sequence models (Enformer, AlphaGenome) to predict regulatory activity directly from DNA.
- Rigorous evaluation (homology-aware splits, held-out organisms) matters more than the choice of classifier.
:::
