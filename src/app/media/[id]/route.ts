import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db, hasDb } from "@/db";
import { media } from "@/db/schema";

// Serves images uploaded from the admin (stored in the media table). An id never
// changes content, so browsers and CDNs may cache it forever.
export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!hasDb || !/^[A-Za-z0-9_-]{16}$/.test(id)) return new Response("Not found", { status: 404 });
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(row.data, "base64"), {
    headers: {
      "Content-Type": row.contentType,
      "Content-Length": String(row.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
