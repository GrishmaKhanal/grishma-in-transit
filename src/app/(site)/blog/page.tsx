import type { Metadata } from "next";
import { PageIntro } from "@/components/chrome";
import { WritingList } from "@/components/WritingList";
import { getPublishedPosts, getSettings } from "@/lib/data";
import { postNo, readMin } from "@/lib/format";
import { postPath } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMetadata(s, { title: "Writing", description: s.writingIntro, path: "/blog" });
}

export default async function Writing() {
  const [s, posts] = await Promise.all([getSettings(), getPublishedPosts()]);

  // Tags ordered by how often they're used.
  const counts = new Map<string, number>();
  posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  const tags = [...counts].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 8);

  return (
    <div className="wrap">
      <PageIntro title="Writing" intro={s.writingIntro} />
      <WritingList
        tags={tags}
        items={posts.map((p) => ({
          id: p.id,
          href: postPath(p),
          no: postNo(p),
          title: p.title,
          dek: p.excerpt ?? "",
          tag: p.kind === "note" ? "Note" : (p.tags[0] ?? ""),
          read: readMin(p),
          tags: p.tags,
        }))}
      />
      <div className="flex flex-wrap justify-between gap-3 pt-7 pb-12 font-serif text-base text-ink-5">
        <span>More in the drafts folder.</span>
        <a href="/blog/rss.xml" className="font-sans text-[13px] font-medium text-ink">
          RSS feed
        </a>
      </div>
    </div>
  );
}
