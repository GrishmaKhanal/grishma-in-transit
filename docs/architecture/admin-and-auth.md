# Admin URL and auth

## The secret admin URL (`ADMIN_PATH`)

The admin screens live in `src/app/admin/`, but **nobody reaches them at `/admin`**. You choose the public URL in an env var:

```sh
ADMIN_PATH=/studio-7f3k2a     # anything you like; letters, numbers, - _ /
```

`src/proxy.ts` then does this on every request:

| Request | Result |
|---|---|
| `$ADMIN_PATH` | Login form (or the dashboard if you're signed in) |
| `$ADMIN_PATH/posts`, `/settings`, … | Rewritten internally to `/admin/...`. Without a valid session it redirects to `$ADMIN_PATH`. |
| `/admin`, `/admin/*` | **The site's normal 404**, even with a valid session. It's indistinguishable from any unknown URL. |
| anything else | Passes through untouched |
| `ADMIN_PATH` unset | The admin is disabled; everything under `/admin` 404s |

All admin responses carry `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`. The path is deliberately **not** listed in `robots.txt`, because that would advertise it.

The browser URL bar keeps showing `$ADMIN_PATH/...`. Links and redirects inside the admin are built from `ADMIN` in `src/lib/admin-path.ts`.

### Keeping it secret

- The value is read on the server only. The client nav receives it as a prop from the server layout, so it's **not inlined into the public JS bundles**. This was verified: a production build contains no occurrence of the path under `.next/static`.
- Don't import `@/lib/admin-path` from a `"use client"` file, and don't rename it to `NEXT_PUBLIC_ADMIN_PATH`. Either would put it in public JS.
- It will appear in your own browser history and in Vercel's request logs. That's fine.
- To rotate it, change the env var in Vercel and redeploy. Old bookmarks start returning 404.

### Choosing a value

```sh
echo "/studio-$(openssl rand -hex 4)"
```

Avoid anything a scanner would try: `/admin`, `/login`, `/dashboard`, `/wp-admin`, `/cms`, and your name.

## Is obscurity enough?

For a single-author portfolio, **a hidden URL plus a password is a reasonable setup**, and it isn't *only* obscurity. The layers are:

1. **Unguessable URL.** Automated scanners and casual visitors never find the login form.
2. **Username + password.** `ADMIN_USERNAME` (case-insensitive) and `ADMIN_PASSWORD` are both required. Each is hashed and compared in constant time, both checks always run (timing doesn't reveal which field was wrong), the error never says which one it was, and each failed attempt waits 800 ms. If either env var is unset, login is disabled.
3. **Signed session.** An HS256 JWT in an `httpOnly`, `sameSite=lax` cookie (`secure` in production). It lasts 7 days and is signed with `SESSION_SECRET`.
4. **Checked twice.** Once in the proxy and again in every Server Action and page (`requireAdmin()`, `guard()`). A proxy mistake alone doesn't expose writes.

What it doesn't have, and when you'd want it:

- **No lockout or rate limit** beyond the 800 ms delay. With a long random password that's fine. If you ever reuse a weak password, add Vercel Firewall rate limiting on `$ADMIN_PATH`.
- **No per-user accounts or 2FA.** Add a real auth provider if a second editor ever needs access.
- **No per-session revocation.** Changing `SESSION_SECRET` logs everyone out immediately.

## Sessions

| Action | How |
|---|---|
| Log in | Username + password form at `$ADMIN_PATH`, which sets the `admin_session` cookie |
| Log out | Button in the admin header, which deletes the cookie |
| Force everyone out | Rotate `SESSION_SECRET` in Vercel and redeploy |
| Change username or password | Change `ADMIN_USERNAME` / `ADMIN_PASSWORD` in Vercel and redeploy. Existing sessions stay valid until they expire or you rotate `SESSION_SECRET`. |
