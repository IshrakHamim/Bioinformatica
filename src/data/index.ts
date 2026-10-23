import type { Module, Track } from './types';
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

export const TRACKS: Track[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    blurb: 'The math, algorithms and data skills every module assumes. Skim if you are confident, and come back when a lesson links here.',
    modules: ['math', 'algo', 'tools'],
  },
  {
    id: 'cse443',
    title: 'CSE443 Bioinformatics (CSE department)',
    blurb: 'The full course in lecture order. L01–L08 = mid-term syllabus, L10–L15 = final syllabus. Every exam and quiz question is covered.',
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
