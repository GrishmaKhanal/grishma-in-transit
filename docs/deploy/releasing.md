# Releasing

## Content changes

Posts, work, site copy: **just save in the admin.** No deploy. See [../architecture/caching.md](../architecture/caching.md).

## Code changes (no schema change)

```sh
git checkout -b my-change
# ...edit, npm run dev, npm run lint...
git push -u origin my-change     # Vercel builds a preview URL
# check the preview, then merge to main → production deploy
```

## Schema changes

Same loop, plus a migration committed alongside the code:

```sh
npm run db:generate -- --name what_changed
npm run db:migrate            # local
git add src/db/schema.ts drizzle/ && git commit
```

When `main` deploys, the build runs:

```
vercel-build
 ├─ tsx scripts/migrate-on-deploy.ts
 │    ├─ no DATABASE_URL           → skip
 │    ├─ VERCEL_ENV=preview (etc.) → skip unless MIGRATE_PREVIEWS=1
 │    └─ production                → drizzle-kit migrate   (build fails if this fails)
 └─ next build
```

If the migration fails, the build fails and the old deploy keeps serving. If the migration succeeds but `next build` fails, the **old code is now running on the new schema**. The expand/contract rules in [../database/migrations.md](../database/migrations.md#safety-rules) exist to make that harmless.

### Before merging a schema change

- [ ] Read the generated SQL: no unintended `DROP`, and no `NOT NULL` without a default on an existing table
- [ ] Does the *currently deployed* code still work with the new schema?
- [ ] `npm run db:check` passes
- [ ] `npm run build` passes locally

### Running migrations by hand instead

If you'd rather not migrate from the build (for example, to watch it happen), set the Build Command in Vercel to `next build`, then before merging:

```sh
npx vercel env pull .env.production.local --environment=production
DATABASE_URL_UNPOOLED=... npm run db:migrate      # or load that file into your shell
```

## Preview deployments

By default, previews **share the production database** and skip migrations. That means:

- A preview whose code needs a new column will error on those pages until the migration reaches production. Usually that's acceptable for a portfolio.
- Content you edit through a preview's admin edits production.

For isolated previews, turn on **Neon → "Create a branch for each preview deployment"** in the Vercel integration. Each preview then gets its own copy-on-write copy of production data and its own `DATABASE_URL`. Then set `MIGRATE_PREVIEWS=1` for the **Preview** environment only, so previews apply their own migrations to their own branch.

## Rollback

| Problem | Fix |
|---|---|
| Bad code | Vercel → Deployments → previous production deploy → **Instant Rollback**. Seconds. The DB is untouched. |
| Bad migration | Write a new migration that reverses it and deploy (roll forward). |
| Lost or corrupted data | Neon → Branches → restore to a point in time (within the free-tier history window). |

## After every production deploy

A quick check, mirrored in the README's eval table:

- `/sitemap.xml` lists every published post; drafts are absent
- `$ADMIN_PATH` shows the login page with an `X-Robots-Tag: noindex` header
- `/admin` and an unknown slug both return 404
