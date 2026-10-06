import "server-only";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";

/**
 * Page-level guard (the proxy also guards, this is defence in depth). It 404s
 * rather than redirecting, so a request that slipped past the proxy never gets
 * the secret admin path back in a Location header.
 */
export async function guard() {
  if (!(await isAdmin())) notFound();
}

