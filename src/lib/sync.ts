import { getProgress, mergeProgress, replaceProgress, setChangeHook, type Progress } from './progress';

// Cross-device sync. Two interchangeable backends:
//  1. "server": the Vercel serverless route /api/progress (needs a Redis/KV store configured)
//  2. "gist":   a private GitHub Gist, using a token the learner pastes once per device
// If neither is available, progress stays in this browser and can be exported/imported.

export type SyncMode = 'server' | 'gist' | 'local';
export interface SyncStatus {
  mode: SyncMode;
  state: 'idle' | 'syncing' | 'ok' | 'error';
  message: string;
  at?: number;
}

const GIST_CFG = 'bioinformatica.gist';
const GIST_FILE = 'bioinformatica-progress.json';

let status: SyncStatus = { mode: 'local', state: 'idle', message: 'Saved in this browser only' };
const listeners = new Set<(s: SyncStatus) => void>();
const setStatus = (s: Partial<SyncStatus>) => {
  status = { ...status, ...s };
  listeners.forEach((l) => l(status));
};
export const getSyncStatus = () => status;
export function onSyncStatus(fn: (s: SyncStatus) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export interface GistConfig {
  token: string;
  gistId?: string;
}
export function getGistConfig(): GistConfig | null {
  try {
    const raw = localStorage.getItem(GIST_CFG);
    return raw ? (JSON.parse(raw) as GistConfig) : null;
  } catch {
    return null;
  }
}
export function setGistConfig(cfg: GistConfig | null) {
  try {
    if (cfg) localStorage.setItem(GIST_CFG, JSON.stringify(cfg));
    else localStorage.removeItem(GIST_CFG);
  } catch {
    /* ignore */
  }
}

let authToken = '';

async function serverPull(): Promise<Progress | null | 'unavailable'> {
  if (!authToken) return 'unavailable'; // the server needs an account; none until accounts return
  if (location.hostname.endsWith('github.io')) return 'unavailable'; // static hosting: no API routes
  try {
    const r = await fetch('api/progress', { headers: { Authorization: `Basic ${authToken}` } });
    if (r.status === 404 || r.status === 501 || r.status === 405) return 'unavailable';
    if (!r.ok) throw new Error(`server ${r.status}`);
    const ct = r.headers.get('content-type') ?? '';
    if (!ct.includes('json')) return 'unavailable'; // static host returned index.html
    const body = await r.json();
    return (body?.progress as Progress) ?? null;
  } catch {
    return 'unavailable';
  }
}

async function serverPush(p: Progress) {
  const r = await fetch('api/progress', {
    method: 'PUT',
    headers: { Authorization: `Basic ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress: p }),
  });
  if (!r.ok) throw new Error(`server ${r.status}`);
}

async function gistPull(cfg: GistConfig): Promise<Progress | null> {
  const h = { Authorization: `Bearer ${cfg.token}`, Accept: 'application/vnd.github+json' };
  if (!cfg.gistId) {
    // look for an existing progress gist so a second device finds the first one's data
    const r = await fetch('https://api.github.com/gists?per_page=100', { headers: h });
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    const list = (await r.json()) as { id: string; files: Record<string, unknown> }[];
    const found = list.find((g) => GIST_FILE in g.files);
    if (!found) return null;
    cfg.gistId = found.id;
    setGistConfig(cfg);
  }
  const r = await fetch(`https://api.github.com/gists/${cfg.gistId}`, { headers: h });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const g = await r.json();
  const content = g.files?.[GIST_FILE]?.content;
  return content ? (JSON.parse(content) as Progress) : null;
}

async function gistPush(cfg: GistConfig, p: Progress) {
  const h = { Authorization: `Bearer ${cfg.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
  const files = { [GIST_FILE]: { content: JSON.stringify(p) } };
  if (!cfg.gistId) {
    const r = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ description: 'Bioinformatica learning progress', public: false, files }),
    });
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    cfg.gistId = (await r.json()).id;
    setGistConfig(cfg);
  } else {
    const r = await fetch(`https://api.github.com/gists/${cfg.gistId}`, { method: 'PATCH', headers: h, body: JSON.stringify({ files }) });
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;

async function push() {
  const p = getProgress();
  setStatus({ state: 'syncing', message: 'Saving…' });
  try {
    if (status.mode === 'server') await serverPush(p);
    else if (status.mode === 'gist') await gistPush(getGistConfig()!, p);
    setStatus({ state: 'ok', message: status.mode === 'server' ? 'Synced to server' : 'Synced to GitHub Gist', at: Date.now() });
  } catch (e) {
    setStatus({ state: 'error', message: `Sync failed: ${(e as Error).message}. Progress is still saved locally.` });
  }
}

/** Pull remote progress, merge it with local, and push the merged result. */
export async function startSync(token = '') {
  authToken = token;
  setChangeHook(null);
  const gist = getGistConfig();
  setStatus({ state: 'syncing', message: 'Connecting…' });
  try {
    let remote: Progress | null = null;
    const server = await serverPull();
    if (server !== 'unavailable') {
      setStatus({ mode: 'server' });
      remote = server;
    } else if (gist?.token) {
      setStatus({ mode: 'gist' });
      remote = await gistPull(gist);
    } else {
      setStatus({ mode: 'local', state: 'idle', message: 'Saved in this browser only. Set up sync in Settings to use other devices.' });
      return;
    }
    if (remote) replaceProgress(mergeProgress(getProgress(), remote));
    await push();
    setChangeHook(() => {
      clearTimeout(timer);
      timer = setTimeout(push, 2500);
    });
  } catch (e) {
    setStatus({ mode: 'local', state: 'error', message: `Could not reach sync backend: ${(e as Error).message}` });
  }
}

export function syncNow() {
  clearTimeout(timer);
  return push();
}
