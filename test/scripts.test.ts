import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// Run a script with a controlled env (no .env leaking in: dotenv never overrides set vars,
// and an empty DATABASE_URL counts as "set").
function run(script: string, env: Record<string, string>) {
  const r = spawnSync("npx", ["tsx", script], {
    env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "test", DATABASE_URL: "", ...env },
    encoding: "utf8",
  });
  return { code: r.status, out: r.stdout + r.stderr };
}

test("migrate-on-deploy skips without a database", () => {
  const r = run("scripts/migrate-on-deploy.ts", { VERCEL_ENV: "production" });
  assert.equal(r.code, 0);
  assert.match(r.out, /no DATABASE_URL, skipping/);
});

test("migrate-on-deploy skips preview deploys by default", () => {
  const r = run("scripts/migrate-on-deploy.ts", { VERCEL_ENV: "preview", DATABASE_URL: "postgresql://u:p@localhost:1/x" });
  assert.equal(r.code, 0);
  assert.match(r.out, /VERCEL_ENV=preview, skipping/);
});

test("dev-db-check explains an unreachable database and fails", () => {
  const r = run("scripts/dev-db-check.ts", { DATABASE_URL: "postgresql://u:secretpw@localhost:1/x" });
  assert.equal(r.code, 1);
  assert.match(r.out, /can't reach the database/);
  assert.match(r.out, /podman start portfolio-pg/);
  assert.doesNotMatch(r.out, /secretpw/, "credentials must not be printed");
});

test("dev-db-check passes with no database configured", () => {
  const r = run("scripts/dev-db-check.ts", {});
  assert.equal(r.code, 0);
});
