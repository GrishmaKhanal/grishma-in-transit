"use server";

import { z } from "zod";
import { db, hasDb } from "@/db";
import { messages } from "@/db/schema";

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
  await db.insert(messages).values(parsed.data);
  return { ok: true };
}
