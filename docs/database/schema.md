# Schema

Source of truth: `src/db/schema.ts`. The SQL form is in `drizzle/0000_init.sql` plus any later migrations.

| Table | Holds | Notes |
|---|---|---|
| `posts` | Blog posts and notes | `kind` is `blog` or `note`, which picks the `/blog/<slug>` or `/notes/<slug>` URL. `slug` is unique and must stay stable once published. `content` is markdown. Only `published = true` rows are public. |
| `companies` | Employers on `/work` | `roles` is a JSONB array of `{title, period, duration, points[], stack[]}`. Ordered by `sort_order`. |
| `projects` | Projects on `/work` | `company_id` points to `companies` (on delete: set null). A project with no company is shown under "Tinkering". |
| `settings` | All editable site copy | A key/value table with one row, `key = 'site'`, whose `value` is a JSONB `SiteSettings`. Missing fields fall back to the seed, so adding a field needs **no migration**. |
| `messages` | Contact-form inbox | Written by the public contact action, read in the admin. |

Drizzle also creates `drizzle.__drizzle_migrations` to track which migrations have run. Don't edit it by hand, except when baselining (see [migrations.md](migrations.md#baselining-a-db-created-with-dbpush)).

## Schema change or not?

| Change | Migration? |
|---|---|
| New field in `SiteSettings` (site copy) | **No.** Add it to the type and to `src/content/seed.ts`. |
| New key inside a `Role` (JSONB) | **No**, but handle old rows that lack it. |
| New column, table, index, constraint, or a type change | **Yes.** See [migrations.md](migrations.md). |
