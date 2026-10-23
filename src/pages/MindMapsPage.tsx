import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, MODULE_BY_ID, TRACKS } from '../data';
import { MindMap } from '../components/MindMap';
import type { MindNode } from '../data/types';

export default function MindMapsPage() {
  const [sel, setSel] = useState('course');
  const course: MindNode = {
    label: 'Bioinformatica',
    children: TRACKS.filter((t) => t.modules.length).map((t) => ({
      label: t.title.replace(' (CSE department)', ''),
      children: t.modules.map((id) => ({ label: `${MODULE_BY_ID[id].code} ${MODULE_BY_ID[id].title}`, children: MODULE_BY_ID[id].mindmap.children })),
    })),
  };
  const root = sel === 'course' ? course : MODULE_BY_ID[sel].mindmap;
  return (
    <div>
      <h1>Mind maps</h1>
      <p className="muted small">Overview maps for revision. Start with the whole course, then zoom into one module. Click any node to fold or unfold its branch.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        <select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Mind map">
          <option value="course">Whole course</option>
          {MODULES.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.title}</option>)}
        </select>
        {sel !== 'course' && <Link to={`/m/${sel}`} className="btn small">Open module →</Link>}
      </div>
      <div className="card"><MindMap key={sel} root={root} /></div>
    </div>
  );
}
