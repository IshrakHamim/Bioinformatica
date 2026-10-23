// Core string algorithms from Bioinformatics Algorithms (Compeau & Pevzner), Ch. 1.

export const NUC = ['A', 'C', 'G', 'T'] as const;
const COMP: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C', N: 'N', U: 'A' };

export function cleanDna(s: string): string {
  return s.toUpperCase().replace(/[^ACGTN]/g, '');
}

export function reverseComplement(s: string): string {
  let out = '';
  for (let i = s.length - 1; i >= 0; i--) out += COMP[s[i]] ?? s[i];
  return out;
}

export function complement(s: string): string {
  return s.split('').map((c) => COMP[c] ?? c).join('');
}

export function patternCount(text: string, pattern: string): number {
  let count = 0;
  for (let i = 0; i + pattern.length <= text.length; i++) {
    if (text.substr(i, pattern.length) === pattern) count++;
  }
  return count;
}

export function patternPositions(text: string, pattern: string): number[] {
  const pos: number[] = [];
  for (let i = 0; i + pattern.length <= text.length; i++) {
    if (text.substr(i, pattern.length) === pattern) pos.push(i);
  }
  return pos;
}

/** Frequency table of all k-mers (O(|Text|) with a hash map). */
export function kmerCounts(text: string, k: number): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i + k <= text.length; i++) {
    const p = text.substr(i, k);
    m.set(p, (m.get(p) ?? 0) + 1);
  }
  return m;
}

export function frequentWords(text: string, k: number): { words: string[]; count: number } {
  const m = kmerCounts(text, k);
  let max = 0;
  m.forEach((v) => (max = Math.max(max, v)));
  const words = [...m.entries()].filter(([, v]) => v === max).map(([w]) => w).sort();
  return { words, count: max };
}

/** skew[i] = #G - #C in the first i nucleotides (skew[0] = 0). */
export function skewArray(genome: string): number[] {
  const s = [0];
  for (const c of genome) {
    const prev = s[s.length - 1];
    s.push(c === 'G' ? prev + 1 : c === 'C' ? prev - 1 : prev);
  }
  return s;
}

export function minimumSkew(genome: string): { positions: number[]; value: number } {
  const s = skewArray(genome);
  const value = Math.min(...s);
  return { positions: s.flatMap((v, i) => (v === value ? [i] : [])), value };
}

export function hamming(p: string, q: string): number {
  if (p.length !== q.length) throw new Error('Hamming distance needs equal-length strings');
  let d = 0;
  for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) d++;
  return d;
}

export function approximatePatternMatching(text: string, pattern: string, d: number): number[] {
  const out: number[] = [];
  for (let i = 0; i + pattern.length <= text.length; i++) {
    if (hamming(pattern, text.substr(i, pattern.length)) <= d) out.push(i);
  }
  return out;
}

export function approximatePatternCount(text: string, pattern: string, d: number): number {
  return approximatePatternMatching(text, pattern, d).length;
}

/** All strings within Hamming distance d of pattern (the d-neighborhood). */
export function neighbors(pattern: string, d: number): string[] {
  if (d === 0) return [pattern];
  if (pattern.length === 1) return [...NUC];
  const out = new Set<string>();
  const suffixNeighbors = neighbors(pattern.slice(1), d);
  for (const text of suffixNeighbors) {
    if (hamming(pattern.slice(1), text) < d) for (const x of NUC) out.add(x + text);
    else out.add(pattern[0] + text);
  }
  return [...out];
}

export function frequentWordsWithMismatches(
  text: string,
  k: number,
  d: number,
  withReverseComplement = false,
): { words: string[]; count: number } {
  const freq = new Map<string, number>();
  const bump = (kmer: string) => {
    for (const n of neighbors(kmer, d)) freq.set(n, (freq.get(n) ?? 0) + 1);
  };
  for (let i = 0; i + k <= text.length; i++) {
    const kmer = text.substr(i, k);
    bump(kmer);
    if (withReverseComplement) bump(reverseComplement(kmer));
  }
  let max = 0;
  freq.forEach((v) => (max = Math.max(max, v)));
  const words = [...freq.entries()].filter(([, v]) => v === max).map(([w]) => w).sort();
  return { words, count: max };
}

/** All distinct k-mers forming (L, t)-clumps in genome. */
export function findClumps(genome: string, k: number, L: number, t: number): string[] {
  const found = new Set<string>();
  for (let i = 0; i + L <= genome.length; i++) {
    const counts = kmerCounts(genome.substr(i, L), k);
    counts.forEach((v, w) => {
      if (v >= t) found.add(w);
    });
  }
  return [...found].sort();
}

/** k-mer composition, lexicographically sorted (with repeats). */
export function composition(text: string, k: number): string[] {
  const out: string[] = [];
  for (let i = 0; i + k <= text.length; i++) out.push(text.substr(i, k));
  return out.sort();
}

export const CODON_TABLE: Record<string, string> = (() => {
  const bases = 'UCAG';
  const aas = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
  const t: Record<string, string> = {};
  let n = 0;
  for (const a of bases) for (const b of bases) for (const c of bases) t[a + b + c] = aas[n++];
  return t;
})();

export const AA_NAMES: Record<string, string> = {
  A: 'Alanine', R: 'Arginine', N: 'Asparagine', D: 'Aspartate', C: 'Cysteine', E: 'Glutamate',
  Q: 'Glutamine', G: 'Glycine', H: 'Histidine', I: 'Isoleucine', L: 'Leucine', K: 'Lysine',
  M: 'Methionine', F: 'Phenylalanine', P: 'Proline', S: 'Serine', T: 'Threonine', W: 'Tryptophan',
  Y: 'Tyrosine', V: 'Valine', '*': 'Stop',
};

export function transcribe(dnaCodingStrand: string): string {
  return dnaCodingStrand.replace(/T/g, 'U');
}

export function translate(rna: string): string {
  let p = '';
  for (let i = 0; i + 3 <= rna.length; i += 3) p += CODON_TABLE[rna.substr(i, 3)] ?? '?';
  return p;
}

export function gcContent(s: string): number {
  if (!s.length) return 0;
  let gc = 0;
  for (const c of s) if (c === 'G' || c === 'C') gc++;
  return gc / s.length;
}

/** Phred quality: Q = -10 log10(p). */
export const phredToProb = (q: number) => Math.pow(10, -q / 10);
export const probToPhred = (p: number) => -10 * Math.log10(p);
export const phred33Char = (q: number) => String.fromCharCode(Math.round(q) + 33);
export const phred33ToQ = (c: string) => c.charCodeAt(0) - 33;
