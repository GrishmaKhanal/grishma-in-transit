# Security hardening

Status: S1, S2, S3, S5 and S6 done in code. S4 (Netlify rate-limit rule) is a dashboard step. Priority 3 in the [roadmap](roadmap.md), after SEO and performance.

A whole-repository security review was run on 2026-10-02 against commit `e69117d`. This page is the public summary. The full report (evidence, line references, verification notes) stays out of git in `docs/security-review/`, which is gitignored because this repository is public. Once the "do first" items below have shipped, that folder can be committed.

## Verdict

**No Critical or High issues.** An anonymous visitor cannot reach the admin, read drafts, run script in the admin's browser, or touch the database beyond the contact form. The core design holds:
- every admin action re-checks the session;
- all queries are parameterised;
- uploads are identified by their bytes;
- contact messages render as plain text;
- `npm audit` reports 0 advisories, and the unit tests pass.

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 2 |
| Low | 11 |
| Info | 9 |

The two Medium items are about *volume* (abuse and cost), not access. The Low items are hardening and deploy-configuration traps.

## Do first: small code changes

| # | Area | Change | Size |
|---|---|---|---|
| S1 ✅ | Contact form | Cap submissions per hour in `sendMessage` (add an index on `messages.created_at`). Wrap the insert in try/catch and log only the error code. | ~20 lines + 1 migration |
| S2 ✅ | Admin inbox | Paginate to 50 rows and add a bulk delete (read, or older than N days). This also starts an inbox retention policy. | ~40 lines |
| S3 ✅ | Admin login | Enforce a minimum password length, add generation guidance to `.env.example` and [env-vars.md](../deploy/env-vars.md), and log failed logins without credential values. | ~10 lines |
| S4 | Host | Add a Netlify rate-limit rule on POSTs to the admin path and `/contact`, if the plan allows. | dashboard |
| S5 ✅ | Admin routing | Make the proxy also check the URL-decoded path. Make the admin page guard and `logout` respond with 404 or `/` instead of redirecting to the admin path. Add tests with encoded paths. | ~10 lines + tests |
| S6 ✅ | Markdown | Escape `href`, `src`, `title` and `alt` in the custom renderers in `src/lib/markdown.ts`, and allow only safe URL schemes. Add a unit test. | ~15 lines |

## Do next: configuration and docs

| # | Change |
|---|---|
| S7 ✅ | Leave `ADMIN_PATH` unset on deploy previews, or give previews their own `SESSION_SECRET` and `ADMIN_PASSWORD`. Scope the request-time secrets (`SESSION_SECRET`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`) to Functions only, not Builds. Update the table in [netlify.md](../deploy/netlify.md). |
| S8 ✅ | Make `scripts/migrate-on-deploy.ts` refuse to run when `DATABASE_URL_UNPOOLED` and `DATABASE_URL` point at different databases, and print the target hostname (never credentials). Document the unpooled variable as Production-only. |
| S9 ✅ | Default remote non-Neon Postgres URLs to `sslmode=verify-full` in `src/db/index.ts` and `drizzle.config.ts`, and mention `sslmode` wherever the docs say "any Postgres". This also covers the `pg` SSL-mode deprecation warning in the function logs. |
| S10 ✅ | Replace the inline `DATABASE_URL='...' npm run ...` recipes in the deploy docs with `read -rs` or `netlify env:get`, so the connection string stays out of shell history. |
| S11 ✅ | Pin JWT verification (algorithm, required claims, max age, role, issuer and audience), and share one session-key helper between `src/proxy.ts` and `src/lib/auth.ts`. |

## Do when the related work happens

| # | Change | Natural moment |
|---|---|---|
| S12 | Strip image metadata on upload. Add media delete with CDN purge. | [Image library](image-library.md) |
| S13 | Validate slugs before any database read, and 404 social cards for unknown posts. Memoise the OG fonts. Cache media 404s briefly. | Any blog-route change (overlaps with [performance.md](performance.md)) |
| S14 | Optional server-side HTML sanitiser for rendered markdown, at least for the editor preview. | A second editor, or regular pasting of third-party markdown |
| S15 ✅ | Log everyone out when the password changes. Use the `__Host-` cookie prefix. | With S11 |
| S16 | Move uploads off Server Actions so `bodySizeLimit` can return to the default. | Image library |
| S17 ✅ (partly) | Headers: HSTS `includeSubDomains` (once every subdomain is HTTPS), COOP `same-origin`, and a `public/_headers` copy. **COOP and `_headers` done; `includeSubDomains` waits until every subdomain is confirmed HTTPS.** | Any time |
| S18 | Validate the `timezone` setting, and add an `error.tsx` to the `(site)` segment. | Any time |
| S19 | Server-side check in `importStarterContent`, `rel="noreferrer"` on admin links to the public site, and a rename of the honeypot field so autofill can't trip it. | Any time |
| S20 | Add `engines` / `.nvmrc`, plus a minimal CI job (lint, tests, `npm audit`). | Any time |

## Checks on a deploy preview

These can't be verified from the repository. Run them once S5 and S7 are in:
1. Encoded spellings of `/admin` return the site's normal 404 on Netlify, as they do locally.
2. Which responses (pages, `/media/<id>`, files in `public/`) carry the security headers from `next.config.ts`.
3. An unpublished post 404s from a cold edge location, which confirms tag-based purge reaches the CDN.
4. In the Netlify UI, confirm the deploy contexts and scopes of `DATABASE_URL_UNPOOLED`, `SESSION_SECRET` and `ADMIN_PASSWORD`, and whether a rate-limit rule exists.
5. Confirm which Neon role `DATABASE_URL` uses and how long point-in-time restore goes back.

## Operational note, 2026-10-05

Production returned 500 on the admin because `DATABASE_URL` held a stale password for an old database role. The variable was replaced with the current Neon string. **Netlify only applies env changes on the next deploy**, so the fix (and an `ADMIN_PATH` change) is live only after one. [env-vars.md](../deploy/env-vars.md) now says this.
