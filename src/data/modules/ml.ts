import type { Module } from '../types';
import content from '../content/ml.md?raw';

const m: Module = {
  id: 'ml',
  track: 'cse443',
  code: 'L13',
  title: 'Supervised Machine Learning',
  subtitle: 'Problem formulation, imbalance & redundancy, features, selection, KNN, metrics, CV',
  icon: '🤖',
  color: '#1098ad',
  exam: 'final',
  hours: 3.5,
  prereqs: ['expression2'],
  content,
  concepts: ['supervised', 'imbalance', 'redundancy', 'features', 'feature-selection', 'knn', 'metrics', 'cross-validation', 'leakage'],
  videos: [
    { id: 'yIYKR4sgzI8', title: 'StatQuest: Logistic Regression', channel: 'StatQuest with Josh Starmer', why: 'A core discriminative classifier.' },
    { id: '6oHl7hNWn2o', title: 'Learn Bioinformatics through Coding on ROSALIND Platform', channel: 'Data Professor', why: 'Bioinformatics ML channel; practical coding mindset.' },
  ],
  articles: [
    { title: 'Libbrecht & Noble (2015) Machine learning applications in genetics and genomics', url: 'https://www.nature.com/articles/nrg3920', source: 'Nature Reviews Genetics', why: 'The review assigned in the course.' },
    { title: 'Chicco & Jurman (2020) The advantages of the Matthews correlation coefficient (MCC) over F1 score and accuracy', url: 'https://bmcgenomics.biomedcentral.com/articles/10.1186/s12864-019-6413-7', source: 'BMC Genomics', why: 'Why MCC for imbalanced binary problems.' },
    { title: 'CD-HIT: clustering to remove redundant sequences', url: 'https://github.com/weizhongli/cdhit', source: 'GitHub', why: 'Standard redundancy-removal tool.' },
    { title: 'ToxinPred2 batch prediction server', url: 'https://webs.iiitd.edu.in/raghava/toxinpred2/batch.html', source: 'IIIT-Delhi', why: 'The deployment example from the slides.' },
  ],
  quiz: [
    { id: 'q1', type: 'mcq', q: 'Homologous sequences shared between training and test sets mainly cause…', options: ['class imbalance', 'over-optimistic performance (leakage)', 'underfitting', 'missing values'], answer: 1, explain: 'Remove redundancy (e.g., CD-HIT) before splitting.' },
    { id: 'q2', type: 'mcq', q: 'A wrapper feature-selection method…', options: ['scores features independently of the model', 'evaluates feature subsets using the model’s performance', 'always uses PCA', 'needs no training data'], answer: 1, explain: 'e.g., recursive feature elimination.' },
    { id: 'q3', type: 'tf', q: 'Supervised feature selection should be performed on the training data only.', answer: true, explain: 'Otherwise information leaks from the test set.' },
    { id: 'q4', type: 'num', q: 'TP = 90, FN = 10, FP = 10, TN = 90. Accuracy?', answer: 0.9, tol: 0.001, explain: '180/200.' },
    { id: 'q5', type: 'mcq', q: 'With 1000 cancer and 100 normal samples, a model predicting “cancer” always has accuracy ≈…', options: ['50%', '90.9%', '100%', '9.1%'], answer: 1, explain: '1000/1100, yet MCC = 0. Accuracy is misleading here.', exam: true },
    { id: 'q6', type: 'mcq', q: 'Which metric uses all four confusion-matrix cells and suits imbalanced data?', options: ['Accuracy', 'Recall', 'MCC', 'Precision'], answer: 2, explain: 'Matthews correlation coefficient.' },
    { id: 'q7', type: 'mcq', q: 'Which is an evolutionary feature for proteins?', options: ['PSSM from PSI-BLAST', 'Molecular weight', 'Sequence length', 'Dipeptide composition'], answer: 0, explain: 'Position-specific scoring matrices encode conservation.', exam: true },
    { id: 'q8', type: 'mcq', q: 'KNN needs feature scaling because…', options: ['it trains slowly', 'distances mix features with different units/ranges', 'it uses gradient descent', 'it is a generative model'], answer: 1, explain: 'Large-range features dominate Euclidean distance.' },
    { id: 'q9', type: 'mcq', q: 'Stratified k-fold cross-validation ensures…', options: ['equal fold sizes only', 'each fold keeps the overall class proportions', 'no training data reuse', 'sequential splits'], answer: 1, explain: 'Important for imbalanced classes.' },
    { id: 'q10', type: 'mcq', q: 'When positives are rare, which curve summary is usually more informative?', options: ['AUROC', 'AUPR', 'Accuracy', 'R²'], answer: 1, explain: 'Precision–recall focuses on the positive class.' },
  ],
  flashcards: [
    { id: 'f1', front: '7 steps of supervised bioinformatics ML', back: 'Formulate → collect data → extract features → select features → train classifier → test (metrics + sampling) → deploy.' },
    { id: 'f2', front: 'Imbalance fixes', back: 'Under/oversampling (SMOTE), class weights, synthetic samples, appropriate metrics (MCC, AUPR).' },
    { id: 'f3', front: 'Redundancy', back: 'Near-identical homologs; remove with CD-HIT before splitting to prevent leakage.' },
    { id: 'f4', front: 'Filter vs wrapper', back: 'Filter: model-independent scores (χ², MI). Wrapper: search subsets with the model (RFE).' },
    { id: 'f5', front: 'MCC', back: '(TP·TN − FP·FN)/√((TP+FP)(TP+FN)(TN+FP)(TN+FN)); −1…1; 0 = random.' },
    { id: 'f6', front: 'F1', back: 'Harmonic mean of precision and recall.' },
    { id: 'f7', front: 'Protein feature families', back: 'Composition, physico-chemical, evolutionary (PSSM), structural, domains, PLM embeddings.' },
    { id: 'f8', front: 'Generative vs discriminative', back: 'Generative models P(x, y) (HMM, naive Bayes); discriminative model P(y | x) or the boundary (SVM, NN).' },
  ],
  mindmap: {
    label: 'Supervised ML',
    children: [
      { label: 'Formulate', children: [{ label: 'sequence → class' }, { label: 'binary / multi-class / multi-label' }] },
      { label: 'Data', children: [{ label: 'curated databases' }, { label: 'imbalance' }, { label: 'redundancy (CD-HIT)' }] },
      { label: 'Features', children: [{ label: 'k-mers / AAC' }, { label: 'physico-chemical' }, { label: 'PSSM' }, { label: 'structure' }, { label: 'embeddings' }] },
      { label: 'Selection', children: [{ label: 'filter' }, { label: 'wrapper' }, { label: 'train-only!' }] },
      { label: 'Evaluate', children: [{ label: 'F1, MCC, AUROC, AUPR' }, { label: 'CV, independent test' }] },
      { label: 'Deploy', children: [{ label: 'web servers (ToxinPred2)' }] },
    ],
  },
  practice: [
    {
      id: 'p1',
      title: 'Features for protein function prediction',
      source: 'Final exam Q3(c), 4 marks',
      exam: 'final',
      marks: 4,
      prompt: 'You formulate protein function prediction from sequence as supervised learning. What options do you have as features?',
      solution: '(1) **Composition**: amino-acid composition, dipeptide/k-mer composition, k-spaced pairs. (2) **Physico-chemical** properties: hydrophobicity, charge, polarity, molecular weight, pI, pseudo-AAC. (3) **Evolutionary**: PSSM/HMM profiles, conservation, BLAST similarity to annotated proteins. (4) **Structural**: predicted secondary structure, solvent accessibility, disorder, AlphaFold-derived structural descriptors. (5) **Domains/motifs**: Pfam/InterPro hits, signal peptides, TM helices. (6) **Learned embeddings**: protein language models (ESM-2, ProtT5) or ProtVec/dna2vec-style embeddings. Scale features and select them on training data only.\n\n{{widget:kmer-features}}',
    },
  ],
};
export default m;
