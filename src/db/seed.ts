import { sql } from "drizzle-orm";
import { db } from ".";
import { companies, posts, projects, settings } from "./schema";
import { seedCompanies, seedPosts, seedProjects, seedSettings } from "../content/seed";

// Idempotent: settings and posts skip existing keys/slugs; companies and
// projects are only seeded into an empty table. Used by `npm run db:seed` and
// the admin dashboard's "Import starter content" button.
export async function seedDatabase() {
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
}
