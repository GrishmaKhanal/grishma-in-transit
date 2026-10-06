import { execSync } from "node:child_process";

// Runs before `next build` (see the `build` script). Migrations are opt-in per
// environment: set RUN_MIGRATIONS=true only where the build should update the
// database, normally production. Previews usually share that database, so they
// must not apply unreleased migrations to it.

// Host (minus Neon's "-pooler" suffix) and database name. Never the credentials.
function target(url: string) {
  try {
    const u = new URL(url);
    return { host: u.hostname.replace("-pooler.", "."), db: u.pathname.replace(/^\//, "") };
  } catch {
    return null;
  }
}

const url = process.env.DATABASE_URL;
const unpooled = process.env.DATABASE_URL_UNPOOLED;

if (process.env.RUN_MIGRATIONS !== "true") {
  console.log("migrate: RUN_MIGRATIONS is not 'true', skipping.");
} else if (!url) {
  console.error("migrate: RUN_MIGRATIONS=true but DATABASE_URL is missing.");
  process.exit(1);
} else {
  // drizzle-kit migrates DATABASE_URL_UNPOOLED when set, while the app reads
  // DATABASE_URL. If they disagree, the app would run against an unmigrated schema.
  const app = target(url);
  const mig = unpooled ? target(unpooled) : app;
  if (!app || !mig) {
    console.error("migrate: DATABASE_URL or DATABASE_URL_UNPOOLED is not a valid URL.");
    process.exit(1);
  }
  const same = app.host === mig.host && app.db === mig.db;
  if (!same && process.env.MIGRATE_ALLOW_DIFFERENT_HOSTS !== "true") {
    console.error(
      `migrate: DATABASE_URL (${app.host}/${app.db}) and DATABASE_URL_UNPOOLED (${mig.host}/${mig.db}) point at different databases. ` +
        "Fix one of them. If your provider really uses different hostnames for pooled and direct connections, set MIGRATE_ALLOW_DIFFERENT_HOSTS=true.",
    );
    process.exit(1);
  }
  console.log(`migrate: target ${mig.host}/${mig.db}`);
  execSync("drizzle-kit migrate", { stdio: "inherit" });
}
