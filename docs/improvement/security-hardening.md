# Security hardening

Priority 3 in the [roadmap](roadmap.md). What's left from the whole-repository security review of 2026-10-02 (commit `e69117d`). Only open work is listed; fixed items are removed once they're merged into `develop`, and `git log` has them.

The review found **no Critical or High issues**: an anonymous visitor can't reach the admin, read drafts, run script in the admin's browser, or touch the database beyond the contact form. The full report (evidence, line references, verification notes) stays out of git in `docs/security-review/`, which is gitignored because this repository is public. It can be committed once S4 is in place, the last of the "do first" items.

## Host settings (Netlify UI)

| # | Change |
|---|---|
| S4 | Add a rate-limit rule on POSTs to the admin path and `/contact`, if the plan allows. The contact form already caps itself at 20 messages an hour; a host rule stops the requests before they reach a function. |
| S7 | Apply the scopes and deploy contexts from the table in [netlify.md](../deploy/netlify.md#3-environment-variables): admin secrets for Production only, scoped to Functions. The docs are updated; the Netlify settings themselves still need changing. |

## Do when the related work happens

| # | Change | Natural moment |
|---|---|---|
| S12 | Strip image metadata on upload. Add media delete with CDN purge. | [Image library](image-library.md) |
| S14 | Optional server-side HTML sanitiser for rendered markdown, at least for the editor preview. | A second editor, or regular pasting of third-party markdown |
| S16 | Move uploads off Server Actions so `bodySizeLimit` can return to the default. | Image library |
| S17 | Add `includeSubDomains` to HSTS, in `next.config.ts` and `public/_headers`. | Once every subdomain of `grishmakhanal.com.np` serves HTTPS |

## Watch

- `npm audit` reports a high-severity `braces` advisory in dev tooling only, through `eslint-config-next`. Its only "fix" downgrades the lint config to Next 14, so it stays until upstream updates. CI fails on production-dependency advisories and only reports dev ones.

## Checks on a deploy preview

These can't be verified from the repository. Run them on the first deploy preview of the current `develop`:
1. Encoded spellings of `/admin` (`/%61dmin`, `//admin`) return the site's normal 404 on Netlify, as they do in the tests.
2. Which responses (pages, `/media/<id>`, files in `public/`) carry the security headers from `next.config.ts` and `public/_headers`.
3. An unpublished post 404s from a cold edge location, which confirms tag-based purge reaches the CDN.
4. In the Netlify UI, confirm the deploy contexts and scopes of `DATABASE_URL_UNPOOLED`, `SESSION_SECRET` and `ADMIN_PASSWORD`, and whether a rate-limit rule exists.
5. Confirm which Neon role `DATABASE_URL` uses and how long point-in-time restore goes back.
