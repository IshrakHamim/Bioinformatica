// Step-by-step traces of the classic algorithms in the Algorithms foundation, for the animated widgets.

/** MinCoins DP: table[m] and the coin chosen for m (null if m can't be made). */
export function minCoinsDP(coins: number[], amount: number) {
  const best: number[] = [0];
  const choice: (number | null)[] = [null];
  for (let m = 1; m <= amount; m++) {
    best[m] = Infinity;
    choice[m] = null;
    for (const c of coins)
      if (c <= m && best[m - c] + 1 < best[m]) {
        best[m] = best[m - c] + 1;
        choice[m] = c;
      }
  }
  const coinsUsed: number[] = [];
  for (let m = amount; m > 0 && choice[m] !== null; m -= choice[m]!) coinsUsed.push(choice[m]!);
  return { best, choice, coinsUsed };
}

/** Greedy change: always take the largest coin that fits. Returns null if it gets stuck. */
export function greedyChange(coins: number[], amount: number): number[] | null {
  const sorted = [...coins].sort((a, b) => b - a);
  const used: number[] = [];
  let m = amount;
  while (m > 0) {
    const c = sorted.find((x) => x <= m);
    if (c === undefined) return null;
    used.push(c);
    m -= c;
  }
  return used;
}

export type Adj = Record<string, string[]>;

export interface SearchStep {
  current: string | null;
  frontier: string[]; // queue (BFS) or stack (DFS), front first
  visited: string[]; // in visiting order
  dist: Record<string, number>; // BFS layer of each discovered node (BFS only)
  tree: [string, string][]; // discovery edges
  note: string;
}

/** BFS (queue) or DFS (stack) from s, one snapshot per node taken off the frontier. */
export function graphSearchTrace(g: Adj, s: string, mode: 'bfs' | 'dfs'): SearchStep[] {
  const steps: SearchStep[] = [];
  const visited: string[] = [];
  const dist: Record<string, number> = { [s]: 0 };
  const tree: [string, string][] = [];
  const seen = new Set([s]);
  let frontier = [s];
  steps.push({ current: null, frontier: [...frontier], visited: [], dist: { ...dist }, tree: [], note: `Start: put ${s} in the ${mode === 'bfs' ? 'queue' : 'stack'}.` });
  if (mode === 'bfs') {
    while (frontier.length) {
      const u = frontier[0];
      frontier = frontier.slice(1);
      visited.push(u);
      const added: string[] = [];
      for (const v of g[u] ?? [])
        if (!seen.has(v)) {
          seen.add(v);
          dist[v] = dist[u] + 1;
          tree.push([u, v]);
          frontier.push(v);
          added.push(v);
        }
      steps.push({ current: u, frontier: [...frontier], visited: [...visited], dist: { ...dist }, tree: [...tree], note: `Dequeue ${u} (distance ${dist[u]}). ${added.length ? `New neighbours ${added.join(', ')} join the back of the queue at distance ${dist[u] + 1}.` : 'No undiscovered neighbours.'}` });
    }
  } else {
    // iterative DFS: a node is visited when popped; neighbours pushed in reverse so the first is explored first
    const parent: Record<string, string> = {};
    const done = new Set<string>();
    while (frontier.length) {
      const u = frontier[frontier.length - 1];
      frontier = frontier.slice(0, -1);
      if (done.has(u)) continue;
      done.add(u);
      visited.push(u);
      if (parent[u]) tree.push([parent[u], u]);
      const added: string[] = [];
      for (const v of [...(g[u] ?? [])].reverse())
        if (!done.has(v)) {
          parent[v] = u;
          frontier.push(v);
          added.unshift(v);
        }
      steps.push({ current: u, frontier: [...frontier].reverse(), visited: [...visited], dist: {}, tree: [...tree], note: `Pop ${u} from the top of the stack and visit it. ${added.length ? `Push ${added.join(', ')}; ${added[0]} will be explored next, going deeper before trying siblings.` : 'Nothing new below it, so we backtrack.'}` });
    }
  }
  return steps;
}

export interface EulerStep {
  stack: string[];
  circuit: string[]; // built in reverse, as Hierholzer pops nodes
  used: number[]; // indices of used edges
  edge: number | null; // edge just walked
  note: string;
}

/** Hierholzer's algorithm (stack version) on a directed multigraph, starting at `start`. */
export function hierholzerTrace(edges: [string, string][], start: string): { steps: EulerStep[]; path: string[] } {
  const out: Record<string, number[]> = {};
  edges.forEach(([a], i) => (out[a] ??= []).push(i));
  const next: Record<string, number> = {};
  const stack = [start];
  const circuit: string[] = [];
  const used: number[] = [];
  const steps: EulerStep[] = [{ stack: [...stack], circuit: [], used: [], edge: null, note: `Start at ${start}.` }];
  while (stack.length) {
    const u = stack[stack.length - 1];
    const list = out[u] ?? [];
    const i = next[u] ?? 0;
    if (i < list.length) {
      next[u] = i + 1;
      const e = list[i];
      used.push(e);
      stack.push(edges[e][1]);
      steps.push({ stack: [...stack], circuit: [...circuit], used: [...used], edge: e, note: `Walk the unused edge ${u} → ${edges[e][1]}.` });
    } else {
      stack.pop();
      circuit.push(u);
      steps.push({ stack: [...stack], circuit: [...circuit], used: [...used], edge: null, note: `Stuck at ${u}: no unused edges leave it. Pop it onto the finished path (built from the end).${stack.length ? ` Back at ${stack[stack.length - 1]}: if it still has unused edges, a detour cycle is spliced in here.` : ''}` });
    }
  }
  return { steps, path: [...circuit].reverse() };
}

export interface BSearchStep {
  lo: number;
  hi: number;
  mid: number;
  cmp: -1 | 0 | 1; // sign of compare(arr[mid], q)
}

/** Lower-bound binary search: first index i with arr[i] >= q. */
export function binarySearchTrace(arr: string[], q: string): { steps: BSearchStep[]; index: number; found: boolean } {
  let lo = 0;
  let hi = arr.length;
  const steps: BSearchStep[] = [];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const cmp = arr[mid] < q ? -1 : arr[mid] > q ? 1 : 0;
    steps.push({ lo, hi, mid, cmp });
    if (arr[mid] < q) lo = mid + 1;
    else hi = mid;
  }
  return { steps, index: lo, found: arr[lo] === q };
}

export interface FibCall {
  n: number;
  depth: number;
  parent: number; // index of the calling node, −1 for the root
  memoHit: boolean;
}

/** Every call of recursive fib(n), in call order, with or without memoization. */
export function fibCalls(n: number, memo: boolean): FibCall[] {
  const calls: FibCall[] = [];
  const known = new Set<number>();
  const go = (k: number, depth: number, parent: number) => {
    const idx = calls.length;
    const hit = memo && known.has(k);
    calls.push({ n: k, depth, parent, memoHit: hit });
    if (hit || k < 2) {
      known.add(k);
      return;
    }
    go(k - 1, depth + 1, idx);
    go(k - 2, depth + 1, idx);
    known.add(k);
  };
  go(n, 0, -1);
  return calls;
}

/** A simple deterministic hash for the hash-map animation (polynomial, mod buckets). */
export function toyHash(s: string, buckets: number) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003;
  return h % buckets;
}
