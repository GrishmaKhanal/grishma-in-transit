# Deploying on Netlify

Project: **grishma-in-transit** (`https://grishma-in-transit.netlify.app`), deployed from GitHub, with a Netlify Database.

Nothing in the code is Netlify-specific. Netlify builds the app with `npm run build`, and the app reaches the database through a plain `DATABASE_URL`, like on any other host. See [first-deploy.md](first-deploy.md) for the host-agnostic version.

## How it fits together

```
git push main
   │
   ▼
Netlify build: npm run build
   ├─ scripts/migrate-on-deploy.ts ── RUN_MIGRATIONS=true → drizzle-kit migrate → your DB
   │     (a failed migration fails the build; the previous deploy keeps serving)
   └─ next build ── Netlify's Next.js runtime packages it:
                     pages → CDN, server code (actions, proxy, /media) → functions
   ▼
Publish → the site reads and writes Postgres through DATABASE_URL
```

| What | Where |
|---|---|
| Posts, work, settings, messages | Postgres tables |
| Uploaded images | Postgres, `media` table, served at `/media/<id>` |
| Schema history | `drizzle/*.sql`, applied by the build |
| Secrets | Netlify environment variables, never the repo |

---

## Step by step, after choosing the GitHub repo

### 1. Build settings

On **Add new project → Import from Git → GitHub → grishma-in-transit**, or later under **Project configuration → Build & deploy → Build settings**:

| Field | Value |
|---|---|
| Branch to deploy | `main` |
| Base directory | *(empty)* |
| Build command | `npm run build` |
| Publish directory | `.next` |
| Functions directory | *(empty)*. Netlify's Next.js runtime creates the functions. |

Netlify detects Next.js and adds its runtime by itself. Set Node 22 with the env var `NODE_VERSION=22`, or leave Netlify's default if it's already 22 or newer.

### 2. Database connection string

**Project → Database** shows two connection strings:

- **Read-write** → this becomes `DATABASE_URL`, in the next step.
- **Read-only** → keep it for browsing data (see [Using the database](#using-the-database)).

If a *direct / unpooled* variant is offered, it can go in `DATABASE_URL_UNPOOLED` for migrations. Otherwise one URL is enough.

Copy them straight from the dashboard into the env var fields. Don't commit them or paste them anywhere else.

### 3. Environment variables

**Project configuration → Environment variables → Add a variable → Add a single variable.** Tick **Contains secret values** where noted. Use the **Scopes** and **Deploy contexts** below.

| Key | Value | Secret | Scopes | Deploy contexts |
|---|---|---|---|---|
| `DATABASE_URL` | read-write connection string | ✔ | All (the build migrates with it) | **Production** |
| `DATABASE_URL_UNPOOLED` | direct string, if offered | ✔ | Builds | **Production** |
| `RUN_MIGRATIONS` | `true` | | Builds | **Production** |
| `ADMIN_PATH` | e.g. `/studio-3f9a1c` (no quotes, no spaces) | | All | **Production** (previews have no admin) |
| `ADMIN_USERNAME` | your login name | | Functions | Production |
| `ADMIN_PASSWORD` | 16+ random characters, not your local one | ✔ | Functions | Production |
| `SESSION_SECRET` | output of `openssl rand -base64 48` | ✔ | Functions | Production |
| `SITE_URL` | `https://grishmakhanal.com.np` (no trailing slash; the Netlify subdomain only before a domain is attached) | | All | Production |

Why **Production** only for the database and migrations: deploy previews then build without a database and show seed content. They can't run half-finished migrations against your real data.

Why the admin is **Production** only: a deploy preview runs whatever code is on the branch. With the production `SESSION_SECRET` and `ADMIN_PASSWORD` on a preview, a session cookie minted there would also work on the live site. If you do want an admin on previews, give the Deploy Previews context its **own** `ADMIN_PATH`, `ADMIN_PASSWORD` and `SESSION_SECRET`.

Why **Functions** scope for the login secrets: they're only read at request time (by the proxy and the admin actions), so the build never needs them and they stay out of build logs and build plugins.

**Netlify applies env changes only on the next deploy.** After changing a variable, trigger a deploy, or the site keeps running with the old value.

Leftovers to **delete** if you added them earlier: `PROD`, `NEXT_PUBLIC_SITE_URL`, `BLOB_READ_WRITE_TOKEN`. Nothing reads them any more.

Why `ADMIN_PATH` and `ADMIN_USERNAME` aren't secret: Netlify fails a build when a secret's value appears in the built files. Your username (likely your name) does appear on the site, which would trigger it. Also, the CLI's `netlify build` receives secret values masked (`****`), which fails the `ADMIN_PATH` check locally. If you do want them secret, add `SECRETS_SCAN_OMIT_KEYS=ADMIN_PATH,ADMIN_USERNAME`.

The same from a terminal inside the repo (it's already `netlify link`ed):

```sh
netlify env:set RUN_MIGRATIONS true --context production
netlify env:set SITE_URL https://grishmakhanal.com.np --context production
netlify env:set SESSION_SECRET "$(openssl rand -base64 48)" --secret
netlify env:list
```

### 4. Deploy

- **Push to `main`**, or
- **Deploys → Trigger deploy → Deploy project**. Use "Clear cache and deploy project" after dependency changes.

In **Deploys → (the deploy) → Deploy log**, a good first deploy shows:

```
migrate: ... [✓] migrations applied successfully!
▲ Next.js 16 ... ✓ Compiled successfully
Site is live ✨
```

From the terminal: `netlify watch` follows the running deploy, and `netlify open` opens the dashboard.

### 5. Add content (once)

The tables now exist but are empty. Open `https://grishma-in-transit.netlify.app<ADMIN_PATH>`, log in, and click **Import starter content** on the dashboard. It appears only while the database is empty and is safe to click twice.

Or, from your own terminal:

```sh
# Read from Netlify, so the string never appears on screen or in shell history.
DATABASE_URL="$(netlify env:get DATABASE_URL --context production)" npm run db:seed
```

Then click **Refresh public pages** on the admin dashboard. A seed from the terminal doesn't expire the page cache.

### 6. Check it

- `/`, `/blog`, `/work` show content.
- `/sitemap.xml` and `/blog/rss.xml` links start with your `SITE_URL`.
- `/admin` returns 404, and `<ADMIN_PATH>` shows the login form.
- In the admin, upload an image to a post. It gets a `/media/...` URL and shows on the public page.
- Save a post: the public page updates on the next request, with no redeploy.

### 7. Custom domain

**Domain management → Add a domain**, follow the DNS steps, and Netlify issues HTTPS. Then set `SITE_URL` to the domain and redeploy.

`netlify.toml` 301s `grishma-in-transit.netlify.app` to `grishmakhanal.com.np`, so search engines see one copy of each page. It matches only that host, so deploy previews still work. If the domain or project name changes, update that rule too.

---

## Using the database

- **The admin** (`<ADMIN_PATH>`) is the normal way to change content. It also refreshes the page caches.
- **Netlify → Project → Database** shows the database and its connection strings.
- **Drizzle Studio**, a table browser on your laptop:
  ```sh
  read -rs RO && export DATABASE_URL="$RO" DATABASE_URL_UNPOOLED="$RO"   # paste the read-only string, press Enter
  npm run db:studio
  unset RO DATABASE_URL DATABASE_URL_UNPOOLED
  ```
- **Any Postgres GUI** (TablePlus, DBeaver, pgAdmin, `psql`): use the read-only string. With the read-write one, your edits are live, though cached public pages keep showing old data until you click **Refresh public pages** on the admin dashboard.

## How migrations work

```sh
$EDITOR src/db/schema.ts
npm run db:generate -- --name add_post_views   # writes drizzle/0002_add_post_views.sql
cat drizzle/0002_add_post_views.sql            # read it
npm run db:migrate                             # apply to your LOCAL database
npm test && npm run dev
git add src/db/schema.ts drizzle/ && git commit -m "Add post view counter"
git push                                       # production build applies it, then builds
```

| Where | Who applies migrations |
|---|---|
| Your laptop | You, `npm run db:migrate` |
| Netlify production | The build, because `RUN_MIGRATIONS=true` there |
| Netlify deploy previews | Nobody. There's no DB there by default. |

`drizzle-kit migrate` records applied files in the `drizzle.__drizzle_migrations` table, so each runs once. The full rules are in [../database/migrations.md](../database/migrations.md). Most important: never edit a migration that has been deployed, and keep each one safe for the code that's currently live.

Netlify Database also has its own migration system (the `netlify/database/migrations/` folder). **This project doesn't use it.** Drizzle's migrations run from the build instead, so the same flow works on any host. Don't create that folder, or both systems would try to manage the schema.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ADMIN_PATH may only contain…` | The value has quotes, spaces or odd characters. Re-enter it as a plain `/something`. |
| Same error only in `netlify build` locally | The CLI receives secret values masked. Make `ADMIN_PATH` non-secret, or use `npm run build`. |
| `RUN_MIGRATIONS=true but DATABASE_URL is missing` | `DATABASE_URL` isn't set for that deploy context. |
| Migration step fails | Read the error in the log. Fix it with a **new** migration, never by editing the deployed one. |
| Deploy fails at "secrets scanning" | A secret's value appears in the output. See `SECRETS_SCAN_OMIT_KEYS` above. |
| Site live but empty | Step 5. |
| Admin says "No database connected" | `DATABASE_URL` isn't set for this context (expected on previews). |
| Upload says "Max 4 MB" | Resize the image. 4 MB is the cap, and it fits every host's request limit. |
