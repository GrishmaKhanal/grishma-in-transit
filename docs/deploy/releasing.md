# Releasing

## Content changes

Posts, work, site copy: **just save in the admin.** No deploy. See [../architecture/caching.md](../architecture/caching.md).

## Code changes (no schema change)

```sh
git checkout -b my-change
# ...edit, npm run dev, npm run lint...
git push -u origin my-change     # the host builds a preview URL
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
npm run build
 ├─ tsx scripts/check-site-url.ts            (production: fails on a missing, localhost or *.netlify.app SITE_URL)
 ├─ tsx scripts/migrate-on-deploy.ts
 │    ├─ RUN_MIGRATIONS unset (previews, local) → skip
 │    └─ RUN_MIGRATIONS=true (production)       → drizzle-kit migrate   (build fails if this fails)
 └─ next build
```

If the migration fails, the build fails and the old deploy keeps serving. If the migration succeeds but `next build` fails, the **old code is now running on the new schema**. The expand/contract rules in [../database/migrations.md](../database/migrations.md#safety-rules) exist to make that harmless.

### Before merging a schema change

- [ ] Read the generated SQL: no unintended `DROP`, and no `NOT NULL` without a default on an existing table
- [ ] Does the *currently deployed* code still work with the new schema?
- [ ] `npm run db:check` passes
- [ ] `npm run build` passes locally

### Running migrations by hand instead

If you'd rather not migrate from the build (for example, to watch it happen), remove `RUN_MIGRATIONS` from production, then before merging run, in your own terminal:

```sh
DATABASE_URL='<production connection string>' DATABASE_URL_UNPOOLED='<same, or the direct one>' npm run db:migrate
```

## Preview deployments

With `DATABASE_URL` scoped to production only (the recommended setup), previews have **no database**. They render the built-in seed content read-only, and their admin can't save. That's enough to check layout and code.

If you want previews with real data, give the preview context its **own** database (a copy or branch of production) as `DATABASE_URL`, plus `RUN_MIGRATIONS=true` for previews. Never point previews at the production database with `RUN_MIGRATIONS=true`.

## Rollback

| Problem | Fix |
|---|---|
| Bad code | Republish the previous deploy (Netlify: **Deploys → pick one → Publish deploy**; Vercel: **Instant Rollback**). Seconds. The DB is untouched. |
| Bad migration | Write a new migration that reverses it and deploy (roll forward). |
| Lost or corrupted data | Restore from your provider's backups or point-in-time restore. |

## After every production deploy

A quick check, mirrored in the README's eval table:

- `/sitemap.xml` lists every published post; drafts are absent
- `$ADMIN_PATH` shows the login page with an `X-Robots-Tag: noindex` header
- `/admin` and an unknown slug both return 404
- Every published URL uses the real domain, and the Netlify subdomain redirects:
  ```sh
  curl -s https://grishmakhanal.com.np/ | grep -o '<link rel="canonical"[^>]*>'
  curl -s https://grishmakhanal.com.np/robots.txt               # Sitemap: line on .com.np
  curl -sI https://grishma-in-transit.netlify.app/ | head -1    # 301
  ```
