export type TrackId = 'foundations' | 'cse443' | 'frontiers' | 'biotech';

export interface Video {
  id: string; // YouTube id (verified to exist)
  title: string;
  channel: string;
  why?: string;
}

export interface Article {
  title: string;
  url: string;
  source: string;
  why?: string;
}

export type Question =
  | { id: string; type: 'mcq'; q: string; options: string[]; answer: number; explain: string; exam?: boolean }
  | { id: string; type: 'tf'; q: string; answer: boolean; explain: string; exam?: boolean }
  | { id: string; type: 'num'; q: string; answer: number; tol?: number; explain: string; exam?: boolean };

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface MindNode {
  label: string;
  children?: MindNode[];
}

export interface Practice {
  id: string;
  title: string;
  source?: string; // e.g. "Mid exam style", "Quiz 2 style"
  exam: 'mid' | 'final' | 'both';
  marks?: number;
  prompt: string; // markdown
  solution: string; // markdown, may include widgets
}

export interface Module {
  id: string;
  track: TrackId;
  code: string; // e.g. "M02"
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  exam?: 'mid' | 'final';
  hours: number; // estimated study time
  prereqs: string[];
  content: string; // markdown; "## " headings become trackable sections
  videos: Video[];
  articles: Article[];
  rosalind?: { id: string; title: string }[];
  quiz: Question[];
  flashcards: Flashcard[];
  mindmap: MindNode;
  practice: Practice[];
  concepts: string[]; // knowledge-graph concept ids taught here
}

export interface Track {
  id: TrackId;
  title: string;
  blurb: string;
  modules: string[];
}

export interface Concept {
  id: string;
  label: string;
  group: 'bio' | 'cs' | 'math' | 'ml' | 'sota';
  requires: string[];
  module: string;
}

/** Split module markdown into trackable sections at level-2 headings. */
export function splitSections(md: string): { id: string; title: string; body: string }[] {
  const parts = md.split(/^## /m);
  const intro = parts.shift()?.trim();
  const out = parts.map((p) => {
    const nl = p.indexOf('\n');
    const title = p.slice(0, nl).trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return { id, title, body: p.slice(nl + 1) };
  });
  if (intro) out.unshift({ id: 'overview', title: 'Overview', body: intro });
  return out;
}
