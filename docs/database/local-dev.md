# Local database

Local dev uses real Postgres, the same engine as production (no SQLite). Any Postgres works. The app reaches it with `node-postgres`, and Neon URLs use Neon's HTTP driver instead.

## How the pieces fit

| Step | What it does | Who does it |
|---|---|---|
| Postgres server | Runs the database engine | Your OS service or a podman container |
| `CREATE DATABASE portfolio` | Makes an empty database | You, once. **Migrations don't create databases**, only tables. |
| `DATABASE_URL` in `.env` | `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`. The password lives here and nowhere else. `.env` is git-ignored. | You |
| `npm run db:migrate` | Creates or updates the tables from `drizzle/*.sql` | You, after each new migration |
| `npm run db:seed` | Inserts starter content | You, once |

## Option A: the system Postgres (current setup)

Fedora's `postgresql` service on port 5432, logging in as the `postgres` user:

```sh
sudo systemctl enable --now postgresql
psql -h localhost -U postgres -c 'create database portfolio'
# .env:
#   DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/portfolio
npm run db:migrate
npm run db:seed
npm run dev      # admin at http://localhost:3000$ADMIN_PATH
```

If `create database` fails with *"template database template1 has a collation version mismatch"*, a system update changed glibc. Refresh the recorded version, then retry:

```sql
alter database template1 refresh collation version;
alter database postgres refresh collation version;
```

## Option B: a podman container

Self-contained, and deletable without touching the system:

```sh
podman run -d --name portfolio-pg \
  -e POSTGRES_USER=portfolio -e POSTGRES_PASSWORD=portfolio -e POSTGRES_DB=portfolio \
  -p 5433:5432 postgres:17-alpine
# .env:  DATABASE_URL=postgresql://portfolio:portfolio@localhost:5433/portfolio
npm run db:migrate && npm run db:seed
```

The container creates the database itself (`POSTGRES_DB`). Start it each day with `podman start portfolio-pg`.

## The rest of `.env`

```
ADMIN_PATH=/whatever-you-like
ADMIN_USERNAME=...  ADMIN_PASSWORD=...  SESSION_SECRET=$(openssl rand -base64 48)
SITE_URL=http://localhost:3000
```

## Seeding

`npm run db:seed` (`scripts/seed.ts`) inserts the starter content from `src/content/seed.ts`. It's idempotent:

- `settings` and `posts`: existing keys and slugs are skipped
- `companies` and `projects`: only seeded if `companies` is empty

That makes it safe to run against production once after the first deploy. It never overwrites edits you made in the admin.

## Reset

Wipes everything local and rebuilds from migrations and seed.

System Postgres:

```sh
psql -h localhost -U postgres -c 'drop database portfolio with (force)' -c 'create database portfolio'
npm run db:migrate && npm run db:seed
```

Podman:

```sh
podman rm -f portfolio-pg
podman run -d --name portfolio-pg \
  -e POSTGRES_USER=portfolio -e POSTGRES_PASSWORD=portfolio -e POSTGRES_DB=portfolio \
  -p 5433:5432 postgres:17-alpine
npm run db:migrate && npm run db:seed
```

> A DB created earlier with `db:push` has no migration history, so `db:migrate` fails on it (exit 1, often silently). Reset it as above, or baseline it with option B in [migrations.md](migrations.md#baselining-a-db-created-with-dbpush). 

## "Failed query: select ... from settings" on page load

Drizzle wraps the real error. Nine times out of ten the database server is just stopped (`ECONNREFUSED`). `npm run dev` now runs `scripts/dev-db-check.ts` first (the `predev` script). It stops with a clear message if the DB is unreachable and warns if migrations are pending:

```
db-check: can't reach the database at postgresql://localhost:5432/portfolio (ECONNREFUSED).
  Start it:  sudo systemctl start postgresql   (or: podman start portfolio-pg)
```

If the DB is up but the query still fails, look for pending migrations (`npm run db:migrate`) or a missing seed row (`npm run db:seed`).

## Tools

- `npm run db:studio` opens a browser UI for tables and rows.
- `psql "$DATABASE_URL"` (after `set -a; . ./.env`) gives you raw SQL.
- `npm run db:push` is OK *only* for local experiments you'll throw away. Reset afterwards, before generating a real migration.

## No database at all

Leave `DATABASE_URL` empty. The public site renders the seed content read-only, the admin shows a "No database connected" notice, and the contact form declines messages. That's handy for pure design work.
