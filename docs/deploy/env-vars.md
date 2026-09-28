# Environment variables

The app reads the same keys on every host, and none of them are host-specific. The template is `.env.example`. Locally the values live in `.env` (git-ignored). On a host, you enter them in its environment-variable settings. For Netlify that's **Project configuration → Environment variables**; see [netlify.md](netlify.md#3-environment-variables).

| Variable | Needed | Secret | Used for |
|---|---|---|---|
| `DATABASE_URL` | for a live site | **yes** | Postgres connection string: posts, work, settings, messages **and uploaded images**. Without it the site shows built-in seed content, read-only. |
| `DATABASE_URL_UNPOOLED` | no | **yes** | A direct (non-pooled) URL, if your provider gives one. Migrations prefer it; the app ignores it. |
| `RUN_MIGRATIONS` | production | no | `true` makes `npm run build` apply pending migrations before building. Leave it unset everywhere else. |
| `ADMIN_PATH` | to enable the admin | optional | Secret admin URL, e.g. `/studio-7f3k2a`. Letters, numbers, `-`, `_`, `/`. Unset means the admin is off. See [../architecture/admin-and-auth.md](../architecture/admin-and-auth.md). |
| `ADMIN_USERNAME` | to log in | optional | Admin login name, case-insensitive. Avoid `admin`. |
| `ADMIN_PASSWORD` | to log in | **yes** | Admin login password. Both it and the username must be set, or login is disabled. |
| `SESSION_SECRET` | to log in | **yes** | Signs session cookies. 32+ characters: `openssl rand -base64 48`. |
| `SITE_URL` | production | no | Public origin, e.g. `https://grishmakhanal.com.np`. It's read at build time, so a change needs a redeploy. |

## Why `SITE_URL` exists

Sitemaps, RSS feeds, `<link rel="canonical">`, JSON-LD and Open Graph images must contain **absolute** URLs (`https://domain/blog/x`, not `/blog/x`). Crawlers and social networks reject relative ones. The server can't reliably know its public domain, especially when it's built before a domain is attached, so you tell it once. It has no `NEXT_PUBLIC_` prefix because only server code uses it.

If it's missing, links point at `http://localhost:3000`. The site still works, but search engines index the wrong URLs.

## Scope per environment

Most hosts let you scope a variable to production, previews and local dev.

- `RUN_MIGRATIONS=true`: **production only**. A preview applying an unreleased migration to the production database is how outages happen.
- `DATABASE_URL`: production only is the safe default. Previews then run without a DB and show seed content. If you do give previews the production URL, editing content in a preview edits production.
- Give previews a *different* `ADMIN_PASSWORD` and `SESSION_SECRET`, so a leaked preview URL can't log into production.

## Handling

- Never commit `.env`. `.gitignore` covers `.env*` except `.env.example`.
- Never put a secret in a `NEXT_PUBLIC_` variable. That ships it to every browser.
- Never paste connection strings or passwords into chats, issues or screenshots. If one leaks, rotate it at the provider, update the env var and redeploy. Rotating `SESSION_SECRET` also logs everyone out.
