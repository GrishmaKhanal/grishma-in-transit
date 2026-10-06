import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db, hasDb } from "@/db";
import { messages } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { deleteMessage, deleteMessages, toggleMessageRead } from "../actions";
import { ConfirmDelete } from "../_components/fields";
import { PageHeader } from "../_components/ui";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";

const PER_PAGE = 50;

const when = (d: Date) => `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;

export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await guard();
  const n = Number((await searchParams).page);
  const page = Number.isInteger(n) && n > 1 ? n : 1;
  const [rows, [{ total }], [{ unread }]] = hasDb
    ? await Promise.all([
        db.select().from(messages).orderBy(desc(messages.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
        db.select({ total: count() }).from(messages),
        db.select({ unread: count() }).from(messages).where(eq(messages.read, false)),
      ])
    : [[], [{ total: 0 }], [{ unread: 0 }]];
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (p: number) => `${ADMIN}/messages${p > 1 ? `?page=${p}` : ""}`;
  return (
    <>
      <DbNotice />
      <PageHeader actions={<span className="text-sm text-ink-5">{unread ? `${unread} unread` : "All read"}</span>}>Messages</PageHeader>
      {total > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-5">
          <span>
            {total} message{total === 1 ? "" : "s"}
          </span>
          <ConfirmDelete action={deleteMessages} fields={{ scope: "read" }} label="Delete all read" align="start" title="Delete every read message?" />
          <ConfirmDelete
            action={deleteMessages}
            fields={{ scope: "older", days: 90 }}
            label="Delete older than 90 days"
            align="start"
            title="Delete every message older than 90 days, read or not?"
          />
        </div>
      )}
      <ul className="space-y-3">
        {rows.map((m) => (
          <li key={m.id} className={`border bg-[#faf9f6] p-4 ${m.read ? "border-rule" : "border-l-4 border-ink border-l-accent"}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              {!m.read && <span className="bg-accent px-1.5 font-mono text-[11px] text-white">New</span>}
              <strong>{m.name}</strong>
              <a href={`mailto:${m.email}`} className="break-all text-ink-5 hover:underline">
                {m.email}
              </a>
              <span className="ml-auto font-mono text-xs text-ink-5">{when(m.createdAt)}</span>
            </div>
            <p className="mt-2 font-serif text-[15px] leading-relaxed whitespace-pre-wrap">{m.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your note")}`} className="bg-ink px-3 py-1 text-paper hover:text-paper">
                Reply by email
              </a>
              <form action={toggleMessageRead}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="read" value={String(!m.read)} />
                <input type="hidden" name="page" value={page} />
                <button className="cursor-pointer underline">{m.read ? "Mark unread" : "Mark read"}</button>
              </form>
              <ConfirmDelete action={deleteMessage} id={m.id} fields={{ page }} align="start" title={`Delete the message from ${m.name}?`} />
            </div>
          </li>
        ))}
        {!rows.length && <li className="text-sm text-ink-5">{page > 1 ? "Nothing on this page." : "No messages yet. Notes sent from /contact land here."}</li>}
      </ul>
      {pages > 1 && (
        <nav aria-label="Inbox pages" className="mt-6 flex items-center gap-4 text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="underline">Newer</Link> : <span className="text-ink-5">Newer</span>}
          <span className="text-ink-5">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={href(page + 1)} className="underline">Older</Link> : <span className="text-ink-5">Older</span>}
        </nav>
      )}
    </>
  );
}
