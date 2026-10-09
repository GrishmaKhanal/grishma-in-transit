import type { Metadata } from "next";
import type { SiteSettings } from "@/db/schema";

type Who = Pick<SiteSettings, "name" | "role" | "location">;
type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The home page's title, and the fallback for any page without its own. */
export const siteTitle = (s: Who) => `${s.name} - ${s.role} in ${s.location}`;

/** RSS discovery link. Every page repeats it, because a page's `alternates` replaces the layout's. */
export const feedLink = (s: Pick<SiteSettings, "name">) => ({
  "application/rss+xml": [{ url: "/blog/rss.xml", title: `${s.name} - Writing` }],
});

/**
 * Complete metadata for a public page. Next merges layout and page metadata
 * shallowly: a page that sets `alternates` or `openGraph` replaces the layout's
 * whole object, which once left /blog, /work and /contact sharing the home
 * page's og:title and dropped the feed link everywhere. So every field is
 * built here, each time. `openGraph` overrides the defaults (e.g. type, title).
 *
 * Setting `openGraph` also drops the site card from src/app/opengraph-image.tsx,
 * so it's added back here, unless the page has its own opengraph-image file
 * (`ownImage`), which Next adds by itself.
 */
export function pageMetadata(
  s: Who,
  {
    title,
    description,
    path,
    openGraph = {},
    ownImage = false,
  }: { title?: string; description?: string; path: string; openGraph?: OpenGraph; ownImage?: boolean },
): Metadata {
  const social = (openGraph.title as string | undefined) ?? (title ? `${title} - ${s.name}` : siteTitle(s));
  const card = { url: "/opengraph-image", width: 1200, height: 630, alt: siteTitle(s) };
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path, types: feedLink(s) },
    openGraph: {
      type: "website",
      siteName: s.name,
      url: path,
      title: social,
      description,
      ...(!ownImage && { images: [card] }),
      ...openGraph,
    } as OpenGraph,
    twitter: { card: "summary_large_image", title: social, description, ...(!ownImage && { images: [card] }) },
  };
}
