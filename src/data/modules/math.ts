import type { Module } from '../types';
import content from '../content/math.md?raw';

const m: Module = {
  id: 'math',
  track: 'foundations',
  code: 'F1',
  title: 'Math Toolkit',
  subtitle: 'Probability, Bayes, entropy, KL divergence, covariance & eigenvectors, gradients',
  icon: '∑',
  color: '#495057',
  hours: 3,
  prereqs: [],
  content,
  concepts: ['probability', 'bayes', 'log-odds', 'entropy', 'kl', 'covariance', 'eigen', 'gradient', 'distance-measures'],
  videos: [
    { id: 'PFDu9oVAE-g', title: 'Eigenvectors and eigenvalues', channel: '3Blue1Brown', why: 'Geometric intuition for PCA.' },
    { id: 'qtaqvPAeEJY', title: 'Covariance, Clearly Explained!!!', channel: 'StatQuest with Josh Starmer', why: 'What covariance measures.' },
    { id: 'SxGYPqCgJWM', title: 'Intuitively Understanding the KL Divergence', channel: 'Adian Liusie', why: 'KL in 5 minutes.' },
    { id: 'kqSzLo9fenk', title: 'A friendly introduction to Bayes Theorem and Hidden Markov Models', channel: 'Luis Serrano Academy', why: 'Bayes leading into HMMs.' },
  ],
  articles: [
    { title: '3Blue1Brown: Essence of linear algebra', url: 'https://www.3blue1brown.com/topics/linear-algebra', source: '3Blue1Brown', why: 'The visual linear algebra course.' },
    { title: 'Mathematics for Machine Learning (free book)', url: 'https://mml-book.github.io/', source: 'Deisenroth, Faisal & Ong', why: 'Linear algebra, probability, optimization for ML.' },
  ],
  quiz: [
    { id: 'q1', type: 'num', q: 'Entropy (bits) of a uniform distribution over A, C, G, T?', answer: 2, explain: 'log₂ 4 = 2.' },
    { id: 'q2', type: 'tf', q: 'KL divergence is symmetric.', answer: false, explain: 'KL(P‖Q) ≠ KL(Q‖P) in general.' },
    { id: 'q3', type: 'mcq', q: 'Why do we use log probabilities in HMMs and profiles?', options: ['to make them positive', 'to avoid numerical underflow and turn products into sums', 'to normalize', 'to remove zeros'], answer: 1, explain: 'Long products of small numbers underflow.' },
    { id: 'q4', type: 'num', q: 'Eigenvalues of [[2,0],[0,5]]: the larger one?', answer: 5, explain: 'Diagonal matrix: eigenvalues are the diagonal entries.' },
    { id: 'q5', type: 'mcq', q: 'Which distance focuses on the shape of expression profiles rather than their level?', options: ['Euclidean', 'Correlation distance', 'Hamming', 'Edit'], answer: 1, explain: '1 − Pearson r ignores scale/offset.' },
    { id: 'q6', type: 'num', q: 'How many distinct 5-mers over {A,C,G,T} exist?', answer: 1024, explain: '4⁵.' },
  ],
  flashcards: [
    { id: 'f1', front: "Bayes' rule", back: 'P(H|D) = P(D|H)P(H)/P(D)' },
    { id: 'f2', front: 'Entropy', back: 'H = −Σ p log₂ p; max log₂ N (uniform), min 0.' },
    { id: 'f3', front: 'KL divergence', back: 'Σ p log(p/q) ≥ 0, 0 iff P = Q, asymmetric.' },
    { id: 'f4', front: 'Covariance matrix', back: 'Σ = XcᵀXc/(n−1): variances on the diagonal, covariances off it; symmetric PSD.' },
    { id: 'f5', front: 'Eigenvector', back: 'Σv = λv; for covariance, λ = variance along v.' },
    { id: 'f6', front: 'Log-odds score', back: 'log₂[P(D|M₁)/P(D|M₂)]; > 0 favors M₁.' },
  ],
  mindmap: {
    label: 'Math toolkit',
    children: [
      { label: 'Probability', children: [{ label: 'conditional, Bayes' }, { label: 'expectation' }, { label: 'sampling' }, { label: 'log-odds' }] },
      { label: 'Information', children: [{ label: 'entropy' }, { label: 'KL divergence' }] },
      { label: 'Linear algebra', children: [{ label: 'covariance' }, { label: 'eigenvectors' }, { label: 'SVD' }] },
      { label: 'Optimization', children: [{ label: 'gradient descent' }, { label: 'chain rule' }, { label: 'local optima' }] },
    ],
  },
  practice: [
    {
      id: 'p1',
      title: 'Entropy of a profile column',
      exam: 'both',
      prompt: 'Compute the entropy of the column (A, C, G, T) = (0.5, 0.25, 0.25, 0).',
      solution: 'H = −(0.5·log₂0.5 + 0.25·log₂0.25 + 0.25·log₂0.25) = 0.5 + 0.5 + 0.5 = **1.5 bits**; information content 2 − 1.5 = 0.5 bits.',
    },
  ],
};
export default m;
