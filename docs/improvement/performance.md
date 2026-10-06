# Performance and smoothness

Status: findings written up, fixes not started. Priority 2 in the [roadmap](roadmap.md). Accessibility findings from the same Lighthouse runs are at the end.

## The runs

The first report pasted on 2026-10-05 was empty: every audit said `Error!` with **NO_FCP** ("the page did not paint any content"). That run measured nothing. It happens when the page returns an error (the admin page was returning 500 at the time) or the tab is in the background during the load. Re-run it rather than reading anything into it.

Fresh runs, 2026-10-05, Lighthouse 13.4.1, mobile emulation, headless Chrome, against the live site:

| Page | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Speed Index | TTFB |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 96 | 95 | 100 | 100 | 1.3 s | 2.6 s | 10 ms | 0 | 2.8 s | 600 ms |
| `/blog` | 99 | 95 | 100 | 100 | 1.3 s | 1.3 s | 10 ms | 0.003 | 2.7 s | 720 ms |
| `/about` | **84** | 96 | 100 | 100 | 1.3 s | **4.0 s** | 40 ms | 0.001 | **4.7 s** | 810 ms |

**To re-run:** keep the tab in the foreground, use an Incognito window (extensions skew results), and test a public page, not the admin. From a terminal:

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

## PERF-2. `/about` portrait is the slowest thing on the site (medium)

LCP 4.0 s. The LCP element is the portrait `<Image>` in `src/app/(site)/about/page.tsx`. Breakdown: TTFB 1070 ms, then **2.8 s downloading the image**.

- It's discoverable and eager, but Lighthouse reports **no `fetchpriority="high"`**. Use the `Image` component's priority option for the above-the-fold portrait (check this Next version's docs in `node_modules/next/dist/docs/`; `preload` alone didn't set the hint).
- The `/_next/image?...&w=750&q=75` response could be **78 KiB smaller**. Enable AVIF (`images.formats: ["image/avif", "image/webp"]` in `next.config.ts`) and/or lower `quality` for this photo.
- The source is `/media/<id>`, which is served from Postgres. A cold optimiser cache means a database read and a resize before the first byte. When the [image library](image-library.md) moves bytes to object storage behind a CDN, this goes away.

## PERF-3. Home hero poster is twice the size it's shown at (low)

`/video/prithvi-highway-poster.webp` is 1600×896 but displays at 721×406 on mobile (about 28 KiB wasted). Ship an ~800 px variant and pick it with `srcset`/media, or let `next/image` serve the poster. `HeroVideo.tsx` already uses `preload="none"` for the video itself, which is right.

## PERF-4. JavaScript weight (low)

One shared chunk carries about 26 to 28 KiB of **unused JS** on every page and about 13 KiB of **legacy polyfills**. TBT is already 10 to 40 ms, so this is about smoothness on slow phones, not a blocker.
- Run `next build` with a bundle analyser to find what's in that chunk. Likely suspects: a client component imported higher up than it needs to be, or a library that could stay server-side.
- Set a modern `browserslist` in `package.json` so the legacy transforms and polyfills are dropped.

## PERF-5. Small items (low)

- **Render-blocking CSS**, about 80 to 90 ms. One stylesheet blocks first paint. Check whether this Next version's CSS inlining option helps, and measure FCP before keeping it.
- **Fonts.** Three families are loaded through `next/font` (Geist, Geist Mono, Source Serif 4 with the `opsz` axis), and all are preloaded. If Geist Mono isn't above the fold, set `preload: false` on it. The "preloaded but not used" console warnings seen on 2026-10-05 came from the 500 admin page, which never used the fonts, not from public pages.
- **Forced reflow**, about 34 ms on `/about`, unattributed. Look again after PERF-2.

## Accessibility

Accessibility scores 95 to 96. Both failures repeat on every page, so each fix lands site-wide.

**Status: A11Y-1 and A11Y-2 fixed** (accent `oklch(0.54 0.19 32)` = 4.87:1, `ink-5` `#6b6a64` = 4.76:1, `ink-6` no longer used for text on `/`, active nav number no longer faded, logo label starts with the monogram). Re-check with Lighthouse after the next deploy.

### A11Y-1. Colour contrast just under the line (medium, easy)

All are tokens in `src/app/globals.css`. WCAG AA needs 4.5:1 for normal text.

| Foreground on background | Ratio | Used for | Fix |
|---|---|---|---|
| `--color-accent` (`#cc361e`) on paper `#f1f0ec` | 4.48 | accent eyebrows and numbers | Darken slightly: about `oklch(0.54 0.19 32)` reaches 4.6+ |
| `--color-ink-5` `#6f6e68` on paper | 4.48 | captions, eyebrows, meta text | `#6b6a64` gives 4.76 |
| `--color-ink-6` `#8a8983` on paper | 3.08 | small meta text on `/` | Use `ink-5` for text; keep `ink-6` for rules and large type only |
| `#f2cdc7` on accent `#cc361e` | 3.48 | small mono text on accent chips | Use paper or white on accent (white gives 5.10) |

Re-check each ratio after changing a token, because the accent is also used on the dark band.

### A11Y-2. Logo link's accessible name doesn't contain its visible text (low, easy)

`src/components/chrome.tsx` renders the monogram (e.g. "GK") with `aria-label="Grishma Raj Khanal - home"`. Voice-control users who say "click GK" get no match. Make the label start with the visible text (`"GK - Grishma Raj Khanal, home"`), or drop `aria-label` and add visually hidden text after the monogram.

## Done when

Lighthouse mobile shows Performance ≥ 95 on `/`, `/blog` and `/about`, LCP < 2.5 s on all three, and Accessibility 100. These are medians of three runs, taken after SEO-1 is live.
