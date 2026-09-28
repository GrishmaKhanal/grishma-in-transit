# First deploy (any host)

The app is a standard Next.js server. It needs a Node host that runs Next.js (Netlify, Vercel, Render, Railway, Fly, a VPS with `npm start`) and one Postgres database. Nothing in the code is tied to a host.

For a click-by-click Netlify walkthrough, see [netlify.md](netlify.md).

## What every host needs

| Setting | Value |
|---|---|
| Install | `npm ci` (hosts do this by default) |
| Build command | `npm run build` |
| Start (servers/VPS only) | `npm start` |
| Node | 22 |
| Env vars | `DATABASE_URL`, `RUN_MIGRATIONS=true` (production), `ADMIN_PATH`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `SITE_URL`. See [env-vars.md](env-vars.md). |

`npm run build` is `tsx scripts/migrate-on-deploy.ts && next build`:

```
npm run build
 ├─ RUN_MIGRATIONS != "true"            → skip migrations
 ├─ RUN_MIGRATIONS=true, no DATABASE_URL → fail the build (misconfigured)
 ├─ RUN_MIGRATIONS=true                 → drizzle-kit migrate (fails the build if it fails)
 └─ next build
```

## Steps

1. **Create the database** anywhere and copy its connection string. For migrations, prefer a direct (non-pooled) one if the provider offers one.
2. **Connect the repo** to the host and set the build command and env vars above.
3. **Deploy.** The build log shows `[✓] migrations applied successfully!`. That's `drizzle/*.sql` creating the tables.
4. **Add content once.** Log in at `https://<site><ADMIN_PATH>` and click **Import starter content**. Or, from your terminal:
   ```sh
   DATABASE_URL='<production connection string>' npm run db:seed
   ```
   The seed is idempotent and never overwrites existing rows.
5. **Check it.**
   - `/` shows your content.
   - `<ADMIN_PATH>` shows the login form.
   - `/admin` returns 404.
   - `/sitemap.xml` URLs start with your `SITE_URL`.
6. **Domain and search.** Attach the domain at the host, set `SITE_URL` to it and redeploy. Then submit `https://<domain>/sitemap.xml` in Google Search Console.

## Host notes

- **Serverless hosts** (Netlify, Vercel): use a Postgres with a pooled or HTTP endpoint (Netlify Database, Neon). Neon URLs automatically use Neon's HTTP driver.
- **Long-running servers** (VPS, Render, Fly): any Postgres works. Run `npm run build` with `RUN_MIGRATIONS=true`, then `npm start`. If you run more than one instance, set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` to the same value on all of them.
- Uploads are limited to 4 MB per image, which fits every host's request limit.
