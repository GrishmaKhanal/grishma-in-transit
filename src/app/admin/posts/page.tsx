import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { posts } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { postPath } from "@/lib/site";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { Filters, PageHeader, StatusPill, newBtn } from "../_components/ui";

export default async function PostsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await guard();
  const { status = "all" } = await searchParams;
  const all = hasDb
    ? await db
        .select({ id: posts.id, title: posts.title, slug: posts.slug, kind: posts.kind, published: posts.published, updatedAt: posts.updatedAt })
        .from(posts)
        .orderBy(desc(posts.updatedAt))
    : [];
  const live = all.filter((p) => p.published);
  const drafts = all.filter((p) => !p.published);
  const rows = status === "live" ? live : status === "draft" ? drafts : all;

  return (
    <>
      <DbNotice />
      <PageHeader actions={<Link href={`${ADMIN}/posts/new`} className={newBtn}>New post</Link>}>Posts</PageHeader>
      <Filters
        current={status}
        items={[
          ["all", "All", all.length, `${ADMIN}/posts`],
          ["live", "Published", live.length, `${ADMIN}/posts?status=live`],
          ["draft", "Drafts", drafts.length, `${ADMIN}/posts?status=draft`],
        ]}
      />
      <div className="border-t border-ink">
        {rows.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 border-b border-rule py-3 sm:grid-cols-[minmax(0,1fr)_80px_96px_56px]"
          >
            <Link href={`${ADMIN}/posts/${p.id}`} className="group min-w-0">
              <div className="truncate font-medium group-hover:underline">{p.title}</div>
              <div className="truncate font-mono text-xs text-ink-5">{postPath(p)}</div>
            </Link>
            <StatusPill live={p.published} />
            <span className="hidden font-mono text-xs text-ink-5 sm:block">{p.updatedAt.toISOString().slice(0, 10)}</span>
            <span className="hidden text-right text-sm sm:block">
              {p.published && (
                <a href={postPath(p)} target="_blank" className="text-ink-5 hover:underline">
                  View ↗
                </a>
              )}
            </span>
          </div>
        ))}
        {!rows.length && (
          <p className="py-6 text-sm text-ink-5">
            {status === "draft" ? "No drafts." : "No posts yet."}{" "}
            <Link href={`${ADMIN}/posts/new`} className="underline">
              Write one
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
