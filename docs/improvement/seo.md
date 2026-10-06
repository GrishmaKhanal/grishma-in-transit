# SEO

Priority 1 in the [roadmap](roadmap.md). Only open work is listed; fixed items are removed once they're merged into `develop`, and `git log` has them.

## SEO-1. Point every published URL at the real domain (high)

Canonical tags, `sitemap.xml`, the `robots.txt` `Sitemap:` line, and the Open Graph and JSON-LD URLs are all built from `SITE_URL` (`src/lib/site.ts`). Production still has it set to `https://grishma-in-transit.netlify.app`, so Google treats the `netlify.app` copy as the real one.

Already in `develop`: `netlify.toml` 301s `grishma-in-transit.netlify.app` to `grishmakhanal.com.np` (deploy previews are unaffected), and `scripts/check-site-url.ts` fails a production build while `SITE_URL` is missing, `localhost` or a `netlify.app` host.

Left to do, by hand:
1. Set `SITE_URL=https://grishmakhanal.com.np` for the **Production** context in Netlify (no trailing slash) **before** the next production deploy. Until then, the build guard fails that deploy on purpose.
2. After the deploy, run the URL checks in [releasing.md](../deploy/releasing.md#after-every-production-deploy): canonical and `robots.txt` on `.com.np`, and the Netlify subdomain answering 301.
3. In Google Search Console, add `grishmakhanal.com.np` as a domain property, submit `https://grishmakhanal.com.np/sitemap.xml`, and spot-check one post with URL Inspection. The user-declared canonical should be the `.com.np` URL.
4. Re-run Lighthouse and the Rich Results Test on one blog post to confirm `BlogPosting` still validates with the new URLs.

## After that

Core Web Vitals feed ranking, so the open items in [performance.md](performance.md) (TTFB, JS weight) are the next SEO work.

## Not issues

- `Disallow: /api/` in `robots.txt` is harmless. There is no `/api` route.
- The admin path is correctly absent from `robots.txt`, the sitemap and the manifest.
