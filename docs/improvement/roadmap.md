# Improvement roadmap

The order to work in, from the 2026-10-05 Lighthouse runs and the 2026-10-02 security review. Priority: **SEO, then smoothness, then security**. No security finding is Critical or High, so it can wait behind the visible wins.

Each item is meant to be its own small branch off `develop` (e.g. `fix/seo-site-url`). Review it, check it on a deploy preview where noted, and merge back into `develop`. Deploys cost build credits, so batch config-only changes (env vars) with the next code deploy where possible.

| Order | ID | What | Doc | Size |
|---|---|---|---|---|
| 1 | SEO-1 | Set `SITE_URL` to `https://grishmakhanal.com.np` and 301 `*.netlify.app` → real domain; submit sitemap in Search Console | [seo.md](seo.md) | env + 1 redirect rule |
| 2 | A11Y-1, A11Y-2 | Contrast tokens and logo link label (Lighthouse failures on every page) | [performance.md](performance.md#accessibility) | a few lines of CSS/JSX |
| 3 | PERF-2 | `/about` portrait: priority hint, AVIF, compression (LCP 4.0 s) | [performance.md](performance.md) | small |
| 4 | PERF-1 | Investigate TTFB: cost of running the proxy on every request, and edge caching of HTML | [performance.md](performance.md) | measure first |
| 5 | SEO-2 | Build-time guard against a wrong `SITE_URL`; post-deploy checks in releasing.md | [seo.md](seo.md) | small |
| 6 | S1 to S6 | Security "do first": contact cap, inbox paging, password floor, rate limits, admin routing, markdown escaping | [security-hardening.md](security-hardening.md) | ~100 lines + tests |
| 7 | PERF-3 to 5 | Poster size, unused/legacy JS, render-blocking CSS, font preloads | [performance.md](performance.md) | small each |
| 8 | S7 to S11 | Security config and docs | [security-hardening.md](security-hardening.md) | mostly docs/env |
| 9 | S12 to S20 | Security items tied to other work | [security-hardening.md](security-hardening.md) | with that work |

After items 6 and 8 ship, the full security review in the gitignored `docs/security-review/` can be committed.

## Status, 2026-10-06

Merged into `develop`, one branch per item:

| Item | State |
|---|---|
| SEO-1 | Code done (`netlify.toml` 301, `/about` card). **Manual:** set `SITE_URL=https://grishmakhanal.com.np` for Production *before* the next production deploy, then Search Console. |
| A11Y-1, A11Y-2 | Done. Re-check with Lighthouse after deploy. |
| PERF-2 | Priority hint and AVIF done. Object storage waits for the image library. |
| PERF-1 | Open: needs TTFB measurements on a deploy preview. |
| SEO-2 | Done. **A production build now fails while `SITE_URL` is still the netlify.app subdomain**, which is why the env change above has to come first. |
| S1, S2, S3, S5, S6 | Done. S4 (Netlify rate-limit rule) is a dashboard step. |
| PERF-3 | Done. PERF-4 browserslist: nothing to change. Bundle analysis, CSS inlining and the `/about` reflow are still open. |
| S7 to S11 | Done (S7 and S10 are doc changes: apply the new scopes in the Netlify UI). |
| S13, S15, S17 (COOP, `_headers`), S18, S19, S20 | Done. HSTS `includeSubDomains` waits for an all-HTTPS check. |
| S12, S14, S16 | With the image library. |

Deploy notes for the next release to `main`:
- `ADMIN_PASSWORD` must be 16+ characters, or admin login stays disabled.
- Session tokens now carry issuer and audience, and the cookie becomes `__Host-admin_session`, so the admin has to log in again once.
- Migration `0002_messages_created_at_idx` adds an index; it runs on deploy with `RUN_MIGRATIONS=true`.
