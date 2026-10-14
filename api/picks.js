import { redis, cors } from './_lib.js';

// Public endpoint. Your main site calls this.
// Default: upcoming picks only. ?all=1 includes already released ones.
export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const flat = (await redis(['HGETALL', 'picks'])) || [];
    let list = [];
    for (let i = 0; i < flat.length; i += 2) {
      try { list.push(JSON.parse(flat[i + 1])); } catch {}
    }
    const all = req.query.all === '1';
    if (!all) {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter(m => !m.release_date || m.release_date >= today);
    }
    list.sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'));
    res.setHeader('Cache-Control', all ? 'no-store' : 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ results: list });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
