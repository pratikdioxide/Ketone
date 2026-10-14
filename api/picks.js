import { db, cors } from './_lib.js';

// Public endpoint. Your main site calls this.
// Default: upcoming picks only. ?all=1 includes already released ones.
export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const sql = db();
    const all = req.query.all === '1';
    const rows = all
      ? await sql`SELECT data FROM picks ORDER BY release_date ASC NULLS LAST, id`
      : await sql`SELECT data FROM picks
                  WHERE release_date IS NULL OR release_date >= CURRENT_DATE
                  ORDER BY release_date ASC NULLS LAST, id`;
    res.setHeader('Cache-Control', all ? 'no-store' : 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ results: rows.map(r => r.data) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
