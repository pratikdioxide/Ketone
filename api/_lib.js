const RU = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const RT = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export async function redis(cmd) {
  if (!RU || !RT) throw new Error('Redis is not connected. Missing env vars.');
  const r = await fetch(RU, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || 'Redis error');
  return d.result;
}

export function tmdb(path, params = {}) {
  const key = process.env.TMDB_API_KEY;
  const token = process.env.TMDB_TOKEN;
  if (!key && !token) throw new Error('Missing TMDB_API_KEY or TMDB_TOKEN env var');
  const qs = new URLSearchParams(params);
  if (!token) qs.set('api_key', key);
  return fetch(`https://api.themoviedb.org/3${path}?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function isAdmin(req) {
  const p = process.env.ADMIN_PASSWORD;
  return Boolean(p) && req.headers['x-admin-password'] === p;
}

// ALLOWED_ORIGIN: comma-separated site URLs, or * (default)
export function cors(req, res) {
  const allow = (process.env.ALLOWED_ORIGIN || '*').split(',').map(s => s.trim());
  const o = req.headers.origin;
  if (allow.includes('*')) res.setHeader('Access-Control-Allow-Origin', '*');
  else if (o && allow.includes(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const IMG = 'https://image.tmdb.org/t/p/';
export function shape(m) {
  return {
    id: m.id,
    title: m.title,
    overview: (m.overview || '').slice(0, 300),
    poster: m.poster_path ? IMG + 'w500' + m.poster_path : null,
    backdrop: m.backdrop_path ? IMG + 'w780' + m.backdrop_path : null,
    release_date: m.release_date || null,
    language: m.original_language,
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
    url: `https://www.themoviedb.org/movie/${m.id}`
  };
}
