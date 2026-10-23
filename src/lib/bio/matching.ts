// Exact and approximate matching for read mapping (Gusfield Ch. 2; Langmead ADS1 notes).

export function naiveMatch(p: string, t: string) {
  const occurrences: number[] = [];
  let comparisons = 0;
  let alignments = 0;
  for (let i = 0; i + p.length <= t.length; i++) {
    alignments++;
    let match = true;
    for (let j = 0; j < p.length; j++) {
      comparisons++;
      if (t[i + j] !== p[j]) {
        match = false;
        break;
      }
    }
    if (match) occurrences.push(i);
  }
  return { occurrences, comparisons, alignments };
}

/** Z-array (naive O(n^2); patterns here are short). */
export function zArray(s: string): number[] {
  const z = new Array(s.length).fill(0);
  if (s.length) z[0] = s.length;
  for (let i = 1; i < s.length; i++) {
    let n = 0;
    while (i + n < s.length && s[n] === s[i + n]) n++;
    z[i] = n;
  }
  return z;
}

export class BoyerMoorePreprocessing {
  p: string;
  alphabet: string[];
  badChar: Record<string, number>[]; // badChar[i][c] = 1 + rightmost j < i with p[j] == c (0 if none)
  bigLPrime: number[];
  smallLPrime: number[];

  constructor(p: string, alphabet = 'ACGT') {
    this.p = p;
    this.alphabet = [...new Set((alphabet + p).split(''))];
    this.badChar = [];
    const next: Record<string, number> = {};
    for (const c of this.alphabet) next[c] = 0;
    for (let i = 0; i < p.length; i++) {
      this.badChar.push({ ...next });
      next[p[i]] = i + 1;
    }
    const n = zArray(p.split('').reverse().join('')).reverse(); // N array
    this.bigLPrime = new Array(p.length).fill(0);
    for (let j = 0; j < p.length - 1; j++) {
      const i = p.length - n[j];
      if (i < p.length) this.bigLPrime[i] = j + 1;
    }
    this.smallLPrime = new Array(p.length).fill(0);
    for (let i = 0; i < p.length; i++) if (n[i] === i + 1) this.smallLPrime[p.length - i - 1] = i + 1;
    for (let i = p.length - 2; i >= 0; i--) if (this.smallLPrime[i] === 0) this.smallLPrime[i] = this.smallLPrime[i + 1];
  }

  /** Shift given a mismatch at pattern offset i against text character c. */
  badCharacterShift(i: number, c: string): number {
    const occ = this.badChar[i][c] ?? 0;
    return i - (occ - 1);
  }

  /** Shift given a mismatch at offset i (the suffix p[i+1:] matched). */
  goodSuffixShift(i: number): number {
    const m = this.p.length;
    if (i === m - 1) return 0;
    const j = i + 1;
    if (this.bigLPrime[j] > 0) return m - this.bigLPrime[j];
    return m - this.smallLPrime[j];
  }

  /** Shift after a full match. */
  matchShift(): number {
    return this.p.length - (this.smallLPrime[1] ?? 0);
  }
}

export interface BMStep {
  pos: number; // alignment offset in T
  compared: number[]; // pattern offsets compared, right to left
  mismatchAt: number | null; // pattern offset of mismatch (null = full match)
  bc: number; // bad-character shift (0 if not applicable)
  gs: number; // good-suffix shift
  shift: number;
}

export function boyerMoore(p: string, t: string, useBadChar = true, useGoodSuffix = true) {
  const bm = new BoyerMoorePreprocessing(p, [...new Set(t.split(''))].join(''));
  const occurrences: number[] = [];
  const steps: BMStep[] = [];
  let comparisons = 0;
  let i = 0;
  while (i + p.length <= t.length) {
    let shift = 1;
    let mismatchAt: number | null = null;
    const compared: number[] = [];
    let bc = 0;
    let gs = 0;
    for (let j = p.length - 1; j >= 0; j--) {
      comparisons++;
      compared.push(j);
      if (p[j] !== t[i + j]) {
        mismatchAt = j;
        bc = useBadChar ? bm.badCharacterShift(j, t[i + j]) : 0;
        gs = useGoodSuffix ? bm.goodSuffixShift(j) : 0;
        shift = Math.max(shift, bc, gs);
        break;
      }
    }
    if (mismatchAt === null) {
      occurrences.push(i);
      gs = useGoodSuffix ? bm.matchShift() : 0;
      shift = Math.max(shift, gs);
    }
    steps.push({ pos: i, compared, mismatchAt, bc, gs, shift });
    i += shift;
  }
  return { occurrences, steps, comparisons, alignments: steps.length };
}

/** k-mer index: k-mer -> sorted offsets. `every` = 1 indexes all offsets; 2 = even only, etc. */
export function kmerIndex(t: string, k: number, every = 1): Map<string, number[]> {
  const idx = new Map<string, number[]>();
  for (let i = 0; i + k <= t.length; i += every) {
    const km = t.substr(i, k);
    if (!idx.has(km)) idx.set(km, []);
    idx.get(km)!.push(i);
  }
  return idx;
}

/** Query an index built with step `every`: try every phase of the pattern and verify hits. */
export function queryIndex(p: string, t: string, k: number, idx: Map<string, number[]>, every = 1) {
  const hits = new Set<number>();
  let indexHits = 0;
  let verifications = 0;
  for (let phase = 0; phase < Math.min(every, p.length - k + 1); phase++) {
    const offs = idx.get(p.substr(phase, k)) ?? [];
    for (const o of offs) {
      indexHits++;
      const start = o - phase;
      if (start < 0 || start + p.length > t.length) continue;
      verifications++;
      if (t.substr(start, p.length) === p) hits.add(start);
    }
  }
  return { occurrences: [...hits].sort((a, b) => a - b), indexHits, verifications };
}

/** Approximate matching (Hamming <= n) using the pigeonhole principle + exact search. */
export function pigeonholeHamming(p: string, t: string, n: number) {
  const segLen = Math.floor(p.length / (n + 1));
  const all = new Set<number>();
  const partitions: { start: number; end: number; hits: number[] }[] = [];
  for (let i = 0; i <= n; i++) {
    const start = i * segLen;
    const end = Math.min((i + 1) * segLen, p.length);
    const seg = p.slice(start, i === n ? p.length : end);
    const realEnd = start + seg.length;
    const hits = naiveMatch(seg, t).occurrences;
    partitions.push({ start, end: realEnd, hits });
    for (const h of hits) {
      const s = h - start;
      if (s < 0 || s + p.length > t.length) continue;
      let mm = 0;
      for (let j = 0; j < p.length && mm <= n; j++) if (p[j] !== t[s + j]) mm++;
      if (mm <= n) all.add(s);
    }
  }
  return { occurrences: [...all].sort((a, b) => a - b), partitions };
}
