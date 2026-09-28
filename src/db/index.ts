import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Vercel's Neon integration injects DATABASE_URL automatically. Any other
// Postgres URL (e.g. the local podman container) uses node-postgres.
const url = process.env.DATABASE_URL;

export const hasDb = Boolean(url);

const isNeon = !url || /\.neon\.tech/.test(url);

type DB = ReturnType<typeof drizzleNeon<typeof schema>>;

export const db: DB = isNeon
  ? drizzleNeon(neon(url ?? "postgresql://placeholder@localhost/none"), { schema })
  : (drizzlePg(url!, { schema }) as unknown as DB);

export { schema };
