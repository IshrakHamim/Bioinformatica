// Pairwise alignment by dynamic programming (Needleman-Wunsch, Smith-Waterman, Gotoh).

export interface Scoring {
  match: number;
  mismatch: number;
  gap: number; // linear gap penalty per position (negative)
  sub?: (a: string, b: string) => number; // optional substitution matrix
}

export type Dir = 'diag' | 'up' | 'left';

export interface DPResult {
  F: number[][];
  ptr: Dir[][][]; // all optimal predecessors per cell
  score: number;
  end: [number, number];
  path: [number, number][]; // cells from start to end
  alignedX: string;
  alignedY: string;
  mode: 'global' | 'local';
}

function s(sc: Scoring, a: string, b: string) {
  return sc.sub ? sc.sub(a, b) : a === b ? sc.match : sc.mismatch;
}

/** x labels rows (i), y labels columns (j). */
export function align(x: string, y: string, sc: Scoring, mode: 'global' | 'local'): DPResult {
  const n = x.length;
  const m = y.length;
  const F: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const ptr: Dir[][][] = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => [] as Dir[]));
  for (let i = 1; i <= n; i++) {
    F[i][0] = mode === 'global' ? i * sc.gap : 0;
    if (mode === 'global') ptr[i][0] = ['up'];
  }
  for (let j = 1; j <= m; j++) {
    F[0][j] = mode === 'global' ? j * sc.gap : 0;
    if (mode === 'global') ptr[0][j] = ['left'];
  }
  let best = 0;
  let end: [number, number] = [n, m];
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const d = F[i - 1][j - 1] + s(sc, x[i - 1], y[j - 1]);
      const u = F[i - 1][j] + sc.gap;
      const l = F[i][j - 1] + sc.gap;
      let v = Math.max(d, u, l);
      if (mode === 'local') v = Math.max(v, 0);
      F[i][j] = v;
      if (!(mode === 'local' && v === 0)) {
        if (d === v) ptr[i][j].push('diag');
        if (u === v) ptr[i][j].push('up');
        if (l === v) ptr[i][j].push('left');
      }
      if (mode === 'local' && v > best) {
        best = v;
        end = [i, j];
      }
    }
  }
  const score = mode === 'global' ? F[n][m] : best;
  // traceback preferring diag > up > left
  let [i, j] = end;
  const path: [number, number][] = [[i, j]];
  let ax = '';
  let ay = '';
  while (mode === 'global' ? i > 0 || j > 0 : F[i][j] > 0) {
    const p = ptr[i][j];
    if (p.includes('diag')) {
      ax = x[i - 1] + ax;
      ay = y[j - 1] + ay;
      i--;
      j--;
    } else if (p.includes('up')) {
      ax = x[i - 1] + ax;
      ay = '-' + ay;
      i--;
    } else if (p.includes('left')) {
      ax = '-' + ax;
      ay = y[j - 1] + ay;
      j--;
    } else break;
    path.unshift([i, j]);
  }
  return { F, ptr, score, end, path, alignedX: ax, alignedY: ay, mode };
}

/** Enumerate all co-optimal global/local alignments (capped). */
export function allOptimalAlignments(r: DPResult, x: string, y: string, cap = 20): [string, string][] {
  const out: [string, string][] = [];
  const rec = (i: number, j: number, ax: string, ay: string) => {
    if (out.length >= cap) return;
    const done = r.mode === 'global' ? i === 0 && j === 0 : r.F[i][j] === 0;
    if (done) {
      out.push([ax, ay]);
      return;
    }
    for (const d of r.ptr[i][j]) {
      if (d === 'diag') rec(i - 1, j - 1, x[i - 1] + ax, y[j - 1] + ay);
      if (d === 'up') rec(i - 1, j, x[i - 1] + ax, '-' + ay);
      if (d === 'left') rec(i, j - 1, '-' + ax, y[j - 1] + ay);
    }
  };
  rec(r.end[0], r.end[1], '', '');
  return out;
}

export function scoreAlignment(ax: string, ay: string, sc: Scoring): number {
  let t = 0;
  for (let i = 0; i < ax.length; i++) {
    if (ax[i] === '-' || ay[i] === '-') t += sc.gap;
    else t += s(sc, ax[i], ay[i]);
  }
  return t;
}

export function editDistance(a: string, b: string) {
  const D = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return { distance: D[a.length][b.length], D };
}

/** Affine gap cost of a single gap of length L: open + (L-1)*extend (both negative). */
export function affineGapCost(L: number, open: number, extend: number): number {
  return L <= 0 ? 0 : open + (L - 1) * extend;
}

/** Global alignment score with affine gaps (Gotoh's three-matrix recurrence). */
export function gotohScore(x: string, y: string, match: number, mismatch: number, open: number, extend: number): number {
  const n = x.length;
  const m = y.length;
  const NEG = -1e9;
  const M = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(NEG));
  const X = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(NEG)); // gap in y (consume x)
  const Y = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(NEG)); // gap in x (consume y)
  M[0][0] = 0;
  for (let i = 1; i <= n; i++) X[i][0] = open + (i - 1) * extend;
  for (let j = 1; j <= m; j++) Y[0][j] = open + (j - 1) * extend;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const sub = x[i - 1] === y[j - 1] ? match : mismatch;
      M[i][j] = sub + Math.max(M[i - 1][j - 1], X[i - 1][j - 1], Y[i - 1][j - 1]);
      X[i][j] = Math.max(M[i - 1][j] + open, X[i - 1][j] + extend, Y[i - 1][j] + open);
      Y[i][j] = Math.max(M[i][j - 1] + open, Y[i][j - 1] + extend, X[i][j - 1] + open);
    }
  return Math.max(M[n][m], X[n][m], Y[n][m]);
}

const B62_ORDER = 'ARNDCQEGHILKMFPSTWYV';
const B62_ROWS = [
  '4 -1 -2 -2 0 -1 -1 0 -2 -1 -1 -1 -1 -2 -1 1 0 -3 -2 0',
  '-1 5 0 -2 -3 1 0 -2 0 -3 -2 2 -1 -3 -2 -1 -1 -3 -2 -3',
  '-2 0 6 1 -3 0 0 0 1 -3 -3 0 -2 -3 -2 1 0 -4 -2 -3',
  '-2 -2 1 6 -3 0 2 -1 -1 -3 -4 -1 -3 -3 -1 0 -1 -4 -3 -3',
  '0 -3 -3 -3 9 -3 -4 -3 -3 -1 -1 -3 -1 -2 -3 -1 -1 -2 -2 -1',
  '-1 1 0 0 -3 5 2 -2 0 -3 -2 1 0 -3 -1 0 -1 -2 -1 -2',
  '-1 0 0 2 -4 2 5 -2 0 -3 -3 1 -2 -3 -1 0 -1 -3 -2 -2',
  '0 -2 0 -1 -3 -2 -2 6 -2 -4 -4 -2 -3 -3 -2 0 -2 -2 -3 -3',
  '-2 0 1 -1 -3 0 0 -2 8 -3 -3 -1 -2 -1 -2 -1 -2 -2 2 -3',
  '-1 -3 -3 -3 -1 -3 -3 -4 -3 4 2 -3 1 0 -3 -2 -1 -3 -1 3',
  '-1 -2 -3 -4 -1 -2 -3 -4 -3 2 4 -2 2 0 -3 -2 -1 -2 -1 1',
  '-1 2 0 -1 -3 1 1 -2 -1 -3 -2 5 -1 -3 -1 0 -1 -3 -2 -2',
  '-1 -1 -2 -3 -1 0 -2 -3 -2 1 2 -1 5 0 -2 -1 -1 -1 -1 1',
  '-2 -3 -3 -3 -2 -3 -3 -3 -1 0 0 -3 0 6 -4 -2 -2 1 3 -1',
  '-1 -2 -2 -1 -3 -1 -1 -2 -2 -3 -3 -1 -2 -4 7 -1 -1 -4 -3 -2',
  '1 -1 1 0 -1 0 0 0 -1 -2 -2 0 -1 -2 -1 4 1 -3 -2 -2',
  '0 -1 0 -1 -1 -1 -1 -2 -2 -1 -1 -1 -1 -2 -1 1 5 -2 -2 0',
  '-3 -3 -4 -4 -2 -2 -3 -2 -2 -3 -2 -3 -1 1 -4 -3 -2 11 2 -3',
  '-2 -2 -2 -3 -2 -1 -2 -3 2 -1 -1 -2 -1 3 -3 -2 -2 2 7 -1',
  '0 -3 -3 -3 -1 -2 -2 -3 -3 3 1 -2 1 -1 -2 -2 0 -3 -1 4',
];
export const BLOSUM62: Record<string, Record<string, number>> = (() => {
  const t: Record<string, Record<string, number>> = {};
  B62_ROWS.forEach((row, i) => {
    t[B62_ORDER[i]] = {};
    row.split(' ').forEach((v, j) => (t[B62_ORDER[i]][B62_ORDER[j]] = Number(v)));
  });
  return t;
})();
