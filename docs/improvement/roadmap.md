# Improvement roadmap

What's left, in order: **SEO, then smoothness, then security**. Only open work is listed here and in the linked pages; fixed items are removed once they're merged into `develop`, and `git log -- docs/improvement/` has the history (the first fix pass was merged on 2026-10-06).

Each item is its own small branch off `develop` (e.g. `fix/seo-site-url`). Review it, check it on a deploy preview where noted, and merge back into `develop`. Deploys cost build credits, so batch config-only changes (env vars) with the next code deploy where possible.

## The next release to `main`

The production env vars it needs (`SITE_URL` on the real domain, a 16+ character `ADMIN_PASSWORD`, and the S7 scopes and contexts) were set on 2026-10-06 and take effect with that deploy. What the release itself does:
- The admin has to log in once more: session tokens now carry an issuer and audience, and the production cookie is `__Host-admin_session`.
- Migration `0002_messages_created_at_idx` adds an index. The build applies it with `RUN_MIGRATIONS=true`.

## Then, in order

| Order | ID | What | Doc | Size |
|---|---|---|---|---|
| 1 | SEO-1 | Post-deploy URL checks, Search Console, Rich Results re-run | [seo.md](seo.md) | manual |
| 2 | | Security checks on a deploy preview | [security-hardening.md](security-hardening.md#checks-on-a-deploy-preview) | manual |
| 3 | PERF-1 | Investigate TTFB: the proxy on every request, edge caching of HTML | [performance.md](performance.md) | measure first |
| 4 | PERF-2 | Re-measure `/about` LCP; lower image quality only if it's still over 2.5 s | [performance.md](performance.md) | small |
| 5 | PERF-5, PERF-6 | Render-blocking CSS, `/about` reflow; decide on the serif font's `opsz` axis (71 KB per page) | [performance.md](performance.md) | small each |
| 6 | S4 | Netlify rate-limit rule on admin and `/contact` POSTs; then commit `docs/security-review/` | [security-hardening.md](security-hardening.md) | dashboard |
| 7 | S17 | HSTS `includeSubDomains`, once every subdomain serves HTTPS | [security-hardening.md](security-hardening.md) | one line |
| 8 | S12, S14, S16 | With the image library (which also finishes PERF-2) | [image-library.md](image-library.md) | with that work |
