# Portfolio

Next.js 16 site built from the Claude Design “Portfolio Site Final Draft”, with a built-in admin. Posts, companies/roles, projects, and all page copy (home, about, contact, socials) live in Postgres and are edited in the admin at a secret URL you set with `ADMIN_PATH`.

**Full docs: [`docs/`](docs/README.md)** covers architecture, database and migrations, and deploying.

## How content reaches crawlers
- Public pages are statically rendered HTML. DB reads are cached with tags (`src/lib/data.ts`).
- Saving in admin calls `updateTag(...)`, so the next request regenerates the affected pages, `/sitemap.xml`, `/blog/rss.xml` and `/sitemap`. No redeploy is needed.
- Every post gets a canonical URL, Open Graph/Twitter tags, a generated social card, `BlogPosting` + breadcrumb JSON-LD, and a sitemap entry with `lastmod`.
- Pages: `/`, `/blog` (Writing), `/blog/<slug>`, `/work`, `/about`, `/contact`, `/sitemap`. Notes use `/notes/<slug>`. Old `/projects`, `/notes` and `/feed.xml` 308-redirect. Don't change a slug after publishing.

## Deploy on Vercel (free tier)
1. Push this repo to GitHub and import it in Vercel.
2. In the project, go to **Storage** and add **Neon (Postgres)** and **Blob**. This injects `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`.
3. Under **Settings → Environment Variables**, add `ADMIN_PATH` (e.g. `/studio-$(openssl rand -hex 4)`), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` (`openssl rand -base64 48`) and `NEXT_PUBLIC_SITE_URL`. Leave the Build Command empty so `vercel-build` runs migrations.
4. Redeploy. The production build runs `drizzle-kit migrate` to create the tables. Then seed starter content once:
   ```sh
   npx vercel link && npx vercel env pull .env
   npm run db:seed
   ```
5. Add your domain in Vercel and submit `https://<domain>/sitemap.xml` in Google Search Console.

## Local dev
A local Postgres runs in podman; `.env` (git-ignored) holds the local DB URL, admin path, admin username and password and session secret. Schema changes: `npm run db:generate` then `npm run db:migrate`. See [docs/database/migrations.md](docs/database/migrations.md).
```sh
podman start portfolio-pg     # first time: podman run -d --name portfolio-pg -e POSTGRES_USER=portfolio \
                              #   -e POSTGRES_PASSWORD=portfolio -e POSTGRES_DB=portfolio -p 5433:5432 postgres:17-alpine
npm run db:migrate && npm run db:seed   # first time only
npm run dev                   # admin at http://localhost:3000$ADMIN_PATH
```
Any non-Neon `DATABASE_URL` uses node-postgres; Neon URLs use the serverless HTTP driver. Without `DATABASE_URL` the site shows seed content, read-only.
`npm run db:studio` opens a DB browser. Image uploads need `BLOB_READ_WRITE_TOKEN` (from Vercel → Storage → Blob).

## Evaluation & Improvement
- **Success metric:** organic search impressions and clicks on `/blog/*` in Google Search Console. The early proxy is the count of sitemap URLs Google reports as indexed.
- **Eval:** after each deploy, check these URLs against `/sitemap.xml` and Search Console URL Inspection:

  | URL | Expected |
  |---|---|
  | migrated article | present, 200, indexed |
  | newly published post | present |
  | edited post | fresh `lastmod` |
  | unpublished draft | absent, 404 |
  | `$ADMIN_PATH` | `noindex` header |
  | `/admin` | 404 |
  | unknown slug | 404 |

  Local run 2026-09-26 (no database connected): the article, 404, admin noindex and sitemap rows passed. The three rows that need a database aren't tested yet.
- **Feedback capture:** contact-form messages land in the admin **Messages** inbox. Search performance comes from Search Console.
- **Review loop:** monthly, review Search Console coverage and indexing errors and update the eval table.
