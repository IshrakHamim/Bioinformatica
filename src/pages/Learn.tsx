import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MODULE_BY_ID, TRACKS } from '../data';
import type { Question, Track } from '../data/types';
import { Quiz } from '../components/Quiz';
import { update, useProgress } from '../lib/progress';
import { trackProgress } from '../lib/stats';
import { ModuleCard } from '../components/ModuleCard';

const CHECKPOINT_SIZE = 12;

/** A mixed quiz over a whole learning path, to check the ideas hold together. */
function Checkpoint({ t }: { t: Track }) {
  const p = useProgress();
  const [run, setRun] = useState(0);
  const qs: (Question & { mod: string })[] = useMemo(() => {
    if (!run) return [];
    const pool = t.modules.flatMap((id) => MODULE_BY_ID[id].quiz.map((q) => ({ ...q, id: `${id}:${q.id}`, mod: id })));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, CHECKPOINT_SIZE);
  }, [run, t]);
  const best = p.checkpoints[t.id];
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="spread">
        <div>
          <b>🏁 Path checkpoint</b>
          <div className="small muted">{CHECKPOINT_SIZE} questions mixed from every module in this path. Take it after a few modules to see what has stuck and which lessons to revisit.</div>
        </div>
        <div className="row">
          {best !== undefined && <span className="pill accent">Best {Math.round(best * 100)}%</span>}
          <button className={`btn small ${run ? '' : 'primary'}`} onClick={() => setRun((r) => r + 1)}>{run ? 'New checkpoint' : 'Start checkpoint'}</button>
          {run > 0 && <button className="btn small ghost" onClick={() => setRun(0)}>Close</button>}
        </div>
      </div>
      {run > 0 && (
        <div style={{ marginTop: 12 }}>
          <Quiz
            key={run}
            title={`${t.title}: checkpoint`}
            questions={qs}
            moduleKey={(q) => `${(q as Question & { mod: string }).mod}/${q.id.split(':')[1]}`}
            onFinish={(f) => update((pp) => { pp.checkpoints[t.id] = Math.max(pp.checkpoints[t.id] ?? 0, f); })}
          />
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const p = useProgress();
  const { hash } = useLocation();
  useEffect(() => {
    // after the layout's scroll-to-top on navigation
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [hash]);
  return (
    <div>
      <h1>Learning paths</h1>
      <p className="muted">
        Recommended order: skim <b>Foundations</b> → work through <b>CSE443</b> in lecture order (each module lists its prerequisites) → explore the <b>Frontiers</b>. Inside each module, read the lesson, play its games as you reach them, then try the quiz and practice problems. The <Link to="/graph">knowledge graph</Link> shows how every concept depends on the others.
      </p>
      {TRACKS.map((t) => (
        <section key={t.id} id={t.id} style={{ marginTop: 24 }}>
          <div className="spread">
            <h2>{t.title}</h2>
            {t.modules.length > 0 && <span className="pill accent">{Math.round(trackProgress(t, p) * 100)}% mastered</span>}
          </div>
          <p className="muted small">{t.blurb}</p>
          {t.modules.length ? (
            <div className="grid cols-3">{t.modules.map((id) => <ModuleCard key={id} id={id} />)}</div>
          ) : (
            <div className="callout tip">
              <div className="callout-title">🧪 Placeholder</div>
              Add the biotechnology course by dropping its lesson markdown into <code>src/data/content/</code>, describing it in <code>src/data/modules/&lt;id&gt;.ts</code>, and listing the id in this track in <code>src/data/index.ts</code>. The README has a step-by-step guide.
            </div>
          )}
          {t.id === 'cse443' && (
            <div className="small muted" style={{ marginTop: 8 }}>
              Prerequisite chain: {t.modules.map((id) => MODULE_BY_ID[id].code).join(' → ')}
            </div>
          )}
          {t.modules.length > 0 && <Checkpoint t={t} />}
        </section>
      ))}
    </div>
  );
}
