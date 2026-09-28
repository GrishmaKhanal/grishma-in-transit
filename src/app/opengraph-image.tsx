import { getSettings } from "@/lib/data";
import { ogCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Grishma Raj Khanal — Software Engineer";

export default async function Image() {
  const s = await getSettings();
  return ogCard({ eyebrow: s.heroEyebrow, title: s.heroHeadline, footer: `${s.name} · ${s.role}`, monogram: s.monogram });
}
