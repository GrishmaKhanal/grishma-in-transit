# Do we need a separate backend?

**No.** The site is a single Next.js 16 app, and that's the right shape for it. It already has a frontend and a backend. They just ship as one deployable instead of two.

## What "one app" means here

```
                  ┌──────────────────── one Next.js app, any Node host ───────────────────┐
 browser ──HTTP──▶│ src/proxy.ts ──▶ pages (React Server Components) ──▶ src/lib/data.ts ──┼──▶ Postgres
                  │                  forms ──▶ Server Actions ("use server") ──▶ src/db ────┼──▶ (images: media table)
                  └────────────────────────────────────────────────────────────────────────┘
```

- **Frontend** is the HTML and the small amount of client JS (`"use client"` components) that the browser receives.
- **Backend** is code that only ever runs on the server: Server Components, Server Actions, the proxy, and everything under `src/db` and `src/lib`. The browser never gets the database driver, the connection string, or the admin password. `import "server-only"` in `src/lib/data.ts` and `src/lib/auth.ts` makes the build fail if a client component tries to import them.

So the split you'd get from a separate API server already exists. It's enforced by the framework and the bundler rather than by a network hop. See [frontend-backend.md](frontend-backend.md) for the file-by-file version.

## Why not split it

| A separate backend would give you | What it costs here |
|---|---|
| An HTTP API other clients can call | Nothing else calls it. The only client is this site. |
| Independent scaling | Traffic is a portfolio's. Serverless hosts already scale functions per route. |
| Independent deploys | Two deploys that have to agree on an API contract. Today one `git push` ships the schema, the queries and the UI together. |
| Language freedom | Everything is TypeScript. Drizzle types flow from `schema.ts` into the pages with no API layer to keep in sync. |

You'd also take on CORS, a second hosting bill, API auth between the two, and pages that fetch over HTTP instead of querying directly, which is slower and harder to cache.

## When it *would* be worth splitting

Revisit this if any of these become true:

1. **Another client needs the data**, for example a mobile app or a third-party integration. Start by adding Route Handlers (`src/app/api/.../route.ts`) in this same app. Move to a separate service only if they outgrow it.
2. **Long-running or scheduled work** that doesn't fit a request (big imports, heavy image processing, email queues). Use a scheduled function or a queue worker for that one job, and keep the site as is.
3. **Several people own different halves** and need separate release cycles.

Even then, the database layer (`src/db/schema.ts` plus `drizzle/`) should stay the single source of truth for the schema, owned by whichever service runs migrations.
