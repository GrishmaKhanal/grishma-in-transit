import "server-only";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ADMIN } from "@/lib/admin-path";

/** Page-level guard (the proxy also guards, this is defence in depth). */
export async function guard() {
  if (!(await isAdmin())) redirect(ADMIN);
}

