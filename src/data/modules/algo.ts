import type { Module } from '../types';
import content from '../content/algo.md?raw';

const m: Module = {
  id: 'algo',
  track: 'foundations',
  code: 'F2',
  title: 'Algorithms Toolkit',
  subtitle: 'Hashing, greedy, dynamic programming, randomized, graph algorithms, EM, NP-hardness',
  icon: '⚙️',
  color: '#343a40',
  hours: 2.5,
  prereqs: [],
  content,
  concepts: ['complexity', 'hashing', 'greedy-alg', 'dp', 'randomized-alg', 'graph-alg', 'em-pattern', 'np-hard'],
  videos: [
    { id: '8Q2IEIY2pDU', title: 'ADS1: Solving the edit distance problem', channel: 'Ben Langmead', why: 'DP from first principles on strings.' },
    { id: 'TNYZZKrjCSk', title: 'ADS1: De Bruijn graphs and Eulerian walks', channel: 'Ben Langmead', why: 'Eulerian vs Hamiltonian in genomics.' },
  ],
  articles: [
    { title: 'Eddy (2004) What is dynamic programming?', url: 'https://www.nature.com/articles/nbt0704-909', source: 'Nature Biotechnology', why: 'DP for biologists.' },
    { title: 'Rosalind: Algorithmic Heights', url: 'https://rosalind.info/problems/list-view/?location=algorithmic-heights', source: 'Rosalind', why: 'Graph/sorting warm-ups.' },
  ],
  quiz: [
    { id: 'q1', type: 'mcq', q: 'Which problem is NP-complete?', options: ['Eulerian path', 'Hamiltonian path', 'Shortest path (BFS)', 'Global alignment'], answer: 1, explain: 'Hamiltonian path; Eulerian is linear time.' },
    { id: 'q2', type: 'mcq', q: 'GibbsSampler is an example of a…', options: ['Las Vegas algorithm', 'Monte Carlo algorithm', 'greedy exact algorithm', 'DP algorithm'], answer: 1, explain: 'Fast and randomized, but not guaranteed optimal.' },
    { id: 'q3', type: 'mcq', q: 'Which ingredient is essential for dynamic programming?', options: ['randomness', 'overlapping subproblems with optimal substructure', 'sorting', 'graphs'], answer: 1, explain: 'Optimal solutions composed from optimal subsolutions.' },
    { id: 'q4', type: 'tf', q: 'k-means, Baum–Welch and RandomizedMotifSearch all alternate between two steps and can get stuck in local optima.', answer: true, explain: 'The EM-like pattern.' },
  ],
  flashcards: [
    { id: 'f1', front: 'DP recipe', back: 'Subproblem → recurrence → fill order → traceback.' },
    { id: 'f2', front: 'Monte Carlo vs Las Vegas', back: 'Monte Carlo: fixed time, maybe wrong. Las Vegas: always right, random time.' },
    { id: 'f3', front: 'Hash map use cases', back: 'k-mer counting, k-mer indexes, de Bruijn construction: O(1) expected lookup.' },
    { id: 'f4', front: 'EM pattern', back: 'Alternate “assign given parameters” and “re-estimate parameters”; local optimum.' },
  ],
  mindmap: {
    label: 'Algorithm patterns',
    children: [
      { label: 'Exact', children: [{ label: 'brute force' }, { label: 'DP' }, { label: 'graph search' }] },
      { label: 'Fast lookup', children: [{ label: 'hashing' }, { label: 'binary search' }, { label: 'suffix structures' }] },
      { label: 'Heuristics', children: [{ label: 'greedy' }, { label: 'randomized' }, { label: 'EM / local search' }] },
      { label: 'Hardness', children: [{ label: 'NP-complete formulations' }, { label: 'reformulate (de Bruijn)' }] },
    ],
  },
  practice: [],
};
export default m;
