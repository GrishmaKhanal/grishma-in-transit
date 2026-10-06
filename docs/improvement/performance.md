# Performance and smoothness

Priority 2 in the [roadmap](roadmap.md). Only open work is listed; fixed items are removed once they're merged into `develop`, and `git log` has them.

## Baseline

Lighthouse 13.4.1, mobile emulation, headless Chrome, against the live site on 2026-10-05. These are the "before" numbers: none of the fixes merged on 2026-10-06 was deployed yet.

| Page | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Speed Index | TTFB |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 96 | 95 | 100 | 100 | 1.3 s | 2.6 s | 10 ms | 0 | 2.8 s | 600 ms |
| `/blog` | 99 | 95 | 100 | 100 | 1.3 s | 1.3 s | 10 ms | 0.003 | 2.7 s | 720 ms |
| `/about` | **84** | 96 | 100 | 100 | 1.3 s | **4.0 s** | 40 ms | 0.001 | **4.7 s** | 810 ms |

**To re-run:** keep the tab in the foreground, use an Incognito window (extensions skew results), and test a public page, not the admin. A run where every audit says `Error!` with **NO_FCP** measured nothing (the page errored or the tab was in the background); run it again. From a terminal:

```sh
npx lighthouse https://grishmakhanal.com.np/about --only-categories=performance,accessibility,best-practices,seo --view
```

Single runs vary. Compare medians of three before and after a change.

## PERF-1. Slow first byte on every page, even on cache hits (medium)

TTFB is 600 to 1150 ms, and it's the largest part of LCP on `/` and `/blog` (LCP breakdown: TTFB 780 ms + render delay 758 ms on `/`). The pages *are* cached. Response headers show `Netlify Durable; hit` and `Next.js; hit`, but also `Netlify Edge; fwd=miss`, so each request still goes from the edge node to the durable cache. Measured from Kathmandu, where the nearest edge may be far from the durable store.

Things to test, in this order, measuring TTFB before and after each:
1. **The proxy runs on every page request.** `src/proxy.ts` matches all non-static paths because `ADMIN_PATH` is only known at runtime. On Netlify that is an extra function hop before the cached page. Measure TTFB with the proxy stubbed out on a deploy preview. If it's a big share, look at ways to make the proxy's matcher narrower without putting the secret path in the build output.
2. **Edge caching of HTML.** `cache-control: public,max-age=0,must-revalidate` lets the browser keep nothing and pushes every view through the edge. Check whether a `Netlify-CDN-Cache-Control` with a short edge TTL (plus the existing tag-based purge on admin saves) turns `fwd=miss` into an edge hit. Caching rules are in [caching.md](../architecture/caching.md).
3. Compare TTFB from a few regions (WebPageTest, or `curl -w "%{time_starttransfer}"` through a VPN) to separate distance from server time.

## PERF-2. `/about` portrait (medium)

LCP was 4.0 s: TTFB 1070 ms, then 2.8 s downloading the portrait (the `<Image>` in `src/app/(site)/about/page.tsx`). The `fetchpriority="high"` hint and AVIF are in `develop`. What's left:
- Measure `/about` LCP after the next deploy. If it's still over 2.5 s, lower `quality` for this photo; the value has to be added to `images.qualities` in `next.config.ts`.
- The source is `/media/<id>`, served from Postgres, so a cold optimiser cache means a database read and a resize before the first byte. The [image library](image-library.md) moves the bytes to object storage behind a CDN, which removes this.

## PERF-5. Small items (low)

- **Render-blocking CSS**, about 80 to 90 ms live (110 to 150 ms estimated in a local run, 2026-10-06). One 10.8 KB stylesheet blocks first paint. Check whether this Next version's CSS inlining option helps, and measure FCP before keeping it.
- **Forced reflow**, about 34 ms on `/about`, unattributed. Look again once PERF-2 is re-measured.

## PERF-6. The serif font's optical-size axis costs 71 KB on every page (medium, design call)

Source Serif 4 is loaded with `axes: ["opsz"]` (`src/app/layout.tsx`). Its Latin file is **122 KB**, preloaded on every page: the largest asset after the hero video, and bigger than all the JavaScript Lighthouse flags. Without the axis it's **51 KB**. Measured 2026-10-06.

The axis is what gives the large headlines their tighter display letterforms. Without it, the home headline sets about 12% wider and the intro paragraph wraps differently. Options:
- Drop `axes: ["opsz"]` and accept the text-size letterforms at display sizes. One line; saves 71 KB per first visit.
- Keep the look, but self-host a subset: instance the variable font to the weights the site uses (400 to 800) and a narrower `opsz` range with fontTools, then load it with `next/font/local`. More work; the saving depends on how far the ranges shrink.
- Keep it as is, since the file is cached after the first visit.

## Known Lighthouse flags with no fix in app code

Checked with `npx next experimental-analyze` and a local Lighthouse run on 2026-10-06, so these don't need re-investigating:
- **Unused JavaScript (27 to 29 KiB)** is all inside the React DOM chunk. The shared JS on every page is React, the Next router and the Turbopack runtime; the site's own client code is about 4 KB (`Nav`, `HeroVideo`, `WritingList`, the error boundary).
- **Legacy JavaScript (~14 KiB estimated)** is Next's `polyfill-module` (`Array.prototype.at`, `flat`, `Object.hasOwn`, …), 1.4 KB raw in reality. Each polyfill is guarded and does nothing in modern browsers. A `browserslist` doesn't remove it: this Next version already targets Chrome/Edge/Firefox 111 and Safari 16.4.
- **`/about` loads the `next/image` client chunk** (15 KB raw, 5.6 KB gzipped) for the portrait. `getImageProps` doesn't avoid it, because `next/image` always requires the client component; only importing Next internals would.
- The 112 KB polyfill chunk in the build is `noModule`, so modern browsers never download it.

## Done when

Lighthouse mobile shows Performance ≥ 95 on `/`, `/blog` and `/about`, LCP < 2.5 s on all three, and Accessibility 100 (the contrast and logo-label fixes are in `develop`; this run confirms them). Medians of three runs, taken after SEO-1 is live.
