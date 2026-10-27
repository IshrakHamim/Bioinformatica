import type { Module, Track, Video } from './types';
import { splitSections } from './types';
import intro from './modules/intro';
import oric from './modules/oric';
import motifs from './modules/motifs';
import assembly from './modules/assembly';
import sequencing from './modules/sequencing';
import readmap from './modules/readmap';
import expression1 from './modules/expression1';
import expression2 from './modules/expression2';
import alignment from './modules/alignment';
import phylogeny from './modules/phylogeny';
import hmm from './modules/hmm';
import ml from './modules/ml';
import neural from './modules/neural';
import networks from './modules/networks';
import math from './modules/math';
import algo from './modules/algo';
import tools from './modules/tools';
import structureAi from './modules/structure-ai';
import genomicAi from './modules/genomic-ai';
import modernGenomics from './modules/modern-genomics';

export const MODULES: Module[] = [
  math, algo, tools,
  intro, oric, motifs, assembly, sequencing, readmap, expression1, expression2,
  alignment, phylogeny, hmm, ml, neural, networks,
  structureAi, genomicAi, modernGenomics,
];

export const MODULE_BY_ID: Record<string, Module> = Object.fromEntries(MODULES.map((m) => [m.id, m]));

/** Every lesson video by YouTube id (a video shared by two modules keeps its first description). */
export const VIDEO_BY_ID: Record<string, Video> = {};
for (const m of MODULES) for (const v of m.videos) VIDEO_BY_ID[v.id] ??= v;

export const TRACKS: Track[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    blurb: 'The math, algorithms and data skills the course uses. You do not need to finish these first: every lesson links to the exact foundation section it relies on, and opens it inline when you get stuck.',
    modules: ['math', 'algo', 'tools'],
  },
  {
    id: 'cse443',
    title: 'CSE443 Bioinformatics (CSE department)',
    blurb: 'The full course in lecture order (L01–L15). Each lesson has interactive widgets, mini-games, a quiz and worked problems adapted from the course quizzes and exams.',
    modules: ['intro', 'oric', 'motifs', 'assembly', 'sequencing', 'readmap', 'expression1', 'expression2', 'alignment', 'phylogeny', 'hmm', 'ml', 'neural', 'networks'],
  },
  {
    id: 'frontiers',
    title: 'Frontiers: state of the art',
    blurb: 'AlphaFold, protein design, genomic foundation models and the research topics on the course outline that go beyond the slides.',
    modules: ['structure-ai', 'genomic-ai', 'modern-genomics'],
  },
  {
    id: 'biotech',
    title: 'Biotechnology department courses',
    blurb: 'Coming soon: this track will hold the biotechnology department’s bioinformatics course once its materials are curated.',
    modules: [],
  },
];

/** Section ids of a module (for progress accounting). */
export const sectionsOf = (m: Module) => splitSections(m.content);

/** Bangla lesson text by module id (src/data/content/bn/<id>.md); a module without one stays in English. */
export const BN_CONTENT: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('./content/bn/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>).map(([path, md]) => [
    path.replace(/^.*\/(.+)\.md$/, '$1'),
    md,
  ]),
);

/**
 * The module's sections in the requested language. Section ids always come from the English text (they key progress
 * and refreshers); a translation is used only if it has the same number of sections.
 */
export function localizedSections(m: Module, lang: 'en' | 'bn') {
  const en = sectionsOf(m);
  const bn = lang === 'bn' && BN_CONTENT[m.id] ? splitSections(BN_CONTENT[m.id]) : null;
  if (!bn || bn.length !== en.length) return { secs: en, translated: false };
  return { secs: en.map((s, i) => ({ ...s, title: s.id === 'overview' ? 'ভূমিকা' : bn[i].title, body: bn[i].body })), translated: true };
}
