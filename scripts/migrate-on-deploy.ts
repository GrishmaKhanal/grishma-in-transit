import { execSync } from "node:child_process";

// Runs before `next build` on Vercel (see the `vercel-build` script).
// Production deploys apply pending migrations. Preview deploys skip them unless
// MIGRATE_PREVIEWS=1, which is only safe when each preview gets its own Neon branch.
const env = process.env.VERCEL_ENV;

if (!process.env.DATABASE_URL) {
  console.log("migrate: no DATABASE_URL, skipping (site will serve seed content).");
} else if (env && env !== "production" && !process.env.MIGRATE_PREVIEWS) {
  console.log(`migrate: VERCEL_ENV=${env}, skipping. Set MIGRATE_PREVIEWS=1 to run on previews.`);
} else {
  execSync("drizzle-kit migrate", { stdio: "inherit" });
}
