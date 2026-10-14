# Ketone

Admin site to pick upcoming movies (Hollywood and Indian) from TMDB and publish them through a small API. Your main website calls that API and shows only the picked movies.

Live: https://ketonex.vercel.app

## Stack

- Frontend: plain HTML, CSS and vanilla JavaScript (no framework, no build step)
- Backend: Vercel Serverless Functions (Node.js, ES modules)
- Database: Neon Postgres
- Data source: TMDB API

## Structure

```
ketone/
  index.html            public page: picked upcoming movies only
  admin.html            admin UI at /admin (login, tabs, search, infinite scroll, pick)
  vercel.json           routes /admin to admin.html
  favicon.svg           logo
  package.json          required (ES modules + Neon driver)
  schema.sql            run once in Neon
  api/
    _lib.js             db, TMDB helper, auth, CORS
    browse.js           browse and search TMDB (admin only)
    admin.js            add and remove picks (admin only)
    picks.js            public API for your main site
```

## How it works

1. Open `/admin` and sign in with the admin password.
2. Browse tabs (Hollywood, Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi, Punjabi) or search any title.
3. Tap a poster to pick it. The movie details are saved in Neon.
4. Tap again to unpick. The row is deleted from the database.
5. Your main site calls `/api/picks` and shows the result.

## API

`GET /api/picks` (public)
- Returns upcoming picks only (release date today or later), sorted by date.
- Cached about 60 seconds.

`GET /api/picks?all=1`
- Returns every pick, including already released ones. Not cached.

Response:

```json
{
  "results": [
    {
      "id": 1153576,
      "title": "Street Fighter",
      "overview": "...",
      "poster": "https://image.tmdb.org/t/p/w500/...jpg",
      "backdrop": "https://image.tmdb.org/t/p/w780/...jpg",
      "release_date": "2026-10-13",
      "language": "en",
      "rating": 6.5,
      "url": "https://www.themoviedb.org/movie/1153576"
    }
  ]
}
```

`/api/browse` and `/api/admin` require the `x-admin-password` header.

## Environment variables

Set in Vercel, Settings, Environment Variables.

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon connection string (added automatically by the Neon integration) |
| `TMDB_API_KEY` | TMDB v3 API key, or use `TMDB_TOKEN` for the v4 read access token |
| `ADMIN_PASSWORD` | Password for the admin site |
| `ALLOWED_ORIGIN` | Comma-separated sites allowed to call `/api/picks`, no trailing slash. Defaults to `*` |

Example:

```
ALLOWED_ORIGIN=https://piratone.qzz.io,https://piratone.vercel.app,https://piratone.bond
```

Get a TMDB key at https://www.themoviedb.org/settings/api

## Setup

1. Push this folder to a GitHub repo and import it at https://vercel.com/new. Leave the framework preset on "Other" and leave build settings empty.
2. In the Vercel project open Storage, then Create Database, then Neon, and connect it to the project. This adds `DATABASE_URL`.
   - Alternative: create a project at https://neon.tech, copy the connection string, and add it as `DATABASE_URL`.
3. In the Neon SQL Editor, run `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS picks (
  id           integer PRIMARY KEY,
  data         jsonb NOT NULL,
  release_date date,
  added_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS picks_release_date_idx ON picks (release_date);
```

4. Add `TMDB_API_KEY`, `ADMIN_PASSWORD` and `ALLOWED_ORIGIN`.
5. Redeploy so the variables take effect.
6. Open `/admin` on your Ketone URL and sign in. The root URL shows the public picks page.

## Connect the main site

1. Open `main-site/index.html`.
2. Set the URL at the top of the script:

```js
const KETONE_URL = 'https://ketonex.vercel.app';
```

3. Deploy it as your main site's page, or copy the `fetch` block and the grid into your existing site.

The main site needs no TMDB key and no database.

## Notes

- Picks store the movie details at the moment you add them. If TMDB later changes a release date, remove and re-add the movie to refresh it.
- Movies whose release date has passed disappear from `/api/picks` but stay in the database. Use `?all=1` to see them.
- Neon's free database sleeps when idle, so the first request after a quiet period can take a second or two.
- The admin password is checked on the server. It is kept in the browser tab's session storage only while you are signed in.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Database is not connected` | `DATABASE_URL` is missing, or you did not redeploy |
| `relation "picks" does not exist` | Run `schema.sql` in Neon |
| `Wrong password` | Check `ADMIN_PASSWORD` in Vercel and redeploy |
| `Missing TMDB_API_KEY` | Add the TMDB key and redeploy |
| `/api/picks` returns `{"results":[]}` | Nothing picked, or picked movies already released. Try `?all=1` |
| Main site shows a CORS error | Add the main site URL to `ALLOWED_ORIGIN` |
| Newly picked movie not showing | Wait up to a minute for the cache |
