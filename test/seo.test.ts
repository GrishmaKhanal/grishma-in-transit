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
