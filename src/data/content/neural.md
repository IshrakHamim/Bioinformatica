Neural networks are now the default model for sequence, structure and expression data. This module builds them from the ground up as in the lecture (linear regression → gradient descent → logistic regression → networks → autoencoders), then connects to the two papers in the course folder: **dna2vec** and **VAE-based imputation**.

## Regression and the error function

In **regression** we learn $\hat{y} = f(\mathbf{x})$ with a continuous label. Example (slides): predict a protein's lowest-energy state from features like toxicity, inflammation, gram-staining, localization and structure.

**Simple linear regression:** $\hat{y} = w_0 + w_1 x_1$ ($w_0$ = intercept, value of y at $x_1 = 0$; $w_1$ = slope, the rate of change of y with $x_1$).

**Error** over m examples (the ½ makes derivatives cleaner):
$$e = \frac{1}{2}\sum_{i=1}^{m}\big(\hat{y}^{(i)} - y^{(i)}\big)^2 = \frac{1}{2}\sum_{i=1}^{m}\big(w_0 + w_1x_1^{(i)} - y^{(i)}\big)^2$$

## Gradient descent

The minimum is where the slope (derivative) is 0. Start anywhere and move **against the slope**: if the slope is negative, increase w; if positive, decrease w. Steeper slope (farther from the minimum) means a bigger step. The **learning rate α** scales the step:
$$w_j \leftarrow w_j - \alpha\,\frac{\partial e}{\partial w_j}$$
With the squared error:
$$\frac{\partial e}{\partial w_0} = \sum_i(\hat{y}^{(i)} - y^{(i)})\cdot 1, \qquad \frac{\partial e}{\partial w_j} = \sum_i(\hat{y}^{(i)} - y^{(i)})\,x_j^{(i)}$$
The error times 1 for the bias, times the feature $x_j$ for each weight. This extends to many features: $\hat{y} = w_0 + w_1x_1 + \dots + w_nx_n$.

**α too small:** slow convergence. **α too large:** overshooting and **divergence**.

{{widget:gradient-descent}}

{{yt:sDv4f4s2SB8|Gradient Descent, Step-by-Step (StatQuest)}}

## Classification: logistic regression and the sigmoid

For a binary label (antiviral protein or not), a **linear classifier** checks which side of a line (hyperplane) a point lies on:
$$f(\mathbf{x}) = w_0 + w_1x_1 + \dots + w_nx_n, \qquad \text{predict } 1 \text{ if } f(\mathbf{x}) > 0$$
That rule is a **step function**: not continuous, not differentiable, so no gradients. Replace it with the **sigmoid**
$$\sigma(z) = \frac{1}{1+e^{-z}}, \qquad \sigma'(z) = \sigma(z)\,(1-\sigma(z))$$
which is smooth, outputs a probability, and has a cheap derivative. (The slides keep squared error for simplicity; in practice logistic regression minimizes **cross-entropy** $-[y\log\hat y + (1-y)\log(1-\hat y)]$, which gives cleaner gradients.)

{{widget:sigmoid}}

## Neural networks

Logistic regression is a single neuron. A **neural network** stacks layers of neurons, each computing $\sigma(\mathbf{w}^\top\mathbf{x} + b)$ (or ReLU), feeding the next layer:

- **Input layer** (features) → **hidden layers** (learned representations) → **output layer** (prediction).
- Trained by gradient descent; gradients for all weights are computed efficiently by **backpropagation** (the chain rule applied layer by layer).
- **Wide vs deep:** one huge hidden layer can approximate any function in principle, but **deep** networks (many layers) learn hierarchical features far more efficiently. This is the core of deep learning.

{{yt:aircAruvnKk|But what is a neural network? (3Blue1Brown)}}

**Architectures you'll meet in bioinformatics:** CNNs scanning DNA for motifs (DeepBind, DeepSEA, 2015); RNNs/LSTMs; graph neural networks on molecules and PPI networks; **transformers** (protein/DNA language models, AlphaFold's Evoformer, Enformer, AlphaGenome).

## Autoencoders

An **autoencoder** learns, **without labels**, an **encoder** $z = g(x)$ and a **decoder** $\hat{x} = h(z)$ trained to reconstruct the input: minimize $\|x - \hat{x}\|^2$.

- **Undercomplete:** the code z is **smaller** than the input (a bottleneck), which forces it to keep only the most important structure. It is a non-linear generalization of PCA (a linear autoencoder with squared loss learns the PCA subspace).
- **Denoising:** corrupt the input (noise, masking) and train to reconstruct the **clean** input. This learns robust features and is the idea behind masked pretraining.
- **Variational (VAE):** the encoder outputs a **distribution** (mean and variance) instead of a point. Training minimizes **reconstruction loss + KL divergence** between the latent distribution and a standard Gaussian. The KL term regularizes the latent space (smooth, continuous, less overfitting), so you can **sample** new data.

{{yt:9zKuYvjFFS8|Variational Autoencoders (Arxiv Insights)}}

:::bio Course paper 1: Genomic data imputation with VAEs (Qiu, Zheng & Gevaert, GigaScience 2020)
Missing values are common in transcriptome and methylome data. They trained a VAE on complete data and imputed missing entries by iteratively reconstructing them. The VAE performed **similar to or better than** standard methods (SVD- and KNN-based imputation) in most scenarios and was **faster at evaluation time**. For data missing **not at random**, they used prior knowledge about the missingness. They also showed why the VAE's regularized latent space imputes better than a plain deterministic autoencoder.
:::

:::bio Course paper 2: dna2vec (Ng, 2017)
One-hot k-mer vectors are huge (an 8-mer needs 4⁸ = 65,536 dimensions) and every pair is equidistant, though ATGGC should be closer to ATGGG than to CACGA. dna2vec trains **word2vec-style embeddings** (a shallow two-layer network) for variable-length k-mers (3–8) on the human genome. Findings: adding vectors behaves like **concatenating** nucleotides, and the **cosine similarity** of embeddings correlates with **Needleman–Wunsch** alignment scores. This was an early example of representation learning for DNA, the ancestor of today's genomic language models.
:::

## Handling class imbalance with neural networks

:::exam Final Q3(b): 1000 cancer vs 100 normal samples
1. **Class-weighted (cost-sensitive) loss:** weight each sample's loss by roughly N/(2·N_class), so errors on the rare normal class cost ~10× more. Or use **focal loss**, which down-weights easy examples.
2. **Re-sampling in mini-batches:** oversample normals or undersample cancers so batches are balanced; add data **augmentation**.
3. **Generative oversampling:** train a **VAE (or GAN)** on the minority class and **sample synthetic** normal profiles (like SMOTE, but in a learned latent space).
4. **Anomaly-detection view:** train an **autoencoder** on the majority class; samples with high reconstruction error are flagged as the other class.
5. **Decision threshold tuning** on validation data, and report **MCC, F1, balanced accuracy, AUPR** instead of accuracy (always predicting “cancer” already gives 90.9% accuracy).
:::

{{widget:logreg}}

## Summary

| Concept | Key formula / idea |
|---|---|
| Linear regression | ŷ = w₀ + Σ wⱼxⱼ, e = ½Σ(ŷ − y)² |
| Gradient descent | w ← w − α ∂e/∂w |
| Sigmoid | σ(z) = 1/(1 + e^{−z}), σ′ = σ(1 − σ) |
| Neural net | layers of σ(Wx + b), trained by backprop |
| Autoencoder | minimize ‖x − h(g(x))‖² |
| VAE | reconstruction + KL(q(z\|x) ‖ N(0, I)) |
