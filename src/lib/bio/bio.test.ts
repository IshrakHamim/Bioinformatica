import { describe, expect, it } from 'vitest';
import * as S from './strings';
import * as M from './motifs';
import * as A from './assembly';
import * as RM from './matching';
import * as AL from './alignment';
import * as P from './phylo';
import * as H from './hmm';
import * as C from './cluster';
import * as N from './network';
import * as ML from './ml';
import { mulberry32 } from './rng';

describe('strings (Ch. 1)', () => {
  it('reverse complement and skew', () => {
    expect(S.reverseComplement('ATGATCAAG')).toBe('CTTGATCAT');
    // Quiz 1A Q3: skew of CATTCCGGA after 5 nucleotides
    expect(S.skewArray('CATTCCGGA')[5]).toBe(-2);
  });
  it('approximate counts from the slides', () => {
    expect(S.approximatePatternCount('AACAAGCTGATAAACATTTAAAGAG', 'AAAAA', 1)).toBe(4);
    expect(S.approximatePatternCount('AACAAGCTGATAAACATTTAAAGAG', 'AAAAA', 2)).toBe(11);
    expect(S.hamming('CGAAT', 'CGGAC')).toBe(2);
  });
  it('frequent 9-mers of Vibrio cholerae oriC', () => {
    const ori =
      'atcaatgatcaacgtaagcttctaagcatgatcaaggtgctcacacagtttatccacaacctgagtggatgacatcaagataggtcgttgtatctccttcctctcgtactctcatgaccacggaaagatgatcaagagaggatgatttcttggccatatcgcaatgaatacttgtgacttgtgcttccaattgacatcttcagcgccatattgcgctggccaaggtgacggagcgggattacgaaagcatgatcatggctgttgttctgtttatcttgttttgactgagacttgttaggatagacggtttttcatcactgactagccaaagccttactctgcctgacatcgaccgtaaattgataatgaatttacatgcttccgcgacgatttacctcttgatcatcgatccgattgaagatcttcaattgttaattctcttgcctcgactcatagccatgatgagctcttgatcatgtttccttaaccctctattttttacggaagaatgatcaagctgctgctcttgatcatcgtttc'.toUpperCase();
    const counts = S.kmerCounts(ori, 9);
    const three = [...counts.entries()].filter(([, v]) => v >= 3).map(([k]) => k).sort();
    expect(three).toEqual(['ATGATCAAG', 'CTCTTGATC', 'CTTGATCAT', 'TCTTGATCA']);
  });
  it('translation', () => {
    expect(S.translate('AUGGCCAUGGCGCCCAGAACUGAGAUCAAUAGUACCCGUAUUAACGGGUGA')).toBe('MAMAPRTEINSTRING*');
  });
});

describe('motifs (Ch. 2)', () => {
  const dna = ['ttACCTtaac', 'gATGTctgtc', 'acgGCGTtag', 'ccctaACGAg', 'cgtcagAGGT'].map((s) => s.toUpperCase());
  it('greedy with and without pseudocounts (slides example)', () => {
    const noPc = M.greedyMotifSearch(dna, 4, 0);
    const pc = M.greedyMotifSearch(dna, 4, 1);
    expect(pc.motifs).toEqual(['ACCT', 'ATGT', 'ACGG', 'ACGA', 'AGGT']);
    expect(M.consensus(pc.motifs)).toBe('ACGT');
    expect(noPc.score).toBeGreaterThanOrEqual(pc.score);
  });
  it('entropy examples from the slides', () => {
    expect(M.columnEntropy([0.2, 0.6, 0, 0.2])).toBeCloseTo(1.371, 3);
    expect(M.columnEntropy([0, 0.6, 0, 0.4])).toBeCloseTo(0.971, 3);
    expect(M.columnEntropy([0, 0, 0.9, 0.1])).toBeCloseTo(0.469, 3);
  });
  it('quiz profile probabilities', () => {
    // Quiz 1A Q12
    const prof: M.Profile = { A: [0.2, 0.3, 0.5], C: [0.3, 0.2, 0.1], G: [0.2, 0.3, 0.2], T: [0.3, 0.2, 0.2] };
    expect(M.kmerProbability('ATG', prof)).toBeCloseTo(0.2 * 0.2 * 0.2, 10);
    // pseudocount Laplace: A:2,C:1,G:1,T:0 -> A = 3/8
    expect((2 + 1) / (4 + 4)).toBeCloseTo(0.375);
  });
  it('MID 1(d): profile and profile-most-probable 5-mer', () => {
    const motifs = ['ATCGT', 'GTCCA', 'CTAGT', 'CTCCT', 'CTCTG'];
    const p = M.profileMatrix(motifs);
    const r = M.profileMostProbable('ACCTGTTTAT', 5, p);
    console.log('MID1d profile', JSON.stringify(p), 'best', r.best, r.all);
    const pp = M.profileMatrix(motifs, 1);
    console.log('MID1d with pseudocounts', M.profileMostProbable('ACCTGTTTAT', 5, pp).all);
  });
});

describe('assembly (Ch. 3)', () => {
  it('MID 2(a) de Bruijn + Euler path', () => {
    const g = A.deBruijnFromKmers(['AGC', 'ATG', 'CAG', 'CTG', 'GCA', 'GCT', 'TGA', 'TGC']);
    const e = A.eulerianPath(g);
    console.log('MID2a nodes', g.nodes, 'deg', A.degrees(g), 'path', e.nodePath, A.spellPath(e.nodePath), e.ok);
    expect(e.ok).toBe(true);
    const genome = A.spellPath(e.nodePath);
    expect(S.composition(genome, 3)).toEqual(['AGC', 'ATG', 'CAG', 'CTG', 'GCA', 'GCT', 'TGA', 'TGC']);
  });
  it('string reconstruction slide example', () => {
    const kmers = ['CTTA', 'ACCA', 'TACC', 'GGCT', 'GCTT', 'TTAC'];
    const e = A.eulerianPath(A.deBruijnFromKmers(kmers));
    expect(A.spellPath(e.nodePath)).toBe('GGCTTACCA');
  });
  it('paired reads', () => {
    const pairs = A.pairedComposition('TAATGCCATGGGATGTT', 3, 2);
    expect(A.spellGappedPath(pairs, 3, 2)).toBe('TAATGCCATGGGATGTT');
  });
});

describe('read mapping', () => {
  it('Boyer-Moore matches the slide example', () => {
    const r = RM.boyerMoore('GTAGCGGCG', 'GTTATAGCTGATCGCGGCGTAGCGGCGAA');
    expect(r.steps.map((s) => s.pos)).toEqual([0, 7, 10, 18]);
    expect(r.steps.slice(0, 3).map((s) => [s.bc, s.gs])).toEqual([[7, 0], [1, 3], [3, 8]].map(([b, g]) => [b, g]));
    expect(r.occurrences).toEqual([18]);
  });
  it('MID 3(a) Boyer-Moore vs naive', () => {
    const t = 'TACGACGTACGTAGACGTACG';
    const p = 'ACGTAC';
    const bm = RM.boyerMoore(p, t);
    const nv = RM.naiveMatch(p, t);
    console.log('MID3a BM', JSON.stringify(bm.steps), 'cmp', bm.comparisons, 'align', bm.alignments, 'occ', bm.occurrences);
    console.log('MID3a naive cmp', nv.comparisons, 'align', nv.alignments, 'occ', nv.occurrences);
    expect(bm.occurrences).toEqual(nv.occurrences);
  });
  it('k-mer index variants agree with naive', () => {
    const t = 'CGTGCGTGCTTCGTGCGTGCTTAAGCGTGCT';
    const p = 'GCGTGCTT';
    const truth = RM.naiveMatch(p, t).occurrences;
    for (const every of [1, 2, 3]) {
      const idx = RM.kmerIndex(t, 5, every);
      expect(RM.queryIndex(p, t, 5, idx, every).occurrences).toEqual(truth);
    }
    expect(RM.pigeonholeHamming('GCGTACTT', t, 1).occurrences.length).toBeGreaterThan(0);
  });
});

describe('alignment', () => {
  it('slide example AAG vs AGC with matrix and d=-5', () => {
    const tbl: Record<string, Record<string, number>> = {
      A: { A: 2, C: -7, G: -5, T: -7 }, C: { A: -7, C: 2, G: -7, T: -5 }, G: { A: -5, C: -7, G: 2, T: -7 }, T: { A: -7, C: -5, G: -7, T: 2 },
    };
    const sc = { match: 0, mismatch: 0, gap: -5, sub: (a: string, b: string) => tbl[a][b] };
    const loc = AL.align('AGC', 'AAG', sc, 'local');
    expect(loc.score).toBe(4);
  });
  it('FINAL Q1 global and local', () => {
    const sc = { match: 2, mismatch: -1, gap: -2 };
    const g = AL.align('ACCGTGC', 'ACGTC', sc, 'global');
    const l = AL.align('ACCGTGC', 'ACGTC', sc, 'local');
    console.log('FINAL1 global', g.score, AL.allOptimalAlignments(g, 'ACCGTGC', 'ACGTC'));
    console.log('FINAL1 global F', JSON.stringify(g.F));
    console.log('FINAL1 local', l.score, l.end, AL.allOptimalAlignments(l, 'ACCGTGC', 'ACGTC'));
    console.log('FINAL1 local F', JSON.stringify(l.F));
    for (const [x, y] of AL.allOptimalAlignments(g, 'ACCGTGC', 'ACGTC')) expect(AL.scoreAlignment(x, y, sc)).toBe(g.score);
  });
  it('quiz 3 values', () => {
    expect(AL.align('ACG', 'AG', { match: 1, mismatch: -1, gap: -2 }, 'global').score).toBe(0);
    expect(AL.align('A', 'C', { match: 1, mismatch: -1, gap: -2 }, 'global').score).toBe(-1);
    expect(AL.affineGapCost(4, -5, -1)).toBe(-8);
    expect(AL.editDistance('TGGCCGCGCAAAAACAGC', 'TGACCGCGCAAAACAGC').distance).toBe(2);
  });
});

describe('phylogeny', () => {
  it('FINAL Q2 UPGMA', () => {
    const D = [
      [0, 4, 6, 6],
      [4, 0, 6, 6],
      [6, 6, 0, 4],
      [6, 6, 4, 0],
    ];
    const r = P.upgma(['A', 'B', 'C', 'D'], D);
    console.log('FINAL2 UPGMA', JSON.stringify(r.steps), P.toNewick(r.root));
    expect(r.steps.map((s) => s.height)).toEqual([2, 2, 3]);
  });
  it('limb length slide example and NJ', () => {
    const D = [
      [0, 13, 21, 22],
      [13, 0, 12, 13],
      [21, 12, 0, 13],
      [22, 13, 13, 0],
    ];
    expect(P.limbLength(D, 0).length).toBe(11);
    expect(P.limbLength(D, 1).length).toBe(2);
    expect(P.isAdditive(D)).toBe(true);
    const nj = P.neighborJoining(['i', 'j', 'k', 'l'], D);
    const total = nj.edges.reduce((s, e) => s + e.length, 0);
    expect(total).toBeCloseTo(11 + 2 + 6 + 7 + 4, 6);
  });
});

describe('HMM handout', () => {
  it('Viterbi on GGCACTGAA gives HHHLLLLLL with log2 prob -24.49', () => {
    const v = H.viterbi(H.GC_HMM, 'GGCACTGAA');
    expect(v.path).toBe('HHHLLLLLL');
    expect(v.best).toBeCloseTo(-24.49, 2);
    expect(v.V[0][0]).toBeCloseTo(-2.737, 3);
    expect(v.V[1][1]).toBeCloseTo(-6.059, 3);
  });
  it('Forward on GGCA = 0.0038432', () => {
    expect(H.forward(H.GC_HMM, 'GGCA').total).toBeCloseTo(0.0038432, 7);
  });
  it('casino log odds', () => {
    const pf = Math.pow(0.5, 7);
    const pb = 0.75 ** 3 * 0.25 ** 4;
    expect(Math.log2(pf / pb)).toBeCloseTo(2.245, 3);
  });
  it('posterior sums to 1', () => {
    const post = H.posterior(H.CASINO_HMM, 'HHTHHHHHTH');
    post[0].forEach((_, t) => expect(post[0][t] + post[1][t]).toBeCloseTo(1, 9));
  });
});

describe('clustering', () => {
  it('MID 4(a) soft k-means', () => {
    const data = [
      [10, 8, 10],
      [10, 0, 9],
      [4, 8, 3],
      [7, 8, 3],
      [10, 2, 3],
    ];
    const w = C.softAssign(data, [[10, 8, 10], [4, 8, 3]], 0.5, true);
    console.log('MID4a resp', JSON.stringify(w), 'centers', JSON.stringify(C.softCenters(data, w)));
  });
  it('Quiz 2B soft k-means', () => {
    const data = [[4, 5], [2, 3]];
    const w = C.softAssign(data, [[2, 3], [6, 7]], 0.5, true);
    console.log('Q2B resp', JSON.stringify(w), 'centers', JSON.stringify(C.softCenters(data, w)));
  });
  it('Quiz 2C k-means++ probabilities', () => {
    const pr = C.kmeansPPProbabilities([[2], [4], [10], [12], [20]], [[2]]);
    expect(pr.map((x) => +x.toFixed(4))).toEqual([0, 0.0081, 0.1301, 0.2033, 0.6585]);
  });
  it('Pevzner figure 8.21 soft centers', () => {
    const data = [[-3], [-2], [0], [2], [3]];
    const w = C.softAssign(data, [[-2.5], [2.5]], 1, false);
    expect(C.softCenters(data, w)[0][0]).toBeCloseTo(-1.955, 2);
  });
  it('hierarchical (Pevzner g1..g10) first merge g3,g5 at 0.7', () => {
    const D = [
      [0, 8.1, 9.2, 7.7, 9.3, 2.3, 5.1, 10.2, 6.1, 7.0],
      [8.1, 0, 12.0, 0.9, 12.0, 9.5, 10.1, 12.8, 2.0, 1.0],
      [9.2, 12.0, 0, 11.2, 0.7, 11.1, 8.1, 1.1, 10.5, 11.5],
      [7.7, 0.9, 11.2, 0, 11.2, 9.2, 9.5, 12.0, 1.6, 1.1],
      [9.3, 12.0, 0.7, 11.2, 0, 11.2, 8.5, 1.0, 10.6, 11.6],
      [2.3, 9.5, 11.1, 9.2, 11.2, 0, 5.6, 12.1, 7.7, 8.5],
      [5.1, 10.1, 8.1, 9.5, 8.5, 5.6, 0, 9.1, 8.3, 9.3],
      [10.2, 12.8, 1.1, 12.0, 1.0, 12.1, 9.1, 0, 11.4, 12.4],
      [6.1, 2.0, 10.5, 1.6, 10.6, 7.7, 8.3, 11.4, 0, 1.1],
      [7.0, 1.0, 11.5, 1.1, 11.6, 8.5, 9.3, 12.4, 1.1, 0],
    ];
    const m = C.hierarchical(D, 'single');
    expect([m[0].a, m[0].b].sort()).toEqual([2, 4]);
    expect(m[0].height).toBe(0.7);
    expect([m[1].a, m[1].b].sort()).toEqual([1, 3]);
  });
});

describe('networks (Quiz 5)', () => {
  const G = N.fromEdges([['A', 'B'], ['A', 'C'], ['B', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']]);
  const J = N.fromEdges([['P', 'Q'], ['Q', 'R'], ['R', 'S'], ['R', 'U'], ['S', 'T']]);
  const K = N.fromEdges([['V', 'W'], ['W', 'X'], ['W', 'Y'], ['X', 'Z']]);
  it('graph G', () => {
    expect(G.B.length).toBe(3);
    expect(N.diameter(G)).toBe(3);
    expect(N.closeness(G).B).toBeCloseTo(0.8);
    const b = N.betweenness(G);
    console.log('Q5 G betweenness', b, N.closeness(G));
    expect(Object.entries(b).sort((x, y) => y[1] - x[1])[0][0]).toBe('D');
  });
  it('graph J', () => {
    expect(J.R.length).toBe(3);
    expect(N.diameter(J)).toBe(4);
    console.log('Q5 J closeness', N.closeness(J), 'betw', N.betweenness(J));
    expect(Object.entries(N.betweenness(J)).sort((x, y) => y[1] - x[1])[0][0]).toBe('R');
  });
  it('graph K', () => {
    expect(K.W.length).toBe(3);
    expect(N.diameter(K)).toBe(3);
    console.log('Q5 K closeness', N.closeness(K), 'betw', N.betweenness(K));
  });
});

describe('ml', () => {
  it('metrics', () => {
    const m = ML.metrics({ tp: 90, fp: 10, tn: 80, fn: 20 });
    expect(m.accuracy).toBeCloseTo(0.85);
    expect(m.f1).toBeCloseTo(2 * 0.9 * (90 / 110) / (0.9 + 90 / 110));
  });
  it('rng reproducible', () => {
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });
});
