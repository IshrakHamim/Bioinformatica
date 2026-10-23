// Distance-based phylogeny (Compeau & Pevzner, Ch. 7).

export interface TreeNode {
  id: string;
  children: { node: TreeNode; length: number }[];
  age?: number; // UPGMA height
}

export interface UpgmaStep {
  merged: [string, string];
  distance: number;
  height: number;
  newCluster: string;
  matrixAfter: { labels: string[]; D: number[][] };
}

/** UPGMA: merge closest clusters, height = D/2, distances averaged weighted by cluster size. */
export function upgma(labels: string[], D: number[][]) {
  let clusters = labels.map((l) => ({ name: l, size: 1, node: { id: l, children: [], age: 0 } as TreeNode }));
  let M = D.map((r) => [...r]);
  const steps: UpgmaStep[] = [];
  while (clusters.length > 1) {
    let bi = 0;
    let bj = 1;
    for (let i = 0; i < clusters.length; i++)
      for (let j = i + 1; j < clusters.length; j++) if (M[i][j] < M[bi][bj]) [bi, bj] = [i, j];
    const a = clusters[bi];
    const b = clusters[bj];
    const height = M[bi][bj] / 2;
    const name = `(${a.name},${b.name})`;
    const node: TreeNode = {
      id: name,
      age: height,
      children: [
        { node: a.node, length: height - (a.node.age ?? 0) },
        { node: b.node, length: height - (b.node.age ?? 0) },
      ],
    };
    const keep = clusters.map((_, i) => i).filter((i) => i !== bi && i !== bj);
    const newRow = keep.map((k) => (M[bi][k] * a.size + M[bj][k] * b.size) / (a.size + b.size));
    const nextM = keep.map((i, r) => [...keep.map((j) => M[i][j]), newRow[r]]);
    nextM.push([...newRow, 0]);
    clusters = [...keep.map((i) => clusters[i]), { name, size: a.size + b.size, node }];
    M = nextM;
    steps.push({ merged: [a.name, b.name], distance: height * 2, height, newCluster: name, matrixAfter: { labels: clusters.map((c) => c.name), D: M.map((r) => [...r]) } });
  }
  return { root: clusters[0].node, steps };
}

/** Limb length theorem: min over i,k != j of (D[i][j] + D[j][k] - D[i][k]) / 2. */
export function limbLength(D: number[][], j: number): { length: number; i: number; k: number } {
  let best = { length: Infinity, i: -1, k: -1 };
  const n = D.length;
  for (let i = 0; i < n; i++)
    for (let k = 0; k < n; k++) {
      if (i === j || k === j || i === k) continue;
      const v = (D[i][j] + D[j][k] - D[i][k]) / 2;
      if (v < best.length) best = { length: v, i, k };
    }
  return best;
}

export function isAdditive(D: number[][]): boolean {
  // four-point condition
  const n = D.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++)
        for (let l = k + 1; l < n; l++) {
          const s = [D[i][j] + D[k][l], D[i][k] + D[j][l], D[i][l] + D[j][k]].sort((a, b) => a - b);
          if (Math.abs(s[1] - s[2]) > 1e-9) return false;
        }
  return true;
}

export interface NJStep {
  labels: string[];
  Dstar: number[][];
  totals: number[];
  pair: [string, string];
  limbs: [number, number];
  newNode: string;
}

/** Neighbor joining. Returns an unrooted tree as an edge list plus the step trace. */
export function neighborJoining(labels: string[], D0: number[][]) {
  let names = [...labels];
  let D = D0.map((r) => [...r]);
  const edges: { a: string; b: string; length: number }[] = [];
  const steps: NJStep[] = [];
  let counter = 0;
  while (names.length > 2) {
    const n = names.length;
    const totals = D.map((r) => r.reduce((a, b) => a + b, 0));
    const Dstar = D.map((r, i) => r.map((v, j) => (i === j ? 0 : (n - 2) * v - totals[i] - totals[j])));
    let bi = 0;
    let bj = 1;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Dstar[i][j] < Dstar[bi][bj]) [bi, bj] = [i, j];
    const delta = (totals[bi] - totals[bj]) / (n - 2);
    const li = (D[bi][bj] + delta) / 2;
    const lj = (D[bi][bj] - delta) / 2;
    const m = `v${++counter}`;
    steps.push({ labels: [...names], Dstar, totals, pair: [names[bi], names[bj]], limbs: [li, lj], newNode: m });
    edges.push({ a: m, b: names[bi], length: li }, { a: m, b: names[bj], length: lj });
    const keep = names.map((_, i) => i).filter((i) => i !== bi && i !== bj);
    const newRow = keep.map((k) => (D[k][bi] + D[k][bj] - D[bi][bj]) / 2);
    const nextD = keep.map((i, r) => [...keep.map((j) => D[i][j]), newRow[r]]);
    nextD.push([...newRow, 0]);
    names = [...keep.map((i) => names[i]), m];
    D = nextD;
  }
  edges.push({ a: names[0], b: names[1], length: D[0][1] });
  return { edges, steps };
}

export interface FitchNode {
  id: string;
  state?: string; // leaf character
  left?: FitchNode;
  right?: FitchNode;
}

/** Fitch small parsimony for one character on a rooted binary tree. */
export function fitch(root: FitchNode) {
  const sets = new Map<string, Set<string>>();
  let changes = 0;
  const up = (v: FitchNode): Set<string> => {
    if (!v.left || !v.right) {
      const s = new Set([v.state!]);
      sets.set(v.id, s);
      return s;
    }
    const a = up(v.left);
    const b = up(v.right);
    const inter = new Set([...a].filter((x) => b.has(x)));
    const s = inter.size ? inter : new Set([...a, ...b]);
    if (!inter.size) changes++;
    sets.set(v.id, s);
    return s;
  };
  up(root);
  const assigned = new Map<string, string>();
  const down = (v: FitchNode, parentState?: string) => {
    const s = sets.get(v.id)!;
    const st = parentState && s.has(parentState) ? parentState : [...s].sort()[0];
    assigned.set(v.id, st);
    if (v.left) down(v.left, st);
    if (v.right) down(v.right, st);
  };
  down(root);
  return { sets, assigned, changes };
}

export function toNewick(n: TreeNode): string {
  if (!n.children.length) return n.id;
  return `(${n.children.map((c) => `${toNewick(c.node)}:${+c.length.toFixed(3)}`).join(',')})`;
}
