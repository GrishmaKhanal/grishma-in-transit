import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db, hasDb } from "@/db";
import { media } from "@/db/schema";

// Serves images uploaded from the admin (stored in the media table). An id never
// changes content, so browsers and CDNs may cache it forever.
// Misses are cached for a minute, so a burst of requests for a missing id reads
// the database once. New uploads get fresh random ids, so nothing real is hidden.
const notFound = () =>
  new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "public, max-age=60", "Netlify-CDN-Cache-Control": "public, max-age=60" },
  });

export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!hasDb || !/^[A-Za-z0-9_-]{16}$/.test(id)) return notFound();
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) return notFound();
  return new Response(Buffer.from(row.data, "base64"), {
    headers: {
      "Content-Type": row.contentType,
      "Content-Length": String(row.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      // Netlify's CDN: cache once for all edge locations, so each image reads the database once.
      "Netlify-CDN-Cache-Control": "public, max-age=31536000, durable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
