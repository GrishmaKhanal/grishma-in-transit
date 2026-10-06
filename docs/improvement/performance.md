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

## PERF-4. Unused JavaScript in the shared chunk (low)

One shared chunk carries about 26 to 28 KiB of unused JS on every page. TBT is already 10 to 40 ms, so this is about smoothness on slow phones, not a blocker.
- Run a bundle analysis of `next build` to find what's in that chunk. Likely suspects: a client component imported higher up than it needs to be, or a library that could stay server-side.
- The ~13 KiB Lighthouse flags as legacy JavaScript isn't fixed by a `browserslist`: this Next version already targets Chrome/Edge/Firefox 111 and Safari 16.4 by default (`node_modules/next/dist/docs/03-architecture/supported-browsers.md`). It most likely comes from the framework chunk itself.

## PERF-5. Small items (low)

- **Render-blocking CSS**, about 80 to 90 ms. One stylesheet blocks first paint. Check whether this Next version's CSS inlining option helps, and measure FCP before keeping it.
- **Forced reflow**, about 34 ms on `/about`, unattributed. Look again once PERF-2 is re-measured.

## Done when

Lighthouse mobile shows Performance ≥ 95 on `/`, `/blog` and `/about`, LCP < 2.5 s on all three, and Accessibility 100 (the contrast and logo-label fixes are in `develop`; this run confirms them). Medians of three runs, taken after SEO-1 is live.
