import type { MetadataRoute } from "next";
import { getPublishedPosts, getSettingsUpdatedAt, getWork } from "@/lib/data";
import { abs, postPath } from "@/lib/site";

const newest = (...dates: (Date | null | undefined)[]) =>
  dates.reduce<Date | undefined>((acc, d) => (d && (!acc || d > acc) ? d : acc), undefined);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, work, { updatedAt: copyAt }] = await Promise.all([getPublishedPosts(), getWork(), getSettingsUpdatedAt()]);
  const postsAt = newest(...posts.map((p) => p.updatedAt));
  const workAt = newest(
    ...work.companies.flatMap((c) => [c.updatedAt, ...c.projects.map((p) => p.updatedAt)]),
    ...work.side.map((p) => p.updatedAt),
  );

  // lastmod is each page's own last change. Google stops trusting lastmod on a site
  // where it's often wrong, and then can't tell which posts to recrawl. The site
  // copy (settings) feeds every page's intro, so a settings save counts for all.
  const pages: [string, Date | undefined][] = [
    ["/", newest(postsAt, workAt, copyAt)],
    ["/blog", newest(postsAt, copyAt)],
    ["/work", newest(workAt, copyAt)],
    ["/about", newest(copyAt)],
    ["/contact", newest(copyAt)],
    ["/sitemap", newest(postsAt, workAt)],
  ];

  return [
    ...pages.map(([path, lastModified]) => ({
      url: abs(path),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...posts.map((p) => ({
      url: abs(postPath(p)),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: p.coverImage ? [abs(p.coverImage)] : undefined,
    })),
  ];
}
