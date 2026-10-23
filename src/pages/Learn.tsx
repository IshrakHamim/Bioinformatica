import { Link } from 'react-router-dom';
import { MODULE_BY_ID, TRACKS } from '../data';
import { ModuleCard } from './Dashboard';

export default function Learn() {
  return (
    <div>
      <h1>Learning paths</h1>
      <p className="muted">
        Recommended order: skim <b>Foundations</b> → work through <b>CSE443</b> in lecture order (each module lists its prerequisites) → explore the <b>Frontiers</b>. The <Link to="/graph">knowledge graph</Link> shows how every concept depends on the others.
      </p>
      {TRACKS.map((t) => (
        <section key={t.id} style={{ marginTop: 24 }}>
          <h2>{t.title}</h2>
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
        </section>
      ))}
    </div>
  );
}
