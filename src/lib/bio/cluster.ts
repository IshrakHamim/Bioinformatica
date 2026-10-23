// Clustering for gene expression analysis (Compeau & Pevzner Vol. 2, Ch. 8).
import { weightedIndex } from './rng';

export type Vec = number[];

export const sqDist = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);
export const dist = (a: Vec, b: Vec) => Math.sqrt(sqDist(a, b));

export function distortion(data: Vec[], centers: Vec[]): number {
  return data.reduce((s, p) => s + Math.min(...centers.map((c) => sqDist(p, c))), 0) / data.length;
}

export function assign(data: Vec[], centers: Vec[]): number[] {
  return data.map((p) => {
    let best = 0;
    centers.forEach((c, i) => {
      if (sqDist(p, c) < sqDist(p, centers[best])) best = i;
    });
    return best;
  });
}

export function centroids(data: Vec[], labels: number[], k: number, old: Vec[]): Vec[] {
  return Array.from({ length: k }, (_, c) => {
    const members = data.filter((_, i) => labels[i] === c);
    if (!members.length) return old[c];
    return members[0].map((_, d) => members.reduce((s, m) => s + m[d], 0) / members.length);
  });
}

/** Lloyd's algorithm; returns every (assignment, centers) iteration. */
export function lloyd(data: Vec[], init: Vec[], maxIter = 50) {
  let centers = init.map((c) => [...c]);
  const history: { centers: Vec[]; labels: number[]; distortion: number }[] = [];
  for (let it = 0; it < maxIter; it++) {
    const labels = assign(data, centers);
    history.push({ centers, labels, distortion: distortion(data, centers) });
    const next = centroids(data, labels, centers.length, centers);
    if (next.every((c, i) => sqDist(c, centers[i]) < 1e-12)) break;
    centers = next;
  }
  return history;
}

/** Probability that each point becomes the next center under k-means++ (D^2 weighting). */
export function kmeansPPProbabilities(data: Vec[], chosen: Vec[]): number[] {
  const d2 = data.map((p) => Math.min(...chosen.map((c) => sqDist(p, c))));
  const total = d2.reduce((a, b) => a + b, 0);
  return d2.map((v) => (total ? v / total : 0));
}

export function kmeansPP(data: Vec[], k: number, rng: () => number): Vec[] {
  const centers = [data[Math.floor(rng() * data.length)]];
  while (centers.length < k) centers.push(data[weightedIndex(rng, kmeansPPProbabilities(data, centers))]);
  return centers.map((c) => [...c]);
}

/**
 * Soft k-means E-step. `squared` chooses e^{-beta*||x-mu||^2} (the course exams) vs
 * e^{-beta*||x-mu||} (the Pevzner textbook "partition function" form).
 */
export function softAssign(data: Vec[], centers: Vec[], beta: number, squared = true): number[][] {
  return data.map((p) => {
    const w = centers.map((c) => Math.exp(-beta * (squared ? sqDist(p, c) : dist(p, c))));
    const z = w.reduce((a, b) => a + b, 0);
    return w.map((v) => v / z);
  });
}

/** Soft k-means M-step: weighted centers of gravity. resp[i][k]. */
export function softCenters(data: Vec[], resp: number[][]): Vec[] {
  const K = resp[0].length;
  return Array.from({ length: K }, (_, k) => {
    const wsum = resp.reduce((s, r) => s + r[k], 0);
    return data[0].map((_, d) => data.reduce((s, p, i) => s + resp[i][k] * p[d], 0) / wsum);
  });
}

export type Linkage = 'single' | 'complete' | 'average';

export interface Merge {
  a: number; // cluster ids (leaves 0..n-1, merges n..)
  b: number;
  id: number;
  height: number;
  members: number[];
}

/** Agglomerative clustering from a distance matrix. */
export function hierarchical(D: number[][], linkage: Linkage): Merge[] {
  const n = D.length;
  let active = Array.from({ length: n }, (_, i) => ({ id: i, members: [i] }));
  const merges: Merge[] = [];
  const cd = (A: number[], B: number[]) => {
    const vals = A.flatMap((i) => B.map((j) => D[i][j]));
    if (linkage === 'single') return Math.min(...vals);
    if (linkage === 'complete') return Math.max(...vals);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  let next = n;
  while (active.length > 1) {
    let bi = 0;
    let bj = 1;
    let best = Infinity;
    for (let i = 0; i < active.length; i++)
      for (let j = i + 1; j < active.length; j++) {
        const v = cd(active[i].members, active[j].members);
        if (v < best) {
          best = v;
          bi = i;
          bj = j;
        }
      }
    const merged = { id: next++, members: [...active[bi].members, ...active[bj].members] };
    merges.push({ a: active[bi].id, b: active[bj].id, id: merged.id, height: best, members: merged.members });
    active = [...active.filter((_, i) => i !== bi && i !== bj), merged];
  }
  return merges;
}

export function distanceMatrix(data: Vec[]): number[][] {
  return data.map((a) => data.map((b) => dist(a, b)));
}
