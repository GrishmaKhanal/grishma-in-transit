# Image library (proposed)

Status: idea, not started. Needs a design pass before any code.

## Why

Every upload today is a one-off. The `media` table stores the bytes under a random id
(`/media/<id>`) and nothing else, so:

- there is no name to find an image by later,
- alt text is guessed from the file name and written straight into the post's markdown,
  so it isn't saved with the image and has to be retyped when the image is reused,
- reusing an image (say the Aho-Corasick automaton diagram in a second article) means
  digging the URL out of the old post or uploading a duplicate.

## What it should do

- Each upload saves a **name**, **alt text** and metadata (content type, size, width,
  height, original file name, uploaded/updated time) alongside the bytes.
- Uploading asks for alt text (prefilled from the file name, as now) and a name.
- An **admin library page** lists every image with a search box over name and alt text.
  Name and alt text are editable there.
- A **picker** opens from every image input (the markdown editor's "Insert image", the
  cover / social image field, the about photo) to search the library and pick an image.
  Uploading new from the picker is the same as uploading today.
- Inserting into markdown uses the image's saved alt text: `![<alt>](/media/<id>)`.
- The library shows **where each image is used** (posts and the about page), and asks
  before deleting one that is still used.

## Decisions to make in the design pass

- **Renaming must not break links.** The URL stays `/media/<id>`; the name is a label for
  searching. A readable path (`/media/<id>/<name>.png`, name ignored when serving) is an
  option for nicer URLs, but changes nothing about lookup.
- **Alt text in markdown is a copy.** Editing an image's alt text in the library doesn't
  rewrite posts that already embed it. Either accept that, or render `/media/<id>` images
  with the library's alt when the markdown alt is empty.
- **"Where used"** can be a text search over `posts.content`, `posts.cover_image` and the
  settings row for `/media/<id>`; no join table to keep in sync. Fine at portfolio scale.
- **Search**: `ILIKE` over name and alt is enough for a few hundred images.
- **Dimensions**: read width and height from the image header on upload (next to
  `sniffImageType` in `src/lib/image-type.ts`); lets the site emit `width`/`height` and
  avoid layout shift.

## Touches

- `src/db/schema.ts` `media` table: new nullable columns, plus migration `0002`
  (additive, safe to deploy before the code).
- `src/app/admin/actions.ts` `uploadImage`: accept name and alt; new actions to update,
  search, and delete media.
- `src/app/admin/_components/fields.tsx`: `ImageField` and `MarkdownField` open the picker.
- New `src/app/admin/media/` page and nav entry.
- `test/db.integration.test.ts`: upload with metadata, search, rename keeps the URL.
- `docs/database/schema.md`, `docs/architecture/http-routes.md`.
