import { test } from "node:test";
import assert from "node:assert/strict";
import { withVerifiedSsl } from "../src/db/url";

const mode = (url: string) => new URL(withVerifiedSsl(url)).searchParams.get("sslmode");

test("remote URLs verify the certificate by default", () => {
  assert.equal(mode("postgresql://u:p@db.example.com/app"), "verify-full");
  assert.equal(mode("postgresql://u:p@ep-x-pooler.eu.aws.neon.tech/app?sslmode=require"), "verify-full");
  assert.equal(mode("postgresql://u:p@db.example.com/app?sslmode=prefer"), "verify-full");
  assert.equal(mode("postgresql://u:p@db.example.com/app?sslmode=verify-ca&application_name=x"), "verify-full");
});

test("local hosts and explicit opt-outs are left alone", () => {
  for (const u of [
    "postgresql://u:p@localhost:5432/app",
    "postgresql://u:p@127.0.0.1/app",
    "postgresql://u:p@db.example.com/app?sslmode=disable",
    "postgresql://u:p@db.example.com/app?sslmode=no-verify",
    "not a url",
  ]) {
    assert.equal(withVerifiedSsl(u), u, u);
  }
});

test("the rest of the URL is preserved", () => {
  const out = new URL(withVerifiedSsl("postgresql://user:pa%40ss@db.example.com:6543/app?application_name=site"));
  assert.equal(out.username, "user");
  assert.equal(out.password, "pa%40ss");
  assert.equal(out.port, "6543");
  assert.equal(out.searchParams.get("application_name"), "site");
});
