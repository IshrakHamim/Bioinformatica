import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MODULES } from '../data';
import type { Question } from '../data/types';
import { Quiz } from '../components/Quiz';
import { PracticeCard } from './ModulePage';
import { update, useProgress } from '../lib/progress';
import { examReadiness, moduleStats } from '../lib/stats';

function Timer({ minutes, running }: { minutes: number; running: boolean }) {
  const [left, setLeft] = useState(minutes * 60);
  useEffect(() => setLeft(minutes * 60), [minutes]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  return <span className={`pill ${left < 60 ? 'warn' : ''}`}>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>;
}

export default function ExamPage() {
  const [params, setParams] = useSearchParams();
  const exam = (params.get('tab') === 'final' ? 'final' : 'mid') as 'mid' | 'final';
  const p = useProgress();
  const mods = MODULES.filter((m) => m.exam === exam);
  const practice = mods.flatMap((m) => m.practice.filter((x) => x.exam === exam || x.exam === 'both').map((x) => ({ m, x })));
  const [mock, setMock] = useState(0);
  const mockQs: (Question & { mod: string })[] = useMemo(() => {
    if (!mock) return [];
    const pool = mods.flatMap((m) => m.quiz.filter((q) => q.exam).map((q) => ({ ...q, id: `${m.id}:${q.id}`, mod: m.id })));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 15);
  }, [mock, exam]); // eslint-disable-line react-hooks/exhaustive-deps
  const [done, setDone] = useState<number | null>(null);
  return (
    <div>
      <h1>Exam prep</h1>
      <div className="tabs">
        <button className={`tab ${exam === 'mid' ? 'active' : ''}`} onClick={() => { setParams({ tab: 'mid' }); setMock(0); setDone(null); }}>Mid-term (L01–L08)</button>
        <button className={`tab ${exam === 'final' ? 'active' : ''}`} onClick={() => { setParams({ tab: 'final' }); setMock(0); setDone(null); }}>Final (L10–L15)</button>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <div className="spread"><b>Readiness</b><span className="pill accent">{Math.round(examReadiness(exam, p) * 100)}%</span></div>
          <div className="col" style={{ marginTop: 8 }}>
            {mods.map((m) => {
              const s = moduleStats(m, p);
              return (
                <Link key={m.id} to={`/m/${m.id}`} className="small" style={{ color: 'var(--text)' }}>
                  <div className="spread"><span>{m.icon} {m.code} {m.title}</span><span>{Math.round(s.mastery * 100)}%</span></div>
                  <div className="progress"><div style={{ width: `${s.mastery * 100}%` }} /></div>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="card">
          <b>⚔️ Boss battle: timed mock test</b>
          <p className="small muted">15 random questions drawn from the past quiz/exam questions of this syllabus, with a 20-minute timer (the real quizzes were 15–25 minutes). Worth XP like regular questions.</p>
          <div className="row">
            <button className="btn primary" onClick={() => { setMock((x) => x + 1); setDone(null); }}>{mock ? 'New mock test' : 'Start mock test'}</button>
            {mock > 0 && <Timer key={mock} minutes={20} running={done === null} />}
            {done !== null && <span className="pill ok">Score {Math.round(done * 100)}%</span>}
          </div>
        </div>
      </div>
      {mock > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <Quiz
            key={mock}
            title={`${exam === 'mid' ? 'Mid-term' : 'Final'} mock test #${mock}`}
            questions={mockQs}
            moduleKey={(q) => `${(q as Question & { mod: string }).mod}/${q.id.split(':')[1]}`}
            onFinish={(f) => {
              setDone(f);
              update((pp) => {
                pp.games[`mock-${exam}`] = Math.max(pp.games[`mock-${exam}`] ?? 0, Math.round(f * 100));
              });
            }}
          />
        </div>
      )}
      <h2>Written exam-style problems ({practice.length})</h2>
      <p className="small muted">
        These mirror the structure of the Summer 2025 {exam === 'mid' ? 'mid-term (40 marks, 90 min)' : 'final (40 marks, 100 min)'}. Marks are shown where they come from an exam question.
      </p>
      <div className="col">
        {practice.map(({ m, x }) => (
          <div key={`${m.id}/${x.id}`}>
            <div className="tiny muted" style={{ margin: '6px 0' }}>{m.code} · {m.title}</div>
            <PracticeCard m={m} x={x} />
          </div>
        ))}
      </div>
    </div>
  );
}
