// Biological network topology: degrees, shortest paths, centralities, communities.

export type Graph = Record<string, string[]>; // undirected adjacency lists

export function fromEdges(edges: [string, string][]): Graph {
  const g: Graph = {};
  for (const [a, b] of edges) {
    (g[a] ??= []).includes(b) || g[a].push(b);
    (g[b] ??= []).includes(a) || g[b].push(a);
  }
  return g;
}

export function edgesOf(g: Graph): [string, string][] {
  const out: [string, string][] = [];
  for (const a of Object.keys(g)) for (const b of g[a]) if (a < b) out.push([a, b]);
  return out;
}

export function bfs(g: Graph, s: string): Record<string, number> {
  const d: Record<string, number> = { [s]: 0 };
  const q = [s];
  while (q.length) {
    const u = q.shift()!;
    for (const v of g[u] ?? []) if (d[v] === undefined) {
      d[v] = d[u] + 1;
      q.push(v);
    }
  }
  return d;
}

export function diameter(g: Graph): number {
  let best = 0;
  for (const v of Object.keys(g)) for (const x of Object.values(bfs(g, v))) best = Math.max(best, x);
  return best;
}

export function averagePathLength(g: Graph): number {
  let total = 0;
  let pairs = 0;
  for (const v of Object.keys(g))
    for (const [u, x] of Object.entries(bfs(g, v)))
      if (u !== v) {
        total += x;
        pairs++;
      }
  return pairs ? total / pairs : 0;
}

/** Closeness C(v) = (n-1) / sum_j d(v,j) over reachable nodes. */
export function closeness(g: Graph): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of Object.keys(g)) {
    const d = bfs(g, v);
    const sum = Object.values(d).reduce((a, b) => a + b, 0);
    out[v] = sum ? (Object.keys(d).length - 1) / sum : 0;
  }
  return out;
}

/** Brandes betweenness (unnormalized, undirected: each pair counted once). */
export function betweenness(g: Graph): Record<string, number> {
  const V = Object.keys(g);
  const CB: Record<string, number> = Object.fromEntries(V.map((v) => [v, 0]));
  for (const s of V) {
    const S: string[] = [];
    const P: Record<string, string[]> = Object.fromEntries(V.map((v) => [v, []]));
    const sigma: Record<string, number> = Object.fromEntries(V.map((v) => [v, 0]));
    const d: Record<string, number> = Object.fromEntries(V.map((v) => [v, -1]));
    sigma[s] = 1;
    d[s] = 0;
    const Q = [s];
    while (Q.length) {
      const v = Q.shift()!;
      S.push(v);
      for (const w of g[v]) {
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      }
    }
    const delta: Record<string, number> = Object.fromEntries(V.map((v) => [v, 0]));
    while (S.length) {
      const w = S.pop()!;
      for (const v of P[w]) delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      if (w !== s) CB[w] += delta[w];
    }
  }
  for (const v of V) CB[v] /= 2;
  return CB;
}

/** Edge betweenness (undirected), keyed "a|b" with a < b. */
export function edgeBetweenness(g: Graph): Record<string, number> {
  const V = Object.keys(g);
  const EB: Record<string, number> = {};
  for (const [a, b] of edgesOf(g)) EB[`${a}|${b}`] = 0;
  for (const s of V) {
    const S: string[] = [];
    const P: Record<string, string[]> = Object.fromEntries(V.map((v) => [v, []]));
    const sigma: Record<string, number> = Object.fromEntries(V.map((v) => [v, 0]));
    const d: Record<string, number> = Object.fromEntries(V.map((v) => [v, -1]));
    sigma[s] = 1;
    d[s] = 0;
    const Q = [s];
    while (Q.length) {
      const v = Q.shift()!;
      S.push(v);
      for (const w of g[v]) {
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      }
    }
    const delta: Record<string, number> = Object.fromEntries(V.map((v) => [v, 0]));
    while (S.length) {
      const w = S.pop()!;
      for (const v of P[w]) {
        const c = (sigma[v] / sigma[w]) * (1 + delta[w]);
        const key = v < w ? `${v}|${w}` : `${w}|${v}`;
        EB[key] += c;
        delta[v] += c;
      }
    }
  }
  for (const k of Object.keys(EB)) EB[k] /= 2;
  return EB;
}

/** Local clustering coefficient and global transitivity. */
export function clustering(g: Graph) {
  const local: Record<string, number> = {};
  let triangles = 0;
  let triples = 0;
  for (const v of Object.keys(g)) {
    const nb = g[v];
    const k = nb.length;
    let links = 0;
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (g[nb[i]].includes(nb[j])) links++;
    local[v] = k < 2 ? 0 : (2 * links) / (k * (k - 1));
    triangles += links;
    triples += (k * (k - 1)) / 2;
  }
  return { local, transitivity: triples ? triangles / triples : 0 };
}

export function components(g: Graph): string[][] {
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const v of Object.keys(g)) {
    if (seen.has(v)) continue;
    const comp = Object.keys(bfs(g, v));
    comp.forEach((c) => seen.add(c));
    out.push(comp.sort());
  }
  return out;
}

export function removeNode(g: Graph, v: string): Graph {
  const h: Graph = {};
  for (const [a, nb] of Object.entries(g)) if (a !== v) h[a] = nb.filter((b) => b !== v);
  return h;
}

/** Girvan-Newman: repeatedly remove the highest-betweenness edge; record the split sequence. */
export function girvanNewman(g0: Graph, maxSteps = 50) {
  let g: Graph = JSON.parse(JSON.stringify(g0));
  const steps: { removed: [string, string]; score: number; components: string[][] }[] = [];
  for (let s = 0; s < maxSteps && edgesOf(g).length; s++) {
    const eb = edgeBetweenness(g);
    const [key, score] = Object.entries(eb).sort((a, b) => b[1] - a[1])[0];
    const [a, b] = key.split('|');
    g[a] = g[a].filter((x) => x !== b);
    g[b] = g[b].filter((x) => x !== a);
    steps.push({ removed: [a, b], score, components: components(g) });
  }
  return steps;
}

/** Barabasi-Albert preferential attachment graph. */
export function barabasiAlbert(n: number, m: number, rng: () => number): Graph {
  const g: Graph = {};
  const targets: string[] = [];
  for (let i = 0; i <= m; i++) {
    g[`n${i}`] = [];
    for (let j = 0; j < i; j++) {
      g[`n${i}`].push(`n${j}`);
      g[`n${j}`].push(`n${i}`);
      targets.push(`n${i}`, `n${j}`);
    }
  }
  for (let i = m + 1; i < n; i++) {
    const v = `n${i}`;
    g[v] = [];
    const chosen = new Set<string>();
    while (chosen.size < m) chosen.add(targets[Math.floor(rng() * targets.length)]);
    for (const u of chosen) {
      g[v].push(u);
      g[u].push(v);
      targets.push(u, v);
    }
  }
  return g;
}

/** Erdos-Renyi G(n, p). */
export function erdosRenyi(n: number, p: number, rng: () => number): Graph {
  const g: Graph = {};
  for (let i = 0; i < n; i++) g[`n${i}`] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (rng() < p) {
        g[`n${i}`].push(`n${j}`);
        g[`n${j}`].push(`n${i}`);
      }
  return g;
}
