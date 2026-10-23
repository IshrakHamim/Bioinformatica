import { useMemo, useState } from 'react';
import type { Flashcard } from '../data/types';
import { InlineMd } from '../lib/markdown';
import { XP, update, useProgress } from '../lib/progress';

// Leitner boxes: review intervals in days.
const INTERVALS = [0, 1, 3, 7, 16, 35];
const DAY = 86400000;

export interface DeckCard extends Flashcard {
  key: string; // progress key "module/cardId"
  module: string;
}

export function dueCards(cards: DeckCard[], cardState: Record<string, { box: number; due: number }>, now = Date.now()) {
  return cards.filter((c) => !cardState[c.key] || cardState[c.key].due <= now);
}

export function FlashcardDeck({ cards, title }: { cards: DeckCard[]; title?: string }) {
  const p = useProgress();
  const [mode, setMode] = useState<'due' | 'all'>('due');
  const queue = useMemo(() => {
    const base = mode === 'due' ? dueCards(cards, p.cards) : cards;
    return [...base].sort((a, b) => (p.cards[a.key]?.box ?? -1) - (p.cards[b.key]?.box ?? -1));
    // only rebuild when the deck or mode changes, not after every rating
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, mode]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = queue[i];

  const rate = (r: 'again' | 'good' | 'easy') => {
    if (!card) return;
    update((pp) => {
      const cur = pp.cards[card.key]?.box ?? 0;
      const box = r === 'again' ? 0 : Math.min(INTERVALS.length - 1, cur + (r === 'easy' ? 2 : 1));
      pp.cards[card.key] = { box, due: Date.now() + INTERVALS[box] * DAY };
      pp.reviews += 1;
    });
    setFlipped(false);
    setI((x) => x + 1);
  };

  const boxes = INTERVALS.map((_, b) => cards.filter((c) => (p.cards[c.key]?.box ?? -1) === b).length);
  const unseen = cards.filter((c) => !p.cards[c.key]).length;

  return (
    <div>
      <div className="spread">
        <h3 style={{ margin: 0 }}>{title ?? 'Flashcards'}</h3>
        <div className="row">
          <button className={`btn small ${mode === 'due' ? 'primary' : ''}`} onClick={() => { setMode('due'); setI(0); setFlipped(false); }}>Due ({dueCards(cards, p.cards).length})</button>
          <button className={`btn small ${mode === 'all' ? 'primary' : ''}`} onClick={() => { setMode('all'); setI(0); setFlipped(false); }}>Cram all ({cards.length})</button>
        </div>
      </div>
      <div className="row small muted" style={{ margin: '8px 0' }}>
        <span>New: {unseen}</span>
        {boxes.map((n, b) => <span key={b} title={`review every ${INTERVALS[b]} day(s)`}>Box {b}: {n}</span>)}
      </div>
      {card ? (
        <>
          <div className={`flash ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setFlipped((f) => !f)}>
            <div className="flash-inner">
              <div className="flash-face"><div><div className="tiny muted">{card.module} · tap to flip</div><b><InlineMd text={card.front} /></b></div></div>
              <div className="flash-face back"><div><InlineMd text={card.back} /></div></div>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            {flipped ? (
              <>
                <button className="btn danger" onClick={() => rate('again')}>Again (now)</button>
                <button className="btn" onClick={() => rate('good')}>Good</button>
                <button className="btn primary" onClick={() => rate('easy')}>Easy</button>
              </>
            ) : (
              <button className="btn primary" onClick={() => setFlipped(true)}>Show answer</button>
            )}
          </div>
          <p className="center small muted">Card {i + 1} of {queue.length} · +{XP.review} XP per review</p>
        </>
      ) : (
        <div className="callout tip center">
          <div className="callout-title" style={{ justifyContent: 'center' }}>🎉 All caught up!</div>
          {mode === 'due' ? 'No cards are due right now. Come back tomorrow, or cram all cards.' : 'You went through the whole deck.'}
          <div style={{ marginTop: 8 }}><button className="btn small" onClick={() => { setI(0); setFlipped(false); }}>Restart</button></div>
        </div>
      )}
    </div>
  );
}
