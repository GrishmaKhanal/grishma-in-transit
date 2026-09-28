export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const abs = (path: string) => (/^https?:/.test(path) ? path : `${SITE_URL}${path}`);

export const postPath = (p: { kind: string; slug: string }) =>
  `/${p.kind === "note" ? "notes" : "blog"}/${p.slug}`;
