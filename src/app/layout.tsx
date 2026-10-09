import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { feedLink, siteTitle } from "@/lib/seo";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500"] });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], axes: ["opsz"] });

export const viewport: Viewport = { themeColor: "#f1f0ec" };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = siteTitle(s);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s - ${s.name}` },
    description: s.seoDescription,
    authors: [{ name: s.name, url: SITE_URL }],
    creator: s.name,
    // Canonical is set per page - never globally, or every page claims to be "/".
    // Public pages build their full set with pageMetadata (src/lib/seo.ts); these
    // defaults cover the rest (404s, error pages).
    alternates: { types: feedLink(s) },
    openGraph: { type: "website", siteName: s.name, title, description: s.seoDescription },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
