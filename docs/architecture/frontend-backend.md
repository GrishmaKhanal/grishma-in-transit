# Frontend / backend, file by file

Everything lives in one repo and deploys together, but each file runs in exactly one place.

## Server only (the "backend")

| Path | Role |
|---|---|
| `src/proxy.ts` | Runs before every page request. Maps the secret `ADMIN_PATH` onto the admin, checks the session cookie, and returns 404 for `/admin`. See [admin-and-auth.md](admin-and-auth.md). |
| `src/db/schema.ts` | Table definitions (Drizzle). The single source of truth for the schema. |
| `src/db/index.ts` | Creates the DB client. It uses Neon's HTTP driver for `*.neon.tech` URLs and `node-postgres` for anything else (local podman). With no `DATABASE_URL`, `hasDb` is `false`. |
| `src/lib/data.ts` | All **public reads**, wrapped in a tagged cache. It falls back to `src/content/seed.ts` when there's no DB. |
| `src/lib/auth.ts` | Password check, JWT session cookie, `requireAdmin()`. |
| `src/app/admin/actions.ts` | All **admin writes** (Server Actions). Each one calls `requireAdmin()` and then `updateTag(...)`. |
| `src/app/actions/contact.ts` | Public Server Action: contact form → `messages` table (zod-validated, honeypot). |
| `src/app/sitemap.ts`, `robots.ts`, `blog/rss.xml/route.ts`, `opengraph-image.tsx` | Generated SEO endpoints. |
| `scripts/seed.ts`, `scripts/migrate-on-deploy.ts` | CLI scripts. They're never bundled into the site. |
| `drizzle/` | Generated SQL migrations. Committed to git. See [../database/migrations.md](../database/migrations.md). |

## Rendered on the server, sent as HTML (still no DB access in the browser)

| Path | Role |
|---|---|
| `src/app/(site)/**` | Public pages: home, blog, work, about, contact, sitemap. |
| `src/app/admin/**/page.tsx`, `layout.tsx` | Admin screens. The folder is `admin`, but the public URL is `ADMIN_PATH`. |
| `src/components/*.tsx` (without `"use client"`) | Shared layout pieces. |

## Runs in the browser (the "frontend" JS)

Only files that start with `"use client"`:

- `src/app/(site)/contact/form.tsx`: the contact form's pending and error state
- `src/app/admin/_components/{nav,forms,fields,roles,rows,save}.tsx`: admin form interactivity
- `src/components/CopyCode.tsx`: copy buttons on article code blocks

These receive data as **props** from server components and submit through **Server Actions**. They never import `@/db`, `@/lib/data` or `@/lib/auth`, and `server-only` turns any such import into a build error.

## How a request flows

**Reading a public page (`/blog/some-post`)**

1. The proxy sees a non-admin path and passes it through.
2. The page calls `getPublishedPost("blog", slug)` from `src/lib/data.ts`.
3. The cache returns a stored result, or queries Postgres once and stores it under the `posts` tag.
4. The HTML goes out. Pages are static and regenerate only when their tag is expired. See [caching.md](caching.md).

**Saving in the admin**

1. The form posts to a Server Action. On the wire that's a `POST` to the current URL, so the proxy guards it too.
2. The action runs `requireAdmin()`, validates with zod, and writes through Drizzle.
3. `updateTag("posts" | "work" | "settings")` expires the cached reads.
4. The next visitor gets freshly rendered pages, sitemap and RSS. No redeploy needed.

## Rules of thumb

- A new read for a public page goes in `src/lib/data.ts`, wrapped in `cached(...)` with the right tag.
- A new write goes in a Server Action. Call `requireAdmin()` first (the proxy alone isn't enough, as the Next docs warn), then `updateTag` for every tag it affects.
- Never put a secret in a `NEXT_PUBLIC_*` variable or pass it as a prop to a client component.
- A form whose action can return an error submits via `onSubmit` + `startTransition` (keeping `action=` for pre-hydration POSTs), or React 19 clears what the user typed. See [admin-editor.md](admin-editor.md).
