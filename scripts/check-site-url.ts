// Runs before `next build` (see the `build` script). SITE_URL is baked into canonical
// tags, the sitemap, robots.txt and social cards, and a wrong value fails silently:
// production once shipped every canonical pointing at the netlify.app subdomain.
// Netlify sets CONTEXT=production for production builds; other builds only warn.
const raw = process.env.SITE_URL ?? "";
const production = process.env.CONTEXT === "production";

function problem(): string | null {
  if (!raw) return "SITE_URL is not set";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return `SITE_URL is not a URL: ${raw}`;
  }
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return `SITE_URL points at ${url.hostname}`;
  if (url.hostname.endsWith(".netlify.app")) return `SITE_URL is the Netlify subdomain (${url.hostname}), not the real domain`;
  if (url.protocol !== "https:") return `SITE_URL is not https: ${raw}`;
  return null;
}

const p = problem();
if (!p) {
  console.log(`site-url: ${raw}`);
} else if (production) {
  console.error(`site-url: ${p}. Set SITE_URL for the Production context (e.g. https://grishmakhanal.com.np) and redeploy.`);
  process.exit(1);
} else {
  console.log(`site-url: ${p} (fine outside production).`);
}
