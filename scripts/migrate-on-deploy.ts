import { execSync } from "node:child_process";

// Runs before `next build` (see the `build` script). Migrations are opt-in per
// environment: set RUN_MIGRATIONS=true only where the build should update the
// database, normally production. Previews usually share that database, so they
// must not apply unreleased migrations to it.
if (process.env.RUN_MIGRATIONS !== "true") {
  console.log("migrate: RUN_MIGRATIONS is not 'true', skipping.");
} else if (!process.env.DATABASE_URL) {
  console.error("migrate: RUN_MIGRATIONS=true but DATABASE_URL is missing.");
  process.exit(1);
} else {
  execSync("drizzle-kit migrate", { stdio: "inherit" });
}
