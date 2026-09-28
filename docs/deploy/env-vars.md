# Environment variables

Template: `.env.example`. Locally they live in `.env` (git-ignored). In production they're set in **Vercel → Project → Settings → Environment Variables**. Pull them locally with `npx vercel env pull .env`.

| Variable | Required | Source | Used for |
|---|---|---|---|
| `DATABASE_URL` | for a live site | Vercel → Storage → Neon (automatic) | App queries (pooled connection) |
| `DATABASE_URL_UNPOOLED` | recommended | Neon integration (automatic) | Migrations (direct connection) |
| `BLOB_READ_WRITE_TOKEN` | for image uploads | Vercel → Storage → Blob (automatic) | Admin image uploads |
| `ADMIN_PATH` | to enable the admin | you | Secret admin URL, e.g. `/studio-7f3k2a`. Unset means the admin is off. See [../architecture/admin-and-auth.md](../architecture/admin-and-auth.md). |
| `ADMIN_USERNAME` | to log in | you | Admin login name, case-insensitive. Avoid `admin`. |
| `ADMIN_PASSWORD` | to log in | you | Admin login password. Both must be set, or login is disabled. |
| `SESSION_SECRET` | to log in | you, `openssl rand -base64 48` | Signs session cookies. 32+ characters. |
| `NEXT_PUBLIC_SITE_URL` | yes | you | Canonical URLs, sitemap, RSS, OG images. **Inlined at build**, so changing it needs a redeploy. |
| `MIGRATE_PREVIEWS` | no | you (Preview env only) | `1` runs migrations on preview deploys. Only safe with a Neon branch per preview. |
| `VERCEL_ENV` | automatic | Vercel | `production` / `preview` / `development`. Decides whether the build migrates. |

## Scope per environment

In Vercel each variable can be scoped to Production, Preview and/or Development.

- Give **Preview** a *different* `ADMIN_PASSWORD` and `SESSION_SECRET` than Production, so a leaked preview URL can't log into prod.
- If previews share the production database (the default without Neon branching), remember that editing content on a preview edits production.

## Handling

- Never commit `.env`. `.gitignore` already covers `.env*` except `.env.example`.
- Never prefix a secret with `NEXT_PUBLIC_`. That ships it to every browser.
- If a secret leaks (pasted in chat, committed, screenshotted), rotate it in Vercel and redeploy. For `SESSION_SECRET` that also logs everyone out.
