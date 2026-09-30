import { desc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { messages } from "@/db/schema";
import { deleteMessage, toggleMessageRead } from "../actions";
import { ConfirmDelete } from "../_components/fields";
import { PageHeader } from "../_components/ui";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";

const when = (d: Date) => `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;

export default async function MessagesAdmin() {
  await guard();
  const rows = hasDb ? await db.select().from(messages).orderBy(desc(messages.createdAt)) : [];
  const unread = rows.filter((m) => !m.read).length;
  return (
    <>
      <DbNotice />
      <PageHeader actions={<span className="text-sm text-ink-5">{unread ? `${unread} unread` : "All read"}</span>}>Messages</PageHeader>
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
                <button className="cursor-pointer underline">{m.read ? "Mark unread" : "Mark read"}</button>
              </form>
              <ConfirmDelete action={deleteMessage} id={m.id} align="start" title={`Delete the message from ${m.name}?`} />
            </div>
          </li>
        ))}
        {!rows.length && <li className="text-sm text-ink-5">No messages yet. Notes sent from /contact land here.</li>}
      </ul>
    </>
  );
}
