import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MODULE_BY_ID, localizedSections } from '../data';
import { LangToggle } from '../components/LangToggle';
import { useLang } from '../lib/prefs';
import { FlashcardDeck } from '../components/Flashcards';
import { MindMap } from '../components/MindMap';
import { Quiz } from '../components/Quiz';
import { toast } from '../components/Toast';
import { GameCard } from '../components/GameCard';
import { gamesFor } from '../games/registry';
import { BlockMd, LessonModule, Markdown } from '../lib/markdown';
import { XP, update, useProgress } from '../lib/progress';
import { moduleStats } from '../lib/stats';
import type { Module, Practice } from '../data/types';

const TABS = ['learn', 'quiz', 'practice', 'games', 'cards', 'map', 'reading'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { learn: '📖 Lessons', quiz: '❓ Quiz', practice: '✍️ Practice problems', games: '🎮 Games', cards: '🃏 Flashcards', map: '🧠 Mind map', reading: '📚 Further reading' };

export function PracticeCard({ m, x }: { m: Module; x: Practice }) {
  const p = useProgress();
  const [show, setShow] = useState(false);
  const key = `${m.id}/${x.id}`;
  const solved = !!p.practice[key];
  return (
    <div className="card">
      <div className="spread">
        <b>{x.title}</b>
        <div className="row">
          {x.source && <span className="pill">{x.source}</span>}
          {solved && <span className="pill ok">✓ solved</span>}
        </div>
      </div>
      <BlockMd text={x.prompt} />
      <div className="row">
        <button className="btn small" onClick={() => setShow((s) => !s)}>{show ? 'Hide solution' : 'Show worked solution'}</button>
        {!solved && (
          <button className="btn small primary" onClick={() => { update((pp) => { pp.practice[key] = Date.now(); }); toast(`+${XP.practice} XP`); }}>
            I solved it myself
          </button>
        )}
      </div>
      {show && (
        <div className="callout exam" style={{ marginTop: 10 }}>
          <Markdown source={x.solution} />
        </div>
      )}
    </div>
  );
}

export default function ModulePage() {
  const { id = '' } = useParams();
  const m = MODULE_BY_ID[id];
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'learn') as Tab;
  const p = useProgress();
  const [lang, setLang] = useLang();
  // per-section language overrides; changing the page language resets them, so the page switch applies to every section
  const [override, setOverride] = useState<Record<string, 'en' | 'bn'>>({});
  useEffect(() => setOverride({}), [id, lang]);
  useEffect(() => {
    if (m && p.lastModule !== m.id) update((pp) => { pp.lastModule = m.id; });
  }, [m?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const jump = params.get('s');
  useEffect(() => {
    // ?s=<section id> (used by the inline refreshers) scrolls straight to that section.
    if (tab === 'learn' && jump) requestAnimationFrame(() => document.getElementById(jump)?.scrollIntoView({ behavior: 'smooth' }));
  }, [m?.id, tab, jump]);
  if (!m) return <p>Module not found. <Link to="/learn">Back to paths</Link></p>;
  const s = moduleStats(m, p);
  const toggle = (sid: string) => {
    const key = `${m.id}/${sid}`;
    const wasDone = !!p.sections[key];
    update((pp) => {
      if (pp.sections[key]) delete pp.sections[key];
      else pp.sections[key] = Date.now();
    });
    if (!wasDone) toast(`+${XP.section} XP · section complete`);
  };
  const games = gamesFor(m.id);
  const enSecs = localizedSections(m, 'en').secs;
  const bnLoc = localizedSections(m, 'bn');
  const translated = bnLoc.translated;
  const pageBn = lang === 'bn' && translated;
  const cards = m.flashcards.map((c) => ({ ...c, key: `${m.id}/${c.id}`, module: m.code }));
  return (
    <div>
      <div className="spread">
        <div className="row small muted"><Link to="/learn">Learning paths</Link> › {m.code}</div>
        <div className="row">
          {lang === 'bn' && !translated && <span className="small muted" lang="bn">এই লেসনের বাংলা ব্যাখ্যা এখনো তৈরি হয়নি।</span>}
          <LangToggle value={lang} onChange={setLang} label="Language for the whole page" />
        </div>
      </div>
      <div className="spread" style={{ marginTop: 6 }}>
        <div className="row">
          <div className="mod-icon" style={{ background: m.color, width: 52, height: 52, fontSize: '1.6rem' }}>{m.icon}</div>
          <div>
            <h1 style={{ margin: 0 }}>{m.title}</h1>
            <div className="muted">{m.subtitle}</div>
          </div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="small spread"><span>Mastery</span><b>{Math.round(s.mastery * 100)}%</b></div>
          <div className="progress"><div style={{ width: `${s.mastery * 100}%` }} /></div>
          <div className="tiny muted">{s.done}/{s.total} sections · best quiz {Math.round(s.quiz * 100)}% · {s.cardsSeen}/{m.flashcards.length} cards</div>
        </div>
      </div>
      {m.prereqs.length > 0 && (
        <div className="small" style={{ marginTop: 10 }}>
          Builds on: {m.prereqs.map((pid) => <Link key={pid} to={`/m/${pid}`} className="pill" style={{ marginRight: 6 }}>{MODULE_BY_ID[pid]?.code} {MODULE_BY_ID[pid]?.title}</Link>)}
        </div>
      )}
      <div className="tabs" role="tablist">
        {TABS.filter((t) => (t !== 'practice' || m.practice.length) && (t !== 'games' || games.length) && (t !== 'reading' || m.articles.length || m.rosalind?.length)).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setParams({ tab: t })}>{TAB_LABEL[t]}</button>
        ))}
      </div>

      {tab === 'learn' && (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <nav className="card small" aria-label="Sections">
            <b>{pageBn ? 'অংশসমূহ' : 'Sections'}</b>
            <ol style={{ margin: '6px 0 0', paddingLeft: 20 }}>
              {(pageBn ? bnLoc.secs : enSecs).map((sec) => (
                <li key={sec.id} lang={pageBn ? 'bn' : undefined}>
                  <a href={`#${sec.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' }); }}>{sec.title}</a>
                  {p.sections[`${m.id}/${sec.id}`] && ' ✓'}
                </li>
              ))}
            </ol>
          </nav>
          {enSecs.map((enSec, i) => {
            const done = !!p.sections[`${m.id}/${enSec.id}`];
            const secLang = translated ? override[enSec.id] ?? lang : 'en';
            const sec = secLang === 'bn' ? bnLoc.secs[i] : enSec;
            return (
              <article key={enSec.id} id={enSec.id} className="card section-card" lang={secLang === 'bn' ? 'bn' : undefined}>
                <div className="section-head">
                  <h2>{sec.title}</h2>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    {translated && <LangToggle small value={secLang} onChange={(l) => setOverride((o) => ({ ...o, [enSec.id]: l }))} label="Language for this section" />}
                    <button className={`btn small done-btn ${done ? 'done' : ''}`} onClick={() => toggle(enSec.id)}>{secLang === 'bn' ? (done ? '✓ সম্পন্ন' : 'সম্পন্ন') : done ? '✓ Completed' : 'Mark complete'}</button>
                  </div>
                </div>
                <LessonModule.Provider value={m}>
                  <Markdown source={sec.body} />
                </LessonModule.Provider>
              </article>
            );
          })}
          <div className="card row" style={{ justifyContent: 'space-between' }}>
            <span>Finished reading? Test yourself.</span>
            <div className="row">
              <button className="btn primary" onClick={() => setParams({ tab: 'quiz' })}>Take the quiz →</button>
              {m.practice.length > 0 && <button className="btn" onClick={() => setParams({ tab: 'practice' })}>Practice problems →</button>}
              {games.length > 0 && <button className="btn" onClick={() => setParams({ tab: 'games' })}>Play {games.length === 1 ? games[0].title : `${games.length} games`} →</button>}
              <button className="btn" onClick={() => setParams({ tab: 'cards' })}>Flashcards →</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'reading' && (
        <div>
          <p className="small muted">The videos for this module are inside the lesson, next to the part they explain. This page collects the articles, papers and tools to go further.</p>
          {m.articles.length > 0 && (
            <>
              <h2>Articles & resources</h2>
              <div className="col">
                {m.articles.map((a) => (
                  <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="card" style={{ color: 'var(--text)' }}>
                    <b>{a.title} ↗</b>
                    <div className="small muted">{a.source}{a.why ? ` · ${a.why}` : ''}</div>
                  </a>
                ))}
              </div>
            </>
          )}
          {m.rosalind && m.rosalind.length > 0 && (
            <>
              <h2>Rosalind problems</h2>
              <p className="small muted">Implement the algorithms yourself; Rosalind auto-grades your output.</p>
              <div className="grid cols-3">
                {m.rosalind.map((r) => (
                  <a key={r.id} href={`https://rosalind.info/problems/${r.id}/`} target="_blank" rel="noopener noreferrer" className="card small" style={{ color: 'var(--text)' }}>
                    <span className="pill">{r.id.toUpperCase()}</span> {r.title}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'quiz' && (
        <div className="card">
          <Quiz
            questions={m.quiz}
            moduleKey={(q) => `${m.id}/${q.id}`}
            title={`${m.code} quiz`}
            onFinish={(frac) => {
              update((pp) => {
                pp.quizBest[m.id] = Math.max(pp.quizBest[m.id] ?? 0, frac);
              });
            }}
          />
        </div>
      )}

      {tab === 'cards' && <div className="card"><FlashcardDeck cards={cards} title={`${m.code} flashcards`} /></div>}

      {tab === 'map' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Mind map: {m.title}</h3>
          <p className="small muted">Click a node to collapse or expand its branch.</p>
          <MindMap root={m.mindmap} />
        </div>
      )}

      {tab === 'games' && (
        <div className="col">
          <p className="muted small">Games that drill this lesson's ideas until they feel automatic. They also appear inside the lesson, next to the section they practise. High scores add XP.</p>
          {games.map((g) => <GameCard key={g.id} game={g} open={games.length === 1} />)}
        </div>
      )}

      {tab === 'practice' && (
        <div className="col">
          <p className="muted small">Problems adapted from the course quizzes and exams, with fully worked solutions verified by the site's own algorithm implementations. Working one through on paper is the best way to check you really understand the algorithm; reveal the solution afterwards.</p>
          {m.practice.map((x) => <PracticeCard key={x.id} m={m} x={x} />)}
        </div>
      )}
    </div>
  );
}
