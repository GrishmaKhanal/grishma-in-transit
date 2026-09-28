import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { companies, posts, projects, settings } from "../src/db/schema";
import { seedCompanies, seedPosts, seedProjects, seedSettings } from "../src/content/seed";

// Idempotent: settings and posts skip existing keys/slugs; companies and
// projects are only seeded into an empty table.
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing (run `vercel env pull .env`).");
  await db.insert(settings).values({ key: "site", value: seedSettings }).onConflictDoNothing();
  for (const { id: _id, ...p } of seedPosts) await db.insert(posts).values(p).onConflictDoNothing();

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(companies);
  if (n === 0) {
    const idMap = new Map<number, number>();
    for (const { id, ...c } of seedCompanies) {
      const [row] = await db.insert(companies).values(c).returning({ id: companies.id });
      idMap.set(id, row.id);
    }
    for (const { id: _id, companyId, ...p } of seedProjects) {
      await db.insert(projects).values({ ...p, companyId: companyId ? idMap.get(companyId)! : null });
    }
  }
  console.log("Seeded.");
}
main();
