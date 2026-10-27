import { useSyncExternalStore } from 'react';

// All learner state lives here. It is saved to localStorage and (optionally) synced to a
// remote store; `mergeProgress` makes syncing between devices conflict-free.

export interface CardState {
  box: number; // Leitner box 0..5
  due: number; // epoch ms
}

export interface Progress {
  v: 1;
  sections: Record<string, number>; // "module/section" -> completed at
  answered: Record<string, number>; // "module/qid" -> first correct at (XP once)
  quizBest: Record<string, number>; // module -> best fraction (0..1)
  cards: Record<string, CardState>;
  reviews: number;
  games: Record<string, number>; // game -> high score
  practice: Record<string, number>; // practice problem solved at
  checkpoints: Record<string, number>; // learning path -> best checkpoint fraction (0..1)
  days: string[]; // YYYY-MM-DD with activity
  bonusXp: number;
  lastModule?: string;
  updatedAt: number;
}

export const emptyProgress = (): Progress => ({
  v: 1,
  sections: {},
  answered: {},
  quizBest: {},
  cards: {},
  reviews: 0,
  games: {},
  practice: {},
  checkpoints: {},
  days: [],
  bonusXp: 0,
  updatedAt: 0,
});

export const XP = { section: 20, question: 5, review: 1, practice: 25 };

let user = 'learner';
let state: Progress = emptyProgress();
const listeners = new Set<() => void>();
const key = () => `bioinformatica.progress.${user}`;
let onChange: ((p: Progress) => void) | null = null;

function persist() {
  try {
    localStorage.setItem(key(), JSON.stringify(state));
  } catch {
    /* storage may be blocked (private mode); keep in memory */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function loadProgress(u: string) {
  user = u;
  try {
    // progress saved under the old admin login carries over
    const raw = localStorage.getItem(key()) ?? localStorage.getItem('bioinformatica.progress.admin');
    state = raw ? { ...emptyProgress(), ...(JSON.parse(raw) as Progress) } : emptyProgress();
  } catch {
    state = emptyProgress();
  }
  emit();
}

export const currentUser = () => user;

export function setChangeHook(fn: ((p: Progress) => void) | null) {
  onChange = fn;
}

export function getProgress(): Progress {
  return state;
}

const today = () => new Date().toISOString().slice(0, 10);

export function update(fn: (p: Progress) => void) {
  const next: Progress = JSON.parse(JSON.stringify(state));
  fn(next);
  if (!next.days.includes(today())) next.days = [...next.days, today()].slice(-400);
  next.updatedAt = Date.now();
  state = next;
  persist();
  emit();
  onChange?.(state);
}

export function replaceProgress(p: Progress) {
  state = { ...emptyProgress(), ...p };
  persist();
  emit();
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

const maxRec = (a: Record<string, number>, b: Record<string, number>, pick: (x: number, y: number) => number) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v;
  return out;
};

/** Merge two progress snapshots: union of achievements, newest card schedule. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const cards = { ...a.cards };
  for (const [k, v] of Object.entries(b.cards)) {
    const mine = cards[k];
    if (!mine || v.due > mine.due) cards[k] = v;
  }
  return {
    v: 1,
    sections: maxRec(a.sections, b.sections, Math.min),
    answered: maxRec(a.answered, b.answered, Math.min),
    quizBest: maxRec(a.quizBest, b.quizBest, Math.max),
    practice: maxRec(a.practice, b.practice, Math.min),
    checkpoints: maxRec(a.checkpoints ?? {}, b.checkpoints ?? {}, Math.max),
    games: maxRec(a.games, b.games, Math.max),
    cards,
    reviews: Math.max(a.reviews, b.reviews),
    days: [...new Set([...a.days, ...b.days])].sort().slice(-400),
    bonusXp: Math.max(a.bonusXp, b.bonusXp),
    lastModule: a.updatedAt >= b.updatedAt ? a.lastModule : b.lastModule,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

export function totalXp(p: Progress): number {
  return (
    Object.keys(p.sections).length * XP.section +
    Object.keys(p.answered).length * XP.question +
    p.reviews * XP.review +
    Object.keys(p.practice).length * XP.practice +
    Object.values(p.games).reduce((s, v) => s + Math.min(v, 200), 0) +
    p.bonusXp
  );
}

/** Level n needs 100 * n * (n + 1) / 2 XP in total. */
export function levelInfo(xp: number) {
  let level = 1;
  while ((100 * level * (level + 1)) / 2 <= xp) level++;
  const prev = (100 * (level - 1) * level) / 2;
  const next = (100 * level * (level + 1)) / 2;
  return { level, into: xp - prev, need: next - prev };
}

export function streak(p: Progress): number {
  const set = new Set(p.days);
  let n = 0;
  const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const LEVEL_TITLES = [
  'Nucleotide', 'Codon', 'Gene', 'Operon', 'Chromosome', 'Genome', 'Pangenome', 'Phylum', 'Kingdom', 'Domain', 'LUCA',
];
export const levelTitle = (level: number) => LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
