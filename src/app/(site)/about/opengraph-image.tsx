import { getSettings } from "@/lib/data";
import { ogCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "About Grishma Raj Khanal";

export default async function Image() {
  const s = await getSettings();
  return ogCard({ eyebrow: "About", title: s.aboutHeading, footer: `${s.name} · ${s.role}`, monogram: s.monogram });
}
