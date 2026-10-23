// Supervised learning helpers: metrics, KNN, logistic regression, k-mer features.

export interface Confusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export function metrics({ tp, fp, tn, fn }: Confusion) {
  const total = tp + fp + tn + fn;
  const accuracy = total ? (tp + tn) / total : 0;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const specificity = tn + fp ? tn / (tn + fp) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const denom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = denom ? (tp * tn - fp * fn) / denom : 0;
  const balancedAccuracy = (recall + specificity) / 2;
  return { accuracy, precision, recall, specificity, f1, mcc, balancedAccuracy };
}

/** k-mer composition feature vector (normalized frequencies over all 4^k k-mers). */
export function kmerFeatures(seq: string, k: number): { kmers: string[]; values: number[] } {
  let kmers = [''];
  for (let i = 0; i < k; i++) kmers = kmers.flatMap((s) => ['A', 'C', 'G', 'T'].map((n) => s + n));
  const counts = new Map(kmers.map((km) => [km, 0]));
  let total = 0;
  for (let i = 0; i + k <= seq.length; i++) {
    const km = seq.substr(i, k);
    if (counts.has(km)) {
      counts.set(km, counts.get(km)! + 1);
      total++;
    }
  }
  return { kmers, values: kmers.map((km) => (total ? counts.get(km)! / total : 0)) };
}

export function knnPredict(train: { x: number[]; y: number }[], q: number[], k: number) {
  const ranked = train
    .map((t) => ({ ...t, d: Math.sqrt(t.x.reduce((s, v, i) => s + (v - q[i]) ** 2, 0)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k);
  const votes = new Map<number, number>();
  for (const r of ranked) votes.set(r.y, (votes.get(r.y) ?? 0) + 1);
  const label = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { label, neighbors: ranked };
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** One epoch of batch gradient descent on cross-entropy loss; w[0] is the bias. */
export function logisticStep(X: number[][], y: number[], w: number[], lr: number, classWeight: [number, number] = [1, 1]) {
  const grad = new Array(w.length).fill(0);
  let loss = 0;
  X.forEach((x, i) => {
    const z = w[0] + x.reduce((s, v, j) => s + v * w[j + 1], 0);
    const p = sigmoid(z);
    const cw = classWeight[y[i]];
    loss += -cw * (y[i] * Math.log(p + 1e-12) + (1 - y[i]) * Math.log(1 - p + 1e-12));
    const e = cw * (p - y[i]);
    grad[0] += e;
    x.forEach((v, j) => (grad[j + 1] += e * v));
  });
  return { w: w.map((wi, j) => wi - (lr * grad[j]) / X.length), loss: loss / X.length };
}

/** Gradient descent for simple linear regression y = w0 + w1 x (loss = 1/2 sum of squares). */
export function linRegStep(xs: number[], ys: number[], w0: number, w1: number, lr: number) {
  let g0 = 0;
  let g1 = 0;
  let loss = 0;
  xs.forEach((x, i) => {
    const e = w0 + w1 * x - ys[i];
    g0 += e;
    g1 += e * x;
    loss += 0.5 * e * e;
  });
  return { w0: w0 - lr * g0, w1: w1 - lr * g1, loss };
}
