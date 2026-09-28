import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { posts } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";

export default async function PostsAdmin() {
  await guard();
  const rows = hasDb ? await db.select().from(posts).orderBy(desc(posts.updatedAt)) : [];
  return (
    <>
      <DbNotice />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-[40px] leading-none font-bold tracking-[-.02em]">Posts</h1>
        <Link href={`${ADMIN}/posts/new`} className=" bg-ink px-4 py-2 text-sm text-paper hover:text-paper">
          New post
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-ink-5">
          <tr><th className="py-2">Title</th><th>Type</th><th>Status</th><th>Updated</th><th /></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-rule">
              <td className="py-2">
                <Link href={`${ADMIN}/posts/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                <div className="font-mono text-xs text-ink-5">/{p.kind === "note" ? "notes" : "blog"}/{p.slug}</div>
              </td>
              <td>{p.kind}</td>
              <td>{p.published ? "Published" : "Draft"}</td>
              <td>{p.updatedAt.toISOString().slice(0, 10)}</td>
              <td className="text-right">
                {p.published && (
                  <a href={`/${p.kind === "note" ? "notes" : "blog"}/${p.slug}`} target="_blank" className="text-ink-5 hover:underline">View ↗</a>
                )}
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="py-6 text-ink-5">No posts yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
