import type { ComponentType } from 'react';
import { AlignDuel, CodonQuest, ComplementRush, CpgDetective, EulerTrail, HubHunter, LloydStep, MetricMatch, MotifHunter, PhredFlash, ShiftSprint, SkewHunter, TreeBuilder } from './games';

export interface Game {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  module: string; // the lesson module the game belongs to
  C: ComponentType;
}

// Games appear in their module's "Games" tab, and lessons embed them with {{game:id}}.
export const GAMES: Game[] = [
  { id: 'codon-quest', title: 'Codon Quest', icon: '🧩', blurb: 'Translate mRNA codons to amino acids against the clock.', module: 'intro', C: CodonQuest },
  { id: 'complement-rush', title: 'Complement Rush', icon: '⚡', blurb: 'Type reverse complements of ever-longer DNA strings.', module: 'oric', C: ComplementRush },
  { id: 'skew-hunter', title: 'Skew Hunter', icon: '📉', blurb: 'Locate oriC from a skew diagram.', module: 'oric', C: SkewHunter },
  { id: 'motif-hunter', title: 'Motif Hunter', icon: '🔍', blurb: 'Spot an implanted motif by eye, the way Gibbs sampling would.', module: 'motifs', C: MotifHunter },
  { id: 'euler-trail', title: 'Euler Trail', icon: '🕸️', blurb: 'Assemble a genome by walking a de Bruijn graph edge by edge.', module: 'assembly', C: EulerTrail },
  { id: 'phred-flash', title: 'Phred Flash', icon: '🔦', blurb: 'Decode FASTQ quality characters into Q scores and error rates.', module: 'sequencing', C: PhredFlash },
  { id: 'shift-sprint', title: 'Shift Sprint', icon: '⏩', blurb: 'Work out Boyer-Moore bad-character shifts at speed.', module: 'readmap', C: ShiftSprint },
  { id: 'lloyd-step', title: 'Lloyd Step', icon: '🎯', blurb: 'Predict where a k-means center moves after one iteration.', module: 'expression1', C: LloydStep },
  { id: 'align-duel', title: 'Align Duel', icon: '🧮', blurb: 'Compute optimal global/local alignment scores in your head.', module: 'alignment', C: AlignDuel },
  { id: 'tree-builder', title: 'Tree Builder', icon: '🌳', blurb: 'Build a UPGMA tree by merging the closest clusters.', module: 'phylogeny', C: TreeBuilder },
  { id: 'cpg-detective', title: 'CpG Detective', icon: '🕵️', blurb: 'Find CpG islands and race the Viterbi algorithm.', module: 'hmm', C: CpgDetective },
  { id: 'metric-match', title: 'Metric Match', icon: '📊', blurb: 'Read a confusion matrix: precision, recall, F1, MCC and more.', module: 'ml', C: MetricMatch },
  { id: 'hub-hunter', title: 'Hub Hunter', icon: '🧲', blurb: 'Find the most central protein by degree, closeness or betweenness.', module: 'networks', C: HubHunter },
];

export const GAME_BY_ID: Record<string, Game> = Object.fromEntries(GAMES.map((g) => [g.id, g]));
export const gamesFor = (moduleId: string) => GAMES.filter((g) => g.module === moduleId);
