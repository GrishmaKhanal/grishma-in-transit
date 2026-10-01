# Image library (proposed)

Status: idea, not started. Needs a design pass before any code.

## Why

Every upload today is a one-off. The `media` table stores the bytes under a random id
(`/media/<id>`) and nothing else, so:

- there is no name to find an image by later,
- alt text is guessed from the file name and written straight into the post's markdown,
  so it isn't saved with the image and has to be retyped when the image is reused,
- reusing an image (say the Aho-Corasick automaton diagram in a second article) means
  digging the URL out of the old post or uploading a duplicate,
- the bytes live in Postgres as base64 (about a third larger than the file), so images
  eat into the database's storage cap. A few dozen 4 MB uploads is a real share of a
  free-tier database, and the posts, settings and messages have to fit in the same space.

## What it should do

- Image **bytes go to object storage behind a CDN**, not the database. Postgres keeps
  only a small metadata row per image (see "Storage" below).
- Each upload saves a **name**, **alt text** and metadata (content type, size, width,
  height, original file name, uploaded/updated time) in that row.
- Uploading asks for alt text (prefilled from the file name, as now) and a name.
- An **admin library page** lists every image with a search box over name and alt text.
  Name and alt text are editable there.
- A **picker** opens from every image input (the markdown editor's "Insert image", the
  cover / social image field, the about photo) to search the library and pick an image.
  Uploading new from the picker is the same as uploading today.
- Inserting into markdown uses the image's saved alt text: `![<alt>](<CDN URL>)`.
- The library shows **where each image is used** (posts and the about page), and asks
  before deleting one that is still used.

## Storage: object storage + CDN for bytes, Postgres for metadata

Image bytes move out of Postgres into an S3-compatible bucket, served by a CDN straight
from the bucket. The app never serves image bytes, and viewing an image never touches
the database.

**Recommended: Cloudflare R2, public bucket on a custom subdomain** (e.g.
`img.<domain>`). R2 doesn't charge for downloads and Cloudflare's CDN caches at the edge.
S3 + CloudFront, or any S3-compatible store, works the same way behind the same code.
Check the provider's current free-tier storage, request and bandwidth limits before
choosing; they change. A custom domain on R2 needs that domain's DNS on Cloudflare;
R2's `r2.dev` URL is for development only.

### What's stored where

| Where | What |
|---|---|
| Bucket | The file, at an unguessable key like `media/k3J9xQ….png`, uploaded with its real `Content-Type` and `Cache-Control: public, max-age=31536000, immutable` |
| `media` row | `storage_key` (that key, **not** a full URL or bucket name), plus name, alt, content type, size, width, height, original file name, timestamps |
| Env vars | `MEDIA_PUBLIC_URL` (e.g. `https://img.<domain>`, not secret); bucket name, endpoint, access key id and secret (**secret**, server only, never `NEXT_PUBLIC_`) |

The page builds image URLs at render time: `MEDIA_PUBLIC_URL + "/" + storage_key`.
Changing provider or domain is then an env change plus a bucket copy. No row or post is
rewritten. Never store full URLs in the database for this reason.

### Flow

- **Upload** (admin server action, unchanged entry point): check the bytes with
  `sniffImageType`, enforce the 4 MB cap, read width and height, `PUT` the object, then
  insert the row. If the insert fails, delete the object, so nothing is orphaned. The
  browser never sees bucket credentials.
- **View**: the browser loads `img.<domain>/<key>` from the CDN. No function, no
  database read.
- **Delete**: delete the object, then the row. If the object delete fails, keep the row
  and report it.
- **Storage module**: all bucket calls live in one module (`src/lib/media-store.ts`:
  `put`, `delete`, `publicUrl`), so the provider is swappable without touching the admin.
- **Local dev**: the same module writes to a git-ignored folder (e.g. `.media/`, served by
  a dev-only route) when no bucket env vars are set, so `npm run dev` needs no cloud
  account. Or point it at a separate dev bucket, never the production one.

### Old `/media/<id>` links

Posts already embed `/media/<id>`. The route becomes a **301 redirect** to the CDN URL
for that row, so old links keep working. A one-off move script then:

1. copies each row's `data` into the bucket and sets `storage_key`,
2. checks the object reads back with the same size,
3. rewrites `/media/<id>` to the CDN URL in `posts.content`, `posts.cover_image` and the
   settings row (or leaves them and relies on the redirect),
4. clears `data`.

Migrations, in order, each safe to roll back: add the new columns and make `data`
nullable; ship the code and run the script; only later drop `data`.

### Why not keep serving through the app

Serving through `/media/<id>` (the app reads the bucket) keeps URLs and allows private
images, but every CDN miss runs a function and a database lookup. Every image here is
public, so a CDN on the bucket is cheaper, faster and takes the app and the database
out of image traffic entirely.

## Decisions to make in the design pass

- **Renaming must not break links.** The object key never changes; the name is a label
  for searching. Renaming never moves the object.
- **Alt text in markdown is a copy.** Editing an image's alt text in the library doesn't
  rewrite posts that already embed it. Either accept that, or render library images with
  the library's alt when the markdown alt is empty.
- **"Where used"** can be a text search over `posts.content`, `posts.cover_image` and the
  settings row for the image's key; no join table to keep in sync. Fine at portfolio scale.
- **Search**: `ILIKE` over name and alt is enough for a few hundred images.
- **Dimensions**: read width and height from the image header on upload (next to
  `sniffImageType` in `src/lib/image-type.ts`); lets the site emit `width`/`height` and
  avoid layout shift.

## Touches

- `src/db/schema.ts` `media` table: `storage_key` and metadata columns, `data` made
  nullable, in one additive migration; a later migration drops `data`.
- New `src/lib/media-store.ts` (S3-compatible client, local-folder fallback) and its
  dependency (e.g. `@aws-sdk/client-s3`, which works with R2).
- `src/app/admin/actions.ts` `uploadImage`: put to the bucket, save name and alt; new
  actions to update, search and delete media.
- `src/app/media/[id]/route.ts`: 301 to the CDN URL (falls back to `data` until moved).
- `src/app/admin/_components/fields.tsx`: `ImageField` and `MarkdownField` open the picker.
- New `src/app/admin/media/` page and nav entry; new one-off move script.
- `next.config.ts`: allow the image domain if `next/image` is used for these.
- `test/db.integration.test.ts`: upload with metadata (local-folder store), search,
  rename keeps the key, the redirect for old ids.
- `docs/database/schema.md`, `docs/architecture/http-routes.md`,
  `docs/architecture/caching.md`, `docs/deploy/env-vars.md` (new variables).
