# Migrations

We use **Drizzle Kit generated migrations**. You edit `src/db/schema.ts`, Drizzle writes a SQL file into `drizzle/`, you commit it, and it runs against production on deploy.

> The project previously used `npm run db:push`, which applies the schema directly and keeps no history. That's fine for throwaway prototyping on a local DB, but **don't use `db:push` against production**. It can't be reviewed, repeated or rolled forward reliably.

## The loop

```sh
# 1. edit the schema
$EDITOR src/db/schema.ts

# 2. generate a migration (reads the schema + drizzle/meta; doesn't touch the DB)
npm run db:generate -- --name add_post_views
#   → drizzle/0001_add_post_views.sql + updated drizzle/meta/*

# 3. read the SQL. Really. Look for DROP / ALTER TYPE / NOT NULL without DEFAULT.
cat drizzle/0001_add_post_views.sql

# 4. apply it locally and try the app
npm run db:migrate
npm run dev

# 5. commit schema + migration together
git add src/db/schema.ts drizzle/
git commit -m "Add post view counter"

# 6. push. The production deploy runs pending migrations before building.
git push
```

`npm run db:check` verifies the migration folder is internally consistent. It's useful after a merge.

## What runs where

| Environment | Who runs migrations | Command |
|---|---|---|
| Local | You | `npm run db:migrate` |
| Vercel **production** | The build, automatically | `vercel-build` → `scripts/migrate-on-deploy.ts` → `drizzle-kit migrate` → `next build` |
| Vercel **preview** | Skipped by default | Set `MIGRATE_PREVIEWS=1` only if each preview has its own Neon branch (see [../deploy/releasing.md](../deploy/releasing.md#preview-deployments)) |
| No `DATABASE_URL` | Skipped | The site serves seed content |

Migrations connect with `DATABASE_URL_UNPOOLED` when it's set (Neon's direct connection), otherwise `DATABASE_URL`. `drizzle-kit migrate` records each applied file in `drizzle.__drizzle_migrations`, so re-running it is a no-op.

## Safety rules

Migrations run **before** the new code is live, and a build can still fail *after* the migration succeeded. For a few minutes, or indefinitely if the build breaks, **the old code runs against the new schema**. So every migration must be safe for the code that's currently deployed.

**Safe in one deploy**

- Add a table.
- Add a nullable column, or one with a `DEFAULT`.
- Add an index. On a big table, use `CREATE INDEX CONCURRENTLY` in a custom migration. Not needed at this size.

**Needs two deploys (expand → contract)**

| Goal | Deploy 1 | Deploy 2 |
|---|---|---|
| Rename a column | Add the new column, write to both, backfill | Read from the new column, drop the old one |
| Drop a column | Stop reading and writing it in code | Drop it |
| Make a column `NOT NULL` | Add it nullable, backfill, write it always | `SET NOT NULL` |

Drizzle's generator sometimes asks whether a change is a rename or a drop-and-add. Answer carefully: "drop + add" deletes the data.

**Never**

- Edit a migration file that has already been applied anywhere shared. Write a new one instead.
- Delete files from `drizzle/` or `drizzle/meta/`.
- Run `db:push` against production.

## Data migrations and custom SQL

For backfills or anything Drizzle can't infer:

```sh
npm run db:generate -- --custom --name backfill_reading_time
# edit the empty drizzle/000N_backfill_reading_time.sql by hand
```

Keep them idempotent (`UPDATE ... WHERE col IS NULL`) and quick. They run inside the Vercel build, which has a time limit.

## Rolling back

Drizzle has no automatic "down" migrations. **Roll forward**: write a new migration that undoes the change, then deploy it. Code rollback (Vercel **Instant Rollback**) doesn't touch the DB. That's why the expand/contract rules above matter: they keep the previous deploy compatible with the current schema. For real data loss, Neon has point-in-time restore (create a branch from a timestamp).

## Baselining a DB created with `db:push`

`drizzle/0000_init.sql` creates every table. On a database whose tables already exist (because `db:push` made them), `db:migrate` fails. It exits with code 1, often with **no error message**, because under the hood it's hitting `relation "companies" already exists`. You have two options.

**A. Reset it.** Best for local, since the data is seed content anyway. See [local-dev.md](local-dev.md#reset).

**B. Mark `0000` as already applied.** Use this for a DB with data you want to keep. This is only valid if the DB's tables match `0000_init.sql`. They do if the DB was last `db:push`ed from the current `schema.ts`. If you're unsure, compare `pg_dump --schema-only "$DATABASE_URL"` against the SQL file first. Then:

```sh
HASH=$(sha256sum drizzle/0000_init.sql | cut -d' ' -f1)
WHEN=$(node -p 'require("./drizzle/meta/_journal.json").entries[0].when')
psql "$DATABASE_URL" <<SQL
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint);
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('$HASH', $WHEN);
SQL
npm run db:migrate   # should now say applied successfully and change nothing
```

A fresh production database needs neither option. The first deploy runs `0000` for real.
