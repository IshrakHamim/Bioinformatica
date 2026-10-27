import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import 'katex/dist/katex.min.css';
import { Fragment, createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { WIDGETS } from '../widgets/registry';
import { YouTube } from '../components/YouTube';
import { GameCard } from '../components/GameCard';
import { GAME_BY_ID } from '../games/registry';
import { MODULE_BY_ID, VIDEO_BY_ID, localizedSections, sectionsOf } from '../data';
import { useLang } from './prefs';
import type { Module } from '../data/types';

const marked = new Marked();
marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
marked.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:/.test(href);
      return `<a href="${href}"${title ? ` title="${title}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },
  },
});

const CALLOUT_ICONS: Record<string, string> = {
  tip: '💡', bio: '🧬', cs: '💻', warn: '⚠️', exam: '🎯', example: '✍️', sota: '🚀', story: '📖', think: '🤔',
};

/**
 * :::type Title ... ::: blocks become styled callouts (rendered recursively).
 * `:::think Question` is collapsible: the question shows, the body (the answer) opens on click.
 */
function renderMd(src: string): string {
  const out: string[] = [];
  const lines = src.split('\n');
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) out.push(marked.parse(buf.join('\n')) as string);
    buf = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^:::(\w+)\s*(.*)$/);
    if (m) {
      flush();
      const inner: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') inner.push(lines[i++]);
      const [, type, title] = m;
      if (type === 'think') {
        out.push(
          `<details class="callout think"><summary class="callout-title">${CALLOUT_ICONS.think} ${marked.parseInline(title)}</summary>${marked.parse(inner.join('\n'))}</details>`,
        );
        continue;
      }
      out.push(
        `<div class="callout ${type}">${title ? `<div class="callout-title">${CALLOUT_ICONS[type] ?? ''} ${title}</div>` : ''}${marked.parse(inner.join('\n'))}</div>`,
      );
    } else buf.push(lines[i]);
  }
  flush();
  return out.join('\n');
}

/** The module whose lesson is being rendered, so videos use that module's own description. */
export const LessonModule = createContext<Module | null>(null);

/** A lesson video placed at the point in the text where it helps (metadata comes from the module's `videos`). */
function LessonVideo({ id }: { id: string }) {
  const m = useContext(LessonModule);
  const v = m?.videos.find((x) => x.id === id) ?? VIDEO_BY_ID[id];
  if (!v) return <div className="callout warn">Unknown video: {id}</div>;
  return (
    <div className="lesson-video">
      {v.why && <div className="lesson-video-why">🎬 {v.why}</div>}
      <YouTube id={v.id} title={v.title} channel={v.channel} />
    </div>
  );
}

/** Parse "math#probability-basics|algo#dynamic-programming" into resolvable section refs. */
export function parseRefs(spec: string) {
  return spec.split('|').map((t) => {
    const [mod, sec] = t.trim().split('#');
    const m = MODULE_BY_ID[mod];
    const s = m && sectionsOf(m).find((x) => x.id === sec);
    return { key: t.trim(), mod, sec, m, s };
  });
}

/** "Need a refresher?" chips that open a foundation section inline, without leaving the lesson. */
function Refresher({ spec }: { spec: string }) {
  const refs = useMemo(() => parseRefs(spec), [spec]);
  const [open, setOpen] = useState<string | null>(null);
  const [lang] = useLang();
  const cur = refs.find((r) => r.key === open);
  const curSec = cur?.m && cur.s ? localizedSections(cur.m, lang).secs.find((x) => x.id === cur.s!.id) ?? cur.s : null;
  return (
    <div className="refresher">
      <div className="refresher-row">
        <span className="refresher-label">🧱 {lang === 'bn' ? 'আটকে গেছেন? ঝালিয়ে নিন:' : 'Stuck? Quick refresher:'}</span>
        {refs.map((r) =>
          r.m && r.s ? (
            <button key={r.key} className={`refresher-chip ${open === r.key ? 'on' : ''}`} aria-expanded={open === r.key} onClick={() => setOpen(open === r.key ? null : r.key)}>
              {r.s.title} <span className="muted">· {r.m.code}</span>
            </button>
          ) : (
            <span key={r.key} className="refresher-chip">Unknown section: {r.key}</span>
          ),
        )}
      </div>
      {cur?.m && curSec && (
        <div className="refresher-panel fade-in">
          <div className="spread small">
            <b>{cur.m.code} {cur.m.title} › {curSec.title}</b>
            <span className="row">
              <Link to={`/m/${cur.m.id}?tab=learn&s=${curSec.id}`}>{lang === 'bn' ? 'পুরো লেসন খুলুন →' : 'Open the full lesson →'}</Link>
              <button className="btn small" onClick={() => setOpen(null)}>Close</button>
            </span>
          </div>
          <LessonModule.Provider value={cur.m}>
            <Markdown source={curSec.body} />
          </LessonModule.Provider>
        </div>
      )}
    </div>
  );
}

/**
 * Markdown with embedded block directives, one per line:
 * `{{widget:name key="value"}}`, `{{game:id}}`, `{{video:ID}}` (looked up in the module videos),
 * `{{yt:ID|Title}}` (ad-hoc video) and `{{ref:module#section|...}}` (inline refreshers).
 */
export function Markdown({ source }: { source: string }) {
  const parts = useMemo(() => {
    const chunks: ReactNode[] = [];
    let buf: string[] = [];
    let n = 0;
    const flush = () => {
      if (buf.length) chunks.push(<div key={n++} dangerouslySetInnerHTML={{ __html: renderMd(buf.join('\n')) }} />);
      buf = [];
    };
    for (const line of source.split('\n')) {
      const w = line.match(/^\{\{widget:([\w-]+)(.*)\}\}\s*$/);
      const y = line.match(/^\{\{yt:([\w-]{11})\|(.*)\}\}\s*$/);
      const v = line.match(/^\{\{video:([\w-]{11})\}\}\s*$/);
      const r = line.match(/^\{\{ref:(.+)\}\}\s*$/);
      const g = line.match(/^\{\{game:([\w-]+)\}\}\s*$/);
      if (w) {
        flush();
        const props: Record<string, string> = {};
        for (const kv of w[2].matchAll(/(\w+)="([^"]*)"/g)) props[kv[1]] = kv[2];
        const W = WIDGETS[w[1]];
        chunks.push(W ? <W key={n++} {...props} /> : <div key={n++} className="callout warn">Unknown widget: {w[1]}</div>);
      } else if (g) {
        flush();
        const G = GAME_BY_ID[g[1]];
        chunks.push(G ? <GameCard key={n++} game={G} /> : <div key={n++} className="callout warn">Unknown game: {g[1]}</div>);
      } else if (v) {
        flush();
        chunks.push(<LessonVideo key={n++} id={v[1]} />);
      } else if (r) {
        flush();
        chunks.push(<Refresher key={n++} spec={r[1]} />);
      } else if (y) {
        flush();
        chunks.push(<YouTube key={n++} id={y[1]} title={y[2]} />);
      } else buf.push(line);
    }
    flush();
    return chunks;
  }, [source]);
  return <div className="prose">{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</div>;
}

export function InlineMd({ text }: { text: string }) {
  const html = useMemo(() => marked.parseInline(text) as string, [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function BlockMd({ text }: { text: string }) {
  const html = useMemo(() => renderMd(text), [text]);
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
