Many biological sequences are **mixtures of regions with different statistics**: CpG islands vs background DNA, exons vs introns, transmembrane vs cytoplasmic protein segments. We observe the sequence, but the region labels are **hidden**. **Hidden Markov Models (HMMs)** model this and give efficient DP algorithms to decode, score and train. Course materials: Carl Kingsford-style HMM slides (casino example) and the Viterbi/Forward toy example from Borodovsky & Ekisheva (2006).

## The dishonest casino

A casino flips either a **fair coin** (P(H) = 0.5) or a **biased coin** (P(H) = 0.75). We see only the flips.

**If one coin is used throughout:** for x = H H T T T T H,
$$\Pr(x \mid \text{Fair}) = 0.5^7 = 0.0078, \qquad \Pr(x \mid \text{Biased}) = 0.75^3\cdot 0.25^4 = 0.0016$$
The **log-odds score** $\log_2 \frac{0.0078}{0.0016} \approx 2.245 > 0$, so “Fair” is the better guess.

**If the casino switches coins with probability 0.1** at each flip, we need to infer *which coin was used at each position*. That is an HMM.

{{widget:casino}}

## Formal definition

An HMM is $(\Sigma, Q, A, E)$ (plus initial probabilities):
- $\Sigma$: alphabet of observable symbols (H/T; A/C/G/T).
- $Q$: set of hidden **states** (Fair/Biased; Island/Background; exon/intron).
- $A$: $|Q|\times|Q|$ **transition** matrix, $A_{kl} = \Pr(\pi_{i+1} = l \mid \pi_i = k)$.
- $E$: $|Q|\times|\Sigma|$ **emission** matrix, $E_{k}(b) = \Pr(x_i = b \mid \pi_i = k)$.
- **Each row of A and of E sums to 1.**

*Markov property:* the next state depends only on the current state (not on history). So after five I's, the probability of staying in I is still $A_{II}$.

**Joint probability of a sequence x and a state path π:**
$$\Pr(x, \pi) = \Pr(\pi_1)\, E_{\pi_1}(x_1)\prod_{i=2}^{n} A_{\pi_{i-1}\pi_i}\, E_{\pi_i}(x_i)$$

**Three classic problems:**
1. **Decoding:** most probable path $\pi^* = \arg\max_\pi \Pr(x, \pi)$ → **Viterbi**.
2. **Evaluation:** $\Pr(x) = \sum_\pi \Pr(x,\pi)$ → **Forward** (or Backward).
3. **Learning:** estimate A and E from data → counting (labeled) or **Baum–Welch** (unlabeled).

## Viterbi: the most probable path

There are $|Q|^n$ paths, too many to enumerate. Dynamic programming: let $V_k(t)$ be the probability of the best path for $x_1..x_t$ ending in state k.
$$V_k(1) = \Pr(\pi_1 = k)\,E_k(x_1)$$
$$V_l(t) = E_l(x_t)\,\max_{k}\big[V_k(t-1)\,A_{kl}\big], \qquad \text{ptr}_l(t) = \arg\max_k \big[V_k(t-1)\,A_{kl}\big]$$
The answer is $\max_k V_k(n)$; follow the **backpointers** from there to recover π*. It's exactly the alignment DP idea: a table filled column by column, then traceback.

**Logs.** Multiplying many probabilities underflows (0.1⁵ = 10⁻⁵, and genomes are millions long), so work with logs: products become **sums**, and the recurrence becomes a **max of sums of log-probabilities**.

**Complexity:** there are $n|Q|$ cells, each taking $O(|Q|)$ work, so **time $O(n|Q|^2)$, space $O(n|Q|)$** for the table and backpointers.

{{widget:viterbi}}

:::exam Handout example (Borodovsky & Ekisheva)
States H (high GC: A .2, C .3, G .3, T .2) and L (low GC: A .3, C .2, G .2, T .3); start 0.5/0.5; transitions H→H .5, H→L .5, L→H .4, L→L .6. For x = GGCACTGAA (log₂):
- $V_H(1) = -1 - 1.737 = -2.737$, $V_L(1) = -1 - 2.322 = -3.322$
- $V_H(2) = -1.737 + \max(-2.737-1, -3.322-1.322) = -5.474$; $V_L(2) = -2.322 + \max(-2.737-1, -3.322-0.737) = -6.059$
- … final best = **−24.49** → path **HHHLLLLLL**, probability $2^{-24.49} \approx 4.25\times10^{-8}$.
:::

## Forward, backward and posterior decoding

**Forward:** replace max by **sum** to get $\Pr(x)$ over all paths:
$$f_l(t) = E_l(x_t)\sum_k f_k(t-1)\,A_{kl}, \qquad \Pr(x) = \sum_k f_k(n)$$
Handout: for x = GGCA, $f_H(2) = 0.15\cdot0.5\cdot0.3 + 0.1\cdot0.4\cdot0.3 = 0.0345$, …, $\Pr(\text{GGCA}) = 0.0013767 + 0.0024665 = $ **0.0038432**. Compared with a uniform background, $0.25^4 = 0.0039$, the toy model is *not* a better explanation. A good illustration of **comparing against a null model**.

**Backward** $b_k(t) = \Pr(x_{t+1..n}\mid \pi_t = k)$ runs right to left. Combining them gives the **posterior**:
$$\Pr(\pi_t = k \mid x) = \frac{f_k(t)\, b_k(t)}{\Pr(x)}$$
Posterior decoding picks the most likely state *at each position* (possibly not a valid path overall); Viterbi gives the single best path.

## Learning parameters

**With labeled paths:** count transitions and emissions and normalize:
$$A_{ab} = \frac{\#(a\to b)}{\sum_q \#(a \to q)}, \qquad E_a(x) = \frac{\#(a \text{ emits } x)}{\sum_y \#(a \text{ emits } y)}$$
Add **pseudocounts** (+1) so unseen events don't get probability 0, the same idea as in motif profiles.

**Without labels:**
- **Viterbi training:** start with random parameters; repeat {decode best paths; re-estimate from them}. It's a local search, “Gibbs-sampling-like”.
- **Baum–Welch:** like Viterbi training but uses **expected counts** from forward–backward posteriors instead of committing to one path. It is a special case of **EM**, and each iteration does not decrease the likelihood.

:::exam Final Q4(c): does Baum–Welch guarantee the optimal model?
**No.** It converges to a **local maximum** of the likelihood (a saddle point at worst), depending on initialization, and it can overfit with too many states. Remedies: **multiple random restarts** (keep the highest likelihood), **sensible initialization** (e.g., from a small labeled set or from Viterbi training), **pseudocounts/Dirichlet priors**, constraining the model structure, and annealing-style methods. Use held-out data to check generalization.
:::

## CpG islands and gene finding

**CpG islands.** The dinucleotide CG is rare in vertebrate genomes because methylated C in CpG mutates to T. But near promoters (often gene starts) unmethylated **CpG islands** (hundreds to a few thousand bp) retain high C+G and CpG. An HMM with an **Island** state (high C/G emissions) and a **Background** state (more A/T), with high self-transitions, segments a genome into islands. Why not just count GC%? A sliding GC% window **ignores transition structure**: it needs an arbitrary window size and gives noisy boundaries, while the HMM balances emission evidence against the cost of switching.

:::exam Final Q4(a): exons vs introns
- **States:** exon (often three states for the three codon positions), intron, intergenic, plus splice-site states.
- **Emissions** capture composition: exons follow **codon usage** with 3-periodicity and typically higher GC; introns are AT-richer and begin with **GT** and end with **AG** (splice donor/acceptor signals).
- **Transitions** encode **structure and length**: a self-transition p gives a geometric length distribution with mean 1/(1 − p), so long introns get high intron→intron probability; exon→intron transitions go through donor-site states and intron→exon through acceptor states, which forbids impossible orders.
- **Viterbi** then labels each base as exon or intron by trading emission evidence against transition costs (a few intron-like bases inside an exon won't trigger a switch). Gene finders like **GENSCAN** are generalized HMMs of this kind.
:::

{{game:cpg-detective}}

## Beyond: profile HMMs and pair HMMs

- **Profile HMMs** model a protein family's MSA with **match/insert/delete** states per column. **HMMER** (S. Eddy) searches databases with them, and **Pfam** stores profile HMMs for tens of thousands of families. They are far more sensitive than BLAST for distant homologs.
- **Pair HMMs** emit *two* aligned sequences; their Viterbi path *is* an alignment. The affine-gap 3-state diagram from Module 10 is one.

## Quick reference

| Algorithm | Computes | Operation | Time | Space |
|---|---|---|---|---|
| Viterbi | best path π* | max | O(n\|Q\|²) | O(n\|Q\|) |
| Forward | Pr(x) | sum | O(n\|Q\|²) | O(n\|Q\|) (O(\|Q\|) if only Pr(x) is needed) |
| Forward–Backward | Pr(πₜ = k \| x) | sum | O(n\|Q\|²) | O(n\|Q\|) |
| Baum–Welch | A, E (unlabeled) | EM over F–B | O(n\|Q\|²) per iteration | O(n\|Q\|) |
