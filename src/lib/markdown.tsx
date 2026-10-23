import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import 'katex/dist/katex.min.css';
import { Fragment, useMemo, type ReactNode } from 'react';
import { WIDGETS } from '../widgets/registry';
import { YouTube } from '../components/YouTube';

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
  tip: '💡', bio: '🧬', cs: '💻', warn: '⚠️', exam: '🎯', sota: '🚀',
};

/** :::type Title ... ::: blocks become styled callouts (rendered recursively). */
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
      out.push(
        `<div class="callout ${type}">${title ? `<div class="callout-title">${CALLOUT_ICONS[type] ?? ''} ${title}</div>` : ''}${marked.parse(inner.join('\n'))}</div>`,
      );
    } else buf.push(lines[i]);
  }
  flush();
  return out.join('\n');
}

/** Markdown with embedded `{{widget:name key=value}}` and `{{yt:ID|Title}}` lines. */
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
      if (w) {
        flush();
        const props: Record<string, string> = {};
        for (const kv of w[2].matchAll(/(\w+)="([^"]*)"/g)) props[kv[1]] = kv[2];
        const W = WIDGETS[w[1]];
        chunks.push(W ? <W key={n++} {...props} /> : <div key={n++} className="callout warn">Unknown widget: {w[1]}</div>);
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
