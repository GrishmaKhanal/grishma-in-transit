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

test("migrate-on-deploy skips unless RUN_MIGRATIONS=true", () => {
  const r = run("scripts/migrate-on-deploy.ts", { DATABASE_URL: "postgresql://u:p@localhost:1/x" });
  assert.equal(r.code, 0);
  assert.match(r.out, /RUN_MIGRATIONS is not 'true', skipping/);
});

test("migrate-on-deploy fails loudly when asked to migrate without a database", () => {
  const r = run("scripts/migrate-on-deploy.ts", { RUN_MIGRATIONS: "true" });
  assert.equal(r.code, 1);
  assert.match(r.out, /DATABASE_URL is missing/);
});

test("dev-db-check explains an unreachable database and fails", () => {
  const r = run("scripts/dev-db-check.ts", { DATABASE_URL: "postgresql://u:secretpw@localhost:1/x" });
  assert.equal(r.code, 1);
  assert.match(r.out, /can't reach the database/);
  assert.match(r.out, /systemctl start postgresql/);
  assert.doesNotMatch(r.out, /secretpw/, "credentials must not be printed");
});

test("dev-db-check passes with no database configured", () => {
  const r = run("scripts/dev-db-check.ts", {});
  assert.equal(r.code, 0);
});
