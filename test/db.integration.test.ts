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
  if (!reachable) return t.skip("no local Postgres (run: podman start portfolio-pg)");
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
