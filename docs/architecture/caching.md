# Caching: how edits go live without a redeploy

Public pages are static HTML. That makes them fast and easy for crawlers, but it means something has to decide when to rebuild them. This site uses **cache tags**.

## The three tags

Defined in `src/lib/data.ts`:

| Tag | Covers | Expired by |
|---|---|---|
| `posts` | `getPublishedPosts`, `getPublishedPost`, so `/`, `/blog`, `/blog/*`, `/notes/*`, RSS, sitemap | `savePost`, `deletePost` |
| `work` | `getWork`, so `/`, `/work` | company and project save/delete |
| `settings` | `getSettings`, so every page (name, nav, copy) | `saveSettings` |

Every cached read also has `revalidate: 3600` as a safety net. Even if a tag is somehow missed, content refreshes within an hour.

## Lifecycle

```
admin saves post ──▶ db write ──▶ updateTag("posts")
                                     │
next visitor to /blog ──▶ cache miss ─┴─▶ query DB once ──▶ render ──▶ cache (until next updateTag)
```

## Things that do need a redeploy

- Code or style changes, obviously.
- **Schema changes**, which also need a migration. See [../database/migrations.md](../database/migrations.md).
- Changing `NEXT_PUBLIC_SITE_URL`, because it's inlined at build time.

## Gotchas

- If you add a new query, give it a tag and expire that tag from every action that changes its data. A forgotten `updateTag` shows up as "I saved, but the site still shows the old version for up to an hour".
- `unstable_cache` stores JSON, so `Date`s come back as strings. `revive()` in `data.ts` converts known date keys back. Add new timestamp column names to `DATE_KEYS`.
- Blog slugs are prerendered at build (`generateStaticParams`). New slugs render on first request and are then cached. Don't rename a published slug, or you break inbound links and search history.
