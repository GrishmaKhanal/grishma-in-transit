import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { withVerifiedSsl } from "./url";

// One variable, any host: DATABASE_URL is a plain Postgres connection string.
// Neon URLs use Neon's HTTP driver (no connection pool to exhaust on serverless);
// anything else (local podman, Supabase, RDS, a VPS) uses node-postgres.
const url = process.env.DATABASE_URL;

export const hasDb = Boolean(url);

const isNeon = !url || /\.neon\.tech/.test(url);

type DB = ReturnType<typeof drizzleNeon<typeof schema>>;

export const db: DB = isNeon
  ? drizzleNeon(neon(url || "postgresql://placeholder@localhost/none"), { schema })
  : (drizzlePg(withVerifiedSsl(url!), { schema }) as unknown as DB);

export { schema };
