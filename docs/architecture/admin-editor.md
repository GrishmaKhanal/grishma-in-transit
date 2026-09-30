# Admin editor behaviour

Every admin edit form (post, company, project, site content) is wrapped in `SaveForm` from `src/app/admin/_components/save.tsx`. It gives them the same save bar and the same rules.

## What `SaveForm` does

| Behaviour | How |
|---|---|
| A failed save keeps what you typed | Submits from `onSubmit` + `startTransition`. See the gotcha below. |
| Sticky save bar | Save button, status and page actions (e.g. "View live") stay pinned to the bottom of the screen. |
| Status | "Unsaved changes" once you edit, "Saved at 10:42" after a save, the error message if it failed, "Created" after a first save. |
| Ctrl+S / Cmd+S | Saves the form on the page. |
| Leave warning | With unsaved changes, closing the tab or following an in-app link asks first. Browser back is not intercepted. |

Dirty tracking counts `input` events on the form. Controls that change the form by clicking (add/remove/reorder rows, removing an image) call `useMarkDirty()` from the same file.

## Gotcha: React 19 resets action forms

`<form action={fn}>` resets every uncontrolled field once the action finishes, **even when it returns an error**. Before this was changed, a wrong password cleared the username, a duplicate slug wiped the whole draft, and a contact-form validation error wiped the visitor's message.

Rule: any form whose action can return an error submits from `onSubmit`, and keeps `action=` as well:

```tsx
<form action={action} onSubmit={(e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  startTransition(() => action(fd));
}}>
```

After hydration, `onSubmit` runs and `preventDefault()` stops React from running the action itself, so there is no reset. Before hydration (slow JS), `action=` makes the browser POST to the server action. Without it the browser falls back to a GET and puts every field, the password included, in the URL.

The login and contact forms follow this. `SaveForm` can't use `action=` (its action runs in the browser), so it sets `method="post"` for the same reason. Forms that only ever succeed (delete, mark read) can keep plain `action=`.

## Server side of the same promise

- Save actions return `{ error }` for expected failures instead of throwing, so the form survives: validation, duplicate slug (Postgres `23505`, read from the Drizzle error's `cause`), and any failed database write.
- Textarea line breaks arrive as `\r\n` and are stored as `\n`.
- `saveSettings` merges over the stored value, so a settings key with no field on the form (e.g. `now`) is kept rather than wiped.
- Anything that still throws lands in `src/app/admin/error.tsx`, below the admin header, with a Try again button.

## Editor conveniences

- **Slug**: a new post's slug follows the title until you edit it. Emptying it goes back to following the title. A published post warns before its URL changes.
- **Markdown**: paste or drop images to upload them in place; Ctrl/Cmd+B, I, K for bold, italic and link (undo still works); live word count and reading time.
- **Counters** on the dek, SEO title and meta description show the soft limits search engines truncate at.
- **Site content**: socials, skills, education and "off the clock" are row editors instead of `a | b | c` text. They still post that same text, so `saveSettings` parsing is unchanged. Rows with an empty cell are flagged, because the server drops them.
- **Lists**: posts filter by All / Published / Drafts (`?status=`). Projects are grouped the way the site shows them, and "Add project here" opens a new project with that company preselected (`?company=<id>`).
