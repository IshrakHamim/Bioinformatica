// Genome assembly graphs (Compeau & Pevzner, Ch. 3).

export interface Edge {
  from: string;
  to: string;
  label: string; // the k-mer (or read pair) this edge represents
  id: number;
}

export interface MultiGraph {
  nodes: string[];
  edges: Edge[];
}

export function overlapGraph(kmers: string[]): MultiGraph {
  const nodes = kmers.map((k, i) => `${k}#${i}`);
  const edges: Edge[] = [];
  let id = 0;
  kmers.forEach((a, i) =>
    kmers.forEach((b, j) => {
      if (i !== j && a.slice(1) === b.slice(0, -1)) edges.push({ from: nodes[i], to: nodes[j], label: '', id: id++ });
    }),
  );
  return { nodes, edges };
}

/** de Bruijn graph: one edge prefix(k-mer) -> suffix(k-mer) per k-mer (repeats kept). */
export function deBruijnFromKmers(kmers: string[]): MultiGraph {
  const nodeSet = new Set<string>();
  const edges = kmers.map((k, id) => {
    const from = k.slice(0, -1);
    const to = k.slice(1);
    nodeSet.add(from);
    nodeSet.add(to);
    return { from, to, label: k, id };
  });
  return { nodes: [...nodeSet].sort(), edges };
}

export function deBruijnFromText(text: string, k: number): MultiGraph {
  const kmers: string[] = [];
  for (let i = 0; i + k <= text.length; i++) kmers.push(text.substr(i, k));
  return deBruijnFromKmers(kmers);
}

export function degrees(g: MultiGraph) {
  const indeg: Record<string, number> = {};
  const outdeg: Record<string, number> = {};
  for (const n of g.nodes) indeg[n] = outdeg[n] = 0;
  for (const e of g.edges) {
    outdeg[e.from]++;
    indeg[e.to]++;
  }
  return { indeg, outdeg };
}

export interface EulerResult {
  ok: boolean;
  reason?: string;
  edgeOrder: Edge[]; // edges in traversal order
  nodePath: string[];
  start?: string;
  end?: string;
}

/**
 * Eulerian path via Hierholzer's algorithm. Adjacency lists are sorted by target so the
 * answer is deterministic. Works for both Eulerian cycles and paths.
 */
export function eulerianPath(g: MultiGraph): EulerResult {
  const { indeg, outdeg } = degrees(g);
  let start: string | undefined;
  let end: string | undefined;
  for (const n of g.nodes) {
    const diff = outdeg[n] - indeg[n];
    if (diff === 1) {
      if (start) return { ok: false, reason: 'More than one node has out-degree = in-degree + 1', edgeOrder: [], nodePath: [] };
      start = n;
    } else if (diff === -1) {
      if (end) return { ok: false, reason: 'More than one node has in-degree = out-degree + 1', edgeOrder: [], nodePath: [] };
      end = n;
    } else if (diff !== 0) {
      return { ok: false, reason: `Node ${n} is too unbalanced (in ${indeg[n]}, out ${outdeg[n]})`, edgeOrder: [], nodePath: [] };
    }
  }
  if (!start) start = g.edges.length ? [...g.edges].sort((a, b) => a.from.localeCompare(b.from))[0].from : g.nodes[0];
  const adj: Record<string, Edge[]> = {};
  for (const n of g.nodes) adj[n] = [];
  for (const e of g.edges) adj[e.from].push(e);
  // reverse-sorted so pop() takes the lexicographically smallest target first
  for (const n of g.nodes) adj[n].sort((a, b) => b.to.localeCompare(a.to) || b.id - a.id);

  const stack: { node: string; via?: Edge }[] = [{ node: start }];
  const out: { node: string; via?: Edge }[] = [];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const list = adj[top.node];
    if (list.length) {
      const e = list.pop()!;
      stack.push({ node: e.to, via: e });
    } else {
      out.push(stack.pop()!);
    }
  }
  out.reverse();
  const edgeOrder = out.slice(1).map((x) => x.via!);
  if (edgeOrder.length !== g.edges.length) {
    return { ok: false, reason: 'Graph is not connected: an Eulerian path cannot use every edge', edgeOrder, nodePath: out.map((x) => x.node) };
  }
  return { ok: true, edgeOrder, nodePath: out.map((x) => x.node), start, end };
}

/** Spell a string from a path of overlapping (k-1)-mers / k-mers. */
export function spellPath(nodes: string[]): string {
  if (!nodes.length) return '';
  return nodes[0] + nodes.slice(1).map((n) => n[n.length - 1]).join('');
}

/** (k,d)-mer composition: pairs of k-mers separated by a gap of d. */
export function pairedComposition(text: string, k: number, d: number): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i + 2 * k + d <= text.length; i++) out.push([text.substr(i, k), text.substr(i + k + d, k)]);
  return out;
}

/** Reconstruct from a path of read pairs (String Spelled by a Gapped Genome Path). */
export function spellGappedPath(pairs: [string, string][], k: number, d: number): string | null {
  const first = spellPath(pairs.map((p) => p[0]));
  const second = spellPath(pairs.map((p) => p[1]));
  for (let i = k + d; i < first.length; i++) if (first[i] !== second[i - k - d]) return null;
  return first + second.slice(second.length - k - d);
}
