import { tmdb, isAdmin, shape } from './_lib.js';

const CATS = {
  hollywood: { lang: 'en', region: 'US' },
  hindi: { lang: 'hi', region: 'IN' },
  tamil: { lang: 'ta', region: 'IN' },
  telugu: { lang: 'te', region: 'IN' },
  malayalam: { lang: 'ml', region: 'IN' },
  kannada: { lang: 'kn', region: 'IN' },
  bengali: { lang: 'bn', region: 'IN' },
  marathi: { lang: 'mr', region: 'IN' },
  punjabi: { lang: 'pa', region: 'IN' }
};

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Wrong password' });
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const q = String(req.query.q || '').trim();

  try {
    let r;
    if (q) {
      r = await tmdb('/search/movie', { query: q, include_adult: 'false', language: 'en-US', page });
    } else {
      const c = CATS[req.query.cat];
      if (!c) return res.status(400).json({ error: 'Unknown category' });
      const now = new Date();
      const years = req.query.years === '5' ? 5 : 3; // default 3 years, optional 5
      const end = new Date(now);
      end.setUTCFullYear(end.getUTCFullYear() + years);
      const back = new Date(now.getTime() - 120 * 864e5);
      const iso = d => d.toISOString().slice(0, 10);
      r = await tmdb('/discover/movie', {
        region: c.region,
        with_original_language: c.lang,
        with_release_type: '2|3',
        'release_date.gte': iso(now),
        'release_date.lte': iso(end),
        // skip old movies re-released in theatres: original release must be recent
        'primary_release_date.gte': iso(back),
        sort_by: 'popularity.desc',
        include_adult: 'false',
        language: 'en-US',
        page
      });
    }
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d.status_message || 'TMDB error' });
    return res.status(200).json({
      results: (d.results || []).map(shape),
      page: d.page || page,
      total_pages: Math.min(d.total_pages || 1, 500)
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
