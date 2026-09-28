// Public origin of the site, e.g. https://grishmakhanal.com.np. Sitemap, RSS,
// canonical tags, JSON-LD and OG images need absolute URLs, and the server can't
// know its public domain on its own. Server-only (no NEXT_PUBLIC_ prefix).
export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const abs = (path: string) => (/^https?:/.test(path) ? path : `${SITE_URL}${path}`);

export const postPath = (p: { kind: string; slug: string }) =>
  `/${p.kind === "note" ? "notes" : "blog"}/${p.slug}`;
