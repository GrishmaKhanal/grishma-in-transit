import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { withVerifiedSsl } from "./src/db/url";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations prefer Neon's direct connection; the pooled one is for the app.
  dbCredentials: { url: withVerifiedSsl((process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)!) },
});
