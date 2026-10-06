import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import "dotenv/config";
import pg from "pg";

// Creates a throwaway database next to the local one (.env DATABASE_URL), runs the
// real migrations + seed into it, and exercises the queries the site depends on.
// Skipped when there's no reachable local Postgres. Never touches Neon.
const base = process.env.DATABASE_URL;
const local = !!base && /localhost|127\.0\.0\.1/.test(base);
const name = `test_${randomBytes(4).toString("hex")}`;
const testUrl = base ? base.replace(/\/[^/?]+(\?|$)/, `/${name}$1`) : "";

let reachable = false;
before(async () => {
  if (!local) return;
  const c = new pg.Client({ connectionString: base, connectionTimeoutMillis: 3000 });
  try {
    await c.connect();
    await c.query(`create database ${name}`);
    reachable = true;
  } catch {
    // leave reachable = false → tests skip
  } finally {
    await c.end().catch(() => {});
  }
});

after(async () => {
  if (!reachable) return;
  const c = new pg.Client(base);
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

const env = () => ({ ...process.env, DATABASE_URL: testUrl, DATABASE_URL_UNPOOLED: "" });
const npx = (...args: string[]) => spawnSync("npx", args, { env: env(), encoding: "utf8" });

test("migrations apply to an empty database and are idempotent", (t) => {
  if (!reachable) return t.skip("no local Postgres (run: sudo systemctl start postgresql)");
  assert.equal(npx("drizzle-kit", "migrate").status, 0, "first migrate");
  assert.equal(npx("drizzle-kit", "migrate").status, 0, "second migrate is a no-op");
});

test("seed runs twice without duplicating rows", async (t) => {
  if (!reachable) return t.skip("no local Postgres");
  assert.equal(npx("tsx", "scripts/seed.ts").status, 0);
  const c = new pg.Client(testUrl);
  await c.connect();
  const count = async () => (await c.query("select (select count(*) from posts)::int p, (select count(*) from companies)::int c")).rows[0];
  const first = await count();
  assert.equal(npx("tsx", "scripts/seed.ts").status, 0);
  assert.deepEqual(await count(), first);
  await c.end();
});

test("an uploaded image is stored in Postgres and served from /media/[id]", async (t) => {
  if (!reachable) return t.skip("no local Postgres");
  process.env.DATABASE_URL = testUrl; // src/db reads it at import
  const { db } = await import("../src/db");
  const { media } = await import("../src/db/schema");
  const { GET } = await import("../src/app/media/[id]/route");
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
  const id = randomBytes(12).toString("base64url");
  await db.insert(media).values({ id, contentType: "image/png", size: png.length, data: png.toString("base64") });
  const get = (i: string) => GET(new Request(`http://x/media/${i}`) as never, { params: Promise.resolve({ id: i }) });

  const res = await get(id);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/png");
  assert.match(res.headers.get("cache-control")!, /immutable/);
  assert.match(res.headers.get("content-security-policy")!, /sandbox/);
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), png);
  assert.equal((await get("A".repeat(16))).status, 404, "unknown id");
  assert.equal((await get("../../etc/passwd")).status, 404, "malformed id");
});

test("the contact form stores a message, then refuses once the hourly cap is reached", async (t) => {
  if (!reachable) return t.skip("no local Postgres");
  process.env.DATABASE_URL = testUrl; // src/db reads it at import
  const { db } = await import("../src/db");
  const { messages } = await import("../src/db/schema");
  const { sendMessage } = await import("../src/app/actions/contact");
  const form = (extra: Record<string, string> = {}) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ name: "Test", email: "t@example.com", body: "Hello there", ...extra })) fd.set(k, v);
    return fd;
  };

  await db.delete(messages);
  assert.deepEqual(await sendMessage(undefined, form()), { ok: true });
  await db.insert(messages).values(Array.from({ length: 19 }, () => ({ name: "x", email: "x@example.com", body: "filler" })));
  const r = await sendMessage(undefined, form());
  assert.match(r?.error ?? "", /Too many messages/);
  // Old messages don't count toward the cap.
  await db.update(messages).set({ createdAt: new Date(Date.now() - 2 * 3600_000) });
  assert.deepEqual(await sendMessage(undefined, form()), { ok: true });
  await db.delete(messages);
});

test("the site's settings and posts queries succeed", async (t) => {
  if (!reachable) return t.skip("no local Postgres");
  process.env.DATABASE_URL = testUrl; // src/db reads it at import
  const { db } = await import("../src/db");
  const { settings, posts } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  // The exact query from src/lib/data.ts _getSettings (the one that failed).
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "site") });
  assert.ok(row, "settings row 'site' exists after seed");
  assert.equal(typeof row.value.name, "string");
  const published = await db.select().from(posts).where(eq(posts.published, true));
  assert.ok(published.length > 0, "seed has published posts");
  await (db as unknown as { $client: { end?: () => Promise<void> } }).$client.end?.();
});
