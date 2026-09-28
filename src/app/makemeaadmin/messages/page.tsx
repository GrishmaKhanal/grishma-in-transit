import { desc } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { messages } from "@/db/schema";
import { deleteMessage, toggleMessageRead } from "../actions";
import { ConfirmDelete } from "../_components/fields";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";

export default async function MessagesAdmin() {
  await guard();
  const rows = hasDb ? await db.select().from(messages).orderBy(desc(messages.createdAt)) : [];
  return (
    <>
      <DbNotice />
      <h1 className="mb-6 font-serif text-[40px] leading-none font-bold tracking-[-.02em]">Messages</h1>
      <ul className="space-y-3">
        {rows.map((m) => (
          <li key={m.id} className={` border p-4 ${m.read ? "border-rule" : "border-ink"} bg-[#faf9f6]`}>
            <div className="flex flex-wrap items-baseline gap-2 text-sm">
              <strong>{m.name}</strong>
              <span className="text-ink-5">{m.email}</span>
              <span className="ml-auto text-ink-5">{m.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{m.body}</p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <form action={toggleMessageRead}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="read" value={String(!m.read)} />
                <button className="underline">{m.read ? "Mark unread" : "Mark read"}</button>
              </form>
              <ConfirmDelete action={deleteMessage} id={m.id} />
            </div>
          </li>
        ))}
        {!rows.length && <li className="text-sm text-ink-5">No messages yet.</li>}
      </ul>
    </>
  );
}
