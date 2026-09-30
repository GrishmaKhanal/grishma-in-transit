import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { companies, messages, posts, projects } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { ADMIN } from "@/lib/admin-path";
import { LoginForm } from "./_components/forms";
import { StatusPill, title } from "./_components/ui";
import { DbNotice } from "./_nodb";
import { importStarterContent, refreshPublicPages } from "./actions";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ refreshed?: string }> }) {
  if (!(await isAdmin())) return <LoginForm />;

  const stats = hasDb
    ? await Promise.all([
        db.select({ n: count() }).from(posts),
        db.select({ n: count() }).from(companies),
        db.select({ n: count() }).from(projects),
        db.select({ n: count() }).from(messages).where(eq(messages.read, false)),
        db.select({ n: count() }).from(posts).where(eq(posts.published, false)),
      ]).then(([p, c, pr, m, d]) => ({ posts: p[0].n, companies: c[0].n, projects: pr[0].n, unread: m[0].n, drafts: d[0].n }))
    : { posts: 0, companies: 0, projects: 0, unread: 0, drafts: 0 };

  const [recentPosts, recentMessages] = hasDb
    ? await Promise.all([
        db.select().from(posts).orderBy(desc(posts.updatedAt)).limit(5),
        db.select().from(messages).orderBy(desc(messages.createdAt)).limit(3),
      ])
    : [[], []];

  const cards = [
    ["Posts", stats.posts, stats.drafts ? `${stats.drafts} draft${stats.drafts === 1 ? "" : "s"}` : null, "/posts", "/posts/new"],
    ["Companies", stats.companies, null, "/companies", "/companies/new"],
    ["Projects", stats.projects, null, "/projects", "/projects/new"],
    ["Unread messages", stats.unread, null, "/messages", null],
  ] as const;

  return (
    <>
      <DbNotice />
      {hasDb && stats.posts + stats.companies + stats.projects === 0 && (
        <form action={importStarterContent} className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-rule bg-[#faf9f6] p-4 text-sm">
          <span>The database is empty. Import the starter posts, work history and settings to get going.</span>
          <button className="cursor-pointer bg-ink px-4 py-2 text-paper">Import starter content</button>
        </form>
      )}
      <h1 className={`mb-6 ${title}`}>Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map(([label, n, note, href, add]) => (
          <div key={label} className="border border-rule bg-[#faf9f6] p-4 sm:p-5">
            <p className="text-sm text-ink-5">{label}</p>
            <p className="mt-1 text-3xl font-semibold">
              {n}
              {note && <span className="ml-2 font-mono text-xs font-normal text-ink-5">{note}</span>}
            </p>
            <div className="mt-3 flex gap-3 text-sm">
              <Link href={`${ADMIN}${href}`} className="underline">Manage</Link>
              {add && <Link href={`${ADMIN}${add}`} className="underline">New</Link>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="eyebrow border-b border-ink pb-3 text-ink-5">Recently edited</h2>
          {recentPosts.map((p) => (
            <Link key={p.id} href={`${ADMIN}/posts/${p.id}`} className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
              <span className="font-serif text-[17px]">{p.title}</span>
              <span className="flex flex-none items-center gap-3 font-mono text-xs text-ink-5">
                <StatusPill live={p.published} />
                {p.updatedAt.toISOString().slice(0, 10)}
              </span>
            </Link>
          ))}
          {!recentPosts.length && <p className="py-3 text-sm text-ink-5">No posts yet.</p>}
          <Link href={`${ADMIN}/posts/new`} className="mt-4 inline-block bg-ink px-4 py-2 text-sm text-paper hover:text-paper">
            Write a new post →
          </Link>
        </section>
        <section>
          <h2 className="eyebrow border-b border-ink pb-3 text-ink-5">Latest messages</h2>
          {recentMessages.map((m) => (
            <Link key={m.id} href={`${ADMIN}/messages`} className="block border-b border-rule py-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className={m.read ? "" : "font-semibold"}>{m.name}</span>
                <span className="font-mono text-xs text-ink-5">{m.createdAt.toISOString().slice(0, 10)}</span>
              </div>
              <p className="mt-1 line-clamp-1 font-serif text-[15px] text-ink-3">{m.body}</p>
            </Link>
          ))}
          {!recentMessages.length && <p className="py-3 text-sm text-ink-5">No messages yet.</p>}
        </section>
      </div>
      <p className="mt-8 text-sm text-ink-5">
        Saving publishes instantly: the page, lists, <a className="underline" href="/sitemap.xml">sitemap.xml</a> and{" "}
        <a className="underline" href="/blog/rss.xml">rss.xml</a> are regenerated on the next request.
      </p>
      <form action={refreshPublicPages} className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-5">
        <span>Changed the database outside the admin?</span>
        <button className="cursor-pointer border border-rule px-3 py-1 text-ink hover:border-ink">Refresh public pages</button>
        {(await searchParams).refreshed && <span className="text-green-800">Done. Public pages rebuild on their next visit.</span>}
      </form>
    </>
  );
}
