import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Widget({ title, icon = '🧪', children, actions }: { title: string; icon?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="widget fade-in">
      <div className="widget-head">
        <div className="widget-title">
          <span>{icon}</span> {title}
        </div>
        <div className="row">{actions}</div>
      </div>
      <div className="widget-body">{children}</div>
    </div>
  );
}

export function Seq({ s, marks, className }: { s: string; marks?: Record<number, string>; className?: string }) {
  return (
    <span className={`seq ${className ?? ''}`}>
      {s.split('').map((c, i) => (
        <span key={i} className={`nt-${c} ${marks?.[i] ?? ''}`}>
          {c}
        </span>
      ))}
    </span>
  );
}

/** Highlight [start, start+len) ranges in a sequence. */
export function rangesToMarks(ranges: { start: number; len: number; cls: string }[]): Record<number, string> {
  const m: Record<number, string> = {};
  for (const r of ranges) for (let i = r.start; i < r.start + r.len; i++) m[i] = m[i] ? `${m[i]} ${r.cls}` : r.cls;
  return m;
}

export function Slider({ label, value, min, max, step = 1, onChange, fmt }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="field" style={{ minWidth: 150 }}>
      <span>
        {label}: <b style={{ color: 'var(--text)' }}>{fmt ? fmt(value) : value}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function NumField({ label, value, onChange, step = 1, width = 80 }: { label: string; value: number; onChange: (v: number) => void; step?: number; width?: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step={step} style={{ width }} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function TextField({ label, value, onChange, width = 260, mono = true }: { label: string; value: string; onChange: (v: string) => void; width?: number | string; mono?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className={mono ? 'mono' : ''} value={value} style={{ width }} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** Step controls: prev / play / next / reset over [0, max]. */
export function Stepper({ step, max, setStep, speed = 700, label }: { step: number; max: number; setStep: (n: number | ((n: number) => number)) => void; speed?: number; label?: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (!playing) return;
    ref.current = setInterval(() => {
      setStep((s: number) => {
        if (s >= max) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, speed);
    return () => clearInterval(ref.current);
  }, [playing, max, speed, setStep]);
  return (
    <div className="row" style={{ margin: '8px 0' }}>
      <button className="btn small" onClick={() => setStep(0)} title="Reset">⏮</button>
      <button className="btn small" onClick={() => setStep((s: number) => Math.max(0, s - 1))} disabled={step <= 0}>◀ Prev</button>
      <button className="btn small primary" onClick={() => setPlaying((p) => !p)}>{playing ? '⏸ Pause' : '▶ Play'}</button>
      <button className="btn small" onClick={() => setStep((s: number) => Math.min(max, s + 1))} disabled={step >= max}>Next ▶</button>
      <button className="btn small" onClick={() => setStep(max)} title="Jump to end">⏭</button>
      <span className="small muted">
        Step {step} / {max} {label}
      </span>
    </div>
  );
}

export const fmt = (x: number, d = 3) => (Number.isInteger(x) ? String(x) : x.toFixed(d));

export function Matrix({ rows, cols, data, cellClass, format = (v) => fmt(v as number) }: { rows: string[]; cols: string[]; data: (number | string)[][]; cellClass?: (i: number, j: number) => string; format?: (v: number | string) => string }) {
  return (
    <div className="scroll-x">
      <table className="mtable">
        <thead>
          <tr>
            <th />
            {cols.map((c, j) => (
              <th key={j}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <th>{rows[i]}</th>
              {r.map((v, j) => (
                <td key={j} className={cellClass?.(i, j) ?? ''}>
                  {typeof v === 'number' ? format(v) : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const PALETTE = ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#f59f00', '#0ca678', '#d6336c', '#495057'];

/** Minimal responsive SVG line chart. */
export function LineChart({ series, height = 220, xLabel, yLabel, markers, xs }: { series: { name: string; values: number[]; color?: string }[]; height?: number; xLabel?: string; yLabel?: string; markers?: { x: number; label: string }[]; xs?: number[] }) {
  const W = 640;
  const H = height;
  const pad = { l: 46, r: 12, t: 12, b: 34 };
  const n = Math.max(...series.map((s) => s.values.length));
  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const xv = (i: number) => (xs ? xs[i] : i);
  const x0 = xv(0);
  const x1 = xv(n - 1) || 1;
  const X = (i: number) => pad.l + ((xv(i) - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = lo + ((hi - lo) * i) / ticks;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} stroke="var(--border)" />
            <text x={pad.l - 6} y={Y(v) + 4} fontSize="11" textAnchor="end" className="dim">
              {fmt(v, Math.abs(hi - lo) < 5 ? 2 : 0)}
            </text>
          </g>
        );
      })}
      {lo < 0 && hi > 0 && <line x1={pad.l} x2={W - pad.r} y1={Y(0)} y2={Y(0)} stroke="var(--text-dim)" strokeDasharray="4 3" />}
      {series.map((s, si) => (
        <polyline
          key={si}
          fill="none"
          stroke={s.color ?? PALETTE[si % PALETTE.length]}
          strokeWidth={2}
          points={s.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}
        />
      ))}
      {markers?.map((m, i) => (
        <g key={i}>
          <line x1={X(m.x)} x2={X(m.x)} y1={pad.t} y2={H - pad.b} stroke="var(--danger)" strokeDasharray="3 3" />
          <text x={X(m.x) + 4} y={pad.t + 12 + i * 14} fontSize="11" style={{ fill: 'var(--danger)' }}>
            {m.label}
          </text>
        </g>
      ))}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="12" className="dim">
        {xLabel}
      </text>
      <text x={12} y={H / 2} textAnchor="middle" fontSize="12" className="dim" transform={`rotate(-90 12 ${H / 2})`}>
        {yLabel}
      </text>
      {series.length > 1 &&
        series.map((s, si) => (
          <g key={si} transform={`translate(${pad.l + 10 + si * 130}, ${pad.t + 4})`}>
            <rect width="10" height="10" fill={s.color ?? PALETTE[si % PALETTE.length]} rx="2" />
            <text x="14" y="9" fontSize="11">
              {s.name}
            </text>
          </g>
        ))}
    </svg>
  );
}

export function Bars({ labels, values, height = 180, color = 'var(--accent-2)', highlight, fmtV = (v: number) => fmt(v, 2) }: { labels: string[]; values: number[]; height?: number; color?: string; highlight?: number; fmtV?: (v: number) => string }) {
  const W = Math.max(320, labels.length * 34);
  const H = height;
  const max = Math.max(...values, 1e-9);
  const bw = (W - 20) / labels.length;
  return (
    <div className="scroll-x">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: Math.min(W, 700), height: 'auto' }}>
        {values.map((v, i) => {
          const h = (v / max) * (H - 44);
          return (
            <g key={i} transform={`translate(${10 + i * bw}, 0)`}>
              <rect x={3} y={H - 28 - h} width={bw - 6} height={h} rx={3} fill={i === highlight ? 'var(--danger)' : color} />
              <text x={bw / 2} y={H - 30 - h - 3} fontSize="10" textAnchor="middle" className="dim">
                {fmtV(v)}
              </text>
              <text x={bw / 2} y={H - 12} fontSize="10" textAnchor="middle" fontFamily="var(--mono)">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** 2D scatter plot in data coordinates with optional click handler. */
export function Scatter({ points, colors, centers, width = 520, height = 360, domain, onClick, extra, radius = 5 }: {
  points: number[][];
  colors?: string[];
  centers?: { p: number[]; color: string }[];
  width?: number;
  height?: number;
  domain?: [number, number, number, number];
  onClick?: (x: number, y: number) => void;
  extra?: (X: (x: number) => number, Y: (y: number) => number) => ReactNode;
  radius?: number;
}) {
  const xsAll = [...points.map((p) => p[0]), ...(centers?.map((c) => c.p[0]) ?? [])];
  const ysAll = [...points.map((p) => p[1]), ...(centers?.map((c) => c.p[1]) ?? [])];
  const [x0, x1, y0, y1] = domain ?? [Math.min(...xsAll, 0) - 1, Math.max(...xsAll, 1) + 1, Math.min(...ysAll, 0) - 1, Math.max(...ysAll, 1) + 1];
  const X = (x: number) => 10 + ((x - x0) / (x1 - x0)) * (width - 20);
  const Y = (y: number) => height - 10 - ((y - y0) / (y1 - y0)) * (height - 20);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', background: 'var(--bg-sunk)', borderRadius: 10, cursor: onClick ? 'crosshair' : 'default', touchAction: 'manipulation' }}
      onClick={(e) => {
        if (!onClick) return;
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * width;
        const py = ((e.clientY - r.top) / r.height) * height;
        onClick(x0 + ((px - 10) / (width - 20)) * (x1 - x0), y0 + ((height - 10 - py) / (height - 20)) * (y1 - y0));
      }}
    >
      {extra?.(X, Y)}
      {points.map((p, i) => (
        <circle key={i} cx={X(p[0])} cy={Y(p[1])} r={radius} fill={colors?.[i] ?? 'var(--accent-2)'} stroke="var(--bg-elev)" strokeWidth={1} />
      ))}
      {centers?.map((c, i) => (
        <g key={i} transform={`translate(${X(c.p[0])},${Y(c.p[1])})`}>
          <path d="M-9,-9 L9,9 M-9,9 L9,-9" stroke="var(--bg-elev)" strokeWidth={6} />
          <path d="M-9,-9 L9,9 M-9,9 L9,-9" stroke={c.color} strokeWidth={3.5} />
        </g>
      ))}
    </svg>
  );
}
