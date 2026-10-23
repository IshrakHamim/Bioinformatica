import { useMemo, useState } from 'react';
import type { MindNode } from '../data/types';

interface Placed {
  node: MindNode;
  path: string;
  depth: number;
  x: number;
  y: number;
  parent?: Placed;
}

const COLORS = ['var(--accent)', 'var(--accent-2)', '#ae3ec9', '#e8590c', '#2f9e44', '#d6336c', '#0b7285', '#f59f00'];

/** Horizontal tidy tree: root on the left, leaves stacked on the right; click to collapse. */
export function MindMap({ root }: { root: MindNode }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const { placed, height, width } = useMemo(() => {
    const out: Placed[] = [];
    let leafY = 0;
    const colW = 210;
    const rowH = 30;
    const walk = (n: MindNode, path: string, depth: number, parent?: Placed): Placed => {
      const p: Placed = { node: n, path, depth, x: 20 + depth * colW, y: 0, parent };
      out.push(p);
      const kids = collapsed.has(path) ? [] : n.children ?? [];
      if (!kids.length) {
        p.y = 20 + leafY * rowH;
        leafY++;
      } else {
        const ys = kids.map((c, i) => walk(c, `${path}/${i}`, depth + 1, p).y);
        p.y = (Math.min(...ys) + Math.max(...ys)) / 2;
      }
      return p;
    };
    walk(root, '0', 0);
    const maxDepth = Math.max(...out.map((p) => p.depth));
    return { placed: out, height: 40 + leafY * rowH, width: 60 + (maxDepth + 1) * colW };
  }, [root, collapsed]);
  const branchColor = (p: Placed) => {
    let q = p;
    while (q.parent && q.parent.depth > 0) q = q.parent;
    const idx = Number(q.path.split('/')[1] ?? 0);
    return COLORS[idx % COLORS.length];
  };
  const toggle = (path: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(path)) n.delete(path);
      else n.add(path);
      return n;
    });
  return (
    <div className="scroll-x mind">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: Math.max(width, 320), maxWidth: '100%', minWidth: Math.min(width, 900), height: 'auto' }}>
        {placed.filter((p) => p.parent).map((p) => {
          const a = p.parent!;
          const mx = (a.x + 150 + p.x) / 2;
          return <path key={`e${p.path}`} d={`M ${a.x + 150} ${a.y} C ${mx} ${a.y}, ${mx} ${p.y}, ${p.x} ${p.y}`} fill="none" stroke={branchColor(p)} strokeWidth={2} opacity={0.7} />;
        })}
        {placed.map((p) => {
          const hasKids = !!p.node.children?.length;
          const c = p.depth === 0 ? 'var(--accent)' : branchColor(p);
          return (
            <g key={p.path} transform={`translate(${p.x},${p.y})`} onClick={() => hasKids && toggle(p.path)} style={{ cursor: hasKids ? 'pointer' : 'default' }}>
              <rect x={0} y={-12} width={150} height={24} rx={12} fill={p.depth === 0 ? c : 'var(--bg-elev)'} stroke={c} strokeWidth={1.5} />
              <text x={10} y={4} fontSize={p.depth === 0 ? 12.5 : 11.5} fontWeight={p.depth <= 1 ? 700 : 500} style={{ fill: p.depth === 0 ? '#fff' : undefined }}>
                {p.node.label.length > 24 ? p.node.label.slice(0, 23) + '…' : p.node.label}
                <title>{p.node.label}</title>
              </text>
              {hasKids && <text x={140} y={4} fontSize="11" textAnchor="end" style={{ fill: p.depth === 0 ? '#fff' : c }}>{collapsed.has(p.path) ? '+' : '−'}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
