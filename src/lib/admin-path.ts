// The admin UI lives in src/app/admin, but that path is never served directly.
// src/proxy.ts rewrites the secret public path (ADMIN_PATH) onto it and 404s
// anything that asks for /admin itself. Unset ADMIN_PATH = admin disabled.
// Server-only by intent: never import this from a "use client" file, or the
// path gets inlined into a public JS bundle. Pass it down as a prop instead.
export const ADMIN_INTERNAL = "/admin";

export function normalizeAdminPath(raw: string | undefined): string | null {
  const p = raw?.trim().replace(/\/+$/, "");
  if (!p) return null;
  const withSlash = p.startsWith("/") ? p : `/${p}`;
  if (!/^\/[A-Za-z0-9\-_/]+$/.test(withSlash)) {
    throw new Error("ADMIN_PATH may only contain letters, numbers, '-', '_' and '/'.");
  }
  return withSlash;
}

/** Public admin URL prefix, e.g. "/studio-7f3k". null when ADMIN_PATH is unset. */
export const ADMIN_PUBLIC = normalizeAdminPath(process.env.ADMIN_PATH);

/** Prefix for links and redirects inside the admin. */
export const ADMIN = ADMIN_PUBLIC ?? ADMIN_INTERNAL;
