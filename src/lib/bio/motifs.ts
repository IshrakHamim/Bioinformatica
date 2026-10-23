// Regulatory motif finding (Compeau & Pevzner, Ch. 2).
import { NUC, hamming } from './strings';
import { randInt, weightedIndex } from './rng';

export type Profile = Record<'A' | 'C' | 'G' | 'T', number[]>;

export function countMatrix(motifs: string[], pseudocount = 0): Profile {
  const k = motifs[0]?.length ?? 0;
  const m = { A: [], C: [], G: [], T: [] } as Profile;
  for (const n of NUC) m[n] = new Array(k).fill(pseudocount);
  for (const s of motifs) for (let j = 0; j < k; j++) m[s[j] as keyof Profile][j]++;
  return m;
}

export function profileMatrix(motifs: string[], pseudocount = 0): Profile {
  const c = countMatrix(motifs, pseudocount);
  const k = motifs[0]?.length ?? 0;
  const p = { A: [], C: [], G: [], T: [] } as Profile;
  for (let j = 0; j < k; j++) {
    const col = NUC.reduce((s, n) => s + c[n][j], 0);
    for (const n of NUC) p[n][j] = c[n][j] / col;
  }
  return p;
}

/** Most frequent nucleotide per column; ties broken in A,C,G,T order. */
export function consensus(motifs: string[]): string {
  const c = countMatrix(motifs);
  const k = motifs[0]?.length ?? 0;
  let s = '';
  for (let j = 0; j < k; j++) {
    let best: (typeof NUC)[number] = 'A';
    for (const n of NUC) if (c[n][j] > c[best][j]) best = n;
    s += best;
  }
  return s;
}

/** Score(Motifs) = number of unpopular letters = sum of Hamming distances to the consensus. */
export function motifScore(motifs: string[]): number {
  const cons = consensus(motifs);
  return motifs.reduce((s, m) => s + hamming(m, cons), 0);
}

export function columnEntropy(probs: number[]): number {
  return -probs.reduce((s, p) => (p > 0 ? s + p * Math.log2(p) : s), 0);
}

export function profileEntropy(p: Profile): number[] {
  const k = p.A.length;
  return Array.from({ length: k }, (_, j) => columnEntropy(NUC.map((n) => p[n][j])));
}

export function kmerProbability(kmer: string, p: Profile): number {
  let pr = 1;
  for (let j = 0; j < kmer.length; j++) pr *= p[kmer[j] as keyof Profile][j];
  return pr;
}

/** All k-mer probabilities in text; the first maximum wins ties (as in the textbook). */
export function profileMostProbable(text: string, k: number, p: Profile) {
  const all: { kmer: string; pos: number; prob: number }[] = [];
  let best = { kmer: text.substr(0, k), pos: 0, prob: -1 };
  for (let i = 0; i + k <= text.length; i++) {
    const kmer = text.substr(i, k);
    const prob = kmerProbability(kmer, p);
    all.push({ kmer, pos: i, prob });
    if (prob > best.prob) best = { kmer, pos: i, prob };
  }
  return { best, all };
}

export function dSeq(pattern: string, text: string): number {
  let best = Infinity;
  for (let i = 0; i + pattern.length <= text.length; i++) {
    best = Math.min(best, hamming(pattern, text.substr(i, pattern.length)));
  }
  return best;
}

export function dDna(pattern: string, dna: string[]): number {
  return dna.reduce((s, t) => s + dSeq(pattern, t), 0);
}

export function allKmers(k: number): string[] {
  let out = [''];
  for (let i = 0; i < k; i++) out = out.flatMap((s) => NUC.map((n) => s + n));
  return out;
}

export function medianString(dna: string[], k: number): { median: string; distance: number } {
  let best = { median: '', distance: Infinity };
  for (const p of allKmers(k)) {
    const d = dDna(p, dna);
    if (d < best.distance) best = { median: p, distance: d };
  }
  return best;
}

export interface GreedyStep {
  first: string;
  motifs: string[];
  score: number;
}

export function greedyMotifSearch(dna: string[], k: number, pseudocount = 0) {
  let bestMotifs = dna.map((s) => s.substr(0, k));
  let bestScore = motifScore(bestMotifs);
  const trace: GreedyStep[] = [];
  for (let i = 0; i + k <= dna[0].length; i++) {
    const motifs = [dna[0].substr(i, k)];
    for (let j = 1; j < dna.length; j++) {
      const p = profileMatrix(motifs, pseudocount);
      motifs.push(profileMostProbable(dna[j], k, p).best.kmer);
    }
    const sc = motifScore(motifs);
    trace.push({ first: motifs[0], motifs: [...motifs], score: sc });
    if (sc < bestScore) {
      bestScore = sc;
      bestMotifs = motifs;
    }
  }
  return { motifs: bestMotifs, score: bestScore, trace };
}

export function motifsFromProfile(p: Profile, dna: string[], k: number): string[] {
  return dna.map((s) => profileMostProbable(s, k, p).best.kmer);
}

/** One run of RandomizedMotifSearch, returning every iteration. */
export function randomizedMotifSearch(dna: string[], k: number, rng: () => number) {
  let motifs = dna.map((s) => {
    const i = randInt(rng, s.length - k + 1);
    return s.substr(i, k);
  });
  let best = motifs;
  const history: { motifs: string[]; score: number }[] = [{ motifs, score: motifScore(motifs) }];
  for (;;) {
    const p = profileMatrix(motifs, 1);
    motifs = motifsFromProfile(p, dna, k);
    history.push({ motifs, score: motifScore(motifs) });
    if (motifScore(motifs) < motifScore(best)) best = motifs;
    else return { motifs: best, score: motifScore(best), history };
  }
}

export interface GibbsStep {
  removed: number;
  probs: { kmer: string; prob: number }[];
  chosen: string;
  motifs: string[];
  score: number;
}

/** GibbsSampler with Laplace pseudocounts; returns best motifs and a step trace. */
export function gibbsSampler(dna: string[], k: number, N: number, rng: () => number, init?: string[]) {
  let motifs =
    init ??
    dna.map((s) => {
      const i = randInt(rng, s.length - k + 1);
      return s.substr(i, k);
    });
  let best = [...motifs];
  const steps: GibbsStep[] = [];
  for (let n = 0; n < N; n++) {
    const i = randInt(rng, dna.length);
    const others = motifs.filter((_, idx) => idx !== i);
    const p = profileMatrix(others, 1);
    const { all } = profileMostProbable(dna[i], k, p);
    const pick = weightedIndex(rng, all.map((a) => a.prob));
    motifs = motifs.map((m, idx) => (idx === i ? all[pick].kmer : m));
    const sc = motifScore(motifs);
    steps.push({ removed: i, probs: all.map(({ kmer, prob }) => ({ kmer, prob })), chosen: all[pick].kmer, motifs: [...motifs], score: sc });
    if (sc < motifScore(best)) best = [...motifs];
  }
  return { motifs: best, score: motifScore(best), steps };
}
