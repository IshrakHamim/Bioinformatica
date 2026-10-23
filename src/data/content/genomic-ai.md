The course's last syllabus items (representation learning, contrastive learning, alignment, generative AI) describe where genomics research is heading: **learn representations of DNA, RNA, proteins and cells from massive unlabeled data, then reuse them** for prediction and design. This module connects the course's ideas (k-mers, HMMs, embeddings, VAEs) to today's models.

## From k-mers to embeddings

- **One-hot / k-mer counts** (Modules 2, 13): simple, but high-dimensional, sparse, and every k-mer is equally different from every other.
- **dna2vec (2017)** and ProtVec learned dense k-mer embeddings with word2vec, so similar k-mers get similar vectors (cosine similarity tracks alignment scores).
- **Contextual embeddings** (transformers) give each position a vector that depends on its whole context. This is the basis of “language models” of biology.

**Representation learning recipe:** pretrain on huge unlabeled data with a self-supervised objective → reuse the representations for downstream tasks (fine-tuning or a light classifier on top).

**Self-supervised objectives:**
- **Masked language modeling** (BERT-style): hide tokens and predict them. Used by DNABERT, Nucleotide Transformer, ESM-2.
- **Autoregressive** (GPT-style): predict the next token. Used by Evo/Evo 2 and protein generators, and enables **generation/design**.
- **Contrastive learning:** pull together representations of two “views” of the same thing (augmentations, or paired modalities such as a protein and its text description, or RNA and ATAC profiles of the same cell) and push apart unrelated pairs. CLIP-style **alignment** of modalities lets you search one modality with another.
- **Autoencoding / VAEs** (Module 14): compress and reconstruct (e.g., scVI for single-cell data).

## Sequence-to-function models

Predict molecular measurements (TF binding, chromatin accessibility, expression) **directly from DNA sequence**:

| Year | Model | Idea |
|---|---|---|
| 2015 | DeepBind, DeepSEA | CNNs learn motif-like filters (data-driven PWMs!) to predict TF binding / chromatin marks |
| 2021 | **Enformer** (*Nature Methods*) | transformer with ~100 kb receptive field predicting thousands of tracks; distal enhancers |
| 2025–26 | **AlphaGenome** (Google DeepMind; API June 2025, *Nature* Jan 2026) | **1 Mb** input, predictions at single-base resolution across modalities (expression, splicing, accessibility, contacts…); scores how **non-coding variants** change regulation |

The convolution filters of these models rediscover the **regulatory motifs** from Module 3, now learned rather than searched for.

{{yt:V8lhUqKqzUc|AlphaGenome author roundtable (Google DeepMind)}}

## Genomic language models

- **DNABERT** (2021): BERT on human k-mer tokens.
- **Nucleotide Transformer** (*Nature Methods* 2025): 50 M – 2.5 B parameters, trained on 3,202 human genomes plus 850 genomes of diverse species.
- **Evo** (*Science* 2024) and **Evo 2** (Arc Institute; preprint Feb 2025, *Nature* 2026): autoregressive models at **single-nucleotide resolution**. Evo 2 comes in 7 B and 40 B parameter versions, was trained on over **9.3 trillion nucleotides** from more than 128,000 genomes across all domains of life, and has a context of up to **1 million** tokens. Without task-specific training it can classify variants (e.g., pathogenic vs benign **BRCA1** variants) and it can **generate** DNA, including bacteriophage genomes that were tested in the lab.

{{yt:o_w-E--u7GQ|Building Evo 2: A Language Model for DNA Generation (Arc Institute)}}

## Single-cell foundation models

Treat each cell as a “sentence” of genes ranked or binned by expression, and pretrain on tens of millions of cells:
- **Geneformer** (*Nature* 2023): rank-value encoding, ~30 M cells; in-silico perturbation to nominate disease targets.
- **scGPT** (*Nature Methods* 2024): generative pretraining on 33 M+ cells; cell-type annotation, batch integration, perturbation prediction.

:::warn Evaluate before you believe
Independent benchmarks (2023–2025) found that in zero-shot settings, single-cell and DNA foundation models sometimes **do not beat simple baselines** (highly variable genes + PCA, k-mer models, or supervised CNNs). As a researcher: use homology-aware or chromosome-held-out splits, compare against strong simple baselines (remember Module 13's leakage warning), and report uncertainty.
:::

## Variant effect prediction

A central research problem: given a variant, is it harmful?
- **Coding:** AlphaMissense (structure + evolution), protein language-model likelihoods (ESM: compare the log-probability of mutant vs wild-type residue).
- **Non-coding:** sequence-to-function models (Enformer, AlphaGenome) predict changes in regulatory tracks; genomic language models score how “surprising” a variant is.
- Clinical use always combines predictions with population frequency (gnomAD), segregation and functional assays (ACMG guidelines).

## How the course concepts map onto modern AI

| Course concept | Modern counterpart |
|---|---|
| Profile matrix / PWM (Module 3) | first-layer CNN filters; attention to motifs |
| HMM over sequence (Module 12) | transformers/state-space models (Evo's StripedHyena) |
| Alignment & MSA (Module 10) | MSA input to AlphaFold; pairwise embeddings |
| PCA / t-SNE (Module 8) | latent spaces of VAEs and foundation models, UMAP of embeddings |
| k-mer features (Module 13) | learned tokens and embeddings |
| Gibbs sampling / EM | diffusion and autoregressive sampling for design |
