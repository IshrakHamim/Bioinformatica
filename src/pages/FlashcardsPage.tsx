import { useMemo, useState } from 'react';
import { MODULES } from '../data';
import { FlashcardDeck, dueCards } from '../components/Flashcards';
import { useProgress } from '../lib/progress';

export default function FlashcardsPage() {
  const p = useProgress();
  const [sel, setSel] = useState<string>('all');
  const all = useMemo(() => MODULES.flatMap((m) => m.flashcards.map((c) => ({ ...c, key: `${m.id}/${c.id}`, module: m.code }))), []);
  const cards = sel === 'all' ? all : sel === 'mid' || sel === 'final' ? all.filter((c) => MODULES.find((m) => m.code === c.module)?.exam === sel) : all.filter((c) => c.key.startsWith(`${sel}/`));
  return (
    <div>
      <h1>Flashcards</h1>
      <p className="muted small">Spaced repetition (Leitner system): “Again” resets a card to box 0; “Good” moves it up one box; “Easy” moves it up two. Review gaps grow 0 → 1 → 3 → 7 → 16 → 35 days, so you see hard cards often and easy ones rarely. {all.length} cards in total, {dueCards(all, p.cards).length} due now.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        <select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Deck">
          <option value="all">All modules</option>
          <option value="mid">Mid-term syllabus</option>
          <option value="final">Final syllabus</option>
          {MODULES.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}
        </select>
      </div>
      <div className="card"><FlashcardDeck key={sel} cards={cards} title={sel === 'all' ? 'All decks' : undefined} /></div>
    </div>
  );
}
