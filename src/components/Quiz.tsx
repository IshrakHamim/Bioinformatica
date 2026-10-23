import { useMemo, useState } from 'react';
import type { Question } from '../data/types';
import { InlineMd } from '../lib/markdown';
import { XP, update } from '../lib/progress';
import { toast } from './Toast';

interface Props {
  questions: Question[];
  moduleKey: (q: Question) => string; // progress key per question, e.g. "oric/q1"
  onFinish?: (fraction: number) => void;
  title?: string;
  shuffle?: boolean;
}

function isCorrect(q: Question, ans: string | number | boolean): boolean {
  if (q.type === 'mcq') return ans === q.answer;
  if (q.type === 'tf') return ans === q.answer;
  const v = Number(String(ans).replace(/[^0-9eE+\-.]/g, ''));
  if (!Number.isFinite(v)) return false;
  const tol = q.tol ?? (Number.isInteger(q.answer) ? 0 : Math.abs(q.answer) * 0.01 + 1e-9);
  return Math.abs(v - q.answer) <= tol;
}

export function Quiz({ questions, moduleKey, onFinish, title, shuffle = false }: Props) {
  const [seed, setSeed] = useState(0);
  const qs = useMemo(() => {
    if (!shuffle) return questions;
    const a = [...questions];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [questions, shuffle, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const answered = Object.keys(answers).length;
  const correct = qs.filter((q) => q.id in answers && isCorrect(q, answers[q.id])).length;

  const answer = (q: Question, a: string | number | boolean) => {
    if (q.id in answers) return;
    const next = { ...answers, [q.id]: a };
    setAnswers(next);
    const ok = isCorrect(q, a);
    if (ok) {
      update((p) => {
        const k = moduleKey(q);
        if (!p.answered[k]) {
          p.answered[k] = Date.now();
          toast(`+${XP.question} XP`);
        }
      });
    }
    if (Object.keys(next).length === qs.length) {
      const frac = qs.filter((x) => isCorrect(x, next[x.id])).length / qs.length;
      onFinish?.(frac);
    }
  };

  return (
    <div>
      <div className="spread">
        <h3 style={{ margin: 0 }}>{title ?? 'Quiz'}</h3>
        <div className="row">
          <span className="pill accent">{correct} / {answered} correct · {qs.length} questions</span>
          <button className="btn small" onClick={() => { setAnswers({}); setDrafts({}); setSeed((s) => s + 1); }}>Retry</button>
        </div>
      </div>
      {qs.map((q, i) => {
        const done = q.id in answers;
        const ok = done && isCorrect(q, answers[q.id]);
        return (
          <div key={q.id} className="q">
            <div style={{ fontWeight: 600 }}>
              {i + 1}. <InlineMd text={q.q} /> {q.exam && <span className="pill warn" title="From a past quiz/exam">exam</span>}
            </div>
            {q.type === 'mcq' &&
              q.options.map((o, oi) => (
                <button key={oi} disabled={done} className={`opt ${done && oi === q.answer ? 'correct' : ''} ${done && answers[q.id] === oi && oi !== q.answer ? 'wrong' : ''}`} onClick={() => answer(q, oi)}>
                  {String.fromCharCode(65 + oi)}. <InlineMd text={o} />
                </button>
              ))}
            {q.type === 'tf' && (
              <div className="row" style={{ marginTop: 6 }}>
                {[true, false].map((v) => (
                  <button key={String(v)} disabled={done} className={`opt ${done && v === q.answer ? 'correct' : ''} ${done && answers[q.id] === v && v !== q.answer ? 'wrong' : ''}`} style={{ width: 'auto', minWidth: 100 }} onClick={() => answer(q, v)}>
                    {v ? 'True' : 'False'}
                  </button>
                ))}
              </div>
            )}
            {q.type === 'num' && (
              <form className="row" style={{ marginTop: 6 }} onSubmit={(e) => { e.preventDefault(); if (drafts[q.id]?.trim()) answer(q, drafts[q.id]); }}>
                <input disabled={done} value={drafts[q.id] ?? ''} onChange={(e) => setDrafts({ ...drafts, [q.id]: e.target.value })} placeholder="Your answer" style={{ width: 160 }} aria-label="numeric answer" />
                <button className="btn small" disabled={done}>Check</button>
                {done && <span className={`pill ${ok ? 'ok' : 'warn'}`}>{ok ? 'Correct' : `Answer: ${q.answer}`}</span>}
              </form>
            )}
            {done && (
              <div className="explain">
                <b style={{ color: ok ? 'var(--ok)' : 'var(--danger)' }}>{ok ? '✓ Correct.' : '✗ Not quite.'}</b> <InlineMd text={q.explain} />
              </div>
            )}
          </div>
        );
      })}
      {answered === qs.length && qs.length > 0 && (
        <div className="callout tip">
          <div className="callout-title">Result: {Math.round((correct / qs.length) * 100)}%</div>
          {correct === qs.length ? 'Perfect score! 🎉' : 'Review the explanations above, then retry. Questions you missed will be easier next time.'}
        </div>
      )}
    </div>
  );
}
