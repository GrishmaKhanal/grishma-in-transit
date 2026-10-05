# Docs

How this site is built, how data moves through it, and how to ship changes.

| Folder | Read it when you want to… |
|---|---|
| [`architecture/`](architecture/) | understand why this is one app, and where the "frontend" ends and the "backend" begins |
| [`database/`](database/) | change a table, write a migration, or reset your local DB |
| [`deploy/`](deploy/) | put the site online the first time, or ship a change safely |
| [`improvement/`](improvement/) | see what to fix next (SEO, speed, security) and planned features that aren't built yet |

## Map

- **architecture/**
  - [overview.md](architecture/overview.md): do we need a separate backend? (no, and why)
  - [frontend-backend.md](architecture/frontend-backend.md): the boundary inside the app, file by file
  - [caching.md](architecture/caching.md): how an admin edit shows up on the public site without a redeploy
  - [admin-and-auth.md](architecture/admin-and-auth.md): the secret admin URL (`ADMIN_PATH`), login, sessions
  - [admin-editor.md](architecture/admin-editor.md): the shared save bar, unsaved-changes guard, and why forms submit from `onSubmit`
  - [http-routes.md](architecture/http-routes.md): every URL, file route, redirect and Server Action, and who can call it
- **database/**
  - [schema.md](database/schema.md): the six tables and what each holds
  - [migrations.md](database/migrations.md): the migration workflow and the rules that keep deploys safe
  - [local-dev.md](database/local-dev.md): local Postgres in podman, seeding, resetting
- **deploy/**
  - [env-vars.md](deploy/env-vars.md): every environment variable and where it comes from
  - [netlify.md](deploy/netlify.md): **Netlify**, step by step after picking the GitHub repo, plus using the DB and how migrations run
  - [first-deploy.md](deploy/first-deploy.md): the same for any host: what it needs, in order
  - [releasing.md](deploy/releasing.md): the everyday ship loop, previews, rollback
- **improvement/**
  - [roadmap.md](improvement/roadmap.md): **start here.** One ordered list: SEO first, then smoothness, then security
  - [seo.md](improvement/seo.md): canonical/sitemap URLs point at `netlify.app` instead of the real domain, and how to fix it
  - [performance.md](improvement/performance.md): Lighthouse results (2026-10-05), TTFB, the `/about` LCP, JS weight, plus contrast and labelling fixes
  - [security-hardening.md](improvement/security-hardening.md): public summary of the 2026-10-02 security review and its fix plan (full report kept local in the gitignored `docs/security-review/`)
  - [image-library.md](improvement/image-library.md): named, searchable, reusable uploads with saved alt text, bytes in R2/S3 behind a CDN instead of Postgres (proposed)

## Cheat sheet

```sh
npm run dev            # checks the DB is up, then local site at :3000, admin at :3000$ADMIN_PATH
npm test               # unit + integration tests (see below)
npm run db:generate    # schema.ts changed → write a new SQL migration into drizzle/
npm run db:migrate     # apply pending migrations to $DATABASE_URL
npm run db:check       # sanity-check the migration history
npm run db:seed        # insert starter content (idempotent)
npm run db:sample      # local only: add sample posts, drafts, companies, projects, messages (-- --remove to undo)
npm run db:studio      # browse the DB in a web UI
git push               # host builds; with RUN_MIGRATIONS=true (production) the build migrates first
```

## Tests

`npm test` runs Node's built-in test runner (through `tsx`) over `test/*.test.ts`:

| File | Covers |
|---|---|
| `credentials.test.ts` | Username and password check: case rules, wrong values, and login disabled when env vars are missing |
| `admin-routing.test.ts` | `ADMIN_PATH` parsing; the proxy's rewrite, 404, login redirect and session checks |
| `image-type.test.ts` | Uploads are identified by their bytes: PNG/JPEG/GIF/WebP/AVIF accepted; SVG, HTML and renamed files rejected |
| `scripts.test.ts` | `migrate-on-deploy` runs only with `RUN_MIGRATIONS=true`, and `dev-db-check` error output (and that it never prints credentials) |
| `db.integration.test.ts` | Creates a throwaway database beside your local one, runs the real migrations twice and the seed twice, then runs the site's settings and posts queries, and stores an image and serves it from `/media/[id]`. It drops the database afterwards and **skips** when no local Postgres is reachable. It never runs against Neon. |
