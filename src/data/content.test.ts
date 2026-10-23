import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as S from '../lib/bio/strings';
import * as AL from '../lib/bio/alignment';
import * as H from '../lib/bio/hmm';
import * as M from '../lib/bio/motifs';
import { CONCEPTS, CONCEPT_BY_ID } from './concepts';
import { MODULES, MODULE_BY_ID, TRACKS, sectionsOf } from './index';

// Vite's ?raw imports are resolved by the vite plugin pipeline vitest uses, so MODULES load normally.

describe('content integrity', () => {
  it('module ids, prereqs and tracks are consistent', () => {
    const ids = MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MODULES) for (const p of m.prereqs) expect(MODULE_BY_ID[p], `${m.id} prereq ${p}`).toBeDefined();
    for (const t of TRACKS) for (const id of t.modules) expect(MODULE_BY_ID[id]).toBeDefined();
  });
  it('questions, cards and practice are well-formed', () => {
    for (const m of MODULES) {
      const qids = m.quiz.map((q) => q.id);
      expect(new Set(qids).size, m.id).toBe(qids.length);
      for (const q of m.quiz) if (q.type === 'mcq') expect(q.answer, `${m.id}/${q.id}`).toBeLessThan(q.options.length);
      const cids = m.flashcards.map((c) => c.id);
      expect(new Set(cids).size, m.id).toBe(cids.length);
      for (const v of m.videos) expect(v.id, `${m.id} video`).toMatch(/^[\w-]{11}$/);
    }
  });
  it('every widget referenced in content exists', async () => {
    const { WIDGETS } = await import('../widgets/registry');
    const texts = MODULES.flatMap((m) => [m.content, ...m.practice.map((p) => p.solution)]);
    for (const t of texts) for (const w of t.matchAll(/\{\{widget:([\w-]+)/g)) expect(WIDGETS[w[1]], w[1]).toBeDefined();
  });
  it('every game embedded in content exists and belongs to a real module', async () => {
    const { GAMES, GAME_BY_ID } = await import('../games/registry');
    for (const g of GAMES) expect(MODULE_BY_ID[g.module], g.id).toBeDefined();
    for (const m of MODULES) for (const e of m.content.matchAll(/\{\{game:([\w-]+)\}\}/g)) expect(GAME_BY_ID[e[1]]?.module, `${m.id} embeds ${e[1]}`).toBe(m.id);
  });
  it('concept graph references are valid and acyclic', () => {
    for (const c of CONCEPTS) {
      expect(MODULE_BY_ID[c.module], c.id).toBeDefined();
      for (const r of c.requires) expect(CONCEPT_BY_ID[r], `${c.id} requires ${r}`).toBeDefined();
    }
    const state: Record<string, number> = {};
    const visit = (id: string) => {
      if (state[id] === 2) return;
      expect(state[id], `cycle at ${id}`).not.toBe(1);
      state[id] = 1;
      CONCEPT_BY_ID[id].requires.forEach(visit);
      state[id] = 2;
    };
    CONCEPTS.forEach((c) => visit(c.id));
    // every concept id used by a module is defined
    for (const m of MODULES) for (const c of m.concepts) expect(CONCEPT_BY_ID[c], `${m.id} concept ${c}`).toBeDefined();
  });
  it('every module video is placed exactly once in its lesson, and only listed videos are embedded', () => {
    for (const m of MODULES) {
      const placed = [...m.content.matchAll(/^\{\{video:([\w-]{11})\}\}\s*$/gm)].map((x) => x[1]);
      for (const v of m.videos) expect(placed.filter((id) => id === v.id).length, `${m.id} places ${v.id}`).toBe(1);
      for (const id of placed) expect(m.videos.some((v) => v.id === id), `${m.id} embeds unlisted ${id}`).toBe(true);
      expect(m.content, `${m.id} uses the old {{yt:}} form`).not.toMatch(/\{\{yt:/);
    }
  });
  it('every refresher link points to an existing section of another module', () => {
    const ids = new Set(MODULES.flatMap((m) => sectionsOf(m).map((s) => `${m.id}#${s.id}`)));
    for (const m of MODULES)
      for (const r of m.content.matchAll(/^\{\{ref:(.+)\}\}\s*$/gm))
        for (const t of r[1].split('|')) {
          expect(ids.has(t.trim()), `${m.id} refers to ${t}`).toBe(true);
          expect(t.trim().split('#')[0], `${m.id} refers to itself`).not.toBe(m.id);
        }
  });
  it('every lesson outside the foundations links to at least one foundation refresher', () => {
    for (const m of MODULES.filter((x) => x.track !== 'foundations')) expect(m.content, m.id).toMatch(/\{\{ref:(math|algo|tools)#/);
  });
  it('content markdown has no unbalanced callouts', () => {
    const dir = join(__dirname, 'content');
    for (const f of readdirSync(dir)) {
      const lines = readFileSync(join(dir, f), 'utf8').split('\n');
      let open = 0;
      for (const l of lines) {
        if (/^:::\w/.test(l)) open++;
        else if (l.trim() === ':::') open--;
      }
      expect(open, f).toBe(0);
    }
  });
});

describe('worked solutions and numeric claims', () => {
  it('oric practice: skew of GAGCCACCGC and frequent 4-mers', () => {
    expect(S.skewArray('GAGCCACCGC')).toEqual([0, 1, 1, 2, 1, 0, 0, -1, -2, -1, -2]);
    expect(S.minimumSkew('GAGCCACCGC').positions).toEqual([8, 10]);
    expect(S.frequentWords('ACGTTGCATGTCGCATGATGCATGAGAGCT', 4)).toEqual({ words: ['CATG', 'GCAT'], count: 3 });
    expect(S.findClumps('CGGACTCGACAGATGTGAAGAACGACAATGTGAAGACTCGACACGACAGAGTGAAGAGAAGAGGAAACATTGTAA', 5, 50, 4)).toEqual(['CGACA', 'GAAGA']);
  });
  it('motif quiz values', () => {
    const p: M.Profile = { A: [0.3, 0.1, 0.4], C: [0.2, 0.2, 0.3], G: [0.2, 0.4, 0.1], T: [0.3, 0.3, 0.2] };
    expect(M.kmerProbability('ATG', p)).toBeCloseTo(0.009, 10);
    expect(M.kmerProbability('TTG', p)).toBeCloseTo(0.009, 10);
    expect(M.kmerProbability('TCG', p)).toBeCloseTo(0.006, 10);
    expect(M.consensus(['ATCGT', 'GTCCA', 'CTAGT', 'CTCCT', 'CTCTG'])).toBe('CTCCT');
    expect(M.motifScore(['ATCGT', 'GTCCA', 'CTAGT', 'CTCCT', 'CTCTG'])).toBe(8);
    expect(M.columnEntropy([0.5, 0.25, 0.25, 0])).toBeCloseTo(1.5);
  });
  it('alignment: with gap −3 the local score exceeds the global score', () => {
    const sc = { match: 2, mismatch: -1, gap: -3 };
    const g = AL.align('ACCGTGC', 'ACGTC', sc, 'global').score;
    const l = AL.align('ACCGTGC', 'ACGTC', sc, 'local').score;
    expect(l).toBeGreaterThan(g);
  });
  it('HMM handout: final H column value', () => {
    const v = H.viterbi(H.GC_HMM, 'GGCACTGAA');
    expect(v.V[0][8]).toBeCloseTo(-25.657, 3);
    expect(v.V[1][8]).toBeCloseTo(-24.49, 2);
  });
  it('quiz: CpG emission comparisons', () => {
    expect(0.4 ** 4).toBeGreaterThan(0.25 ** 4);
    expect(0.35 * 0.35).toBeGreaterThan(0.2 * 0.2);
  });
  it('2×2 eigenvalues in the PCA practice', () => {
    const disc = Math.sqrt(25 - 4 * 3.75);
    expect((5 + disc) / 2).toBeCloseTo(4.081, 3);
    expect((5 + disc) / 2 / 5).toBeCloseTo(0.816, 3);
  });
  it('Phred practice', () => {
    expect(S.phred33ToQ('I')).toBe(40);
    expect(S.phred33ToQ('#')).toBe(2);
    expect(S.phred33ToQ('5')).toBe(20);
  });
});
