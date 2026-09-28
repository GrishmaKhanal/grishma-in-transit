// Static like the pages; admin saves expire the "posts" tag, which regenerates this.
export const dynamic = "force-static";

import { getPublishedPosts, getSettings } from "@/lib/data";
import { SITE_URL, abs, postPath } from "@/lib/site";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const [posts, s] = await Promise.all([getPublishedPosts(), getSettings()]);
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${abs(postPath(p))}</link>
      <guid isPermaLink="true">${abs(postPath(p))}</guid>
      ${p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : ""}
      <description>${esc(p.seoDescription || p.excerpt || p.subtitle || "")}</description>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(s.name)} - Writing</title>
    <link>${SITE_URL}</link>
    <description>${esc(s.seoDescription)}</description>
    <atom:link href="${abs("/blog/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
