# HTTP routes and server actions

Everything the app answers, in one place. There is no JSON API: pages are HTML, a few routes return files or feeds, and all writes are Server Actions. "Cached" means a tagged, static render that admin saves expire (see [caching.md](caching.md)).

## Public pages

| Path | Source | Notes |
|---|---|---|
| `/` | `src/app/(site)/page.tsx` | Hero, latest writing, work band. Person JSON-LD. Cached. |
| `/blog` | `(site)/blog/page.tsx` | All published posts, client-side tag filter. Cached. |
| `/blog/<slug>` | `(site)/blog/[slug]/page.tsx` | Published `kind = blog` only, else 404. BlogPosting + breadcrumb JSON-LD. Known slugs are prerendered, new ones render on first request. |
| `/notes/<slug>` | `(site)/notes/[slug]/page.tsx` | Same for `kind = note`. |
| `/work` | `(site)/work/page.tsx` | Published companies, their published projects, then Tinkering. Cached. |
| `/about` | `(site)/about/page.tsx` | Site settings, about markdown. Cached. |
| `/contact` | `(site)/contact/page.tsx` | Contact form (see `sendMessage` below). Cached. |
| `/sitemap` | `(site)/sitemap/page.tsx` | Human-readable list of every page. Cached. |

## Files, feeds and metadata

| Path | Source | Notes |
|---|---|---|
| `/sitemap.xml` | `src/app/sitemap.ts` | Static pages plus every published post with `lastmod = updated_at`. |
| `/blog/rss.xml` | `src/app/blog/rss.xml/route.ts` | RSS 2.0 of published posts. `force-static`, expired by the `posts` tag. |
| `/robots.txt` | `src/app/robots.ts` | Allows everything and points at the sitemap. Deliberately does not list `ADMIN_PATH`. |
| `/manifest.webmanifest` | `src/app/manifest.ts` | Web app manifest. |
| `/opengraph-image` | `src/app/opengraph-image.tsx` | Site-wide 1200x630 social card, generated. |
| `/about/opengraph-image` | `(site)/about/opengraph-image.tsx` | About-page social card, generated at build. |
| `/blog/<slug>/opengraph-image`, `/notes/<slug>/opengraph-image` | `opengraph-image.tsx` beside each page | Per-post social card, generated on request. 404 for drafts and unknown slugs. |
| `/media/<id>` | `src/app/media/[id]/route.ts` | Uploaded images from the `media` table. `id` must be 16 url-safe characters. `Cache-Control: immutable`, `nosniff`. 404 for an unknown id or when there is no database; misses are cached for a minute. |
| `/icon.svg`, `/apple-icon.png`, `/favicon.ico`, `/icons/*`, `/images/*`, `/assets/*`, `/video/*` | `src/app/*`, `public/` | Static files. The proxy skips these prefixes. |

## Redirects (308, `next.config.ts`)

| From | To |
|---|---|
| `/projects`, `/projects/<slug>` | `/work` |
| `/notes`, `/writing` | `/blog` |
| `/feed.xml` | `/blog/rss.xml` |

## Admin (only under `ADMIN_PATH`)

`src/proxy.ts` rewrites `$ADMIN_PATH/...` onto `src/app/admin/...` and returns the normal 404 for `/admin` itself (unless `ADMIN_PATH` is literally `/admin`, which only makes sense locally). Every admin response has `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`. Details: [admin-and-auth.md](admin-and-auth.md).

| Path | Page |
|---|---|
| `$ADMIN_PATH` | Login form, or the dashboard when signed in. `?refreshed=1` confirms a cache refresh. |
| `$ADMIN_PATH/posts` | Post list. `?status=live` or `?status=draft` filters. |
| `$ADMIN_PATH/posts/new`, `/posts/<id>` | Post editor. `?created=1` shows "Created" after a first save. |
| `$ADMIN_PATH/companies`, `/companies/new`, `/companies/<id>` | Companies and their roles. |
| `$ADMIN_PATH/projects`, `/projects/new`, `/projects/<id>` | Projects. `/projects/new?company=<id>` preselects the company. |
| `$ADMIN_PATH/settings` | All site copy. |
| `$ADMIN_PATH/messages` | Contact-form inbox, 50 per page (`?page=N`). |

Anything below `$ADMIN_PATH` without a valid session redirects to `$ADMIN_PATH`. If a request ever reaches an admin page without a session anyway, the page answers 404.

## Server Actions

Called from forms. On the wire each one is a `POST` to the page it was called from, with a `Next-Action` header. None of them is a stable URL to call from outside.

| Action | File | Who | Does |
|---|---|---|---|
| `sendMessage` | `src/app/actions/contact.ts` | Anyone | Validates with zod, drops honeypot hits, refuses once 20 messages have arrived in the past hour (site-wide), inserts into `messages`. |
| `login` | `src/app/admin/actions.ts` | Anyone | Checks `ADMIN_USERNAME` / `ADMIN_PASSWORD` (16+ characters), sets the session cookie. 800 ms delay and a log line on failure. |
| `logout` | same | Anyone | Deletes the session cookie, then redirects to `/`. |
| `savePost`, `deletePost` | same | Admin | Create/update/delete a post, expire `posts`. |
| `saveCompany`, `deleteCompany` | same | Admin | Company and roles; delete hides its projects first. Expire `work`. |
| `saveProject`, `deleteProject` | same | Admin | Expire `work`. |
| `saveSettings` | same | Admin | Reject an unknown time zone, merge the form into the `settings` row, expire `settings`. |
| `toggleMessageRead`, `deleteMessage`, `deleteMessages` | same | Admin | Inbox actions. `deleteMessages` bulk-deletes every read message, or every message older than 90 days. |
| `uploadImage` | same | Admin | Byte-sniffed PNG/JPEG/GIF/WebP/AVIF up to 4 MB into `media`; returns `/media/<id>`. |
| `previewMarkdown` | same | Admin | Renders markdown for the editor's Preview tab. |
| `importStarterContent` | same | Admin | Runs the idempotent seed (only while the database has no posts, companies or projects), expires every tag. |
| `refreshPublicPages` | same | Admin | Expires every tag, for changes made outside the admin. |

"Admin" means the action calls `requireAdmin()` before anything else; the proxy's session check is only the first layer.
