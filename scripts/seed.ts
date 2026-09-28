import "dotenv/config";
import { seedDatabase } from "../src/db/seed";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing (point it at the database to seed).");
  await seedDatabase();
  console.log("Seeded.");
}
main();
