import { getProgress, mergeProgress, replaceProgress, setChangeHook, type Progress } from './progress';

// Server sync through the Vercel route /api/progress (Upstash Redis). It needs an account, so it
// stays dormant until accounts return; without a token, progress lives only in this browser.

let authToken = '';
let timer: ReturnType<typeof setTimeout> | undefined;

async function serverPull(): Promise<Progress | null | 'unavailable'> {
  if (!authToken) return 'unavailable';
  if (location.hostname.endsWith('github.io')) return 'unavailable'; // static hosting: no API routes
  try {
    const r = await fetch('api/progress', { headers: { Authorization: `Basic ${authToken}` } });
    if (!r.ok) return 'unavailable';
    if (!(r.headers.get('content-type') ?? '').includes('json')) return 'unavailable'; // static host returned index.html
    const body = await r.json();
    return (body?.progress as Progress) ?? null;
  } catch {
    return 'unavailable';
  }
}

async function push() {
  try {
    await fetch('api/progress', {
      method: 'PUT',
      headers: { Authorization: `Basic ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: getProgress() }),
    });
  } catch {
    /* progress is still saved locally */
  }
}

/** Pull remote progress, merge it with local, and push changes from then on. */
export async function startSync(token = '') {
  authToken = token;
  setChangeHook(null);
  const remote = await serverPull();
  if (remote === 'unavailable') return;
  if (remote) replaceProgress(mergeProgress(getProgress(), remote));
  await push();
  setChangeHook(() => {
    clearTimeout(timer);
    timer = setTimeout(push, 2500);
  });
}
