// Vercel serverless function: stores learner progress in Upstash Redis (Vercel Marketplace).
// GET  /api/progress  -> { progress }
// PUT  /api/progress  { progress } -> { ok: true }
// Auth: HTTP Basic, checked against BIOINFORMATICA_USER / BIOINFORMATICA_PASSWORD
// (defaults admin / admin123). Storage: KV_REST_API_URL + KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).

const USER = process.env.BIOINFORMATICA_USER || 'admin';
const PASS = process.env.BIOINFORMATICA_PASSWORD || 'admin123';
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function authorized(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return null;
  const [user, ...rest] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
  return user === USER && rest.join(':') === PASS ? user : null;
}

async function kv(command) {
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`KV ${r.status}`);
  return (await r.json()).result;
}

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!KV_URL || !KV_TOKEN) {
    res.status(501).json({ error: 'Sync storage not configured (set KV_REST_API_URL and KV_REST_API_TOKEN).' });
    return;
  }
  const user = authorized(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const key = `bioinformatica:progress:${user}`;
  try {
    if (req.method === 'GET') {
      const raw = await kv(['GET', key]);
      res.status(200).json({ progress: raw ? JSON.parse(raw) : null });
    } else if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readBody(req);
      const text = JSON.stringify(body.progress ?? null);
      if (text.length > 900_000) {
        res.status(413).json({ error: 'Progress too large' });
        return;
      }
      await kv(['SET', key, text]);
      res.status(200).json({ ok: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
