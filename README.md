# Portfolio

Next.js 16 site built using inspiration from Claude Design ideas, with a built-in admin. Posts, companies/roles, projects, and all page copy (home, about, contact, socials) live in Postgres and are edited in the admin at a secret URL you set with `ADMIN_PATH`.

You can view the deployed site: [grishmakhanal.com.np](https://grishmakhanal.com.np/)

**Full docs: [`docs/`](docs/README.md)** covers architecture, database and migrations, and deploying.

## How content reaches crawlers
- Public pages are statically rendered HTML. DB reads are cached with tags (`src/lib/data.ts`).
- Saving in admin calls `updateTag(...)`, so the next request regenerates the affected pages, `/sitemap.xml`, `/blog/rss.xml` and `/sitemap`. No redeploy is needed.
- Every post gets a canonical URL, Open Graph/Twitter tags, a generated social card, `BlogPosting` + breadcrumb JSON-LD, and a sitemap entry with `lastmod`.
- Pages: `/`, `/blog` (Writing), `/blog/<slug>`, `/work`, `/about`, `/contact`, `/sitemap`. Notes use `/notes/<slug>`. Old `/projects`, `/notes` and `/feed.xml` 308-redirect. Don't change a slug after publishing.

## Deploy (any host)
One Next.js app plus one Postgres database. Nothing is tied to a host.
1. Create a Postgres database (e.g. Netlify → Project → Database) and copy its read-write connection string.
2. Connect the GitHub repo to the host. Build command: `npm run build`.
3. Set env vars (see [docs/deploy/env-vars.md](docs/deploy/env-vars.md)):
   - production only: `DATABASE_URL` and `RUN_MIGRATIONS=true`;
   - production only, so previews have no admin: `ADMIN_PATH`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` (16+ characters) and `SESSION_SECRET` (`openssl rand -base64 48`);
   - `SITE_URL`: your public origin. A production build fails if it's missing, `localhost` or a `netlify.app` host.
4. Deploy. The build applies `drizzle/*.sql`, then builds.
5. Log in at `<site><ADMIN_PATH>` and click **Import starter content** (once).
6. Add your domain, set `SITE_URL` to it, redeploy, and submit `https://<domain>/sitemap.xml` in Google Search Console.

Netlify, step by step: [docs/deploy/netlify.md](docs/deploy/netlify.md).

## Local dev
Local dev uses a real Postgres (the system service, or podman); `.env` (git-ignored) holds the local DB URL, admin path, admin username and password and session secret. Schema changes: `npm run db:generate` then `npm run db:migrate`. See [docs/database/migrations.md](docs/database/migrations.md).
```sh
sudo systemctl start postgresql         # or: podman start portfolio-pg
# first time: create the database (psql -h localhost -U postgres -c 'create database portfolio'),
# set DATABASE_URL in .env, then:
npm run db:migrate && npm run db:seed
npm run dev                   # admin at http://localhost:3000$ADMIN_PATH
```
Any non-Neon `DATABASE_URL` uses node-postgres; Neon URLs use the serverless HTTP driver. Without `DATABASE_URL` the site shows seed content, read-only.
`npm run db:studio` opens a DB browser. Uploaded images are stored in Postgres (`media` table) and served from `/media/<id>`.

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

  Local run 2026-09-30 (local Postgres with `npm run db:sample` data): the article (200, in the sitemap), newly published post and note, edited post (`lastmod` moved to the save time), unpublished draft (absent, 404), `$ADMIN_PATH` noindex and unknown-slug rows passed. "Indexed" needs Search Console, so it's checked after deploy. The `/admin` row can't pass locally while `ADMIN_PATH=/admin`; it applies to production, where the path is secret.
- **Feedback capture:** contact-form messages land in the admin **Messages** inbox. Search performance comes from Search Console.
- **Review loop:** monthly, review Search Console coverage and indexing errors and update the eval table.
