import { getPublishedPost, getSettings } from "@/lib/data";
import { postEyebrow } from "@/lib/format";
import { ogCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Article cover";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [p, s] = await Promise.all([getPublishedPost("blog", (await params).slug), getSettings()]);
  // No card for drafts or unknown slugs: rendering one costs CPU per junk URL.
  if (!p) return new Response("Not found", { status: 404 });
  return ogCard({
    eyebrow: postEyebrow(p),
    title: p.title,
    footer: `${s.name} · Writing`,
    monogram: s.monogram,
  });
}
