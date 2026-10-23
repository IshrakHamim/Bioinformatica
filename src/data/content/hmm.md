Many biological sequences are **mixtures of regions with different statistics**: CpG islands vs ordinary DNA, exons vs introns, membrane-spanning vs cytoplasmic stretches of a protein. We observe the sequence, but the region labels are **hidden**. **Hidden Markov Models (HMMs)** describe exactly this situation, and they come with efficient dynamic-programming algorithms to label a sequence, score it, and learn the model from data. The course materials use Carl Kingsford-style slides (the casino example) and the Viterbi/Forward toy example from Borodovsky & Ekisheva (2006).

If Bayes' rule and HMMs are new to you, start with this friendly, intuition-first video. It builds up to exactly the ideas in this lesson.

{{video:kqSzLo9fenk}}

## The dishonest casino

A casino flips either a **fair coin** (P(heads) = 0.5) or a **biased coin** (P(heads) = 0.75). We see only the sequence of flips, not which coin was used.

**Case 1: one coin is used throughout.** Which coin produced x = H H T T T T H? Compute the probability of the flips under each coin (flips are independent, so multiply):

$$\Pr(x \mid \text{Fair}) = 0.5^7 \approx 0.0078, \qquad \Pr(x \mid \text{Biased}) = 0.75^3\cdot 0.25^4 \approx 0.0016$$

The **log-odds score** $\log_2 \frac{0.0078}{0.0016} \approx 2.25 > 0$ favours "Fair". Four tails out of seven are much more typical of a fair coin.

{{ref:math#logarithms-likelihood-and-log-odds}}

**Case 2: the casino secretly switches coins**, with probability 0.1 after each flip. Now the question is different: *which coin was used at each position?* The coin is a **hidden state** that changes over time, and each flip is an **observation** that depends on the current state. That's an HMM.

{{widget:casino}}

## Formal definition

An HMM is a tuple $(\Sigma, Q, A, E)$, plus initial probabilities:
- $\Sigma$: the alphabet of **observable symbols** (H/T; or A/C/G/T).
- $Q$: the set of hidden **states** (Fair/Biased; Island/Background; exon/intron).
- $A$: the $|Q|\times|Q|$ **transition** matrix. $A_{kl} = \Pr(\pi_{i+1} = l \mid \pi_i = k)$ is the probability of moving from state k to state l. For the casino, $A_{FF} = 0.9$ and $A_{FB} = 0.1$.
- $E$: the $|Q|\times|\Sigma|$ **emission** matrix. $E_{k}(b) = \Pr(x_i = b \mid \pi_i = k)$ is the probability that state k emits symbol b. For the casino, $E_F(H) = 0.5$, $E_B(H) = 0.75$.
- **Each row of A and each row of E sums to 1**, because each row is a probability distribution.

We write the hidden path as π = π₁π₂…πₙ and the observed sequence as x = x₁x₂…xₙ.

**The Markov property:** the next state depends only on the current state, not on the history. So even after five Island states in a row, the probability of staying in Island is still just $A_{II}$. The emission at position i depends only on the state at position i.

{{ref:math#conditional-probability-and-independence}}

**Joint probability of a sequence and a path.** Think of the HMM generating the data: choose a first state, emit a symbol, transition, emit, transition, emit… Multiply the probability of every step:

$$\Pr(x, \pi) = \Pr(\pi_1)\, E_{\pi_1}(x_1)\prod_{i=2}^{n} A_{\pi_{i-1}\pi_i}\, E_{\pi_i}(x_i)$$

**Worked example.** Casino with start probabilities 0.5/0.5, stay 0.9, switch 0.1. For x = HH there are four possible paths:

| Path | Calculation | Pr(x, π) |
|---|---|---|
| FF | 0.5 · 0.5 · 0.9 · 0.5 | 0.1125 |
| FB | 0.5 · 0.5 · 0.1 · 0.75 | 0.01875 |
| BF | 0.5 · 0.75 · 0.1 · 0.5 | 0.01875 |
| BB | 0.5 · 0.75 · 0.9 · 0.75 | **0.2531** |

The most probable path is **BB**. The total probability of the observations is the sum, $\Pr(\text{HH}) \approx 0.4031$.

**The three classic problems:**
1. **Decoding:** find the most probable path $\pi^* = \arg\max_\pi \Pr(x, \pi)$ → **Viterbi** algorithm.
2. **Evaluation:** compute $\Pr(x) = \sum_\pi \Pr(x,\pi)$, how well the model explains x → **Forward** (or Backward) algorithm.
3. **Learning:** estimate A and E from data → counting (if paths are known) or **Baum–Welch** (if they aren't).

The table above solved problems 1 and 2 by listing every path. But there are $|Q|^n$ paths: for 2 states and 100 flips that is $2^{100} \approx 10^{30}$. We need dynamic programming.

{{ref:math#counting-how-big-is-the-search-space}}

## Viterbi: the most probable path

Watch this compact derivation of the Viterbi algorithm, then read the recurrence:

{{video:LGY4yMWUjL4}}

**The subproblem.** Let $V_k(t)$ be the probability of the **best** path for the first t symbols $x_1..x_t$ that **ends in state k**.

**The recurrence.** The best path ending in state l at time t must come from *some* state k at time t − 1. Try every k, keep the best, and multiply by the emission of $x_t$ in state l:

$$V_k(1) = \Pr(\pi_1 = k)\,E_k(x_1)$$
$$V_l(t) = E_l(x_t)\,\max_{k}\big[V_k(t-1)\,A_{kl}\big], \qquad \text{ptr}_l(t) = \arg\max_k \big[V_k(t-1)\,A_{kl}\big]$$

**The answer** is $\max_k V_k(n)$. Follow the **backpointers** from that cell back to t = 1 to recover π*.

**Check on the HH example.** $V_F(1) = 0.5 \cdot 0.5 = 0.25$ and $V_B(1) = 0.5 \cdot 0.75 = 0.375$. Then $V_B(2) = 0.75 \cdot \max(0.25 \cdot 0.1,\ 0.375 \cdot 0.9) = 0.75 \cdot 0.3375 = 0.2531$, with backpointer B. That matches the best path BB from the table, without listing paths.

This is exactly the alignment DP idea: a table filled column by column (one column per position, one row per state), then a traceback. Viterbi is to HMMs what Needleman–Wunsch is to alignment.

{{ref:algo#dynamic-programming}}

**Work in logs.** Multiplying many probabilities underflows: 0.1⁵ = 10⁻⁵ is fine, but a product over a million positions is far below the smallest number a computer can store. So take logarithms: products become **sums**, and the recurrence becomes a **max of sums of log-probabilities**:

$$\log V_l(t) = \log E_l(x_t) + \max_k \big[\log V_k(t-1) + \log A_{kl}\big]$$

**Complexity.** There are $n|Q|$ cells, each taking $O(|Q|)$ work (the max over k), so **time $O(n|Q|^2)$ and space $O(n|Q|)$** for the table and backpointers. Linear in the sequence length instead of exponential.

{{widget:viterbi}}

:::example The handout example (Borodovsky & Ekisheva)
States H (high GC: A .2, C .3, G .3, T .2) and L (low GC: A .3, C .2, G .2, T .3). Start 0.5/0.5. Transitions H→H .5, H→L .5, L→H .4, L→L .6. For x = GGCACTGAA, working in log₂:
- $V_H(1) = \log_2 0.5 + \log_2 0.3 = -1 - 1.737 = -2.737$, and $V_L(1) = -1 - 2.322 = -3.322$.
- $V_H(2) = -1.737 + \max(-2.737-1,\ -3.322-1.322) = -5.474$; $V_L(2) = -2.322 + \max(-2.737-1,\ -3.322-0.737) = -6.059$.
- … continuing to the last column, the best final value is **−24.49**, and the traceback gives the path **HHHLLLLLL**, with probability $2^{-24.49} \approx 4.25\times10^{-8}$.

Try it in the widget above: change a letter and watch the path change.
:::

## Forward, backward and posterior decoding

This video covers the Forward–Backward algorithm and posterior decoding in this section:

{{video:QBDvFVmpgd0}}

**Forward algorithm.** To compute $\Pr(x)$, the probability of the sequence summed over **all** paths, use the same table as Viterbi but replace **max** with **sum**. Let $f_k(t)$ be the probability of $x_1..x_t$ with the path ending in state k:

$$f_l(t) = E_l(x_t)\sum_k f_k(t-1)\,A_{kl}, \qquad \Pr(x) = \sum_k f_k(n)$$

**Check on HH:** $f_F(1) = 0.25$, $f_B(1) = 0.375$; then $f_F(2) = 0.5 \cdot (0.25 \cdot 0.9 + 0.375 \cdot 0.1) = 0.13125$ and $f_B(2) = 0.75 \cdot (0.25 \cdot 0.1 + 0.375 \cdot 0.9) = 0.27188$. Their sum is **0.4031**, the same total as summing all four paths in the table.

**Handout example:** for x = GGCA, $f_H(2) = 0.3 \cdot (0.15\cdot0.5 + 0.1\cdot0.4) = 0.0345$, …, and $\Pr(\text{GGCA}) = 0.0013767 + 0.0024665 =$ **0.0038432**. Compare with a uniform background model: $0.25^4 \approx 0.0039$. The toy HMM is *not* a better explanation of GGCA than random DNA, a good reminder to **always compare against a null model**.

**Backward algorithm.** $b_k(t) = \Pr(x_{t+1..n}\mid \pi_t = k)$, the probability of the rest of the sequence given state k at position t, computed from right to left.

**Posterior decoding.** Combining forward and backward with Bayes' rule gives the probability that position t was in state k, given the whole sequence:

$$\Pr(\pi_t = k \mid x) = \frac{f_k(t)\, b_k(t)}{\Pr(x)}$$

For HH, the probability that the second flip used the biased coin is (0.2531 + 0.0188)/0.4031 ≈ **0.67**: the sum over all paths with B at position 2, divided by the total.

{{ref:math#bayes-rule}}

**Viterbi vs posterior decoding.** Viterbi gives the single most probable *path*. Posterior decoding picks the most probable *state at each position* separately; the result may not be a valid path (it can include a transition with probability 0), but it also tells you how confident each label is.

## Learning parameters

**With labelled paths:** if you know the hidden states (e.g., from annotated genes), just count and normalize:

$$A_{ab} = \frac{\#(a\to b)}{\sum_q \#(a \to q)}, \qquad E_a(x) = \frac{\#(a \text{ emits } x)}{\sum_y \#(a \text{ emits } y)}$$

**Example.** If the labelled path is IIIBBI, the transitions out of I are I→I twice and I→B once, so $A_{II} = 2/3$ and $A_{IB} = 1/3$.

Add **pseudocounts** (+1 to each count) so that events not seen in the training data don't get probability 0. It is exactly the same idea as in motif profiles.

{{ref:motifs#greedymotifsearch-and-pseudocounts}}

**Without labels**, we don't know the paths, so we alternate between guessing paths and re-estimating parameters:
- **Viterbi training:** start with random parameters; repeat {decode the best path with Viterbi; re-estimate A and E by counting along it}. A local search, much like randomized motif search.
- **Baum–Welch:** the same loop, but instead of committing to one best path, it uses **expected counts** computed from the forward–backward posteriors (every path contributes in proportion to its probability). It is a special case of **expectation–maximization (EM)**, and no iteration decreases the likelihood.

{{ref:algo#iterative-optimization-the-em-pattern}}

{{video:FoMHdshE6oM}}

:::example Does Baum–Welch guarantee the optimal model?
**No.** It converges to a **local maximum** of the likelihood (at worst a saddle point), which depends on the starting parameters, and it can overfit when the model has too many states.

**Remedies:** **multiple random restarts** (keep the highest likelihood), **sensible initialization** (e.g., from a small labelled set or from Viterbi training), **pseudocounts or Dirichlet priors**, constraining the model structure (fixing impossible transitions to 0), and annealing-style methods. Check generalization on held-out data.
:::

## CpG islands and gene finding

**CpG islands.** "CpG" means a C followed by a G on the same strand (the p is the phosphate between them). In vertebrate genomes CpG is rare, because the C in CpG is often **methylated**, and methylated C tends to mutate to T. Near many gene promoters, however, there are **CpG islands**: stretches of a few hundred to a few thousand bases where CpG is not methylated and remains common, with high C+G content overall. Finding them helps locate genes.

**An HMM for CpG islands** has an **Island** state (emissions rich in C and G) and a **Background** state (more A and T), with high self-transition probabilities so that regions are long. Viterbi then segments a genome into islands and background.

**Why not just slide a GC% window?** A window **ignores transition structure**: you must pick an arbitrary window size, and boundaries are noisy. The HMM balances the evidence from each base's emission against the cost of switching state, so a single G in an AT-rich region doesn't start an island, while a long GC-rich run does.

This lecture goes through the CpG island application in depth:

{{video:xi9c7J-E2C0}}

:::example Designing an HMM to separate exons from introns
- **States:** exon (often three states, one for each codon position), intron, intergenic, plus states for splice sites.
- **Emissions** capture composition: exons follow **codon usage** with a 3-base periodicity and are typically GC-richer; introns are AT-richer and start with **GT** and end with **AG** (the splice donor and acceptor signals).
- **Transitions** encode **structure and length**. A self-transition probability p gives a geometric length distribution with mean 1/(1 − p), so long introns get a high intron→intron probability. Exon→intron transitions go through donor-site states and intron→exon through acceptor states, which forbids impossible orders.
- **Viterbi** then labels each base as exon or intron by trading emission evidence against transition costs: a few intron-like bases inside an exon won't trigger a switch. Gene finders like **GENSCAN** are generalized HMMs of this kind.
:::

{{game:cpg-detective}}

## Beyond: profile HMMs and pair HMMs

- **Profile HMMs** model a protein family's multiple alignment with a **match**, **insert** and **delete** state for each column. **HMMER** (Sean Eddy) searches databases with them, and **Pfam** stores profile HMMs for tens of thousands of protein families. They are far more sensitive than BLAST for finding distant relatives, because they know which columns of the family are conserved.
- **Pair HMMs** emit *two* sequences at once, as aligned pairs. Their Viterbi path *is* an alignment. The three-state affine-gap diagram (M, X, Y) from the Sequence Alignment lesson is one.

{{ref:alignment#gap-penalties-linear-vs-affine}}

## Quick reference

| Algorithm | Computes | Operation | Time | Space |
|---|---|---|---|---|
| Viterbi | best path π* | max | O(n\|Q\|²) | O(n\|Q\|) |
| Forward | Pr(x) | sum | O(n\|Q\|²) | O(n\|Q\|) (O(\|Q\|) if only Pr(x) is needed) |
| Forward–Backward | Pr(πₜ = k \| x) | sum | O(n\|Q\|²) | O(n\|Q\|) |
| Baum–Welch | A, E (unlabelled data) | EM over forward–backward | O(n\|Q\|²) per iteration | O(n\|Q\|) |
