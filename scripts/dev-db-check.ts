import "dotenv/config";
import { readFileSync } from "node:fs";
import pg from "pg";

// Runs before `npm run dev`. A stopped local Postgres otherwise surfaces as an
// opaque "Failed query: select ... from settings" error on the first page load.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("db-check: no DATABASE_URL, the site will serve seed content read-only.");
    return;
  }
  const where = url.replace(/\/\/[^@]*@/, "//"); // drop credentials from output
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 3000 });
  try {
    await client.connect();
  } catch (e) {
    const code = (e as { code?: string }).code ?? (e as Error).message;
    console.error(`\ndb-check: can't reach the database at ${where} (${code}).`);
    if (/localhost|127\.0\.0\.1/.test(url)) console.error("  Start it:  podman start portfolio-pg");
    console.error("  Or clear DATABASE_URL in .env to run on seed content.\n");
    process.exit(1);
  }
  try {
    const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: unknown[] };
    const applied = await client
      .query<{ n: number }>("select count(*)::int as n from drizzle.__drizzle_migrations")
      .then((r) => r.rows[0].n)
      .catch(() => 0);
    const pending = journal.entries.length - applied;
    if (pending > 0) console.warn(`db-check: ${pending} migration(s) not applied. Run: npm run db:migrate`);
  } finally {
    await client.end();
  }
}

main();
