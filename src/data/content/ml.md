You have RNA-seq data from labelled normal and tumour lung tissue. A new sample arrives: is it a tumour? You have the sequences of known toxic and non-toxic peptides. Is a new peptide toxic? Both are **supervised learning** problems: learn a function from **labelled examples**, then predict the label of new ones. This lesson follows the lecture's 7-step pipeline and Libbrecht & Noble's review *Machine learning applications in genetics and genomics* (Nature Reviews Genetics, 2015). The focus is less on any one algorithm and more on doing the whole process correctly, which is where most real mistakes happen.

## Unsupervised vs supervised sample classification

There are two ways to classify the new lung sample:

- **Unsupervised route:** cluster or project all the samples without using labels (hierarchical clustering, k-means, PCA, MDS), see where the labelled samples fall, and label the new sample by the known samples it lands near.
- **Supervised route:** use the labels during training to learn **which features separate the classes**, and evaluate with **cross-validation** to make sure the model works on samples it hasn't seen.

When good labels exist, supervised learning is usually far more accurate, because it focuses on the differences that matter for the question. Unsupervised learning finds structure you didn't know to look for (a new tumour subtype, say).

:::story Sorting photos with and without an answer key
Give someone a thousand unlabelled photos of tissue samples and ask them to sort them into piles: they will group by whatever stands out (staining, lighting, tissue type), which may or may not be tumour vs normal. That is unsupervised learning. Give them the same photos with an answer key for half of them, and they learn to look at **the features that actually distinguish tumour from normal**. That is supervised learning, and it is why labels, when you trust them, usually win.
:::

{{ref:expression1#k-means-as-an-optimization-problem|expression2#pca-two-equivalent-views}}

**Generative vs discriminative models** (Libbrecht & Noble):
- **Generative** models describe how the data of each class are produced: $\Pr(x \mid \text{class})$. Examples: HMMs, naive Bayes. They are interpretable and handle missing data naturally.
- **Discriminative** models learn the boundary between classes directly: $\Pr(\text{class} \mid x)$ or just a decision rule. Examples: logistic regression, SVMs, neural networks. They are often more accurate when data are plentiful.

## The 7-step pipeline

The lecture organizes a supervised bioinformatics project into seven steps. The rest of the lesson goes through them one at a time.

1. **Problem formulation:** what exactly do we predict, from what?
2. **Data collection:** where do reliable labelled examples come from?
3. **Feature extraction:** turn sequences into numbers.
4. **Feature selection:** keep the informative numbers.
5. **Classification algorithm:** choose and train a model.
6. **Testing:** measure performance honestly (metrics and sampling).
7. **Deployment:** make the model usable by others (e.g., a web server).

## Step 1–2: formulate and collect

**What can we predict?** Almost anything that has a known answer for some examples:
- **DNA:** replication origins, promoters, enhancers, recombination hot-spots, methylation sites, protein-binding sites.
- **RNA:** subcellular location, coding vs non-coding, editing sites, RNA types.
- **Proteins:** inflammatory vs anti-inflammatory, toxicity, antiviral activity, bacteriophage proteins, DNA-binding, subcellular localization.
- **Interactions:** drug–target, protein–protein.

Usually the **input is a sequence** and the **output is a class** (binary, multi-class, or multi-label when an item can have several labels at once) or a number (regression).

**Data** come from validated sources: experiments (in vitro), the literature, and curated databases (UniProt, PDB, GEO…). For well-studied problems, use published **benchmark datasets**, which makes fair comparison with other methods possible.

{{ref:tools#databases-you-will-use}}

Two classic data problems:

- **Class imbalance.** Positives are often far fewer than negatives (few peptides are toxic), or negatives are missing entirely (nobody publishes "this protein does *not* bind DNA"). A model can then score high accuracy by always predicting the majority class. Fixes: **undersample** the majority class, **oversample** the minority (duplication, or **SMOTE**, which creates synthetic examples between minority neighbours), class weights in the loss, or generative augmentation.
- **Redundancy.** Homologous (very similar) sequences in both the training and test sets inflate performance: the model just recognizes near-copies. Remove redundancy by **clustering sequences** (e.g., with **CD-HIT** at 30–40% identity) and keeping one per cluster, or by splitting so that whole clusters go to either training or test, **before** splitting the data.

## Step 3: features

Models need numbers. **Feature extraction** turns each sequence into a fixed-length vector.

**k-mer composition** is the simplest and most common. Count each k-mer and divide by the number of k-mers. For `ACGTAC` with k = 2, the five 2-mers are AC, CG, GT, TA, AC, so the vector has AC = 2/5, CG = GT = TA = 1/5, and the other 12 dinucleotides 0. Any length of sequence becomes a 16-dimensional vector.

{{ref:oric#the-hidden-message-dnaa-boxes|math#counting-how-big-is-the-search-space}}

**Feature types:**
- **Sequence-based:** nucleotide k-mer or amino-acid/dipeptide composition, gapped k-mers, position-specific encodings (one-hot).
- **Physico-chemical:** hydrophobicity, charge, polarity, molecular weight, isoelectric point. **Pseudo-amino-acid composition** combines these with sequence-order information.
- **Evolutionary:** **PSSM** profiles from PSI-BLAST, or HMM profiles. How conserved each position is across homologs is highly predictive of function.
- **Structural:** predicted secondary structure, solvent accessibility, disorder; or features from AlphaFold-predicted 3D structures.
- **Embeddings:** learned vectors from models like dna2vec, ProtVec, or **protein language models** (ESM-2, ProtT5). Today these are usually the strongest single feature set.

We prefer features that are **cheap to compute** and **interpretable**. Most need **scaling** (standardize to mean 0 and standard deviation 1, or min–max to [0, 1]), especially for distance-based models like KNN, where otherwise a feature with large values dominates the distance.

{{widget:kmer-features}}

:::example Features for predicting protein function from sequence
1. **Composition:** amino-acid composition (20-D), dipeptide or tripeptide (k-mer) composition, k-spaced residue pairs.
2. **Physico-chemical** profiles: hydrophobicity, charge, polarity, molecular weight, pI, pseudo-AAC.
3. **Evolutionary information:** PSSM or profile HMM from homologs; **homology transfer** from BLAST hits to annotated proteins.
4. **Structural features:** predicted secondary structure, solvent accessibility, disorder, or AlphaFold-predicted structure (contacts, pockets).
5. **Domains and motifs:** presence of Pfam/InterPro domains, signal peptides, transmembrane segments.
6. **Learned embeddings:** protein language-model embeddings (ESM-2, ProtT5), dna2vec-style k-mer embeddings.
7. **Context** (if allowed): interaction-network neighbours, co-expression partners, GO annotations of partners.
:::

## Step 4: feature selection

Thousands of features and a few hundred examples is a recipe for **overfitting**: the model memorizes noise that happens to separate the training set. Too many features also slow training and suffer from the curse of dimensionality (distances become less meaningful). So we select the informative ones:

- **Filter methods:** score each feature on its own, independently of the model (variance, correlation with the label, χ², mutual information, t-test), and keep the top ones. Fast and simple.
- **Wrapper methods:** search over subsets of features, judging each subset by the model's own validation performance (forward selection, backward elimination, recursive feature elimination). More accurate, but expensive.
- **Embedded methods:** selection happens inside training (L1/lasso regularization pushes useless weights to exactly zero; tree models give feature importances).
- Or reduce dimensionality instead (PCA), at the cost of interpretability.

:::warn Data leakage
Supervised feature selection, and any fitted preprocessing such as scaling, must use **only the training data**. If you select features using the full dataset and then cross-validate, the test folds have already influenced which features were chosen, and the results are optimistic and invalid. This is one of the most common errors in bioinformatics ML papers. Put every fitted step *inside* the cross-validation loop (scikit-learn's `Pipeline` does this for you).
:::

## Step 5: choose a classifier, e.g. KNN

"Use the simplest model that explains the data well." Start simple and add complexity only when it clearly helps.

**k-nearest neighbours (KNN):** store the training set. To classify a new point x, find its k closest training points (usually Euclidean distance on scaled features) and take a **majority vote** of their labels. There is no training phase at all.

- **Small k** (e.g., 1) follows every quirk of the training data: jagged decision boundaries, overfitting.
- **Large k** smooths too much and underfits.
- k is a **hyperparameter**, chosen on validation data.

:::story KNN is asking your neighbours
To guess whether a new house is in a rich or poor neighbourhood, look at the k houses nearest to it. Ask only the **single** nearest (k = 1) and one odd house next door can fool you: that is overfitting. Ask the **whole town** and every house gets the town's majority answer: that is underfitting. A good k asks enough neighbours to outvote the odd one, but not so many that you leave the neighbourhood.
:::

{{ref:math#distances-and-similarity}}

{{widget:knn}}

**Other workhorses:** logistic regression, SVMs, random forests, gradient boosting (XGBoost), and neural networks (next lesson). **Logistic regression** is the standard first model for binary classification: it outputs a probability via the sigmoid function. This StatQuest video explains it clearly, and the next lesson builds it from scratch:

{{video:yIYKR4sgzI8}}

## Step 6: testing — metrics and sampling

**The confusion matrix** counts the four possible outcomes for a binary classifier: true positives (TP), false positives (FP), true negatives (TN) and false negatives (FN). Every metric is computed from it:

$$\text{Precision} = \frac{TP}{TP+FP},\ \ \text{Recall} = \frac{TP}{TP+FN},\ \ F_1 = \frac{2PR}{P+R}$$
$$\text{MCC} = \frac{TP\cdot TN - FP\cdot FN}{\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}$$

- **Precision:** of the items predicted positive, what fraction really are? **Recall** (sensitivity): of the real positives, what fraction did we find?
- **Accuracy/error:** fine only for balanced classes.
- **F1** combines precision and recall; **MCC** uses all four cells and ranges from −1 to 1 (0 = no better than chance). Both are robust to imbalance.
- **AUROC:** threshold-free measure of how well the model ranks positives above negatives. **AUPR** (area under the precision–recall curve) is more informative than AUROC when positives are rare.

:::example Why accuracy misleads with imbalanced classes
1,000 peptides, 50 of them toxic. A model gives TP = 40, FN = 10, FP = 20, TN = 930.
- Precision = 40/60 ≈ **0.67**, recall = 40/50 = **0.80**, F1 ≈ **0.73**, MCC ≈ **0.71**, accuracy = 970/1000 = **0.97**.
- A useless model that predicts "non-toxic" for everything gets accuracy 950/1000 = **0.95**, almost the same, but recall 0 and MCC 0.

Accuracy barely distinguishes them; recall, F1 and MCC do.
:::

{{widget:confusion}}

{{game:metric-match}}

**Sampling strategies** (how to split data for honest evaluation):
- **Train–test split:** train on one part, report on the held-out part.
- **Train–validation–test:** tune hyperparameters (like k in KNN) on the validation set only, and touch the test set once at the end.
- **k-fold cross-validation:** split into k folds, train on k − 1 and test on the remaining one, rotate, and average. **Stratified** folds keep the class ratio in each fold.
- An **independent test set** from a different source (another lab, organism or time period) is the gold standard.

:::think Your model scores 0.95 MCC in cross-validation but much worse on another lab's data. What went wrong?
Common culprits:
- **Redundancy:** near-identical (homologous) sequences ended up in both training and test folds, so cross-validation measured memorization, not generalization.
- **Leakage:** feature selection, scaling or tuning used the whole dataset before splitting.
- **Batch effects and distribution shift:** the new lab uses a different protocol, instrument or population, so the features look different.
- **Overfitting to a small dataset:** too many features for too few examples.

Remedies: homology-aware splits (cluster sequences, e.g., with CD-HIT, and keep each cluster on one side), doing all fitted preprocessing inside the training folds, and always reporting an independent test set.
:::

## Step 7: deployment

A model helps others only if they can use it. Publish it as a **web server**, a package, or at least code and trained weights. Example from the slides: **ToxinPred2** (Raghava lab, IIIT-Delhi) predicts peptide and protein toxicity from sequence, in batch, through a web interface.

The practical skill behind all seven steps is writing correct code for biological data. This video from a bioinformatics ML channel shows the coding mindset, using Rosalind:

{{video:6oHl7hNWn2o}}

:::sota Where the field is now
- Protein-function prediction is dominated by **protein language-model embeddings + light classifiers**, and by structure-aware models.
- Genomics uses deep sequence models (Enformer, AlphaGenome) to predict regulatory activity directly from DNA.
- **Rigorous evaluation** (homology-aware splits, held-out organisms, strong simple baselines) matters more than the choice of classifier.
:::
