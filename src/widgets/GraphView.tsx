import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from 'd3-force';
import { useMemo } from 'react';

export interface GNode {
  id: string;
  label?: string;
  color?: string;
  r?: number;
  ring?: string;
}
export interface GEdge {
  from: string;
  to: string;
  label?: string;
  color?: string;
  width?: number;
  dashed?: boolean;
  key?: string | number;
}

type SimNode = SimulationNodeDatum & { id: string };

/** Deterministic force layout computed once per graph shape. */
export function useLayout(nodes: GNode[], edges: GEdge[], width: number, height: number, seedKey: string, linkDist = 70) {
  return useMemo(() => {
    const sim: SimNode[] = nodes.map((n, i) => ({
      id: n.id,
      x: width / 2 + Math.cos((2 * Math.PI * i) / nodes.length) * width * 0.35,
      y: height / 2 + Math.sin((2 * Math.PI * i) / nodes.length) * height * 0.35,
    }));
    const links = edges.filter((e) => e.from !== e.to).map((e) => ({ source: e.from, target: e.to }));
    const s = forceSimulation(sim)
      .force('link', forceLink(links).id((d) => (d as SimNode).id).distance(linkDist).strength(0.6))
      .force('charge', forceManyBody().strength(-320))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(28))
      .stop();
    for (let i = 0; i < 300; i++) s.tick();
    const pad = 34;
    const xs = sim.map((n) => n.x!);
    const ys = sim.map((n) => n.y!);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const sx = (width - 2 * pad) / Math.max(maxX - minX, 1);
    const sy = (height - 2 * pad) / Math.max(maxY - minY, 1);
    const sc = Math.min(sx, sy, 1.4);
    const pos: Record<string, { x: number; y: number }> = {};
    for (const n of sim)
      pos[n.id] = {
        x: width / 2 + (n.x! - (minX + maxX) / 2) * sc,
        y: height / 2 + (n.y! - (minY + maxY) / 2) * sc,
      };
    return pos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey, width, height]);
}

export function GraphView({ nodes, edges, directed = false, width = 620, height = 380, seedKey, onNodeClick, onEdgeClick, linkDist }: {
  nodes: GNode[];
  edges: GEdge[];
  directed?: boolean;
  width?: number;
  height?: number;
  seedKey: string;
  onNodeClick?: (id: string) => void;
  onEdgeClick?: (e: GEdge, index: number) => void;
  linkDist?: number;
}) {
  const pos = useLayout(nodes, edges, width, height, seedKey, linkDist);
  // count parallel edges to curve them apart
  const pairCount: Record<string, number> = {};
  const pairSeen: Record<string, number> = {};
  for (const e of edges) {
    const k = [e.from, e.to].sort().join('→');
    pairCount[k] = (pairCount[k] ?? 0) + 1;
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', background: 'var(--bg-sunk)', borderRadius: 10 }}>
      <defs>
        {['var(--text-dim)', 'var(--accent)', 'var(--danger)', 'var(--accent-2)'].map((c, i) => (
          <marker key={i} id={`arrow${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
          </marker>
        ))}
      </defs>
      {edges.map((e, i) => {
        const a = pos[e.from];
        const b = pos[e.to];
        if (!a || !b) return null;
        const color = e.color ?? 'var(--text-dim)';
        const mi = ['var(--text-dim)', 'var(--accent)', 'var(--danger)', 'var(--accent-2)'].indexOf(color);
        const marker = directed ? `url(#arrow${mi < 0 ? 0 : mi})` : undefined;
        const rA = nodes.find((n) => n.id === e.from)?.r ?? 18;
        const rB = nodes.find((n) => n.id === e.to)?.r ?? 18;
        if (e.from === e.to) {
          const d = `M ${a.x - 8} ${a.y - rA} C ${a.x - 40} ${a.y - 70}, ${a.x + 40} ${a.y - 70}, ${a.x + 8} ${a.y - rA}`;
          return (
            <g key={e.key ?? i} onClick={() => onEdgeClick?.(e, i)} style={{ cursor: onEdgeClick ? 'pointer' : undefined }}>
              <path d={d} fill="none" stroke={color} strokeWidth={e.width ?? 1.8} markerEnd={marker} />
              {e.label && <text x={a.x} y={a.y - 58} fontSize="11" textAnchor="middle" fontFamily="var(--mono)">{e.label}</text>}
            </g>
          );
        }
        const k = [e.from, e.to].sort().join('→');
        const idx = (pairSeen[k] = (pairSeen[k] ?? 0) + 1);
        const total = pairCount[k];
        const dir = e.from < e.to ? 1 : -1;
        const bend = total > 1 || edges.some((o) => o.from === e.to && o.to === e.from) ? (idx - (total + 1) / 2 + 0.5) * 34 * dir : 0;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const cx = (a.x + b.x) / 2 + nx * bend;
        const cy = (a.y + b.y) / 2 + ny * bend;
        // shorten to node borders along the curve's end tangents
        const ua = Math.hypot(cx - a.x, cy - a.y) || 1;
        const ub = Math.hypot(cx - b.x, cy - b.y) || 1;
        const sx = a.x + ((cx - a.x) / ua) * rA;
        const sy = a.y + ((cy - a.y) / ua) * rA;
        const ex = b.x + ((cx - b.x) / ub) * (rB + 2);
        const ey = b.y + ((cy - b.y) / ub) * (rB + 2);
        return (
          <g key={e.key ?? i} onClick={() => onEdgeClick?.(e, i)} style={{ cursor: onEdgeClick ? 'pointer' : undefined }}>
            {onEdgeClick && <path d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`} fill="none" stroke="transparent" strokeWidth={16} />}
            <path d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`} fill="none" stroke={color} strokeWidth={e.width ?? 1.8} strokeDasharray={e.dashed ? '5 4' : undefined} markerEnd={marker} />
            {e.label && (
              <text x={cx} y={cy - 4} fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)" style={{ paintOrder: 'stroke', stroke: 'var(--bg-sunk)', strokeWidth: 3 }}>
                {e.label}
              </text>
            )}
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = pos[n.id];
        if (!p) return null;
        const r = n.r ?? 18;
        return (
          <g key={n.id} transform={`translate(${p.x},${p.y})`} onClick={() => onNodeClick?.(n.id)} style={{ cursor: onNodeClick ? 'pointer' : undefined }}>
            <circle r={r} fill={n.color ?? 'var(--bg-elev)'} stroke={n.ring ?? 'var(--accent-2)'} strokeWidth={2} />
            <text textAnchor="middle" dy="4" fontSize={r < 16 ? 10 : 11.5} fontFamily="var(--mono)" fontWeight={600}>
              {n.label ?? n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
