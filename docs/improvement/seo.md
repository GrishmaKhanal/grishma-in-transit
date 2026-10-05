# SEO improvements

Status: findings written up, fixes not started. Priority 1 in the [roadmap](roadmap.md).

Measured on the live site on 2026-10-05: Lighthouse 13.4.1 (mobile) on `/`, `/blog` and `/about`, plus `curl` against `robots.txt`, `sitemap.xml` and page heads.

## Where it stands

Lighthouse scores SEO **100** on all three pages. Titles, meta descriptions, canonical tags, JSON-LD (`Person`, `WebPage`, `BlogPosting`, `BreadcrumbList`), `robots.txt` and the sitemap are all present. Lighthouse only checks that these tags exist. It doesn't check that they point at the right domain, and they don't.

## SEO-1. Every URL the site publishes points at `netlify.app`, not the real domain (high)

The site is served at `https://grishmakhanal.com.np`, but `SITE_URL` in production is the Netlify subdomain. Everything built from `SITE_URL` (`src/lib/site.ts`) says so:

| Output | Live value today |
|---|---|
| `<link rel="canonical">` on every page | `https://grishma-in-transit.netlify.app/...` |
| `sitemap.xml` `<loc>` entries | `https://grishma-in-transit.netlify.app/...` |
| `robots.txt` `Sitemap:` line | `https://grishma-in-transit.netlify.app/sitemap.xml` |
| `og:image`, Open Graph and JSON-LD URLs | `https://grishma-in-transit.netlify.app/...` |

On top of that, `grishma-in-transit.netlify.app` answers **200** with the full site instead of redirecting. Google sees two copies of every page, and the canonical tag tells it the `netlify.app` copy is the real one. Links and rankings collect on the Netlify subdomain, not on `grishmakhanal.com.np`. (`www.` and `http://` already 301 to the right place.)

**Fix**
1. Set `SITE_URL=https://grishmakhanal.com.np` for the **Production** context in Netlify (no trailing slash), then redeploy. Env changes only reach the site on a new deploy.
2. 301 the Netlify subdomain to the real domain. Add a host-conditioned rule to `netlify.toml` (or `public/_redirects`) that only matches the production subdomain, so deploy previews keep working:
   `https://grishma-in-transit.netlify.app/* https://grishmakhanal.com.np/:splat 301!`
3. In Google Search Console, add `grishmakhanal.com.np` as a domain property, submit `https://grishmakhanal.com.np/sitemap.xml`, and spot-check one post with URL Inspection. The user-declared canonical should now be the `.com.np` URL.

**Check after deploy:** `curl -s https://grishmakhanal.com.np/ | grep canonical`, then `curl -s https://grishmakhanal.com.np/robots.txt`, and `curl -sI https://grishma-in-transit.netlify.app/` returns 301.

## SEO-2. Guard against it happening again (low)

`SITE_URL` falls back to `http://localhost:3000` when unset and accepts any host. A wrong value fails silently, as SEO-1 shows.

- Fail the production build (or log a loud warning) when `SITE_URL` is missing, is `localhost`, or ends in `.netlify.app` while `CONTEXT=production`.
- Add the post-deploy `curl` checks above to [releasing.md](../deploy/releasing.md).

## SEO-3. Smaller items worth doing alongside (low)

- **`/about` has no `og:image`.** `/`, `/blog` and `/work` do. Give it the site card or a portrait card.
- **Core Web Vitals feed ranking.** The page-speed items in [performance.md](performance.md) (TTFB and the `/about` LCP) are the SEO work after SEO-1.
- **Accessibility contrast** ([performance.md](performance.md#accessibility)) doesn't affect the SEO score, but it is a Lighthouse failure on every page.
- Once SEO-1 is live, re-run Lighthouse and the Rich Results Test on one blog post to confirm `BlogPosting` still validates with the new URLs.

## Not issues

- `Disallow: /api/` in `robots.txt` is harmless. There is no `/api` route.
- The admin path is correctly absent from `robots.txt`, the sitemap and the manifest.
