# First deploy

A one-time setup. It takes about 15 minutes, all on free tiers (Vercel Hobby, Neon Free, Blob).

## 1. Push to GitHub

```sh
git add -A && git commit -m "Portfolio site"
gh repo create claude-design-portfolio --private --source . --push
```

## 2. Import into Vercel

**vercel.com → Add New → Project →** pick the repo. Keep the defaults:

- Framework: **Next.js**
- Build Command: **leave empty.** Vercel then runs the `vercel-build` script from `package.json`, which migrates and then builds. If you override this field, the migrations silently stop running.

The first build succeeds without a database (it serves seed content).

## 3. Add storage

**Project → Storage**

1. **Create → Neon (Postgres)** and connect it to the project, for all environments. This injects `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and friends.
   - Optional but recommended: in the Neon integration settings, enable **a branch per preview deployment**. See [releasing.md](releasing.md#preview-deployments).
2. **Create → Blob** and connect it. This injects `BLOB_READ_WRITE_TOKEN`.

## 4. Add your variables

**Settings → Environment Variables** (Production, then Preview with different secrets):

```
ADMIN_PATH            /studio-xxxxxxxx       # echo "/studio-$(openssl rand -hex 4)"
ADMIN_USERNAME        <your login name>
ADMIN_PASSWORD        <long random password>
SESSION_SECRET        <openssl rand -base64 48>
NEXT_PUBLIC_SITE_URL  https://grishmakhanal.com.np
```

Details for each are in [env-vars.md](env-vars.md).

## 5. Redeploy → tables get created

**Deployments → ⋯ → Redeploy** on the latest production deployment. The build log should show:

```
Using 'pg' driver for database querying
[✓] migrations applied successfully!
```

That's `drizzle/0000_init.sql` creating the five tables.

## 6. Seed starter content (once)

```sh
npx vercel link
npx vercel env pull .env      # now your local .env points at production. Careful.
npm run db:seed
```

Seeding is idempotent and never overwrites existing rows. Afterwards, point `.env` back at your local DB so you don't edit production by accident.

## 7. Check it

- `https://<vercel-url>/` shows your content
- `https://<vercel-url>$ADMIN_PATH` shows the login form. Log in, edit a post, reload the public page.
- `https://<vercel-url>/admin` returns 404

## 8. Domain and search

1. **Settings → Domains → Add** `grishmakhanal.com.np` and follow the DNS instructions.
2. Make sure `NEXT_PUBLIC_SITE_URL` matches the final domain, and redeploy if you changed it.
3. In Google Search Console, verify the domain and submit `https://<domain>/sitemap.xml`.
