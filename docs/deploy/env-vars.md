# Environment variables

The app reads the same keys on every host, and none of them are host-specific. The template is `.env.example`. Locally the values live in `.env` (git-ignored). On a host, you enter them in its environment-variable settings. For Netlify that's **Project configuration → Environment variables**; see [netlify.md](netlify.md#3-environment-variables).

| Variable | Needed | Secret | Used for |
|---|---|---|---|
| `DATABASE_URL` | for a live site | **yes** | Postgres connection string: posts, work, settings, messages **and uploaded images**. Without it the site shows built-in seed content, read-only. |
| `DATABASE_URL_UNPOOLED` | no | **yes** | A direct (non-pooled) URL, if your provider gives one. Migrations prefer it; the app ignores it. Set it for **Production only**, like `DATABASE_URL`. The build refuses to migrate when it and `DATABASE_URL` name different databases (Neon's `-pooler` host counts as the same); `MIGRATE_ALLOW_DIFFERENT_HOSTS=true` overrides that for providers whose direct host is unrelated. |
| `RUN_MIGRATIONS` | production | no | `true` makes `npm run build` apply pending migrations before building. Leave it unset everywhere else. |
| `ADMIN_PATH` | to enable the admin | optional | Secret admin URL, e.g. `/studio-7f3k2a`. Letters, numbers, `-`, `_`, `/`. Unset means the admin is off. See [../architecture/admin-and-auth.md](../architecture/admin-and-auth.md). |
| `ADMIN_USERNAME` | to log in | optional | Admin login name, case-insensitive. Avoid `admin`. |
| `ADMIN_PASSWORD` | to log in | **yes** | Admin login password, **16+ characters** (generate one with `openssl rand -base64 24`). Both it and the username must be set, or login is disabled. A shorter one also disables login. Failed logins are logged as `admin: failed login`, without what was typed. |
| `SESSION_SECRET` | to log in | **yes** | Signs session cookies. 32+ characters: `openssl rand -base64 48`. |
| `SITE_URL` | production | no | Public origin, e.g. `https://grishmakhanal.com.np`. It's read at build time, so a change needs a redeploy. |

## Why `SITE_URL` exists

Sitemaps, RSS feeds, `<link rel="canonical">`, JSON-LD and Open Graph images must contain **absolute** URLs (`https://domain/blog/x`, not `/blog/x`). Crawlers and social networks reject relative ones. The server can't reliably know its public domain, especially when it's built before a domain is attached, so you tell it once. It has no `NEXT_PUBLIC_` prefix because only server code uses it.

If it's missing, links point at `http://localhost:3000`. The site still works, but search engines index the wrong URLs.

## Scope per environment

Most hosts let you scope a variable to production, previews and local dev.

- `RUN_MIGRATIONS=true`: **production only**. A preview applying an unreleased migration to the production database is how outages happen.
- `DATABASE_URL`: production only is the safe default. Previews then run without a DB and show seed content. If you do give previews the production URL, editing content in a preview edits production.
- `ADMIN_PATH`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`: production only, so previews have no admin. If you want one on previews, give them a *different* `ADMIN_PATH`, `ADMIN_PASSWORD` and `SESSION_SECRET`, so a session from a preview can't log into production.
- Where the host can scope variables by use (Netlify: **Scopes**), give the login secrets the request-time scope only (Functions), not Builds.
- **Env changes take effect on the next deploy** on Netlify (and most hosts that bake env into a build). Change, then redeploy.

## Handling

- Never commit `.env`. `.gitignore` covers `.env*` except `.env.example`.
- Never put a secret in a `NEXT_PUBLIC_` variable. That ships it to every browser.
- Don't type connection strings inline (`DATABASE_URL='...' npm run ...`): they land in shell history. Use `read -rs DATABASE_URL && export DATABASE_URL`, or `netlify env:get`.
- Never paste connection strings or passwords into chats, issues or screenshots. If one leaks, rotate it at the provider, update the env var and redeploy. Rotating `SESSION_SECRET` or `ADMIN_PASSWORD` also logs everyone out.
