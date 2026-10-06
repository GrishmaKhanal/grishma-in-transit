"use server";

import { count, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb } from "@/db";
import { messages } from "@/db/schema";

// Site-wide, not per sender: the form stores no IPs. Well above a portfolio's real
// traffic, low enough that a script can't fill the database or the inbox.
const MAX_PER_HOUR = 20;

export type ContactState = { ok?: boolean; error?: string } | undefined;

const Input = z.object({
  name: z.string().trim().min(1, "Please add your name").max(120),
  email: z.string().trim().email("Please use a valid email").max(200),
  body: z.string().trim().min(5, "Message is too short").max(5000),
});

export async function sendMessage(_: ContactState, fd: FormData): Promise<ContactState> {
  // Honeypot: real users never fill this hidden field.
  if (String(fd.get("company") ?? "")) return { ok: true };
  const parsed = Input.safeParse({
    name: fd.get("name"),
    email: fd.get("email"),
    body: fd.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!hasDb) return { error: "Messages are not configured yet." };
  try {
    const [{ n }] = await db
      .select({ n: count() })
      .from(messages)
      .where(gt(messages.createdAt, sql`now() - interval '1 hour'`));
    if (n >= MAX_PER_HOUR) return { error: "Too many messages right now. Please try again later, or email me directly." };
    await db.insert(messages).values(parsed.data);
  } catch (e) {
    // Only the code: the error object can carry the message body or connection details.
    console.error("contact: insert failed", (e as { code?: string })?.code ?? "unknown");
    return { error: "Couldn't send that. Please try again, or email me directly." };
  }
  return { ok: true };
}
