import { MODULES, MODULE_BY_ID, TRACKS, sectionsOf } from '../data';
import type { Module, Track } from '../data/types';
import { GAMES } from '../games/registry';
import { levelInfo, streak, totalXp, type Progress } from './progress';

export function moduleStats(m: Module, p: Progress) {
  const secs = sectionsOf(m);
  const done = secs.filter((s) => p.sections[`${m.id}/${s.id}`]).length;
  const quiz = p.quizBest[m.id] ?? 0;
  const cardsSeen = m.flashcards.filter((c) => p.cards[`${m.id}/${c.id}`]).length;
  const practiceDone = m.practice.filter((x) => p.practice[`${m.id}/${x.id}`]).length;
  const secFrac = secs.length ? done / secs.length : 0;
  const mastery = 0.5 * secFrac + 0.35 * quiz + 0.15 * (m.flashcards.length ? cardsSeen / m.flashcards.length : 0);
  return { secs, done, total: secs.length, quiz, cardsSeen, practiceDone, secFrac, mastery };
}

/** Average mastery of the modules in a learning path. */
export function trackProgress(t: Track, p: Progress) {
  if (!t.modules.length) return 0;
  return t.modules.reduce((s, id) => s + moduleStats(MODULE_BY_ID[id], p).mastery, 0) / t.modules.length;
}

export interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  earned: boolean;
}

export function badges(p: Progress): Badge[] {
  const xp = totalXp(p);
  const lvl = levelInfo(xp).level;
  const mastered = MODULES.filter((m) => moduleStats(m, p).mastery >= 0.9).length;
  const completedMods = MODULES.filter((m) => moduleStats(m, p).secFrac === 1).length;
  const perfect = Object.values(p.quizBest).filter((v) => v >= 1).length;
  const gamesPlayed = GAMES.filter((g) => g.id in p.games).length;
  const finishedPath = TRACKS.some((t) => t.modules.length && t.modules.every((id) => moduleStats(MODULE_BY_ID[id], p).secFrac === 1));
  const B = (id: string, icon: string, title: string, desc: string, earned: boolean): Badge => ({ id, icon, title, desc, earned });
  return [
    B('first-step', '👣', 'First Step', 'Complete your first lesson section', Object.keys(p.sections).length > 0),
    B('module', '📗', 'Chapter Closed', 'Finish every section of a module', completedMods >= 1),
    B('five-mods', '📚', 'Bookworm', 'Finish 5 modules', completedMods >= 5),
    B('checkpoint', '🏁', 'Checkpoint Cleared', 'Score 80% on a learning-path checkpoint', Object.values(p.checkpoints).some((v) => v >= 0.8)),
    B('path', '🗺️', 'Trailblazer', 'Finish every section of a learning path', finishedPath),
    B('perfect', '💯', 'Flawless', 'Score 100% on a module quiz', perfect >= 1),
    B('perfect5', '🧠', 'Quiz Master', 'Score 100% on 5 module quizzes', perfect >= 5),
    B('cards50', '🃏', 'Card Shark', 'Do 50 flashcard reviews', p.reviews >= 50),
    B('cards300', '🗂️', 'Memory Palace', 'Do 300 flashcard reviews', p.reviews >= 300),
    B('streak3', '🔥', 'On Fire', '3-day learning streak', streak(p) >= 3),
    B('streak7', '🌋', 'Unstoppable', '7-day learning streak', streak(p) >= 7),
    B('gamer', '🎮', 'Player One', 'Play 3 different mini-games', gamesPlayed >= 3),
    B('arcade', '🕹️', 'Arcade Regular', `Play all ${GAMES.length} mini-games`, gamesPlayed === GAMES.length),
    B('practice', '✍️', 'Problem Solver', 'Solve 10 worked practice problems', Object.keys(p.practice).length >= 10),
    B('master', '🧬', 'Bioinformatician', 'Master (90%) 10 modules', mastered >= 10),
    B('level5', '⭐', 'Rising Star', 'Reach level 5', lvl >= 5),
    B('level10', '🌟', 'Domain Expert', 'Reach level 10', lvl >= 10),
  ];
}
