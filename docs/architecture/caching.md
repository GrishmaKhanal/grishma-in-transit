# Caching: how edits go live without a redeploy

Public pages are static HTML. That makes them fast and easy for crawlers, but it means something has to decide when to rebuild them. This site uses **cache tags**.

## The three tags

Defined in `src/lib/data.ts`:

| Tag | Covers | Expired by |
|---|---|---|
| `posts` | `getPublishedPosts`, `getPublishedPost`, so `/`, `/blog`, `/blog/*`, `/notes/*`, RSS, sitemap | `savePost`, `deletePost` |
| `work` | `getWork`, so `/`, `/work` | company and project save/delete |
| `settings` | `getSettings`, so every page (name, nav, copy) | `saveSettings` |

Cached reads have no time-based expiry (`revalidate: false`). A page stays cached until one of its tags is expired, so the database is only queried after an admin edit, a contact-form submit, a first visit to a never-cached URL, or a build. This is deliberate: the database (Neon) suspends when idle, and an hourly refresh woke it for whichever visitor or crawler came next, up to 24 times a day. The catch is that a missed tag never fixes itself. Use **Refresh public pages** on the admin dashboard.

## Lifecycle

```
admin saves post ──▶ db write ──▶ updateTag("posts")
                                     │
next visitor to /blog ──▶ cache miss ─┴─▶ query DB once ──▶ render ──▶ cache (until next updateTag)
```

## Things that do need a redeploy

- Code or style changes, obviously.
- **Schema changes**, which also need a migration. See [../database/migrations.md](../database/migrations.md).
- Changing `SITE_URL`, because pages are built with it.

## Gotchas

- Changes made outside the admin (`npm run db:seed` or `db:sample` from a terminal, `db:studio`, raw SQL) don't expire any tag. Use **Refresh public pages** on the admin dashboard, which expires all three.
- If you add a new query, give it a tag and expire that tag from every action that changes its data. A forgotten `updateTag` shows up as "I saved, but the site still shows the old version", and it stays that way until Refresh public pages or the next deploy.
- `unstable_cache` stores JSON, so `Date`s come back as strings. `revive()` in `data.ts` converts known date keys back. Add new timestamp column names to `DATE_KEYS`.
- Uploaded images (`/media/[id]`) are read from Postgres. They're sent as `immutable`, plus `Netlify-CDN-Cache-Control: durable`, so Netlify's CDN shares one cached copy across edge locations and each image costs one database read.
- Blog slugs are prerendered at build (`generateStaticParams`). New slugs render on first request and are then cached. Because `dynamicParams` is on, every unknown slug (`/blog/<anything>`) still costs one database query. That's left on so new posts don't need a redeploy; revisit only if bots start probing those paths. Don't rename a published slug, or you break inbound links and search history.
