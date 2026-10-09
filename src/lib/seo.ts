import type { Metadata } from "next";
import type { SiteSettings } from "@/db/schema";
import { abs } from "./site";

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

/* ---------- structured data (JSON-LD) ---------- */

// One id per entity, so every page's JSON-LD points at the same person and site
// instead of describing a new one each time. The home page is their home.
export const PERSON_ID = abs("/#person");
export const WEBSITE_ID = abs("/#website");

/** "Grishma Raj Khanal" → "Grishma Khanal": how people often search for a full name. */
export function shortName(name: string): string | undefined {
  const parts = name.trim().split(/\s+/);
  return parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : undefined;
}

type PersonFields = Pick<
  SiteSettings,
  "name" | "role" | "location" | "countryCode" | "worksFor" | "alumniOf" | "socials" | "aboutPhoto"
>;

/** The full Person, described once on the home page. Other pages use personRef. */
export function personLd(s: PersonFields) {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: s.name,
    alternateName: shortName(s.name),
    url: abs("/"),
    jobTitle: s.role,
    image: s.aboutPhoto ? abs(s.aboutPhoto) : undefined,
    worksFor: s.worksFor ? { "@type": "Organization", name: s.worksFor } : undefined,
    alumniOf: s.alumniOf || undefined,
    address: { "@type": "PostalAddress", addressLocality: s.location, addressCountry: s.countryCode },
    sameAs: s.socials.map((x) => x.url).filter((u) => u.startsWith("http")),
  };
}

export const personRef = (s: Pick<SiteSettings, "name">) => ({ "@type": "Person", "@id": PERSON_ID, name: s.name, url: abs("/") });

/**
 * Home page graph: the WebSite (Google takes the site name shown in results from
 * it) and a ProfilePage whose main entity is the person, so a search for their
 * name lands on the home page rather than /about.
 */
export function homeLd(s: PersonFields & Who) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: abs("/"),
        name: s.name,
        alternateName: shortName(s.name),
        inLanguage: "en",
        publisher: { "@id": PERSON_ID },
      },
      {
        "@type": "ProfilePage",
        "@id": abs("/#webpage"),
        url: abs("/"),
        name: siteTitle(s),
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: personLd(s),
      },
    ],
  };
}

/** Any other page: what it's about, tied to the same site and person. */
export function pageLd(s: Pick<SiteSettings, "name">, { type, path, name }: { type: string; path: string; name: string }) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    url: abs(path),
    name,
    isPartOf: { "@id": WEBSITE_ID },
    about: personRef(s),
  };
}
