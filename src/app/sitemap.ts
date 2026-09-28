import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data";
import { abs, postPath } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const latest = posts.reduce<Date | undefined>(
    (acc, x) => (!acc || x.updatedAt > acc ? x.updatedAt : acc),
    undefined,
  );

  const pages = ["", "/blog", "/work", "/about", "/contact", "/sitemap"].map((p) => ({
    url: abs(p || "/"),
    lastModified: latest,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  return [
    ...pages,
    ...posts.map((p) => ({
      url: abs(postPath(p)),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: p.coverImage ? [abs(p.coverImage)] : undefined,
    })),
  ];
}
