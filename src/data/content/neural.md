Neural networks are now the default model for sequence, structure and expression data. This lesson builds them from the ground up, as the lecture does: linear regression → gradient descent → logistic regression → neural networks → autoencoders. It then connects to the two papers in the course folder, **dna2vec** and **VAE-based imputation**. Each step adds one idea to the previous one, so take them in order.

## Regression and the error function

In **regression** we learn a function $\hat{y} = f(\mathbf{x})$ whose output is a **continuous** number. Example from the slides: predict a protein's lowest-energy state from features such as toxicity, inflammation, gram-staining, localization and structure.

**Simple linear regression** uses one feature and a straight line:

$$\hat{y} = w_0 + w_1 x_1$$

- $w_0$ is the **intercept**: the prediction when $x_1 = 0$.
- $w_1$ is the **slope**: how much the prediction changes when $x_1$ increases by 1.

"Learning" means choosing $w_0$ and $w_1$ so that predictions are close to the true values. We need a number that says how wrong the current weights are: the **error function** (or loss). Over m training examples, the **squared error** is

$$e = \frac{1}{2}\sum_{i=1}^{m}\big(\hat{y}^{(i)} - y^{(i)}\big)^2 = \frac{1}{2}\sum_{i=1}^{m}\big(w_0 + w_1x_1^{(i)} - y^{(i)}\big)^2$$

Squaring makes all errors positive and punishes big errors more than small ones; the ½ just makes the derivative cleaner.

**Example.** Data points (1, 2), (2, 4), (3, 6) (exactly y = 2x). With $w_0 = w_1 = 0$, every prediction is 0, the errors are −2, −4, −6, and $e = \frac12(4 + 16 + 36) = 28$.

## Gradient descent

Watch this StatQuest video first: it works through exactly the derivation on the slides, step by step.

{{video:sDv4f4s2SB8}}

**The idea.** Think of the error e as a landscape over the weights. We want the lowest point. At a minimum the slope (derivative) is 0. Start anywhere and repeatedly step **downhill**, against the slope:
- if the slope is negative, increasing w decreases the error, so increase w;
- if the slope is positive, decrease w;
- a steeper slope (further from the minimum) gives a bigger step.

The **learning rate α** scales the steps:

$$w_j \leftarrow w_j - \alpha\,\frac{\partial e}{\partial w_j}$$

**The derivatives for squared error.** By the chain rule, the derivative of $\frac12(\hat y - y)^2$ with respect to a weight is $(\hat y - y)$ times the derivative of $\hat y$ with respect to that weight, which is 1 for $w_0$ and $x_j$ for $w_j$:

$$\frac{\partial e}{\partial w_0} = \sum_i(\hat{y}^{(i)} - y^{(i)})\cdot 1, \qquad \frac{\partial e}{\partial w_j} = \sum_i(\hat{y}^{(i)} - y^{(i)})\,x_j^{(i)}$$

**Worked example, continued.** With errors −2, −4, −6 at x = 1, 2, 3: $\partial e/\partial w_0 = -12$ and $\partial e/\partial w_1 = -2 - 8 - 18 = -28$. With α = 0.05: $w_0 = 0 + 0.6 = 0.6$ and $w_1 = 0 + 1.4 = 1.4$. The new predictions are 2.0, 3.4, 4.8 and the error drops from 28 to **0.9**. More steps approach $w_0 = 0$, $w_1 = 2$.

{{ref:math#derivatives-gradients-and-the-chain-rule}}

The same formulas extend to many features: $\hat{y} = w_0 + w_1x_1 + \dots + w_nx_n$, with one partial derivative per weight.

**Choosing α.** Too small: very slow convergence. Too large: steps overshoot the minimum, bounce around, and can **diverge** (the error grows). Try both in the widget.

{{widget:gradient-descent}}

## Classification: logistic regression and the sigmoid

Now the label is **binary**: is a protein antiviral (1) or not (0)? A **linear classifier** computes a weighted sum and checks which side of a line (in many dimensions, a hyperplane) the point is on:

$$f(\mathbf{x}) = w_0 + w_1x_1 + \dots + w_nx_n, \qquad \text{predict } 1 \text{ if } f(\mathbf{x}) > 0$$

That rule is a **step function**: it jumps from 0 to 1. It is not continuous and not differentiable, so gradient descent can't use it (the slope is zero everywhere except at the jump). Replace it with the smooth **sigmoid**:

$$\sigma(z) = \frac{1}{1+e^{-z}}, \qquad \sigma'(z) = \sigma(z)\,(1-\sigma(z))$$

- σ(0) = 0.5; large positive z gives σ near 1, large negative z gives σ near 0.
- The output is between 0 and 1, so it can be read as a **probability** that the label is 1.
- The derivative is cheap to compute from σ itself.

The model $\hat y = \sigma(w_0 + w_1x_1 + \dots)$ is **logistic regression**. (The slides keep the squared error for simplicity. In practice logistic regression minimizes **cross-entropy**, $-[y\log\hat y + (1-y)\log(1-\hat y)]$, which gives cleaner gradients and heavily penalizes confident wrong answers.)

This StatQuest video explains logistic regression and how its probabilities work; a good recap before moving on to networks:

{{video:yIYKR4sgzI8}}

{{widget:sigmoid}}

## Neural networks

**Logistic regression is a single neuron**: a weighted sum followed by a non-linear "activation" (the sigmoid). A **neural network** connects many such neurons in **layers**, each layer feeding the next.

Watch 3Blue1Brown's visual introduction to layers, weights and activations first:

{{video:aircAruvnKk}}

- **Input layer:** the features.
- **Hidden layers:** each neuron computes $\sigma(\mathbf{w}^\top\mathbf{x} + b)$ (or ReLU, $\max(0, z)$) of the previous layer's outputs. These are **learned representations**: intermediate features the network invents for itself.
- **Output layer:** the prediction (one sigmoid for binary classification, a softmax over classes for multi-class, a linear unit for regression).

**One neuron, by hand.** Inputs x = (1, 2), weights w = (0.5, −0.25), bias b = 0.1: z = 0.5 − 0.5 + 0.1 = 0.1, output σ(0.1) ≈ 0.525. A network does this for every neuron, layer by layer (the **forward pass**).

**Training** is still gradient descent on an error function. The network is a long chain of functions, so the gradient of the error with respect to every weight is computed with the **chain rule**, applied from the output layer backward. That is **backpropagation**: it computes all the gradients in about the same time as one forward pass.

This video shows how a network learns by gradient descent on its cost landscape:

{{video:IHZwWFHWa-w}}

**Wide vs deep.** A single, very wide hidden layer can in principle approximate any function, but **deep** networks (many layers) learn hierarchical features far more efficiently: early layers detect simple patterns, later layers combine them. In a DNA model, early filters might detect short motifs and later layers combinations of motifs. That is the core of deep learning.

**Architectures you'll meet in bioinformatics:**
- **CNNs** (convolutional networks) slide learned filters along a sequence, like motif scanners: DeepBind and DeepSEA (2015).
- **RNNs/LSTMs** process sequences step by step.
- **Graph neural networks** operate on molecules and interaction networks.
- **Transformers** use attention to relate every position to every other: protein and DNA language models, AlphaFold's Evoformer, Enformer, AlphaGenome.

## Autoencoders

An **autoencoder** is a network trained **without labels** to reproduce its own input. It has two parts:
- an **encoder** $z = g(x)$ that compresses the input into a **code** z, and
- a **decoder** $\hat{x} = h(z)$ that reconstructs the input from the code.

Training minimizes the reconstruction error $\|x - \hat{x}\|^2$. The output is useless by itself (it's a copy of the input); the useful part is the **code z**, a compact representation learned from the data.

This five-minute video explains the encoder–decoder idea:

{{video:qiUEgSCyY5o}}

**Three kinds:**
- **Undercomplete:** the code is **smaller** than the input (a bottleneck), which forces the network to keep only the most important structure. It is a non-linear generalization of PCA: a linear autoencoder with squared loss learns the same subspace as PCA.
- **Denoising:** corrupt the input (add noise, or mask some values) and train the network to reconstruct the **clean** input. It learns robust features, and it is the idea behind masked pretraining in language models.
- **Variational (VAE):** the encoder outputs a **distribution** (a mean and a variance for each latent dimension) instead of a single point, and the decoder reconstructs from a sample of it. Training minimizes **reconstruction loss + KL divergence** between the latent distribution and a standard Gaussian. The KL term keeps the latent space smooth and continuous (nearby codes decode to similar data) and reduces overfitting, so you can **sample** the latent space to generate new, realistic data.

{{ref:expression2#pca-by-eigen-decomposition|math#kl-divergence}}

This video explains VAEs, including the reparameterization trick and the KL term:

{{video:9zKuYvjFFS8}}

:::bio Course paper 1: Genomic data imputation with VAEs (Qiu, Zheng & Gevaert, GigaScience 2020)
Missing values are common in transcriptome and methylome data. The authors trained a VAE on complete data and imputed missing entries by iteratively reconstructing them. The VAE performed **similarly to or better than** standard methods (SVD- and KNN-based imputation) in most scenarios and was **faster at evaluation time**. For data missing **not at random**, they used prior knowledge about how the data went missing. They also showed why the VAE's regularized latent space imputes better than a plain deterministic autoencoder.
:::

:::bio Course paper 2: dna2vec (Ng, 2017)
One-hot k-mer vectors are huge (an 8-mer needs 4⁸ = 65,536 dimensions) and every pair of k-mers is equally far apart, although ATGGC should be closer to ATGGG than to CACGA. dna2vec trains **word2vec-style embeddings** (a shallow two-layer network) for variable-length k-mers (3–8) on the human genome. Findings: adding embedding vectors behaves like **concatenating** nucleotides, and the **cosine similarity** of embeddings correlates with **Needleman–Wunsch** alignment scores. It was an early example of representation learning for DNA, the ancestor of today's genomic language models.
:::

## Handling class imbalance with neural networks

Recall from the previous lesson: with imbalanced classes, a model can look accurate while ignoring the rare class. With 1,000 cancer and 100 normal samples, always predicting "cancer" already gives 90.9% accuracy.

{{ref:ml#step-6-testing-metrics-and-sampling|ml#step-1-2-formulate-and-collect}}

:::example Five ways to handle 1000 cancer vs 100 normal samples
1. **Class-weighted (cost-sensitive) loss:** weight each sample's loss by roughly N/(2·N_class), so errors on the rare normal class cost about 10× more. Or use **focal loss**, which down-weights easy examples.
2. **Re-sampling in mini-batches:** oversample normals or undersample cancers so batches are balanced; add data **augmentation**.
3. **Generative oversampling:** train a **VAE (or GAN)** on the minority class and **sample synthetic** normal profiles (like SMOTE, but in a learned latent space).
4. **Anomaly-detection view:** train an **autoencoder** on the majority class only; samples it reconstructs poorly (high error) are flagged as the other class.
5. **Tune the decision threshold** on validation data, and report **MCC, F1, balanced accuracy and AUPR** instead of accuracy.
:::

Try class weights yourself: train a logistic regression on imbalanced data and watch what weighting does to the decision boundary.

{{widget:logreg}}

## Summary

| Concept | Key formula / idea |
|---|---|
| Linear regression | ŷ = w₀ + Σ wⱼxⱼ, e = ½Σ(ŷ − y)² |
| Gradient descent | w ← w − α ∂e/∂w |
| Sigmoid | σ(z) = 1/(1 + e^{−z}), σ′ = σ(1 − σ) |
| Neural net | layers of σ(Wx + b), trained by backpropagation |
| Autoencoder | minimize ‖x − h(g(x))‖² |
| VAE | reconstruction + KL(q(z\|x) ‖ N(0, I)) |
