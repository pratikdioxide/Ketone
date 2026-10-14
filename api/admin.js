import { redis, tmdb, isAdmin, shape } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'Wrong password' });

  const { action, id } = req.body || {};
  if (action === 'check') return res.status(200).json({ ok: true });

  const movieId = parseInt(id, 10);
  if (!movieId) return res.status(400).json({ error: 'Invalid id' });

  try {
    if (action === 'add') {
      const r = await tmdb(`/movie/${movieId}`, { language: 'en-US' });
      if (!r.ok) return res.status(404).json({ error: 'Movie not found on TMDB' });
      const movie = shape(await r.json());
      await redis(['HSET', 'picks', String(movieId), JSON.stringify(movie)]);
      return res.status(200).json({ ok: true, movie });
    }
    if (action === 'remove') {
      await redis(['HDEL', 'picks', String(movieId)]);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
