import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONCEPTS, CONCEPT_BY_ID } from '../data/concepts';
import { MODULES, MODULE_BY_ID } from '../data';
import { useProgress } from '../lib/progress';
import { moduleStats } from '../lib/stats';

const GROUP_COLOR: Record<string, string> = { bio: '#2f9e44', cs: '#3d6bf2', math: '#f08c00', ml: '#d6336c', sota: '#9c36b5' };
const GROUP_LABEL: Record<string, string> = { bio: 'Biology', cs: 'Algorithms / CS', math: 'Math & stats', ml: 'Machine learning', sota: 'State of the art' };

type N = SimulationNodeDatum & { id: string };

export default function GraphPage() {
  const p = useProgress();
  const [view, setView] = useState<'concepts' | 'modules'>('concepts');
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const W = 1300;
  const H = 980;

  const modOrder = MODULES.map((m) => m.id);
  const layout = useMemo(() => {
    const nodes: N[] = CONCEPTS.map((c) => ({ id: c.id }));
    const links = CONCEPTS.flatMap((c) => c.requires.filter((r) => CONCEPT_BY_ID[r]).map((r) => ({ source: r, target: c.id })));
    // place each module's concepts around an anchor on a big ring so related ideas cluster
    const anchor = (cid: string) => {
      const i = modOrder.indexOf(CONCEPT_BY_ID[cid].module);
      const a = (2 * Math.PI * i) / modOrder.length - Math.PI / 2;
      return { x: W / 2 + Math.cos(a) * 430, y: H / 2 + Math.sin(a) * 380 };
    };
    nodes.forEach((n) => {
      const a = anchor(n.id);
      n.x = a.x + (Math.random() - 0.5) * 40;
      n.y = a.y + (Math.random() - 0.5) * 40;
    });
    const sim = forceSimulation(nodes)
      .force('link', forceLink(links).id((d) => (d as N).id).distance(40).strength(0.15))
      .force('charge', forceManyBody().strength(-60))
      .force('x', forceX((d) => anchor((d as N).id).x).strength(0.25))
      .force('y', forceY((d) => anchor((d as N).id).y).strength(0.25))
      .force('collide', forceCollide(19))
      .stop();
    for (let i = 0; i < 400; i++) sim.tick();
    const pos: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => (pos[n.id] = { x: n.x!, y: n.y! }));
    return pos;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const learned = (cid: string) => moduleStats(MODULE_BY_ID[CONCEPT_BY_ID[cid].module], p).mastery >= 0.6;
  const selC = sel ? CONCEPT_BY_ID[sel] : null;
  const prereqClosure = useMemo(() => {
    if (!sel) return new Set<string>();
    const out = new Set<string>();
    const walk = (id: string) => CONCEPT_BY_ID[id]?.requires.forEach((r) => { if (!out.has(r)) { out.add(r); walk(r); } });
    walk(sel);
    return out;
  }, [sel]);
  const dependents = selC ? CONCEPTS.filter((c) => c.requires.includes(selC.id)) : [];
  const match = q.trim().toLowerCase();

  if (view === 'modules') {
    const mods = MODULES;
    const pos: Record<string, { x: number; y: number }> = {};
    const tracks = ['foundations', 'cse443', 'frontiers'];
    tracks.forEach((t, ti) => {
      const list = mods.filter((m) => m.track === t);
      list.forEach((m, i) => (pos[m.id] = { x: 90 + ti * 330 + (t === 'cse443' ? (i % 2) * 140 : 0), y: 60 + (t === 'cse443' ? Math.floor(i / 2) * 95 : i * 140) }));
    });
    return (
      <div>
        <Header view={view} setView={setView} q={q} setQ={setQ} />
        <div className="card scroll-x">
          <svg viewBox="0 0 1050 760" style={{ width: '100%', minWidth: 760, height: 'auto' }}>
            <defs><marker id="mArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--text-dim)" /></marker></defs>
            {['Foundations', 'CSE443 course', 'Frontiers'].map((t, i) => <text key={t} x={60 + i * 330} y={24} fontWeight="700">{t}</text>)}
            {mods.flatMap((m) => m.prereqs.map((r) => {
              const a = pos[r];
              const b = pos[m.id];
              return <line key={`${r}-${m.id}`} x1={a.x + 60} y1={a.y} x2={b.x - 62} y2={b.y} stroke="var(--border)" strokeWidth={1.5} markerEnd="url(#mArrow)" />;
            }))}
            {mods.map((m) => {
              const s = moduleStats(m, p);
              const pp = pos[m.id];
              return (
                <Link key={m.id} to={`/m/${m.id}`}>
                  <g transform={`translate(${pp.x - 60},${pp.y - 24})`}>
                    <rect width={120} height={48} rx={10} fill="var(--bg-elev)" stroke={m.color} strokeWidth={2} />
                    <rect width={120 * s.mastery} height={5} y={43} rx={2} fill={m.color} />
                    <text x={60} y={20} textAnchor="middle" fontSize="12" fontWeight="700">{m.icon} {m.code}</text>
                    <text x={60} y={35} textAnchor="middle" fontSize="9.5">{m.title.length > 24 ? m.title.slice(0, 22) + '…' : m.title}</text>
                  </g>
                </Link>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header view={view} setView={setView} q={q} setQ={setQ} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(240px, 1fr)' }}>
        <div className="card" style={{ padding: 8, position: 'relative' }}>
          <div className="row" style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
            <button className="btn small" onClick={() => setZoom((z) => Math.min(4, z * 1.3))}>＋</button>
            <button className="btn small" onClick={() => setZoom((z) => Math.max(0.5, z / 1.3))}>－</button>
            <button className="btn small" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
          </div>
          <svg
            viewBox={`${(W - W / zoom) / 2 - pan.x} ${(H - H / zoom) / 2 - pan.y} ${W / zoom} ${H / zoom}`}
            style={{ width: '100%', height: 'auto', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none', background: 'var(--bg-sunk)', borderRadius: 10 }}
            onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const k = W / zoom / r.width;
              setPan({ x: drag.current.px + (e.clientX - drag.current.x) * k, y: drag.current.py + (e.clientY - drag.current.y) * k });
            }}
            onPointerUp={() => { drag.current = null; }}
            onPointerLeave={() => { drag.current = null; }}
          >
            {CONCEPTS.flatMap((c) => c.requires.filter((r) => layout[r]).map((r) => {
              const a = layout[r];
              const b = layout[c.id];
              const hot = sel && (c.id === sel || r === sel || (prereqClosure.has(r) && (prereqClosure.has(c.id) || c.id === sel)));
              return <line key={`${r}>${c.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot ? 'var(--danger)' : 'var(--border)'} strokeWidth={hot ? 2 : 1} opacity={sel && !hot ? 0.35 : 1} />;
            }))}
            {MODULES.map((m, i) => {
              const a = (2 * Math.PI * i) / MODULES.length - Math.PI / 2;
              return <text key={m.id} x={W / 2 + Math.cos(a) * 600} y={H / 2 + Math.sin(a) * 470} fontSize="12" fontWeight="700" textAnchor="middle" style={{ fill: m.color }}>{m.code}</text>;
            })}
            {CONCEPTS.map((c) => {
              const pp = layout[c.id];
              const isSel = sel === c.id;
              const dim = (sel && !isSel && !prereqClosure.has(c.id) && !dependents.some((d) => d.id === c.id)) || (match && !c.label.toLowerCase().includes(match));
              return (
                <g key={c.id} transform={`translate(${pp.x},${pp.y})`} className="kg-node" onClick={(e) => { e.stopPropagation(); setSel(isSel ? null : c.id); }} opacity={dim ? 0.25 : 1}>
                  <circle r={isSel ? 10 : 7} fill={GROUP_COLOR[c.group]} stroke={learned(c.id) ? 'var(--ok)' : 'var(--bg-elev)'} strokeWidth={learned(c.id) ? 3 : 1.5} />
                  <text x={10} y={4} fontSize="9.5" style={{ paintOrder: 'stroke', stroke: 'var(--bg-sunk)', strokeWidth: 3 }}>{c.label}</text>
                </g>
              );
            })}
          </svg>
          <div className="legend" style={{ marginTop: 6 }}>
            {Object.entries(GROUP_LABEL).map(([g, l]) => <span key={g} style={{ ['--c' as string]: GROUP_COLOR[g] }}>{l}</span>)}
            <span style={{ ['--c' as string]: 'var(--ok)' }}>green ring = mastered (module ≥ 60%)</span>
          </div>
        </div>
        <div className="card small">
          {selC ? (
            <>
              <div className="pill" style={{ color: GROUP_COLOR[selC.group] }}>{GROUP_LABEL[selC.group]}</div>
              <h3>{selC.label}</h3>
              <p>Taught in <Link to={`/m/${selC.module}`}>{MODULE_BY_ID[selC.module].code} {MODULE_BY_ID[selC.module].title}</Link></p>
              <b>Needs first ({prereqClosure.size})</b>
              <ul>{[...prereqClosure].map((r) => <li key={r}><a href="#" onClick={(e) => { e.preventDefault(); setSel(r); }}>{CONCEPT_BY_ID[r].label}</a>{learned(r) ? ' ✓' : ''}</li>)}</ul>
              <b>Unlocks ({dependents.length})</b>
              <ul>{dependents.map((d) => <li key={d.id}><a href="#" onClick={(e) => { e.preventDefault(); setSel(d.id); }}>{d.label}</a></li>)}</ul>
            </>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}>{CONCEPTS.length} concepts</h3>
              <p className="muted">Each dot is a concept, placed near the module that teaches it. Lines point from prerequisites to the ideas they unlock. Click a concept to highlight everything you need to learn before it (its full prerequisite chain) and what it unlocks. Drag to pan; use the buttons to zoom.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ view, setView, q, setQ }: { view: string; setView: (v: 'concepts' | 'modules') => void; q: string; setQ: (s: string) => void }) {
  return (
    <div className="spread" style={{ marginBottom: 10 }}>
      <h1 style={{ margin: 0 }}>Knowledge graph</h1>
      <div className="row">
        <button className={`btn small ${view === 'concepts' ? 'primary' : ''}`} onClick={() => setView('concepts')}>Concepts</button>
        <button className={`btn small ${view === 'modules' ? 'primary' : ''}`} onClick={() => setView('modules')}>Modules</button>
        {view === 'concepts' && <input placeholder="Find concept…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find concept" />}
      </div>
    </div>
  );
}
