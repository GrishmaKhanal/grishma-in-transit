import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCredentials } from "../src/lib/credentials";

const env = { ADMIN_USERNAME: "grishma", ADMIN_PASSWORD: "correct horse battery" };

test("accepts the right username and password", () => {
  assert.equal(checkCredentials("grishma", "correct horse battery", env), true);
});

test("username is case-insensitive and trimmed; password is exact", () => {
  assert.equal(checkCredentials("  Grishma ", "correct horse battery", env), true);
  assert.equal(checkCredentials("grishma", "Correct horse battery", env), false);
  assert.equal(checkCredentials("grishma", " correct horse battery", env), false);
});

test("rejects a wrong username, wrong password, or empty input", () => {
  assert.equal(checkCredentials("admin", "correct horse battery", env), false);
  assert.equal(checkCredentials("grishma", "wrong", env), false);
  assert.equal(checkCredentials("", "", env), false);
  assert.equal(checkCredentials("grishma", "correct horse battery extra", env), false);
});

test("login is disabled unless both env vars are set", () => {
  assert.equal(checkCredentials("grishma", "x", { ADMIN_PASSWORD: "x" }), false);
  assert.equal(checkCredentials("", "x", { ADMIN_USERNAME: "", ADMIN_PASSWORD: "x" }), false);
  assert.equal(checkCredentials("grishma", "", { ADMIN_USERNAME: "grishma", ADMIN_PASSWORD: "" }), false);
  assert.equal(checkCredentials("grishma", "x", {}), false);
});
