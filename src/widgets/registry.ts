import type { ComponentType } from 'react';
import { CentralDogma, DnaBuilder, EigenWidget, EntropyWidget, KLWidget } from './foundations';
import { ApproxMatch, ClumpFinder, KmerCounter, ReplicationFork, SkewPlot } from './oric';
import { MotifSearch, ProfileBuilder } from './motifs';
import { DeBruijnExplorer, ReadBreaking } from './assembly';
import { PhredWidget, SBSSimulator } from './sequencing';
import { BoyerMooreViz, EditDistanceViz, KmerIndexViz, PigeonholeViz } from './readmap';
import { HClustViz, KMeansPPCalc, KMeansPlayground, SoftKMeans } from './cluster';
import { PCAViz, TSNEViz } from './dimred';
import { AffineGap, AlignmentDP, BlastSeed } from './alignment';
import { FitchViz, NJViz, UPGMAViz } from './phylo';
import { CasinoDecoder, ViterbiTable } from './hmm';
import { ConfusionWidget, GradientDescentViz, KNNViz, KmerFeaturesViz, LogRegViz, SigmoidWidget } from './ml';
import { CentralityViz, GirvanNewmanViz, RobustnessViz } from './network';
import { AlphaFoldViewer, Timeline } from './frontiers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WIDGETS: Record<string, ComponentType<any>> = {
  'dna-builder': DnaBuilder,
  'central-dogma': CentralDogma,
  entropy: EntropyWidget,
  kl: KLWidget,
  eigen: EigenWidget,
  'kmer-counter': KmerCounter,
  skew: SkewPlot,
  'approx-match': ApproxMatch,
  clumps: ClumpFinder,
  'replication-fork': ReplicationFork,
  profile: ProfileBuilder,
  'motif-search': MotifSearch,
  debruijn: DeBruijnExplorer,
  'read-breaking': ReadBreaking,
  sbs: SBSSimulator,
  phred: PhredWidget,
  'boyer-moore': BoyerMooreViz,
  'kmer-index': KmerIndexViz,
  pigeonhole: PigeonholeViz,
  'edit-distance': EditDistanceViz,
  kmeans: KMeansPlayground,
  'soft-kmeans': SoftKMeans,
  'kmeans-pp': KMeansPPCalc,
  hclust: HClustViz,
  pca: PCAViz,
  tsne: TSNEViz,
  alignment: AlignmentDP,
  'affine-gap': AffineGap,
  blast: BlastSeed,
  upgma: UPGMAViz,
  nj: NJViz,
  fitch: FitchViz,
  viterbi: ViterbiTable,
  casino: CasinoDecoder,
  'kmer-features': KmerFeaturesViz,
  confusion: ConfusionWidget,
  knn: KNNViz,
  'gradient-descent': GradientDescentViz,
  logreg: LogRegViz,
  sigmoid: SigmoidWidget,
  centrality: CentralityViz,
  robustness: RobustnessViz,
  'girvan-newman': GirvanNewmanViz,
  alphafold: AlphaFoldViewer,
  timeline: Timeline,
};
