// Hidden Markov Models: Viterbi, Forward, Backward, posterior decoding.

export interface HMM {
  states: string[];
  symbols: string[];
  init: number[]; // P(pi_1 = k)
  trans: number[][]; // trans[k][l] = P(k -> l)
  emit: number[][]; // emit[k][symbolIndex]
}

export interface ViterbiResult {
  V: number[][]; // V[k][t] (log2 if useLog else probability)
  back: number[][];
  path: string;
  pathIdx: number[];
  best: number;
}

export function viterbi(h: HMM, x: string, useLog = true): ViterbiResult {
  const K = h.states.length;
  const n = x.length;
  const sym = (c: string) => {
    const i = h.symbols.indexOf(c);
    if (i < 0) throw new Error(`Symbol ${c} not in alphabet`);
    return i;
  };
  const f = (p: number) => (useLog ? Math.log2(p) : p);
  const comb = (a: number, b: number) => (useLog ? a + b : a * b);
  const V = Array.from({ length: K }, () => new Array(n).fill(useLog ? -Infinity : 0));
  const back = Array.from({ length: K }, () => new Array(n).fill(-1));
  for (let k = 0; k < K; k++) V[k][0] = comb(f(h.init[k]), f(h.emit[k][sym(x[0])]));
  for (let t = 1; t < n; t++) {
    const s = sym(x[t]);
    for (let l = 0; l < K; l++) {
      let best = -Infinity;
      let arg = 0;
      for (let k = 0; k < K; k++) {
        const v = comb(V[k][t - 1], f(h.trans[k][l]));
        if (v > best) {
          best = v;
          arg = k;
        }
      }
      V[l][t] = comb(best, f(h.emit[l][s]));
      back[l][t] = arg;
    }
  }
  let last = 0;
  for (let k = 1; k < K; k++) if (V[k][n - 1] > V[last][n - 1]) last = k;
  const pathIdx = new Array(n);
  pathIdx[n - 1] = last;
  for (let t = n - 1; t > 0; t--) pathIdx[t - 1] = back[pathIdx[t]][t];
  return { V, back, pathIdx, path: pathIdx.map((k) => h.states[k]).join(''), best: V[last][n - 1] };
}

export function forward(h: HMM, x: string) {
  const K = h.states.length;
  const n = x.length;
  const sym = (c: string) => h.symbols.indexOf(c);
  const F = Array.from({ length: K }, () => new Array(n).fill(0));
  for (let k = 0; k < K; k++) F[k][0] = h.init[k] * h.emit[k][sym(x[0])];
  for (let t = 1; t < n; t++)
    for (let l = 0; l < K; l++) {
      let s = 0;
      for (let k = 0; k < K; k++) s += F[k][t - 1] * h.trans[k][l];
      F[l][t] = s * h.emit[l][sym(x[t])];
    }
  const total = F.reduce((s, row) => s + row[n - 1], 0);
  return { F, total };
}

export function backward(h: HMM, x: string) {
  const K = h.states.length;
  const n = x.length;
  const sym = (c: string) => h.symbols.indexOf(c);
  const B = Array.from({ length: K }, () => new Array(n).fill(0));
  for (let k = 0; k < K; k++) B[k][n - 1] = 1;
  for (let t = n - 2; t >= 0; t--)
    for (let k = 0; k < K; k++) {
      let s = 0;
      for (let l = 0; l < K; l++) s += h.trans[k][l] * h.emit[l][sym(x[t + 1])] * B[l][t + 1];
      B[k][t] = s;
    }
  return { B };
}

/** Posterior P(pi_t = k | x) for every position. */
export function posterior(h: HMM, x: string): number[][] {
  const { F, total } = forward(h, x);
  const { B } = backward(h, x);
  return F.map((row, k) => row.map((f, t) => (f * B[k][t]) / total));
}

/** Joint probability P(x, pi) of a given state path. */
export function jointProbability(h: HMM, x: string, path: string): number {
  const si = (c: string) => h.states.indexOf(c);
  const yi = (c: string) => h.symbols.indexOf(c);
  let p = h.init[si(path[0])] * h.emit[si(path[0])][yi(x[0])];
  for (let t = 1; t < x.length; t++) p *= h.trans[si(path[t - 1])][si(path[t])] * h.emit[si(path[t])][yi(x[t])];
  return p;
}

export function sampleHMM(h: HMM, n: number, rng: () => number) {
  const pick = (w: number[]) => {
    let r = rng();
    for (let i = 0; i < w.length; i++) {
      r -= w[i];
      if (r <= 0) return i;
    }
    return w.length - 1;
  };
  let k = pick(h.init);
  let states = '';
  let obs = '';
  for (let t = 0; t < n; t++) {
    states += h.states[k];
    obs += h.symbols[pick(h.emit[k])];
    k = pick(h.trans[k]);
  }
  return { states, obs };
}

/** The GC-content toy HMM from Borodovsky & Ekisheva (2006), used in the course handout. */
export const GC_HMM: HMM = {
  states: ['H', 'L'],
  symbols: ['A', 'C', 'G', 'T'],
  init: [0.5, 0.5],
  trans: [
    [0.5, 0.5],
    [0.4, 0.6],
  ],
  emit: [
    [0.2, 0.3, 0.3, 0.2],
    [0.3, 0.2, 0.2, 0.3],
  ],
};

/** The fair/biased coin casino from the course HMM slides (switch prob 0.1). */
export const CASINO_HMM: HMM = {
  states: ['F', 'B'],
  symbols: ['H', 'T'],
  init: [0.5, 0.5],
  trans: [
    [0.9, 0.1],
    [0.1, 0.9],
  ],
  emit: [
    [0.5, 0.5],
    [0.75, 0.25],
  ],
};
