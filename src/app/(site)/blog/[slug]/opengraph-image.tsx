import { getPublishedPost, getSettings } from "@/lib/data";
import { postEyebrow } from "@/lib/format";
import { ogCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Article cover";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [p, s] = await Promise.all([getPublishedPost("blog", (await params).slug), getSettings()]);
  return ogCard({
    eyebrow: p ? postEyebrow(p) : "Writing",
    title: p?.title ?? s.name,
    footer: `${s.name} · Writing`,
    monogram: s.monogram,
  });
}
