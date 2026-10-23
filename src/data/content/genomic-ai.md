The last items on the course syllabus (representation learning, contrastive learning, alignment of modalities, generative AI) describe where genomics research is heading: **learn representations of DNA, RNA, proteins and cells from massive unlabelled data, then reuse them** for prediction and design. This lesson connects ideas you already know (k-mers, motif profiles, HMMs, embeddings, VAEs) to today's models, and explains how to judge them critically.

## From k-mers to embeddings

**How do we turn a sequence into numbers?** You've seen three answers in the course:

- **One-hot and k-mer counts** (oriC and Supervised Learning lessons): simple, but high-dimensional, sparse, and every k-mer is equally different from every other. ATGGC is as far from ATGGG as from CACGA.
- **Static embeddings:** dna2vec (2017) and ProtVec learned a dense vector per k-mer with word2vec, so similar k-mers get similar vectors (their cosine similarity tracks alignment scores).
- **Contextual embeddings** (transformers): each *position* gets a vector that depends on the **whole surrounding sequence**. The same k-mer gets different vectors in a promoter and in an intron. This is the basis of biological "language models".

{{ref:ml#step-3-features|neural#autoencoders}}

**The representation-learning recipe:**
1. **Pretrain** a large model on huge unlabelled data (all known protein sequences, thousands of genomes, millions of cells) with a **self-supervised** objective, one where the labels come from the data itself.
2. **Reuse** the learned representations for downstream tasks with few labels: fine-tune the model, or train a small classifier on its embeddings.

**Self-supervised objectives:**
- **Masked language modelling** (BERT-style): hide some tokens and train the model to predict them from context. To predict a masked amino acid well, the model must learn which residues are compatible at each position, which encodes evolutionary constraints. Used by DNABERT, Nucleotide Transformer, ESM-2.
- **Autoregressive modelling** (GPT-style): predict the next token from all previous ones. Used by Evo/Evo 2 and protein generators. Because it models $\Pr(\text{next token} \mid \text{past})$, you can sample from it to **generate** new sequences.
- **Contrastive learning:** pull together the representations of two "views" of the same thing (two augmentations, or paired modalities such as a protein and its text description, or the RNA and chromatin-accessibility profiles of the same cell) and push apart unrelated pairs. This CLIP-style **alignment** of modalities lets you search one modality with another.
- **Autoencoding / VAEs:** compress and reconstruct (for example scVI for single-cell data).

{{ref:math#probability-basics}}

**Attention in one paragraph.** A transformer layer lets every position compute a weighted average of information from every other position, with weights (attention) that the model learns depend on content. A position in an enhancer can thus "attend" to a promoter tens of thousands of bases away. Stacking many such layers builds the contextual embeddings above. The cost grows with the square of the sequence length, which is why long-context DNA models use special architectures.

This MIT lecture covers protein language models in computational biology in depth, if you want the full picture:

{{video:uPoFdCUqBWk}}

## Sequence-to-function models

A different use of deep learning: predict molecular measurements (where a transcription factor binds, how accessible the chromatin is, how much a gene is expressed) **directly from DNA sequence**, trained on large experimental datasets.

| Year | Model | Idea |
|---|---|---|
| 2015 | DeepBind, DeepSEA | CNNs learn motif-like filters (data-driven PWMs!) to predict TF binding and chromatin marks |
| 2021 | **Enformer** (*Nature Methods*) | a transformer with a ~100 kb receptive field predicting thousands of tracks; captures distal enhancers |
| 2025–26 | **AlphaGenome** (Google DeepMind; API June 2025, *Nature* Jan 2026) | **1 Mb** input, predictions at single-base resolution across modalities (expression, splicing, accessibility, contacts…); scores how **non-coding variants** change regulation |

**Connection to the course.** The first-layer convolution filters of these models are short weight matrices slid along the sequence, which is exactly what scanning DNA with a motif **profile** does. Trained models rediscover the **regulatory motifs** of the Regulatory Motifs lesson, now learned from data rather than searched for.

{{ref:motifs#count-profile-consensus-and-score}}

**Why it matters for variants.** Most disease-associated variants are **non-coding**: they change regulation, not protein sequence. A sequence-to-function model can predict the tracks for the reference sequence and for the variant, and the difference estimates the variant's effect.

The AlphaGenome authors explain their model in this roundtable:

{{video:V8lhUqKqzUc}}

## Genomic language models

- **DNABERT** (2021): BERT trained on human DNA split into k-mer tokens.
- **Nucleotide Transformer** (*Nature Methods* 2025): 50 million to 2.5 billion parameters, trained on 3,202 human genomes plus 850 genomes of diverse species.
- **Evo** (*Science* 2024) and **Evo 2** (Arc Institute; preprint Feb 2025, *Nature* 2026): autoregressive models at **single-nucleotide resolution**. Evo 2 comes in 7-billion and 40-billion parameter versions, was trained on over **9.3 trillion nucleotides** from more than 128,000 genomes across all domains of life, and has a context of up to **1 million** tokens. Without task-specific training it can classify variants (for example pathogenic vs benign **BRCA1** variants), and it can **generate** DNA, including bacteriophage genomes that were tested in the lab.

**How does a language model score a variant without being trained to?** It assigns a probability to every sequence. A harmful mutation usually makes the sequence look less like the functional sequences seen in training, so its likelihood drops. Comparing the model's log-likelihood of the variant sequence with the reference gives a **zero-shot** variant-effect score. This is the same log-odds reasoning you used for HMMs and profiles.

{{ref:math#logarithms-likelihood-and-log-odds}}

The official overview of Evo 2 from the Arc Institute:

{{video:o_w-E--u7GQ}}

And a full research talk on Evo 2 for the technical details:

{{video:Rarn97Wpl1A}}

## Single-cell foundation models

The same recipe applied to single-cell RNA-seq: treat each cell as a "sentence" of genes, ranked or binned by expression, and pretrain on tens of millions of cells.
- **Geneformer** (*Nature* 2023): rank-value encoding (genes ordered by expression), ~30 million cells; used for in-silico perturbation to nominate disease targets.
- **scGPT** (*Nature Methods* 2024): generative pretraining on 33 million+ cells; cell-type annotation, batch integration and perturbation prediction.

{{ref:expression1#measuring-gene-expression-microarrays-rna-seq-single-cell}}

:::warn Evaluate before you believe
Independent benchmarks (2023–2025) found that in zero-shot settings, single-cell and DNA foundation models sometimes **do not beat simple baselines** (highly variable genes + PCA, k-mer models, or supervised CNNs). As a researcher: use homology-aware or chromosome-held-out splits, compare against strong simple baselines (remember the leakage warning in the Supervised Learning lesson), and report uncertainty.
:::

{{ref:ml#step-4-feature-selection}}

## Variant effect prediction

A central research problem: given a variant, is it harmful?
- **Coding variants:** AlphaMissense (structure + evolution), and protein language-model likelihoods (with ESM, compare the log-probability of the mutant vs the wild-type residue at that position).
- **Non-coding variants:** sequence-to-function models (Enformer, AlphaGenome) predict changes in regulatory tracks; genomic language models score how "surprising" the variant is.
- **Clinical use** always combines predictions with population frequency (gnomAD: a variant common in healthy people is unlikely to cause a severe rare disease), inheritance in families, and functional assays, following the ACMG guidelines.

## How the course concepts map onto modern AI

| Course concept | Modern counterpart |
|---|---|
| Profile matrix / PWM (Regulatory Motifs) | first-layer CNN filters; attention to motifs |
| HMM over a sequence (HMMs) | transformers and state-space models (Evo's StripedHyena) |
| Alignment and MSA (Sequence Alignment) | MSA input to AlphaFold; learned pairwise representations |
| PCA / t-SNE (Dimensionality Reduction) | latent spaces of VAEs and foundation models; UMAP of embeddings |
| k-mer features (Supervised Learning) | learned tokens and embeddings |
| Gibbs sampling / EM | diffusion and autoregressive sampling for design |
| Log-odds scores | language-model likelihood ratios for variant effects |
