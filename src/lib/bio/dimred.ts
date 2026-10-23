// Dimensionality reduction: PCA (power iteration) and a compact exact t-SNE.

export type Vec = number[];

export function mean(data: Vec[]): Vec {
  return data[0].map((_, d) => data.reduce((s, p) => s + p[d], 0) / data.length);
}

export function covariance(data: Vec[]): number[][] {
  const mu = mean(data);
  const dim = mu.length;
  const C = Array.from({ length: dim }, () => new Array(dim).fill(0));
  for (const p of data)
    for (let i = 0; i < dim; i++) for (let j = 0; j < dim; j++) C[i][j] += (p[i] - mu[i]) * (p[j] - mu[j]);
  return C.map((r) => r.map((v) => v / (data.length - 1)));
}

const matVec = (A: number[][], v: Vec) => A.map((r) => r.reduce((s, a, j) => s + a * v[j], 0));
const norm = (v: Vec) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));

/** Top-k eigenpairs of a symmetric matrix by power iteration with deflation. */
export function eigenSymmetric(A0: number[][], k: number) {
  let A = A0.map((r) => [...r]);
  const n = A.length;
  const out: { value: number; vector: Vec }[] = [];
  for (let e = 0; e < k; e++) {
    let v = Array.from({ length: n }, (_, i) => 1 / Math.sqrt(n) + i * 1e-3);
    let lambda = 0;
    for (let it = 0; it < 500; it++) {
      const w = matVec(A, v);
      const nw = norm(w);
      if (nw < 1e-12) break;
      v = w.map((x) => x / nw);
      lambda = v.reduce((s, x, i) => s + x * matVec(A, v)[i], 0);
    }
    out.push({ value: lambda, vector: v });
    A = A.map((r, i) => r.map((a, j) => a - lambda * v[i] * v[j]));
  }
  return out;
}

export function pca(data: Vec[], k = 2) {
  const mu = mean(data);
  const C = covariance(data);
  const eig = eigenSymmetric(C, k);
  const totalVar = C.reduce((s, r, i) => s + r[i], 0);
  const scores = data.map((p) => eig.map((e) => e.vector.reduce((s, x, d) => s + x * (p[d] - mu[d]), 0)));
  return { mean: mu, components: eig, scores, explained: eig.map((e) => e.value / totalVar) };
}

/** KL(P || Q) for discrete distributions (natural log). */
export function kl(P: number[], Q: number[]): number {
  return P.reduce((s, p, i) => (p > 0 ? s + p * Math.log(p / Q[i]) : s), 0);
}

/**
 * Exact t-SNE (van der Maaten & Hinton 2008) for small n. Yields after each `chunk`
 * iterations so a UI can animate it.
 */
export function* tsne(data: Vec[], opts: { perplexity?: number; iters?: number; lr?: number; rng: () => number; dim?: number; chunk?: number }) {
  const n = data.length;
  const perplexity = opts.perplexity ?? 10;
  const iters = opts.iters ?? 500;
  const lr = opts.lr ?? 100;
  const dim = opts.dim ?? 2;
  const chunk = opts.chunk ?? 10;
  const D = data.map((a) => data.map((b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0)));
  // binary search for sigma_i matching the perplexity
  const P = Array.from({ length: n }, () => new Array(n).fill(0));
  const logU = Math.log(perplexity);
  for (let i = 0; i < n; i++) {
    let betaMin = -Infinity;
    let betaMax = Infinity;
    let beta = 1;
    for (let tries = 0; tries < 60; tries++) {
      let sum = 0;
      for (let j = 0; j < n; j++) if (j !== i) sum += (P[i][j] = Math.exp(-D[i][j] * beta));
      let H = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        P[i][j] /= sum || 1e-12;
        if (P[i][j] > 1e-12) H -= P[i][j] * Math.log(P[i][j]);
      }
      if (Math.abs(H - logU) < 1e-5) break;
      if (H > logU) {
        betaMin = beta;
        beta = betaMax === Infinity ? beta * 2 : (beta + betaMax) / 2;
      } else {
        betaMax = beta;
        beta = betaMin === -Infinity ? beta / 2 : (beta + betaMin) / 2;
      }
    }
  }
  // symmetrize
  const Psym = P.map((r, i) => r.map((_, j) => Math.max((P[i][j] + P[j][i]) / (2 * n), 1e-12)));
  let Y = Array.from({ length: n }, () => Array.from({ length: dim }, () => (opts.rng() - 0.5) * 1e-2));
  let gains = Array.from({ length: n }, () => new Array(dim).fill(1));
  let vel = Array.from({ length: n }, () => new Array(dim).fill(0));
  for (let it = 0; it < iters; it++) {
    const exag = it < 100 ? 4 : 1;
    const num = Array.from({ length: n }, () => new Array(n).fill(0));
    let Z = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const d = Y[i].reduce((s, v, k) => s + (v - Y[j][k]) ** 2, 0);
        const q = 1 / (1 + d); // Student-t with 1 degree of freedom
        num[i][j] = num[j][i] = q;
        Z += 2 * q;
      }
    const mom = it < 250 ? 0.5 : 0.8;
    const grad = Array.from({ length: n }, () => new Array(dim).fill(0));
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const mult = 4 * (exag * Psym[i][j] - num[i][j] / Z) * num[i][j];
        for (let k = 0; k < dim; k++) grad[i][k] += mult * (Y[i][k] - Y[j][k]);
      }
    gains = gains.map((g, i) => g.map((gv, k) => Math.max(0.01, Math.sign(grad[i][k]) !== Math.sign(vel[i][k]) ? gv + 0.2 : gv * 0.8)));
    vel = vel.map((v, i) => v.map((vv, k) => mom * vv - lr * gains[i][k] * grad[i][k]));
    Y = Y.map((y, i) => y.map((v, k) => v + vel[i][k]));
    const mu = mean(Y);
    Y = Y.map((y) => y.map((v, k) => v - mu[k]));
    if (it % chunk === 0 || it === iters - 1) {
      let cost = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) cost += Psym[i][j] * Math.log(Psym[i][j] / Math.max(num[i][j] / Z, 1e-12));
      yield { Y: Y.map((r) => [...r]), iter: it, cost };
    }
  }
}
