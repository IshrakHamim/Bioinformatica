import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, sectionsOf } from '../data';
import { InlineMd } from '../lib/markdown';

export default function GlossaryPage() {
  const [q, setQ] = useState('');
  const terms = useMemo(
    () => MODULES.flatMap((m) => m.flashcards.map((c) => ({ ...c, m }))).sort((a, b) => a.front.localeCompare(b.front)),
    [],
  );
  const sections = useMemo(() => MODULES.flatMap((m) => sectionsOf(m).map((s) => ({ m, s, text: (s.title + ' ' + s.body).toLowerCase() }))), []);
  const needle = q.trim().toLowerCase();
  const hitsT = needle ? terms.filter((t) => (t.front + ' ' + t.back).toLowerCase().includes(needle)) : terms;
  const hitsS = needle.length > 1 ? sections.filter((x) => x.text.includes(needle)).slice(0, 30) : [];
  const snippet = (body: string) => {
    const i = body.toLowerCase().indexOf(needle);
    if (i < 0) return '';
    return (i > 60 ? '…' : '') + body.slice(Math.max(0, i - 60), i + 100).replace(/[#*`${}]/g, '') + '…';
  };
  return (
    <div>
      <h1>Glossary & search</h1>
      <input autoFocus placeholder="Search terms and lessons (e.g. “Viterbi”, “pseudocount”, “UPGMA”)" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', padding: 10, fontSize: '1rem' }} aria-label="Search" />
      {hitsS.length > 0 && (
        <>
          <h2>Lesson sections ({hitsS.length})</h2>
          <div className="col">
            {hitsS.map(({ m, s }) => (
              <Link key={`${m.id}/${s.id}`} to={`/m/${m.id}?tab=learn`} className="card small" style={{ color: 'var(--text)' }}>
                <b>{m.code} › {s.title}</b>
                <div className="muted">{snippet(s.body)}</div>
              </Link>
            ))}
          </div>
        </>
      )}
      <h2>Terms ({hitsT.length})</h2>
      <div className="grid cols-2">
        {hitsT.map((t) => (
          <div key={`${t.m.id}/${t.id}`} className="card small">
            <div className="spread"><b><InlineMd text={t.front} /></b><Link to={`/m/${t.m.id}`} className="pill">{t.m.code}</Link></div>
            <div style={{ marginTop: 4 }}><InlineMd text={t.back} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
