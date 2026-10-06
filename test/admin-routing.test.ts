import { before, test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { signSession, verifySession } from "../src/lib/session";
import { NextRequest } from "next/server";

// admin-path reads the env at import time, so set it before loading the proxy.
const SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.ADMIN_PATH = "/studio-x9";
process.env.SESSION_SECRET = SECRET;
let proxy: typeof import("../src/proxy").proxy;
let normalizeAdminPath: typeof import("../src/lib/admin-path").normalizeAdminPath;
before(async () => {
  ({ proxy } = await import("../src/proxy"));
  ({ normalizeAdminPath } = await import("../src/lib/admin-path"));
});

const token = (secret = SECRET) => signSession({ SESSION_SECRET: secret });

async function hit(path: string, cookie?: string) {
  const req = new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie: `admin_session=${cookie}` } : {},
  });
  const res = await proxy(req);
  const rewrite = res.headers.get("x-middleware-rewrite");
  return {
    status: res.status,
    rewrite: rewrite && new URL(rewrite).pathname + new URL(rewrite).search,
    location: res.headers.get("location") && new URL(res.headers.get("location")!).pathname,
    passthrough: res.headers.get("x-middleware-next") === "1",
    robots: res.headers.get("x-robots-tag"),
  };
}

test("normalizeAdminPath", () => {
  assert.equal(normalizeAdminPath(undefined), null);
  assert.equal(normalizeAdminPath(""), null);
  assert.equal(normalizeAdminPath("/"), null);
  assert.equal(normalizeAdminPath("studio"), "/studio");
  assert.equal(normalizeAdminPath(" /studio-x9/ "), "/studio-x9");
  assert.equal(normalizeAdminPath("/a/b_c"), "/a/b_c");
  assert.throws(() => normalizeAdminPath("/bad path"));
  assert.throws(() => normalizeAdminPath("/x?y"));
});

test("public pages pass through untouched", async () => {
  for (const p of ["/", "/blog/some-post", "/work"]) {
    const r = await hit(p);
    assert.ok(r.passthrough, p);
    assert.equal(r.robots, null);
  }
});

test("internal /admin 404s, with or without a session", async () => {
  const t = await token();
  for (const p of ["/admin", "/admin/", "/admin/posts", "/admin/posts/1"]) {
    assert.equal((await hit(p)).rewrite, "/__not-found", p);
    assert.equal((await hit(p, t)).rewrite, "/__not-found", `${p} (authed)`);
  }
  // Only the exact segment is internal.
  assert.ok((await hit("/administrator")).passthrough);
});

test("admin root serves the login page without a session", async () => {
  const r = await hit("/studio-x9");
  assert.equal(r.rewrite, "/admin");
  assert.equal(r.robots, "noindex, nofollow");
});

test("admin subpages redirect to login without a valid session", async () => {
  assert.equal((await hit("/studio-x9/posts")).location, "/studio-x9");
  assert.equal((await hit("/studio-x9/posts", "garbage")).location, "/studio-x9");
  assert.equal((await hit("/studio-x9/posts", await token("another-secret-that-is-32-characters-long"))).location, "/studio-x9");
});

test("admin subpages rewrite to the internal route with a session", async () => {
  const t = await token();
  assert.equal((await hit("/studio-x9/posts", t)).rewrite, "/admin/posts");
  assert.equal((await hit("/studio-x9/posts/12?tab=seo", t)).rewrite, "/admin/posts/12?tab=seo");
});

test("paths that merely share the prefix are not admin", async () => {
  assert.ok((await hit("/studio-x9extra")).passthrough);
});

test("encoded, doubled and case-varied spellings of /admin also 404", async () => {
  const t = await token();
  for (const p of ["/%61dmin", "/%61dmin/posts", "/admin%2Fposts", "//admin", "//admin/posts", "/ADMIN", "/Admin/posts"]) {
    assert.equal((await hit(p)).rewrite, "/__not-found", p);
    assert.equal((await hit(p, t)).rewrite, "/__not-found", `${p} (authed)`);
  }
});

test("an encoded spelling of the admin path is still guarded", async () => {
  assert.equal((await hit("/studio-x9/%70osts")).location, "/studio-x9");
  assert.equal((await hit("/studio-x9/%70osts", await token())).rewrite, "/admin/posts");
});

test("malformed escapes don't crash the proxy", async () => {
  assert.ok((await hit("/blog/%E0%A4%A")).passthrough);
});

test("verifySession pins the algorithm, issuer, audience, role and required claims", async () => {
  const env = { SESSION_SECRET: SECRET, ADMIN_PASSWORD: "a-long-enough-password" };
  const key = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${SECRET}\0${env.ADMIN_PASSWORD}`)));
  const base = () => new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuer("site").setAudience("admin").setIssuedAt().setExpirationTime("1h");

  assert.equal(await verifySession(await signSession(env), env), true);
  assert.equal(await verifySession(await base().sign(key), env), true, "hand-built token with every claim");
  assert.equal(await verifySession(await base().setIssuer("other").sign(key), env), false, "issuer");
  assert.equal(await verifySession(await base().setAudience("other").sign(key), env), false, "audience");
  assert.equal(await verifySession(await new SignJWT({ role: "viewer" }).setProtectedHeader({ alg: "HS256" }).setIssuer("site").setAudience("admin").setIssuedAt().setExpirationTime("1h").sign(key), env), false, "role");
  assert.equal(await verifySession(await new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuer("site").setAudience("admin").setExpirationTime("1h").sign(key), env), false, "no iat");
  assert.equal(await verifySession(await new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS512" }).setIssuer("site").setAudience("admin").setIssuedAt().setExpirationTime("1h").sign(new Uint8Array(64).fill(1)), env), false, "algorithm");
  const none = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from('{"role":"admin","iss":"site","aud":"admin"}').toString("base64url")}.`;
  assert.equal(await verifySession(none, env), false, "alg none");
  assert.equal(await verifySession(undefined, env), false);
});

test("changing ADMIN_PASSWORD or a short SESSION_SECRET invalidates sessions", async () => {
  const env = { SESSION_SECRET: SECRET, ADMIN_PASSWORD: "old-password-1234567" };
  const t = await signSession(env);
  assert.equal(await verifySession(t, { ...env, ADMIN_PASSWORD: "new-password-1234567" }), false);
  assert.equal(await verifySession(t, { ...env, SESSION_SECRET: "short" }), false);
});
