import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

const fonts = async () => {
  const [serif, mono] = await Promise.all([
    readFile(join(process.cwd(), "assets/SourceSerif4-Bold.ttf")),
    readFile(join(process.cwd(), "assets/GeistMono-Medium.ttf")),
  ]);
  return [
    { name: "Serif", data: serif, weight: 700 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
};

/** Social card in the site's paper/ink/accent style. */
export async function ogCard({ eyebrow, title, footer, monogram }: { eyebrow: string; title: string; footer: string; monogram: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f1f0ec", color: "#111111" }}>
        <div style={{ display: "flex", height: 96, borderBottom: "2px solid #111111" }}>
          <div style={{ width: 110, background: "#111111", color: "#f1f0ec", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Serif", fontSize: 36 }}>
            {monogram}
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "0 36px", fontFamily: "Mono", fontSize: 22, color: "#55554f" }}>{footer}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: "0 80px" }}>
          <div style={{ fontFamily: "Serif", fontSize: 30, color: "#c52f15" }}>{eyebrow}</div>
          <div style={{ fontFamily: "Serif", fontSize: title.length > 48 ? 64 : 80, lineHeight: 1.05, letterSpacing: "-0.02em", marginTop: 20 }}>{title}</div>
        </div>
        <div style={{ height: 18, background: "#c52f15" }} />
      </div>
    ),
    { ...ogSize, fonts: await fonts() },
  );
}
