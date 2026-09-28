# Local database

A Postgres 17 container in podman, reached with `node-postgres`. Any non-Neon `DATABASE_URL` uses that driver automatically.

## First time

```sh
podman run -d --name portfolio-pg \
  -e POSTGRES_USER=portfolio -e POSTGRES_PASSWORD=portfolio -e POSTGRES_DB=portfolio \
  -p 5433:5432 postgres:17-alpine

cp .env.example .env
# set in .env:
#   DATABASE_URL=postgresql://portfolio:portfolio@localhost:5433/portfolio
#   ADMIN_PATH=/whatever-you-like
#   ADMIN_USERNAME=...  ADMIN_PASSWORD=...  SESSION_SECRET=$(openssl rand -base64 48)
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000

npm run db:migrate
npm run db:seed
npm run dev      # admin at http://localhost:3000$ADMIN_PATH
```

## Every day

```sh
podman start portfolio-pg
npm run dev
```

## Seeding

`npm run db:seed` (`scripts/seed.ts`) inserts the starter content from `src/content/seed.ts`. It's idempotent:

- `settings` and `posts`: existing keys and slugs are skipped
- `companies` and `projects`: only seeded if `companies` is empty

That makes it safe to run against production once after the first deploy. It never overwrites edits you made in the admin.

## Reset

Wipes everything local and rebuilds from migrations and seed:

```sh
podman rm -f portfolio-pg
podman run -d --name portfolio-pg \
  -e POSTGRES_USER=portfolio -e POSTGRES_PASSWORD=portfolio -e POSTGRES_DB=portfolio \
  -p 5433:5432 postgres:17-alpine
npm run db:migrate && npm run db:seed
```

> A DB created earlier with `db:push` has no migration history, so `db:migrate` fails on it (exit 1, often silently). Reset it as above, or baseline it with option B in [migrations.md](migrations.md#baselining-a-db-created-with-dbpush). Your `portfolio-pg` was baselined on 2026-09-28 after confirming its schema was identical to `0000_init.sql`.

## "Failed query: select ... from settings" on page load

Drizzle wraps the real error. Nine times out of ten the container is just stopped (`ECONNREFUSED`). `npm run dev` now runs `scripts/dev-db-check.ts` first (the `predev` script). It stops with a clear message if the DB is unreachable and warns if migrations are pending:

```
db-check: can't reach the database at postgresql://localhost:5433/portfolio (ECONNREFUSED).
  Start it:  podman start portfolio-pg
```

If the DB is up but the query still fails, look for pending migrations (`npm run db:migrate`) or a missing seed row (`npm run db:seed`).

## Tools

- `npm run db:studio` opens a browser UI for tables and rows.
- `psql postgresql://portfolio:portfolio@localhost:5433/portfolio` gives you raw SQL.
- `npm run db:push` is OK *only* for local experiments you'll throw away. Reset afterwards, before generating a real migration.

## No database at all

Leave `DATABASE_URL` empty. The public site renders the seed content read-only, the admin shows a "No database connected" notice, and the contact form declines messages. That's handy for pure design work.
