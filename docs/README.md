# Docs

How this site is built, how data moves through it, and how to ship changes.

| Folder | Read it when you want to… |
|---|---|
| [`architecture/`](architecture/) | understand why this is one app, and where the "frontend" ends and the "backend" begins |
| [`database/`](database/) | change a table, write a migration, or reset your local DB |
| [`deploy/`](deploy/) | put the site online the first time, or ship a change safely |
| [`improvement/`](improvement/) | see what's left to fix (SEO, speed, security) and planned features that aren't built yet |

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
  - [roadmap.md](improvement/roadmap.md): **start here.** What to set before the next release, then what's left in order: SEO, smoothness, security
  - [seo.md](improvement/seo.md): the manual half of moving canonical and sitemap URLs to the real domain (`SITE_URL`, Search Console)
  - [performance.md](improvement/performance.md): the Lighthouse baseline (2026-10-05) and the open speed items: TTFB, the `/about` LCP, render-blocking CSS, the serif font's weight
  - [security-hardening.md](improvement/security-hardening.md): what's left from the 2026-10-02 security review: host settings, deploy-preview checks, items tied to the image library (full report kept local in the gitignored `docs/security-review/`)
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
| `credentials.test.ts` | Username and password check: case rules, wrong values, and login disabled when env vars are missing or the password is under 16 characters |
| `admin-routing.test.ts` | `ADMIN_PATH` parsing; the proxy's rewrite, 404 (including encoded, doubled and capitalised spellings of `/admin`) and login redirect; session tokens: pinned algorithm, issuer, audience, role and `iat`, and a password change ending sessions |
| `image-type.test.ts` | Uploads are identified by their bytes: PNG/JPEG/GIF/WebP/AVIF accepted; SVG, HTML and renamed files rejected |
| `scripts.test.ts` | `check-site-url` fails production builds on a wrong `SITE_URL`; `migrate-on-deploy` runs only with `RUN_MIGRATIONS=true` and refuses when the pooled and direct URLs name different databases; `dev-db-check` error output. None of them prints credentials. |
| `markdown.test.ts` | Attribute escaping and the URL-scheme allowlist for markdown links and images, including an end-to-end render |
| `db-url.test.ts` | Remote Postgres URLs default to `sslmode=verify-full`; local hosts and explicit opt-outs are left alone |
| `headers.test.ts` | `public/_headers` repeats every security header from `next.config.ts` |
| `db.integration.test.ts` | Creates a throwaway database beside your local one, runs the real migrations twice and the seed twice, then runs the site's settings and posts queries, stores an image and serves it from `/media/[id]` (and a cached 404 for unknown ids), and checks the contact form's hourly cap. It drops the database afterwards and **skips** when no local Postgres is reachable. It never runs against Neon. |

CI (`.github/workflows/ci.yml`) runs lint, a type check, these tests against a Postgres service (so the integration tests run there too), and `npm audit` on every push to `develop` and `main` and on pull requests.
