# SEO

Priority 1 in the [roadmap](roadmap.md). Only open work is listed; fixed items are removed once they're merged into `develop`, and `git log` has them.

## SEO-1. Point every published URL at the real domain (high)

Canonical tags, `sitemap.xml`, the `robots.txt` `Sitemap:` line, and the Open Graph and JSON-LD URLs are all built from `SITE_URL` (`src/lib/site.ts`). The live site still uses `https://grishma-in-transit.netlify.app`, so Google treats the `netlify.app` copy as the real one. The Production value is now the real domain (set 2026-10-06); it takes effect with the next production deploy.

Already in `develop`: `netlify.toml` 301s `grishma-in-transit.netlify.app` to `grishmakhanal.com.np` (deploy previews are unaffected), and `scripts/check-site-url.ts` fails a production build while `SITE_URL` is missing, `localhost` or a `netlify.app` host.

Left to do, by hand:
1. After the next production deploy, run the URL checks in [releasing.md](../deploy/releasing.md#after-every-production-deploy): canonical and `robots.txt` on `.com.np`, and the Netlify subdomain answering 301.
2. In Google Search Console, add `grishmakhanal.com.np` as a domain property, submit `https://grishmakhanal.com.np/sitemap.xml`, and spot-check one post with URL Inspection. The user-declared canonical should be the `.com.np` URL.
3. Re-run Lighthouse and the Rich Results Test on one blog post to confirm `BlogPosting` still validates with the new URLs.

## After that

Core Web Vitals feed ranking, so the open items in [performance.md](performance.md) (TTFB, font weight, render-blocking CSS) are the next SEO work.

## Not issues

- `Disallow: /api/` in `robots.txt` is harmless. There is no `/api` route.
- The admin path is correctly absent from `robots.txt`, the sitemap and the manifest.
