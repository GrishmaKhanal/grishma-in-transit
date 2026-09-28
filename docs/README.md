# Docs

How this site is built, how data moves through it, and how to ship changes.

| Folder | Read it when you want to… |
|---|---|
| [`architecture/`](architecture/) | understand why this is one app, and where the "frontend" ends and the "backend" begins |
| [`database/`](database/) | change a table, write a migration, or reset your local DB |
| [`deploy/`](deploy/) | put the site online the first time, or ship a change safely |

## Map

- **architecture/**
  - [overview.md](architecture/overview.md): do we need a separate backend? (no, and why)
  - [frontend-backend.md](architecture/frontend-backend.md): the boundary inside the app, file by file
  - [caching.md](architecture/caching.md): how an admin edit shows up on the public site without a redeploy
  - [admin-and-auth.md](architecture/admin-and-auth.md): the secret admin URL (`ADMIN_PATH`), login, sessions
- **database/**
  - [schema.md](database/schema.md): the five tables and what each holds
  - [migrations.md](database/migrations.md): the migration workflow and the rules that keep deploys safe
  - [local-dev.md](database/local-dev.md): local Postgres in podman, seeding, resetting
- **deploy/**
  - [env-vars.md](deploy/env-vars.md): every environment variable and where it comes from
  - [first-deploy.md](deploy/first-deploy.md): GitHub → Vercel → Neon → domain, once
  - [releasing.md](deploy/releasing.md): the everyday ship loop, previews, rollback

## Cheat sheet

```sh
npm run dev            # checks the DB is up, then local site at :3000, admin at :3000$ADMIN_PATH
npm test               # unit + integration tests (see below)
npm run db:generate    # schema.ts changed → write a new SQL migration into drizzle/
npm run db:migrate     # apply pending migrations to $DATABASE_URL
npm run db:check       # sanity-check the migration history
npm run db:seed        # insert starter content (idempotent)
npm run db:studio      # browse the DB in a web UI
git push               # Vercel builds; production builds run migrations first
```

## Tests

`npm test` runs Node's built-in test runner (through `tsx`) over `test/*.test.ts`:

| File | Covers |
|---|---|
| `credentials.test.ts` | Username and password check: case rules, wrong values, and login disabled when env vars are missing |
| `admin-routing.test.ts` | `ADMIN_PATH` parsing; the proxy's rewrite, 404, login redirect and session checks |
| `scripts.test.ts` | `migrate-on-deploy` skip rules, and `dev-db-check` error output (and that it never prints credentials) |
| `db.integration.test.ts` | Creates a throwaway database beside your local one, runs the real migrations twice and the seed twice, then runs the site's settings and posts queries. It drops the database afterwards and **skips** when no local Postgres is reachable. It never runs against Neon. |
