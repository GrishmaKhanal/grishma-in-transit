# SEO

Priority 1 in the [roadmap](roadmap.md). Only open work is listed; fixed items are removed once they're merged into `develop`, and `git log` has them.

## SEO-1. Point every published URL at the real domain (high)

Canonical tags, `sitemap.xml`, the `robots.txt` `Sitemap:` line, and the Open Graph and JSON-LD URLs are all built from `SITE_URL` (`src/lib/site.ts`). The live site still uses `https://grishma-in-transit.netlify.app`, so Google treats the `netlify.app` copy as the real one. The Production value is now the real domain (set 2026-10-06); it takes effect with the next production deploy.

Already in `develop`: `netlify.toml` 301s `grishma-in-transit.netlify.app` to `grishmakhanal.com.np` (deploy previews are unaffected), and `scripts/check-site-url.ts` fails a production build while `SITE_URL` is missing, `localhost` or a `netlify.app` host.

Left to do, by hand:
1. After the next production deploy, run the URL checks in [releasing.md](../deploy/releasing.md#after-every-production-deploy): canonical and `robots.txt` on `.com.np`, and the Netlify subdomain answering 301.
2. In Google Search Console, add `grishmakhanal.com.np` as a domain property, submit `https://grishmakhanal.com.np/sitemap.xml`, and spot-check one post with URL Inspection. The user-declared canonical should be the `.com.np` URL.
3. Re-run Lighthouse and the Rich Results Test on one blog post to confirm `BlogPosting` still validates with the new URLs.

## SEO-4. A search for the name should land on the home page (medium)

On 2026-10-09 a search for "grishma khanal" showed `/about`, not the home page, and no sitelinks (the About / Writing / Work / Contact links Google shows under a site's main result). The main cause is SEO-1: every page's canonical names the `netlify.app` copy, so the home page on `.com.np` has nothing to show.

Already in `develop`:
- Each page has its own title, description, `og:*` and `twitter:*` tags, `og:url` and RSS link (`pageMetadata` in `src/lib/seo.ts`). Before, `/blog`, `/work` and `/contact` shared the home page's social title and description.
- The home page declares a `WebSite` (Google takes the site name in results from it) and a `ProfilePage` whose main entity is the person, with "Grishma Khanal" as `alternateName`. `/about` is an `AboutPage` and `/work` a `WebPage` about the same person (one `@id`), so they no longer compete as profiles.
- Sitemap `lastmod` is each page's own last change.

Left to do, by hand, after the next production deploy:
1. In Search Console, run URL Inspection on `https://grishmakhanal.com.np/` and click **Request indexing**. Check the "Google-selected canonical" is the `.com.np` home page.
2. Run the Rich Results Test on the home page; it should find the `ProfilePage`.
3. Optional, in the admin: put the full name in the home page hero (Settings → hero eyebrow or intro), so the page's visible text matches the search as well as its title does.

Sitelinks can't be switched on. Google adds them once the home page is the clear top result for the name, and picks them from the navigation; the nav, distinct titles and `WebSite` data are what the site can contribute. Expect them a few weeks after the home page ranks.

## After that

Core Web Vitals feed ranking, so the open items in [performance.md](performance.md) (TTFB, font weight, render-blocking CSS) are the next SEO work.

## Not issues

- `Disallow: /api/` in `robots.txt` is harmless. There is no `/api` route.
- The admin path is correctly absent from `robots.txt`, the sitemap and the manifest.
