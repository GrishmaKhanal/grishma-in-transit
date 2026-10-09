import { test } from "node:test";
import assert from "node:assert/strict";
import { pageMetadata, siteTitle } from "../src/lib/seo";

const s = { name: "Ada", role: "Engineer", location: "Kathmandu" };
const og = (m: ReturnType<typeof pageMetadata>) => m.openGraph as Record<string, unknown>;

test("a page gets its own title, url and description everywhere, plus the feed link", () => {
  const m = pageMetadata(s, { title: "Writing", description: "Notes", path: "/blog" });
  assert.equal(m.title, "Writing");
  assert.deepEqual(m.alternates?.canonical, "/blog");
  assert.ok(m.alternates?.types?.["application/rss+xml"], "feed link survives the page's own alternates");
  assert.equal(og(m).title, "Writing - Ada");
  assert.equal(og(m).url, "/blog");
  assert.equal(og(m).siteName, "Ada");
  assert.equal(og(m).description, "Notes");
  assert.equal((m.twitter as Record<string, unknown>).title, "Writing - Ada");
});

test("the home page falls back to the site title and keeps the layout's <title>", () => {
  const m = pageMetadata(s, { description: "Hi", path: "/" });
  assert.equal(m.title, undefined);
  assert.equal(og(m).title, siteTitle(s));
});

test("pages without their own card get the site card; pages with one don't get a second", () => {
  const images = (m: ReturnType<typeof pageMetadata>) => og(m).images as { url: string }[] | undefined;
  assert.equal(images(pageMetadata(s, { path: "/work" }))?.[0].url, "/opengraph-image");
  assert.equal(images(pageMetadata(s, { path: "/about", ownImage: true })), undefined);
});

test("openGraph overrides win, and set the social title", () => {
  const m = pageMetadata(s, { title: "Post", path: "/blog/x", openGraph: { type: "article", title: "Post" }, ownImage: true });
  assert.equal(og(m).type, "article");
  assert.equal(og(m).title, "Post");
  assert.equal((m.twitter as Record<string, unknown>).title, "Post");
});

test("shortName drops middle names, and only when there are some", async () => {
  const { shortName } = await import("../src/lib/seo");
  assert.equal(shortName("Grishma Raj Khanal"), "Grishma Khanal");
  assert.equal(shortName("  Ada  King  Lovelace "), "Ada Lovelace");
  assert.equal(shortName("Ada Lovelace"), undefined);
});

test("the home page graph declares the site and makes the person its main entity", async () => {
  const { homeLd, PERSON_ID, WEBSITE_ID } = await import("../src/lib/seo");
  const g = homeLd({ ...s, name: "Ada King Lovelace", countryCode: "NP", worksFor: "", alumniOf: "", socials: [{ label: "GitHub", handle: "ada", url: "https://github.com/ada" }], aboutPhoto: "" })["@graph"];
  const site = g.find((n) => n["@type"] === "WebSite")!;
  const page = g.find((n) => n["@type"] === "ProfilePage") as { mainEntity: Record<string, unknown> };
  assert.equal(site["@id"], WEBSITE_ID);
  assert.equal(site.name, "Ada King Lovelace");
  assert.equal(page.mainEntity["@id"], PERSON_ID);
  assert.equal(page.mainEntity.alternateName, "Ada Lovelace");
  assert.deepEqual(page.mainEntity.sameAs, ["https://github.com/ada"]);
});
